/**
 * M4 Branch-Context Experimentation — first-commit-wins semantics.
 *
 * `commit()` merges the branched skill body back into the trunk.
 * When multiple branches race to commit, the first one to acquire the
 * advisory lock wins; all others receive a clear diagnostic and abort.
 *
 * First-commit-wins mechanism (CF-M4-02, CF-M4-03):
 *   The winner is selected by atomically creating a PER-ROUND lock file at
 *   `.planning/branches/.commit-lock-<roundKey>` via `fs.open(path, 'ax')` —
 *   the 'ax' flag fails with EEXIST if the file exists. `O_CREAT | O_EXCL` is
 *   atomic on POSIX and on Windows NTFS via `CREATE_NEW`; exactly one racer
 *   creates it. The winner writes its branch ID into the lock, merges the
 *   skill body into trunk, and — on the success path — LEAVES THE LOCK IN
 *   PLACE. Losers (EEXIST) read the lock to name the winner in their
 *   diagnostic, then mark their own manifest 'aborted'.
 *
 * Permanent winner record (NOT a releasable mutex) — fixes the double-win:
 *   The lock is keyed on
 *       roundKey = sha256(resolve(trunkPath) + '\0' + parentHash)
 *   which ALL sibling branches in one race share (same trunk, same parent
 *   generation) but a FUTURE round does not — a branch forked from the now-
 *   updated trunk has a different parentHash, hence a different lock, and can
 *   commit. Because the winner never removes the lock on success, a lagging
 *   racer's 'ax' open always observes EEXIST and loses. Pre-v1.49.948 the lock
 *   was a single releasable global file (`.commit-lock`): the winner unlinked
 *   it after its slow trunk write, reopening the 'ax' window so a late racer
 *   could double-win. Keying off permanent per-round state closes that window
 *   with zero timing dependence (no spin/backoff). Only the winner's ERROR
 *   path releases the lock — so a commit that fails after acquiring the lock
 *   does not permanently wedge the round.
 *
 * No tie-break:
 *   `ax` is the sole atomic winner-selection primitive. `manifest.createdAt`
 *   is recorded in the lock entry for observability but is never consulted for
 *   winner selection.
 *
 * Round-key boundary:
 *   `roundKey` resolves `trunkPath` against `process.cwd()`; racing callers
 *   MUST pass a consistent trunkPath spelling across siblings (the coordinator
 *   and the tests do). Two unrelated trunks — or two parent generations of the
 *   same trunk — get distinct roundKeys and never block each other.
 *
 *   The key uses `parentHash` as the generation marker, which assumes each
 *   commit advances the trunk (fork requires a non-trivial refinement in
 *   practice). A degenerate 0-delta commit leaves the trunk unchanged, so a
 *   later commit forked from the same parent state collides on roundKey and is
 *   blocked — committing the identical (trunk, parent-generation) twice is
 *   idempotently rejected as a late sibling rather than double-applied.
 *
 * Crash recovery (v1.49.952):
 *   The lock is released on the winner's ERROR path but NOT on a hard process
 *   kill (SIGKILL/OOM) between acquiring the lock and finishing the commit —
 *   that leaves a permanent `.commit-lock-<roundKey>` marker. `gc()` now reaps
 *   such crash orphans by age, made SOUND by a write-ahead: the marker records
 *   `committing: false` at acquisition and is flipped to `committing: true`
 *   immediately BEFORE the trunk rename (see the winner path). A crash with the
 *   marker still `committing: false` provably never reached the trunk write, so
 *   `gc()` reaps it (round un-won → un-wedge); a crash at-or-after the flip
 *   leaves `committing: true`, so `gc()` KEEPS the marker (the trunk may be
 *   advanced — never reopen the double-win). `gc()` reaps only on an EXPLICIT
 *   `committing: false`, so a legacy marker (pre-v1.49.952, no field) is kept.
 *   Former residual (CLOSED v1.49.960): a crash in the sub-instruction window
 *   between the flip and the rename leaves `committing: true` with the trunk
 *   un-advanced. The flip now ALSO records `trunkTmp` + `bodyHash` (an intent
 *   journal), so `recover()` forward-completes that wedged round idempotently by
 *   re-applying the rename. See `branches/gc.ts` and `branches/recover.ts`.
 *
 *   Remaining minor residuals (both COSMETIC, neither a wedge or data loss):
 *   (1) Orphan trunk-tmp leak — a crash AFTER staging the trunk tmp but BEFORE
 *   the `committing: true` flip leaves a `committing: false` marker (gc() reaps
 *   it, round un-wedged) plus an orphan `<trunkPath>.tmp.<uuid>` in the trunk's
 *   directory. The acquisition marker does not record `trunkTmp` (it is computed
 *   later, inside the winner path), so nothing auto-cleans that stray tmp; it is
 *   a bounded-per-crash disk leak removable by hand. (2) Torn marker — the flip
 *   is a plain (non-atomic) overwrite, so a crash mid-write leaves either (a) a
 *   truncated/invalid-JSON marker (both `recover()` and `gc()` skip it -> kept,
 *   wedged, hand-removable) or (b) the prior `committing: false` bytes intact
 *   (gc() reaps it as un-won, correct — degrading into residual (1)'s tmp leak).
 *   A torn write can only truncate, never forge a valid `committing: true` marker
 *   missing the journal fields.
 *
 * Trunk merge:
 *   The committed skill body is written to `trunkPath` supplied by the caller.
 *   The caller is also responsible for any SkillCodebase.define() call to
 *   update the Grove index — this module does not import SkillCodebase to
 *   remain dependency-light and testable without a full Grove stack.
 *
 * Cross-platform:
 *   - Only `node:fs`, `node:path`, `node:crypto` from stdlib.
 *   - No filesystem-specific primitives.
 *
 * Phase 645, Wave 1 Track D (M4).
 *
 * @module branches/commit
 */

