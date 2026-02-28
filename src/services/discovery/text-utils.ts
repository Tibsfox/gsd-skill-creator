/**
 * Shared text processing utilities for discovery module.
 *
 * Extracted from candidate-ranker.ts and cluster-scorer.ts to eliminate
 * duplication (QUAL-04).
 */

// ============================================================================
// Constants
// ============================================================================

/**
 * Common English stopwords to filter out when extracting keywords.
 * Includes articles, conjunctions, prepositions, and pronouns.
 */
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'when', 'use', 'for', 'with',
  'this', 'that', 'from', 'to', 'in', 'of', 'is', 'it', 'on',
  'me', 'my', 'i', 'we', 'our', 'you', 'your',
]);

// ============================================================================
// Keyword Extraction
// ============================================================================

/**
 * Extract meaningful keywords from text by:
 * - Converting to lowercase
 * - Splitting on whitespace and hyphens
 * - Filtering out stopwords and empty strings
 *
 * @param text - Input text to extract keywords from
 * @returns Set of unique keywords
 */
export function extractKeywords(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .split(/[\s-]+/)
    .filter(w => w.length > 0 && !STOPWORDS.has(w));
  return new Set(words);
}

// ============================================================================
// Similarity
// ============================================================================

/**
 * Compute Jaccard similarity between two sets.
 *
 * Formula: |A ∩ B| / |A ∪ B|
 *
 * Returns a value between 0 (no overlap) and 1 (identical sets).
 * Returns 0 if both sets are empty.
 *
 * @param a - First set
 * @param b - Second set
 * @returns Jaccard similarity coefficient (0-1)
 */
export function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;

  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) intersection++;
  }

  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}
