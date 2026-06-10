#!/usr/bin/env node
/**
 * tools/ship-review/write-attestation.mjs — ship-review attestation writer + checker.
 *
 * WRITE mode (default): writes .planning/ship-review/last-attestation.json with
 * the review provenance for the current ship. Run at T14 step P after the
 * adversarial ship review completes (docs/T14-SHIP-SEQUENCE.md).
 *
 * CHECK mode (--check): validates the existing attestation against three gate
 * checks used by pre-tag-gate.sh step 22 (ship-review-attestation). The gate
 * shells out to this tool in --check mode — single source of truth for the
 * validation logic. Exit 0 valid / 1 invalid-or-stale-or-missing / 2 error.
 *
 * Usage (write):
 *   node tools/ship-review/write-attestation.mjs \
 *     --mode full|scaled|content \
 *     --base <first-code-commit>^ \
 *     --confirmed N \
 *     [--fixed N] \
 *     [--workflow-run <id>] \
 *     [--notes "<text>"]
 *
 * Usage (check):
 *   node tools/ship-review/write-attestation.mjs --check
 *
 * Output path: .planning/ship-review/last-attestation.json
 *
 * Attestation shape:
 *   {
 *     reviewedHead: string,   // git rev-parse HEAD at write time
 *     base: string,           // --base ref (the review's base commit)
 *     mode: "full"|"scaled"|"content",
 *     confirmedCount: number,
 *     fixedCount: number,
 *     workflowRunId: string|null,
 *     notes: string,
 *     writtenAt: string       // ISO-8601 UTC
 *   }
 *
 * Gate checks (--check):
 *   1. File exists, parses, and has reviewedHead (sha), mode ∈ {full,scaled,content}, writtenAt.
 *   2. git merge-base --is-ancestor <reviewedHead> HEAD (the reviewed commits are in this history).
 *   3. <reviewedHead> is NOT an ancestor of the newest tag (freshness: a stale attestation from
 *      the previous ship BLOCKs). Skip check 3 when no tag exists.
 */

import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../..');
const ATTESTATION_DIR = join(REPO_ROOT, '.planning', 'ship-review');
const ATTESTATION_PATH = join(ATTESTATION_DIR, 'last-attestation.json');

const VALID_MODES = new Set(['full', 'scaled', 'content']);

// ---------------------------------------------------------------------------
// Pure validation logic (exported for tests; no I/O, no process.exit)
// ---------------------------------------------------------------------------

/**
 * Validate the attestation object against the three gate checks.
 * Injectable inputs: the attestation JSON, the HEAD sha, the latest tag sha
 * (may be null when no tag exists), and the ancestor-check function.
 *
 * Returns { valid: boolean, reason: string }.
 */
export function validateAttestation(attestation, headSha, latestTagSha, isAncestorOf) {
  // Check 1 — required fields + mode enum.
  if (!attestation || typeof attestation !== 'object') {
    return { valid: false, reason: 'attestation is not a JSON object' };
  }
  const { reviewedHead, mode, writtenAt } = attestation;
  if (!reviewedHead || typeof reviewedHead !== 'string') {
    return { valid: false, reason: 'missing or invalid field: reviewedHead' };
  }
  if (!mode || !VALID_MODES.has(mode)) {
    return {
      valid: false,
      reason: `invalid mode "${mode}"; must be one of: ${[...VALID_MODES].join(', ')}`,
    };
  }
  if (!writtenAt || typeof writtenAt !== 'string') {
    return { valid: false, reason: 'missing or invalid field: writtenAt' };
  }

  // Check 2 — reviewedHead is an ancestor of HEAD (the review covers history up to HEAD).
  if (!isAncestorOf(reviewedHead, headSha)) {
    return {
      valid: false,
      reason: `reviewedHead ${reviewedHead} is not an ancestor of HEAD ${headSha}; run step P for this ship`,
    };
  }

  // Check 3 — reviewedHead is NOT an ancestor of the latest tag (freshness: the attestation
  // must be from THIS ship, not from the previous ship).
  if (latestTagSha !== null) {
    if (isAncestorOf(reviewedHead, latestTagSha)) {
      return {
        valid: false,
        reason: `reviewedHead ${reviewedHead} is an ancestor of the latest tag; this attestation is from a prior ship — run step P for this ship`,
      };
    }
  }

  return { valid: true, reason: 'ok' };
}

// ---------------------------------------------------------------------------
// Git helpers
// ---------------------------------------------------------------------------

function git(...args) {
  const result = spawnSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8' });
  return { stdout: (result.stdout || '').trim(), status: result.status || 0 };
}

function getHead() {
  const r = git('rev-parse', 'HEAD');
  if (r.status !== 0) throw new Error('git rev-parse HEAD failed');
  return r.stdout;
}

function getLatestTag() {
  const r = git('describe', '--tags', '--abbrev=0');
  if (r.status !== 0) return null; // no tags exist
  return r.stdout;
}

function resolveRef(ref) {
  const r = git('rev-parse', '--verify', ref + '^{commit}');
  if (r.status !== 0) return null;
  return r.stdout;
}

/**
 * Returns true if `ancestor` is an ancestor of (or equal to) `descendant`.
 * Uses `git merge-base --is-ancestor ancestor descendant`.
 */
function isAncestorOf(ancestor, descendant) {
  const r = git('merge-base', '--is-ancestor', ancestor, descendant);
  return r.status === 0;
}

