/**
 * Sync detection for Aminet mirror state vs INDEX comparison.
 *
 * Compares local mirror state against the current Aminet INDEX to identify
 * upstream version changes, new packages, and removed packages. Drives
 * incremental updates by flagging only what needs re-downloading.
 *
 * @module
 */

import type { AminetPackage, MirrorState } from './types.js';

/**
 * Result of comparing mirror state against current INDEX.
 */
export interface SyncReport {
  /** Packages whose sizeKb changed between mirror state and INDEX */
  changed: Array<{ fullPath: string; reason: string }>;
  /** fullPaths present in INDEX but not in mirror state */
  newPackages: string[];
  /** fullPaths present in mirror state but not in current INDEX */
  removed: string[];
  /** Count of packages that match between mirror state and INDEX */
  unchanged: number;
  /** Total entries in mirror state */
  totalLocal: number;
  /** Total packages in INDEX */
  totalRemote: number;
}

/**
 * Statuses eligible for change detection.
 *
 * Only packages that have been downloaded (status at or beyond 'mirrored')
 * are compared for upstream changes. 'not-mirrored' and 'downloading'
 * entries are skipped because they haven't been fetched yet.
 */
const CHANGE_ELIGIBLE_STATUSES = new Set([
  'mirrored',
  'scan-pending',
  'clean',
  'infected',
  'installed',
]);

/**
 * Compare mirror state against current INDEX to detect changes.
 *
 * Algorithm:
 * 1. Build a Map<fullPath, AminetPackage> from indexPackages for O(1) lookup.
 * 2. Walk mirror state entries:
 *    - If entry status is NOT eligible for change detection, skip it for
 *      changed/unchanged counts (but still consider it "known" for new/removed).
 *    - If fullPath NOT in INDEX map: add to `removed` (only eligible entries).
 *    - If fullPath IN INDEX map AND sizeKb differs: add to `changed`.
 *    - If fullPath IN INDEX map AND sizeKb matches: count as unchanged.
 * 3. Walk INDEX packages:
 *    - If fullPath NOT in state.entries at all: add to `newPackages`.
 * 4. Return SyncReport with totals.
 *
 * @param state - Local mirror state
 * @param indexPackages - Current INDEX packages
 * @returns SyncReport with change details
 */
export function detectChanges(
  state: MirrorState,
  indexPackages: AminetPackage[],
): SyncReport {
  // O(1) lookup from INDEX
  const indexMap = new Map<string, AminetPackage>();
  for (const pkg of indexPackages) {
    indexMap.set(pkg.fullPath, pkg);
  }

  const changed: Array<{ fullPath: string; reason: string }> = [];
  const removed: string[] = [];
  let unchanged = 0;

  // Walk mirror state entries
  for (const [fullPath, entry] of Object.entries(state.entries)) {
    if (!CHANGE_ELIGIBLE_STATUSES.has(entry.status)) {
      // Not eligible for change detection -- skip entirely
      continue;
    }

    const indexPkg = indexMap.get(fullPath);

    if (!indexPkg) {
      // Package was in mirror but no longer in INDEX
      removed.push(fullPath);
    } else if (entry.sizeKb !== indexPkg.sizeKb) {
      // Size changed -- upstream version updated
      changed.push({
        fullPath,
        reason: `size changed: ${entry.sizeKb} -> ${indexPkg.sizeKb}`,
      });
    } else {
      // Size matches -- no change detected
      unchanged++;
    }
  }

  // Walk INDEX to find new packages
  const newPackages: string[] = [];
  for (const pkg of indexPackages) {
    if (!(pkg.fullPath in state.entries)) {
      newPackages.push(pkg.fullPath);
    }
  }

  return {
    changed,
    newPackages,
    removed,
    unchanged,
    totalLocal: Object.keys(state.entries).length,
    totalRemote: indexPackages.length,
  };
}

/**
 * Convenience wrapper: return only new package fullPaths.
 *
 * @param state - Local mirror state
 * @param indexPackages - Current INDEX packages
 * @returns Array of fullPaths present in INDEX but not in mirror state
 */
export function detectNewPackages(
  state: MirrorState,
  indexPackages: AminetPackage[],
): string[] {
  return detectChanges(state, indexPackages).newPackages;
}

/**
 * Convenience wrapper: return only removed package fullPaths.
 *
 * @param state - Local mirror state
 * @param indexPackages - Current INDEX packages
 * @returns Array of fullPaths present in mirror state but not in INDEX
 */
export function detectRemovedPackages(
  state: MirrorState,
  indexPackages: AminetPackage[],
): string[] {
  return detectChanges(state, indexPackages).removed;
}
