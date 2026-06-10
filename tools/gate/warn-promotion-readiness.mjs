#!/usr/bin/env node
/**
 * tools/gate/warn-promotion-readiness.mjs — auditable K-record + revert guard for
 * the three WARN→BLOCK promotions shipping in v1.49.1029 (audit §10 ship 3):
 *
 *   step 20  adoption-freshness  (v1.49.965, was WARN-only until this ship)
 *   step 21  trip-vocab          (v1.49.983, was WARN-only until this ship)
 *   step P   adversarial ship review (v1.49.968 ADVISORY → REQUIRED this ship)
 *
 * Mirrors tools/ci/windows-flip-readiness.mjs: pure-core functions over injectable
 * inputs + an I/O shell with realpath CLI-detection guard and return-exitCode-from-
 * main (no process.exit during pending writes — avoids the pipe-buffer truncation
 * #10420 documents).
 *
 * Lifecycle awareness (#10427 stale-guidance guard): a pure function over injected
 * file text detects already-promoted state by grepping tools/pre-tag-gate.sh for
 * machine-readable PROMOTION-MARKER comments (added by component B of this ship)
 * and docs/T14-SHIP-SEQUENCE.md for "REQUIRED as of v" on the step P line.
 * Post-promotion the verdict text flips to "already promoted — streak is
 * informational; to REVERT: <step-specific instructions>". Tests inject fixture
 * text for both states — never the live file.
 *
 * #10421 no-silent-caps: when a step is INDETERMINATE (inputs unavailable), this
 * is disclosed explicitly; the tool does NOT guess or silently return a spurious
 * NOT READY. A broken/absent input is deferred (exit 2), not treated as a verdict.
 *
 * Defer-bias across all three evidence models:
 *   - adoption-freshness: a gap in the filename sequence breaks the tail; only a
 *     CONFIRMED consecutive run from the max version is READY.
 *   - trip-vocab: tool exit-2 pages are transparent (don't count, don't break);
 *     only real PASS increments, real TRIP-RISK (exit 1) breaks the tail.
 *   - ship-review: counts only committed dirs that DISTINCTLY match the pattern;
 *     absent www/ → INDETERMINATE (disclosed), not NOT READY.
 *
 * Usage:
 *   node tools/gate/warn-promotion-readiness.mjs
 *   node tools/gate/warn-promotion-readiness.mjs --step adoption-freshness
 *   node tools/gate/warn-promotion-readiness.mjs --step trip-vocab
 *   node tools/gate/warn-promotion-readiness.mjs --step ship-review
 *   node tools/gate/warn-promotion-readiness.mjs --step all  (default)
 *   node tools/gate/warn-promotion-readiness.mjs --n=30
 *   node tools/gate/warn-promotion-readiness.mjs --json
 *   node tools/gate/warn-promotion-readiness.mjs --root=DIR
 *
 * Fixture-injection flags (for deterministic headless tests — no network, no real
 * page sweep, no live gate file reads):
 *   --baseline-versions-file=F   JSON array of version strings (e.g. ["965","966"])
 *                                or filenames (e.g. ["ADOPTION-BASELINE-v1.49.965.json"])
 *   --sweep-file=F               JSON array of {degree, exit} records (newest-first)
 *                                  { "degree": "1.217", "exit": 0 }  → PASS
 *                                  { "degree": "1.216", "exit": 1 }  → TRIP-RISK
 *                                  { "degree": "1.215", "exit": 2 }  → transparent
 *   --notes-dirs-file=F          JSON array of release-notes dir names to scan
 *                                (e.g. ["v1.49.968", "v1.49.969"]) — each treated
 *                                as a directory whose name alone is matched (the
 *                                text-match is stubbed to 'true' for all listed dirs)
 *   --gate-text-file=F           pre-tag-gate.sh text for promotion-marker detection
 *   --t14-text-file=F            T14-SHIP-SEQUENCE.md text for step-P marker detection
 *
 * Exit codes:
 *   0  READY         — all requested steps cleared K
 *   1  NOT READY     — at least one requested step has streak < K
 *   2  INDETERMINATE — inputs unavailable for at least one requested step
 */

