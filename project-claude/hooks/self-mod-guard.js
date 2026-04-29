#!/usr/bin/env node
// gsd-hook-version: 1.49.585
// Self-Modification Guard — PreToolUse hook
//
// BLOCKS Write/Edit/MultiEdit/Bash operations targeting .claude/skills/,
// .claude/agents/, .claude/hooks/ paths.
//
// Authored 2026-04-28 in v1.49.585 component C01.
// Spec:    .planning/missions/v1-49-585-concerns-cleanup/components/01-self-mod-guard.md
// Contract: .planning/missions/v1-49-585-concerns-cleanup/work/specs/hook-conventions.md
//
// Triggers on: Write | Edit | MultiEdit | Bash tool calls
//
// ALLOW overrides (any one fires → ALLOW):
//   - process.env.SC_SELF_MOD === '1'        (operator-explicit)
//   - process.env.SC_INSTALL_CALLER === 'project-claude' (install.cjs caller)
//   - process.env.npm_lifecycle_event === 'install-project-claude' (npm caller)
//
// Output: stdout JSON.
//   ALLOW: {}
//   BLOCK: {"decision": "block", "reason": "<structured error>"}
// Exit code: always 0 (decision communicated via stdout JSON).

const fs = require('fs');
const path = require('path');

// Module-scope compiled regexes (cached for latency)
const PROTECTED_PATH_RE = /(?:^|\/)\.claude\/(?:skills|agents|hooks)(?:\/|$)/;
const BASH_PROTECTED_TOKEN_RE = /(?:^|[\s'"=])(?:[^\s'"=]*\/)?\.claude\/(?:skills|agents|hooks)\/[^\s'";|&]+/;
const BASH_WRITE_OPERATOR_RE = /(?:^|[\s|&;])(?:>>?|cat\s+<<|tee\b|cp\b|mv\b|sed\s+(?:[^|]*\s+)?-i\b|dd\s+(?:[^|]*\s+)?of=|install\b|rsync\b|truncate\b|chmod\b|chown\b|rm\b)/;

// Spec reference path (cited in structured error)
const SPEC_REF = '.planning/missions/v1-49-585-concerns-cleanup/components/01-self-mod-guard.md';

let input = '';
const stdinTimeout = setTimeout(() => {
  // Stdin never closed — silent ALLOW (default-permissive on malformed input)
  process.stdout.write('{}');
  process.exit(0);
}, 3000);

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    const data = input ? JSON.parse(input) : {};
    const decision = decide(data);
    if (decision.action === 'block') {
      logDecision('block', data, decision);
      process.stdout.write(JSON.stringify({
        decision: 'block',
        reason: decision.reason,
      }));
    } else {
      if (decision.override) {
        logDecision('allow-override', data, decision);
      }
      process.stdout.write('{}');
    }
    process.exit(0);
  } catch {
    // Malformed input — silent ALLOW (never block on bad JSON)
    process.stdout.write('{}');
    process.exit(0);
  }
});

function decide(data) {
  const toolName = data.tool_name || '';
  const toolInput = data.tool_input || {};

  // Out of scope: anything except Write/Edit/MultiEdit/Bash
  if (!['Write', 'Edit', 'MultiEdit', 'Bash'].includes(toolName)) {
    return { action: 'allow' };
  }

  // ALLOW overrides (precedence: explicit env > install caller > npm caller)
  if (process.env.SC_SELF_MOD === '1') {
    return matchesProtected(toolName, toolInput)
      ? { action: 'allow', override: 'SC_SELF_MOD' }
      : { action: 'allow' };
  }
  if (process.env.SC_INSTALL_CALLER === 'project-claude') {
    return matchesProtected(toolName, toolInput)
      ? { action: 'allow', override: 'SC_INSTALL_CALLER' }
      : { action: 'allow' };
  }
  if (process.env.npm_lifecycle_event === 'install-project-claude') {
    return matchesProtected(toolName, toolInput)
      ? { action: 'allow', override: 'npm_lifecycle_event' }
      : { action: 'allow' };
  }

  // BLOCK conditions
  const match = matchesProtected(toolName, toolInput);
  if (!match) {
    return { action: 'allow' };
  }

  const reason = buildBlockReason(toolName, match);
  return {
    action: 'block',
    reason,
    matchedPath: match.path,
    matchedPattern: match.pattern,
  };
}

function matchesProtected(toolName, toolInput) {
  if (toolName === 'Write' || toolName === 'Edit' || toolName === 'MultiEdit') {
    const filePath = toolInput.file_path || toolInput.path || '';
    if (!filePath) return null;
    // Resolve to defend against ../ traversal
    let resolved;
    try {
      resolved = path.resolve(filePath);
    } catch {
      resolved = filePath;
    }
    if (PROTECTED_PATH_RE.test(filePath) || PROTECTED_PATH_RE.test(resolved)) {
      return { kind: 'file', path: filePath, pattern: 'file_path-match' };
    }
    return null;
  }

  if (toolName === 'Bash') {
    const command = toolInput.command || '';
    if (!command) return null;
    if (BASH_PROTECTED_TOKEN_RE.test(command) && BASH_WRITE_OPERATOR_RE.test(command)) {
      // Extract the token that matched for path field
      const tokenMatch = command.match(BASH_PROTECTED_TOKEN_RE);
      const matchedToken = tokenMatch ? tokenMatch[0].trim() : '<bash-redirect>';
      return { kind: 'bash', path: matchedToken, pattern: 'bash-write-to-protected' };
    }
    return null;
  }

  return null;
}

function buildBlockReason(toolName, match) {
  const reasonCategory = 'self-mod';
  const pathExcerpt = match.path.length > 120 ? match.path.slice(0, 120) + '...' : match.path;
  return [
    `[self-mod-guard] BLOCKED: ${toolName} to protected path`,
    `  Path:     ${pathExcerpt}`,
    `  Reason:   ${reasonCategory}`,
    `  Override: SC_SELF_MOD=1 (use only if you understand the implication)`,
    `  See:      ${SPEC_REF}`,
  ].join('\n');
}

function logDecision(decisionType, data, decision) {
  try {
    const logDir = path.join(__dirname, '.log');
    fs.mkdirSync(logDir, { recursive: true });
    const logPath = path.join(logDir, 'self-mod-guard.jsonl');
    const entry = {
      timestamp: new Date().toISOString(),
      hook: 'self-mod-guard',
      decision: decisionType,
      tool: data.tool_name || null,
      path: decision.matchedPath || (data.tool_input && (data.tool_input.file_path || data.tool_input.path)) || null,
      session_id: data.session_id || null,
      override: decision.override || null,
      reason_category: decisionType === 'block' ? 'self-mod' : null,
      match_pattern: decision.matchedPattern || null,
    };
    fs.appendFileSync(logPath, JSON.stringify(entry) + '\n');
  } catch {
    // Never let logging failure break the hook
  }
}
