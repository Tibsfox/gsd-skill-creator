/**
 * M4 Branch-Context Experimentation — garbage collection of orphan branches
 * and orphan per-round commit-lock markers.
 *
 * `gc()` runs two independent passes over the branches directory:
 *
 *   1. Commit-lock reaping (v1.49.952). Per-round winner-record markers
 *      (`.commit-lock-<roundKey>`, written by `commit()`) are normally
 *      PERMANENT — `commit()` deliberately leaves the winner's marker in place
 *      so a lagging sibling always loses the `ax` race (this is the v1.49.948
 *      double-win fix). A hard process kill (SIGKILL/OOM) between acquiring the
 *      marker and finishing the commit is the ONE case that leaves an ORPHAN
 *      marker — the round is wedged because no winner ever committed. This pass
 *      reaps such orphans by age, closing the M4 crash-recovery liveness gap.
 *
 *   2. Branch reaping. Deletes branch directories that are either:
 *        - in terminal state ('committed' or 'aborted') AND older than
 *          `terminalMaxAgeMs` (measured from manifest.createdAt), OR
 *        - in 'open' state AND older than `openMaxAgeMs` (stuck branches that
 *          were never committed or aborted).
 *
 * ## Why reaping a commit-lock marker is sound
 *
 * The marker is a PERMANENT winner record after a SUCCESSFUL commit: reaping it
 * would re-open the `ax` selection window so a sibling still forked from the
 * same parent generation (same `roundKey`) could double-win — exactly the
 * v1.49.948 bug, merely time-delayed. The prime directive is therefore NEVER to
 * reap a marker whose round was won (the v1.49.948 exactly-one-winner-per-round
 * invariant).
 *
 * Soundness comes from a WRITE-AHEAD in `commit()` (v1.49.952): the marker
 * records `committing: false` at lock acquisition and is flipped to
 * `committing: true` immediately BEFORE the trunk rename (`fs.rename`). The
 * reaper reaps an old marker ONLY when it explicitly records `committing: false`
 * — which PROVES the crash preceded the trunk write, so the round was never won
 * (its body never reached the trunk) and reaping merely un-wedges the round.
 *
 * A marker recording `committing: true` (the trunk rename was reached or
 * completed — the round may be won), a legacy marker with no `committing` field
 * (pre-v1.49.952, cannot be classified), a young marker (a possibly-in-flight
 * commit, guarded by the age threshold), or a corrupt/unreadable marker are all
 * conservatively KEPT/SKIPPED. Because the reaper consults a durable, immutable-
 * once-`true` intent flag rather than the mutable trunk content or the winner's
 * lifecycle state, it is robust to a crash anywhere in the commit timeline,
 * including the trunk-rename-before-manifest-write window AND a later round that
 * happens to restore the parent body — neither can flip a `true` back to
 * `false`.
 *
 * Residual (safe; tiny): a crash in the sub-instruction window between the
 * `committing: true` write and the trunk rename leaves `committing: true` with
 * the trunk un-advanced, so that one round stays wedged (kept, never reaped) —
 * removable by hand. This trades a hair of liveness for guaranteed safety.
 *
 * The two passes are ordered so the lock pass runs before the branch pass — the
 * reaping decision reads only the marker (not the winner branch), so it is
 * independent of `readdir` ordering and of any branch the branch pass deletes.
 *
 * Default ages:
 *   - Commit-lock markers: 1 hour (3_600_000 ms) — orders of magnitude longer
 *     than any real commit, short enough to un-wedge a crashed round promptly.
 *   - Terminal branches: 7 days (604_800_000 ms)
 *   - Open/orphan branches: 30 days (2_592_000_000 ms)
 *
 * GC is advisory: it does not block ongoing explore/commit/abort operations.
 * It is safe to run concurrently with other branch operations — the only
 * risk is a race between GC deleting a branch and commit() trying to read it,
 * which would result in a "Branch not found" error (acceptable; caller should
 * retry).
 *
 * Cross-platform (CF-M4-03):
 *   - `fs.rm({ recursive: true })` works on macOS/Linux/Windows.
 *   - No filesystem-specific primitives.
 *
 * Phase 645, Wave 1 Track D (M4).
 *
 * @module branches/gc
 */