import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, realpathSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// ─── adoption-freshness evidence model (pure) ─────────────────────────────────

/**
 * Parse a version number from an adoption baseline filename or bare version string.
 * Returns null if the string does not look like a valid version.
 *
 * Accepts:
 *   "ADOPTION-BASELINE-v1.49.965.json"  → 965
 *   "v1.49.965.json"                    → 965
 *   "965"                               → 965
 *   965 (number)                        → 965
 */
export function parseBaselineVersion(s) {
  if (typeof s === 'number' && Number.isFinite(s) && s >= 0) return s;
  const str = String(s);
  // Match v1.49.NNN or just NNN (bare version)
  const m = str.match(/(?:v1\.49\.)?(\d+)/);
  if (!m) return null;
  return Number(m[1]);
}

/**
 * Compute the longest consecutive tail ending at maxVersion.
 * Versions is an array of integers (may be unsorted, may have gaps).
 * Returns { tail, maxVersion, sorted } where tail is the length of the run
 * from maxVersion downward with no gaps.
 *
 * Edge cases:
 *   [] → { tail: 0, maxVersion: null }
 *   [965] → { tail: 1, maxVersion: 965 }
 *   [965, 967] (gap at 966) → { tail: 1, maxVersion: 967 }
 *   [965, 966, 967] → { tail: 3, maxVersion: 967 }
 */
export function computeAdoptionTail(versions) {
  if (!Array.isArray(versions) || versions.length === 0) {
    return { tail: 0, maxVersion: null, sorted: [] };
  }
  const sorted = [...new Set(versions)].sort((a, b) => a - b);
  const maxVersion = sorted[sorted.length - 1];
  let tail = 1;
  for (let i = sorted.length - 2; i >= 0; i--) {
    if (sorted[i] === sorted[i + 1] - 1) {
      tail++;
    } else {
      break; // gap in the tail — stop here
    }
  }
  return { tail, maxVersion, sorted };
}

/**
 * Collect adoption-baseline versions from a list of filenames/version strings.
 * Returns array of integers.
 */
export function parseBaselineVersions(items) {
  const versions = [];
  for (const item of items) {
    const v = parseBaselineVersion(item);
    if (v !== null) versions.push(v);
  }
  return versions;
}

/**
 * Scan a directory for ADOPTION-BASELINE-v*.json files and return the version ints.
 * Returns [] if the directory cannot be read.
 */
export function scanBaselineFiles(docsDir) {
  try {
    const entries = readdirSync(docsDir);
    return parseBaselineVersions(
      entries.filter((e) => e.startsWith('ADOPTION-BASELINE-v') && e.endsWith('.json')),
    );
  } catch {
    return [];
  }
}

// ─── promotion-marker detection (pure) ────────────────────────────────────────

// Machine-readable markers that component B inserts when a step is promoted.
// Grep these in the injected file text (never the live file in tests).
const MARKER_PATTERNS = {
  'adoption-freshness':
    /PROMOTION-MARKER:\s*adoption-freshness\s+default-BLOCK\s+since\s+v/i,
  'trip-vocab':
    /PROMOTION-MARKER:\s*trip-vocab\s+default-BLOCK\s+since\s+v/i,
};

// step P lives in T14-SHIP-SEQUENCE.md — "REQUIRED as of v"
const STEP_P_MARKER = /REQUIRED\s+as\s+of\s+v/i;

/**
 * Detect whether a gate step is already promoted by scanning injected file text.
 * @param {'adoption-freshness'|'trip-vocab'|'ship-review'} step
 * @param {string|null} gateText    pre-tag-gate.sh content (or null)
 * @param {string|null} t14Text     T14-SHIP-SEQUENCE.md content (or null)
 * @returns {'promoted'|'staged'|'unknown'}
 */
