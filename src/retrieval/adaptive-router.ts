import type { RouteDecision } from './types.js';

/**
 * AdaptiveRouter classifies queries into TF-IDF fast path or
 * embedding semantic path based on query complexity heuristics.
 *
 * Design decisions:
 * - Synchronous (no async) — routing must be < 1ms
 * - Pre-compiled regex in constructor — avoid recompilation per call
 * - Default to TF-IDF for moderate queries — faster is better when
 *   semantic depth isn't needed
 * - Semantic markers detect natural language intent even in short queries
 */
export class AdaptiveRouter {
  /** Pre-compiled regex for semantic intent markers */
  private readonly semanticMarkers: RegExp;
  /** Pre-compiled regex for exact skill name patterns (hyphenated) */
  private readonly exactNamePattern: RegExp;

  constructor() {
    // Semantic markers: question words, intent phrases
    this.semanticMarkers = /\b(how|what|why|which|find|help\s+me|i\s+need|looking\s+for|similar\s+to)\b/i;
    // Exact name pattern: word characters with hyphens (e.g., "git-commit", "my-skill-name")
    this.exactNamePattern = /^[\w][\w-]*[\w]$/;
  }

  /**
   * Classify a query into a retrieval strategy.
   *
   * @param query - The search query to classify
   * @returns RouteDecision with strategy and human-readable reason
   */
  classify(query: string): RouteDecision {
    const trimmed = query.trim();

    // Empty/whitespace -> fast path
    if (!trimmed) {
      return { strategy: 'tfidf', reason: 'empty_query' };
    }

    const words = trimmed.split(/\s+/);
    const wordCount = words.length;

    // Single word -> fast path (keyword lookup)
    if (wordCount === 1) {
      // Check if it's a hyphenated exact name
      if (this.isExactNamePattern(trimmed)) {
        return { strategy: 'tfidf', reason: 'exact_name' };
      }
      return { strategy: 'tfidf', reason: 'simple_keyword' };
    }

    // Multi-word but exact hyphenated name pattern (no spaces, has hyphens)
    if (this.isExactNamePattern(trimmed)) {
      return { strategy: 'tfidf', reason: 'exact_name' };
    }

    // Check semantic markers (even short queries can be semantic)
    if (this.hasSemanticMarkers(trimmed)) {
      return { strategy: 'embedding', reason: 'semantic_markers' };
    }

    // Short queries (2 words) without semantic markers -> fast path
    if (wordCount <= 2) {
      return { strategy: 'tfidf', reason: 'simple_keyword' };
    }

    // Long queries (5+ words) -> semantic path
    if (wordCount >= 5) {
      return { strategy: 'embedding', reason: 'complex_semantic' };
    }

    // Moderate queries (3-4 words, no semantic markers) -> fast path
    return { strategy: 'tfidf', reason: 'moderate_default' };
  }

  /**
   * Check if query matches an exact skill name pattern (hyphenated).
   * Matches patterns like "git-commit", "my-skill-name".
   */
  private isExactNamePattern(query: string): boolean {
    return this.exactNamePattern.test(query) && query.includes('-');
  }

  /**
   * Check if query contains semantic intent markers.
   */
  private hasSemanticMarkers(query: string): boolean {
    return this.semanticMarkers.test(query);
  }
}