import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { readManifest, DEFAULT_BRANCHES_DIR } from './fork.js';
import { COMMIT_LOCK_PREFIX } from './commit.js';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Default max age for terminal branches before GC (7 days). */
export const DEFAULT_TERMINAL_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/** Default max age for orphan open branches before GC (30 days). */
export const DEFAULT_OPEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Default max age for an orphan commit-lock marker before reaping (1 hour).
 *
 * A healthy commit holds the marker for milliseconds, so 1 hour is far longer
 * than any in-flight commit yet short enough to un-wedge a crashed round
 * promptly. Combined with the winner-branch-`open` guard, this never reaps a
 * permanent winner record (those keep their branch `committed`).
 */
export const DEFAULT_COMMIT_LOCK_MAX_AGE_MS = 60 * 60 * 1000;

// ─── GC options ───────────────────────────────────────────────────────────────

export interface GcOptions {
  /**
   * Branches root directory. Defaults to DEFAULT_BRANCHES_DIR.
   */
  branchesDir?: string;

  /**
   * Max age in ms for terminal (committed/aborted) branches before deletion.
   * Defaults to 7 days.
   */
  terminalMaxAgeMs?: number;

  /**
   * Max age in ms for open/orphan branches before force-deletion.
   * Defaults to 30 days.
   */
  openMaxAgeMs?: number;

  /**
   * Max age in ms (measured from the marker's `acquiredAt`) for an orphan
   * per-round commit-lock marker before reaping. Defaults to 1 hour. Set to
   * `Infinity` to disable commit-lock reaping entirely.
   */
  commitLockMaxAgeMs?: number;

  /**
   * Override for Date.now() in tests.
   */
  now?: number;

  /**
   * Dry-run mode: scan and report but do not delete.
   * Defaults to false.
   */
  dryRun?: boolean;
}

export interface GcReport {
  /** Branch IDs that were deleted (or would be deleted in dry-run). */
  deleted: string[];

  /** Branch IDs that were scanned but not eligible for deletion. */
  kept: string[];

  /** Branch IDs that had unreadable manifests and were skipped. */
  skipped: string[];

  /**
   * Commit-lock marker filenames reaped as crash orphans (or that would be
   * reaped in dry-run): old enough AND recording an explicit `committing: false`
   * (the crash provably preceded the trunk write — round never won).
   */
  reapedLocks: string[];

  /**
   * Commit-lock marker filenames retained: `committing: true` (the trunk write
   * was reached — the round may be won), a legacy marker with no `committing`
   * field (pre-v1.49.952, cannot classify), or a marker younger than the
   * threshold (a possibly-in-flight commit).
   */
  keptLocks: string[];

  /**
   * Commit-lock marker filenames skipped: unreadable / corrupt / missing a
   * usable `acquiredAt`, so they cannot be classified (conservatively kept).
   */
  skippedLocks: string[];

  /** Whether this was a dry-run. */
  dryRun: boolean;
}

// ─── gc() ────────────────────────────────────────────────────────────────────

/**
 * Garbage-collect orphan and expired branches, plus orphan commit-lock markers,
 * from the branches directory.
 *
 * @returns GcReport summarising what was deleted, kept, or skipped.
 */
export async function gc(opts: GcOptions = {}): Promise<GcReport> {
  const {
    branchesDir = DEFAULT_BRANCHES_DIR,
    terminalMaxAgeMs = DEFAULT_TERMINAL_MAX_AGE_MS,
    openMaxAgeMs = DEFAULT_OPEN_MAX_AGE_MS,
    commitLockMaxAgeMs = DEFAULT_COMMIT_LOCK_MAX_AGE_MS,
    now = Date.now(),
    dryRun = false,
  } = opts;

  const report: GcReport = {
    deleted: [],
    kept: [],
    skipped: [],
    reapedLocks: [],
    keptLocks: [],
    skippedLocks: [],
    dryRun,
  };

  let entries: string[];
  try {
    entries = await fs.readdir(branchesDir);
  } catch {
    // Branches directory doesn't exist — nothing to GC.
    return report;
  }

  // ── Pass 1: reap orphan commit-lock markers ───────────────────────────────
  // Runs FIRST so every winner branch's manifest is still on disk when its
  // marker's reaping decision reads it — the decision is independent of the
  // branch pass below (and of readdir ordering).
  const lockMarkers = entries.filter((e) => e.startsWith(COMMIT_LOCK_PREFIX));
  for (const marker of lockMarkers) {
    await reapCommitLock(marker, {
      branchesDir,
      commitLockMaxAgeMs,
      now,
      dryRun,
      report,
    });
  }

  // ── Pass 2: reap orphan / expired branches ────────────────────────────────
  for (const entry of entries) {
    // Skip ALL hidden files (commit-lock markers handled in pass 1; any other
    // dotfile is not a branch directory).
    if (entry.startsWith('.')) continue;

    const branchDir = join(branchesDir, entry);

    let manifest;
    try {
      manifest = await readManifest(branchDir);
    } catch {
      // Unreadable manifest — skip.
      report.skipped.push(entry);
      continue;
    }

    const ageMs = now - manifest.createdAt;
    const isTerminal = manifest.state === 'committed' || manifest.state === 'aborted';

    const eligible =
      (isTerminal && ageMs > terminalMaxAgeMs) ||
      (!isTerminal && ageMs > openMaxAgeMs);

    if (!eligible) {
      report.kept.push(entry);
      continue;
    }

    if (!dryRun) {
      try {
        await fs.rm(branchDir, { recursive: true, force: true });
      } catch {
        // If deletion fails, skip (don't crash GC for one bad directory).
        report.skipped.push(entry);
        continue;
      }
    }

    report.deleted.push(entry);
  }

  return report;
}

