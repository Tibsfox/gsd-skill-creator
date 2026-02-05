/**
 * Embedding infrastructure for semantic similarity analysis.
 *
 * This module provides:
 * - Cosine similarity for comparing embedding vectors
 * - Heuristic embedder (TF-IDF based) for fallback when model unavailable
 * - Type exports for embedding-related types
 *
 * The full embedding service (using @huggingface/transformers) is in a
 * separate file and will be added in a follow-up plan.
 */

export { cosineSimilarity } from './cosine-similarity.js';
export { HeuristicEmbedder } from './heuristic-fallback.js';
export { EmbeddingCache } from './embedding-cache.js';

// Re-export types for convenience
export type {
  EmbeddingVector,
  CacheEntry,
  CacheStore,
  EmbeddingServiceConfig,
  ProgressInfo,
  EmbeddingResult,
} from '../types/embeddings.js';
