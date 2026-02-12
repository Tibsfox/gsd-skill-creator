import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PipelineContext } from '../application/skill-pipeline.js';
import type { ScoredSkill } from '../types/application.js';
import type { SkillIndexEntry } from '../storage/skill-index.js';
import type { EmbeddingService } from '../embeddings/embedding-service.js';
import type { RelevanceScorer } from '../application/relevance-scorer.js';
import type { EmbeddingResult } from '../types/embeddings.js';
import { CorrectionStage, DEFAULT_CORRECTION_CONFIG } from './corrective-rag.js';
import type { CorrectionConfig } from './corrective-rag.js';

// --- Mock helpers ---

function createMockContext(overrides: Partial<PipelineContext> = {}): PipelineContext {
  return {
    intent: 'test query',
    file: undefined,
    context: undefined,
    matches: [],
    scoredSkills: [],
    resolvedSkills: [],
    conflicts: { hasConflict: false, conflictingSkills: [], resolution: 'priority' },
    loaded: [],
    skipped: [],
    budgetSkipped: [],
    budgetWarnings: [],
    contentCache: new Map(),
    modelProfile: undefined,
    earlyExit: false,
    getReport: () => ({
      activeSkills: [],
      totalTokens: 0,
      budgetLimit: 0,
      budgetUsedPercent: 0,
      remainingBudget: 0,
      tokenTracking: [],
      flaggedSkills: [],
    }),
    ...overrides,
  };
}

/**
 * Creates a mock EmbeddingService with controllable embed() responses.
 * callResponses: array of EmbeddingResult to return on successive calls.
 * If exhausted, returns a default zero-vector embedding.
 */
function createMockEmbedding(callResponses: EmbeddingResult[] = []): EmbeddingService {
  let callIndex = 0;
  const defaultResult: EmbeddingResult = {
    embedding: [0.1, 0.2, 0.3],
    fromCache: false,
    method: 'heuristic',
  };

  return {
    embed: vi.fn(async (_text: string, _skillName?: string): Promise<EmbeddingResult> => {
      if (callIndex < callResponses.length) {
        return callResponses[callIndex++];
      }
      return defaultResult;
    }),
  } as unknown as EmbeddingService;
}

/**
 * Creates a mock RelevanceScorer with controllable scoreAgainstQuery() responses.
 * callResponses: array of ScoredSkill[] to return on successive calls.
 */
function createMockScorer(callResponses: ScoredSkill[][] = []): RelevanceScorer {
  let callIndex = 0;

  return {
    scoreAgainstQuery: vi.fn((_query: string, _threshold?: number): ScoredSkill[] => {
      if (callIndex < callResponses.length) {
        return callResponses[callIndex++];
      }
      return [];
    }),
    indexSkills: vi.fn(),
    isIndexed: vi.fn(() => true),
  } as unknown as RelevanceScorer;
}

function createMockMatch(overrides: Partial<SkillIndexEntry> = {}): SkillIndexEntry {
  return {
    name: 'test-skill',
    description: 'A test skill for unit testing',
    enabled: true,
    triggers: { intents: ['test'], contexts: ['testing'] },
    path: '/test/path',
    mtime: Date.now(),
    ...overrides,
  };
}

// --- Tests ---

