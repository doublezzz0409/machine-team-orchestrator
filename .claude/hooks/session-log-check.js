#!/usr/bin/env node
/**
 * PostToolUse Hook: Session Log Check (CONDITIONAL BLOCKING)
 *
 * After an Agent completes, BLOCK until Claude updates SESSION_LOG.
 * Uses a marker file to track pending state — only blocks when log
 * hasn't been updated yet.
 *
 * Flow:
 *   1. Agent completes → create .session-log-pending marker → exit 2 (BLOCK)
 *   2. Claude writes session-log.md → delete marker → exit 0 (ALLOW)
 *   3. Other tool calls while pending → exit 2 (still BLOCKED, remind to update log)
 *   4. No pending marker → exit 0 (no-op)
 *
 * Exit codes:
 *   0 - Allow (log updated, or no pending state)
 *   2 - Block (must update SESSION_LOG first)
 */

const fs = require('fs');
const path = require('path');

const PENDING_MARKER = '.session-log-pending';
const MARKER_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

function getProjectRoot() {
  if (process.env.MT_PROJECT_ROOT) {
    return process.env.MT_PROJECT_ROOT;
  }
  return process.cwd();
}

function getMarkerPath() {
  return path.join(getProjectRoot(), '.claude', PENDING_MARKER);
}

function hasPendingMarker() {
  try {
    const markerPath = getMarkerPath();
    if (!fs.existsSync(markerPath)) return false;
    const content = fs.readFileSync(markerPath, 'utf8').trim();
    const ts = content.split('|')[1];
    if (ts) {
      const age = Date.now() - new Date(ts).getTime();
      if (age > MARKER_EXPIRY_MS) {
        // H6: Don't silently clean up — warn and record LOG_UPDATE_MISSED
        console.error([
          `[SessionLogCheck] WARNING: Session log marker expired (${Math.round(age / 60000)}min).`,
          '',
          'The session log was NOT updated after the last Agent call.',
          'This entry is permanently missing from the log.',
          '',
          'Recording LOG_UPDATE_MISSED signal for post-session audit.',
          'Proceeding without blocking to avoid infinite wait.'
        ].join('\n'));
        deletePendingMarker();
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

function createPendingMarker() {
  try {
    const payload = `pending|${new Date().toISOString()}`;
    fs.writeFileSync(getMarkerPath(), payload, 'utf8');
  } catch (error) {
    console.error(`[SessionLogCheck] Failed to create marker: ${error.message}`);
  }
}

function deletePendingMarker() {
  try {
    if (fs.existsSync(getMarkerPath())) {
      fs.unlinkSync(getMarkerPath());
    }
  } catch (error) {
    console.error(`[SessionLogCheck] Failed to delete marker: ${error.message}`);
  }
}

function isSessionLogUpdate(toolName, filePath) {
  if (toolName !== 'Write' && toolName !== 'Edit') return false;
  if (!filePath) return false;
  const normalized = filePath.replace(/\\/g, '/');
  return normalized.endsWith('session-log.md');
}

function validateLogContent(content) {
  const hasHeader = content.includes('SESSION_LOG');
  const hasDataRow = /\|\s*\d+\s*\|/.test(content);
  return hasHeader && hasDataRow;
}

function run(rawInput) {
  try {
    const input = JSON.parse(rawInput);
    const toolName = input.tool_name || '';
    const filePath = input.tool_input?.file_path || '';

    // Agent just completed — create pending marker and block
    if (toolName === 'Agent') {
      const agentType = input.tool_input?.subagent_type || 'unknown';
      createPendingMarker();
      console.error([
        `[SessionLogCheck] BLOCKED: Agent "${agentType}" completed.`,
        '',
        'You MUST update the SESSION_LOG table before continuing:',
        '  - Timestamp (e.g., T+12min)',
        '  - Event type (TASK_ROUTE / TASK_DISPATCH / CROSS_GROUP_HANDOFF / etc.)',
        '  - Source and target group',
        '  - One-sentence summary',
        '',
        'Write or edit the session-log.md file to unblock.'
      ].join('\n'));
      return { exitCode: 2 };
    }

    // Non-Agent tool call — check pending state
    if (hasPendingMarker()) {
      if (isSessionLogUpdate(toolName, filePath)) {
        // H4: Validate log content, not just file name
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          if (!validateLogContent(content)) {
            console.error([
              '[SessionLogCheck] BLOCKED: Log content invalid.',
              '',
              'Your session-log.md must contain:',
              '  - A "SESSION_LOG" header',
              '  - At least one table row with a sequence number (e.g., | 1 | T+0min | ...)',
              '',
              'Please write a proper session log entry.'
            ].join('\n'));
            return { exitCode: 2 };
          }
        } catch (readErr) {
          console.error(`[SessionLogCheck] Could not read log file: ${readErr.message}`);
        }

        // Log was updated with valid content — clear pending, allow
        deletePendingMarker();
        console.error('[SessionLogCheck] SESSION_LOG updated. Resuming.');
        return { exitCode: 0 };
      }

      // Still pending — block and remind
      console.error([
        '[SessionLogCheck] BLOCKED: SESSION_LOG not yet updated.',
        '',
        'Please update the session-log.md file with the latest event entry.',
        'This hook will unblock automatically when session-log.md is written.'
      ].join('\n'));
      return { exitCode: 2 };
    }

    // No pending marker — nothing to enforce
    return { exitCode: 0 };

  } catch (error) {
    console.error(`[SessionLogCheck] Parse error: ${error.message}`);
  }
  return { exitCode: 0 };
}

if (require.main === module) {
  let data = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => { if (data.length < 1048576) data += chunk; });
  process.stdin.on('end', () => {
    if (!data || data.trim().length === 0) {
      process.exit(0);
    }
    const r = run(data);
    process.exit(r.exitCode);
  });
}

module.exports = { run };