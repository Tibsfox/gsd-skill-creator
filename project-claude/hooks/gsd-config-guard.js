#!/usr/bin/env node
// gsd-hook-version: 1.0.0
// GSD Config Guard — PreToolUse hook
// Hard-blocks Write/Edit operations targeting .claude/settings.json.
//
// Why: OWASP config-overwrite attack. An agent that can rewrite its own
// settings.json can neutralize every other permission gate in the harness
// (including this hook itself), so settings.json must be immutable from
// the agent side. Any modification must come from the user directly or
// from a trusted install script (project-claude/install.cjs), which run
// outside the agent tool pipeline and therefore bypass PreToolUse hooks.
//
// Triggers on: Write, Edit, MultiEdit tool calls.
// Action: Block via exit code 2 + stderr (Claude Code's PreToolUse denial
// contract — the stderr text is surfaced to the model as the reason the
// tool call was rejected).
//
// Rationale for a dedicated hook: gsd-prompt-guard.js is an upstream-managed
// artifact installed by gsd-pi and cannot be relied on to protect project-
// specific paths. This hook is tracked in project-claude/hooks/ so the
// protection travels with the repo and passes checkConfigImmutability in
// src/chipset/harness-integrity.ts.

// Normalize a file path and return true if it targets .claude/settings.json.
// Matches both relative form ('.claude/settings.json') and absolute paths
// ending in '/.claude/settings.json', plus the Windows backslash form.
function targetsProtectedConfig(filePath) {
  if (!filePath || typeof filePath !== 'string') return false;
  const normalized = filePath.replace(/\\/g, '/');
  return (
    normalized === '.claude/settings.json' ||
    normalized.endsWith('/.claude/settings.json')
  );
}

let input = '';
const stdinTimeout = setTimeout(() => process.exit(0), 3000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (input += chunk));
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    const data = JSON.parse(input);
    const toolName = data.tool_name;

    // Only care about write-class tools
    if (toolName !== 'Write' && toolName !== 'Edit' && toolName !== 'MultiEdit') {
      process.exit(0);
    }

    const filePath = data.tool_input?.file_path || '';

    if (targetsProtectedConfig(filePath)) {
      process.stderr.write(
        'BLOCKED by gsd-config-guard: .claude/settings.json is immutable from the agent side. ' +
          'This file configures every hook and permission gate in the harness; overwriting it ' +
          'would bypass security controls (OWASP config-overwrite attack). If the user needs to ' +
          'change settings, they must edit the file directly or run a trusted install script.\n',
      );
      process.exit(2);
    }

    process.exit(0);
  } catch {
    // Silent fail — never block tool execution on parse errors
    process.exit(0);
  }
});
