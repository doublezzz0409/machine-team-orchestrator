#!/usr/bin/env node
/**
 * PostToolUse Hook: SOP Enforcement (BLOCKING)
 *
 * After an Agent is dispatched, BLOCK until Claude reads the group SOP.
 *
 * Exit codes:
 *   0 - Agent not in a known group
 *   2 - Must read SOP before continuing
 */

const GROUP_SOP_MAP = {
  'defect': 'groups/defect-fix.md',
  'feature': 'groups/feature-dev.md',
  'debt': 'groups/debt-cleanup.md',
  'research': 'groups/research.md',
  'risk': 'groups/risk-mitigation.md',
  'knowledge': 'groups/knowledge-mgmt.md',
};

function run(rawInput) {
  try {
    const input = JSON.parse(rawInput);
    const toolName = input.tool_name || '';
    if (toolName !== 'Agent') return { exitCode: 0 };

    const agentType = (input.tool_input?.subagent_type || '').toLowerCase();
    const matched = Object.entries(GROUP_SOP_MAP).find(([key]) => agentType.includes(key));

    if (matched) {
      const [group, sopPath] = matched;
      console.error([
        `[SopReminder] BLOCKED: Agent dispatched to "${group}" group.`,
        `SOP file: ${sopPath}`,
        '',
        'You MUST read the SOP file before executing workflow steps.',
        'Follow the SOP strictly. Do NOT skip steps unless Commander authorizes.',
        '',
        'This hook will remain blocked until you read and follow the SOP.'
      ].join('\n'));
      return { exitCode: 2 };
    }
  } catch (error) {
    console.error(`[SopReminder] Parse error: ${error.message}`);
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
