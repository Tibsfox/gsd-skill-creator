#!/usr/bin/env node
// gsd-hook-version: 1.0.0
// SessionEnd hook — OPT-IN, DEFAULT OFF. When enabled, mines the current dev
// session's on-disk streams into memory via `flywheel dev-memory`.
//
// Dev sessions are intentionally NOT routed through the education
// LearningPatternDetector/ObservationEmitter (see docs/dev-session-memory.md);
// this hook drives the dev-domain path instead. Advantage over folding into
// `observe.mjs end`: it also fires when the operator never runs `observe.mjs
// end` (e.g. context death), so session memory is still captured.
//
// Enable via env `SC_DEV_MEMORY_ON_END` OR the `.claude/gsd-skill-creator.json`
// (or `.claude/settings.json`) `gsd-skill-creator.devMemoryOnEnd` flag:
//   off (default) — no-op.
//   dry | 1 | true | on — print candidates to
//                         .planning/sessions/dev-memory-candidates.json (NO corpus write).
//   execute — persist into the memory corpus (`--execute`; MEMORY DIR via
//             SC_DEV_MEMORY_DIR, default the project root).
// Optional: SC_DEV_MEMORY_INCLUDE_CORRECTIONS=1 adds --include-corrections
// (QUARANTINE-gated; off by default per the item-7 no-auto-attribution rule).
//
// Best-effort: any failure is swallowed — this hook NEVER fails session end,
// and it only acts when an observation session is active (current.meta.json).

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

/** Resolve the opt-in mode: env override, then the gsd-skill-creator flag, else 'off'. */
function readMode(repoRoot) {
  const env = String(process.env.SC_DEV_MEMORY_ON_END || '').trim().toLowerCase();
  if (env) return env;
  for (const rel of ['.claude/gsd-skill-creator.json', '.claude/settings.json']) {
    try {
      const j = JSON.parse(fs.readFileSync(path.join(repoRoot, rel), 'utf8'));
      const v = j['gsd-skill-creator'] && j['gsd-skill-creator'].devMemoryOnEnd;
      if (v) return String(v).trim().toLowerCase();
    } catch {
      // ignore missing/unparseable config
    }
  }
  return 'off';
}

function main() {
  let input = '';
  try {
    input = fs.readFileSync(0, 'utf8');
  } catch {
    // no stdin
  }
  let parsed = {};
  try {
    parsed = JSON.parse(input);
  } catch {
    // tolerate absent/invalid hook input
  }
  const repoRoot = parsed.cwd || process.cwd();

  const mode = readMode(repoRoot);
  if (!mode || mode === 'off' || mode === '0' || mode === 'false') return;

  // Only act when an observation session is active (streams exist).
  const sessionsDir = path.join(repoRoot, '.planning', 'sessions');
  if (!fs.existsSync(path.join(sessionsDir, 'current.meta.json'))) return;

  const includeCorrections = /^(1|true|on)$/i.test(
    String(process.env.SC_DEV_MEMORY_INCLUDE_CORRECTIONS || '').trim(),
  );
  const corrFlag = includeCorrections ? ' --include-corrections' : '';

  try {
    if (mode === 'execute') {
      const memDir = String(process.env.SC_DEV_MEMORY_DIR || '').trim();
      const memFlag = memDir ? ` --memory-dir "${memDir}"` : '';
      execSync(`npx skill-creator flywheel dev-memory --execute${corrFlag}${memFlag}`, {
        cwd: repoRoot,
        timeout: 30000,
        stdio: 'ignore',
      });
    } else {
      const out = execSync(`npx skill-creator flywheel dev-memory --json${corrFlag}`, {
        cwd: repoRoot,
        timeout: 30000,
        encoding: 'utf8',
      });
      fs.writeFileSync(path.join(sessionsDir, 'dev-memory-candidates.json'), out);
    }
  } catch {
    // Best-effort — never fail session end.
  }
}

main();
