/**
 * SemanticMatcher - embedding-based command similarity matching.
 *
 * Wraps EmbeddingService to compute cosine similarity between user input
 * and pre-embedded command descriptions. Used as a fallback when the
 * Bayes classifier produces low-confidence results.
 *
 * Follows the ActivationSimulator pattern:
 * 1. Pre-embed all command descriptions during initialize()
 * 2. Embed user input on match()
 * 3. Compute cosine similarity and return ranked results
 */

import { getEmbeddingService, cosineSimilarity } from '../../embeddings/index.js';
import type { GsdCommandMetadata } from '../discovery/types.js';
import type { EmbeddingVector } from '../../types/embeddings.js';
import type { EmbeddingService } from '../../embeddings/embedding-service.js';

// ============================================================================
// Types
// ============================================================================

/** A semantic match result pairing a command with its cosine similarity score */
export interface SemanticMatch {
  command: GsdCommandMetadata;
  similarity: number;
}

// ============================================================================
// SemanticMatcher
// ============================================================================

/**
 * Embedding-based command matcher for semantic fallback classification.
 *
 * Pre-computes embeddings for all command descriptions during initialize(),
 * then ranks candidates by cosine similarity against user input during match().
 *
 * @example
 * ```ts
 * const matcher = new SemanticMatcher();
 * await matcher.initialize(commands);
 *
 * const matches = await matcher.match('plan the next phase', candidateNames);
 * // => [{ command: {...}, similarity: 0.85 }, ...]
 * ```
 */
export class SemanticMatcher {
  private commandEmbeddings: Map<string, EmbeddingVector> = new Map();
  private commands: Map<string, GsdCommandMetadata> = new Map();
  private embeddingService: EmbeddingService | null = null;
  private initialized: boolean = false;

  /**
   * Initialize with discovered commands by pre-computing embeddings.
   *
   * Calls getEmbeddingService() to get the singleton, init() to ensure
   * the model is loaded, then embedBatch() on all command description texts.
   *
   * @param commands - Array of GSD command metadata to embed
   */
  async initialize(commands: GsdCommandMetadata[]): Promise<void> {
    // Get the embedding service singleton and ensure it's ready
    this.embeddingService = await getEmbeddingService();
    await this.embeddingService.init();

    // Build text array: description + objective for richer semantic signal
    const texts = commands.map(cmd =>
      `${cmd.description}. ${cmd.objective ?? ''}`
    );

    // Batch embed all command descriptions
    const results = await this.embeddingService.embedBatch(texts);

    // Store embeddings and commands keyed by name
    for (let i = 0; i < commands.length; i++) {
      this.commandEmbeddings.set(commands[i].name, results[i].embedding);
      this.commands.set(commands[i].name, commands[i]);
    }

    this.initialized = true;
  }

  /**
   * Find semantic matches for user input against candidate commands.
   *
   * Embeds the input, computes cosine similarity against each candidate's
   * pre-computed embedding, and returns results sorted by similarity descending.
   *
   * @param input - Raw user input string to match
   * @param candidateNames - Set of command names to consider (lifecycle-filtered)
   * @returns Ranked array of semantic matches, highest similarity first
   */
  async match(input: string, candidateNames: Set<string>): Promise<SemanticMatch[]> {
    if (!this.initialized || !this.embeddingService) return [];
    if (candidateNames.size === 0) return [];

    // Embed the user input
    const inputResult = await this.embeddingService.embed(input);
    const inputEmbedding: EmbeddingVector = inputResult.embedding;

    // Compute similarity for each candidate
    const matches: SemanticMatch[] = [];
    for (const [name, embedding] of this.commandEmbeddings) {
      if (!candidateNames.has(name)) continue;

      const similarity = cosineSimilarity(inputEmbedding, embedding);
      const command = this.commands.get(name);
      if (command) {
        matches.push({ command, similarity });
      }
    }

    // Sort by similarity descending
    return matches.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Check whether the matcher has been initialized and is ready for matching.
   */
  isReady(): boolean {
    return this.initialized;
  }
}
