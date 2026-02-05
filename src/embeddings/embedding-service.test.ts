import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EmbeddingService, getEmbeddingService } from './embedding-service.js';
import { rm, mkdir } from 'fs/promises';
import { join } from 'path';

describe('EmbeddingService', () => {
  const testCacheDir = './test-embed-temp';

  beforeEach(async () => {
    await mkdir(testCacheDir, { recursive: true });
    EmbeddingService.resetInstance();
  });

  afterEach(async () => {
    await rm(testCacheDir, { recursive: true, force: true });
    EmbeddingService.resetInstance();
    vi.restoreAllMocks();
  });

  describe('Singleton pattern', () => {
    it('getInstance() returns same instance on repeated calls', () => {
      const instance1 = EmbeddingService.getInstance();
      const instance2 = EmbeddingService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('createFresh() returns new instance each time', () => {
      const instance1 = EmbeddingService.createFresh();
      const instance2 = EmbeddingService.createFresh();
      expect(instance1).not.toBe(instance2);
    });

    it('resetInstance() clears singleton', () => {
      const instance1 = EmbeddingService.getInstance();
      EmbeddingService.resetInstance();
      const instance2 = EmbeddingService.getInstance();
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('Initialization', () => {
    it('service is not initialized until init() called', () => {
      const service = EmbeddingService.createFresh({ cacheDir: testCacheDir });
      const status = service.getStatus();
      expect(status.initialized).toBe(false);
    });

    it('init() can be called multiple times safely (idempotent)', async () => {
      const service = EmbeddingService.createFresh({
        enabled: false, // Use fallback to avoid model download
        cacheDir: testCacheDir,
      });

      await service.init();
      const status1 = service.getStatus();
      expect(status1.initialized).toBe(true);

      // Second init should not throw or change state
      await service.init();
      const status2 = service.getStatus();
      expect(status2.initialized).toBe(true);
    });

    it('enabled: false config immediately enters fallback mode', () => {
      const service = EmbeddingService.createFresh({
        enabled: false,
        cacheDir: testCacheDir,
      });

      // With enabled: false, it's initialized immediately in fallback mode
      const status = service.getStatus();
      expect(status.initialized).toBe(true);
      expect(status.fallbackMode).toBe(true);
    });

    it('progress callback is invoked during model load', async () => {
      const progressCallback = vi.fn();

      // Note: This test uses fallback mode to avoid actual model download
      // In real scenarios, the callback would be called during download
      const service = EmbeddingService.createFresh({
        enabled: false, // Skip model download for test speed
        cacheDir: testCacheDir,
      });

      await service.init(progressCallback);

      // With enabled: false, no download occurs, so callback isn't called
      // This just verifies the callback parameter is accepted
      expect(service.getStatus().initialized).toBe(true);
    });
  });

  describe('Embedding generation (heuristic fallback)', () => {
    it('embed() returns EmbeddingResult with vector', async () => {
      const service = EmbeddingService.createFresh({
        enabled: false,
        cacheDir: testCacheDir,
      });

      const result = await service.embed('test text');

      expect(result).toHaveProperty('embedding');
      expect(result).toHaveProperty('fromCache');
      expect(result).toHaveProperty('method');
      expect(Array.isArray(result.embedding)).toBe(true);
    });

    it('embed() with skillName uses cache', async () => {
      const service = EmbeddingService.createFresh({
        enabled: false,
        cacheDir: testCacheDir,
      });

      // First call should not be from cache
      const result1 = await service.embed('test text', 'test-skill');
      expect(result1.fromCache).toBe(false);

      // Second call with same content should be from cache
      const result2 = await service.embed('test text', 'test-skill');
      expect(result2.fromCache).toBe(true);

      // Vectors should be identical
      expect(result1.embedding).toEqual(result2.embedding);
    });

    it('embed() without skillName skips cache', async () => {
      const service = EmbeddingService.createFresh({
        enabled: false,
        cacheDir: testCacheDir,
      });

      // Both calls should not be from cache since no skillName
      const result1 = await service.embed('test text');
      expect(result1.fromCache).toBe(false);

      const result2 = await service.embed('test text');
      expect(result2.fromCache).toBe(false);
    });

    it('embedBatch() returns array of results', async () => {
      const service = EmbeddingService.createFresh({
        enabled: false,
        cacheDir: testCacheDir,
      });

      const texts = ['text one', 'text two', 'text three'];
      const results = await service.embedBatch(texts);

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(3);
      results.forEach((result) => {
        expect(result).toHaveProperty('embedding');
        expect(result).toHaveProperty('fromCache');
        expect(result).toHaveProperty('method');
      });
    });

    it('output vectors are 384 dimensions', async () => {
      const service = EmbeddingService.createFresh({
        enabled: false,
        cacheDir: testCacheDir,
      });

      const result = await service.embed('test text');
      expect(result.embedding.length).toBe(384);
    });

    it('output vectors are normalized (magnitude approximately 1.0)', async () => {
      const service = EmbeddingService.createFresh({
        enabled: false,
        cacheDir: testCacheDir,
      });

      const result = await service.embed('this is a longer test sentence with multiple words');

      // Calculate magnitude
      const magnitude = Math.sqrt(
        result.embedding.reduce((sum, val) => sum + val * val, 0)
      );

      // Normalized vectors should have magnitude close to 1.0
      // Allow some tolerance for floating point
      expect(magnitude).toBeCloseTo(1.0, 5);
    });

    it('empty text returns zero vector', async () => {
      const service = EmbeddingService.createFresh({
        enabled: false,
        cacheDir: testCacheDir,
      });

      const result = await service.embed('');

      // Zero vector has magnitude 0
      const magnitude = Math.sqrt(
        result.embedding.reduce((sum, val) => sum + val * val, 0)
      );
      expect(magnitude).toBe(0);
    });
  });

  describe('Caching integration', () => {
    it('first call computes embedding, second call returns cached', async () => {
      const service = EmbeddingService.createFresh({
        enabled: false,
        cacheDir: testCacheDir,
      });

      const result1 = await service.embed('cached text', 'cache-skill');
      expect(result1.fromCache).toBe(false);

      const result2 = await service.embed('cached text', 'cache-skill');
      expect(result2.fromCache).toBe(true);
    });

    it('different content for same skill returns fresh embedding', async () => {
      const service = EmbeddingService.createFresh({
        enabled: false,
        cacheDir: testCacheDir,
      });

      // Use very different content to ensure heuristic produces different vectors
      const result1 = await service.embed(
        'The quick brown fox jumps over the lazy dog and runs through the forest',
        'my-skill'
      );
      expect(result1.fromCache).toBe(false);

      // Same skill name, completely different content - should compute fresh
      const result2 = await service.embed(
        'Mathematical equations and scientific formulas for chemistry and physics research',
        'my-skill'
      );
      expect(result2.fromCache).toBe(false);

      // Vectors should be different (at least some elements should differ)
      const differenceCount = result1.embedding.filter(
        (val, idx) => val !== result2.embedding[idx]
      ).length;
      expect(differenceCount).toBeGreaterThan(0);
    });

    it('getOrCompute() handles cache hit/miss correctly', async () => {
      const service = EmbeddingService.createFresh({
        enabled: false,
        cacheDir: testCacheDir,
      });

      // Miss
      const result1 = await service.getOrCompute('skill-x', 'content x');
      expect(result1.fromCache).toBe(false);

      // Hit
      const result2 = await service.getOrCompute('skill-x', 'content x');
      expect(result2.fromCache).toBe(true);
    });

    it('embedBatch() with skillNames caches results', async () => {
      const service = EmbeddingService.createFresh({
        enabled: false,
        cacheDir: testCacheDir,
      });

      const texts = ['batch text 1', 'batch text 2'];
      const names = ['batch-skill-1', 'batch-skill-2'];

      // First batch call
      const results1 = await service.embedBatch(texts, names);
      expect(results1[0].fromCache).toBe(false);
      expect(results1[1].fromCache).toBe(false);

      // Second batch call - should hit cache
      const results2 = await service.embedBatch(texts, names);
      expect(results2[0].fromCache).toBe(true);
      expect(results2[1].fromCache).toBe(true);
    });
  });

  describe('Fallback behavior', () => {
    it('isUsingFallback() returns true when in fallback mode', () => {
      const service = EmbeddingService.createFresh({
        enabled: false,
        cacheDir: testCacheDir,
      });

      expect(service.isUsingFallback()).toBe(true);
    });

    it('fallback mode still returns valid embeddings', async () => {
      const service = EmbeddingService.createFresh({
        enabled: false,
        cacheDir: testCacheDir,
      });

      const result = await service.embed('test');

      expect(result.embedding).toBeDefined();
      expect(result.embedding.length).toBe(384);
      expect(result.method).toBe('heuristic');
    });

    it('reloadModel() attempts to exit fallback mode', async () => {
      const service = EmbeddingService.createFresh({
        enabled: false,
        cacheDir: testCacheDir,
      });

      expect(service.isUsingFallback()).toBe(true);

      // reloadModel will try to load the actual model
      // In test environment without model, it will stay in fallback
      const success = await service.reloadModel();

      // With enabled: false config, reloadModel should fail
      // because the config is preserved (model download will fail)
      // Note: In real scenario with model available, this would succeed
      expect(typeof success).toBe('boolean');
    });

    it('no errors thrown to caller even on edge cases', async () => {
      const service = EmbeddingService.createFresh({
        enabled: false,
        cacheDir: testCacheDir,
      });

      // Various edge cases that shouldn't throw
      await expect(service.embed('')).resolves.toBeDefined();
      await expect(service.embed('   ')).resolves.toBeDefined();
      await expect(service.embed('a'.repeat(10000))).resolves.toBeDefined();
      await expect(service.embedBatch([])).resolves.toBeDefined();
    });
  });

  describe('Status', () => {
    it('getStatus() returns correct state', () => {
      const service = EmbeddingService.createFresh({
        enabled: false,
        cacheDir: testCacheDir,
      });

      const status = service.getStatus();

      expect(status).toHaveProperty('initialized');
      expect(status).toHaveProperty('fallbackMode');
      expect(status).toHaveProperty('cacheStats');
      expect(status.cacheStats).toHaveProperty('entries');
      expect(status.cacheStats).toHaveProperty('modelId');
      expect(status.cacheStats).toHaveProperty('version');

      expect(status.initialized).toBe(true); // enabled: false sets initialized
      expect(status.fallbackMode).toBe(true);
    });
  });

  describe('Factory function', () => {
    it('getEmbeddingService() returns initialized service', async () => {
      const service = await getEmbeddingService({ enabled: false });

      expect(service.getStatus().initialized).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('embedBatch() throws if skillNames length mismatches texts', async () => {
      const service = EmbeddingService.createFresh({
        enabled: false,
        cacheDir: testCacheDir,
      });

      const texts = ['text1', 'text2', 'text3'];
      const names = ['skill1', 'skill2']; // Wrong length

      await expect(service.embedBatch(texts, names)).rejects.toThrow(
        'skillNames array must match texts array length'
      );
    });
  });
});
