#!/usr/bin/env node
/**
 * tools/ci/macos-flip-readiness.mjs — operationalizes the #10463 flip gate.
 *
 * Lesson #10463 (Static-analysis tool authoring; staged CI-lane promotion) says
 * the macOS matrix leg flips from STAGED non-blocking (`continue-on-error`) to
 * LOAD-BEARING only "once N consecutive green pushes of the new leg accumulate —
 * and 'green pushes from the promotion ship itself' do not count as a diversity
 * track record; the data must come from organic development churn across diverse
 * changes" (docs/static-analysis-tool-discipline.md). That gate was prose-only,
 * so it was operator-vigilance-bound (and easy to misjudge: at v1.49.924 all 9
 * macOS greens were docs/CI ships — zero organic churn — yet the run-level
 * conclusion was uniformly `success`). This tool makes the gate DETERMINISTIC
 * and CHECKABLE, in the gate-not-vigilance spirit of #10428 / two-layer-closure.
 *
 * Readiness = the most recent run of `consecutive` distinct ORGANIC-churn commits
 * on the macOS leg were ALL green, and that count >= N. INERT commits (docs /
 * release / CI-config only — they re-run an unchanged test surface) are
 * TRANSPARENT: they neither count toward the streak nor break it. A macOS-leg
 * FAILURE on an organic commit BREAKS the streak (resets the track record).
 *
 * ORGANIC churn = a commit that changed any path the macOS matrix leg actually
 * exercises (the test-bearing roots + the env/config files that govern
 * `npm ci` / `npm run build` / the vitest runs). Everything else is INERT. The
 * predicate is a TIGHT allow-list on purpose: misclassifying inert→organic would
 * flip SOONER on weaker evidence (under-cautious); misclassifying organic→inert
 * only DEFERS the flip (safe). When in doubt, inert.
 *
 * Health is read from the JOB conclusion, never the RUN conclusion — the staged
 * `continue-on-error` keeps a red macOS leg OUT of the run-level conclusion
 * (#10463 empirical masking fact), so `gh run list ... .conclusion` is uniformly
 * `success` and useless for this purpose.
 *
 * This is an ADVISORY readiness reporter, not a ship gate: nothing auto-runs it
 * as a blocker. The exit code is a convenience for `&&` chaining a future flip
 * helper (0=READY) — it does not fail a build (failure-mode-contracts: accessory
 * surface). The actual flip stays a deliberate operator act that ALSO updates
 * tests/integration/ci-matrix-parity.test.ts (the #10461 drift-guard pairing).
 *
 * Usage:
 *   node tools/ci/macos-flip-readiness.mjs                 # live: query gh + local git
 *   node tools/ci/macos-flip-readiness.mjs --json          # machine-readable summary
 *   node tools/ci/macos-flip-readiness.mjs --n=5           # override the track-record bar
 *   node tools/ci/macos-flip-readiness.mjs --limit=50      # scan more recent runs
 *   node tools/ci/macos-flip-readiness.mjs --runs-file=F   # inject runs JSON (tests; no gh/git)
 *   node tools/ci/macos-flip-readiness.mjs --root=DIR      # git root for churn derivation
 *
 * --runs-file JSON: array NEWEST-FIRST of run records. Each record:
 *   { "sha": "<full-or-short>", "macosConclusion": "success"|"failure"|...,
 *     "changedFiles": ["src/x.ts", ...]   // optional; else "churn" or git-derived
 *     "churn": "organic"|"inert"          // optional; overrides changedFiles
 *     "title": "...", "branch": "..." }   // optional; display only
 *
 * Exit codes:
 *   0  READY   — >= N consecutive organic-churn green macOS runs accumulated
 *   1  NOT READY — clean computation, streak < N (or broken by a recent red)
 *   2  INDETERMINATE — gh/git unavailable or no runs to evaluate
 */

import { spawnSync } from 'node:child_process';
import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// ─── the organic-churn predicate (pure) ──────────────────────────────────────

// Test-bearing roots the macOS matrix leg exercises (`npx vitest run`,
// `--config vitest.tools.config.mjs`, `node tools/check-tools-test-coverage.mjs
// --run-node-test`, plus the build prelude). A change under any of these can
// plausibly make macOS diverge from ubuntu.
export const ORGANIC_ROOTS = [
  'src/',
  'tests/',
  '.college/',
  'www/',
  'tools/',
  'scripts/',
];