import { promises as fs } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { readManifest, writeManifest, DEFAULT_BRANCHES_DIR } from './fork.js';
import type { BranchManifest } from './manifest.js';
import { recordBranchResolved } from '../reinforcement/channel-sources.js';

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Legacy global advisory-lock filename (pre-v1.49.948) and the stem of the
 * per-round lock names. Retained as a stable export; no longer created as a
 * standalone file. Winner selection now uses a permanent per-round lock named
 * `COMMIT_LOCK_PREFIX + commitRoundKey(...)`.
 */
export const COMMIT_LOCK_FILENAME = '.commit-lock';

/** Filename prefix for the permanent per-round winner-record lock. */
export const COMMIT_LOCK_PREFIX = '.commit-lock-';

/**
 * Compute the per-round winner key.
 *
 * All sibling branches racing to commit the SAME trunk from the SAME parent
 * generation share this key; a future round (forked from the updated trunk,
 * hence a different `parentHash`) does not. `trunkPath` is resolved against the
 * process cwd so racing callers that spell the path differently still collide —
 * callers MUST pass a consistent trunkPath across siblings.
 */
export function commitRoundKey(trunkPath: string, parentHash: string): string {
  return createHash('sha256')
    .update(resolve(trunkPath), 'utf8')
    .update(Buffer.from([0])) // real NUL byte: impossible in a filesystem path
    .update(parentHash, 'utf8')
    .digest('hex');
}

// ─── Lock shape ───────────────────────────────────────────────────────────────

interface LockEntry {
  /** The branch ID that holds the lock (the round winner). */
  branchId: string;
  /** The manifest.createdAt of the winning branch (observability only). */
  createdAt: number;
  /** Unix ms when the lock was acquired. */
  acquiredAt: number;
  /** The parent generation hash this round was contended on (observability). */
  parentHash: string;
  /** The trunk path this round committed to (observability). */
  trunkPath: string;
  /**
   * Write-ahead commit-intent flag (v1.49.952). Written `false` at lock
   * acquisition and flipped to `true` immediately BEFORE the trunk rename, so a
   * crash that left an orphan marker can be classified by `gc()`: `false` means
   * the trunk write was never reached (round provably un-won → reapable), while
   * `true` means the trunk write was reached or completed (the round may be won
   * → the marker is KEPT). This is the durable signal that makes crash-orphan
   * reaping sound without consulting mutable trunk content. Older markers
   * (pre-v1.49.952) omit the field; `gc()` reaps only on an EXPLICIT `false`, so
   * a legacy marker is conservatively kept.
   */
  committing: boolean;
  /**
   * Intent-journal fields (v1.49.960), written ALONGSIDE `committing: true` in
   * the write-ahead so the trunk rename is idempotently REPLAYABLE by `recover()`
   * after a crash in the flip->rename window. `trunkTmp` is the staged trunk-body
   * temp path and `bodyHash` is its sha256; `recover()` re-applies
   * `rename(trunkTmp, trunkPath)` only when the staged body still hashes to
   * `bodyHash` and the trunk does not yet hold it. Absent at acquisition
   * (`committing: false`) and on pre-v1.49.960 markers — `recover()` skips a
   * `committing: true` marker that lacks them (cannot replay). See
   * `branches/recover.ts`.
   */
  trunkTmp?: string;
  bodyHash?: string;
}

// ─── Commit options ───────────────────────────────────────────────────────────

