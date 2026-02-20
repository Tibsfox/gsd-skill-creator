/**
 * Activity suggestion engine for knowledge pack learning paths.
 *
 * Recommends next activities based on learner progress, pack state,
 * and prerequisite chains. Prioritizes in-progress packs over
 * not-started packs. Respects prerequisite ordering so learners
 * don't encounter packs with unmet prerequisites.
 *
 * @module knowledge/activity-suggestions
 */

import type {
  ActivitySuggestion,
  PackCardView,
  PackActivityView,
  PackProgress,
} from "./types";

// ============================================================================
// Options & Params
// ============================================================================

/** Configuration for the ActivitySuggester */
export interface ActivitySuggesterOptions {
  maxSuggestions?: number; // default: 5
}

/** Parameters for generating suggestions */
export interface SuggestParams {
  packs: PackCardView[];
  activities: Map<string, PackActivityView[]>; // packId -> activities
  progress: PackProgress[];
  topologicalOrder: string[]; // prerequisite chain order
}

// ============================================================================
// ActivitySuggester
// ============================================================================

/**
 * Recommends next learning activities based on pack progress,
 * prerequisite chains, and topological ordering.
 *
 * Scoring:
 * - In-progress packs: base 100 (prioritized)
 * - Not-started packs: base 50
 * - Topological bonus: 10 * (1 - position/total) (foundational first)
 * - Favorited bonus: +20
 */
export class ActivitySuggester {
  private readonly maxSuggestions: number;

  constructor(options: ActivitySuggesterOptions = {}) {
    this.maxSuggestions = options.maxSuggestions ?? 5;
  }

  /**
   * Generate activity suggestions from current learner state.
   *
   * Algorithm:
   * 1. Build progress lookup map
   * 2. Filter to in-progress and not-started packs with met prerequisites
   * 3. Score each eligible pack
   * 4. Sort by score descending
   * 5. Pick first activity from each top pack
   * 6. Return top N suggestions
   */
  suggest(params: SuggestParams): ActivitySuggestion[] {
    const { packs, activities, progress, topologicalOrder } = params;

    if (packs.length === 0) return [];

    // 1. Build progress lookup: packId -> PackProgress
    const progressMap = new Map<string, PackProgress>();
    for (const p of progress) {
      progressMap.set(p.packId, p);
    }

    // 2. Filter packs: only in-progress or not-started with met prerequisites
    const eligible = packs.filter((pack) => {
      const state = progressMap.get(pack.packId)?.state ?? pack.progress;
      if (state === "completed") return false;
      if (!pack.prerequisitesMet) return false;

      // Must have activities
      const packActivities = activities.get(pack.packId);
      if (!packActivities || packActivities.length === 0) return false;

      return true;
    });

    if (eligible.length === 0) return [];

    // 3. Score each eligible pack
    const total = topologicalOrder.length || 1;
    const scored = eligible.map((pack) => {
      const prog = progressMap.get(pack.packId);
      const state = prog?.state ?? pack.progress;
      const favorited = prog?.favorited ?? false;

      // Base score: in-progress prioritized over not-started
      let score = state === "in-progress" ? 100 : 50;

      // Topological bonus: earlier = higher priority
      const topoIdx = topologicalOrder.indexOf(pack.packId);
      if (topoIdx >= 0) {
        score += 10 * (1 - topoIdx / total);
      }

      // Favorite bonus
      if (favorited) {
        score += 20;
      }

      return { pack, score, state, favorited };
    });

    // 4. Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // 5-6. Build suggestions from top packs
    const suggestions: ActivitySuggestion[] = [];
    for (const entry of scored) {
      if (suggestions.length >= this.maxSuggestions) break;

      const packActivities = activities.get(entry.pack.packId);
      if (!packActivities || packActivities.length === 0) continue;

      const activity = packActivities[0];
      suggestions.push({
        packId: entry.pack.packId,
        packName: entry.pack.packName,
        activityId: activity.id,
        activityName: activity.name,
        durationMinutes: activity.durationMinutes,
        reason: this.buildReason(entry.pack, entry.state, entry.favorited),
      });
    }

    return suggestions;
  }

  // --------------------------------------------------------------------------
  // Private helpers
  // --------------------------------------------------------------------------

  /** Build a human-readable reason string for the suggestion */
  private buildReason(
    pack: PackCardView,
    state: string,
    favorited: boolean,
  ): string {
    if (state === "in-progress") {
      return `Continue your work in ${pack.packName}`;
    }
    if (favorited) {
      return `Start your favorited pack ${pack.packName}`;
    }
    return `Ready to begin ${pack.packName} (prerequisites met)`;
  }
}
