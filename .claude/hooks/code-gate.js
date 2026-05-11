#!/usr/bin/env node
/**
 * PreToolUse Hook: Code Gate
 *
 * Blocks Write/Edit on project code files before routing is confirmed.
 * Workflow files (sessions/, knowledge/, .claude/) are always allowed.
 *
 * Exit codes:
 *   0 - Allow
 *   2 - Block
 */

const fs = require('fs');
const path = require('path');

function getMarkerPath() {
  const root = process.env.MT_PROJECT_ROOT || process.cwd();
  return path.join(root, '.claude', '.routing-confirmed');
}

function isRouteConfirmed() {
  try { return fs.existsSync(getMarkerPath()); } catch { return false; }
}

const ALLOWED_PREFIXES = [
  'sessions/', 'sessions\\',
  'knowledge/', 'knowledge\\',
  '.claude/', '.claude\\',
];

function isWorkflowFile(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  return ALLOWED_PREFIXES.some(p => normalized.includes('/' + p) || normalized.startsWith(p));
}

function run(rawInput) {
  try {
    const input = JSON.parse(rawInput);
    const toolName = input.tool_name || '';

    if (toolName !== 'Write' && toolName !== 'Edit') return { exitCode: 0 };
    if (isRouteConfirmed()) return { exitCode: 0 };

    const filePath = input.tool_input?.file_path || '';
    if (isWorkflowFile(filePath)) return { exitCode: 0 };

    console.error([
      '[CodeGate] BLOCKED: Write/Edit rejected — routing not confirmed.',
      `File: ${filePath}`,
      '',
      'Route the task first (TASK_ROUTE -> confirm -> create .routing-confirmed)',
      'before editing project code. Workflow files are always allowed.'
    ].join('\n'));
    return { exitCode: 2 };
  } catch (error) {
    console.error(`[CodeGate] Parse error: ${error.message}`);
    return { exitCode: 0 };
  }
}

if (require.main === module) {
  let data = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => { if (data.length < 1048576) data += chunk; });
  process.stdin.on('end', () => { const r = run(data); process.exit(r.exitCode); });
}

module.exports = { run };