/**
 * Unit tests for ConflictDetector.
 *
 * Uses mocked embedding service to avoid model download in tests.
 * Tests cover edge cases, threshold clamping, and algorithm correctness.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConflictDetector } from './conflict-detector.js';
import type { EmbeddingResult } from '../types/embeddings.js';

// Mock the embeddings module
vi.mock('../embeddings/index.js', () => ({
  getEmbeddingService: vi.fn(),
  cosineSimilarity: vi.fn(),
}));

// Import mocked functions for manipulation
import { getEmbeddingService, cosineSimilarity } from '../embeddings/index.js';

const mockGetEmbeddingService = vi.mocked(getEmbeddingService);
const mockCosineSimilarity = vi.mocked(cosineSimilarity);

/**
 * Create a mock embedding service with configurable behavior.
 */
function createMockEmbeddingService(embeddings: number[][], method: 'model' | 'heuristic' = 'model') {
  return {
    embedBatch: vi.fn().mockResolvedValue(
      embeddings.map((embedding) => ({
        embedding,
        fromCache: false,
        method,
      } as EmbeddingResult))
    ),
  };
}

describe('ConflictDetector', () => {
  // Suppress console.warn during tests
  const originalWarn = console.warn;

  beforeEach(() => {
    vi.clearAllMocks();
    console.warn = vi.fn();
  });

  afterEach(() => {
    console.warn = originalWarn;
  });

  describe('empty and single skill cases', () => {
    it('returns empty conflicts for empty skills array', async () => {
      const detector = new ConflictDetector();

      const result = await detector.detect([]);

      expect(result.conflicts).toEqual([]);
      expect(result.skillCount).toBe(0);
      expect(result.pairsAnalyzed).toBe(0);
      expect(result.threshold).toBe(0.85);
      expect(result.analysisMethod).toBe('heuristic');
    });

    it('returns empty conflicts for single skill', async () => {
      const detector = new ConflictDetector();

      const result = await detector.detect([
        { name: 'skill-1', description: 'A skill that does something' },
      ]);

      expect(result.conflicts).toEqual([]);
      expect(result.skillCount).toBe(1);
      expect(result.pairsAnalyzed).toBe(0);
    });
  });

  describe('threshold clamping', () => {
    it('clamps threshold below 0.5 to 0.5', async () => {
      const detector = new ConflictDetector({ threshold: 0.3 });

      // Setup mock
      const mockService = createMockEmbeddingService([[1, 0, 0], [1, 0, 0]]);
      mockGetEmbeddingService.mockResolvedValue(mockService as any);
      mockCosineSimilarity.mockReturnValue(0.6);

      const result = await detector.detect([
        { name: 'skill-1', description: 'Description A' },
        { name: 'skill-2', description: 'Description B' },
      ]);

      expect(console.warn).toHaveBeenCalledWith(
        'Threshold 0.3 is below minimum 0.5, clamping to 0.5'
      );
      expect(result.threshold).toBe(0.5);
      // 0.6 > 0.5, so should detect conflict
      expect(result.conflicts.length).toBe(1);
    });

    it('clamps threshold above 0.95 to 0.95', async () => {
      const detector = new ConflictDetector({ threshold: 0.99 });

      // Setup mock
      const mockService = createMockEmbeddingService([[1, 0, 0], [1, 0, 0]]);
      mockGetEmbeddingService.mockResolvedValue(mockService as any);
      mockCosineSimilarity.mockReturnValue(0.94);

      const result = await detector.detect([
        { name: 'skill-1', description: 'Description A' },
        { name: 'skill-2', description: 'Description B' },
      ]);

      expect(console.warn).toHaveBeenCalledWith(
        'Threshold 0.99 is above maximum 0.95, clamping to 0.95'
      );
      expect(result.threshold).toBe(0.95);
      // 0.94 < 0.95, so should NOT detect conflict
      expect(result.conflicts.length).toBe(0);
    });

    it('accepts threshold within valid range without warning', async () => {
      const detector = new ConflictDetector({ threshold: 0.80 });

      // Setup mock
      const mockService = createMockEmbeddingService([[1, 0, 0], [1, 0, 0]]);
      mockGetEmbeddingService.mockResolvedValue(mockService as any);
      mockCosineSimilarity.mockReturnValue(0.5);

      const result = await detector.detect([
        { name: 'skill-1', description: 'Description A' },
        { name: 'skill-2', description: 'Description B' },
      ]);

      expect(console.warn).not.toHaveBeenCalled();
      expect(result.threshold).toBe(0.80);
    });
  });

  describe('conflict detection', () => {
    it('detects conflict when similarity exceeds threshold', async () => {
      const detector = new ConflictDetector({ threshold: 0.85 });

      // Setup mock - similar skills
      const mockService = createMockEmbeddingService([
        [1, 0, 0], // skill-1
        [0.99, 0.14, 0], // skill-2 - similar to skill-1
      ]);
      mockGetEmbeddingService.mockResolvedValue(mockService as any);
      mockCosineSimilarity.mockReturnValue(0.99); // Very similar

      const result = await detector.detect([
        { name: 'skill-1', description: 'Parse JSON data from API response' },
        { name: 'skill-2', description: 'Extract JSON data from API endpoint' },
      ]);

      expect(result.conflicts.length).toBe(1);
      expect(result.conflicts[0].skillA).toBe('skill-1');
      expect(result.conflicts[0].skillB).toBe('skill-2');
      expect(result.conflicts[0].similarity).toBe(0.99);
    });

    it('does not detect conflict when similarity is below threshold', async () => {
      const detector = new ConflictDetector({ threshold: 0.85 });

      // Setup mock - dissimilar skills
      const mockService = createMockEmbeddingService([
        [1, 0, 0], // skill-1
        [0, 1, 0], // skill-2 - orthogonal to skill-1
      ]);
      mockGetEmbeddingService.mockResolvedValue(mockService as any);
      mockCosineSimilarity.mockReturnValue(0.3); // Low similarity

      const result = await detector.detect([
        { name: 'skill-1', description: 'Parse JSON data' },
        { name: 'skill-2', description: 'Draw graphics on canvas' },
      ]);

      expect(result.conflicts.length).toBe(0);
    });

    it('detects conflict at exactly threshold value', async () => {
      const detector = new ConflictDetector({ threshold: 0.85 });

      // Setup mock
      const mockService = createMockEmbeddingService([
        [1, 0, 0],
        [1, 0, 0],
      ]);
      mockGetEmbeddingService.mockResolvedValue(mockService as any);
      mockCosineSimilarity.mockReturnValue(0.85); // Exactly at threshold

      const result = await detector.detect([
        { name: 'skill-1', description: 'Description A' },
        { name: 'skill-2', description: 'Description B' },
      ]);

      expect(result.conflicts.length).toBe(1);
    });
  });

  describe('severity assignment', () => {
    it('assigns high severity when similarity > 0.90', async () => {
      const detector = new ConflictDetector({ threshold: 0.85 });

      const mockService = createMockEmbeddingService([[1, 0, 0], [1, 0, 0]]);
      mockGetEmbeddingService.mockResolvedValue(mockService as any);
      mockCosineSimilarity.mockReturnValue(0.95);

      const result = await detector.detect([
        { name: 'skill-1', description: 'Description A' },
        { name: 'skill-2', description: 'Description B' },
      ]);

      expect(result.conflicts[0].severity).toBe('high');
    });

    it('assigns medium severity when similarity is 0.90 exactly', async () => {
      const detector = new ConflictDetector({ threshold: 0.85 });

      const mockService = createMockEmbeddingService([[1, 0, 0], [1, 0, 0]]);
      mockGetEmbeddingService.mockResolvedValue(mockService as any);
      mockCosineSimilarity.mockReturnValue(0.90);

      const result = await detector.detect([
        { name: 'skill-1', description: 'Description A' },
        { name: 'skill-2', description: 'Description B' },
      ]);

      expect(result.conflicts[0].severity).toBe('medium');
    });

    it('assigns medium severity when similarity is below 0.90', async () => {
      const detector = new ConflictDetector({ threshold: 0.85 });

      const mockService = createMockEmbeddingService([[1, 0, 0], [1, 0, 0]]);
      mockGetEmbeddingService.mockResolvedValue(mockService as any);
      mockCosineSimilarity.mockReturnValue(0.88);

      const result = await detector.detect([
        { name: 'skill-1', description: 'Description A' },
        { name: 'skill-2', description: 'Description B' },
      ]);

      expect(result.conflicts[0].severity).toBe('medium');
    });
  });

  describe('overlapping terms extraction', () => {
    it('extracts common domain-specific terms', async () => {
      const detector = new ConflictDetector({ threshold: 0.85 });

      const mockService = createMockEmbeddingService([[1, 0, 0], [1, 0, 0]]);
      mockGetEmbeddingService.mockResolvedValue(mockService as any);
      mockCosineSimilarity.mockReturnValue(0.92);

      const result = await detector.detect([
        { name: 'skill-1', description: 'Parse JSON response from the API endpoint' },
        { name: 'skill-2', description: 'Extract JSON data from API service' },
      ]);

      // Should find: api, json (case-insensitive)
      expect(result.conflicts[0].overlappingTerms).toContain('json');
      expect(result.conflicts[0].overlappingTerms).toContain('api');
    });

    it('filters out stop words from overlapping terms', async () => {
      const detector = new ConflictDetector({ threshold: 0.85 });

      const mockService = createMockEmbeddingService([[1, 0, 0], [1, 0, 0]]);
      mockGetEmbeddingService.mockResolvedValue(mockService as any);
      mockCosineSimilarity.mockReturnValue(0.92);

      const result = await detector.detect([
        { name: 'skill-1', description: 'the api endpoint is for data' },
        { name: 'skill-2', description: 'the api service is for users' },
      ]);

      // 'the', 'is', 'for' are stop words and should be filtered
      expect(result.conflicts[0].overlappingTerms).not.toContain('the');
      expect(result.conflicts[0].overlappingTerms).not.toContain('is');
      expect(result.conflicts[0].overlappingTerms).not.toContain('for');
      // 'api' should be included
      expect(result.conflicts[0].overlappingTerms).toContain('api');
    });

    it('filters out short words (2 chars or less)', async () => {
      const detector = new ConflictDetector({ threshold: 0.85 });

      const mockService = createMockEmbeddingService([[1, 0, 0], [1, 0, 0]]);
      mockGetEmbeddingService.mockResolvedValue(mockService as any);
      mockCosineSimilarity.mockReturnValue(0.92);

      const result = await detector.detect([
        { name: 'skill-1', description: 'do it on database' },
        { name: 'skill-2', description: 'do it on server' },
      ]);

      // 'do', 'it', 'on' are too short
      expect(result.conflicts[0].overlappingTerms).not.toContain('do');
      expect(result.conflicts[0].overlappingTerms).not.toContain('it');
      expect(result.conflicts[0].overlappingTerms).not.toContain('on');
    });

    it('returns empty array when no common terms', async () => {
      const detector = new ConflictDetector({ threshold: 0.85 });

      const mockService = createMockEmbeddingService([[1, 0, 0], [1, 0, 0]]);
      mockGetEmbeddingService.mockResolvedValue(mockService as any);
      mockCosineSimilarity.mockReturnValue(0.92);

      const result = await detector.detect([
        { name: 'skill-1', description: 'parse json data' },
        { name: 'skill-2', description: 'draw canvas graphics' },
      ]);

      expect(result.conflicts[0].overlappingTerms).toEqual([]);
    });
  });

  describe('results sorting', () => {
    it('sorts conflicts by similarity descending', async () => {
      const detector = new ConflictDetector({ threshold: 0.50 });

      // Three skills - need to set up sequential similarity calls
      const mockService = createMockEmbeddingService([
        [1, 0, 0],
        [1, 0, 0],
        [1, 0, 0],
      ]);
      mockGetEmbeddingService.mockResolvedValue(mockService as any);

      // Pairs: (0,1)=0.70, (0,2)=0.95, (1,2)=0.85
      mockCosineSimilarity
        .mockReturnValueOnce(0.70) // skill-1 vs skill-2
        .mockReturnValueOnce(0.95) // skill-1 vs skill-3
        .mockReturnValueOnce(0.85); // skill-2 vs skill-3

      const result = await detector.detect([
        { name: 'skill-1', description: 'Description A' },
        { name: 'skill-2', description: 'Description B' },
        { name: 'skill-3', description: 'Description C' },
      ]);

      expect(result.conflicts.length).toBe(3);
      expect(result.conflicts[0].similarity).toBe(0.95);
      expect(result.conflicts[1].similarity).toBe(0.85);
      expect(result.conflicts[2].similarity).toBe(0.70);
    });
  });

  describe('pairsAnalyzed count', () => {
    it('correctly counts pairs for 2 skills', async () => {
      const detector = new ConflictDetector();

      const mockService = createMockEmbeddingService([[1, 0, 0], [1, 0, 0]]);
      mockGetEmbeddingService.mockResolvedValue(mockService as any);
      mockCosineSimilarity.mockReturnValue(0.5);

      const result = await detector.detect([
        { name: 'skill-1', description: 'A' },
        { name: 'skill-2', description: 'B' },
      ]);

      // n*(n-1)/2 = 2*1/2 = 1
      expect(result.pairsAnalyzed).toBe(1);
    });

    it('correctly counts pairs for 4 skills', async () => {
      const detector = new ConflictDetector();

      const mockService = createMockEmbeddingService([
        [1, 0, 0],
        [1, 0, 0],
        [1, 0, 0],
        [1, 0, 0],
      ]);
      mockGetEmbeddingService.mockResolvedValue(mockService as any);
      mockCosineSimilarity.mockReturnValue(0.5);

      const result = await detector.detect([
        { name: 'skill-1', description: 'A' },
        { name: 'skill-2', description: 'B' },
        { name: 'skill-3', description: 'C' },
        { name: 'skill-4', description: 'D' },
      ]);

      // n*(n-1)/2 = 4*3/2 = 6
      expect(result.pairsAnalyzed).toBe(6);
    });

    it('correctly counts pairs for 5 skills', async () => {
      const detector = new ConflictDetector();

      const mockService = createMockEmbeddingService([
        [1, 0, 0],
        [1, 0, 0],
        [1, 0, 0],
        [1, 0, 0],
        [1, 0, 0],
      ]);
      mockGetEmbeddingService.mockResolvedValue(mockService as any);
      mockCosineSimilarity.mockReturnValue(0.5);

      const result = await detector.detect([
        { name: 'skill-1', description: 'A' },
        { name: 'skill-2', description: 'B' },
        { name: 'skill-3', description: 'C' },
        { name: 'skill-4', description: 'D' },
        { name: 'skill-5', description: 'E' },
      ]);

      // n*(n-1)/2 = 5*4/2 = 10
      expect(result.pairsAnalyzed).toBe(10);
    });
  });

  describe('analysis method tracking', () => {
    it('reports model method when embedding service uses model', async () => {
      const detector = new ConflictDetector();

      const mockService = createMockEmbeddingService([[1, 0, 0], [1, 0, 0]], 'model');
      mockGetEmbeddingService.mockResolvedValue(mockService as any);
      mockCosineSimilarity.mockReturnValue(0.5);

      const result = await detector.detect([
        { name: 'skill-1', description: 'A' },
        { name: 'skill-2', description: 'B' },
      ]);

      expect(result.analysisMethod).toBe('model');
    });

    it('reports heuristic method when embedding service uses heuristic', async () => {
      const detector = new ConflictDetector();

      const mockService = createMockEmbeddingService([[1, 0, 0], [1, 0, 0]], 'heuristic');
      mockGetEmbeddingService.mockResolvedValue(mockService as any);
      mockCosineSimilarity.mockReturnValue(0.5);

      const result = await detector.detect([
        { name: 'skill-1', description: 'A' },
        { name: 'skill-2', description: 'B' },
      ]);

      expect(result.analysisMethod).toBe('heuristic');
    });
  });

  describe('full conflict pair data', () => {
    it('includes all required fields in conflict pair', async () => {
      const detector = new ConflictDetector({ threshold: 0.85 });

      const mockService = createMockEmbeddingService([[1, 0, 0], [1, 0, 0]]);
      mockGetEmbeddingService.mockResolvedValue(mockService as any);
      mockCosineSimilarity.mockReturnValue(0.92);

      const skills = [
        { name: 'parse-json', description: 'Parse JSON response from the server' },
        { name: 'extract-json', description: 'Extract JSON data from the server' },
      ];

      const result = await detector.detect(skills);

      expect(result.conflicts.length).toBe(1);
      const conflict = result.conflicts[0];

      expect(conflict.skillA).toBe('parse-json');
      expect(conflict.skillB).toBe('extract-json');
      expect(conflict.similarity).toBe(0.92);
      expect(conflict.severity).toBe('high');
      expect(conflict.overlappingTerms).toContain('json');
      expect(conflict.overlappingTerms).toContain('server');
      expect(conflict.descriptionA).toBe('Parse JSON response from the server');
      expect(conflict.descriptionB).toBe('Extract JSON data from the server');
    });
  });

  describe('default threshold', () => {
    it('uses 0.85 as default threshold', async () => {
      const detector = new ConflictDetector();

      const mockService = createMockEmbeddingService([[1, 0, 0], [1, 0, 0]]);
      mockGetEmbeddingService.mockResolvedValue(mockService as any);
      mockCosineSimilarity.mockReturnValue(0.84);

      const result = await detector.detect([
        { name: 'skill-1', description: 'A' },
        { name: 'skill-2', description: 'B' },
      ]);

      expect(result.threshold).toBe(0.85);
      // 0.84 < 0.85, so no conflict
      expect(result.conflicts.length).toBe(0);
    });
  });
});
