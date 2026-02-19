/**
 * Bulk download engine for Aminet packages.
 *
 * Orchestrates concurrent downloads with global rate limiting, resume from
 * interruption, and mirror state integration. Ties together the fetcher,
 * integrity verifier, and state manager into a complete download pipeline.
 *
 * Architecture:
 * 1. Load mirror state from disk
 * 2. Filter packages: skip completed statuses, re-download interrupted ones
 * 3. Run downloads with async semaphore (concurrency control)
 * 4. Apply global rate limiting (shared timestamp gate across all workers)
 * 5. Verify integrity after each download
 * 6. Update mirror state atomically after each package
 *
 * @module
 */

import type { AminetPackage, DownloadConfig, MirrorState } from './types.js';
import { loadMirrorState, saveMirrorState, updateEntry } from './mirror-state.js';
import { fetchPackage } from './package-fetcher.js';
import { verifyIntegrity } from './integrity.js';

// ============================================================================
// BulkDownloadResult
// ============================================================================

/**
 * Result of a bulk download operation.
 */
export interface BulkDownloadResult {
  /** fullPaths that downloaded + verified */
  succeeded: string[];
  /** Packages that failed to download or verify */
  failed: Array<{ fullPath: string; error: string }>;
  /** Already mirrored, skipped on resume */
  skipped: string[];
  /** Total packages in the input list */
  total: number;
}

// ============================================================================
// Statuses that should be skipped (already downloaded)
// ============================================================================

/**
 * Package statuses that indicate the package is already downloaded and
 * should be skipped on resume. 'downloading' and 'not-mirrored' are
 * NOT in this set -- they should be (re)downloaded.
 */
const SKIP_STATUSES = new Set([
  'mirrored',
  'scan-pending',
  'clean',
  'infected',
  'installed',
]);

// ============================================================================
// Concurrency control (async semaphore)
// ============================================================================

/**
 * Execute an array of items with bounded concurrency.
 *
 * Uses a Set of in-flight promises as an async semaphore. When the set
 * reaches the concurrency limit, waits for any one to complete before
 * starting the next.
 */
async function withConcurrency<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  const executing = new Set<Promise<void>>();
  for (const item of items) {
    const p = fn(item).then(() => {
      executing.delete(p);
    });
    executing.add(p);
    if (executing.size >= concurrency) {
      await Promise.race(executing);
    }
  }
  await Promise.all(executing);
}

// ============================================================================
// bulkDownload
// ============================================================================

/**
 * Download a batch of Aminet packages with concurrency control and rate limiting.
 *
 * Loads mirror state at start, filters out already-completed packages, and
 * processes the remaining ones through the fetcher + integrity verifier.
 * State is updated and saved after each individual download.
 *
 * @param packages - Packages to download
 * @param config   - Download configuration (mirrors, delay, concurrency, dirs)
 * @returns BulkDownloadResult with succeeded, failed, and skipped arrays
 */
export async function bulkDownload(
  packages: AminetPackage[],
  config: DownloadConfig,
): Promise<BulkDownloadResult> {
  // Early exit for empty input
  if (packages.length === 0) {
    return { succeeded: [], failed: [], skipped: [], total: 0 };
  }

  // Load current mirror state
  let state = loadMirrorState(config.mirrorDir);

  // Classify packages: skip vs download
  const toDownload: AminetPackage[] = [];
  const skipped: string[] = [];

  for (const pkg of packages) {
    const entry = state.entries[pkg.fullPath];
    if (entry && SKIP_STATUSES.has(entry.status)) {
      skipped.push(pkg.fullPath);
    } else {
      toDownload.push(pkg);
    }
  }

  // Result accumulators (shared across concurrent workers)
  const succeeded: string[] = [];
  const failed: Array<{ fullPath: string; error: string }> = [];

  // Global rate limiting gate: shared timestamp across all workers.
  // Before each download, wait until enough time has passed since the
  // last download started, regardless of which worker triggered it.
  let lastDownloadTime = 0;

  // Serialized state writes: prevent concurrent writes to .mirror-state.json.
  // The in-memory `state` is the source of truth; disk writes are queued.
  let writeQueue: Promise<void> = Promise.resolve();

  function serializedSave(st: MirrorState, dir: string): void {
    writeQueue = writeQueue.then(() => saveMirrorState(st, dir));
  }

  // Process each package
  async function processPackage(pkg: AminetPackage): Promise<void> {
    // Global rate limiting gate
    if (config.delayMs > 0) {
      const now = Date.now();
      const elapsed = now - lastDownloadTime;
      if (elapsed < config.delayMs) {
        await new Promise((r) => setTimeout(r, config.delayMs - elapsed));
      }
      lastDownloadTime = Date.now();
    }

    // Mark as 'downloading' in state
    state = updateEntry(state, pkg.fullPath, {
      fullPath: pkg.fullPath,
      status: 'downloading',
      sizeKb: pkg.sizeKb,
    });
    serializedSave(state, config.mirrorDir);

    try {
      // Fetch the package
      const fetchResult = await fetchPackage(pkg, config);

      // Verify integrity
      const integrity = verifyIntegrity(fetchResult.lhaData, pkg.sizeKb);

      if (!integrity.valid) {
        // Integrity failed -- mark as not-mirrored
        state = updateEntry(state, pkg.fullPath, {
          status: 'not-mirrored',
        });
        serializedSave(state, config.mirrorDir);
        failed.push({
          fullPath: pkg.fullPath,
          error: `Integrity check failed: size mismatch (expected ${integrity.expectedKb}KB, got ${integrity.actualKb}KB)`,
        });
        return;
      }

      // Success -- update state with integrity results
      state = updateEntry(state, pkg.fullPath, {
        status: 'mirrored',
        sha256: integrity.sha256,
        localPath: fetchResult.lhaPath,
        downloadedAt: new Date().toISOString(),
      });
      serializedSave(state, config.mirrorDir);
      succeeded.push(pkg.fullPath);
    } catch (err) {
      // Fetch failed -- mark as not-mirrored
      state = updateEntry(state, pkg.fullPath, {
        status: 'not-mirrored',
      });
      serializedSave(state, config.mirrorDir);
      failed.push({
        fullPath: pkg.fullPath,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Run with concurrency control
  await withConcurrency(toDownload, config.concurrency, processPackage);

  // Wait for any pending state writes to flush
  await writeQueue;

  return {
    succeeded,
    failed,
    skipped,
    total: packages.length,
  };
}