export interface CommitOptions {
  /**
   * The branch ID to commit.
   */
  branchId: string;

  /**
   * Root directory containing branch subdirectories.
   * Defaults to DEFAULT_BRANCHES_DIR.
   */
  branchesDir?: string;

  /**
   * Absolute or relative path to the trunk skill file.
   * The committed skill body will be written here.
   */
  trunkPath: string;

  /**
   * Override for Date.now() in tests.
   */
  ts?: number;

  /**
   * MA-6 hook: suppress the `branch_resolved` reinforcement emission.
   * Defaults to true (emit) when omitted.
   */
  emitReinforcement?: boolean;

  /**
   * MA-6 hook: override the reinforcement log path (tests / alt storage).
   */
  reinforcementLogPath?: string;
}

export type CommitOutcome = 'committed' | 'blocked';

export interface CommitResult {
  /** Whether this branch won and committed, or was blocked by another winner. */
  outcome: CommitOutcome;

  /** The winning branch ID (may be a different branch if outcome is 'blocked'). */
  winnerBranchId: string;

  /**
   * Diagnostic message for losers.
   * Only present when outcome is 'blocked'.
   */
  diagnostic?: string;

  /** The final manifest of this branch (state updated to 'committed' or 'aborted'). */
  manifest: BranchManifest;
}

// ─── commit() ────────────────────────────────────────────────────────────────

/**
 * Attempt to commit a branch into trunk using first-commit-wins semantics.
 *
 * If this branch wins the per-round lock race: writes the skill body to
 * trunkPath, marks the manifest as 'committed', and LEAVES the per-round lock
 * in place as the permanent winner record (it is released only if the commit
 * itself fails after the lock was acquired).
 *
 * If another sibling already won this round: marks this branch 'aborted',
 * returns outcome='blocked' with a diagnostic naming the winner.
 *
 * @throws Error if the branch is not in 'open' state.
 */
