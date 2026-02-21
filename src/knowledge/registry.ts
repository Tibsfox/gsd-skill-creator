/**
 * In-memory pack registry.
 *
 * Central lookup service for knowledge packs. Supports register, lookup
 * by ID (O(1) via Map), list all, filter by category/tier, tag search
 * with partial matching and relevance ranking, and full-text search
 * across metadata fields.
 *
 * Pure data operations with no side effects.
 *
 * @module registry
 */

import type { KnowledgePack, PackClassification } from './types.js';

// ============================================================================
// PackRegistry
// ============================================================================

/**
 * In-memory registry for knowledge packs.
 *
 * Stores packs in a Map keyed by pack_id for O(1) lookup.
 * Provides filtering by classification/tier, tag search with partial
 * matching and relevance ranking, and full-text search across pack
 * metadata fields.
 */
export class PackRegistry {
  private packs: Map<string, KnowledgePack> = new Map();

  // --------------------------------------------------------------------------
  // Mutators
  // --------------------------------------------------------------------------

  /**
   * Register a knowledge pack. Overwrites existing pack with same pack_id.
   */
  register(pack: KnowledgePack): void {
    this.packs.set(pack.pack_id, pack);
  }

  /**
   * Remove all registered packs.
   */
  clear(): void {
    this.packs.clear();
  }

  // --------------------------------------------------------------------------
  // Lookup
  // --------------------------------------------------------------------------

  /**
   * Lookup a pack by its pack_id. O(1) via Map.
   * Returns undefined if not found.
   */
  lookup(packId: string): KnowledgePack | undefined {
    return this.packs.get(packId);
  }

  // --------------------------------------------------------------------------
  // Listing
  // --------------------------------------------------------------------------

  /**
   * Return all registered packs as an array.
   */
  listAll(): KnowledgePack[] {
    return Array.from(this.packs.values());
  }

  /**
   * Filter packs by classification tier (core_academic, applied, specialized).
   */
  listByCategory(classification: PackClassification): KnowledgePack[] {
    return this.listAll().filter((pack) => pack.classification === classification);
  }

  /**
   * Alias for listByCategory. Tier and classification are the same concept.
   */
  listByTier(tier: string): KnowledgePack[] {
    return this.listByCategory(tier as PackClassification);
  }

  // --------------------------------------------------------------------------
  // Tag search
  // --------------------------------------------------------------------------

  /**
   * Search packs by tags with partial matching (starts-with) and OR logic.
   *
   * For each pack, counts how many query tags match any of the pack's tags
   * (a query tag matches if any pack tag starts with it, case-insensitive).
   * Results are sorted descending by match count (relevance ranking).
   * Only packs with at least one match are returned.
   *
   * @param tags - Array of tag query strings
   * @returns Packs matching any tag, sorted by number of matches (descending)
   */
  searchByTags(tags: string[]): KnowledgePack[] {
    const lowerTags = tags.map((t) => t.toLowerCase());

    const scored: Array<{ pack: KnowledgePack; score: number }> = [];

    for (const pack of this.packs.values()) {
      const packTagsLower = pack.tags.map((t) => t.toLowerCase());
      let matchCount = 0;

      for (const queryTag of lowerTags) {
        // A query tag matches if any pack tag starts with it
        if (packTagsLower.some((pt) => pt.startsWith(queryTag))) {
          matchCount++;
        }
      }

      if (matchCount > 0) {
        scored.push({ pack, score: matchCount });
      }
    }

    // Sort descending by score (relevance ranking)
    scored.sort((a, b) => b.score - a.score);

    return scored.map((s) => s.pack);
  }

  // --------------------------------------------------------------------------
  // Full-text search
  // --------------------------------------------------------------------------

  /**
   * Search across pack_id, pack_name, description, short_description,
   * and tags. Case-insensitive substring matching. Scored by number of
   * field matches, sorted descending.
   *
   * @param query - Search query string
   * @returns Matching packs sorted by relevance (number of field matches)
   */
  search(query: string): KnowledgePack[] {
    const lowerQuery = query.toLowerCase();

    const scored: Array<{ pack: KnowledgePack; score: number }> = [];

    for (const pack of this.packs.values()) {
      let fieldMatches = 0;

      // Search across metadata fields
      if (pack.pack_id.toLowerCase().includes(lowerQuery)) fieldMatches++;
      if (pack.pack_name.toLowerCase().includes(lowerQuery)) fieldMatches++;
      if (pack.description.toLowerCase().includes(lowerQuery)) fieldMatches++;
      if (pack.short_description && pack.short_description.toLowerCase().includes(lowerQuery)) fieldMatches++;

      // Search tags
      if (pack.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))) {
        fieldMatches++;
      }

      if (fieldMatches > 0) {
        scored.push({ pack, score: fieldMatches });
      }
    }

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);

    return scored.map((s) => s.pack);
  }

  // --------------------------------------------------------------------------
  // Metadata
  // --------------------------------------------------------------------------

  /**
   * Number of registered packs.
   */
  get count(): number {
    return this.packs.size;
  }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a new empty PackRegistry instance.
 */
export function createRegistry(): PackRegistry {
  return new PackRegistry();
}