export function detectPromotionState(step, gateText, t14Text) {
  if (step === 'ship-review') {
    if (typeof t14Text !== 'string' || t14Text.length === 0) return 'unknown';
    return STEP_P_MARKER.test(t14Text) ? 'promoted' : 'staged';
  }
  if (!MARKER_PATTERNS[step]) return 'unknown';
  if (typeof gateText !== 'string' || gateText.length === 0) return 'unknown';
  return MARKER_PATTERNS[step].test(gateText) ? 'promoted' : 'staged';
}

// ─── trip-vocab sweep evidence model (pure computation over injected sweep data) ─

/**
 * Compute trip-vocab tail from an injected sweep array.
 * Each record: { degree: string, exit: 0|1|2 }
 *   exit 0 = PASS    → counts toward streak
 *   exit 1 = TRIP    → breaks the streak (stops walk)
 *   exit 2 = ERROR   → transparent (defer-bias: neither counts nor breaks)
 *
 * Array is NEWEST-FIRST (descending by degree).
 *
 * Returns { tail, tripAt, transparentCount, detail }
 *   tail            — consecutive PASS count from the newest degree
 *   tripAt          — degree string where a TRIP-RISK broke the tail, or null
 *   transparentCount — count of exit-2 pages skipped
 *   detail          — per-record log array
 */
export function computeTripVocabTail(sweepRecords) {
  let tail = 0;
  let tripAt = null;
  let transparentCount = 0;
  const detail = [];
  let stopped = false;

  for (const r of sweepRecords) {
    if (stopped) {
      detail.push({ ...r, counted: false, reason: 'beyond broken tail' });
      continue;
    }
    if (r.exit === 0) {
      tail++;
      detail.push({ ...r, counted: true, reason: `PASS (#${tail})` });
    } else if (r.exit === 1) {
      tripAt = r.degree;
      stopped = true;
      detail.push({ ...r, counted: false, reason: 'TRIP-RISK — breaks tail' });
    } else {
      // exit 2 (tool error) — transparent, defer-bias
      transparentCount++;
      detail.push({ ...r, counted: false, reason: 'tool-error (transparent)' });
    }
  }

  return { tail, tripAt, transparentCount, detail };
}

// ─── ship-review evidence model (pure computation over injected dirs+content) ──

const SHIP_REVIEW_PATTERN =
  /step P|adversarial[ -]?ship[ -]?review|adversarial review/i;

/**
 * Count distinct release-note dirs (v1.49.N where N >= 968) whose files match
 * the ship-review pattern.
 *
 * @param {Array<{name:string, matched:boolean}>} dirRecords
 *   Each record: name = dir basename (e.g. "v1.49.968"), matched = whether any
 *   file in that dir matches the pattern (injected for tests; live code reads disk).
 * @returns {{ count, dirNames }}
 */
export function computeShipReviewCount(dirRecords) {
  let count = 0;
  const dirNames = [];
  for (const r of dirRecords) {
    const m = r.name.match(/^v1\.49\.(\d+)$/);
    if (!m) continue;
    if (Number(m[1]) < 968) continue;
    if (r.matched) {
      count++;
      dirNames.push(r.name);
    }
  }
  return { count, dirNames };
}

/**
 * Scan docs/release-notes/ for matching dirs. Returns array of
 * {name, matched} records for computeShipReviewCount.
 */
export function scanReleaseNoteDirs(releaseNotesDir) {
  let entries;
  try {
    entries = readdirSync(releaseNotesDir);
  } catch {
    return [];
  }
  const records = [];
  for (const name of entries) {
    const m = name.match(/^v1\.49\.(\d+)$/);
    if (!m || Number(m[1]) < 968) continue;
    const full = join(releaseNotesDir, name);
    const matched = dirContainsMatch(full, SHIP_REVIEW_PATTERN);
    records.push({ name, matched });
  }
  return records;
}

/** Recursively check if any file in dir matches pattern. */
function dirContainsMatch(dir, pattern) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return false;
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (dirContainsMatch(p, pattern)) return true;
    } else {
      try {
        if (pattern.test(readFileSync(p, 'utf8'))) return true;
      } catch {
        // unreadable file — skip (defer-bias)
      }
    }
  }
  return false;
}

