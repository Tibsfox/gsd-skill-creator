/**
 * M4 Branch-Context Experimentation — first-commit-wins semantics.
 *
 * `commit()` merges the branched skill body back into the trunk.
 * When multiple branches race to commit, the first one to acquire the
 * advisory lock wins; all others receive a clear diagnostic and abort.
 *
 * First-commit-wins mechanism (CF-M4-02, CF-M4-03):
 *   1. Attempt to create a lock file at `.planning/branches/.commit-lock`
 *      using `fs.open(path, 'ax')` — the 'ax' flag fails with EEXIST if the
 *      file already exists. `O_CREAT | O_EXCL` is atomic on POSIX and on
 *      Windows NTFS via `CREATE_NEW`; exactly one racer succeeds.
 *   2. Write the winning branch ID + timestamp into the lock file.
 *   3. If the open fails with EEXIST, read the lock to identify the winner
 *      for the loser's diagnostic, then abort this branch.
 *   4. The winner merges the skill body into trunk and removes the lock.
 *
 * No tie-break:
 *   `ax` is the sole atomic winner-selection primitive. Earlier revisions
 *   implemented a "steal via rename" tie-break based on `manifest.createdAt`
 *   — that code is removed because it broke correctness (multiple older
 *   branches could each succeed at stealing, producing multiple winners in
 *   the N≥3 race). `manifest.createdAt` is still recorded in the lock entry
 *   for observability but is no longer consulted for winner selection.
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
import { join } from 'node:path';
import { readManifest, writeManifest, DEFAULT_BRANCHES_DIR } from './fork.js';
import type { BranchManifest } from './manifest.js';
import { recordBranchResolved } from '../reinforcement/channel-sources.js';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Advisory lock filename under branchesDir. */
export const COMMIT_LOCK_FILENAME = '.commit-lock';

// ─── Lock shape ───────────────────────────────────────────────────────────────

interface LockEntry {
  /** The branch ID that holds the lock. */
  branchId: string;
  /** The manifest.createdAt of the winning branch (observability only). */
  createdAt: number;
  /** Unix ms when the lock was acquired. */
  acquiredAt: number;
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
 * If this branch wins the lock race: writes the skill body to trunkPath,
 * marks the manifest as 'committed', releases the lock.
 *
 * If another branch holds the lock: marks this branch 'aborted', returns
 * outcome='blocked' with a diagnostic naming the winner.
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

  const lockPath = join(branchesDir, COMMIT_LOCK_FILENAME);

  // ── Try to acquire the advisory lock (atomic 'ax' open) ──────────────────
  let won = false;
  let winnerEntry: LockEntry | null = null;

  try {
    // 'ax' = O_CREAT | O_EXCL | O_WRONLY — fails with EEXIST if file exists.
    const fd = await fs.open(lockPath, 'ax');
    const entry: LockEntry = {
      branchId,
      createdAt: manifest.createdAt,
      acquiredAt: ts,
    };
    await fd.writeFile(JSON.stringify(entry), 'utf8');
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
  // `ax` is the sole atomic winner selector. If we lost, read the lock to
  // name the winner in our diagnostic. If the winner has already released
  // the lock (fast path), winnerEntry stays null and the diagnostic falls
  // back to "unknown".
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
    try {
      // Read the branched skill body.
      const branchBody = await fs.readFile(join(branchDir, 'skill.md'), 'utf8');

      // Write to trunk path (ensure parent dir exists).
      const { dirname } = await import('node:path');
      await fs.mkdir(dirname(trunkPath), { recursive: true });
      await fs.writeFile(trunkPath, branchBody, 'utf8');

      // Mark manifest as committed.
      const committed: BranchManifest = { ...manifest, state: 'committed', committedAt: ts };
      await writeManifest(branchDir, committed);
      manifest = committed;

      // Release the lock.
      await fs.unlink(lockPath).catch(() => {/* ignore if already gone */});

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
      // Something went wrong after acquiring the lock — release and rethrow.
      await fs.unlink(lockPath).catch(() => {/* ignore */});
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