// ---------------------------------------------------------------------------
// CHECK mode
// ---------------------------------------------------------------------------

function runCheck() {
  if (!existsSync(ATTESTATION_PATH)) {
    process.stderr.write(
      `[write-attestation] MISSING: no attestation at ${ATTESTATION_PATH}\n`,
    );
    process.stderr.write(
      `[write-attestation]   Run T14 step P, then: node tools/ship-review/write-attestation.mjs --mode full --base <first-code-commit>^ --confirmed N\n`,
    );
    process.exit(1);
  }

  let attestation;
  try {
    attestation = JSON.parse(readFileSync(ATTESTATION_PATH, 'utf8'));
  } catch (err) {
    process.stderr.write(
      `[write-attestation] MALFORMED: cannot parse attestation JSON: ${err.message}\n`,
    );
    process.exit(1);
  }

  let headSha;
  try {
    headSha = getHead();
  } catch (err) {
    process.stderr.write(`[write-attestation] ERROR: ${err.message}\n`);
    process.exit(2);
  }

  const latestTag = getLatestTag();
  const latestTagSha = latestTag ? resolveRef(latestTag) : null;

  const { valid, reason } = validateAttestation(attestation, headSha, latestTagSha, isAncestorOf);

  if (!valid) {
    process.stderr.write(`[write-attestation] INVALID: ${reason}\n`);
    // Classify the reason for the operator.
    if (reason.startsWith('missing') || reason.startsWith('invalid field') || reason.startsWith('attestation is not')) {
      process.stderr.write(`[write-attestation]   → attestation is malformed\n`);
    } else if (reason.includes('prior ship')) {
      process.stderr.write(`[write-attestation]   → attestation is stale (from a prior ship)\n`);
      process.stderr.write(
        `[write-attestation]   Run step P for THIS ship, then: node tools/ship-review/write-attestation.mjs --mode full --base <first-code-commit>^ --confirmed N\n`,
      );
    } else {
      process.stderr.write(
        `[write-attestation]   Run step P for THIS ship, then: node tools/ship-review/write-attestation.mjs --mode full --base <first-code-commit>^ --confirmed N\n`,
      );
    }
    process.exit(1);
  }

  process.stdout.write(
    `[write-attestation] VALID: reviewedHead=${attestation.reviewedHead} mode=${attestation.mode} writtenAt=${attestation.writtenAt}\n`,
  );
  process.exit(0);
}

// ---------------------------------------------------------------------------
// WRITE mode
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--check') { args.check = true; continue; }
    if (a === '--mode') { args.mode = argv[++i]; continue; }
    if (a === '--base') { args.base = argv[++i]; continue; }
    if (a === '--confirmed') { args.confirmedCount = parseInt(argv[++i], 10); continue; }
    if (a === '--fixed') { args.fixedCount = parseInt(argv[++i], 10); continue; }
    if (a === '--workflow-run') { args.workflowRunId = argv[++i]; continue; }
    if (a === '--notes') { args.notes = argv[++i]; continue; }
  }
  return args;
}

function runWrite(args) {
  if (!args.mode || !VALID_MODES.has(args.mode)) {
    process.stderr.write(
      `[write-attestation] ERROR: --mode is required; must be one of: ${[...VALID_MODES].join(', ')}\n`,
    );
    process.exit(1);
  }

  let reviewedHead;
  try {
    reviewedHead = getHead();
  } catch (err) {
    process.stderr.write(`[write-attestation] ERROR: ${err.message}\n`);
    process.exit(2);
  }

  const attestation = {
    reviewedHead,
    base: args.base || null,
    mode: args.mode,
    confirmedCount: typeof args.confirmedCount === 'number' ? args.confirmedCount : 0,
    fixedCount: typeof args.fixedCount === 'number' ? args.fixedCount : 0,
    workflowRunId: args.workflowRunId || null,
    notes: args.notes || '',
    writtenAt: new Date().toISOString(),
  };

  try {
    mkdirSync(ATTESTATION_DIR, { recursive: true });
    writeFileSync(ATTESTATION_PATH, JSON.stringify(attestation, null, 2) + '\n', 'utf8');
  } catch (err) {
    process.stderr.write(`[write-attestation] ERROR: cannot write attestation: ${err.message}\n`);
    process.exit(2);
  }

  process.stdout.write(
    `[write-attestation] written: ${ATTESTATION_PATH}\n`,
  );
  process.stdout.write(
    `  reviewedHead: ${attestation.reviewedHead}\n`,
  );
  process.stdout.write(
    `  mode: ${attestation.mode}  confirmedCount: ${attestation.confirmedCount}  fixedCount: ${attestation.fixedCount}\n`,
  );
  process.exit(0);
}

// ---------------------------------------------------------------------------
// CLI dispatch (only when invoked as the main script — not when imported).
// Compare RESOLVED real paths, not raw strings: a naive `import.meta.url ===
// file://${argv[1]}` silently fails through symlinks or space-containing paths.
// ---------------------------------------------------------------------------

let invokedAsCli = false;
try {
  invokedAsCli =
    !!process.argv[1] &&
    realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1]);
} catch {
  invokedAsCli = false;
}

if (invokedAsCli) {
  const args = parseArgs(process.argv.slice(2));
  if (args.check) {
    runCheck();
  } else {
    runWrite(args);
  }
}