// ─── commit-lock reaping ───────────────────────────────────────────────────────

interface ReapContext {
  branchesDir: string;
  commitLockMaxAgeMs: number;
  now: number;
  dryRun: boolean;
  report: GcReport;
}

/**
 * Decide whether a single `.commit-lock-<roundKey>` marker is a reapable crash
 * orphan, and reap it (unless dry-run) if so. The reap condition is SOUND by
 * construction (see the module docstring): reap iff the marker is older than the
 * threshold AND it explicitly records `committing: false` — proving (via the
 * v1.49.952 commit() write-ahead) that the crash preceded the trunk write, so
 * the round was never won. A `committing: true` marker (trunk may be advanced),
 * a legacy marker with no `committing` field, a young marker, or a corrupt /
 * unreadable marker are all conservatively KEPT/SKIPPED — never reaped.
 *
 * On reap, the marker's recorded `trunkTmp` (written at acquisition since
 * v1.49.964) is also unlinked best-effort — clearing the orphan staged tmp a
 * crash before the `committing: true` flip would otherwise leak. This is sound
 * for the same reason the reap is: an explicit `committing: false` proves the
 * rename never consumed the tmp, so it is always an orphan here.
 */
async function reapCommitLock(marker: string, ctx: ReapContext): Promise<void> {
  const { branchesDir, commitLockMaxAgeMs, now, dryRun, report } = ctx;
  const lockPath = join(branchesDir, marker);

  let parsed: { acquiredAt?: unknown; committing?: unknown; trunkTmp?: unknown };
  try {
    parsed = JSON.parse(await fs.readFile(lockPath, 'utf8')) as typeof parsed;
  } catch {
    // Unreadable / corrupt marker — cannot classify; conservatively keep.
    report.skippedLocks.push(marker);
    return;
  }

  const acquiredAt = typeof parsed.acquiredAt === 'number' ? parsed.acquiredAt : undefined;
  if (acquiredAt === undefined) {
    // No usable timestamp — cannot age-check; conservatively keep.
    report.skippedLocks.push(marker);
    return;
  }

  if (now - acquiredAt <= commitLockMaxAgeMs) {
    // Younger than the threshold — could be an in-flight commit; keep.
    report.keptLocks.push(marker);
    return;
  }

  // SOUND reap condition: only an EXPLICIT `committing: false` proves the crash
  // preceded the trunk write (round never won). `true` (trunk may be advanced),
  // a missing field (legacy marker), or any non-false value is KEPT — never
  // reopen the v1.49.948 double-win.
  if (parsed.committing !== false) {
    report.keptLocks.push(marker);
    return;
  }

  if (!dryRun) {
    try {
      await fs.rm(lockPath, { force: true });
    } catch {
      report.skippedLocks.push(marker);
      return;
    }
    // Best-effort: unlink the orphan trunk tmp this reaped round staged before
    // crashing. SOUND because we only reach here on an EXPLICIT `committing:
    // false` (the trunk rename provably never ran — see the check above), so the
    // staged tmp is definitively an orphan, never a won round's in-flight body. A
    // missing tmp (crash before staging, or already consumed) is a no-op
    // (v1.49.964; accessory cleanup — silent best-effort per #10427).
    if (typeof parsed.trunkTmp === 'string') {
      await fs.rm(parsed.trunkTmp, { force: true }).catch(() => { /* orphan may already be gone */ });
    }
  }
  report.reapedLocks.push(marker);
}
