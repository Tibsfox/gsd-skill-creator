/**
 * Type definitions for the embedding infrastructure.
 *
 * These types support local embeddings via @huggingface/transformers
 * with caching and heuristic fallback capabilities.
 */

/**
 * Embedding vector - 384 dimensions for BGE-small-en-v1.5 model.
 * Stored as regular number array for JSON serialization compatibility.
 */
export type EmbeddingVector = number[];

/**
 * Progress information from HuggingFace transformers.js during model loading.
 * Used for progress callbacks during first-time model download.
 */
export interface ProgressInfo {
  /** Current status of the operation */
  status: 'initiate' | 'download' | 'progress' | 'done' | 'ready';
  /** Name of the resource being processed */
  name?: string;
  /** File being downloaded */
  file?: string;
  /** Download progress percentage (0-100) */
  progress?: number;
  /** Bytes loaded so far */
  loaded?: number;
  /** Total bytes to download */
  total?: number;
}

/**
 * Cache entry for a single embedding with metadata for invalidation.
 * Content hash ensures automatic invalidation when skill text changes.
 */
export interface CacheEntry {
  /** The embedding vector */
  embedding: EmbeddingVector;
  /** Model version that generated this embedding */
  modelVersion: string;
  /** SHA-256 hash of the content (first 16 chars) */
  contentHash: string;
  /** ISO date string when entry was created */
  createdAt: string;
}

/**
 * Full cache store structure persisted to disk.
 * JSON format for simplicity - can migrate to SQLite if performance requires.
 */
export interface CacheStore {
  /** Cache format version for future migrations */
  version: string;
  /** Model ID used to generate embeddings */
  modelId: string;
  /** Cache entries keyed by "skillName:contentHash" */
  entries: Record<string, CacheEntry>;
}

/**
 * Configuration options for the embedding service.
 */
export interface EmbeddingServiceConfig {
  /** Enable/disable embedding service (default: true) */
  enabled?: boolean;
  /** Override default cache directory location */
  cacheDir?: string;
}

/**
 * Result type for embedding operations.
 * Includes metadata about how the embedding was generated.
 */
export interface EmbeddingResult {
  /** The embedding vector */
  embedding: EmbeddingVector;
  /** Whether this embedding was retrieved from cache */
  fromCache: boolean;
  /** Method used: 'model' for transformer, 'heuristic' for TF-IDF fallback */
  method: 'model' | 'heuristic';
}
