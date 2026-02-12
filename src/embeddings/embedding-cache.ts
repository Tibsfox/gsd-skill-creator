/**
 * Embedding cache with automatic content-based invalidation.
 *
 * Caches embedding vectors to avoid recomputation. Entries are automatically
 * invalidated when:
 * - Skill content changes (detected via content hash)
 * - Embedding model version changes
 *
 * The cache persists to JSON and survives process restarts.
 */

import { createHash } from 'crypto';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { existsSync } from 'fs';
import type { CacheStore, CacheEntry, EmbeddingVector } from '../types/embeddings.js';

/** Cache format version for future migrations */
const CACHE_VERSION = '1.0';

/** Default model ID when not specified */
const DEFAULT_MODEL_ID = 'Xenova/bge-small-en-v1.5';

export class EmbeddingCache {
  private cache: CacheStore;
  private cachePath: string;
  private modelVersion: string;
  private dirty = false;

  /**
   * Create a new embedding cache instance.
   * @param modelVersion - Version string for invalidation (e.g., "1.0.0")
   * @param cachePath - Optional override for cache file location
   */
  constructor(modelVersion: string, cachePath?: string) {
    this.modelVersion = modelVersion;
    this.cachePath = cachePath ?? this.resolveCachePath();
    this.cache = this.createEmptyCache();
  }

  /**
   * Determine cache location based on project context.
   * - If .skill-creator/ exists in cwd: use project-local cache
   * - Otherwise: use global cache in home directory
   */
  private resolveCachePath(): string {
    const projectLocalDir = join(process.cwd(), '.skill-creator');
    if (existsSync(projectLocalDir)) {
      return join(projectLocalDir, 'embeddings-cache.json');
    }
    return join(homedir(), '.gsd-skill-creator', 'embeddings', 'cache.json');
  }

  /**
   * Create empty cache structure with current version.
   */
  private createEmptyCache(): CacheStore {
    return {
      version: CACHE_VERSION,
      modelId: DEFAULT_MODEL_ID,
      entries: {},
    };
  }

