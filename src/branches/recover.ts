/**
 * M4 Branch-Context Experimentation — crash-recovery replay of wedged commits.
 *
 * `recover()` closes the residual the v1.49.952 write-ahead left open (see
 * `commit.ts` "Crash recovery" and `gc.ts`): a hard process kill in the
 * sub-instruction window between the marker's `committing: true` write and the
 * trunk `fs.rename` leaves a marker recording `committing: true` with the trunk
 * UN-advanced. `gc()` deliberately KEEPS that marker (never reopen the
 * v1.49.948 double-win), so the round stays permanently wedged: no sibling
 * forked from the same (trunkPath, parentHash) can ever win the `ax` race again.
 *
 * The closure (v1.49.960) turns the existing per-round marker into an
 * INTENT JOURNAL: the `committing: true` write now ALSO records `trunkTmp` (the
 * staged trunk-body path) and `bodyHash` (its sha256), so the rename is
 * idempotently REPLAYABLE. `recover()` scans the markers and, for each
 * `committing: true` marker, FORWARD-COMPLETES the crashed commit:
 *
 *   - staged tmp present + its sha256 === bodyHash + trunk not yet that body
 *       -> redo `fs.rename(trunkTmp, trunkPath)` and reconcile the winner's
 *          manifest to 'committed' (the line flip->rename residual window) ->
 *          reported as `completed`.
 *   - staged tmp gone + trunk already holds bodyHash + manifest still 'open'
 *       -> just reconcile the manifest (the rename completed pre-crash, the
 *          manifest write did not — the rename->manifest window) -> `reconciled`.
 *   - staged tmp gone + manifest already 'committed' -> already complete (no-op)
 *       -> `alreadyComplete`.
 *   - the winner manifest is 'aborted' -> SKIP the WHOLE recovery (never
 *     resurrect a rejected variant — gates the rename, not just the manifest).
 *   - legacy `committing: true` marker with no trunkTmp/bodyHash (pre-v1.49.960),
 *     a corrupt marker, a `committing: false`/absent marker, a staged tmp whose
 *     hash does not match, or a trunk already advanced PAST this round's parent
 *     generation -> SKIP (cannot safely replay; left wedged, removable by hand
 *     or healed once a newer commit re-stages).
 *
 * Why forward-complete rather than roll back: a `committing: true` marker means
 * the winner was already SELECTED (the `ax` race is decided). Rolling it back
 * (unlink, or rewrite to `committing: false`) would reopen winner selection —
 * exactly the v1.49.948 double-win (a `committing: false` rewrite would then be
 * reaped by gc() on a later pass). recover() therefore NEVER mutates the marker
 * file. Redo is monotone and idempotent (a rename of a tmp onto its final name,
 * guarded by the "does the trunk already hold this body" check AND a parent-
 * generation guard), so running `recover()` twice is a no-op on the second pass.
 * `committing: false` markers are NOT recover()'s job — `gc()` reaps those.
 *
 * Notes / residuals:
 *   - A 0-delta commit (proposedBody === parentBody) makes the trunk hash equal
 *     `bodyHash` even in the flip->rename window, so recover() classifies it as
 *     `reconciled` rather than `completed` — harmless (a redo rename would be a
 *     byte-identical no-op; the manifest + staged-tmp cleanup still happen).
 *   - The ONLY automatic heal path is a SUBSEQUENT commit round on the same
 *     branchesDir (the coordinator calls recover() before each round). A wedge on
 *     a branchesDir whose experiment family is abandoned never heals
 *     automatically — that is the pre-existing SAFE residual (no data loss),
 *     removable by hand-running recover(). gc() is the periodic net for
 *     `committing: false` orphans only.
 *
 * `recover()` is best-effort: a per-marker error is recorded in `skipped` and
 * never aborts the pass (this surface is liveness/observability, not a
 * load-bearing decision — a marker left wedged is the pre-existing SAFE residual,
 * not data loss; failure-mode-contracts #10427).
 *
 * Cross-platform: only `node:fs`, `node:path`, `node:crypto` from stdlib.
 *
 * @module branches/recover
 */

import { promises as fs } from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { readManifest, writeManifest, DEFAULT_BRANCHES_DIR } from './fork.js';
import type { BranchManifest } from './manifest.js';
import { COMMIT_LOCK_PREFIX } from './commit.js';

