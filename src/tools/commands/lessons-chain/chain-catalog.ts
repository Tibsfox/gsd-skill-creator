/**
 * @file Lessons-learned catalog builder and pattern detector
 * @description Builds cumulative lessons catalogs across milestone series
 *              and flags recurring patterns for codification into tooling.
 *              Consumed by the combined chain runner (Plan 03) and CLI (Phase 561).
 * @module tools/commands/lessons-chain
 */
import type { ChainConfig, LessonEntry, LessonsCatalog } from './chain-types.js';

/**
 * Parameters for building a cumulative lessons catalog.
 */
interface CatalogParams {
  milestoneRange: { from: string; to: string };
  lessonsByMilestone: Array<{ milestoneId: string; lessons: LessonEntry[] }>;
}

/**
 * Builds a cumulative lessons catalog from multiple milestones.
 * Merges duplicate lesson entries by id, summing recurrence counts
 * and keeping the earliest firstSeenMilestone.
 *
 * @param params - Catalog building parameters
 * @returns LessonsCatalog with merged entries and pattern counts
 */
export function buildLessonsCatalog(params: CatalogParams): LessonsCatalog {
  const { milestoneRange, lessonsByMilestone } = params;

  // Merge lessons by id
  const merged = new Map<string, LessonEntry>();

  for (const { lessons } of lessonsByMilestone) {
    for (const lesson of lessons) {
      const existing = merged.get(lesson.id);
      if (existing) {
        // Merge: sum recurrence, keep earliest firstSeenMilestone, update other fields
        merged.set(lesson.id, {
          ...lesson,
          recurrenceCount: existing.recurrenceCount + lesson.recurrenceCount,
          firstSeenMilestone: existing.firstSeenMilestone < lesson.firstSeenMilestone
            ? existing.firstSeenMilestone
            : lesson.firstSeenMilestone,
          tags: [...new Set([...existing.tags, ...lesson.tags])],
        });
      } else {
        merged.set(lesson.id, { ...lesson });
      }
    }
  }

  const entries = Array.from(merged.values());
  const allTags = new Set<string>();
  for (const entry of entries) {
    for (const tag of entry.tags) {
      allTags.add(tag);
    }
  }

  return {
    milestoneRange,
    entries,
    promotedPatterns: [],
    totalLessons: entries.length,
    uniquePatterns: allTags.size,
  };
}

/**
 * Scans a lessons catalog and identifies entries that recur at or above
 * the configured threshold. These are candidates for codification into
 * tooling or enforcement rules.
 *
 * Does not mutate the input catalog -- returns a new object.
 *
 * @param config - Chain configuration with patternPromotionThreshold
 * @param catalog - Lessons catalog to scan
 * @returns New LessonsCatalog with promotedPatterns populated
 */
export function flagRecurringPatterns(
  config: ChainConfig,
  catalog: LessonsCatalog
): LessonsCatalog {
  const promotedPatterns = catalog.entries
    .filter((entry) => entry.recurrenceCount >= config.patternPromotionThreshold)
    .map((entry) => entry.id);

  return {
    ...catalog,
    promotedPatterns,
  };
}