// ─── I/O shell ────────────────────────────────────────────────────────────────

const DEFAULT_K = 30;
const DEFAULT_STEP = 'all';

function parseArgs(argv) {
  const get = (name, def) => {
    const hit = argv.find((a) => a.startsWith(`--${name}=`));
    return hit ? hit.slice(name.length + 3) : def;
  };
  return {
    step: get('step', DEFAULT_STEP),
    n: Number(get('n', DEFAULT_K)),
    json: argv.includes('--json'),
    root: get('root', process.cwd()),
    // fixture-injection flags for headless tests
    baselineVersionsFile: get('baseline-versions-file', null),
    sweepFile: get('sweep-file', null),
    notesDirsFile: get('notes-dirs-file', null),
    gateTextFile: get('gate-text-file', null),
    t14TextFile: get('t14-text-file', null),
  };
}

/** Read a text file for marker detection; null if unavailable. */
function readTextFile(path) {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return null;
  }
}

/**
 * Perform the live trip-vocab sweep via spawning tools/trip-vocab-check.mjs.
 * Walks descending from the newest degree in www/tibsfox/com/Research/NASA/,
 * stopping at first TRIP-RISK or once K clean accumulated.
 * Returns { sweepRecords, indeterminate, reason } where:
 *   indeterminate=true when the NASA www dir is absent (clean-CI path)
 *   sweepRecords is an array of {degree, exit} newest-first
 */
function liveNasaSweep(root, k) {
  const nasaDir = join(root, 'www', 'tibsfox', 'com', 'Research', 'NASA');
  let entries;
  try {
    entries = readdirSync(nasaDir);
  } catch {
    return {
      sweepRecords: [],
      indeterminate: true,
      reason: 'www/tibsfox/com/Research/NASA/ absent (clean-CI path — no local NASA corpus)',
    };
  }

  // Parse degree directories: "1.N" format
  const degrees = entries
    .filter((e) => /^1\.\d+$/.test(e))
    .map((e) => ({ name: e, n: Number(e.slice(2)) }))
    .sort((a, b) => b.n - a.n) // descending
    .map((e) => e.name);

  const toolPath = resolve(root, 'tools', 'trip-vocab-check.mjs');
  const sweepRecords = [];
  let cleanCount = 0;

  for (const degree of degrees) {
    const page = join(nasaDir, degree, 'index.html');
    let exitCode;
    try {
      const res = spawnSync('node', [toolPath, page, '--mode', 'page'], {
        encoding: 'utf8',
      });
      exitCode = res.status ?? 2;
    } catch {
      exitCode = 2;
    }
    sweepRecords.push({ degree, exit: exitCode });
    if (exitCode === 0) {
      cleanCount++;
      if (cleanCount >= k) break; // K clean accumulated — enough evidence
    } else if (exitCode === 1) {
      break; // TRIP-RISK breaks the tail — no need to look further
    }
    // exit 2: transparent, continue scanning
  }

  return { sweepRecords, indeterminate: false, reason: null };
}

/**
 * Run one step and return its result object.
 * @returns {{
 *   step: string,
 *   ready: boolean,
 *   indeterminate: boolean,
 *   streak: number,
 *   n: number,
 *   promotionState: 'promoted'|'staged'|'unknown',
 *   details: object,
 * }}
 */