// Build/test-config files that govern HOW the suite runs — a change here is a
// real cross-platform risk even outside the roots, AND none of these is touched
// by the mechanical release bump (verified against ground truth).
//
// DELIBERATELY EXCLUDED: package.json + package-lock.json. The version bump in
// every chore(release) commit touches BOTH (e.g. v1.49.923 `e9d821911`,
// v1.49.924 `504a2aa77`), so including them would mark every release commit
// "organic" — the exact systematic false-positive the gate exists to prevent
// (the live run at v924 reported a spurious READY 3/3 before this exclusion).
// The cost is a conservative MISS: a rare pure dependency upgrade that touches
// only package*.json is undercounted as inert. That only DEFERS the flip (the
// safe direction per the tight-allow-list bias), so we accept it over a gate
// that flips on release noise. A dep upgrade that also touches src/ is still
// organic via the roots.
export const ORGANIC_FILES = [
  'tsconfig.json',
  'vitest.config.ts',
  'vitest.tools.config.mjs',
];

/**
 * Classify a commit's changed-file list as 'organic' or 'inert'.
 * Empty / missing list → 'inert' (a commit that changed nothing the leg runs).
 */
export function classifyChurn(changedFiles) {
  if (!Array.isArray(changedFiles) || changedFiles.length === 0) return 'inert';
  for (const raw of changedFiles) {
    const f = String(raw).trim();
    if (!f) continue;
    if (ORGANIC_FILES.includes(f)) return 'organic';
    if (ORGANIC_ROOTS.some((root) => f.startsWith(root))) return 'organic';
  }
  return 'inert';
}

// ─── the streak computation (pure) ───────────────────────────────────────────

// A macOS-leg conclusion that counts as a clean green.
const GREEN = new Set(['success']);
// Conclusions where the leg RAN and was not green → BREAK the streak.
const BREAKING = new Set(['failure', 'timed_out', 'cancelled', 'action_required']);
// Every OTHER GitHub conclusion — skipped / neutral / stale / startup_failure /
// in_progress / null / missing — means the leg produced NO test verdict, so it
// is transparent (neither counts nor breaks), exactly like an inert commit.
// Only a real `success` increments the streak, so an unknown/unrun state can
// never ADVANCE the flip — the misclassification bias stays "defer, never advance".

/**
 * @param {Array<{sha:string, macosConclusion:string, churn:'organic'|'inert', title?:string, branch?:string}>} runs
 *        NEWEST-FIRST, already deduped by sha.
 * @param {{n:number}} opts
 * @returns {{ready:boolean, streak:number, n:number, broke:object|null,
 *            windowExhausted:boolean, organicGreens:number, inertSkipped:number, detail:Array}}
 */
export function computeReadiness(runs, { n }) {
  let streak = 0;
  let inertSkipped = 0;
  let broke = null;
  let stopped = false;
  const detail = [];

  for (const r of runs) {
    const churn = r.churn ?? 'inert';
    const concl = r.macosConclusion ?? null;
    if (churn !== 'organic') {
      inertSkipped += 1;
      detail.push({ ...r, counted: false, reason: 'inert (transparent)' });
      continue;
    }
    // organic commit
    if (stopped) {
      detail.push({ ...r, counted: false, reason: 'beyond broken streak' });
      continue;
    }
    if (GREEN.has(concl)) {
      streak += 1;
      detail.push({ ...r, counted: true, reason: `organic green (#${streak})` });
    } else if (BREAKING.has(concl)) {
      broke = { sha: r.sha, macosConclusion: concl, title: r.title };
      stopped = true;
      detail.push({ ...r, counted: false, reason: `organic ${concl} — BREAKS streak` });
    } else {
      // organic commit but leg produced no verdict (skipped/null/in_progress):
      // transparent, do not count, do not break.
      detail.push({ ...r, counted: false, reason: `organic but no verdict (${concl})` });
    }
  }

  const ready = streak >= n;
  return {
    ready,
    streak,
    n,
    broke,
    // The streak ran out of organic greens WITHOUT reaching N and WITHOUT a red:
    // it is bounded by the scanned window, not by a definitive verdict. The caller
    // should disclose this (#10421 no-silent-caps) and hint at a larger window.
    windowExhausted: !ready && broke === null,
    organicGreens: streak,
    inertSkipped,
    detail,
  };
}

