#!/usr/bin/env node
/**
 * PreToolUse Hook: Routing Gate
 *
 * Blocks Agent tool calls unless a TASK_ROUTE has been confirmed.
 * This enforces the Master Orchestrator routing protocol.
 *
 * How it works:
 *   1. Claude outputs TASK_ROUTE -> user confirms -> Claude writes a marker file
 *   2. Claude tries to call Agent -> this hook checks for the marker file
 *   3. No marker -> exit 2 (BLOCK) -> Claude must route first
 *   4. Marker exists -> exit 0 (ALLOW) -> Agent proceeds
 *   5. After task completes -> PostToolUse hook deletes the marker
 *
 * Marker file: .claude/.routing-confirmed (in project root)
 *
 * Exit codes:
 *   0 - Allow (routing confirmed)
 *   2 - Block (must route first)
 */

const fs = require('fs');
const path = require('path');

const MARKER_FILE = '.routing-confirmed';
const RETRIES_FILE = '.routing-gate-retries';
const MARKER_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours
const MAX_RETRIES = 3;

const GROUP_AGENT_MAP = {
  'defect': 'DEFECT',
  'feature': 'FEATURE',
  'debt': 'DEBT',
  'research': 'RESEARCH',
  'risk': 'RISK',
  'knowledge': 'KNOWLEDGE',
};

function getProjectRoot() {
  if (process.env.MT_PROJECT_ROOT) {
    return process.env.MT_PROJECT_ROOT;
  }
  return process.cwd();
}

function getMarkerPath() {
  return path.join(getProjectRoot(), '.claude', MARKER_FILE);
}

function getRetriesPath() {
  return path.join(getProjectRoot(), '.claude', RETRIES_FILE);
}

// H8: Retry counter — track consecutive blocks to detect loops
function getRetryCount() {
  try {
    const retriesPath = getRetriesPath();
    if (!fs.existsSync(retriesPath)) return 0;
    const data = JSON.parse(fs.readFileSync(retriesPath, 'utf8'));
    // Reset if older than 10 minutes (stale counter)
    if (Date.now() - (data.ts || 0) > 10 * 60 * 1000) {
      resetRetryCount();
      return 0;
    }
    return data.count || 0;
  } catch {
    return 0;
  }
}

function incrementRetryCount() {
  try {
    const retriesPath = getRetriesPath();
    const current = getRetryCount();
    fs.writeFileSync(retriesPath, JSON.stringify({
      count: current + 1,
      ts: Date.now()
    }), 'utf8');
    return current + 1;
  } catch {
    return 1;
  }
}

function resetRetryCount() {
  try {
    const retriesPath = getRetriesPath();
    if (fs.existsSync(retriesPath)) fs.unlinkSync(retriesPath);
  } catch {}
}

function getAgentGroup(agentType) {
  const lower = (agentType || '').toLowerCase();
  for (const [prefix, group] of Object.entries(GROUP_AGENT_MAP)) {
    if (lower.includes(prefix)) return group;
  }
  return null;
}

function isRouteConfirmed() {
  try {
    const markerPath = getMarkerPath();
    if (!fs.existsSync(markerPath)) return { confirmed: false };

    const content = fs.readFileSync(markerPath, 'utf8').trim();

    // H9: Integrity check — empty or whitespace-only file is corrupted
    if (content.length === 0) {
      console.error('[RoutingGate] H9: Marker file is empty (corrupted). Deleting.');
      try { fs.unlinkSync(markerPath); } catch {}
      return { confirmed: false, reason: 'corrupted' };
    }

    const lines = content.split('\n');

    // Backward compatible: plain "confirmed" still works
    if (content === 'confirmed') return { confirmed: true };

    // New format: timestamp\ntarget_group|task_summary
    const ts = parseInt(lines[0], 10);

    // H9: Integrity check — first line must be a valid timestamp (digits only)
    if (isNaN(ts)) {
      console.error(`[RoutingGate] H9: Marker first line is not a valid timestamp: "${lines[0]}". Deleting.`);
      try { fs.unlinkSync(markerPath); } catch {}
      return { confirmed: false, reason: 'corrupted' };
    }

    // H9: Integrity check — timestamp must be reasonable (within last 7 days, not in the future)
    const age = Date.now() - ts;
    if (age < 0 || age > 7 * 24 * 60 * 60 * 1000) {
      console.error(`[RoutingGate] H9: Marker timestamp out of range (age: ${Math.round(age / 3600000)}h). Deleting.`);
      try { fs.unlinkSync(markerPath); } catch {}
      return { confirmed: false, reason: 'corrupted' };
    }

    // Check expiry (2 hours)
    if (age > MARKER_EXPIRY_MS) {
      try { fs.unlinkSync(markerPath); } catch {}
      return { confirmed: false, reason: 'expired' };
    }

    // H9: Integrity check — second line must exist and contain group name
    if (lines.length < 2 || !lines[1] || lines[1].trim().length === 0) {
      console.error('[RoutingGate] H9: Marker missing group line. Deleting.');
      try { fs.unlinkSync(markerPath); } catch {}
      return { confirmed: false, reason: 'corrupted' };
    }

    // Parse group from second line
    const groupLine = lines[1] || '';
    const savedGroup = groupLine.split('|')[0] || '';

    // H9: Integrity check — group must be a known group ID
    const validGroups = Object.values(GROUP_AGENT_MAP);
    if (savedGroup && !validGroups.includes(savedGroup.trim())) {
      console.error(`[RoutingGate] H9: Unknown group "${savedGroup.trim()}". Valid: ${validGroups.join(', ')}. Deleting.`);
      try { fs.unlinkSync(markerPath); } catch {}
      return { confirmed: false, reason: 'corrupted' };
    }

    return { confirmed: true, savedGroup: savedGroup.trim() };
  } catch (error) {
    // H9/H5: Any unexpected error = treat as corrupted, block (exitCode 2 in caller)
    console.error(`[RoutingGate] H9: Marker read error: ${error.message}. Treating as corrupted.`);
    try { fs.unlinkSync(getMarkerPath()); } catch {}
    return { confirmed: false, reason: 'corrupted' };
  }
}