describe('CorrectionStage', () => {
  let mockEmbedding: EmbeddingService;
  let mockScorer: RelevanceScorer;

  beforeEach(() => {
    mockEmbedding = createMockEmbedding();
    mockScorer = createMockScorer();
  });

  it('a. name property is "correction"', () => {
    const stage = new CorrectionStage(mockEmbedding, mockScorer);
    expect(stage.name).toBe('correction');
  });

  it('b. process() passes through when earlyExit is true', async () => {
    const stage = new CorrectionStage(mockEmbedding, mockScorer);
    const context = createMockContext({
      earlyExit: true,
      scoredSkills: [{ name: 'skill-a', score: 0.3, matchType: 'intent' }],
    });

    const result = await stage.process(context);

    expect(result.earlyExit).toBe(true);
    expect(result.scoredSkills).toEqual([{ name: 'skill-a', score: 0.3, matchType: 'intent' }]);
    expect(mockEmbedding.embed).not.toHaveBeenCalled();
  });

  it('c. process() passes through when scoredSkills is empty', async () => {
    const stage = new CorrectionStage(mockEmbedding, mockScorer);
    const context = createMockContext({
      scoredSkills: [],
    });

    const result = await stage.process(context);

    expect(result.scoredSkills).toEqual([]);
    expect(mockEmbedding.embed).not.toHaveBeenCalled();
  });

  it('d. process() passes through when top score >= confidenceThreshold', async () => {
    const config: CorrectionConfig = {
      confidenceThreshold: 0.7,
      maxIterations: 3,
      minImprovementRate: 0.05,
    };
    const stage = new CorrectionStage(mockEmbedding, mockScorer, config);

    const context = createMockContext({
      scoredSkills: [{ name: 'skill-a', score: 0.8, matchType: 'intent' }],
    });

    const result = await stage.process(context);

    expect(result.scoredSkills).toEqual([{ name: 'skill-a', score: 0.8, matchType: 'intent' }]);
    expect(mockEmbedding.embed).not.toHaveBeenCalled();
  });

  it('e. process() triggers correction when top score < confidenceThreshold', async () => {
    // Query embedding
    const queryEmbedding: EmbeddingResult = {
      embedding: [0.5, 0.5, 0.5],
      fromCache: false,
      method: 'heuristic',
    };
    // Match embedding that is highly similar to query
    const matchEmbedding: EmbeddingResult = {
      embedding: [0.5, 0.5, 0.5],
      fromCache: false,
      method: 'heuristic',
    };

    // For re-scoring: embed returns query embedding first, then match embedding
    mockEmbedding = createMockEmbedding([queryEmbedding, matchEmbedding]);

    const config: CorrectionConfig = {
      confidenceThreshold: 0.7,
      maxIterations: 3,
      minImprovementRate: 0.05,
    };
    const stage = new CorrectionStage(mockEmbedding, mockScorer, config);

    const match = createMockMatch({ name: 'skill-a', description: 'Deploy API to kubernetes' });
    const context = createMockContext({
      intent: 'deploy api',
      scoredSkills: [{ name: 'skill-a', score: 0.3, matchType: 'intent' }],
      matches: [match],
    });

    const result = await stage.process(context);

    // Correction should have been triggered (embed was called)
    expect(mockEmbedding.embed).toHaveBeenCalled();
    // Scores should be updated (cosine similarity of identical vectors = 1.0)
    expect(result.scoredSkills.length).toBeGreaterThan(0);
    expect(result.scoredSkills[0].score).toBeGreaterThan(0.3);
  });

  it('f. process() stops at maxIterations (3) even if still below threshold', async () => {
    // Always return same low-similarity embeddings so threshold never met
    const queryEmb: EmbeddingResult = {
      embedding: [1.0, 0.0, 0.0],
      fromCache: false,
      method: 'heuristic',
    };
    const matchEmb: EmbeddingResult = {
      embedding: [0.0, 1.0, 0.0],
      fromCache: false,
      method: 'heuristic',
    };

    // Need 2 embeddings per iteration (query + 1 match) x 3 iterations = 6 calls
    // But improvement will be 0 each time, so it may stop at iteration 1 due to diminishing returns
    // Make improvement just above threshold for first iterations
    const responses: EmbeddingResult[] = [];
    // Iteration 1: query + match => low similarity but some improvement
    responses.push({ embedding: [1.0, 0.0, 0.0], fromCache: false, method: 'heuristic' }); // query
    responses.push({ embedding: [0.6, 0.8, 0.0], fromCache: false, method: 'heuristic' }); // match ~0.6 similarity
    // Iteration 2: slightly higher improvement
    responses.push({ embedding: [1.0, 0.0, 0.0], fromCache: false, method: 'heuristic' }); // query
    responses.push({ embedding: [0.65, 0.76, 0.0], fromCache: false, method: 'heuristic' }); // match ~0.65 similarity
    // Iteration 3: similar improvement
    responses.push({ embedding: [1.0, 0.0, 0.0], fromCache: false, method: 'heuristic' }); // query
    responses.push({ embedding: [0.69, 0.72, 0.0], fromCache: false, method: 'heuristic' }); // match ~0.69 similarity

    mockEmbedding = createMockEmbedding(responses);

    const config: CorrectionConfig = {
      confidenceThreshold: 0.9, // Very high threshold, never met
      maxIterations: 3,
      minImprovementRate: 0.01, // Very low min improvement so we don't stop early
    };
    const stage = new CorrectionStage(mockEmbedding, mockScorer, config);

    const match = createMockMatch({ name: 'skill-a', description: 'Skill description' });
    const context = createMockContext({
      intent: 'test query',
      scoredSkills: [{ name: 'skill-a', score: 0.3, matchType: 'intent' }],
      matches: [match],
    });

    const result = await stage.process(context);

    // Should have completed (no infinite loop)
    expect(result).toBeDefined();
    // embed() called 2x per iteration (query + 1 match) x 3 iterations = 6
    expect(mockEmbedding.embed).toHaveBeenCalledTimes(6);
  });

  it('g. process() stops early when improvement < minImprovementRate', async () => {
    // Iteration 1: score improves from 0.30 -> 0.50 (67% improvement, above 5%)
    // Iteration 2: score improves from 0.50 -> 0.51 (2% improvement, below 5%)
    const responses: EmbeddingResult[] = [];
    // Iteration 1
    responses.push({ embedding: [1.0, 0.0, 0.0], fromCache: false, method: 'heuristic' }); // query
    responses.push({ embedding: [0.87, 0.5, 0.0], fromCache: false, method: 'heuristic' }); // match => cosine ~0.87
    // Iteration 2
    responses.push({ embedding: [1.0, 0.0, 0.0], fromCache: false, method: 'heuristic' }); // query
    responses.push({ embedding: [0.88, 0.48, 0.0], fromCache: false, method: 'heuristic' }); // match => cosine ~0.88 (tiny improvement)

    mockEmbedding = createMockEmbedding(responses);

    const config: CorrectionConfig = {
      confidenceThreshold: 0.95, // High threshold to not exit early via threshold
      maxIterations: 3,
      minImprovementRate: 0.05,
    };
    const stage = new CorrectionStage(mockEmbedding, mockScorer, config);

    const match = createMockMatch({ name: 'skill-a', description: 'Skill description' });
    const context = createMockContext({
      intent: 'test query',
      scoredSkills: [{ name: 'skill-a', score: 0.3, matchType: 'intent' }],
      matches: [match],
    });

    const result = await stage.process(context);

    expect(result).toBeDefined();
    // Only 2 iterations occurred: 2 embed calls per iteration = 4 total
    expect(mockEmbedding.embed).toHaveBeenCalledTimes(4);
  });

  it('h. process() stops early when score exceeds threshold mid-loop', async () => {
    // Iteration 1: perfect similarity => 1.0 score, exceeds 0.7 threshold
    const responses: EmbeddingResult[] = [];
    responses.push({ embedding: [1.0, 0.0, 0.0], fromCache: false, method: 'heuristic' }); // query
    responses.push({ embedding: [1.0, 0.0, 0.0], fromCache: false, method: 'heuristic' }); // match => cosine = 1.0

    mockEmbedding = createMockEmbedding(responses);

    const config: CorrectionConfig = {
      confidenceThreshold: 0.7,
      maxIterations: 3,
      minImprovementRate: 0.05,
    };
    const stage = new CorrectionStage(mockEmbedding, mockScorer, config);

    const match = createMockMatch({ name: 'skill-a', description: 'Skill description' });
    const context = createMockContext({
      intent: 'test query',
      scoredSkills: [{ name: 'skill-a', score: 0.3, matchType: 'intent' }],
      matches: [match],
    });

    const result = await stage.process(context);

    // Only 1 iteration: 2 embed calls
    expect(mockEmbedding.embed).toHaveBeenCalledTimes(2);
    // Score should now be above threshold
    expect(result.scoredSkills[0].score).toBeGreaterThanOrEqual(0.7);
  });

  it('i. process() uses query from context.intent and context.context', async () => {
    const responses: EmbeddingResult[] = [];
    responses.push({ embedding: [1.0, 0.0, 0.0], fromCache: false, method: 'heuristic' }); // query
    responses.push({ embedding: [1.0, 0.0, 0.0], fromCache: false, method: 'heuristic' }); // match

    mockEmbedding = createMockEmbedding(responses);

    const config: CorrectionConfig = {
      confidenceThreshold: 0.7,
      maxIterations: 3,
      minImprovementRate: 0.05,
    };
    const stage = new CorrectionStage(mockEmbedding, mockScorer, config);

    const match = createMockMatch({ name: 'skill-a', description: 'Deploy API' });
    const context = createMockContext({
      intent: 'deploy api',
      context: 'kubernetes',
      scoredSkills: [{ name: 'skill-a', score: 0.3, matchType: 'intent' }],
      matches: [match],
    });

    await stage.process(context);

    // Verify embed was called with a query containing both intent and context
    const firstEmbedCall = (mockEmbedding.embed as ReturnType<typeof vi.fn>).mock.calls[0];
    const embeddedQuery = firstEmbedCall[0] as string;
    expect(embeddedQuery).toContain('deploy');
    expect(embeddedQuery).toContain('api');
    expect(embeddedQuery).toContain('kubernetes');
  });

  it('j. process() handles matches with descriptions for refinement', async () => {
    // On iteration 2, query should be expanded with terms from top skill description
    const responses: EmbeddingResult[] = [];
    // Iteration 1
    responses.push({ embedding: [1.0, 0.0, 0.0], fromCache: false, method: 'heuristic' }); // query
    responses.push({ embedding: [0.6, 0.8, 0.0], fromCache: false, method: 'heuristic' }); // match
    // Iteration 2 (expanded query)
    responses.push({ embedding: [1.0, 0.0, 0.0], fromCache: false, method: 'heuristic' }); // query
    responses.push({ embedding: [1.0, 0.0, 0.0], fromCache: false, method: 'heuristic' }); // match => 1.0 (exits)

    mockEmbedding = createMockEmbedding(responses);

    const config: CorrectionConfig = {
      confidenceThreshold: 0.9,
      maxIterations: 3,
      minImprovementRate: 0.01,
    };
    const stage = new CorrectionStage(mockEmbedding, mockScorer, config);

    const match = createMockMatch({
      name: 'deploy-skill',
      description: 'Containerized microservices deployment orchestration platform',
    });
    const context = createMockContext({
      intent: 'deploy',
      scoredSkills: [{ name: 'deploy-skill', score: 0.3, matchType: 'intent' }],
      matches: [match],
    });

    await stage.process(context);

    // On iteration 2, the query should incorporate description terms
    const embedCalls = (mockEmbedding.embed as ReturnType<typeof vi.fn>).mock.calls;
    // At least 2 iterations happened (4+ calls)
    expect(embedCalls.length).toBeGreaterThanOrEqual(4);
    // Second iteration query (3rd embed call) should have expanded terms
    const secondIterQuery = embedCalls[2][0] as string;
    // Should contain terms from the description
    expect(secondIterQuery.length).toBeGreaterThan('deploy'.length);
  });

  it('k. Default config uses correct values', () => {
    expect(DEFAULT_CORRECTION_CONFIG).toEqual({
      confidenceThreshold: 0.7,
      maxIterations: 3,
      minImprovementRate: 0.05,
    });
  });
});