// ─── I/O shell (live mode; not unit-tested — covered by --runs-file CLI test) ──

const DEFAULT_REPO = 'Tibsfox/gsd-skill-creator';
const DEFAULT_N = 3; // post-hardening track-record bar; overridable via --n.
const DEFAULT_LIMIT = 30;

function gh(args) {
  const res = spawnSync('gh', args, { encoding: 'utf8' });
  if (res.error) throw new Error(`gh not available: ${res.error.message}`);
  if (res.status !== 0) throw new Error(`gh ${args.join(' ')} failed: ${res.stderr || res.stdout}`);
  return res.stdout;
}

/** Recent ci.yml runs, newest-first. */
function fetchRunRows(repo, limit) {
  const out = gh([
    'run', 'list', '--workflow=ci.yml', '--repo', repo, '--limit', String(limit),
    '--json', 'databaseId,headSha,headBranch,conclusion,displayTitle,createdAt',
  ]);
  return JSON.parse(out);
}

/** macOS-leg job conclusion for one run id (null if no macOS job present). */
function fetchMacosConclusion(runId, repo) {
  const out = gh([
    'run', 'view', String(runId), '--repo', repo, '--json', 'jobs',
    '--jq', '[.jobs[] | select(.name|test("macos")) | .conclusion] | first',
  ]);
  const v = out.trim();
  return v && v !== 'null' ? v : null;
}

/**
 * Throw if git can't run at all on `root` (binary missing, or not a git repo /
 * bad --root). Checked ONCE before the loop so the main() catch maps it to the
 * documented exit 2 (INDETERMINATE) — rather than letting every getChangedFiles
 * call silently return [] → all-inert → a confident-but-wrong NOT READY.
 */
function assertGitRepo(root) {
  const res = spawnSync('git', ['-C', root, 'rev-parse', '--git-dir'], { encoding: 'utf8' });
  if (res.error) throw new Error(`git not available: ${res.error.message}`);
  if (res.status !== 0) {
    throw new Error(`not a git repo (or bad --root ${root}): ${(res.stderr || '').trim()}`);
  }
}

/**
 * Files changed by a commit (local git). Returns [] tolerantly on a PER-SHA
 * issue (unknown sha, merge commit) — only the repo-wide failures asserted by
 * assertGitRepo() are fatal. An empty list classifies inert (safe defer).
 */
function getChangedFiles(sha, root) {
  const res = spawnSync(
    'git',
    ['-C', root, 'show', '--name-only', '--pretty=format:', String(sha)],
    { encoding: 'utf8' },
  );
  if (res.status !== 0) return [];
  return res.stdout.split('\n').map((l) => l.trim()).filter(Boolean);
}

/**
 * Build deduped (by sha, newest-first) run records from live gh + git, short-
 * circuiting once enough organic data exists to decide (N organic greens seen,
 * or an organic break encountered).
 */
function buildLiveRuns({ repo, limit, root, n }) {
  assertGitRepo(root); // fail loud → exit 2, not a silent all-inert NOT READY
  const rows = fetchRunRows(repo, limit);
  const seen = new Set();
  const runs = [];
  let organicGreens = 0;
  for (const row of rows) {
    // Every shipped commit yields TWO ci.yml runs (dev push + main push, same
    // headSha). Dedup by sha, keeping the first-seen (newest by createdAt) row.
    // A cross-run flake on the dropped row would be masked — acceptable for an
    // advisory gate (the detail table is meant to be eyeballed before flipping).
    const sha = row.headSha;
    if (seen.has(sha)) continue;
    seen.add(sha);
    const macosConclusion = fetchMacosConclusion(row.databaseId, repo);
    const churn = classifyChurn(getChangedFiles(sha, root));
    runs.push({
      sha: sha.slice(0, 9),
      macosConclusion,
      churn,
      title: (row.displayTitle || '').slice(0, 60),
      branch: row.headBranch,
    });
    if (churn === 'organic') {
      if (GREEN.has(macosConclusion)) organicGreens += 1;
      else if (BREAKING.has(macosConclusion)) break; // streak broken; no need to look further
    }
    if (organicGreens >= n) break; // already READY; further history irrelevant
  }
  return runs;
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const get = (name, def) => {
    const hit = argv.find((a) => a.startsWith(`--${name}=`));
    return hit ? hit.slice(name.length + 3) : def;
  };
  return {
    json: argv.includes('--json'),
    n: Number(get('n', DEFAULT_N)),
    repo: get('repo', DEFAULT_REPO),
    limit: Number(get('limit', DEFAULT_LIMIT)),
    runsFile: get('runs-file', null),
    root: get('root', process.cwd()),
  };
}

