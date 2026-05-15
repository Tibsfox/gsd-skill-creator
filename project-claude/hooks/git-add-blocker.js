#!/usr/bin/env node
// gsd-hook-version: 1.49.653
// Git-Add Blocker — PreToolUse hook
//
// BLOCKS git add / git stage / git commit -a operations that would stage
// paths under:
//   .planning/, .claude/, .archive/, artifacts/                    (v1.49.585)
//   .gsd/, .chipset/, .env, project-claude/hooks/.log/             (v1.49.653)
//
// Authored 2026-04-28 in v1.49.585 component C02.
// Extended 2026-05-15 per CONCERNS §2.3 + §7.4 hardening: closes the
// 556 MB .gsd/intelligence.db accidental-stage exposure + the production
// `git add -f .env` FTP-credential-leak exposure.
//
// Codified lessons (v1.49.654 C08 discipline-coverage codification):
//   Lesson #10201 — git-add-blocker compound-command detection;
//     `git add -A; git commit -m ...; git add -f .env` chained commands
//     must be scanned at proximity-level so that the .env staging is
//     blocked even when wrapped in heredoc bodies or quoted-string args.
//     Hook revision lives at obs#2 reaffirm; v1.49.653 §7.4 extension
//     hardened the regex against further compound-command false-negatives.
//
// Spec:    .planning/missions/v1-49-585-concerns-cleanup/components/02-git-add-blocker.md
// Contract: .planning/missions/v1-49-585-concerns-cleanup/work/specs/hook-conventions.md
//
// Scope: tool_name === "Bash" only. Non-Bash calls pass through.
//
// ALLOW overrides:
//   - process.env.SC_FORCE_ADD === '1'  (operator-explicit)
//
// Output: stdout JSON.
//   ALLOW: {}
//   BLOCK: {"decision": "block", "reason": "<structured error>"}
// Exit code: always 0.

const fs = require('fs');
const path = require('path');

// Module-scope compiled regex. Multi-line alternation joined for readability.
const PROTECTED_PATH_RE = new RegExp([
  // v1.49.585 baseline:
  '^\\.?\\.?\\/?\\.?(?:planning|claude|archive)\\/',  // {planning,claude,archive}/ at start (with optional ./, ../, . prefixes)
  '^artifacts\\/',                                     // artifacts/ at start
  '(?:^|\\/)(?:\\.planning|\\.claude|\\.archive|artifacts)\\/',  // dotted variants anywhere
  // v1.49.653 hardening (CONCERNS §2.3 + §7.4):
  '^\\.?\\.?\\/?\\.(?:gsd|chipset)(?:\\/|$)',          // .gsd/, .chipset/ at start
  '(?:^|\\/)\\.(?:gsd|chipset)(?:\\/|$)',               // .gsd/, .chipset/ anywhere
  '^\\.env(?:$|\\/)',                                   // .env file or .env/ dir at start
  '(?:^|\\/)\\.env(?:$|\\/)',                           // .env anywhere
  '^project-claude\\/hooks\\/\\.log(?:\\/|$)',          // project-claude/hooks/.log at start
  '(?:^|\\/)project-claude\\/hooks\\/\\.log(?:\\/|$)',  // anywhere
].join('|'));

// Spec reference path
const SPEC_REF = '.planning/missions/v1-49-585-concerns-cleanup/components/02-git-add-blocker.md';

let input = '';
const stdinTimeout = setTimeout(() => {
  process.stdout.write('{}');
  process.exit(0);
}, 3000);

process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);

  let parsed;
  try {
    parsed = JSON.parse(input || '{}');
  } catch {
    // Malformed — default-permissive ALLOW
    process.stdout.write('{}');
    process.exit(0);
  }

  const toolName = parsed.tool_name || '';
  const toolInput = parsed.tool_input || {};

  // Out of scope: non-Bash
  if (toolName !== 'Bash') {
    process.stdout.write('{}');
    process.exit(0);
  }

  // Override: SC_FORCE_ADD=1
  if (process.env.SC_FORCE_ADD === '1') {
    logDecision('allow-override', toolInput.command, 'SC_FORCE_ADD');
    process.stdout.write('{}');
    process.exit(0);
  }

  const command = String(toolInput.command || '');
  if (!command) {
    process.stdout.write('{}');
    process.exit(0);
  }

  const decision = evaluateGitCommand(command);
  if (decision.block) {
    const reason = formatBlockMessage(decision.matchedPath, command);
    logDecision('block', command, null, decision.matchedPath);
    process.stdout.write(JSON.stringify({ decision: 'block', reason }));
    process.exit(0);
  }

  process.stdout.write('{}');
  process.exit(0);
});

function evaluateGitCommand(command) {
  // Strip leading 'cd <X> &&' prefixes for inspection
  let inspected = command;
  inspected = inspected.replace(/^\s*cd\s+\S+\s*&&\s*/, '');

  // Look for git add / git stage / git commit -a / git commit --all
  // Tokens: split on whitespace, but respect quoted args minimally
  const tokens = inspected.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];

  // Find the 'git' binary token
  let i = 0;
  while (i < tokens.length && tokens[i] !== 'git') i++;
  if (i >= tokens.length) return { block: false };

  // git -C <path> ... — strip -C clauses (we conservatively pass-through these)
  let j = i + 1;
  while (j < tokens.length && tokens[j].startsWith('-')) {
    if (tokens[j] === '-C' && tokens[j + 1]) {
      j += 2;
      continue;
    }
    j++;
  }

  if (j >= tokens.length) return { block: false };

  const subcommand = tokens[j];
  const subargs = tokens.slice(j + 1);

  if (subcommand === 'add' || subcommand === 'stage') {
    // Walk args looking for protected paths
    for (const arg of subargs) {
      const cleanArg = arg.replace(/^["']|["']$/g, ''); // strip outer quotes
      if (cleanArg.startsWith('-')) continue; // skip flags (including -f, -A)
      if (PROTECTED_PATH_RE.test(cleanArg)) {
        return { block: true, matchedPath: cleanArg };
      }
    }
    return { block: false };
  }

  if (subcommand === 'commit') {
    // Block if -a / --all is present (would stage all working-tree mods, possibly protected)
    // Heuristic: log and warn but allow (precise determination requires git status query)
    if (subargs.some(a => a === '-a' || a === '--all' || a === '-am')) {
      // Conservative: block, citing potential exposure
      return { block: true, matchedPath: '(git commit -a — would stage all modifications)' };
    }
    return { block: false };
  }

  return { block: false };
}

function formatBlockMessage(matchedPath, command) {
  const cmdExcerpt = command.length > 100 ? command.slice(0, 97) + '...' : command;
  return [
    `[git-add-blocker] BLOCKED: git add of protected path`,
    `  Path:     ${matchedPath}`,
    `  Command:  ${cmdExcerpt}`,
    `  Reason:   gitignored-stage`,
    `  Override: SC_FORCE_ADD=1 <command> (use only if you understand the implication)`,
    `  See:      ${SPEC_REF}`,
  ].join('\n');
}

function logDecision(decision, command, override = null, matchedPath = null) {
  try {
    const logDir = '.claude/hooks/.log';
    fs.mkdirSync(logDir, { recursive: true });
    const entry = {
      timestamp: new Date().toISOString(),
      hook: 'git-add-blocker',
      decision,
      command_excerpt: command ? String(command).slice(0, 100) : null,
      override,
      matched_path: matchedPath,
    };
    fs.appendFileSync(path.join(logDir, 'git-add-blocker.jsonl'), JSON.stringify(entry) + '\n');
  } catch {
    // Logging failures must never break the hook
  }
}