export async function commit(opts: CommitOptions): Promise<CommitResult> {
  const {
    branchId,
    branchesDir = DEFAULT_BRANCHES_DIR,
    trunkPath,
    ts = Date.now(),
  } = opts;

  const branchDir = join(branchesDir, branchId);
  let manifest = await readManifest(branchDir);

  if (manifest.state !== 'open') {
    throw new Error(
      `Branch ${branchId} is not open (state: ${manifest.state}). Cannot commit.`,
    );
  }

  // Permanent per-round winner lock. All sibling branches racing to commit
  // this trunk from this parent generation share `lockPath`; a future round
  // (forked from the updated trunk → different parentHash) does not.
  const lockPath = join(
    branchesDir,
    COMMIT_LOCK_PREFIX + commitRoundKey(trunkPath, manifest.parentHash),
  );

  // ── Try to acquire the per-round lock (atomic 'ax' open) ──────────────────
  let won = false;
  let winnerEntry: LockEntry | null = null;

  try {
    // 'ax' = O_CREAT | O_EXCL | O_WRONLY — fails with EEXIST if file exists.
    const fd = await fs.open(lockPath, 'ax');
    const entry: LockEntry = {
      branchId,
      createdAt: manifest.createdAt,
      acquiredAt: ts,
      parentHash: manifest.parentHash,
      trunkPath,
      committing: false, // flipped to true just before the trunk rename
    };
    try {
      await fd.writeFile(JSON.stringify(entry), 'utf8');
    } catch (writeErr) {
      // Writing the lock body failed after we already won the atomic open.
      // Release the lock so the next caller doesn't wedge on an orphaned file,
      // then surface the original failure.
      await fd.close().catch(() => { /* close races on the failed FD are OK */ });
      await fs.unlink(lockPath).catch(() => { /* ignore if already gone */ });
      throw writeErr;
    }
    await fd.close();
    won = true;
    winnerEntry = entry;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== 'EEXIST') {
      // Unexpected error — rethrow.
      throw err;
    }
    // Lock is held by another branch.
    won = false;
  }

  // ── Loser: identify winner for diagnostic ────────────────────────────────
  // `ax` is the sole atomic winner selector. If we lost, read the permanent
  // round lock to name the winner in our diagnostic. The lock is normally
  // present (the winner keeps it), but if the winner is still mid-write or
  // its commit failed and released it, winnerEntry stays null and the
  // diagnostic falls back to "unknown".
  if (!won) {
    try {
      const raw = await fs.readFile(lockPath, 'utf8');
      winnerEntry = JSON.parse(raw) as LockEntry;
    } catch {
      winnerEntry = null;
    }
  }

  // ── Winner path ───────────────────────────────────────────────────────────
  if (won && winnerEntry) {
    // Declared outside the try so the catch can clean up a leftover temp file
    // if a step after its creation (the write-ahead, or the rename) fails.
    let trunkTmp: string | undefined;
    try {
      // Read the branched skill body.
      const branchBody = await fs.readFile(join(branchDir, 'skill.md'), 'utf8');

      // Write to trunk path atomically (write-then-rename, like writeManifest):
      // a process crash mid-write must not leave a partially-written trunk. The
      // temp lives in the same directory so the rename is atomic on one volume.
      await fs.mkdir(dirname(trunkPath), { recursive: true });
      trunkTmp = trunkPath + '.tmp.' + randomUUID();
      await fs.writeFile(trunkTmp, branchBody, 'utf8');

      // WRITE-AHEAD (v1.49.952): durably record commit-intent in the marker
      // BEFORE the trunk rename. This is what lets gc()'s crash-orphan reaper be
      // sound: a crash before this point leaves `committing: false` (the trunk
      // write was never reached → safe to reap), while a crash at-or-after this
      // point leaves `committing: true` (the trunk may be advanced → keep). The
      // overwrite is non-atomic, but a crash mid-write leaves a corrupt marker
      // that the reaper conservatively skips (keeps). Winner selection (the 'ax'
      // open above) and the never-unlink-on-success behaviour are unchanged.
      //
      // INTENT JOURNAL (v1.49.960): the same write also records `trunkTmp` + the
      // staged body's `bodyHash`, turning the marker into a replay journal. A
      // crash in the sub-instruction window between this write and the rename
      // below leaves `committing: true` with the trunk un-advanced — previously a
      // permanently wedged round (gc() keeps it; never reopens the double-win).
      // `recover()` now forward-completes it idempotently by re-applying the
      // rename (guarded by `bodyHash`). See `branches/recover.ts`.
      const bodyHash = createHash('sha256').update(branchBody, 'utf8').digest('hex');
      await fs.writeFile(
        lockPath,
        JSON.stringify({ ...winnerEntry, committing: true, trunkTmp, bodyHash }),
        'utf8',
      );

      await fs.rename(trunkTmp, trunkPath);

      // Mark manifest as committed.
      const committed: BranchManifest = { ...manifest, state: 'committed', committedAt: ts };
      await writeManifest(branchDir, committed);
      manifest = committed;

      // Do NOT release the lock on success: it is the PERMANENT winner record
      // for this round. Releasing it (as pre-v1.49.948 did) reopens the 'ax'
      // selection window so a lagging racer would double-win. A future round
      // forked from the updated trunk has a different parentHash → different
      // lock → can still commit.

      // MA-6: emit branch_resolved reinforcement (committed path).
      if (opts.emitReinforcement !== false) {
        await recordBranchResolved(
          {
            actor: 'branches:commit',
            metadata: {
              branchId,
              resolution: 'committed',
              winnerBranchId: branchId,
            },
            ts,
          },
          { logPath: opts.reinforcementLogPath },
        );
      }

      return {
        outcome: 'committed',
        winnerBranchId: branchId,
        manifest,
      };
    } catch (err) {
      // Commit failed after acquiring the lock. Release the per-round lock so
      // the round is not permanently wedged (a sibling/retry can still win),
      // and best-effort remove any leftover trunk temp, then rethrow. This is
      // the ONLY path that releases on the winner side.
      await fs.unlink(lockPath).catch(() => {/* ignore */});
      if (trunkTmp !== undefined) await fs.unlink(trunkTmp).catch(() => {/* ignore */});
      throw err;
    }
  }

  // ── Loser path ────────────────────────────────────────────────────────────
  const winnerBranchId = winnerEntry?.branchId ?? 'unknown';
  const diagnostic =
    `CF-M4-02: Branch ${branchId} was blocked by ${winnerBranchId}. ` +
    `First-commit-wins: branch '${winnerBranchId}' committed first. ` +
    `This branch has been aborted. To retry, open a new branch from the updated trunk.`;

  // Mark this branch as aborted.
  const aborted: BranchManifest = { ...manifest, state: 'aborted', abortedAt: ts };
  await writeManifest(branchDir, aborted);
  manifest = aborted;

  // MA-6: emit branch_resolved reinforcement (aborted/blocked path).
  if (opts.emitReinforcement !== false) {
    await recordBranchResolved(
      {
        actor: 'branches:commit',
        metadata: {
          branchId,
          resolution: 'aborted',
          winnerBranchId,
          diagnostic,
        },
        ts,
      },
      { logPath: opts.reinforcementLogPath },
    );
  }

  return {
    outcome: 'blocked',
    winnerBranchId,
    diagnostic,
    manifest,
  };
}
