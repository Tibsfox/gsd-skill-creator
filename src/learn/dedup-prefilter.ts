// === Dedup Pre-filter ===
//
// Fast plane-proximity + keyword-overlap pre-screening for the deduplication
// pipeline. Identifies candidates likely to be duplicates of existing registry
// content using Euclidean distance on the Complex Plane and keyword intersection.
//
// This is the first stage: it eliminates obviously-new primitives cheaply so the
// semantic comparator (348-02) only processes realistic duplicate candidates.

import type { MathematicalPrimitive, PlanePosition } from '../core/types/mfe-types.js';

// === Exported Types ===

export interface PrefilterConfig {
  maxDistance: number;        // Default: 0.2
  minSharedKeywords: number; // Default: 2
}

export interface PrefilterMatch {
  existingId: string;        // ID of the matched existing primitive
  distance: number;          // Euclidean distance on Complex Plane
  sharedKeywords: string[];  // Keywords in common
}

export interface PrefilterResult {
  candidateId: string;
  matches: PrefilterMatch[]; // Ranked by proximity (closest first)
  flagged: boolean;          // true if matches.length > 0
}

// === Helpers ===

const DEFAULT_CONFIG: PrefilterConfig = {
  maxDistance: 0.2,
  minSharedKeywords: 2,
};

/**
 * Euclidean distance between two positions on the Complex Plane.
 * Exported for reuse by the semantic comparator (348-02).
 */
export function planeDistance(a: PlanePosition, b: PlanePosition): number {
  return Math.sqrt((a.real - b.real) ** 2 + (a.imaginary - b.imaginary) ** 2);
}

/**
 * Case-insensitive keyword intersection.
 */
function findSharedKeywords(a: string[], b: string[]): string[] {
  const setB = new Set(b.map(k => k.toLowerCase()));
  const shared: string[] = [];
  const seen = new Set<string>();

  for (const keyword of a) {
    const lower = keyword.toLowerCase();
    if (setB.has(lower) && !seen.has(lower)) {
      shared.push(lower);
      seen.add(lower);
    }
  }

  return shared;
}

// === Main Function ===

/**
 * Pre-filter candidates against the existing registry using plane proximity
 * and keyword overlap. Both conditions must be met (AND logic):
 * - Euclidean distance <= maxDistance
 * - Shared keywords >= minSharedKeywords
 *
 * Returns matches ranked by proximity (closest first).
 */
export function prefilterDuplicates(
  candidate: MathematicalPrimitive,
  existingPrimitives: MathematicalPrimitive[],
  config?: Partial<PrefilterConfig>,
): PrefilterResult {
  const cfg: PrefilterConfig = { ...DEFAULT_CONFIG, ...config };
  const matches: PrefilterMatch[] = [];

  for (const existing of existingPrimitives) {
    // Fast distance rejection
    const dist = planeDistance(candidate.planePosition, existing.planePosition);
    if (dist > cfg.maxDistance) {
      continue;
    }

    // Keyword overlap check
    const shared = findSharedKeywords(candidate.keywords, existing.keywords);
    if (shared.length < cfg.minSharedKeywords) {
      continue;
    }

    matches.push({
      existingId: existing.id,
      distance: dist,
      sharedKeywords: shared,
    });
  }

  // Sort by proximity (closest first)
  matches.sort((a, b) => a.distance - b.distance);

  return {
    candidateId: candidate.id,
    matches,
    flagged: matches.length > 0,
  };
}
