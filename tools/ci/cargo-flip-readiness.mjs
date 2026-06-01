#!/usr/bin/env node
/**
 * tools/ci/cargo-flip-readiness.mjs — operationalizes the #10463 flip gate for the
 * STAGED cargo CI lane (introduced v1.49.936 / CF4a). Sibling of
 * tools/ci/macos-flip-readiness.mjs; same gate-not-vigilance spirit (#10428 /
 * two-layer-closure), DIFFERENT counting model because the cargo lane de-risks a
 * DIFFERENT failure mode than the macOS leg.
 *
 * WHY A DIFFERENT MODEL THAN macos-flip-readiness.mjs.
 *   The macOS leg's pre-flip risk is CROSS-PLATFORM BEHAVIORAL DIVERGENCE of the TS
 *   test suite: does NEW code behave the same on macOS as on ubuntu? Only churn that
 *   changes the test surface (src/ tests/ ...) is fresh evidence, so a docs/release
 *   commit that re-runs the IDENTICAL TS surface is INERT there.
 *   The cargo lane's pre-flip risk is LANE/ENVIRONMENT RELIABILITY: it is a single
 *   ubuntu job that does a FULL fresh apt-install + `cargo` recompile + test on EVERY
 *   push, regardless of what the commit changed. The danger of flipping it
 *   load-bearing is that a transient infra flake (apt mirror down, toolchain drift,
 *   a webkit2gtk packaging change) red-blocks an UNRELATED TS ship. That risk is
 *   exercised on every full recompile — so a docs-only commit's green cargo run IS
 *   fresh lane-reliability evidence here (the OPPOSITE of the macOS rule). The
 *   content of the TS commit is irrelevant to whether the Rust crate compiles.
 *
 * WHAT COUNTS (the cargo-tuned analog of macOS "organic churn").
 *   A commit's cargo JOB green is TRACKED track-record iff that commit did NOT modify
 *   the cargo lane DEFINITION (i.e. did not touch `.github/workflows/ci.yml`). A
 *   lane-defining / lane-modifying commit's own green is a SELF-TEST of that change,
 *   not independent evidence the FIXED lane is stable — exactly the #10463 rule that
 *   "green pushes from the promotion ship itself do not count." This generalizes
 *   cleanly: the v1.49.936 introduction `ci(cargo)` commit (0cb1dfb65), and the future
 *   flip commit that DELETES `continue-on-error`, both touch ci.yml → both transparent.
 *   Every other push runs the unchanged lane → its cargo conclusion counts.
 *   The predicate is a TIGHT, defer-biased classifier: when in doubt (empty/missing
 *   change list, ci.yml touched), classify UNTRACKED. Misclassifying tracked→untracked
 *   only DEFERS the flip (safe); the reverse would flip on weaker evidence.
 *
 * HEALTH is read from the cargo JOB conclusion, never the RUN conclusion. While the
 *   lane is STAGED (`continue-on-error: true`), a red cargo leg is masked OUT of the
 *   run-level conclusion (#10463 empirical masking fact — proven for the macOS leg at
 *   v1.49.923), so `gh run list ... .conclusion` is uniformly `success` and useless
 *   here. Read the JOB.
 *
 * This is an ADVISORY readiness reporter, not a ship gate: nothing auto-runs it as a
 *   blocker. The exit code is a convenience for `&&`-chaining a flip step (0=READY) —
 *   it does not fail a build (failure-mode-contracts: accessory surface). The actual
 *   flip stays a deliberate operator act that ALSO inverts the STAGED assertion in
 *   tests/integration/ci-matrix-parity.test.ts (the #10461 drift-guard pairing) — a
 *   silent flip fails that test.
 *
 * Usage (mirrors macos-flip-readiness.mjs):
 *   node tools/ci/cargo-flip-readiness.mjs                 # live: query gh + local git
 *   node tools/ci/cargo-flip-readiness.mjs --json          # machine-readable summary
 *   node tools/ci/cargo-flip-readiness.mjs --n=5           # override the track-record bar
 *   node tools/ci/cargo-flip-readiness.mjs --limit=50      # scan more recent runs
 *   node tools/ci/cargo-flip-readiness.mjs --runs-file=F   # inject runs JSON (tests; no gh/git)
 *   node tools/ci/cargo-flip-readiness.mjs --root=DIR      # git root for churn derivation
 *   node tools/ci/cargo-flip-readiness.mjs --ci-file=F     # ci.yml path for flip-state detection
 *
 * --runs-file JSON: array NEWEST-FIRST of run records. Each record:
 *   { "sha": "<full-or-short>", "cargoConclusion": "success"|"failure"|...,
 *     "changedFiles": ["src-tauri/src/x.rs", ...]  // optional; else "churn" or git-derived
 *     "churn": "tracked"|"untracked"               // optional; overrides changedFiles
 *     "title": "...", "branch": "..." }            // optional; display only
 *
 * Exit codes:
 *   0  READY        — >= N consecutive tracked green cargo runs accumulated
 *   1  NOT READY    — clean computation, streak < N (or broken by a recent red)
 *   2  INDETERMINATE — gh/git unavailable or no runs to evaluate
 */

