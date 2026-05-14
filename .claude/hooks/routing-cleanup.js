#!/usr/bin/env node
/**
 * PostToolUse Hook: Routing Cleanup
 *
 * Deletes the routing confirmation marker when a task summary is created.
 * This ensures the next task requires fresh routing.
 *
 * Trigger: When Claude writes/edits a summary.md file (task completion signal)
 * Action: Delete .claude/.routing-confirmed marker file
 *
 * Exit codes:
 *   0 - Always (non-blocking)
 */

const fs = require('fs');
const path = require('path');

function getProjectRoot() {
  if (process.env.MT_PROJECT_ROOT) {
    return process.env.MT_PROJECT_ROOT;
  }
  return process.cwd();
}

function getMarkerPath() {
  return path.join(getProjectRoot(), '.claude', '.routing-confirmed');
}

function cleanupMarker() {
  const markerPath = getMarkerPath();
  try {
    if (fs.existsSync(markerPath)) {
      fs.unlinkSync(markerPath);
      console.error(`[RoutingCleanup] Marker deleted: ${markerPath}`);
    }
    // Also clean up H8 retry counter
    const retriesPath = path.join(getProjectRoot(), '.claude', '.routing-gate-retries');
    if (fs.existsSync(retriesPath)) {
      fs.unlinkSync(retriesPath);
      console.error(`[RoutingCleanup] Retries counter deleted: ${retriesPath}`);
    }
  } catch (error) {
    console.error(`[RoutingCleanup] Cleanup error: ${error.message}`);
  }
}

function run(rawInput) {
  try {
    const input = JSON.parse(rawInput);
    const toolName = input.tool_name || '';
    const filePath = input.tool_input?.file_path || '';

    // Trigger on Write/Edit of summary.md files (task completion signal)
    if ((toolName === 'Write' || toolName === 'Edit') &&
        filePath.includes('summary.md')) {
      cleanupMarker();
    }

  } catch (error) {
    console.error(`[RoutingCleanup] Parse error: ${error.message}`);
  }

  return { exitCode: 0 };
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
    run(data);
    process.exit(0);
  });
}

module.exports = { run };