function run(rawInput) {
  try {
    const input = JSON.parse(rawInput);
    const toolName = input.tool_name || '';

    // Only gate the Agent tool
    if (toolName !== 'Agent') {
      return { exitCode: 0 };
    }

    const agentType = input.tool_input?.subagent_type || 'unknown';

    // Check if routing has been confirmed
    const result = isRouteConfirmed();
    if (result.confirmed) {
      // H1: Validate target group matches the agent being called
      if (result.savedGroup) {
        const expectedGroup = getAgentGroup(agentType);
        if (expectedGroup && result.savedGroup !== expectedGroup) {
          console.error([
            `[RoutingGate] BLOCKED: Group mismatch.`,
            `  Marker target: ${result.savedGroup}`,
            `  Agent expects: ${expectedGroup} (from ${agentType})`,
            '',
            'The routing marker targets a different group than the agent you are calling.',
            'Re-route the task or call the correct agent.'
          ].join('\n'));
          return { exitCode: 2 };
        }
      }
      // Routing succeeded — reset retry counter
      resetRetryCount();
      return { exitCode: 0 };
    }

    // H8: Increment retry counter and check for loop
    const retryCount = incrementRetryCount();

    // BLOCK: Must route first
    const blockReason = result.reason === 'expired'
      ? 'Routing marker expired (2h limit).'
      : result.reason === 'corrupted'
        ? 'Routing marker was corrupted and has been deleted.'
        : 'No TASK_ROUTE confirmed.';

    // H8: After MAX_RETRIES, output emergency diagnostic instead of normal instructions
    if (retryCount > MAX_RETRIES) {
      console.error([
        `[RoutingGate] EMERGENCY: Blocked ${retryCount} times — possible loop detected.`,
        '',
        `Reason: ${blockReason}`,
        `Marker file: ${getMarkerPath()}`,
        `Retries file: ${getRetriesPath()}`,
        '',
        'Possible causes:',
        '  1. Marker file creation is failing (disk full, permissions, path error)',
        '  2. Marker file is being deleted immediately after creation',
        '  3. Claude is not following the routing protocol',
        '',
        'Manual intervention:',
        `  - Check if marker file exists: ${getMarkerPath()}`,
        '  - Check disk space and file permissions',
        `  - Delete retries file to reset: ${getRetriesPath()}`,
        '  - Ask the Commander to manually create the marker or override routing',
        '',
        'Cannot proceed without routing confirmation.'
      ].join('\n'));
      return { exitCode: 2 };
    }

    const errorMsg = [
      `[RoutingGate] BLOCKED: Agent call rejected — ${blockReason}`,
      '',
      'You are the Master Orchestrator. You must route tasks before dispatching.',
      '',
      'Required steps:',
      '1. Classify the task -> determine target group (DEFECT/FEATURE/DEBT/RESEARCH/RISK/UNKNOWN)',
      '2. Output TASK_ROUTE format to the Commander',
      '3. Wait for Commander confirmation',
      '4. After confirmation, create the routing marker file with structured content:',
      `   File: ${getMarkerPath()}`,
      '   Format: Write TWO lines:',
      '     Line 1: timestamp (use Date.now())',
      '     Line 2: target_group|task_summary',
      '   Example:',
      `     ${Date.now()}`,
      '     DEFECT|Fix text_to_letter mapping bug',
      '5. Only THEN may you call an Agent',
      '',
      `Attempted agent: ${agentType}`,
      `Marker file: ${getMarkerPath()}`,
      `Retry: ${retryCount}/${MAX_RETRIES}`,
      '',
      'This is a system-level enforcement. You cannot skip the routing protocol.'
    ].join('\n');

    console.error(errorMsg);
    return { exitCode: 2 };

  } catch (error) {
    // H5: Security-critical hook — block on error, don't allow
    console.error(`[RoutingGate] Parse error: ${error.message}`);
    return { exitCode: 2 };
  }
}

// stdin entry point
if (require.main === module) {
  let data = '';
  process.stdin.setEncoding('utf8');

  process.stdin.on('data', chunk => {
    if (data.length < 1024 * 1024) {
      data += chunk;
    }
  });

  process.stdin.on('end', () => {
    if (!data || data.trim().length === 0) {
      process.exit(0);
    }
    const result = run(data);
    process.exit(result.exitCode);
  });
}

module.exports = { run };