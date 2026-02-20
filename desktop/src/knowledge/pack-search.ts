/**
 * Knowledge Pack search engine with multi-field filtering and
 * prerequisite-chain ranking.
 *
 * Searches across pack IDs, names, descriptions, tags, grade levels,
 * learning outcomes, and module names. Results sort by topological
 * order (foundational packs first). No debouncing -- that is the
 * panel's responsibility.
 *
 * @module knowledge/pack-search
 */

import type { PackCardView, SearchResult, SearchScope } from "./types";

/** Constructor options for PackSearch */
export interface PackSearchOptions {
  packs: PackCardView[];
  topologicalOrder: string[];
}

/**
 * Real-time search engine for knowledge packs.
 *
 * Performs case-insensitive substring matching across multiple metadata
 * fields. Results are scored by number of fields matched (for minimum
 * relevance filtering) and sorted by topological order position
 * (foundational packs first).
 */
export class PackSearch {
  private packs: PackCardView[];
  private readonly topologicalOrder: string[];

  constructor(options: PackSearchOptions) {
    this.packs = options.packs;
    this.topologicalOrder = options.topologicalOrder;
  }

  /**
   * Search packs by query string across all metadata fields.
   *
   * @param query - Search string (case-insensitive substring match)
   * @param scope - "all" to search all packs, "tier" to filter by currentTier
   * @param currentTier - Required when scope is "tier"; the classification to filter by
   * @returns Matched packs sorted by topological order (foundational first)
   */
  search(query: string, scope: SearchScope, currentTier?: string): SearchResult[] {
    const trimmed = query.trim();
    if (trimmed.length === 0) return [];

    const needle = trimmed.toLowerCase();

    let candidates = this.packs;
    if (scope === "tier" && currentTier) {
      candidates = candidates.filter((p) => p.classification === currentTier);
    }

    const results: SearchResult[] = [];

    for (const pack of candidates) {
      const matchedFields: string[] = [];

      // Check each searchable field
      if (pack.packId.toLowerCase().includes(needle)) {
        matchedFields.push("packId");
      }
      if (pack.packName.toLowerCase().includes(needle)) {
        matchedFields.push("packName");
      }
      if (pack.description.toLowerCase().includes(needle)) {
        matchedFields.push("description");
      }
      if (pack.gradeRange.toLowerCase().includes(needle)) {
        matchedFields.push("gradeRange");
      }
      if (pack.tags.some((t) => t.toLowerCase().includes(needle))) {
        matchedFields.push("tags");
      }
      if (pack.learningOutcomes.some((o) => o.toLowerCase().includes(needle))) {
        matchedFields.push("learningOutcomes");
      }
      if (pack.moduleNames.some((m) => m.toLowerCase().includes(needle))) {
        matchedFields.push("moduleNames");
      }

      if (matchedFields.length >= 1) {
        results.push({
          pack,
          score: matchedFields.length,
          matchedFields,
        });
      }
    }

    // Sort by topological order position (foundational packs first)
    results.sort(
      (a, b) =>
        this.getTopologicalPosition(a.pack.packId) -
        this.getTopologicalPosition(b.pack.packId),
    );

    return results;
  }

  /** Replace the pack dataset (e.g., after progress updates) */
  updatePacks(packs: PackCardView[]): void {
    this.packs = packs;
  }

  // --------------------------------------------------------------------------
  // Private helpers
  // --------------------------------------------------------------------------

  /** Returns index in topologicalOrder, or Infinity if not found */
  private getTopologicalPosition(packId: string): number {
    const idx = this.topologicalOrder.indexOf(packId);
    return idx === -1 ? Infinity : idx;
  }
}
