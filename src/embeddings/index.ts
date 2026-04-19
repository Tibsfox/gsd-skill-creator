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

// ─── MD-1 Shallow Learned Embeddings (v1.49.561 R7) ─────────────────────────
// Pre-existing `cosineSimilarity` (cosine-similarity.ts, raw-vector form) is
// kept as the module-top-level export. MD-1's store-aware cosine is re-
// exported under a distinct name (`md1CosineSimilarity`) to avoid collision.

export {
  createSkipGramModel,
  trainStep,
  evalLoss,
  sigmoid,
  dotRows,
  getInputRow,
} from './skip-gram.js';
export type { SkipGramModel } from './skip-gram.js';

export {
  extractCoOccurrencePairs,
  projectPairsToIds,
} from './co-occurrence.js';
export type {
  CoOccurrencePair,
  CoOccurrenceOptions,
  CoOccurrenceResult,
} from './co-occurrence.js';

export {
  trainEmbeddings,
  buildNegativeTable,
  rmsDrift,
  mulberry32 as md1Mulberry32,
} from './trainer.js';
export type {
  TrainEmbeddingsOptions,
  TrainEmbeddingsResult,
} from './trainer.js';

export {
  buildStore,
  getEmbedding,
  cosineSimilarity as md1CosineSimilarity,
  cosineByIndex,
  nearestNeighbours,
  EmbeddingAccessCache,
} from './api.js';
export type {
  LearnedEmbeddingStore,
  NearestNeighbour,
} from './api.js';

export {
  serializeStore,
  deserializeStore,
  saveStore,
  loadStore,
  DEFAULT_EMBEDDINGS_PATH,
  EMBEDDINGS_FORMAT_VERSION,
} from './persist.js';

export {
  readEmbeddingsFlag,
  makeEmbeddingsSettings,
  EMBEDDINGS_FLAG_KEY,
  EMBEDDINGS_FLAG_ENV,
} from './settings.js';
export type { EmbeddingsSettings } from './settings.js';
