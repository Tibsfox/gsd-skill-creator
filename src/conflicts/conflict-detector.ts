/**
 * Conflict detection using semantic similarity.
 *
 * Identifies skill pairs that have overlapping functionality by
 * computing pairwise cosine similarity on their embedding vectors.
 */

import { getEmbeddingService, cosineSimilarity } from '../embeddings/index.js';
import type { ConflictConfig, ConflictPair, ConflictResult } from '../types/conflicts.js';

/** Default similarity threshold for conflict detection */
const DEFAULT_THRESHOLD = 0.85;

/** Minimum allowed threshold */
const MIN_THRESHOLD = 0.5;

/** Maximum allowed threshold */
const MAX_THRESHOLD = 0.95;

/** Threshold for 'high' severity (above this = high) */
const HIGH_SEVERITY_THRESHOLD = 0.90;

/**
 * Common stop words to filter out when extracting overlapping terms.
 * These words don't indicate semantic overlap.
 */
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
  'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by',
  'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above',
  'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here',
  'there', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both',
  'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
  'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'just',
  'don', 'now', 'and', 'but', 'or', 'if', 'because', 'until', 'while',
  'this', 'that', 'these', 'those', 'am', 'it', 'its', 'he', 'she', 'they',
  'them', 'his', 'her', 'their', 'we', 'you', 'your', 'our', 'my', 'what',
  'which', 'who', 'whom', 'any', 'also', 'about', 'over', 'out', 'up',
  'down', 'off', 'yet', 'even', 'like', 'get', 'make', 'use', 'using',
]);

/**
 * Detects semantic conflicts between skills using embedding similarity.
 *
 * Skills with high semantic similarity (above the threshold) are
 * considered potential conflicts, as they may have overlapping functionality.
 *
 * @example
 * ```typescript
 * const detector = new ConflictDetector({ threshold: 0.85 });
 * const result = await detector.detect(skills);
 * console.log(`Found ${result.conflicts.length} conflicts`);
 * ```
 */
export class ConflictDetector {
  private readonly threshold: number;

  /**
   * Create a new conflict detector.
   *
   * @param config - Optional configuration with threshold
   */
  constructor(config?: ConflictConfig) {
    this.threshold = this.clampThreshold(config?.threshold ?? DEFAULT_THRESHOLD);
  }

  /**
   * Clamp threshold to valid range [0.5, 0.95].
   * Logs a warning if the value was clamped.
   */
  private clampThreshold(value: number): number {
    if (value < MIN_THRESHOLD) {
      console.warn(
        `Threshold ${value} is below minimum ${MIN_THRESHOLD}, clamping to ${MIN_THRESHOLD}`
      );
      return MIN_THRESHOLD;
    }
    if (value > MAX_THRESHOLD) {
      console.warn(
        `Threshold ${value} is above maximum ${MAX_THRESHOLD}, clamping to ${MAX_THRESHOLD}`
      );
      return MAX_THRESHOLD;
    }
    return value;
  }

  /**
   * Extract overlapping domain-specific terms from two descriptions.
   * Filters out stop words to focus on meaningful terms.
   */
  private extractOverlappingTerms(descA: string, descB: string): string[] {
    // Tokenize and normalize
    const tokenize = (text: string): Set<string> => {
      const words = text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, ' ')
        .split(/\s+/)
        .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
      return new Set(words);
    };

    const wordsA = tokenize(descA);
    const wordsB = tokenize(descB);

    // Find intersection
    const overlapping: string[] = [];
    for (const word of wordsA) {
      if (wordsB.has(word)) {
        overlapping.push(word);
      }
    }

    // Sort alphabetically for consistency
    return overlapping.sort();
  }

  /**
   * Compute severity based on similarity score.
   * - 'high': similarity > 0.90
   * - 'medium': similarity >= threshold but <= 0.90
   */
  private computeSeverity(similarity: number): 'high' | 'medium' {
    return similarity > HIGH_SEVERITY_THRESHOLD ? 'high' : 'medium';
  }

  /**
   * Detect conflicts among a set of skills.
   *
   * Computes pairwise similarity for all skill combinations and
   * returns pairs that exceed the configured threshold.
   *
   * @param skills - Array of skills with name and description
   * @returns Conflict detection results with all detected pairs
   */
  async detect(
    skills: Array<{ name: string; description: string }>
  ): Promise<ConflictResult> {
    // Handle edge cases
    if (skills.length < 2) {
      return {
        conflicts: [],
        skillCount: skills.length,
        pairsAnalyzed: 0,
        threshold: this.threshold,
        analysisMethod: 'heuristic', // No actual analysis performed
      };
    }

    // Get embedding service
    const embeddingService = await getEmbeddingService();

    // Batch embed all descriptions
    const descriptions = skills.map((s) => s.description);
    const skillNames = skills.map((s) => s.name);
    const results = await embeddingService.embedBatch(descriptions, skillNames);

    // Track analysis method from first result
    const analysisMethod = results[0]?.method ?? 'heuristic';

    // Extract embeddings
    const embeddings = results.map((r) => r.embedding);

    // Compute pairwise similarities
    const conflicts: ConflictPair[] = [];
    let pairsAnalyzed = 0;

    for (let i = 0; i < skills.length; i++) {
      for (let j = i + 1; j < skills.length; j++) {
        pairsAnalyzed++;

        const similarity = cosineSimilarity(embeddings[i], embeddings[j]);

        // Check if above threshold
        if (similarity >= this.threshold) {
          const overlappingTerms = this.extractOverlappingTerms(
            skills[i].description,
            skills[j].description
          );

          conflicts.push({
            skillA: skills[i].name,
            skillB: skills[j].name,
            similarity,
            severity: this.computeSeverity(similarity),
            overlappingTerms,
            descriptionA: skills[i].description,
            descriptionB: skills[j].description,
          });
        }
      }
    }

    // Sort by similarity (highest first)
    conflicts.sort((a, b) => b.similarity - a.similarity);

    return {
      conflicts,
      skillCount: skills.length,
      pairsAnalyzed,
      threshold: this.threshold,
      analysisMethod,
    };
  }
}
