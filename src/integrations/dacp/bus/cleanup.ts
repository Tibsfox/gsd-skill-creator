/**
 * Bundle cleanup and orphan detection for the DACP bus.
 *
 * Prunes old acknowledged bundle directories and detects orphaned
 * .bundle/ directories that have no companion .msg file.
 */

import { readdir, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';

import { parseTimestamp } from '../../den/encoder.js';
import type { BusConfig } from '../../den/types.js';
import type { CleanupResult, OrphanEntry } from './types.js';

// ============================================================================
// Constants
// ============================================================================

/** Number of priority levels (0-7 inclusive) */
const PRIORITY_COUNT = 8;

// ============================================================================
// cleanupBundles
// ============================================================================

/**
 * Prune old acknowledged bundles and remove orphaned bundles.
 *
 * 1. Scans acknowledged/ for .bundle/ directories older than maxAgeDays
 * 2. Scans priority directories for orphaned .bundle/ dirs
 * 3. Removes all matched bundles
 * 4. Reports space recovered
 *
 * @param config - Bus configuration
 * @param maxAgeDays - Maximum age in days before pruning (default: 7)
 * @returns Cleanup result with counts and space recovered
 */
export async function cleanupBundles(
  config: BusConfig,
  maxAgeDays: number = 7,
): Promise<CleanupResult> {
  let bundlesPruned = 0;
  let spaceRecovered = 0;

  // Phase 1: Prune old acknowledged bundles
  const ackDir = join(config.busDir, 'acknowledged');
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;

  try {
    const ackEntries = await readdir(ackDir);
    const ackBundles = ackEntries.filter((e) => e.endsWith('.bundle'));

    for (const bundleName of ackBundles) {
      const bundlePath = join(ackDir, bundleName);

      try {
        const st = await stat(bundlePath);
        if (!st.isDirectory()) continue;

        // Parse timestamp from the bundle name
        const timestamp = extractTimestampFromBundleName(bundleName);
        if (!timestamp) continue;

        const bundleDate = parseTimestamp(timestamp);
        const ageMs = Date.now() - bundleDate.getTime();

        if (ageMs > maxAgeMs) {
          const size = await estimateDirectorySize(bundlePath);
          await rm(bundlePath, { recursive: true, force: true });
          bundlesPruned++;
          spaceRecovered += size;
        }
      } catch {
        // Skip bundles that can't be processed
      }
    }
  } catch {
    // acknowledged/ may not exist yet
  }

  // Phase 2: Detect and remove orphaned bundles
  const orphans = await detectOrphans(config);
  for (const orphan of orphans) {
    try {
      const size = await estimateDirectorySize(orphan.bundlePath);
      await rm(orphan.bundlePath, { recursive: true, force: true });
      spaceRecovered += size;
    } catch {
      // Skip orphans that can't be removed
    }
  }

  return {
    bundlesPruned,
    orphansDetected: orphans.length,
    orphanPaths: orphans.map((o) => o.bundlePath),
    spaceRecovered,
  };
}

// ============================================================================
// detectOrphans
// ============================================================================

/**
 * Detect orphaned .bundle/ directories in priority directories.
 *
 * An orphan is a .bundle/ directory that has no companion .msg file
 * with the same stem name in the same directory.
 *
 * @param config - Bus configuration
 * @returns Array of orphan entries
 */
export async function detectOrphans(config: BusConfig): Promise<OrphanEntry[]> {
  const orphans: OrphanEntry[] = [];

  for (let p = 0; p < PRIORITY_COUNT; p++) {
    const priDir = join(config.busDir, `priority-${p}`);

    try {
      const entries = await readdir(priDir);
      const msgStems = new Set<string>();
      const bundleEntries: string[] = [];

      // Collect .msg stems and .bundle/ entries
      for (const entry of entries) {
        if (entry.endsWith('.msg')) {
          msgStems.add(entry.replace(/\.msg$/, ''));
        } else if (entry.endsWith('.bundle')) {
          bundleEntries.push(entry);
        }
      }

      // Check each .bundle/ for a companion .msg
      for (const bundleEntry of bundleEntries) {
        const bundlePath = join(priDir, bundleEntry);

        try {
          const st = await stat(bundlePath);
          if (!st.isDirectory()) continue;
        } catch {
          continue;
        }

        const stem = bundleEntry.replace(/\.bundle$/, '');
        if (!msgStems.has(stem)) {
          orphans.push({
            bundlePath,
            reason: 'no_companion_msg',
          });
        }
      }
    } catch {
      // Priority dir may not exist
    }
  }

  return orphans;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Extract the compact timestamp from a bundle directory name.
 *
 * Expected format: {YYYYMMDD-HHMMSS}-{OPCODE}-{SRC}-{DST}.bundle
 *
 * @param bundleName - Bundle directory name
 * @returns Timestamp string or null if unparseable
 */
function extractTimestampFromBundleName(bundleName: string): string | null {
  const stem = bundleName.replace(/\.bundle$/, '');
  if (stem.length < 15) return null;

  const timestamp = stem.slice(0, 15);
  if (!/^\d{8}-\d{6}$/.test(timestamp)) return null;

  return timestamp;
}

/**
 * Estimate the total size of a directory by summing file sizes.
 *
 * Returns 0 on any error (defensive -- never throws).
 *
 * @param dirPath - Absolute path to the directory
 * @returns Approximate size in bytes
 */
async function estimateDirectorySize(dirPath: string): Promise<number> {
  try {
    const entries = await readdir(dirPath);
    let total = 0;

    for (const entry of entries) {
      try {
        const st = await stat(join(dirPath, entry));
        if (st.isFile()) {
          total += st.size;
        }
      } catch {
        // Skip inaccessible entries
      }
    }

    return total;
  } catch {
    return 0;
  }
}
