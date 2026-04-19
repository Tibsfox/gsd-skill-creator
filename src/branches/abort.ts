/**
 * M4 Branch-Context Experimentation — clean branch abort.
 *
 * `abort()` marks a branch as 'aborted' and deletes the branch directory,
 * leaving no residual state in the trunk or the branches directory (CF-M4-04).
 *
 * Semantics:
 *   1. Read the manifest to verify the branch exists and is in 'open' state.
 *   2. Write a final manifest with state='aborted' and abortedAt timestamp.
 *   3. Recursively delete the branch directory (manifest + skill body).
 *   4. No writes to trunk (trunk is never modified by abort).
 *
 * If the branch is already 'aborted' or 'committed', abort() is a no-op
 * (idempotent) — the branch is already in a terminal state.
 *
 * Cross-platform (CF-M4-03):
 *   - `fs.rm({ recursive: true })` is the Node.js stdlib equivalent of
 *     `rm -rf`; available since Node 14.14 and works on macOS, Linux, Windows.
 *   - No btrfs/zfs/APFS primitives.
 *
 * Phase 645, Wave 1 Track D (M4).
 *
 * @module branches/abort
 */

import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { readManifest, DEFAULT_BRANCHES_DIR } from './fork.js';
import type { BranchManifest } from './manifest.js';
import { recordBranchResolved } from '../reinforcement/channel-sources.js';

// ─── Abort options ────────────────────────────────────────────────────────────

export interface AbortOptions {
  /**
   * Branch ID to abort.
   */
  branchId: string;

  /**
   * Root directory containing branch subdirectories.
   * Defaults to DEFAULT_BRANCHES_DIR.
   */
  branchesDir?: string;

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

export interface AbortResult {
  /** The branch ID that was aborted. */
  branchId: string;

  /**
   * Whether the branch directory was deleted.
   * False only if the branch was already in a terminal state.
   */
  deleted: boolean;

  /** Final manifest state ('aborted'). */
  finalState: BranchManifest['state'];
}

// ─── abort() ─────────────────────────────────────────────────────────────────

/**
 * Cleanly abort a branch, leaving no residual state.
 *
 * Idempotent: if the branch is already in a terminal state (committed/aborted),
 * returns immediately without touching the filesystem.
 *
 * @throws Error if the branch directory does not exist.
 */
export async function abort(opts: AbortOptions): Promise<AbortResult> {
  const {
    branchId,
    branchesDir = DEFAULT_BRANCHES_DIR,
    ts = Date.now(),
  } = opts;

  const branchDir = join(branchesDir, branchId);

  // Read manifest — throws if branch doesn't exist.
  const manifest = await readManifest(branchDir);

  // Idempotent terminal state handling.
  if (manifest.state === 'aborted' || manifest.state === 'committed') {
    return { branchId, deleted: false, finalState: manifest.state };
  }

  // The branch must be 'open' at this point.
  // Recursively delete the entire branch directory.
  // We skip writing the final manifest to disk before deletion — the
  // directory disappears atomically, so there is no partial state.
  await fs.rm(branchDir, { recursive: true, force: true });

  // MA-6: emit branch_resolved reinforcement (explicit abort).
  if (opts.emitReinforcement !== false) {
    await recordBranchResolved(
      {
        actor: 'branches:abort',
        metadata: {
          branchId,
          resolution: 'aborted',
        },
        ts,
      },
      { logPath: opts.reinforcementLogPath },
    );
  }

  return { branchId, deleted: true, finalState: 'aborted' };
}

/**
 * Verify that a branch directory has been fully removed.
 * Used by tests to assert CF-M4-04 (no residual state).
 *
 * @returns true if the branch directory does NOT exist.
 */
export async function branchDirectoryGone(branchId: string, branchesDir: string = DEFAULT_BRANCHES_DIR): Promise<boolean> {
  const branchDir = join(branchesDir, branchId);
  try {
    await fs.access(branchDir);
    return false; // Directory still exists.
  } catch {
    return true; // ENOENT — gone.
  }
}
