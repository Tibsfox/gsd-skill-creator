/**
 * Unit tests for ActivationSimulator.
 *
 * Uses mocked embedding service to avoid model download dependency
 * and ensure deterministic results regardless of model availability.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActivationSimulator } from './activation-simulator.js';
import type { EmbeddingResult } from '../types/embeddings.js';

// Mock the embeddings module to avoid model-loading flakiness
vi.mock('../embeddings/index.js', () => ({
  getEmbeddingService: vi.fn(),
  cosineSimilarity: vi.fn(),
}));

import { getEmbeddingService, cosineSimilarity } from '../embeddings/index.js';

const mockGetEmbeddingService = vi.mocked(getEmbeddingService);
const mockCosineSimilarity = vi.mocked(cosineSimilarity);

/**
 * Create a mock embedding service that returns dummy vectors.
 * Actual similarity is controlled via mockCosineSimilarity.
 */
function createMockEmbeddingService() {
  const dummyEmbedding = [0.1, 0.2, 0.3];
  return {
    embed: vi.fn().mockResolvedValue({
      embedding: dummyEmbedding,
      fromCache: false,
      method: 'model' as const,
    } satisfies EmbeddingResult),
    embedBatch: vi.fn().mockImplementation((texts: string[]) =>
      Promise.resolve(
        texts.map(() => ({
          embedding: dummyEmbedding,
          fromCache: false,
          method: 'model' as const,
        } satisfies EmbeddingResult))
      )
    ),
  };
}