// ─── Recover options / report ───────────────────────────────────────────────────

export interface RecoverOptions {
  /** Branches root directory. Defaults to DEFAULT_BRANCHES_DIR. */
  branchesDir?: string;

  /**
   * Override for Date.now() in tests — used only as the manifest `committedAt`
   * fallback when the marker has no usable `acquiredAt`.
   */
  now?: number;

  /** Scan and report but do not rename / write. Defaults to false. */
  dryRun?: boolean;
}

export interface RecoverReport {
  /** Markers whose crashed rename was redone (trunk advanced + manifest fixed). */
  completed: string[];

  /** Markers whose trunk was already advanced; only the manifest was reconciled. */
  reconciled: string[];

  /** `committing: true` markers already fully complete (no action needed). */
  alreadyComplete: string[];

  /**
   * Markers that could not (or must not) be replayed: a `committing: false`/
   * absent marker (gc()'s job), a legacy marker with no journal fields, a
   * corrupt/unreadable marker, a hash-mismatched staged body, an 'aborted'
   * winner (never resurrected), a trunk advanced past the round's parent
   * generation, or a per-marker replay error. All are left untouched.
   */
  skipped: string[];

  /** Whether this was a dry-run. */
  dryRun: boolean;
}

// ─── recover() ───────────────────────────────────────────────────────────────

const sha256 = (s: string): string => createHash('sha256').update(s, 'utf8').digest('hex');

/** Read a file's UTF-8 body, or undefined if it cannot be read. */
async function readBodyIf(path: string | undefined): Promise<string | undefined> {
  if (!path) return undefined;
  try {
    return await fs.readFile(path, 'utf8');
  } catch {
    return undefined;
  }
}

/**
 * Replay any wedged `committing: true` commit rounds in the branches directory,
 * forward-completing each idempotently.
 *
 * @returns RecoverReport summarising what was completed, reconciled, or skipped.
 */
export async function recover(opts: RecoverOptions = {}): Promise<RecoverReport> {
  const {
    branchesDir = DEFAULT_BRANCHES_DIR,
    now = Date.now(),
    dryRun = false,
  } = opts;

  const report: RecoverReport = {
    completed: [],
    reconciled: [],
    alreadyComplete: [],
    skipped: [],
    dryRun,
  };

  let entries: string[];
  try {
    entries = await fs.readdir(branchesDir);
  } catch {
    return report; // branches dir doesn't exist — nothing to recover
  }

  const markers = entries.filter((e) => e.startsWith(COMMIT_LOCK_PREFIX));
  for (const marker of markers) {
    await recoverOne(marker, { branchesDir, now, dryRun, report });
  }
  return report;
}

interface RecoverCtx {
  branchesDir: string;
  now: number;
  dryRun: boolean;
  report: RecoverReport;
}

