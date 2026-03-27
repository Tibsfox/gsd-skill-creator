/**
 * Multi-track gap merge, deduplication, and statistics generation.
 * Combines gaps from all three verification tracks (A, B, C) into
 * a unified report with deduplication and statistics.
 */

import type { GapRecord, GapType, GapSeverity, VerificationResult, GapStatistics } from './types.js';
import { GAP_TYPES, GAP_SEVERITIES } from './types.js';

/** Full gap report with track metadata */
export interface GapReport {
  result: VerificationResult;
  trackSources: Record<string, string>;
  generatedAt: string;
}

/**
 * Create a deduplication key from a gap's concept and type.
 */
function dedupKey(gap: GapRecord): string {
  return `${gap.concept}|${gap.type}`;
}

/**
 * Merge two gap records that share the same concept and type.
 * Combines analysis and affectsComponents.
 */
function mergeGaps(primary: GapRecord, secondary: GapRecord): GapRecord {
  // Merge analysis
  const mergedAnalysis = primary.analysis.includes(secondary.analysis)
    ? primary.analysis
    : `${primary.analysis} | Also: ${secondary.analysis}`;

  // Merge affectsComponents (deduplicated)
  const mergedComponents = [
    ...new Set([...primary.affectsComponents, ...secondary.affectsComponents]),
  ];

  return {
    ...primary,
    analysis: mergedAnalysis,
    affectsComponents: mergedComponents,
  };
}

/**
 * Compute gap statistics from a list of gaps.
 */
function computeStatistics(gaps: GapRecord[]): GapStatistics {
  // Initialize all types to 0
  const byType = {} as Record<GapType, number>;
  for (const type of GAP_TYPES) {
    byType[type] = 0;
  }

  // Initialize all severities to 0
  const bySeverity = {} as Record<GapSeverity, number>;
  for (const severity of GAP_SEVERITIES) {
    bySeverity[severity] = 0;
  }

  const byDocument: Record<string, number> = {};

  for (const gap of gaps) {
    // Count by type
    byType[gap.type]++;

    // Count by severity
    bySeverity[gap.severity]++;

    // Count by document
    const doc = gap.ecosystemSource === 'none' ? 'textbook-only' : gap.ecosystemSource;
    byDocument[doc] = (byDocument[doc] ?? 0) + 1;
  }

  return {
    total: gaps.length,
    byType,
    bySeverity,
    byDocument,
  };
}

/**
 * Generate a unified gap report from three verification tracks.
 *
 * 1. Concatenate all gaps from three tracks.
 * 2. Deduplicate: same concept + same type = merge.
 * 3. Assign sequential IDs.
 * 4. Compute statistics.
 */
export function generateGapReport(tracks: {
  trackA: GapRecord[];
  trackB: GapRecord[];
  trackC: GapRecord[];
}): GapReport {
  // Step 1: Concatenate all gaps
  const allGaps = [...tracks.trackA, ...tracks.trackB, ...tracks.trackC];

  // Step 2: Deduplicate
  const seen = new Map<string, GapRecord>();

  for (const gap of allGaps) {
    const key = dedupKey(gap);
    const existing = seen.get(key);
    if (existing) {
      seen.set(key, mergeGaps(existing, gap));
    } else {
      seen.set(key, { ...gap });
    }
  }

  // Step 3: Assign sequential IDs
  const dedupedGaps: GapRecord[] = [];
  let counter = 1;
  for (const gap of seen.values()) {
    dedupedGaps.push({
      ...gap,
      id: `gap-${String(counter).padStart(3, '0')}`,
    });
    counter++;
  }

  // Step 4: Compute statistics
  const statistics = computeStatistics(dedupedGaps);

  return {
    result: {
      gaps: dedupedGaps,
      statistics,
    } satisfies VerificationResult,
    trackSources: {
      trackA: 'Concept Coverage Audit',
      trackB: 'Cross-Document Consistency',
      trackC: 'Eight-Layer Progression',
    },
    generatedAt: new Date().toISOString(),
  };
}
