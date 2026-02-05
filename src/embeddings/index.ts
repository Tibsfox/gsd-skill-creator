/**
 * Embedding infrastructure for semantic similarity analysis.
 *
 * This module provides:
 * - EmbeddingService: Main service with HuggingFace integration and fallback
 * - Cosine similarity for comparing embedding vectors
 * - Heuristic embedder (TF-IDF based) for fallback when model unavailable
 * - Embedding cache with automatic content-hash invalidation
 * - Type exports for embedding-related types
 */

export { cosineSimilarity } from './cosine-similarity.js';
export { HeuristicEmbedder } from './heuristic-fallback.js';
export { EmbeddingCache } from './embedding-cache.js';
export { EmbeddingService, getEmbeddingService } from './embedding-service.js';

// Re-export types for convenience
export type {
  EmbeddingVector,
  CacheEntry,
  CacheStore,
  EmbeddingServiceConfig,
  ProgressInfo,
  EmbeddingResult,
} from '../types/embeddings.js';
