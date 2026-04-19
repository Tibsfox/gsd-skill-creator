/**
 * M4 Branch-Context Experimentation — garbage collection of orphan branches.
 *
 * `gc()` scans the branches directory and deletes branches that:
 *   1. Are in terminal state ('committed' or 'aborted') AND older than
 *      `maxAgeMs` milliseconds (measured from manifest.createdAt), OR
 *   2. Are in 'open' state AND older than `maxOpenAgeMs` milliseconds
 *      (i.e. stuck branches that were never committed or aborted).
 *
 * Default ages:
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

// ─── Constants ────────────────────────────────────────────────────────────────

/** Default max age for terminal branches before GC (7 days). */
export const DEFAULT_TERMINAL_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/** Default max age for orphan open branches before GC (30 days). */
export const DEFAULT_OPEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

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

  /** Whether this was a dry-run. */
  dryRun: boolean;
}

// ─── gc() ────────────────────────────────────────────────────────────────────

/**
 * Garbage-collect orphan and expired branches from the branches directory.
 *
 * @returns GcReport summarising what was deleted, kept, or skipped.
 */
export async function gc(opts: GcOptions = {}): Promise<GcReport> {
  const {
    branchesDir = DEFAULT_BRANCHES_DIR,
    terminalMaxAgeMs = DEFAULT_TERMINAL_MAX_AGE_MS,
    openMaxAgeMs = DEFAULT_OPEN_MAX_AGE_MS,
    now = Date.now(),
    dryRun = false,
  } = opts;

  const report: GcReport = { deleted: [], kept: [], skipped: [], dryRun };

  let entries: string[];
  try {
    entries = await fs.readdir(branchesDir);
  } catch {
    // Branches directory doesn't exist — nothing to GC.
    return report;
  }

  for (const entry of entries) {
    // Skip hidden files (e.g. .commit-lock).
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
