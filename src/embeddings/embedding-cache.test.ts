/**
 * Tests for EmbeddingCache with content-based invalidation.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EmbeddingCache } from './embedding-cache.js';
import { rm, mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import type { EmbeddingVector } from '../types/embeddings.js';

describe('EmbeddingCache', () => {
  const testDir = './test-cache-temp';
  const testCachePath = join(testDir, 'test-cache.json');
  const modelVersion = 'test-v1.0';

  // Sample embedding vector (384 dimensions like BGE-small)
  const sampleEmbedding: EmbeddingVector = Array.from({ length: 384 }, (_, i) =>
    Math.sin(i * 0.1)
  );

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('Basic operations', () => {
    it('set() stores embedding and get() retrieves it', () => {
      const cache = new EmbeddingCache(modelVersion, testCachePath);
      cache.set('my-skill', 'skill content', sampleEmbedding);

      const result = cache.get('my-skill', 'skill content');
      expect(result).toEqual(sampleEmbedding);
    });

    it('has() returns true for existing entry', () => {
      const cache = new EmbeddingCache(modelVersion, testCachePath);
      cache.set('my-skill', 'skill content', sampleEmbedding);

      expect(cache.has('my-skill', 'skill content')).toBe(true);
      expect(cache.has('my-skill', 'different content')).toBe(false);
      expect(cache.has('other-skill', 'skill content')).toBe(false);
    });

    it('delete() removes entry', () => {
      const cache = new EmbeddingCache(modelVersion, testCachePath);
      cache.set('my-skill', 'skill content', sampleEmbedding);
      expect(cache.has('my-skill', 'skill content')).toBe(true);

      cache.delete('my-skill');
      expect(cache.has('my-skill', 'skill content')).toBe(false);
    });

    it('clear() removes all entries', () => {
      const cache = new EmbeddingCache(modelVersion, testCachePath);
      cache.set('skill-1', 'content 1', sampleEmbedding);
      cache.set('skill-2', 'content 2', sampleEmbedding);

      expect(cache.getStats().entries).toBe(2);

      cache.clear();
      expect(cache.getStats().entries).toBe(0);
    });

    it('getStats() returns correct counts', () => {
      const cache = new EmbeddingCache(modelVersion, testCachePath);

      let stats = cache.getStats();
      expect(stats.entries).toBe(0);
      expect(stats.version).toBe('1.0');

      cache.set('skill-1', 'content 1', sampleEmbedding);
      cache.set('skill-2', 'content 2', sampleEmbedding);

      stats = cache.getStats();
      expect(stats.entries).toBe(2);
    });
  });

  describe('Content invalidation', () => {
    it('same skill + same content returns cached embedding', () => {
      const cache = new EmbeddingCache(modelVersion, testCachePath);
      cache.set('my-skill', 'skill content', sampleEmbedding);

      // Retrieve multiple times
      expect(cache.get('my-skill', 'skill content')).toEqual(sampleEmbedding);
      expect(cache.get('my-skill', 'skill content')).toEqual(sampleEmbedding);
    });

    it('same skill + different content returns null (invalidated)', () => {
      const cache = new EmbeddingCache(modelVersion, testCachePath);
      cache.set('my-skill', 'original content', sampleEmbedding);

      // Different content should not match
      expect(cache.get('my-skill', 'modified content')).toBeNull();
    });

    it('content hash changes when content changes', () => {
      const cache = new EmbeddingCache(modelVersion, testCachePath);

      // Store with original content
      cache.set('my-skill', 'original', sampleEmbedding);
      expect(cache.has('my-skill', 'original')).toBe(true);

      // Update with new content (replaces old entry)
      const newEmbedding = sampleEmbedding.map((v) => v * 2);
      cache.set('my-skill', 'updated', newEmbedding);

      // Old content no longer matches
      expect(cache.has('my-skill', 'original')).toBe(false);

      // New content matches
      expect(cache.get('my-skill', 'updated')).toEqual(newEmbedding);
    });
  });

  describe('Model version invalidation', () => {
    it('different model version returns null (invalidated)', async () => {
      // Create cache with v1
      const cacheV1 = new EmbeddingCache('v1.0', testCachePath);
      cacheV1.set('my-skill', 'content', sampleEmbedding);
      await cacheV1.save();

      // Load with v2 - should not find entry
      const cacheV2 = new EmbeddingCache('v2.0', testCachePath);
      await cacheV2.load();

      expect(cacheV2.get('my-skill', 'content')).toBeNull();
    });

    it('cache created with v1, read with v2 returns null', async () => {
      // Save with version 1
      const cache1 = new EmbeddingCache('model-v1', testCachePath);
      cache1.set('skill', 'text', sampleEmbedding);
      await cache1.save();

      // New instance with version 2
      const cache2 = new EmbeddingCache('model-v2', testCachePath);
      await cache2.load();

      // Entry exists but model version doesn't match
      expect(cache2.get('skill', 'text')).toBeNull();
    });
  });

  describe('Persistence', () => {
    it('save() writes JSON to disk', async () => {
      const cache = new EmbeddingCache(modelVersion, testCachePath);
      cache.set('my-skill', 'content', sampleEmbedding);
      await cache.save();

      expect(existsSync(testCachePath)).toBe(true);

      const content = await readFile(testCachePath, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed.version).toBe('1.0');
      expect(Object.keys(parsed.entries).length).toBe(1);
    });

    it('load() reads JSON from disk', async () => {
      // First cache instance saves
      const cache1 = new EmbeddingCache(modelVersion, testCachePath);
      cache1.set('my-skill', 'content', sampleEmbedding);
      await cache1.save();

      // Second instance loads
      const cache2 = new EmbeddingCache(modelVersion, testCachePath);
      await cache2.load();

      expect(cache2.get('my-skill', 'content')).toEqual(sampleEmbedding);
    });

    it('cache survives process restart (save -> new instance -> load)', async () => {
      // Simulate first "process"
      const cache1 = new EmbeddingCache(modelVersion, testCachePath);
      cache1.set('skill-a', 'content a', sampleEmbedding);
      cache1.set('skill-b', 'content b', sampleEmbedding);
      await cache1.save();

      // Simulate second "process" (fresh instance)
      const cache2 = new EmbeddingCache(modelVersion, testCachePath);
      await cache2.load();

      expect(cache2.get('skill-a', 'content a')).toEqual(sampleEmbedding);
      expect(cache2.get('skill-b', 'content b')).toEqual(sampleEmbedding);
      expect(cache2.getStats().entries).toBe(2);
    });

    it('missing cache file creates empty cache on load', async () => {
      const nonExistentPath = join(testDir, 'nonexistent', 'cache.json');
      const cache = new EmbeddingCache(modelVersion, nonExistentPath);
      await cache.load();

      expect(cache.getStats().entries).toBe(0);
    });

    it('corrupt cache file creates empty cache on load', async () => {
      // Write invalid JSON
      await writeFile(testCachePath, 'not valid json {{{', 'utf-8');

      const cache = new EmbeddingCache(modelVersion, testCachePath);
      await cache.load();

      expect(cache.getStats().entries).toBe(0);
    });

    it('invalid cache structure creates empty cache on load', async () => {
      // Write valid JSON but wrong structure
      await writeFile(testCachePath, JSON.stringify({ wrong: 'structure' }), 'utf-8');

      const cache = new EmbeddingCache(modelVersion, testCachePath);
      await cache.load();

      expect(cache.getStats().entries).toBe(0);
    });

    it('only saves when dirty', async () => {
      const cache = new EmbeddingCache(modelVersion, testCachePath);
      await cache.load(); // Load empty

      // Save without changes - should not create file
      await cache.save();
      expect(existsSync(testCachePath)).toBe(false);

      // Make a change and save
      cache.set('skill', 'content', sampleEmbedding);
      await cache.save();
      expect(existsSync(testCachePath)).toBe(true);

      // Get file modification time
      const firstSave = await readFile(testCachePath, 'utf-8');

      // Save again without changes - content should be identical
      await cache.save();
      const secondSave = await readFile(testCachePath, 'utf-8');
      expect(firstSave).toBe(secondSave);
    });
  });

  describe('Cache path resolution', () => {
    it('uses provided cache path when specified', () => {
      const customPath = join(testDir, 'custom', 'path.json');
      const cache = new EmbeddingCache(modelVersion, customPath);

      expect(cache.getCachePath()).toBe(customPath);
    });

    it('getCachePath() returns the resolved path', () => {
      const cache = new EmbeddingCache(modelVersion, testCachePath);
      expect(cache.getCachePath()).toBe(testCachePath);
    });
  });

  describe('Edge cases', () => {
    it('empty content produces valid hash', () => {
      const cache = new EmbeddingCache(modelVersion, testCachePath);
      cache.set('skill', '', sampleEmbedding);

      expect(cache.get('skill', '')).toEqual(sampleEmbedding);
    });

    it('very long content produces valid hash', () => {
      const cache = new EmbeddingCache(modelVersion, testCachePath);
      const longContent = 'x'.repeat(100000);
      cache.set('skill', longContent, sampleEmbedding);

      expect(cache.get('skill', longContent)).toEqual(sampleEmbedding);
    });

    it('special characters in skill name work correctly', () => {
      const cache = new EmbeddingCache(modelVersion, testCachePath);
      const specialName = 'skill:with/special\\chars@#$%';
      cache.set(specialName, 'content', sampleEmbedding);

      expect(cache.get(specialName, 'content')).toEqual(sampleEmbedding);
    });

    it('unicode content produces valid hash', () => {
      const cache = new EmbeddingCache(modelVersion, testCachePath);
      const unicodeContent = 'Hello \u4e16\u754c \ud83c\udf1f emoji content';
      cache.set('skill', unicodeContent, sampleEmbedding);

      expect(cache.get('skill', unicodeContent)).toEqual(sampleEmbedding);
    });
  });

  describe('Stale entry detection', () => {
    it('getStaleEntries() returns entries older than maxAge', async () => {
      const cache = new EmbeddingCache(modelVersion, testCachePath);

      // Set entry with current time
      cache.set('new-skill', 'content', sampleEmbedding);

      // No entries should be stale with 1 hour max age
      expect(cache.getStaleEntries(60 * 60 * 1000)).toHaveLength(0);

      // All entries should be stale with 0ms max age
      expect(cache.getStaleEntries(0)).toHaveLength(1);
    });
  });

  describe('Version drift detection', () => {
    it('getWithVersionInfo() returns embedding with modelVersion metadata', () => {
      const cache = new EmbeddingCache('v1', testCachePath);
      cache.set('skill-a', 'content', sampleEmbedding);

      const result = cache.getWithVersionInfo('skill-a', 'content');
      expect(result).not.toBeNull();
      expect(result!.embedding).toEqual(sampleEmbedding);
      expect(result!.modelVersion).toBe('v1');
      expect(typeof result!.contentHash).toBe('string');
      expect(result!.contentHash.length).toBeGreaterThan(0);
    });

    it('getWithVersionInfo() returns null when entry does not exist', () => {
      const cache = new EmbeddingCache('v1', testCachePath);

      const result = cache.getWithVersionInfo('nonexistent', 'content');
      expect(result).toBeNull();
    });

    it('getWithVersionInfo() returns entry even when version differs (unlike get())', async () => {
      // Create cache with v1 and set entry
      const cacheV1 = new EmbeddingCache('v1', testCachePath);
      cacheV1.set('skill-a', 'content', sampleEmbedding);
      await cacheV1.save();

      // Load with v2
      const cacheV2 = new EmbeddingCache('v2', testCachePath);
      await cacheV2.load();

      // get() returns null on version mismatch (existing behavior)
      expect(cacheV2.get('skill-a', 'content')).toBeNull();

      // getWithVersionInfo() returns the entry WITH its v1 modelVersion
      const result = cacheV2.getWithVersionInfo('skill-a', 'content');
      expect(result).not.toBeNull();
      expect(result!.embedding).toEqual(sampleEmbedding);
      expect(result!.modelVersion).toBe('v1');
    });

    it('getVersionInfo() returns current cache model version', () => {
      const cache = new EmbeddingCache('model-v1.5', testCachePath);
      expect(cache.getVersionInfo()).toBe('model-v1.5');
    });

    it('hasVersionDrift() detects when entry version != cache version', async () => {
      // Create cache with v1 and set entry
      const cacheV1 = new EmbeddingCache('v1', testCachePath);
      cacheV1.set('skill-a', 'content', sampleEmbedding);
      await cacheV1.save();

      // Load with v2
      const cacheV2 = new EmbeddingCache('v2', testCachePath);
      await cacheV2.load();

      // Entry was created with v1 but cache is now v2 — drift detected
      expect(cacheV2.hasVersionDrift('skill-a', 'content')).toBe(true);
    });

    it('hasVersionDrift() returns false when versions match', () => {
      const cache = new EmbeddingCache('v1', testCachePath);
      cache.set('skill-a', 'content', sampleEmbedding);

      expect(cache.hasVersionDrift('skill-a', 'content')).toBe(false);
    });

    it('hasVersionDrift() returns false when entry does not exist', () => {
      const cache = new EmbeddingCache('v1', testCachePath);

      expect(cache.hasVersionDrift('nonexistent', 'content')).toBe(false);
    });

    it('getStaleVersionEntries() returns entries where modelVersion differs from current', async () => {
      // Create cache with v1 and add 3 entries
      const cache = new EmbeddingCache('v1', testCachePath);
      cache.set('skill-a', 'content-a', sampleEmbedding);
      cache.set('skill-b', 'content-b', sampleEmbedding);
      cache.set('skill-c', 'content-c', sampleEmbedding);
      await cache.save();

      // Read the cache file and manually modify one entry's modelVersion to simulate legacy data
      const raw = JSON.parse(await readFile(testCachePath, 'utf-8'));
      const entries = Object.entries(raw.entries);
      // Find the first entry key and change its modelVersion to 'v0'
      const firstKey = entries[0][0] as string;
      (raw.entries[firstKey] as { modelVersion: string }).modelVersion = 'v0';
      await writeFile(testCachePath, JSON.stringify(raw, null, 2), 'utf-8');

      // Reload cache with v1 — the v0 entry should be detected as stale
      const cache2 = new EmbeddingCache('v1', testCachePath);
      await cache2.load();

      const stale = cache2.getStaleVersionEntries();
      expect(stale).toHaveLength(1);
      expect(stale[0]).toBe(firstKey);
    });
  });
});