async function recoverOne(marker: string, ctx: RecoverCtx): Promise<void> {
  const { branchesDir, now, dryRun, report } = ctx;
  const lockPath = join(branchesDir, marker);

  let parsed: {
    committing?: unknown;
    trunkPath?: unknown;
    trunkTmp?: unknown;
    bodyHash?: unknown;
    parentHash?: unknown;
    branchId?: unknown;
    acquiredAt?: unknown;
  };
  try {
    parsed = JSON.parse(await fs.readFile(lockPath, 'utf8')) as typeof parsed;
  } catch {
    report.skipped.push(marker); // unreadable / corrupt marker
    return;
  }

  // Only `committing: true` is recover()'s job; `committing: false`/absent is
  // gc()'s (the provably un-won rounds). recover() never mutates the marker.
  if (parsed.committing !== true) {
    report.skipped.push(marker);
    return;
  }

  const trunkPath = typeof parsed.trunkPath === 'string' ? parsed.trunkPath : undefined;
  const trunkTmp = typeof parsed.trunkTmp === 'string' ? parsed.trunkTmp : undefined;
  const bodyHash = typeof parsed.bodyHash === 'string' ? parsed.bodyHash : undefined;
  const parentHash = typeof parsed.parentHash === 'string' ? parsed.parentHash : undefined;

  // A legacy `committing: true` marker (pre-v1.49.960) lacks the journal fields
  // — it cannot be replayed without the staged body path + its hash.
  if (!trunkPath || !bodyHash) {
    report.skipped.push(marker);
    return;
  }

  try {
    // Read the winner manifest ONCE. A `committing: true` marker normally
    // implies an 'open' manifest (commit() sets 'committed' only AFTER the
    // rename); an 'aborted' manifest is an inconsistent, externally-induced
    // state. Never resurrect a rejected variant — skip the WHOLE recovery (this
    // gates the trunk rename too, not just the manifest write). A missing /
    // unreadable manifest (gc() may have reaped the branch) is tolerated: the
    // trunk is the source of truth, so an old wedged round still heals.
    const branchId = typeof parsed.branchId === 'string' ? parsed.branchId : undefined;
    const branchDir = branchId ? join(branchesDir, branchId) : undefined;
    let manifest: BranchManifest | undefined;
    if (branchDir) {
      try {
        manifest = await readManifest(branchDir);
      } catch {
        manifest = undefined; // branch dir gone / unreadable — proceed on the trunk alone
      }
    }
    if (manifest && manifest.state === 'aborted') {
      report.skipped.push(marker); // never resurrect an aborted winner
      return;
    }

    const trunkBody = await readBodyIf(trunkPath);
    const trunkAdvanced = trunkBody !== undefined && sha256(trunkBody) === bodyHash;

    if (trunkAdvanced) {
      // The rename completed pre-crash (the rename->manifest window) — or a prior
      // recover() already redid it. Reconcile the manifest if still open, and
      // opportunistically clean a leftover staged tmp.
      const changed = await reconcileManifestState(branchDir, manifest, parsed, now, dryRun);
      if (trunkTmp && !dryRun) await fs.unlink(trunkTmp).catch(() => {});
      report[changed ? 'reconciled' : 'alreadyComplete'].push(marker);
      return;
    }

    // Trunk not yet advanced — redo the rename from the staged tmp, GUARDED by
    // the body hash so a truncated/corrupt staged body is never renamed in.
    const staged = await readBodyIf(trunkTmp);
    if (staged === undefined || sha256(staged) !== bodyHash) {
      report.skipped.push(marker); // staged body missing or corrupt — cannot complete safely
      return;
    }

    // Defense-in-depth (v960 review): only redo the rename when the trunk is
    // still at the PARENT generation this round was racing (or absent — the
    // first-commit case). This is currently unreachable as an over-write — while
    // a committing:true marker exists, the parentHash-keyed permanent marker
    // blocks any newer round from advancing the trunk — but the explicit guard
    // means a future marker-lifecycle change can never silently turn the redo
    // into a stale-body clobber of a newer round's trunk.
    if (trunkBody !== undefined && parentHash !== undefined && sha256(trunkBody) !== parentHash) {
      report.skipped.push(marker); // trunk advanced past the parent by another round — never clobber
      return;
    }

    if (!dryRun) {
      await fs.mkdir(dirname(trunkPath), { recursive: true });
      await fs.rename(trunkTmp as string, trunkPath);
      await reconcileManifestState(branchDir, manifest, parsed, now, dryRun);
    }
    report.completed.push(marker);
  } catch {
    // Best-effort: a failed replay leaves the round wedged (the SAFE pre-existing
    // residual), never data loss. Record and move on.
    report.skipped.push(marker);
  }
}

/**
 * Reconcile the winning branch's manifest to 'committed' if it is still 'open',
 * using the manifest ALREADY read by recoverOne (no second disk read). Returns
 * true iff it wrote (or, in dry-run, WOULD write) a change. A missing manifest
 * (branch reaped) or a non-'open' state ('committed' no-op; 'aborted' is gated
 * earlier and never reaches here) returns false.
 */
async function reconcileManifestState(
  branchDir: string | undefined,
  manifest: BranchManifest | undefined,
  parsed: { acquiredAt?: unknown },
  now: number,
  dryRun: boolean,
): Promise<boolean> {
  if (!branchDir || !manifest) return false; // branch dir gone — trunk already advanced, nothing to fix
  if (manifest.state !== 'open') return false; // already committed (no-op); aborted is gated upstream
  if (!dryRun) {
    const committedAt = typeof parsed.acquiredAt === 'number' ? parsed.acquiredAt : now;
    await writeManifest(branchDir, { ...manifest, state: 'committed', committedAt });
  }
  return true;
}
