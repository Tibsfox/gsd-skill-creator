/**
 * TDD tests for prompt embedding cache.
 *
 * Tests the PromptEmbeddingCache which provides disk-persistent caching
 * for prompt embeddings, keyed by pure content hash (not skill name).
 * Follows the same pattern as the existing EmbeddingCache but simplified
 * for the clustering pipeline.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PromptEmbeddingCache } from './prompt-embedding-cache.js';
import { rm, mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

describe('PromptEmbeddingCache', () => {
  const testDir = './test-prompt-cache-temp';
  const testCachePath = join(testDir, 'test-prompt-cache.json');
  const modelVersion = 'test-v1.0';

  // Sample embedding vector (small for testing)
  const sampleEmbedding: number[] = Array.from({ length: 384 }, (_, i) =>
    Math.sin(i * 0.1),
  );

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  // ==========================================================================
  // Basic operations
  // ==========================================================================

  describe('Basic operations', () => {
    it('set() stores embedding and get() retrieves it', () => {
      const cache = new PromptEmbeddingCache(modelVersion, testCachePath);
      cache.set('This is a test prompt for embedding', sampleEmbedding);

      const result = cache.get('This is a test prompt for embedding');
      expect(result).toEqual(sampleEmbedding);
    });

    it('get() returns null for uncached prompt', () => {
      const cache = new PromptEmbeddingCache(modelVersion, testCachePath);

      const result = cache.get('not in cache');
      expect(result).toBeNull();
    });

    it('has() returns true for cached prompt', () => {
      const cache = new PromptEmbeddingCache(modelVersion, testCachePath);
      cache.set('cached prompt', sampleEmbedding);

      expect(cache.has('cached prompt')).toBe(true);
      expect(cache.has('not cached')).toBe(false);
    });

    it('two identical prompts from different sessions produce same cache key', () => {
      const cache = new PromptEmbeddingCache(modelVersion, testCachePath);
      const promptText = 'Build a REST API with authentication';

      cache.set(promptText, sampleEmbedding);

      // Same text retrieves same embedding regardless of source
      expect(cache.get(promptText)).toEqual(sampleEmbedding);
    });
  });

  // ==========================================================================
  // Batch operations
  // ==========================================================================

  describe('Batch operations', () => {
    it('setBatch() sets multiple entries at once', () => {
      const cache = new PromptEmbeddingCache(modelVersion, testCachePath);

      const entries = [
        { text: 'prompt one for batch test', embedding: sampleEmbedding },
        { text: 'prompt two for batch test', embedding: sampleEmbedding.map(v => v * 2) },
        { text: 'prompt three for batch test', embedding: sampleEmbedding.map(v => v * 3) },
      ];

      cache.setBatch(entries);

      expect(cache.get('prompt one for batch test')).toEqual(sampleEmbedding);
      expect(cache.get('prompt two for batch test')).toEqual(sampleEmbedding.map(v => v * 2));
      expect(cache.get('prompt three for batch test')).toEqual(sampleEmbedding.map(v => v * 3));
    });

    it('getAll() returns all cached entries as hash -> vector map', () => {
      const cache = new PromptEmbeddingCache(modelVersion, testCachePath);

      cache.set('first prompt', sampleEmbedding);
      cache.set('second prompt', sampleEmbedding.map(v => v * 2));

      const all = cache.getAll();
      expect(all.size).toBe(2);

      // Values should be embedding vectors
      for (const vec of all.values()) {
        expect(Array.isArray(vec)).toBe(true);
        expect(vec.length).toBe(384);
      }
    });

    it('getAll() returns empty map when cache is empty', () => {
      const cache = new PromptEmbeddingCache(modelVersion, testCachePath);

      const all = cache.getAll();
      expect(all.size).toBe(0);
    });
  });

  // ==========================================================================
  // Model version invalidation
  // ==========================================================================

  describe('Model version invalidation', () => {
    it('different model version returns null', async () => {
      const cacheV1 = new PromptEmbeddingCache('v1.0', testCachePath);
      cacheV1.set('test prompt', sampleEmbedding);
      await cacheV1.save();

      const cacheV2 = new PromptEmbeddingCache('v2.0', testCachePath);
      await cacheV2.load();

      expect(cacheV2.get('test prompt')).toBeNull();
    });

    it('same model version returns cached value', async () => {
      const cache1 = new PromptEmbeddingCache('v1.0', testCachePath);
      cache1.set('test prompt', sampleEmbedding);
      await cache1.save();

      const cache2 = new PromptEmbeddingCache('v1.0', testCachePath);
      await cache2.load();

      expect(cache2.get('test prompt')).toEqual(sampleEmbedding);
    });
  });

  // ==========================================================================
  // Persistence
  // ==========================================================================

  describe('Persistence', () => {
    it('save() writes JSON to disk', async () => {
      const cache = new PromptEmbeddingCache(modelVersion, testCachePath);
      cache.set('test prompt', sampleEmbedding);
      await cache.save();

      expect(existsSync(testCachePath)).toBe(true);

      const content = await readFile(testCachePath, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed.version).toBeDefined();
      expect(parsed.modelVersion).toBe(modelVersion);
      expect(typeof parsed.entries).toBe('object');
    });

    it('load() reads JSON from disk', async () => {
      const cache1 = new PromptEmbeddingCache(modelVersion, testCachePath);
      cache1.set('test prompt', sampleEmbedding);
      await cache1.save();

      const cache2 = new PromptEmbeddingCache(modelVersion, testCachePath);
      await cache2.load();

      expect(cache2.get('test prompt')).toEqual(sampleEmbedding);
    });

    it('load() with no file on disk produces empty cache, no error', async () => {
      const cache = new PromptEmbeddingCache(modelVersion, join(testDir, 'nonexistent.json'));
      await cache.load();

      expect(cache.get('anything')).toBeNull();
    });

    it('load() with corrupt file produces empty cache, no error', async () => {
      await writeFile(testCachePath, 'not valid json {{{', 'utf-8');

      const cache = new PromptEmbeddingCache(modelVersion, testCachePath);
      await cache.load();

      expect(cache.get('anything')).toBeNull();
    });

    it('load() with invalid structure produces empty cache', async () => {
      await writeFile(testCachePath, JSON.stringify({ wrong: 'structure' }), 'utf-8');

      const cache = new PromptEmbeddingCache(modelVersion, testCachePath);
      await cache.load();

      expect(cache.get('anything')).toBeNull();
    });

    it('save() creates parent directories if needed', async () => {
      const deepPath = join(testDir, 'deep', 'nested', 'dir', 'cache.json');
      const cache = new PromptEmbeddingCache(modelVersion, deepPath);
      cache.set('test prompt', sampleEmbedding);
      await cache.save();

      expect(existsSync(deepPath)).toBe(true);
    });

    it('save() with no changes is a no-op (dirty flag)', async () => {
      const cache = new PromptEmbeddingCache(modelVersion, testCachePath);
      await cache.load();

      // Save without changes should not create file
      await cache.save();
      expect(existsSync(testCachePath)).toBe(false);

      // Make a change and save
      cache.set('prompt', sampleEmbedding);
      await cache.save();
      expect(existsSync(testCachePath)).toBe(true);
    });

    it('survives load/save round-trip', async () => {
      const cache1 = new PromptEmbeddingCache(modelVersion, testCachePath);
      cache1.set('prompt-a', sampleEmbedding);
      cache1.set('prompt-b', sampleEmbedding.map(v => v * 2));
      await cache1.save();

      const cache2 = new PromptEmbeddingCache(modelVersion, testCachePath);
      await cache2.load();

      expect(cache2.get('prompt-a')).toEqual(sampleEmbedding);
      expect(cache2.get('prompt-b')).toEqual(sampleEmbedding.map(v => v * 2));
    });
  });

  // ==========================================================================
  // Edge cases
  // ==========================================================================

  describe('Edge cases', () => {
    it('empty string produces valid hash and retrieval', () => {
      const cache = new PromptEmbeddingCache(modelVersion, testCachePath);
      cache.set('', sampleEmbedding);

      expect(cache.get('')).toEqual(sampleEmbedding);
    });

    it('unicode content hashes correctly', () => {
      const cache = new PromptEmbeddingCache(modelVersion, testCachePath);
      const unicodeText = 'Hello \u4e16\u754c \ud83c\udf1f emoji content';
      cache.set(unicodeText, sampleEmbedding);

      expect(cache.get(unicodeText)).toEqual(sampleEmbedding);
    });

    it('very long prompt text hashes correctly', () => {
      const cache = new PromptEmbeddingCache(modelVersion, testCachePath);
      const longText = 'x'.repeat(100000);
      cache.set(longText, sampleEmbedding);

      expect(cache.get(longText)).toEqual(sampleEmbedding);
    });

    it('getAll() only includes entries matching current model version', async () => {
      // Create cache with v1 entries
      const cacheV1 = new PromptEmbeddingCache('v1.0', testCachePath);
      cacheV1.set('prompt-v1', sampleEmbedding);
      await cacheV1.save();

      // Load with v2 -- getAll should skip v1 entries
      const cacheV2 = new PromptEmbeddingCache('v2.0', testCachePath);
      await cacheV2.load();

      const all = cacheV2.getAll();
      expect(all.size).toBe(0);
    });
  });
});
