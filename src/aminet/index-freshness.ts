/**
 * INDEX freshness detection and incremental update via RECENT.
 *
 * The Aminet RECENT file lists packages added in the last ~7 days.
 * By merging RECENT entries into the cached INDEX JSON, we keep the
 * catalog current without re-downloading the full ~1.8MB INDEX.gz.
 *
 * Flow:
 * 1. checkFreshness() -- is the cached INDEX older than 24 hours?
 * 2. fetchRecent()    -- download and parse the RECENT file
 * 3. mergeRecentIntoIndex() -- upsert RECENT entries into cached INDEX
 *
 * @module
 */

import type { IndexMetadata, AminetMirrorConfig, AminetPackage, AminetIndex, FreshnessCheck } from './types.js';
import { parseIndexLine } from './index-parser.js';

// ============================================================================
// checkFreshness
// ============================================================================

/** Default maximum cache age: 24 hours in milliseconds. */
const DEFAULT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Check whether the cached INDEX is stale and recommend an update strategy.
 *
 * @param metadata - Cached INDEX metadata, or null if no cache exists.
 * @param maxAgeMs - Maximum age in milliseconds before cache is stale. Default: 24h.
 * @returns FreshnessCheck with staleness flag, age metrics, and recommendation.
 */
export function checkFreshness(
  metadata: IndexMetadata | null,
  maxAgeMs: number = DEFAULT_MAX_AGE_MS,
): FreshnessCheck {
  // No cache at all -> stale_full (must download entire INDEX)
  if (metadata === null) {
    return {
      isStale: true,
      ageMs: Infinity,
      ageHours: Infinity,
      cachedAt: '',
      recommendation: 'stale_full',
    };
  }

  const fetchedAtMs = new Date(metadata.fetchedAt).getTime();
  const ageMs = Date.now() - fetchedAtMs;
  const ageHours = ageMs / (60 * 60 * 1000);
  const isStale = ageMs > maxAgeMs;

  return {
    isStale,
    ageMs,
    ageHours,
    cachedAt: metadata.fetchedAt,
    recommendation: isStale ? 'stale_incremental' : 'current',
  };
}

// ============================================================================
// fetchRecent
// ============================================================================

/**
 * Fetch and parse the Aminet RECENT file from the first configured mirror.
 *
 * RECENT is a plain-text file (not gzipped) with the same fixed-width
 * column format as the INDEX, listing packages added in the last ~7 days.
 * We reuse `parseIndexLine` from the INDEX parser so that AminetPackage
 * objects have identical shape regardless of source.
 *
 * @param config - Mirror configuration (uses first mirror).
 * @returns Parsed array of recently-added packages.
 * @throws Error if HTTP fetch fails.
 */
export async function fetchRecent(config: AminetMirrorConfig): Promise<AminetPackage[]> {
  const mirror = config.mirrors[0];
  const url = `${mirror}/aminet/RECENT`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { 'User-Agent': config.userAgent },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching RECENT from ${url}`);
  }

  const text = await response.text();

  // Parse each line using the same parser as INDEX
  const packages: AminetPackage[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const pkg = parseIndexLine(line);
    if (pkg !== null) {
      packages.push(pkg);
    }
  }

  return packages;
}

// ============================================================================
// mergeRecentIntoIndex
// ============================================================================

/**
 * Merge RECENT packages into an existing cached AminetIndex.
 *
 * Packages are keyed by `fullPath` (e.g., "util/misc/MyTool.lha").
 * If a RECENT entry has the same fullPath as an existing package, it
 * replaces the old one (newer version wins). New entries are added.
 *
 * Returns a new AminetIndex with:
 * - Updated packages array (existing + new, duplicates replaced)
 * - parsedAt set to current time
 * - totalLines recalculated
 * - parseErrors preserved from original
 *
 * @param existing - The cached AminetIndex to update.
 * @param recentPackages - Packages parsed from the RECENT file.
 * @returns A new AminetIndex with RECENT entries merged in.
 */
export function mergeRecentIntoIndex(
  existing: AminetIndex,
  recentPackages: AminetPackage[],
): AminetIndex {
  // Build a Map keyed by fullPath for O(1) lookup
  const packageMap = new Map<string, AminetPackage>();

  // Add all existing packages
  for (const pkg of existing.packages) {
    packageMap.set(pkg.fullPath, pkg);
  }

  // Upsert RECENT packages (newer wins for same fullPath)
  for (const pkg of recentPackages) {
    packageMap.set(pkg.fullPath, pkg);
  }

  const packages = Array.from(packageMap.values());

  return {
    packages,
    parseErrors: existing.parseErrors,
    totalLines: packages.length + 2, // approximate: data lines + header/separator
    parsedAt: new Date().toISOString(),
  };
}