  /**
   * Load cache from disk. Creates empty cache if file doesn't exist or is corrupt.
   */
  async load(): Promise<void> {
    try {
      if (!existsSync(this.cachePath)) {
        this.cache = this.createEmptyCache();
        return;
      }

      const content = await readFile(this.cachePath, 'utf-8');
      const parsed = JSON.parse(content) as CacheStore;

      // Validate structure
      if (
        typeof parsed.version !== 'string' ||
        typeof parsed.modelId !== 'string' ||
        typeof parsed.entries !== 'object' ||
        parsed.entries === null
      ) {
        this.cache = this.createEmptyCache();
        return;
      }

      this.cache = parsed;
      this.dirty = false;
    } catch {
      // On any error (parse, read, etc.), start with empty cache
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
    await writeFile(this.cachePath, JSON.stringify(this.cache, null, 2), 'utf-8');
    this.dirty = false;
  }

  /**
   * Compute SHA-256 hash of content, truncated to 16 hex characters.
   */
  private computeContentHash(content: string): string {
    return createHash('sha256').update(content).digest('hex').slice(0, 16);
  }

  /**
   * Build cache key from skill name and content hash.
   * Format: "skillName:contentHash"
   */
  private getCacheKey(skillName: string, contentHash: string): string {
    return `${skillName}:${contentHash}`;
  }

  /**
   * Get cached embedding if valid (matching content and model version).
   * Returns null if entry doesn't exist or is invalidated.
   *
   * @param skillName - Name of the skill
   * @param content - Current content to check against cached content hash
   */
  get(skillName: string, content: string): EmbeddingVector | null {
    const contentHash = this.computeContentHash(content);
    const key = this.getCacheKey(skillName, contentHash);
    const entry = this.cache.entries[key];

    if (!entry) {
      return null;
    }

    // Validate model version matches
    if (entry.modelVersion !== this.modelVersion) {
      return null;
    }

    // Content hash is already validated by key lookup
    return entry.embedding;
  }

  /**
   * Store embedding with metadata for future invalidation.
   *
   * @param skillName - Name of the skill
   * @param content - Content used to generate the embedding
   * @param embedding - The embedding vector to cache
   */
  set(skillName: string, content: string, embedding: EmbeddingVector): void {
    const contentHash = this.computeContentHash(content);
    const key = this.getCacheKey(skillName, contentHash);

    // Remove old entries for this skill with different content hashes
    this.deleteBySkillName(skillName);

    this.cache.entries[key] = {
      embedding,
      modelVersion: this.modelVersion,
      contentHash,
      createdAt: new Date().toISOString(),
    };
    this.dirty = true;
  }

  /**
   * Check if a valid entry exists for the given skill and content.
   */
  has(skillName: string, content: string): boolean {
    return this.get(skillName, content) !== null;
  }

  /**
   * Remove all entries for a specific skill name.
   * Removes entries regardless of content hash.
   */
  delete(skillName: string): void {
    this.deleteBySkillName(skillName);
  }

  /**
   * Internal method to remove all entries matching a skill name prefix.
   */
  private deleteBySkillName(skillName: string): void {
    const prefix = `${skillName}:`;
    const keysToDelete = Object.keys(this.cache.entries).filter((key) =>
      key.startsWith(prefix)
    );

    for (const key of keysToDelete) {
      delete this.cache.entries[key];
      this.dirty = true;
    }
  }

  /**
   * Clear all cache entries.
   */
  clear(): void {
    if (Object.keys(this.cache.entries).length > 0) {
      this.cache.entries = {};
      this.dirty = true;
    }
  }

  /**
   * Get cache statistics.
   */
  getStats(): { entries: number; modelId: string; version: string } {
    return {
      entries: Object.keys(this.cache.entries).length,
      modelId: this.cache.modelId,
      version: this.cache.version,
    };
  }

  /**
   * Get keys for entries older than the specified age.
   * Useful for cleanup utilities.
   *
   * @param maxAgeMs - Maximum age in milliseconds
   * @returns Array of cache keys for stale entries
   */
  getStaleEntries(maxAgeMs: number): string[] {
    const now = Date.now();
    const staleKeys: string[] = [];

    for (const [key, entry] of Object.entries(this.cache.entries)) {
      const createdAt = new Date(entry.createdAt).getTime();
      if (now - createdAt > maxAgeMs) {
        staleKeys.push(key);
      }
    }

    return staleKeys;
  }

  /**
   * Get cached entry with version metadata, regardless of version match.
   *
   * Unlike `get()` which returns null when the model version differs,
   * this method returns the entry WITH its version info so callers can
   * decide how to handle version drift (e.g., re-embed or use as-is).
   *
   * @param skillName - Name of the skill
   * @param content - Content to look up by hash
   * @returns Entry with embedding, modelVersion, and contentHash, or null if not found
   */
  getWithVersionInfo(
    skillName: string,
    content: string
  ): { embedding: EmbeddingVector; modelVersion: string; contentHash: string } | null {
    const contentHash = this.computeContentHash(content);
    const key = this.getCacheKey(skillName, contentHash);
    const entry = this.cache.entries[key];

    if (!entry) return null;

    return {
      embedding: entry.embedding,
      modelVersion: entry.modelVersion,
      contentHash: entry.contentHash,
    };
  }

  /**
   * Get the model version this cache instance uses for new entries.
   *
   * Useful for external comparison against entry versions returned
   * by `getWithVersionInfo()`.
   */
  getVersionInfo(): string {
    return this.modelVersion;
  }

  /**
   * Check if a cached entry was created with a different model version
   * than the current cache instance.
   *
   * Returns false if entry doesn't exist (no entry = no drift, just cache miss).
   *
   * @param skillName - Name of the skill
   * @param content - Content to look up by hash
   * @returns true if entry exists and has a different model version
   */
  hasVersionDrift(skillName: string, content: string): boolean {
    const contentHash = this.computeContentHash(content);
    const key = this.getCacheKey(skillName, contentHash);
    const entry = this.cache.entries[key];

    if (!entry) return false;

    return entry.modelVersion !== this.modelVersion;
  }

  /**
   * Get cache keys for entries whose modelVersion differs from the current
   * cache model version. Useful for bulk re-embedding after model upgrades.
   *
   * @returns Array of cache keys with stale model versions
   */
  getStaleVersionEntries(): string[] {
    return Object.entries(this.cache.entries)
      .filter(([_, entry]) => entry.modelVersion !== this.modelVersion)
      .map(([key]) => key);
  }

  /**
   * Get the current cache file path.
   */
  getCachePath(): string {
    return this.cachePath;
  }
}
