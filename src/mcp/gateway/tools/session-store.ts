/**
 * Session intelligence store for the GSD-OS MCP gateway.
 *
 * Provides queryable access to cross-project intelligence and detected
 * patterns. Supports text-based query matching with keyword scoring
 * and domain-filtered pattern retrieval.
 *
 * @module mcp/gateway/tools/session-store
 */

import type {
  IntelligenceEntry,
  PatternRecord,
  SessionMatch,
} from './session-types.js';

// ── Session Store ───────────────────────────────────────────────────────────

/**
 * Queryable store for cross-project intelligence and patterns.
 *
 * Maintains in-memory collections of intelligence entries and pattern
 * records. Provides ranked query matching and domain-filtered pattern
 * retrieval for the session:* gateway tools.
 */
export class SessionStore {
  private readonly entries: IntelligenceEntry[] = [];
  private readonly patterns: PatternRecord[] = [];

  /**
   * Add an intelligence entry to the store.
   */
  addEntry(entry: IntelligenceEntry): void {
    this.entries.push(entry);
  }

  /**
   * Add a detected pattern to the store.
   */
  addPattern(pattern: PatternRecord): void {
    this.patterns.push(pattern);
  }

  /**
   * Query cross-project intelligence.
   *
   * Performs substring and keyword matching against entry content,
   * returning results ranked by relevance score.
   *
   * @param query - Search query string
   * @param projectFilter - Optional project name to filter by
   * @param limit - Maximum results to return (default 20)
   * @returns Ranked session matches
   */
  query(query: string, projectFilter?: string, limit: number = 20): SessionMatch[] {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter((w) => w.length > 0);

    if (queryWords.length === 0) {
      return [];
    }

    const scored: Array<{ entry: IntelligenceEntry; score: number }> = [];

    for (const entry of this.entries) {
      // Apply project filter
      if (projectFilter && entry.project !== projectFilter) {
        continue;
      }

      const contentLower = entry.content.toLowerCase();
      const tagsLower = entry.tags.map((t) => t.toLowerCase());

      let score = 0;

      // Exact substring match (highest weight)
      if (contentLower.includes(queryLower)) {
        score += 0.5;
      }

      // Individual keyword matching
      for (const word of queryWords) {
        if (contentLower.includes(word)) {
          score += 0.3 / queryWords.length;
        }
        if (tagsLower.some((t) => t.includes(word))) {
          score += 0.2 / queryWords.length;
        }
      }

      if (score > 0) {
        // Normalize to 0-1 range
        const normalizedScore = Math.min(score, 1);
        scored.push({ entry, score: normalizedScore });
      }
    }

    // Sort by score descending, then by timestamp descending for ties
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.entry.timestamp - a.entry.timestamp;
    });

    return scored.slice(0, limit).map(({ entry, score }) => ({
      id: entry.id,
      project: entry.project,
      content: entry.content,
      relevance: Math.round(score * 100) / 100,
      timestamp: entry.timestamp,
      tags: entry.tags,
    }));
  }

  /**
   * Get detected patterns, optionally filtered by domain.
   *
   * @param domain - Optional domain to filter by
   * @param minOccurrences - Minimum occurrence count (default 3)
   * @returns Matching pattern records
   */
  getPatterns(domain?: string, minOccurrences: number = 3): PatternRecord[] {
    let results = this.patterns.filter((p) => p.occurrences >= minOccurrences);

    if (domain) {
      results = results.filter((p) => p.domain === domain);
    }

    // Sort by confidence descending, then by occurrences descending
    results.sort((a, b) => {
      if (b.confidence !== a.confidence) return b.confidence - a.confidence;
      return b.occurrences - a.occurrences;
    });

    return results;
  }

  /**
   * Get the total number of intelligence entries.
   */
  get entryCount(): number {
    return this.entries.length;
  }

  /**
   * Get the total number of detected patterns.
   */
  get patternCount(): number {
    return this.patterns.length;
  }
}
