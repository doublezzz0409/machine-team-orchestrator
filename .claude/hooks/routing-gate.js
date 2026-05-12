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

function getProjectRoot() {
  if (process.env.MT_PROJECT_ROOT) {
    return process.env.MT_PROJECT_ROOT;
  }
  return process.cwd();
}

function getMarkerPath() {
  return path.join(getProjectRoot(), '.claude', MARKER_FILE);
}

function isRouteConfirmed() {
  try {
    return fs.existsSync(getMarkerPath());
  } catch {
    return false;
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

    // Check if routing has been confirmed
    if (isRouteConfirmed()) {
      return { exitCode: 0 };
    }

    // BLOCK: Must route first
    const agentType = input.tool_input?.subagent_type || 'unknown';
    const errorMsg = [
      '[RoutingGate] BLOCKED: Agent call rejected — no TASK_ROUTE confirmed.',
      '',
      'You are the Master Orchestrator. You must route tasks before dispatching.',
      '',
      'Required steps:',
      '1. Classify the task -> determine target group (DEFECT/FEATURE/DEBT/RESEARCH/RISK/UNKNOWN)',
      '2. Output TASK_ROUTE format to the Commander',
      '3. Wait for Commander confirmation',
      '4. After confirmation, create the routing marker file:',
      `   ${getMarkerPath()}`,
      '5. Only THEN may you call an Agent',
      '',
      `Attempted agent: ${agentType}`,
      `Marker file: ${getMarkerPath()}`,
      '',
      'This is a system-level enforcement. You cannot skip the routing protocol.'
    ].join('\n');

    console.error(errorMsg);
    return { exitCode: 2 };

  } catch (error) {
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