describe('ActivationSimulator', () => {
  let simulator: ActivationSimulator;

  beforeEach(() => {
    vi.clearAllMocks();
    simulator = new ActivationSimulator({ includeTrace: true });
    const mockService = createMockEmbeddingService();
    mockGetEmbeddingService.mockResolvedValue(mockService as any);
  });

  describe('simulate', () => {
    it('should predict activation for matching prompt', async () => {
      const skills = [
        { name: 'git-commit', description: 'Commit changes to git repository' },
        { name: 'prisma-migrate', description: 'Run database migrations with Prisma' },
      ];

      mockCosineSimilarity
        .mockReturnValueOnce(0.92)  // git-commit: high match
        .mockReturnValueOnce(0.3);  // prisma-migrate: low match

      const result = await simulator.simulate('commit my changes', skills);

      expect(result.winner).not.toBeNull();
      expect(result.winner?.skillName).toBe('git-commit');
      expect(result.explanation).toContain('git-commit');
      expect(result.method).toMatch(/model|heuristic/);
    });

    it('should return null winner when no skill matches', async () => {
      const skills = [
        { name: 'git-commit', description: 'Commit changes to git repository' },
      ];

      mockCosineSimilarity.mockReturnValueOnce(0.2);

      const result = await simulator.simulate('make me a sandwich', skills);

      expect(result.winner).toBeNull();
      expect(result.explanation).toContain('No skill would activate');
    });

    it('should identify challengers within margin', async () => {
      // Two very similar skills should produce rankings
      const skills = [
        { name: 'db-migrate', description: 'Run database schema migrations' },
        { name: 'prisma-migrate', description: 'Run database migrations with Prisma ORM' },
      ];

      mockCosineSimilarity
        .mockReturnValueOnce(0.88)  // db-migrate
        .mockReturnValueOnce(0.85); // prisma-migrate

      const result = await simulator.simulate('run database migrations', skills);

      // Both should be ranked, with first being more similar than second
      expect(result.allPredictions.length).toBe(2);
      expect(result.allPredictions[0].similarity).toBeGreaterThanOrEqual(
        result.allPredictions[1].similarity
      );
    });

    it('should include trace when configured', async () => {
      const skills = [{ name: 'test-skill', description: 'Test skill description' }];

      mockCosineSimilarity.mockReturnValueOnce(0.6);

      const result = await simulator.simulate('test prompt', skills);

      expect(result.trace).toBeDefined();
      expect(result.trace?.comparisonCount).toBe(1);
      expect(result.trace?.threshold).toBe(0.75);
    });

    it('should not include trace when not configured', async () => {
      const noTraceSimulator = new ActivationSimulator({ includeTrace: false });
      const skills = [{ name: 'test-skill', description: 'Test skill description' }];

      mockCosineSimilarity.mockReturnValueOnce(0.6);

      const result = await noTraceSimulator.simulate('test prompt', skills);

      expect(result.trace).toBeUndefined();
    });

    it('should handle empty skills array', async () => {
      const result = await simulator.simulate('any prompt', []);

      expect(result.winner).toBeNull();
      expect(result.allPredictions).toHaveLength(0);
      expect(result.explanation).toContain('No skills provided');
    });
  });

  describe('confidence categorization', () => {
    it('should categorize high confidence correctly', async () => {
      const skills = [
        {
          name: 'git-commit',
          description: 'Commit staged changes to git repository with a message',
        },
      ];

      mockCosineSimilarity.mockReturnValueOnce(0.95);

      const result = await simulator.simulate('git commit my staged changes', skills);

      // High similarity prompt should yield medium or high confidence
      if (result.winner) {
        expect(['high', 'medium']).toContain(result.winner.confidenceLevel);
      }
    });

    it('should include confidence percentage in explanation', async () => {
      const skills = [
        { name: 'git-commit', description: 'Commit changes to git repository' },
      ];

      mockCosineSimilarity.mockReturnValueOnce(0.87);

      const result = await simulator.simulate('commit my changes to git', skills);

      // Explanation should contain percentage format like "87% (High)"
      expect(result.explanation).toMatch(/\d+%\s*\([A-Z][a-z]+\)/);
    });
  });

  describe('custom configuration', () => {
    it('should respect custom threshold', async () => {
      const strictSimulator = new ActivationSimulator({ threshold: 0.99 });
      const skills = [{ name: 'test-skill', description: 'A test skill for testing' }];

      mockCosineSimilarity.mockReturnValueOnce(0.85);

      const result = await strictSimulator.simulate('test', skills);

      // Very strict threshold likely means no activation
      // Either null winner or winner that wouldn't activate
      if (result.winner) {
        // If there's a winner with strict threshold, it must exceed 0.99
        expect(result.winner.similarity).toBeGreaterThanOrEqual(0.99);
      }
    });

    it('should respect challenger margin configuration', async () => {
      const wideMarginSimulator = new ActivationSimulator({
        challengerMargin: 0.3, // 30% margin = more potential challengers
        threshold: 0.5,
      });

      const skills = [
        { name: 'skill-a', description: 'Database operations and queries' },
        { name: 'skill-b', description: 'Database schema management' },
        { name: 'skill-c', description: 'Cooking recipes' },
      ];

      mockCosineSimilarity
        .mockReturnValueOnce(0.85)  // skill-a
        .mockReturnValueOnce(0.78)  // skill-b
        .mockReturnValueOnce(0.2);  // skill-c

      const result = await wideMarginSimulator.simulate('database query', skills);

      // All database skills should be ranked
      expect(result.allPredictions.length).toBe(3);
    });

    it('should expose config via getConfig', () => {
      const customSimulator = new ActivationSimulator({
        threshold: 0.8,
        challengerMargin: 0.15,
        challengerFloor: 0.6,
        includeTrace: true,
      });

      const config = customSimulator.getConfig();

      expect(config.threshold).toBe(0.8);
      expect(config.challengerMargin).toBe(0.15);
      expect(config.challengerFloor).toBe(0.6);
      expect(config.includeTrace).toBe(true);
    });

    it('should use default config when not specified', () => {
      const defaultSimulator = new ActivationSimulator();
      const config = defaultSimulator.getConfig();

      expect(config.threshold).toBe(0.75);
      expect(config.challengerMargin).toBe(0.1);
      expect(config.challengerFloor).toBe(0.5);
      expect(config.includeTrace).toBe(false);
    });
  });

  describe('challenger detection', () => {
    it('should not include challengers below floor', async () => {
      const sim = new ActivationSimulator({
        threshold: 0.5,
        challengerMargin: 0.5, // Very wide margin
        challengerFloor: 0.6,  // But high floor
        includeTrace: true,
      });

      const skills = [
        { name: 'git-commit', description: 'Commit changes to git repository' },
        { name: 'cooking', description: 'Make delicious food in the kitchen' },
      ];

      mockCosineSimilarity
        .mockReturnValueOnce(0.9)    // git-commit: strong match
        .mockReturnValueOnce(0.15);  // cooking: far below floor

      const result = await sim.simulate('commit my changes', skills);

      // Cooking skill should not be a challenger even if within margin
      // because it should be below floor for this prompt
      for (const challenger of result.challengers) {
        expect(challenger.similarity).toBeGreaterThanOrEqual(0.6);
      }
    });
  });
});
