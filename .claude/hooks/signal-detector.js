#!/usr/bin/env node
/**
 * PostToolUse Hook: Cross-Group Signal Detector (BLOCKING)
 *
 * After an Agent completes, scan its output for cross-group signals.
 * If found, BLOCK until Claude presents them to the Commander.
 *
 * Exit codes:
 *   0 - No signals found
 *   2 - Signals found, must notify Commander before continuing
 */

const SIGNALS = [
  { keyword: 'TECH_DEBT_FOUND', target: 'DEBT', desc: 'discovered technical debt' },
  { keyword: 'SECURITY_RISK_FOUND', target: 'RISK', desc: 'discovered a security vulnerability' },
  { keyword: 'POST_AUDIT_REQUIRED', target: 'RISK/DEBT', desc: 'skipped audit needs follow-up' },
  { keyword: 'KNOWLEDGE_WORTHY', target: 'KNOWLEDGE', desc: 'output contains reusable knowledge' },
  { keyword: 'RESEARCH_NEEDED', target: 'RESEARCH', desc: 'encountered technical uncertainty' },
];

function run(rawInput) {
  try {
    const input = JSON.parse(rawInput);
    const toolName = input.tool_name || '';
    if (toolName !== 'Agent') return { exitCode: 0 };

    const result = input.tool_output || input.result || '';
    const output = typeof result === 'string' ? result : JSON.stringify(result);

    const found = SIGNALS.filter(s => output.includes(s.keyword));
    if (found.length > 0) {
      const msg = [
        '[SignalDetector] BLOCKED: Cross-group signals detected in Agent output:',
        ...found.map(s => `  - ${s.keyword} -> notify ${s.target} group (${s.desc})`),
        '',
        'You MUST present these to the Commander using CROSS_GROUP_HANDOFF format.',
        'Do NOT silently discard cross-group signals.',
        'This hook will remain blocked until you address the signals.'
      ].join('\n');
      console.error(msg);
      return { exitCode: 2 };
    }
  } catch (error) {
    console.error(`[SignalDetector] Parse error: ${error.message}`);
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