function runStep(step, args, gateText, t14Text) {
  const { n, root } = args;
  const promotionState = detectPromotionState(step, gateText, t14Text);

  if (step === 'adoption-freshness') {
    let versions;
    if (args.baselineVersionsFile) {
      const raw = JSON.parse(readFileSync(args.baselineVersionsFile, 'utf8'));
      versions = parseBaselineVersions(raw);
    } else {
      versions = scanBaselineFiles(join(root, 'docs'));
    }
    const { tail, maxVersion, sorted } = computeAdoptionTail(versions);
    const ready = tail >= n;
    return {
      step,
      ready,
      indeterminate: false,
      streak: tail,
      n,
      promotionState,
      details: { maxVersion, totalFiles: versions.length, sortedRange: sorted.length > 0 ? `${sorted[0]}–${sorted[sorted.length - 1]}` : 'none' },
    };
  }

  if (step === 'trip-vocab') {
    let sweepRecords;
    let indeterminate = false;
    let indeterminateReason = null;

    if (args.sweepFile) {
      sweepRecords = JSON.parse(readFileSync(args.sweepFile, 'utf8'));
    } else {
      const live = liveNasaSweep(root, n);
      if (live.indeterminate) {
        return {
          step,
          ready: false,
          indeterminate: true,
          streak: 0,
          n,
          promotionState,
          details: { reason: live.reason },
        };
      }
      sweepRecords = live.sweepRecords;
    }

    const { tail, tripAt, transparentCount, detail } = computeTripVocabTail(sweepRecords);
    const ready = tail >= n;
    return {
      step,
      ready,
      indeterminate,
      streak: tail,
      n,
      promotionState,
      details: { tripAt, transparentCount, scanned: sweepRecords.length, detail },
    };
  }

  if (step === 'ship-review') {
    let dirRecords;
    if (args.notesDirsFile) {
      // fixture: JSON array of dir names — all treated as matched=true
      const names = JSON.parse(readFileSync(args.notesDirsFile, 'utf8'));
      dirRecords = names.map((name) => ({ name, matched: true }));
    } else {
      const releaseNotesDir = join(root, 'docs', 'release-notes');
      dirRecords = scanReleaseNoteDirs(releaseNotesDir);
    }
    const { count } = computeShipReviewCount(dirRecords);
    const ready = count >= n;
    return {
      step,
      ready,
      indeterminate: false,
      streak: count,
      n,
      promotionState,
      details: { totalDirsScanned: dirRecords.length },
    };
  }

  throw new Error(`unknown step: ${step}`);
}

// ─── human rendering ──────────────────────────────────────────────────────────

const STEP_LABELS = {
  'adoption-freshness': 'step 20  adoption-freshness  (consecutive baseline files)',
  'trip-vocab':         'step 21  trip-vocab           (consecutive clean NASA pages)',
  'ship-review':        'step P   ship-review          (distinct reviewed release dirs)',
};

const REVERT_INSTRUCTIONS = {
  'adoption-freshness': [
    '  To REVERT: in tools/pre-tag-gate.sh, remove the PROMOTION-MARKER comment and',
    '  change the BLOCK exit back to a WARN; update the step exit-code legend.',
  ],
  'trip-vocab': [
    '  To REVERT: in tools/pre-tag-gate.sh, remove the PROMOTION-MARKER comment and',
    '  change the BLOCK exit back to a WARN; update the step exit-code legend.',
  ],
  'ship-review': [
    '  To REVERT: in docs/T14-SHIP-SEQUENCE.md, change the step P header back to',
    '  ADVISORY; in tools/pre-tag-gate.sh, remove the ship-review-attestation step',
    '  (step 22) and its PROMOTION-MARKER; renorm all step X/22 references back to',
    '  step X/21; update bypass-vocab-parity and env-vars.json.',
  ],
};

