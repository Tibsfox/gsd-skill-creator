#!/usr/bin/env node
// gsd-hook-version: 1.49.586
// Self-Modification Guard — PreToolUse hook
//
// BLOCKS Write/Edit/MultiEdit/Bash operations targeting .claude/skills/,
// .claude/agents/, .claude/hooks/ paths.
//
// Authored 2026-04-28 in v1.49.585 component C01.
// v1.49.586 T2.1: proximity-aware Bash detection — heredoc bodies + quoted
// strings are filtered before matching, eliminating the false-positive on
// long compound commands documented in CLAUDE.md "Self-mod-guard known caveat".
//
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
const BASH_PROTECTED_TOKEN_RE_G = /(?:^|[\s'"=])(?:[^\s'"=]*\/)?\.claude\/(?:skills|agents|hooks)\/[^\s'";|&]+/g;
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
    // Proximity-aware: only count protected-path tokens that are EXPOSED
    // (not inside a heredoc body, single-quoted string, or double-quoted string).
    const exposedMatches = findExposedProtectedTokens(command);
    if (exposedMatches.length === 0) return null;
    if (!BASH_WRITE_OPERATOR_RE.test(command)) return null;
    const matchedToken = exposedMatches[0].trim();
    return { kind: 'bash', path: matchedToken, pattern: 'bash-write-to-protected' };
  }

  return null;
}

// Build a per-character "exposed" mask for a Bash command, then return
// every BASH_PROTECTED_TOKEN_RE match whose entire span is exposed. A
// character is NOT exposed if it falls inside:
//   - a single-quoted body  '...'
//   - a double-quoted body  "..."
//   - a heredoc body        <<LABEL ... \nLABEL\n
// Backslash-escapes outside quotes consume one trailing char.
function findExposedProtectedTokens(command) {
  const exposed = new Array(command.length).fill(true);
  let i = 0;
  let quote = null; // null | "'" | '"'
  while (i < command.length) {
    const c = command[i];
    if (quote === '"') {
      exposed[i] = false;
      if (c === '\\' && i + 1 < command.length) { exposed[i + 1] = false; i += 2; continue; }
      if (c === '"') { quote = null; i++; continue; }
      i++; continue;
    }
    if (quote === "'") {
      exposed[i] = false;
      if (c === "'") { quote = null; i++; continue; }
      i++; continue;
    }
    // Heredoc start: <<-?\s*['"]?LABEL['"]?
    if (c === '<' && command[i + 1] === '<') {
      let j = i + 2;
      if (command[j] === '-') j++;
      while (command[j] === ' ' || command[j] === '\t') j++;
      let q = null;
      if (command[j] === "'" || command[j] === '"') { q = command[j]; j++; }
      const labelStart = j;
      while (j < command.length && /[A-Za-z0-9_]/.test(command[j])) j++;
      const label = command.slice(labelStart, j);
      if (q && command[j] === q) j++;
      if (label) {
        // Find body close: \nLABEL\n or \nLABEL$
        const tail = command.slice(j);
        const closeRe = new RegExp(`\\n${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\n|$)`);
        const closeMatch = tail.match(closeRe);
        if (closeMatch) {
          // Mark heredoc body as not-exposed: from first '\n' after the
          // <<LABEL header through the closing label.
          const firstNl = command.indexOf('\n', j);
          if (firstNl >= 0) {
            const bodyEnd = j + closeMatch.index;
            for (let k = firstNl + 1; k < bodyEnd && k < command.length; k++) exposed[k] = false;
            i = j + closeMatch.index + closeMatch[0].length;
            continue;
          }
        } else {
          // Unterminated heredoc: defensively mark rest as not-exposed
          for (let k = j; k < command.length; k++) exposed[k] = false;
          break;
        }
      }
      i = j;
      continue;
    }
    if (c === "'" || c === '"') { quote = c; exposed[i] = false; i++; continue; }
    if (c === '\\' && i + 1 < command.length) { i += 2; continue; }
    i++;
  }
  const out = [];
  for (const m of command.matchAll(BASH_PROTECTED_TOKEN_RE_G)) {
    const start = m.index;
    const end = start + m[0].length - 1;
    let allExposed = true;
    for (let k = start; k <= end; k++) {
      if (!exposed[k]) { allExposed = false; break; }
    }
    if (allExposed) out.push(m[0]);
  }
  return out;
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
