#!/usr/bin/env node
/**
 * PreToolUse Hook: Auditor Isolation
 *
 * Enforces double-blind audit: auditor agents cannot read
 * the other auditor's output files.
 *
 * Exit codes:
 *   0 - Allow
 *   2 - Block
 */

const BLOCKED_MAP = {
  'defect-auditor-a': ['audit-architecture.md'],
  'defect-auditor-b': ['audit-security.md'],
};

function run(rawInput) {
  try {
    const input = JSON.parse(rawInput);
    const toolName = input.tool_name || '';
    if (toolName !== 'Agent') return { exitCode: 0 };

    const agentType = input.tool_input?.subagent_type || '';
    const blocked = BLOCKED_MAP[agentType];
    if (!blocked) return { exitCode: 0 };

    const prompt = input.tool_input?.prompt || '';
    const found = blocked.filter(f => prompt.includes(f));

    if (found.length > 0) {
      console.error([
        `[AuditorIsolation] BLOCKED: "${agentType}" cannot access:`,
        ...found.map(f => `  - ${f} (belongs to the other auditor)`),
        '',
        'Double-blind rule: cross-audit communication goes through',
        'the group orchestrator for de-identified relay only.'
      ].join('\n'));
      return { exitCode: 2 };
    }
  } catch (error) {
    console.error(`[AuditorIsolation] Parse error: ${error.message}`);
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