function renderHuman(result, runs) {
  const lines = [];
  lines.push('macOS matrix-leg flip readiness (#10463 staged → load-bearing gate)');
  lines.push('─'.repeat(68));
  for (const d of result.detail) {
    const mark = d.counted ? '✓' : d.reason.includes('BREAKS') ? '✗' : '·';
    const concl = d.macosConclusion ?? 'n/a';
    lines.push(
      `  ${mark} ${(d.sha || '').padEnd(10)} ${String(d.churn).padEnd(8)} ` +
        `${String(concl).padEnd(10)} ${d.reason}`,
    );
  }
  lines.push('─'.repeat(68));
  lines.push(
    `  organic-churn green streak: ${result.streak}/${result.n}` +
      `   (inert skipped: ${result.inertSkipped}; scanned ${result.detail.length} commit(s) in window)`,
  );
  if (result.broke) {
    lines.push(`  streak broken by organic ${result.broke.macosConclusion} at ${result.broke.sha}`);
  }
  if (result.ready) {
    lines.push('');
    lines.push(`  VERDICT: READY ✓ — ${result.streak} consecutive organic-churn green macOS runs.`);
    lines.push('  Safe to flip: delete `continue-on-error` from .github/workflows/ci.yml AND');
    lines.push('  update tests/integration/ci-matrix-parity.test.ts (the #10461 drift-guard).');
  } else {
    const need = Math.max(0, result.n - result.streak);
    lines.push('');
    lines.push(
      `  VERDICT: NOT READY — need ${need} more consecutive organic-churn green macOS push(es).`,
    );
    lines.push('  Docs/release/CI-only ships do NOT count (they re-run an unchanged test surface).');
    if (result.windowExhausted) {
      lines.push('  NOTE: the streak is window-bounded (not broken by a red) — pass a larger');
      lines.push('  --limit to scan further back if older organic greens may exist.');
    }
  }
  return lines.join('\n');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!Number.isInteger(args.n) || args.n < 1) {
    process.stderr.write(`invalid --n (must be a positive integer)\n`);
    return 2;
  }

  let runs;
  try {
    if (args.runsFile) {
      const raw = JSON.parse(readFileSync(args.runsFile, 'utf8'));
      runs = raw.map((r) => ({
        sha: r.sha,
        macosConclusion: r.macosConclusion ?? null,
        churn: r.churn ?? classifyChurn(r.changedFiles),
        title: r.title,
        branch: r.branch,
      }));
    } else {
      runs = buildLiveRuns(args);
    }
  } catch (err) {
    process.stderr.write(`indeterminate: ${err.message}\n`);
    return 2;
  }

  if (!runs || runs.length === 0) {
    process.stderr.write('indeterminate: no ci.yml runs found to evaluate\n');
    return 2;
  }

  const result = computeReadiness(runs, { n: args.n });
  // Disclose the coverage bound (#10421 no-silent-caps): in live mode the window
  // is the --limit gh run rows (deduped to fewer distinct commits); in --runs-file
  // mode the window IS the supplied array.
  result.limit = args.runsFile ? null : args.limit;
  const text = args.json ? JSON.stringify(result, null, 2) : renderHuman(result, runs);
  // Return-and-set-exitCode (no process.exit during a pending write) avoids the
  // pipe-buffer truncation #10420 documents.
  process.stdout.write(text + '\n');
  return result.ready ? 0 : 1;
}

// Only run as a CLI; importing for tests must not execute main(). Compare RESOLVED
// real paths, not raw strings: a naive `import.meta.url === file://${argv[1]}` silently
// fails (→ no-op, exit 0 = READY, inverting the defer-bias) when invoked through a
// symlink or from a path containing spaces (argv[1] is the typed, un-encoded path;
// import.meta.url is the percent-encoded realpath).
let invokedAsCli = false;
try {
  invokedAsCli =
    !!process.argv[1] &&
    realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1]);
} catch {
  invokedAsCli = false;
}
if (invokedAsCli) {
  process.exitCode = main();
}
