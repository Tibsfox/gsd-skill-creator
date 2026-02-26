/**
 * MFE composition path cache — LRU in-memory cache providing near-instant
 * resolution for repeated problem types.
 *
 * Keyed by problem hash (same hash from observation feed = same problem type).
 * Uses JavaScript Map's insertion-order preservation for O(1) LRU operations.
 *
 * Session-scoped: no persistence. The observation feed handles durable storage.
 *
 * @module integration/path-cache
 */

import type { CompositionPath } from '../types/mfe-types.js';

// ============================================================================
// Constants
// ============================================================================

/** Default maximum cache size. */
const DEFAULT_MAX_SIZE = 256;

// ============================================================================
// Types
// ============================================================================

/** Internal cache entry wrapping a composition path with metadata. */
export interface CacheEntry {
  /** The problem hash serving as the cache key. */
  hash: string;
  /** The cached composition path. */
  path: CompositionPath;
  /** ISO 8601 timestamp of when this entry was first cached. */
  cachedAt: string;
  /** Number of times this entry has been retrieved via get(). */
  hitCount: number;
}

/** Statistics about cache performance. */
export interface CacheStats {
  /** Current number of entries in the cache. */
  size: number;
  /** Maximum capacity of the cache. */
  maxSize: number;
  /** Total cache hits (get() returning a cached path). */
  hits: number;
  /** Total cache misses (get() returning null). */
  misses: number;
  /** Total entries evicted due to capacity. */
  evictions: number;
}

/** Configuration options for the path cache. */
export interface PathCacheOptions {
  /** Maximum number of entries before LRU eviction. Default: 256. */
  maxSize?: number;
}

/** The path cache interface for storing and retrieving composition paths. */
export interface PathCache {
  /** Get a cached composition path by problem hash. Returns null on miss. */
  get(hash: string): CompositionPath | null;
  /** Store a composition path for a problem hash. Evicts LRU if at capacity. */
  put(hash: string, path: CompositionPath): void;
  /** Check whether a hash exists in the cache. */
  has(hash: string): boolean;
  /** Return current cache performance statistics. */
  stats(): CacheStats;
  /** Clear all entries and reset statistics. */
  clear(): void;
  /** Current number of entries in the cache. */
  readonly size: number;
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a path cache instance.
 *
 * Uses JavaScript Map's insertion-order property for LRU:
 * - get(): delete + re-insert moves entry to end (most recent)
 * - put(): if at capacity, delete first key (oldest = least recent)
 *
 * @param options - Optional configuration (max size)
 * @returns A PathCache for storing and retrieving composition paths
 */
export function createPathCache(options?: PathCacheOptions): PathCache {
  const maxSize = options?.maxSize ?? DEFAULT_MAX_SIZE;
  const store = new Map<string, CacheEntry>();

  let hits = 0;
  let misses = 0;
  let evictions = 0;

  return {
    get(hash: string): CompositionPath | null {
      const entry = store.get(hash);
      if (!entry) {
        misses++;
        return null;
      }

      hits++;
      entry.hitCount++;

      // Move to end (most recently used) by deleting and re-inserting
      store.delete(hash);
      store.set(hash, entry);

      return entry.path;
    },

    put(hash: string, path: CompositionPath): void {
      if (path == null) {
        return;
      }

      // If hash already exists, remove it first (will be re-inserted at end)
      if (store.has(hash)) {
        store.delete(hash);
      } else if (store.size >= maxSize) {
        // Evict least recently used (first entry in Map)
        const lruKey = store.keys().next().value;
        if (lruKey !== undefined) {
          store.delete(lruKey);
          evictions++;
        }
      }

      store.set(hash, {
        hash,
        path,
        cachedAt: new Date().toISOString(),
        hitCount: 0,
      });
    },

    has(hash: string): boolean {
      return store.has(hash);
    },

    stats(): CacheStats {
      return {
        size: store.size,
        maxSize,
        hits,
        misses,
        evictions,
      };
    },

    clear(): void {
      store.clear();
      hits = 0;
      misses = 0;
      evictions = 0;
    },

    get size(): number {
      return store.size;
    },
  };
}