import { spawnSync } from 'node:child_process';
import { readFileSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// ─── the tracked-vs-untracked predicate (pure) ───────────────────────────────

// The ci.yml workflow file IS the cargo lane's definition. A commit that touches it
// MIGHT alter the cargo job (introduce it, change its command/prelude, or flip its
// continue-on-error) — so that commit's cargo green is a self-test of the change,
// not independent track record. Coarse-on-purpose: any ci.yml touch → untracked.
// A ci.yml edit that did NOT touch the cargo job is misclassified untracked, which
// only DEFERS the flip (the safe, tight-allow-list direction). Posix-style path; gh
// + git both report this exact string.
export const CI_WORKFLOW_PATH = '.github/workflows/ci.yml';

/**
 * Classify a commit's changed-file list as 'tracked' (its cargo green is independent
 * track record) or 'untracked' (transparent — a lane-modifying commit's self-test, or
 * an empty/unknown change list). Empty / missing list → 'untracked' (defer-safe: we
 * could not inspect it, so we do not let it advance the flip).
 */
export function classifyCommit(changedFiles) {
  if (!Array.isArray(changedFiles) || changedFiles.length === 0) return 'untracked';
  for (const raw of changedFiles) {
    const f = String(raw).trim();
    if (f === CI_WORKFLOW_PATH) return 'untracked';
  }
  return 'tracked';
}

// ─── flip-state detection (pure) ─────────────────────────────────────────────

// The STAGED cargo job carries a job-level `continue-on-error: true`. The flip
// DELETES that key. Isolate the cargo job block (from its `\n  cargo:\n` header to
// the next top-level 2-space job header, or EOF) and look for the key INSIDE it, so
// (a) a `continue-on-error` elsewhere (e.g. a future step-level one in another job)
// does not read as the cargo lane being staged, and (b) the explanatory COMMENT that
// quotes `continue-on-error` (no colon+true) does not satisfy the match. Mirrors the
// job-isolation the drift-guard test (ci-matrix-parity.test.ts) uses.
const CARGO_HEADER = '\n  cargo:\n';
const CARGO_COE = /\n[ \t]+continue-on-error:[ \t]*true/;

/** Slice the cargo job block out of ci.yml text (header → next 2-space job, or EOF). */
function sliceCargoJob(ciYmlText) {
  const idx = ciYmlText.indexOf(CARGO_HEADER);
  if (idx < 0) return '';
  const after = ciYmlText.slice(idx + 1);
  const nextRel = after.search(/\n {2}[A-Za-z0-9_-]+:\n/);
  return nextRel >= 0 ? after.slice(0, nextRel) : after;
}

/**
 * Classify ci.yml content as 'staged' (cargo lane present AND non-blocking — its
 * job-level `continue-on-error: true` is there), 'flipped' (cargo lane present but
 * the key is gone — load-bearing), or 'unknown' (no cargo job / no ci.yml text to
 * read). Pure: takes the file text (or null/undefined). A tool that kept saying
 * "safe to flip: delete continue-on-error" after the key is already gone would be
 * the stale-guidance failure #10427 warns against — hence the lifecycle read.
 */
export function detectFlipState(ciYmlText) {
  if (typeof ciYmlText !== 'string' || ciYmlText.length === 0) return 'unknown';
  const cargoJob = sliceCargoJob(ciYmlText);
  if (cargoJob.length === 0) return 'unknown'; // no cargo lane in this ci.yml
  return CARGO_COE.test(cargoJob) ? 'staged' : 'flipped';
}

// ─── the streak computation (pure) ───────────────────────────────────────────

// A cargo-leg conclusion that counts as a clean green.
const GREEN = new Set(['success']);
// Conclusions where the leg RAN and was not green → BREAK the streak.
const BREAKING = new Set(['failure', 'timed_out', 'cancelled', 'action_required']);
// Every OTHER GitHub conclusion — skipped / neutral / stale / startup_failure /
// in_progress / null / missing — means the cargo job produced NO verdict, so it is
// transparent (neither counts nor breaks), exactly like an untracked commit. Only a
// real `success` increments the streak, so an unknown/unrun state can never ADVANCE
// the flip — the misclassification bias stays "defer, never advance".

/**
 * @param {Array<{sha:string, cargoConclusion:string, churn:'tracked'|'untracked', title?:string, branch?:string}>} runs
 *        NEWEST-FIRST, already deduped by sha.
 * @param {{n:number}} opts
 * @returns {{ready:boolean, streak:number, n:number, broke:object|null,
 *            windowExhausted:boolean, trackedGreens:number, untrackedSkipped:number, detail:Array}}
 */
export function computeReadiness(runs, { n }) {
  let streak = 0;
  let untrackedSkipped = 0;
  let broke = null;
  let stopped = false;
  const detail = [];

  for (const r of runs) {
    const churn = r.churn ?? 'untracked';
    const concl = r.cargoConclusion ?? null;
    if (churn !== 'tracked') {
      untrackedSkipped += 1;
      detail.push({ ...r, counted: false, reason: 'untracked (transparent — lane-modifying / unknown)' });
      continue;
    }
    // tracked commit (ran the fixed lane)
    if (stopped) {
      detail.push({ ...r, counted: false, reason: 'beyond broken streak' });
      continue;
    }
    if (GREEN.has(concl)) {
      streak += 1;
      detail.push({ ...r, counted: true, reason: `tracked green (#${streak})` });
    } else if (BREAKING.has(concl)) {
      broke = { sha: r.sha, cargoConclusion: concl, title: r.title };
      stopped = true;
      detail.push({ ...r, counted: false, reason: `tracked ${concl} — BREAKS streak` });
    } else {
      // tracked commit but cargo job produced no verdict (skipped/null/in_progress):
      // transparent, do not count, do not break.
      detail.push({ ...r, counted: false, reason: `tracked but no verdict (${concl})` });
    }
  }

  const ready = streak >= n;
  return {
    ready,
    streak,
    n,
    broke,
    // The streak ran out of tracked greens WITHOUT reaching N and WITHOUT a red: it is
    // bounded by the scanned window, not by a definitive verdict. The caller should
    // disclose this (#10421 no-silent-caps) and hint at a larger window.
    windowExhausted: !ready && broke === null,
    trackedGreens: streak,
    untrackedSkipped,
    detail,
  };
}

// ─── I/O shell (live mode; not unit-tested — covered by --runs-file CLI test) ──

const DEFAULT_REPO = 'Tibsfox/gsd-skill-creator';
const DEFAULT_N = 3; // matches the macOS track-record bar; overridable via --n.
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

/** cargo-leg job conclusion for one run id (null if no cargo job present). */
function fetchCargoConclusion(runId, repo) {
  const out = gh([
    'run', 'view', String(runId), '--repo', repo, '--json', 'jobs',
    '--jq', '[.jobs[] | select(.name|test("[Cc]argo")) | .conclusion] | first',
  ]);
  const v = out.trim();
  return v && v !== 'null' ? v : null;
}

/**
 * Throw if git can't run at all on `root` (binary missing, or not a git repo / bad
 * --root). Checked ONCE before the loop so the main() catch maps it to the documented
 * exit 2 (INDETERMINATE) — rather than letting every getChangedFiles call silently
 * return [] → all-untracked → a confident-but-wrong NOT READY.
 */
function assertGitRepo(root) {
  const res = spawnSync('git', ['-C', root, 'rev-parse', '--git-dir'], { encoding: 'utf8' });
  if (res.error) throw new Error(`git not available: ${res.error.message}`);
  if (res.status !== 0) {
    throw new Error(`not a git repo (or bad --root ${root}): ${(res.stderr || '').trim()}`);
  }
}

/**
 * Files changed by a commit (local git). Returns [] tolerantly on a PER-SHA issue
 * (unknown sha, merge commit) — only the repo-wide failures asserted by assertGitRepo()
 * are fatal. An empty list classifies untracked (safe defer).
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
 * Build deduped (by sha, newest-first) run records from live gh + git, short-circuiting
 * once enough tracked data exists to decide (N tracked greens seen, or a tracked break).
 */
function buildLiveRuns({ repo, limit, root, n }) {
  assertGitRepo(root); // fail loud → exit 2, not a silent all-untracked NOT READY
  const rows = fetchRunRows(repo, limit);
  const seen = new Set();
  const runs = [];
  let trackedGreens = 0;
  for (const row of rows) {
    // Every shipped commit yields TWO ci.yml runs (dev push + main push, same headSha).
    // Dedup by sha, keeping the first-seen (newest by createdAt) row. A cross-run flake
    // on the dropped row would be masked — acceptable for an advisory gate (the detail
    // table is meant to be eyeballed before flipping).
    const sha = row.headSha;
    if (seen.has(sha)) continue;
    seen.add(sha);
    const cargoConclusion = fetchCargoConclusion(row.databaseId, repo);
    const churn = classifyCommit(getChangedFiles(sha, root));
    runs.push({
      sha: sha.slice(0, 9),
      cargoConclusion,
      churn,
      title: (row.displayTitle || '').slice(0, 60),
      branch: row.headBranch,
    });
    if (churn === 'tracked') {
      if (GREEN.has(cargoConclusion)) trackedGreens += 1;
      else if (BREAKING.has(cargoConclusion)) break; // streak broken; no need to look further
    }
    if (trackedGreens >= n) break; // already READY; further history irrelevant
  }
  return runs;
}

/** Read ci.yml text for flip-state detection; null if unreadable (→ 'unknown'). */
function readCiYml(root, ciFileOverride) {
  const path = ciFileOverride || join(root, '.github', 'workflows', 'ci.yml');
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return null;
  }
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
    ciFile: get('ci-file', null),
  };
}

