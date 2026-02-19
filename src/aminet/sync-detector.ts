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
 * Compare mirror state against current INDEX to detect changes.
 *
 * @param _state - Local mirror state
 * @param _indexPackages - Current INDEX packages
 * @returns SyncReport with change details
 */
export function detectChanges(
  _state: MirrorState,
  _indexPackages: AminetPackage[],
): SyncReport {
  // TODO: implement
  throw new Error('Not implemented');
}

/**
 * Convenience wrapper: return only new package fullPaths.
 */
export function detectNewPackages(
  _state: MirrorState,
  _indexPackages: AminetPackage[],
): string[] {
  // TODO: implement
  throw new Error('Not implemented');
}

/**
 * Convenience wrapper: return only removed package fullPaths.
 */
export function detectRemovedPackages(
  _state: MirrorState,
  _indexPackages: AminetPackage[],
): string[] {
  // TODO: implement
  throw new Error('Not implemented');
}
