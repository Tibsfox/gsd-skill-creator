/**
 * Database merger — combines Track A and Track B concept outputs into
 * a unified, deduplicated concept database with coverage statistics.
 */

import type { LearnedConcept, EcosystemMapping } from './types.js';
import { updatePositionForDepth } from './position-mapper.js';

/** Coverage statistics for the merged database */
export interface CoverageStatistics {
  totalUniqueConcepts: number;
  perPartCounts: Record<number, number>;
  crossTrackOverlap: number;
  trackAConcepts: number;
  trackBConcepts: number;
}

/** Result of merging two track databases */
export interface MergeResult {
  concepts: LearnedConcept[];
  statistics: CoverageStatistics;
  duplicatesResolved: Array<{ name: string; trackAChapter: number; trackBChapter: number }>;
}

/**
 * Merge concept databases from Track A and Track B into a unified,
 * deduplicated database with coverage statistics.
 *
 * Deduplication strategy:
 * - Case-insensitive name matching
 * - Higher-confidence detection becomes primary
 * - Progressive depth via updatePositionForDepth for cross-track duplicates
 * - Ecosystem mappings combined (union, deduplicated by document+section)
 * - Prerequisites, keyRelationships, applications merged via set union
 */
export function mergeDatabases(
  trackA: LearnedConcept[],
  trackB: LearnedConcept[],
): MergeResult {
  const allConcepts = [...trackA, ...trackB];

  // Build name index: group all concepts by normalized name
  const nameIndex = new Map<string, LearnedConcept[]>();
  for (const concept of allConcepts) {
    const key = concept.name.toLowerCase().trim();
    const group = nameIndex.get(key) ?? [];
    group.push(concept);
    nameIndex.set(key, group);
  }

  const merged: LearnedConcept[] = [];
  const duplicatesResolved: MergeResult['duplicatesResolved'] = [];

  // Track which concepts came from which track
  const trackANames = new Set(trackA.map(c => c.name.toLowerCase().trim()));
  const trackBNames = new Set(trackB.map(c => c.name.toLowerCase().trim()));

  for (const [_key, group] of nameIndex) {
    if (group.length === 1) {
      // Unique concept — pass through directly
      merged.push(cloneConcept(group[0]));
    } else {
      // Duplicate detected — merge
      // Sort by confidence descending; highest becomes primary
      const sorted = [...group].sort((a, b) => b.confidence - a.confidence);
      const primary = cloneConcept(sorted[0]);

      for (let i = 1; i < sorted.length; i++) {
        const secondary = sorted[i];

        // Progressive depth: update position
        const updatedPos = updatePositionForDepth(
          {
            theta: primary.theta,
            radius: primary.radius,
            angularVelocity: primary.angularVelocity,
            abstractionLevel: primary.abstractionLevel,
          },
          secondary.confidence,
        );
        primary.radius = updatedPos.radius;
        primary.angularVelocity = updatedPos.angularVelocity;

        // Merge ecosystem mappings (union, dedup by document+section)
        primary.ecosystemMappings = mergeEcosystemMappings(
          primary.ecosystemMappings,
          secondary.ecosystemMappings,
        );

        // Merge array fields via set union
        primary.prerequisites = mergeArrays(primary.prerequisites, secondary.prerequisites);
        primary.keyRelationships = mergeArrays(primary.keyRelationships, secondary.keyRelationships);
        primary.applications = mergeArrays(primary.applications, secondary.applications);

        // Record the duplicate resolution
        const trackAEntry = group.find(c => c.sourcePart >= 1 && c.sourcePart <= 5);
        const trackBEntry = group.find(c => c.sourcePart >= 6 && c.sourcePart <= 10);
        if (trackAEntry && trackBEntry) {
          duplicatesResolved.push({
            name: primary.name,
            trackAChapter: trackAEntry.sourceChapter,
            trackBChapter: trackBEntry.sourceChapter,
          });
        }
      }

      merged.push(primary);
    }
  }

  // Validation pass: ensure coordinates are valid
  for (const concept of merged) {
    concept.theta = Math.max(0, Math.min(concept.theta, 2 * Math.PI));
    concept.radius = Math.max(0.001, Math.min(concept.radius, 1.0));
  }

  // Compute coverage statistics
  const perPartCounts: Record<number, number> = {};
  for (const concept of merged) {
    perPartCounts[concept.sourcePart] = (perPartCounts[concept.sourcePart] ?? 0) + 1;
  }

  // Cross-track overlap: concepts that appeared in both tracks
  let crossTrackOverlap = 0;
  for (const key of trackANames) {
    if (trackBNames.has(key)) {
      crossTrackOverlap++;
    }
  }

  const statistics: CoverageStatistics = {
    totalUniqueConcepts: merged.length,
    perPartCounts,
    crossTrackOverlap,
    trackAConcepts: trackA.length,
    trackBConcepts: trackB.length,
  };

  return { concepts: merged, statistics, duplicatesResolved };
}

/**
 * Merge two arrays of ecosystem mappings, deduplicating by document+section.
 */
function mergeEcosystemMappings(
  a: EcosystemMapping[],
  b: EcosystemMapping[],
): EcosystemMapping[] {
  const seen = new Set<string>();
  const result: EcosystemMapping[] = [];

  for (const mapping of [...a, ...b]) {
    const key = `${mapping.document}::${mapping.section}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(mapping);
  }

  return result;
}

/**
 * Merge two string arrays via set union (no duplicates).
 */
function mergeArrays(a: string[], b: string[]): string[] {
  return [...new Set([...a, ...b])];
}

/**
 * Deep clone a LearnedConcept to avoid mutations.
 */
function cloneConcept(concept: LearnedConcept): LearnedConcept {
  return {
    ...concept,
    keyRelationships: [...concept.keyRelationships],
    prerequisites: [...concept.prerequisites],
    applications: [...concept.applications],
    ecosystemMappings: concept.ecosystemMappings.map(m => ({ ...m })),
  };
}