function renderHuman(result) {
  const lines = [];
  lines.push('cargo matrix-lane flip readiness (#10463 staged → load-bearing gate)');
  lines.push('─'.repeat(68));
  for (const d of result.detail) {
    const mark = d.counted ? '✓' : d.reason.includes('BREAKS') ? '✗' : '·';
    const concl = d.cargoConclusion ?? 'n/a';
    lines.push(
      `  ${mark} ${(d.sha || '').padEnd(10)} ${String(d.churn).padEnd(9)} ` +
        `${String(concl).padEnd(10)} ${d.reason}`,
    );
  }
  lines.push('─'.repeat(68));
  lines.push(
    `  tracked-green cargo streak: ${result.streak}/${result.n}` +
      `   (untracked skipped: ${result.untrackedSkipped}; scanned ${result.detail.length} commit(s) in window)`,
  );
  if (result.broke) {
    lines.push(`  streak broken by tracked ${result.broke.cargoConclusion} at ${result.broke.sha}`);
  }
  const flipped = result.flipState === 'flipped';
  if (result.ready) {
    lines.push('');
    lines.push(`  VERDICT: READY ✓ — ${result.streak} consecutive tracked-green cargo runs.`);
    if (flipped) {
      lines.push('  The cargo lane is ALREADY load-bearing (the job-level `continue-on-error`');
      lines.push('  is gone); this readout is informational. To REVERT to staged/non-blocking:');
      lines.push('  re-add `continue-on-error: true` to the cargo job in .github/workflows/ci.yml');
      lines.push('  AND re-invert tests/integration/ci-matrix-parity.test.ts.');
    } else {
      lines.push('  Safe to flip: delete `continue-on-error: true` from the cargo job in');
      lines.push('  .github/workflows/ci.yml AND invert the STAGED assertion in');
      lines.push('  tests/integration/ci-matrix-parity.test.ts (the #10463 drift-guard).');
    }
  } else {
    const need = Math.max(0, result.n - result.streak);
    lines.push('');
    lines.push(
      `  VERDICT: NOT READY — need ${need} more consecutive tracked-green cargo push(es).`,
    );
    lines.push('  Commits that modify the cargo lane definition (touch ci.yml) do NOT count');
    lines.push('  (their green is a self-test of the change, not independent track record).');
    if (flipped) {
      lines.push('  NOTE: the cargo lane is ALREADY load-bearing; this streak is informational.');
    }
    if (result.windowExhausted) {
      lines.push('  NOTE: the streak is window-bounded (not broken by a red) — pass a larger');
      lines.push('  --limit to scan further back if older tracked greens may exist.');
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
        cargoConclusion: r.cargoConclusion ?? null,
        churn: r.churn ?? classifyCommit(r.changedFiles),
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
  // Disclose the coverage bound (#10421 no-silent-caps): in live mode the window is the
  // --limit gh run rows (deduped to fewer distinct commits); in --runs-file mode the
  // window IS the supplied array.
  result.limit = args.runsFile ? null : args.limit;
  // Lifecycle: read ci.yml so the guidance is honest pre- vs post-flip.
  result.flipState = detectFlipState(readCiYml(args.root, args.ciFile));
  const text = args.json ? JSON.stringify(result, null, 2) : renderHuman(result);
  // Return-and-set-exitCode (no process.exit during a pending write) avoids the
  // pipe-buffer truncation #10420 documents.
  process.stdout.write(text + '\n');
  return result.ready ? 0 : 1;
}

// Only run as a CLI; importing for tests must not execute main(). Compare RESOLVED real
// paths, not raw strings: a naive `import.meta.url === file://${argv[1]}` silently fails
// (→ no-op, exit 0 = READY, inverting the defer-bias) when invoked through a symlink or
// from a path containing spaces (argv[1] is the typed, un-encoded path; import.meta.url
// is the percent-encoded realpath).
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
