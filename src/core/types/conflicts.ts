/**
 * Type definitions for semantic conflict detection.
 *
 * These types support the ConflictDetector which identifies
 * semantically similar skill pairs using embedding-based analysis.
 */

/**
 * Configuration for conflict detection thresholds.
 *
 * The threshold determines how similar two skills must be to be
 * flagged as a potential conflict. Higher values mean stricter
 * matching (fewer false positives, possibly missing some conflicts).
 */
export interface ConflictConfig {
  /**
   * Similarity threshold for detecting conflicts.
   * Skills with similarity above this value are flagged.
   *
   * - Range: 0.5 to 0.95 (values outside are clamped)
   * - Default: 0.85 (balanced precision/recall)
   * - Higher: Fewer false positives, stricter matching
   * - Lower: Catches more potential conflicts, more false positives
   */
  threshold: number;
}

/**
 * A single detected conflict between two skills.
 *
 * Represents a pair of skills whose semantic similarity exceeds
 * the configured threshold, indicating potential functionality overlap.
 */
export interface ConflictPair {
  /**
   * Name of the first skill in the conflict pair.
   * Alphabetically ordered or by detection order.
   */
  skillA: string;

  /**
   * Name of the second skill in the conflict pair.
   */
  skillB: string;

  /**
   * Cosine similarity between the skill embeddings.
   * Range: 0 to 1, where 1 means identical semantic content.
   */
  similarity: number;

  /**
   * Severity level based on similarity score.
   * - 'high': similarity > 0.90 (very likely conflict)
   * - 'medium': similarity >= threshold but <= 0.90
   */
  severity: 'high' | 'medium';

  /**
   * Common domain-specific terms found in both descriptions.
   * Stop words (the, a, is, etc.) are filtered out.
   * Helps users understand why skills were flagged.
   */
  overlappingTerms: string[];

  /**
   * Full description of skill A for user reference.
   */
  descriptionA: string;

  /**
   * Full description of skill B for user reference.
   */
  descriptionB: string;
}

/**
 * Complete result of conflict detection analysis.
 *
 * Contains all detected conflicts plus metadata about the analysis
 * for transparency and debugging purposes.
 */
export interface ConflictResult {
  /**
   * Array of detected conflict pairs, sorted by similarity (highest first).
   * Empty array if no conflicts found above threshold.
   */
  conflicts: ConflictPair[];

  /**
   * Total number of skills analyzed.
   */
  skillCount: number;

  /**
   * Number of unique skill pairs compared.
   * Formula: n * (n-1) / 2 where n = skillCount
   */
  pairsAnalyzed: number;

  /**
   * Similarity threshold used for this analysis.
   * May differ from configured value if clamping was applied.
   */
  threshold: number;

  /**
   * Method used for generating embeddings.
   * - 'model': HuggingFace transformer model (most accurate)
   * - 'heuristic': TF-IDF fallback (when model unavailable)
   */
  analysisMethod: 'model' | 'heuristic';
}
