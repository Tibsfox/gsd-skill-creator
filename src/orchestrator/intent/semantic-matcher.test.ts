/**
 * Tests for SemanticMatcher - embedding-based command similarity matching.
 *
 * Uses mocked EmbeddingService to avoid model download dependency,
 * following the proven pattern from activation-simulator.test.ts.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { EmbeddingResult } from '../../types/embeddings.js';

// Mock the embeddings module to avoid model-loading flakiness
vi.mock('../../embeddings/index.js', () => ({
  getEmbeddingService: vi.fn(),
  cosineSimilarity: vi.fn(),
}));

import { getEmbeddingService, cosineSimilarity } from '../../embeddings/index.js';
import { SemanticMatcher } from './semantic-matcher.js';
import type { GsdCommandMetadata } from '../discovery/types.js';

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
    init: vi.fn().mockResolvedValue(undefined),
  };
}

// ============================================================================
// Fixtures
// ============================================================================

const TEST_COMMANDS: GsdCommandMetadata[] = [
  {
    name: 'gsd:plan-phase',
    description: 'Create detailed execution plan for a phase',
    objective: 'Create a detailed, executable plan for the specified phase',
    argumentHint: '[phase]',
    filePath: '/test/plan-phase.md',
  },
  {
    name: 'gsd:execute-phase',
    description: 'Execute all plans in a phase',
    objective: 'Run all plans in the phase with wave-based parallelization',
    argumentHint: '[phase]',
    filePath: '/test/execute-phase.md',
  },
  {
    name: 'gsd:progress',
    description: 'Show current project progress',
    objective: 'Check project progress and route to next action',
    filePath: '/test/progress.md',
  },
];

// ============================================================================
// SemanticMatcher
// ============================================================================

describe('SemanticMatcher', () => {
  let mockService: ReturnType<typeof createMockEmbeddingService>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockService = createMockEmbeddingService();
    mockGetEmbeddingService.mockResolvedValue(mockService as any);
  });

  // --------------------------------------------------------------------------
  // Initialization
  // --------------------------------------------------------------------------

  describe('initialize', () => {
    it('calls getEmbeddingService, init, then embedBatch with command descriptions', async () => {
      const matcher = new SemanticMatcher();
      await matcher.initialize(TEST_COMMANDS);

      // getEmbeddingService should be called
      expect(mockGetEmbeddingService).toHaveBeenCalledOnce();

      // init should be called on the service
      expect(mockService.init).toHaveBeenCalledOnce();

      // embedBatch should be called with formatted description+objective texts
      expect(mockService.embedBatch).toHaveBeenCalledOnce();
      const embedTexts = mockService.embedBatch.mock.calls[0][0] as string[];
      expect(embedTexts).toHaveLength(3);
      expect(embedTexts[0]).toBe('Create detailed execution plan for a phase. Create a detailed, executable plan for the specified phase');
      expect(embedTexts[1]).toBe('Execute all plans in a phase. Run all plans in the phase with wave-based parallelization');
      expect(embedTexts[2]).toBe('Show current project progress. Check project progress and route to next action');
    });
  });

  // --------------------------------------------------------------------------
  // Match - Ranking
  // --------------------------------------------------------------------------

  describe('match', () => {
    it('returns ranked matches sorted by similarity descending', async () => {
      const matcher = new SemanticMatcher();
      await matcher.initialize(TEST_COMMANDS);

      // Mock cosine similarity: progress > plan > execute
      mockCosineSimilarity
        .mockReturnValueOnce(0.7)  // plan-phase
        .mockReturnValueOnce(0.5)  // execute-phase
        .mockReturnValueOnce(0.9); // progress

      const allNames = new Set(TEST_COMMANDS.map(c => c.name));
      const matches = await matcher.match('show my progress', allNames);

      expect(matches).toHaveLength(3);
      expect(matches[0].command.name).toBe('gsd:progress');
      expect(matches[0].similarity).toBe(0.9);
      expect(matches[1].command.name).toBe('gsd:plan-phase');
      expect(matches[1].similarity).toBe(0.7);
      expect(matches[2].command.name).toBe('gsd:execute-phase');
      expect(matches[2].similarity).toBe(0.5);
    });

    it('embeds user input via embeddingService.embed()', async () => {
      const matcher = new SemanticMatcher();
      await matcher.initialize(TEST_COMMANDS);

      mockCosineSimilarity.mockReturnValue(0.5);

      const allNames = new Set(TEST_COMMANDS.map(c => c.name));
      await matcher.match('plan the next phase', allNames);

      expect(mockService.embed).toHaveBeenCalledWith('plan the next phase');
    });

    // --------------------------------------------------------------------------
    // Match - Filtering
    // --------------------------------------------------------------------------

    it('filters by candidateNames set', async () => {
      const matcher = new SemanticMatcher();
      await matcher.initialize(TEST_COMMANDS);

      mockCosineSimilarity
        .mockReturnValueOnce(0.8)  // plan-phase
        .mockReturnValueOnce(0.6); // progress

      // Only include plan-phase and progress (exclude execute-phase)
      const candidates = new Set(['gsd:plan-phase', 'gsd:progress']);
      const matches = await matcher.match('plan something', candidates);

      expect(matches).toHaveLength(2);
      const matchedNames = matches.map(m => m.command.name);
      expect(matchedNames).not.toContain('gsd:execute-phase');
    });

    it('returns empty array when candidateNames is empty', async () => {
      const matcher = new SemanticMatcher();
      await matcher.initialize(TEST_COMMANDS);

      const matches = await matcher.match('anything', new Set());

      expect(matches).toEqual([]);
    });

    // --------------------------------------------------------------------------
    // Match - Not Initialized
    // --------------------------------------------------------------------------

    it('returns empty array when not initialized', async () => {
      const matcher = new SemanticMatcher();

      const allNames = new Set(TEST_COMMANDS.map(c => c.name));
      const matches = await matcher.match('plan the next phase', allNames);

      expect(matches).toEqual([]);
    });
  });

  // --------------------------------------------------------------------------
  // isReady
  // --------------------------------------------------------------------------

  describe('isReady', () => {
    it('returns false before initialize', () => {
      const matcher = new SemanticMatcher();
      expect(matcher.isReady()).toBe(false);
    });

    it('returns true after initialize', async () => {
      const matcher = new SemanticMatcher();
      await matcher.initialize(TEST_COMMANDS);
      expect(matcher.isReady()).toBe(true);
    });
  });
});
