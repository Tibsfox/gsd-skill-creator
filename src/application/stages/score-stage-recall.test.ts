/**
 * RET-1 (semantic recall) + RET-4 (lexical+dense fusion) for ScoreStage.
 *
 * Uses the real cosineSimilarity with controlled embedding vectors so the
 * recall floor and the fusion ranking are exercised deterministically.
 */

import { describe, it, expect, vi } from 'vitest';
import { ScoreStage } from './score-stage.js';
import { createEmptyContext } from '../skill-pipeline.js';
import type { SkillIndex, SkillIndexEntry } from '../../storage/skill-index.js';
import type { RelevanceScorer } from '../relevance-scorer.js';
import type { AdaptiveRouter } from '../../retrieval/adaptive-router.js';
import type { EmbeddingService } from '../../embeddings/embedding-service.js';
import type { ScoredSkill } from '../../types/application.js';

function entry(name: string, description: string): SkillIndexEntry {
  return {
    name,
    description,
    enabled: true,
    triggers: { intents: ['unrelated-trigger-token'] },
    path: `/skills/${name}`,
    mtime: 1,
  } as SkillIndexEntry;
}

function skillIndexMock(enabled: SkillIndexEntry[], lexical: SkillIndexEntry[] = []): SkillIndex {
  return {
    findByTrigger: vi.fn().mockResolvedValue(lexical),
    getEnabled: vi.fn().mockResolvedValue(enabled),
  } as unknown as SkillIndex;
}

function embeddingMock(vectors: Record<string, number[]>, queryVec: number[]): EmbeddingService {
  return {
    embed: vi.fn((text: string, skillName?: string) =>
      Promise.resolve({
        embedding: skillName ? (vectors[skillName] ?? [0, 0, 1]) : queryVec,
        fromCache: false,
        method: 'heuristic' as const,
      }),
    ),
  } as unknown as EmbeddingService;
}

function scorerMock(scored: ScoredSkill[] = []): RelevanceScorer {
  return {
    scoreAgainstQuery: vi.fn().mockReturnValue(scored),
  } as unknown as RelevanceScorer;
}

const embeddingRouter = {
  classify: vi.fn().mockReturnValue({ strategy: 'embedding', reason: 'complex_semantic' }),
} as unknown as AdaptiveRouter;

describe('ScoreStage semantic recall (RET-1)', () => {
  it('recalls a skill via embeddings even when no trigger matches', async () => {
    const target = entry('target', 'deploy an application to production servers');
    const distractor = entry('distractor', 'edit an image into ascii art');
    // No lexical trigger matches; the full enabled set is [target, distractor].
    const skillIndex = skillIndexMock([target, distractor], []);
    const embeddings = embeddingMock(
      { target: [1, 0, 0], distractor: [0, 1, 0] },
      [1, 0, 0], // query vector aligns with target, orthogonal to distractor
    );
    const stage = new ScoreStage(skillIndex, scorerMock(), embeddingRouter, embeddings);

    const context = createEmptyContext({ intent: 'ship my service to the cluster' });
    const result = await stage.process(context);

    expect(result.earlyExit).not.toBe(true);
    expect(result.matches.map(m => m.name)).toContain('target');
    expect(result.scoredSkills.some(s => s.name === 'target')).toBe(true);
    // The orthogonal skill (cosine 0 < floor) is not recalled.
    expect(result.scoredSkills.some(s => s.name === 'distractor')).toBe(false);
  });

  it('still early-exits on zero lexical matches when the semantic route is inactive', async () => {
    const target = entry('target', 'deploy an application to production servers');
    const skillIndex = skillIndexMock([target], []);
    // No router/embeddingService -> TF-IDF path, old recall-less behavior.
    const stage = new ScoreStage(skillIndex, scorerMock());

    const result = await stage.process(createEmptyContext({ intent: 'ship my service' }));

    expect(result.earlyExit).toBe(true);
    expect(result.scoredSkills ?? []).toEqual([]);
  });
});

describe('ScoreStage lexical+dense fusion (RET-4)', () => {
  it('boosts a candidate strong in both signals above a cosine-only leader', async () => {
    // target: cosine 0.7, no lexical signal.
    // other:  cosine 0.6, but a strong TF-IDF hit.
    const target = entry('target', 'semantic-only match');
    const other = entry('other', 'lexical and semantic match');
    const skillIndex = skillIndexMock([target, other], []);
    const embeddings = embeddingMock(
      { target: [0.7, Math.sqrt(0.51), 0], other: [0.6, 0.8, 0] },
      [1, 0, 0], // cosine(query,target)=0.7, cosine(query,other)=0.6
    );
    // Only `other` carries a TF-IDF score.
    const scorer = scorerMock([{ name: 'other', score: 5, matchType: 'intent' }]);
    const stage = new ScoreStage(skillIndex, scorer, embeddingRouter, embeddings);

    const result = await stage.process(createEmptyContext({ intent: 'find the matching skill please' }));

    const names = result.scoredSkills.map(s => s.name);
    expect(names).toContain('target');
    expect(names).toContain('other');
    // Pure cosine would rank `target` (0.70) first; fusion lifts `other`
    // ((0.7*0.6 + 0.3*1.0)/1.0 = 0.72) above `target` (0.7*0.7/0.7 = 0.70).
    expect(result.scoredSkills[0].name).toBe('other');
    expect(result.scoredSkills[0].score).toBeLessThanOrEqual(1);
    expect(result.scoredSkills[0].score).toBeGreaterThan(result.scoredSkills[1].score);
    // Weight-mass normalization: the semantic-only candidate reports its true
    // cosine (0.7), not a lexical-penalized 0.7*cosine — cosine-comparable.
    const targetScore = result.scoredSkills.find(s => s.name === 'target')!.score;
    expect(targetScore).toBeCloseTo(0.7, 5);
  });
});
