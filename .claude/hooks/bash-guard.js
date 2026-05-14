#!/usr/bin/env node
/**
 * PreToolUse Hook: Bash Guard
 *
 * Blocks Bash commands that attempt to delete or modify protected system files.
 * Prevents prompt injection attacks from bypassing routing/signal enforcement.
 *
 * Protected paths:
 *   - .claude/.routing-confirmed (routing gate marker)
 *   - .claude/.session-log-pending (session log marker)
 *   - sessions/ (session data)
 *   - knowledge/ (knowledge base)
 *
 * Exit codes:
 *   0 - Allow (command is safe)
 *   2 - Block (dangerous command detected)
 */

const DANGEROUS_PATTERNS = [
  // Direct deletion of marker files
  /\.claude[\\\/]\.routing-confirmed/,
  /\.claude[\\\/]\.session-log-pending/,
  // rm targeting .claude/ directory
  /rm\s+.*\.claude[\\\/]/,
  // rm targeting sessions/ directory
  /rm\s+-\w*\s+.*sessions[\\\/]/,
  // rm targeting knowledge/ directory
  /rm\s+-\w*\s+.*knowledge[\\\/]/,
  // Redirect/truncate marker files
  />\s*\.claude[\\\/]\.routing-confirmed/,
  />\s*\.claude[\\\/]\.session-log-pending/,
  // echo overwrite marker files
  /echo\s+.*>\s*\.claude[\\\/]\.routing-confirmed/,
];

function run(rawInput) {
  try {
    const input = JSON.parse(rawInput);
    if (input.tool_name !== 'Bash') return { exitCode: 0 };

    const command = input.tool_input?.command || '';
    if (!command) return { exitCode: 0 };

    const matched = DANGEROUS_PATTERNS.filter(p => p.test(command));

    if (matched.length > 0) {
      console.error([
        '[BashGuard] BLOCKED: Dangerous command detected.',
        `  Command: ${command}`,
        '',
        'This command targets protected system files (.claude/, sessions/, knowledge/).',
        'Deleting or overwriting these files bypasses routing and signal enforcement.',
        '',
        'If this is intentional, ask the Commander to use Emergency Override.'
      ].join('\n'));
      return { exitCode: 2 };
    }
    return { exitCode: 0 };
  } catch (error) {
    // Non-security hook: allow on error
    console.error(`[BashGuard] Parse error: ${error.message}`);
    return { exitCode: 0 };
  }
}

// stdin entry point
if (require.main === module) {
  let data = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => { if (data.length < 1048576) data += chunk; });
  process.stdin.on('end', () => {
    if (!data || data.trim().length === 0) {
      process.exit(0);
    }
    const result = run(data);
    process.exit(result.exitCode);
  });
}

module.exports = { run };