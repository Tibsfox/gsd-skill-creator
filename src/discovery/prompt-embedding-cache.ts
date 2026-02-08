/**
 * Disk-persistent cache for prompt embeddings.
 *
 * Caches embedding vectors for user prompts, keyed by pure content hash
 * (not skill name). Avoids re-embedding on subsequent clustering runs.
 * Model version changes invalidate all entries.
 *
 * Key differences from the existing EmbeddingCache:
 * - No skillName in key -- just SHA-256 content hash
 * - Simplified API: get/set by prompt text only
 * - Batch operations: getAll() and setBatch() for clustering pipeline
 *
 * Cache format:
 * {
 *   version: "1.0",
 *   modelVersion: "Xenova/bge-small-en-v1.5",
 *   entries: {
 *     [contentHash]: { embedding: number[], modelVersion: string, createdAt: string }
 *   }
 * }
 *
 * Implements: CLUST-01 (prompt embedding cache for clustering pipeline)
 */

import { createHash } from 'crypto';
import { readFile, writeFile, mkdir, rename } from 'fs/promises';
import { dirname } from 'path';
import { join } from 'path';
import { homedir } from 'os';
import { existsSync } from 'fs';

// ============================================================================
// Types
// ============================================================================

/** Cache format version for future migrations */
const CACHE_VERSION = '1.0';

/** Default cache location */
const DEFAULT_CACHE_PATH = join(
  homedir(),
  '.gsd-skill-creator',
  'discovery',
  'prompt-embeddings-cache.json',
);

/** Individual cache entry stored on disk */
interface PromptCacheEntry {
  embedding: number[];
  modelVersion: string;
  createdAt: string;
}

/** Top-level cache structure persisted to JSON */
interface PromptCacheStore {
  version: string;
  modelVersion: string;
  entries: Record<string, PromptCacheEntry>;
}

// ============================================================================
// PromptEmbeddingCache
// ============================================================================

/**
 * Disk-persistent cache for prompt embeddings, keyed by content hash.
 *
 * Usage:
 * ```ts
 * const cache = new PromptEmbeddingCache('v1.0');
 * await cache.load();
 *
 * const cached = cache.get(promptText);
 * if (!cached) {
 *   const embedding = await embed(promptText);
 *   cache.set(promptText, embedding);
 * }
 *
 * await cache.save();
 * ```
 */
export class PromptEmbeddingCache {
  private cache: PromptCacheStore;
  private readonly cachePath: string;
  private readonly modelVersion: string;
  private dirty = false;

  /**
   * Create a new prompt embedding cache instance.
   *
   * @param modelVersion - Model version string for invalidation
   * @param cachePath - Optional override for cache file location
   */
  constructor(modelVersion: string, cachePath?: string) {
    this.modelVersion = modelVersion;
    this.cachePath = cachePath ?? DEFAULT_CACHE_PATH;
    this.cache = this.createEmptyCache();
  }

  // --------------------------------------------------------------------------
  // Persistence
  // --------------------------------------------------------------------------

  /**
   * Load cache from disk. Creates empty cache on any error (missing file,
   * corrupt JSON, invalid structure).
   */
  async load(): Promise<void> {
    try {
      if (!existsSync(this.cachePath)) {
        this.cache = this.createEmptyCache();
        return;
      }

      const content = await readFile(this.cachePath, 'utf-8');
      const parsed = JSON.parse(content) as PromptCacheStore;

      // Validate structure
      if (
        typeof parsed.version !== 'string' ||
        typeof parsed.modelVersion !== 'string' ||
        typeof parsed.entries !== 'object' ||
        parsed.entries === null
      ) {
        this.cache = this.createEmptyCache();
        return;
      }

      this.cache = parsed;
      this.dirty = false;
    } catch {
      // On any error, start with empty cache
      this.cache = this.createEmptyCache();
    }
  }

  /**
   * Save cache to disk. Only writes if there are pending changes.
   * Creates parent directories if they don't exist.
   */
  async save(): Promise<void> {
    if (!this.dirty) {
      return;
    }

    const dir = dirname(this.cachePath);
    await mkdir(dir, { recursive: true });

    // Atomic write: temp file in same directory, then rename
    const tempPath = join(
      dir,
      `.prompt-embedding-cache-${Date.now()}-${Math.random().toString(36).slice(2)}.json.tmp`,
    );

    await writeFile(tempPath, JSON.stringify(this.cache, null, 2), 'utf-8');
    await rename(tempPath, this.cachePath);
    this.dirty = false;
  }

  // --------------------------------------------------------------------------
  // Lookup
  // --------------------------------------------------------------------------

  /**
   * Get cached embedding for a prompt text.
   * Returns null if not cached or model version doesn't match.
   *
   * @param promptText - The prompt text to look up
   * @returns Embedding vector or null
   */
  get(promptText: string): number[] | null {
    const hash = this.computeContentHash(promptText);
    const entry = this.cache.entries[hash];

    if (!entry) {
      return null;
    }

    // Validate model version
    if (entry.modelVersion !== this.modelVersion) {
      return null;
    }

    return entry.embedding;
  }

  /**
   * Check if a valid entry exists for the given prompt text.
   */
  has(promptText: string): boolean {
    return this.get(promptText) !== null;
  }

  // --------------------------------------------------------------------------
  // Storage
  // --------------------------------------------------------------------------

  /**
   * Store an embedding for a prompt text.
   *
   * @param promptText - The prompt text
   * @param embedding - The embedding vector
   */
  set(promptText: string, embedding: number[]): void {
    const hash = this.computeContentHash(promptText);

    this.cache.entries[hash] = {
      embedding,
      modelVersion: this.modelVersion,
      createdAt: new Date().toISOString(),
    };
    this.dirty = true;
  }

  /**
   * Set multiple entries at once.
   *
   * @param entries - Array of { text, embedding } pairs
   */
  setBatch(entries: Array<{ text: string; embedding: number[] }>): void {
    for (const entry of entries) {
      this.set(entry.text, entry.embedding);
    }
  }

  // --------------------------------------------------------------------------
  // Batch retrieval
  // --------------------------------------------------------------------------

  /**
   * Return all cached embeddings matching the current model version.
   *
   * @returns Map of content hash to embedding vector
   */
  getAll(): Map<string, number[]> {
    const result = new Map<string, number[]>();

    for (const [hash, entry] of Object.entries(this.cache.entries)) {
      if (entry.modelVersion === this.modelVersion) {
        result.set(hash, entry.embedding);
      }
    }

    return result;
  }

  // --------------------------------------------------------------------------
  // Internal
  // --------------------------------------------------------------------------

  /**
   * Compute SHA-256 hash of content, truncated to 16 hex characters.
   */
  private computeContentHash(text: string): string {
    return createHash('sha256').update(text).digest('hex').slice(0, 16);
  }

  /**
   * Create empty cache structure.
   */
  private createEmptyCache(): PromptCacheStore {
    return {
      version: CACHE_VERSION,
      modelVersion: this.modelVersion,
      entries: {},
    };
  }
}
