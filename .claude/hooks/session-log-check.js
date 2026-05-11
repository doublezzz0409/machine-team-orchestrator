#!/usr/bin/env node
/**
 * PostToolUse Hook: Session Log Check (BLOCKING)
 *
 * After an Agent completes, BLOCK until Claude updates SESSION_LOG.
 *
 * Exit codes:
 *   2 - Always (must update log before continuing)
 */

function run(rawInput) {
  try {
    const input = JSON.parse(rawInput);
    const toolName = input.tool_name || '';
    if (toolName !== 'Agent') return { exitCode: 0 };

    const agentType = input.tool_input?.subagent_type || 'unknown';
    console.error([
      `[SessionLogCheck] BLOCKED: Agent "${agentType}" completed.`,
      '',
      'You MUST update the SESSION_LOG table before continuing:',
      '  - Timestamp (e.g., T+12min)',
      '  - Event type (TASK_ROUTE / TASK_DISPATCH / CROSS_GROUP_HANDOFF / etc.)',
      '  - Source and target group',
      '  - One-sentence summary',
      '',
      'This hook will remain blocked until you update the log.'
    ].join('\n'));
    return { exitCode: 2 };
  } catch (error) {
    console.error(`[SessionLogCheck] Parse error: ${error.message}`);
  }
  return { exitCode: 0 };
}

if (require.main === module) {
  let data = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => { if (data.length < 1048576) data += chunk; });
  process.stdin.on('end', () => { const r = run(data); process.exit(r.exitCode); });
}

module.exports = { run };