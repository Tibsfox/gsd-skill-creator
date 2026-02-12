import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScoreStage } from './score-stage.js';
import { createEmptyContext } from '../skill-pipeline.js';
import type { SkillIndex, SkillIndexEntry } from '../../storage/skill-index.js';
import type { RelevanceScorer } from '../relevance-scorer.js';
import type { AdaptiveRouter } from '../../retrieval/adaptive-router.js';
import type { EmbeddingService } from '../../embeddings/embedding-service.js';
import type { ScoredSkill } from '../../types/application.js';
import type { RouteDecision } from '../../retrieval/types.js';

// Mock cosine-similarity module
vi.mock('../../embeddings/cosine-similarity.js', () => ({
  cosineSimilarity: vi.fn(() => 0.85),
}));

import { cosineSimilarity } from '../../embeddings/cosine-similarity.js';

// --- Mock factories ---

function createMockSkillIndex(entries: SkillIndexEntry[] = []): SkillIndex {
  return {
    findByTrigger: vi.fn().mockResolvedValue(entries),
    getEnabled: vi.fn().mockResolvedValue(entries),
    build: vi.fn(),
    load: vi.fn(),
    get: vi.fn(),
    getAll: vi.fn(),
  } as unknown as SkillIndex;
}

function createMockScorer(scores: ScoredSkill[] = []): RelevanceScorer {
  return {
    scoreAgainstQuery: vi.fn().mockReturnValue(scores),
    indexSkills: vi.fn(),
    isIndexed: vi.fn().mockReturnValue(true),
    getIndexSize: vi.fn().mockReturnValue(scores.length),
  } as unknown as RelevanceScorer;
}

function createMockRouter(decision: RouteDecision): AdaptiveRouter {
  return {
    classify: vi.fn().mockReturnValue(decision),
  } as unknown as AdaptiveRouter;
}

function createMockEmbeddingService(): EmbeddingService {
  return {
    embed: vi.fn().mockResolvedValue({
      embedding: [0.1, 0.2, 0.3],
      fromCache: false,
      method: 'heuristic' as const,
    }),
    embedBatch: vi.fn(),
    getOrCompute: vi.fn(),
    init: vi.fn(),
    isUsingFallback: vi.fn().mockReturnValue(true),
  } as unknown as EmbeddingService;
}

// --- Test data ---

const SKILL_A: SkillIndexEntry = {
  name: 'skill-a',
  description: 'A TypeScript skill',
  enabled: true,
  triggers: { intents: ['typescript'] },
  path: '/skills/skill-a',
  mtime: Date.now(),
};

const SKILL_B: SkillIndexEntry = {
  name: 'skill-b',
  description: 'A deployment automation skill',
  enabled: true,
  triggers: { intents: ['deploy', 'how to deploy'] },
  path: '/skills/skill-b',
  mtime: Date.now(),
};

describe('ScoreStage with AdaptiveRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('process() works without router (backward compatible)', async () => {
    const matches = [SKILL_A, SKILL_B];
    const scored: ScoredSkill[] = [
      { name: 'skill-a', score: 0.9, matchType: 'intent' },
      { name: 'skill-b', score: 0.5, matchType: 'intent' },
    ];
    const skillIndex = createMockSkillIndex(matches);
    const scorer = createMockScorer(scored);

    // No router — backward compatible
    const stage = new ScoreStage(skillIndex, scorer);
    const context = createEmptyContext({ intent: 'typescript' });
    const result = await stage.process(context);

    expect(scorer.scoreAgainstQuery).toHaveBeenCalledWith('typescript');
    expect(result.scoredSkills).toEqual(scored);
  });

  it('process() uses TF-IDF when router classifies as tfidf', async () => {
    const matches = [SKILL_A];
    const scored: ScoredSkill[] = [
      { name: 'skill-a', score: 0.9, matchType: 'intent' },
    ];
    const skillIndex = createMockSkillIndex(matches);
    const scorer = createMockScorer(scored);
    const router = createMockRouter({ strategy: 'tfidf', reason: 'simple_keyword' });
    const embeddingService = createMockEmbeddingService();

    const stage = new ScoreStage(skillIndex, scorer, router, embeddingService);
    const context = createEmptyContext({ intent: 'typescript' });
    const result = await stage.process(context);

    expect(router.classify).toHaveBeenCalledWith('typescript');
    expect(scorer.scoreAgainstQuery).toHaveBeenCalledWith('typescript');
    expect(embeddingService.embed).not.toHaveBeenCalled();
    expect(result.scoredSkills).toEqual(scored);
  });

  it('process() uses embedding similarity when router classifies as embedding', async () => {
    const matches = [SKILL_A, SKILL_B];
    const skillIndex = createMockSkillIndex(matches);
    const scorer = createMockScorer([]);
    const router = createMockRouter({ strategy: 'embedding', reason: 'semantic_markers' });
    const embeddingService = createMockEmbeddingService();

    const stage = new ScoreStage(skillIndex, scorer, router, embeddingService);
    const context = createEmptyContext({ intent: 'how do I create a typescript skill' });
    const result = await stage.process(context);

    expect(router.classify).toHaveBeenCalled();
    // Embed query + each match
    expect(embeddingService.embed).toHaveBeenCalledTimes(3); // query + 2 matches
    expect(scorer.scoreAgainstQuery).not.toHaveBeenCalled();
    // Results should be sorted by similarity (cosineSimilarity mock returns 0.85)
    expect(result.scoredSkills.length).toBe(2);
    expect(result.scoredSkills[0].matchType).toBe('intent');
  });

  it('process() falls back to TF-IDF when embedding path fails', async () => {
    const matches = [SKILL_A];
    const scored: ScoredSkill[] = [
      { name: 'skill-a', score: 0.7, matchType: 'intent' },
    ];
    const skillIndex = createMockSkillIndex(matches);
    const scorer = createMockScorer(scored);
    const router = createMockRouter({ strategy: 'embedding', reason: 'complex_semantic' });
    const embeddingService = createMockEmbeddingService();
    // Make embed throw
    (embeddingService.embed as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Model unavailable'));

    const stage = new ScoreStage(skillIndex, scorer, router, embeddingService);
    const context = createEmptyContext({ intent: 'how do I create a typescript skill' });
    const result = await stage.process(context);

    // Should fall back to TF-IDF scoring
    expect(scorer.scoreAgainstQuery).toHaveBeenCalled();
    expect(result.scoredSkills).toEqual(scored);
  });

  it('process() passes through earlyExit unchanged (with router)', async () => {
    const skillIndex = createMockSkillIndex([]);
    const scorer = createMockScorer([]);
    const router = createMockRouter({ strategy: 'embedding', reason: 'semantic_markers' });

    const stage = new ScoreStage(skillIndex, scorer, router);
    const context = createEmptyContext({ intent: 'typescript', earlyExit: true });
    const result = await stage.process(context);

    expect(result.earlyExit).toBe(true);
    expect(router.classify).not.toHaveBeenCalled();
    expect(skillIndex.findByTrigger).not.toHaveBeenCalled();
  });

  it('process() passes through empty matches (with router)', async () => {
    const skillIndex = createMockSkillIndex([]); // empty matches
    const scorer = createMockScorer([]);
    const router = createMockRouter({ strategy: 'embedding', reason: 'semantic_markers' });

    const stage = new ScoreStage(skillIndex, scorer, router);
    const context = createEmptyContext({ intent: 'typescript' });
    const result = await stage.process(context);

    expect(result.earlyExit).toBe(true);
    expect(router.classify).not.toHaveBeenCalled();
  });
});