function renderStep(r) {
  const lines = [];
  const label = STEP_LABELS[r.step] || r.step;
  lines.push(`  ${label}`);
  lines.push(`  streak / K:  ${r.streak} / ${r.n}`);

  if (r.indeterminate) {
    lines.push(`  VERDICT: INDETERMINATE — ${r.details.reason || 'inputs unavailable'}`);
    lines.push('  (clean-CI path: no local NASA corpus — cannot evaluate trip-vocab streak)');
  } else {
    const need = Math.max(0, r.n - r.streak);
    const promoted = r.promotionState === 'promoted';
    if (r.ready) {
      if (promoted) {
        lines.push('  VERDICT: READY — already promoted; streak is informational.');
        for (const l of (REVERT_INSTRUCTIONS[r.step] || [])) lines.push(l);
      } else {
        lines.push(`  VERDICT: READY — ${r.streak}/${r.n} consecutive clean evidence units.`);
        lines.push('  Promotion criterion met; executor B will add the PROMOTION-MARKER this ship.');
      }
    } else {
      lines.push(`  VERDICT: NOT READY — need ${need} more consecutive clean evidence unit(s).`);
    }
  }

  // Step-specific detail
  if (r.step === 'adoption-freshness' && r.details.maxVersion !== null) {
    lines.push(`  (max version: ${r.details.maxVersion}; total baseline files: ${r.details.totalFiles})`);
  }
  if (r.step === 'trip-vocab' && !r.indeterminate) {
    if (r.details.tripAt) {
      lines.push(`  (tail broken by TRIP-RISK at degree ${r.details.tripAt})`);
    }
    if (r.details.transparentCount > 0) {
      lines.push(`  (${r.details.transparentCount} tool-error page(s) transparent — deferred)`);
    }
    lines.push(`  (${r.details.scanned} page(s) swept total)`);
  }
  if (r.step === 'ship-review') {
    lines.push(`  (${r.details.totalDirsScanned} dirs scanned in docs/release-notes/)`);
  }

  return lines.join('\n');
}

function renderHuman(results) {
  const lines = [];
  lines.push('warn-promotion readiness (K=30 gate — audit §10 ship 3, v1.49.1029)');
  lines.push('─'.repeat(68));
  for (const r of results) {
    lines.push(renderStep(r));
    lines.push('─'.repeat(68));
  }
  // Overall verdict
  const anyIndeterminate = results.some((r) => r.indeterminate);
  const anyNotReady = results.some((r) => !r.ready && !r.indeterminate);
  if (anyIndeterminate) {
    lines.push('  OVERALL: INDETERMINATE (at least one step has unavailable inputs)');
  } else if (anyNotReady) {
    lines.push('  OVERALL: NOT READY (at least one step has streak < K)');
  } else {
    lines.push('  OVERALL: READY — all requested steps cleared K=30');
  }
  return lines.join('\n');
}

// ─── main ─────────────────────────────────────────────────────────────────────

const VALID_STEPS = ['adoption-freshness', 'trip-vocab', 'ship-review', 'all'];

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!Number.isInteger(args.n) || args.n < 1) {
    process.stderr.write('invalid --n (must be a positive integer)\n');
    return 2;
  }

  if (!VALID_STEPS.includes(args.step)) {
    process.stderr.write(
      `invalid --step "${args.step}" (must be adoption-freshness|trip-vocab|ship-review|all)\n`,
    );
    return 2;
  }

  const stepsToRun =
    args.step === 'all'
      ? ['adoption-freshness', 'trip-vocab', 'ship-review']
      : [args.step];

  // Read marker files once (shared across steps)
  let gateText = null;
  let t14Text = null;
  if (args.gateTextFile) {
    gateText = readTextFile(args.gateTextFile);
  } else {
    gateText = readTextFile(join(args.root, 'tools', 'pre-tag-gate.sh'));
  }
  if (args.t14TextFile) {
    t14Text = readTextFile(args.t14TextFile);
  } else {
    t14Text = readTextFile(join(args.root, 'docs', 'T14-SHIP-SEQUENCE.md'));
  }

  const results = [];
  for (const step of stepsToRun) {
    try {
      results.push(runStep(step, args, gateText, t14Text));
    } catch (err) {
      process.stderr.write(`indeterminate: step ${step} failed: ${err.message}\n`);
      return 2;
    }
  }

  const text = args.json ? JSON.stringify(results, null, 2) : renderHuman(results);
  // Return-and-set-exitCode (no process.exit during a pending write) avoids the
  // pipe-buffer truncation #10420 documents.
  process.stdout.write(text + '\n');

  if (results.some((r) => r.indeterminate)) return 2;
  if (results.some((r) => !r.ready)) return 1;
  return 0;
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
