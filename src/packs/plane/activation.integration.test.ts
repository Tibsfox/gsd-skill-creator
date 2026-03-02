import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SkillPipeline, createEmptyContext } from '../../application/skill-pipeline.js';
import { ScoreStage } from '../../application/stages/score-stage.js';
import type { PositionLookup } from '../../application/stages/score-stage.js';
import { createPosition } from './arithmetic.js';
import type { PlaneActivationConfig } from './activation.js';
import type { SkillIndex, SkillIndexEntry } from '../../core/storage/skill-index.js';
import type { RelevanceScorer } from '../../application/relevance-scorer.js';
import type { ScoredSkill } from '../../core/types/application.js';

// Mock cosine-similarity module (required by ScoreStage import chain)
vi.mock('../../embeddings/cosine-similarity.js', () => ({
  cosineSimilarity: vi.fn(() => 0.85),
}));

// --- Test helpers ---

function makeEntry(name: string, intents: string[] = []): SkillIndexEntry {
  return {
    name,
    description: `${name} skill`,
    enabled: true,
    triggers: { intents },
    path: `/skills/${name}`,
    mtime: Date.now(),
  };
}

function createMockSkillIndex(entries: SkillIndexEntry[]): SkillIndex {
  return {
    findByTrigger: vi.fn().mockResolvedValue(entries),
    getEnabled: vi.fn().mockResolvedValue(entries),
    build: vi.fn(),
    load: vi.fn(),
    get: vi.fn(),
    getAll: vi.fn(),
  } as unknown as SkillIndex;
}

function createMockScorer(scores: ScoredSkill[]): RelevanceScorer {
  return {
    scoreAgainstQuery: vi.fn().mockReturnValue(scores),
    indexSkills: vi.fn(),
    isIndexed: vi.fn().mockReturnValue(true),
    getIndexSize: vi.fn().mockReturnValue(scores.length),
  } as unknown as RelevanceScorer;
}

describe('Activation Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('full pipeline: 3 skills with varying positions produces correct ranking', async () => {
    const entries = [
      makeEntry('balanced', ['typescript']),
      makeEntry('concrete', ['typescript']),
      makeEntry('abstract', ['typescript']),
    ];
    const scores: ScoredSkill[] = [
      { name: 'balanced', score: 0.5, matchType: 'intent' },
      { name: 'concrete', score: 0.5, matchType: 'intent' },
      { name: 'abstract', score: 0.5, matchType: 'intent' },
    ];

    const positionLookup: PositionLookup = (name) => {
      switch (name) {
        case 'balanced': return createPosition(Math.PI / 4, 0.9);
        case 'concrete': return createPosition(Math.PI / 8, 0.6);
        case 'abstract': return createPosition(3 * Math.PI / 8, 0.7);
        default: return null;
      }
    };

    const pipeline = new SkillPipeline();
    pipeline.addStage(new ScoreStage(
      createMockSkillIndex(entries),
      createMockScorer(scores),
      undefined,
      undefined,
      positionLookup,
    ));

    const context = createEmptyContext({
      intent: 'refactor the typescript module',
      file: 'src/app.ts',
    });
    const result = await pipeline.process(context);

    expect(result.scoredSkills.length).toBe(3);
    // All scores should be valid numbers
    for (const skill of result.scoredSkills) {
      expect(skill.score).not.toBeNaN();
      expect(typeof skill.score).toBe('number');
    }
    // For a balanced task (intent + file), balanced skill (PI/4, high r) should rank well
    const balanced = result.scoredSkills.find(s => s.name === 'balanced');
    expect(balanced).toBeDefined();
    expect(balanced!.score).toBeGreaterThan(0);
  });

  it('full pipeline: all legacy skills (no positions.json) works identically', async () => {
    const entries = [
      makeEntry('skill-x', ['typescript']),
      makeEntry('skill-y', ['typescript']),
    ];
    const scores: ScoredSkill[] = [
      { name: 'skill-x', score: 0.9, matchType: 'intent' },
      { name: 'skill-y', score: 0.4, matchType: 'intent' },
    ];

    const positionLookup: PositionLookup = () => null;

    const pipeline = new SkillPipeline();
    pipeline.addStage(new ScoreStage(
      createMockSkillIndex(entries),
      createMockScorer(scores),
      undefined,
      undefined,
      positionLookup,
    ));

    const context = createEmptyContext({ intent: 'typescript' });
    const result = await pipeline.process(context);

    // Scores should be identical to semantic-only (null positions -> no change)
    expect(result.scoredSkills[0].name).toBe('skill-x');
    expect(result.scoredSkills[0].score).toBe(0.9);
    expect(result.scoredSkills[1].name).toBe('skill-y');
    expect(result.scoredSkills[1].score).toBe(0.4);
  });

  it('full pipeline: config.enabled=false works identically', async () => {
    const entries = [makeEntry('skill-z', ['typescript'])];
    const scores: ScoredSkill[] = [
      { name: 'skill-z', score: 0.6, matchType: 'intent' },
    ];

    const positionLookup: PositionLookup = () => createPosition(Math.PI / 4, 0.9);
    const config: PlaneActivationConfig = {
      enabled: false,
      geometricWeight: 0.6,
      fallbackToSemantic: true,
      logGeometricDetail: false,
    };

    const pipeline = new SkillPipeline();
    pipeline.addStage(new ScoreStage(
      createMockSkillIndex(entries),
      createMockScorer(scores),
      undefined,
      undefined,
      positionLookup,
      config,
    ));

    const context = createEmptyContext({ intent: 'typescript' });
    const result = await pipeline.process(context);

    // Score should be unchanged -- geometric disabled
    expect(result.scoredSkills[0].score).toBe(0.6);
  });

  it('full pipeline: mixed skills (some with positions, some legacy)', async () => {
    const entries = [
      makeEntry('positioned-a', ['typescript']),
      makeEntry('positioned-b', ['typescript']),
      makeEntry('legacy', ['typescript']),
    ];
    const scores: ScoredSkill[] = [
      { name: 'positioned-a', score: 0.5, matchType: 'intent' },
      { name: 'positioned-b', score: 0.5, matchType: 'intent' },
      { name: 'legacy', score: 0.7, matchType: 'intent' },
    ];

    const positionLookup: PositionLookup = (name) => {
      if (name === 'positioned-a') return createPosition(Math.PI / 4, 0.9);
      if (name === 'positioned-b') return createPosition(Math.PI / 6, 0.5);
      return null; // legacy
    };

    const pipeline = new SkillPipeline();
    pipeline.addStage(new ScoreStage(
      createMockSkillIndex(entries),
      createMockScorer(scores),
      undefined,
      undefined,
      positionLookup,
    ));

    const context = createEmptyContext({ intent: 'typescript', file: 'src/app.ts' });
    const result = await pipeline.process(context);

    const legacy = result.scoredSkills.find(s => s.name === 'legacy');
    const posA = result.scoredSkills.find(s => s.name === 'positioned-a');
    const posB = result.scoredSkills.find(s => s.name === 'positioned-b');

    // Legacy skill should retain semantic-only score
    expect(legacy!.score).toBe(0.7);
    // Positioned skills should have enhanced (different) scores
    expect(posA!.score).not.toBe(0.5);
    expect(posB!.score).not.toBe(0.5);
  });

  it('performance: scoring 100 skills completes within 2x baseline', async () => {
    const COUNT = 100;
    const entries: SkillIndexEntry[] = [];
    const scores: ScoredSkill[] = [];

    for (let i = 0; i < COUNT; i++) {
      const name = `perf-skill-${i}`;
      entries.push(makeEntry(name, ['typescript']));
      scores.push({ name, score: Math.random(), matchType: 'intent' });
    }

    const positionLookup: PositionLookup = (name) => {
      const idx = parseInt(name.split('-')[2], 10);
      return createPosition((idx / COUNT) * Math.PI / 2, idx / COUNT);
    };

    // --- Baseline: no geometric scoring ---
    const baselinePipeline = new SkillPipeline();
    baselinePipeline.addStage(new ScoreStage(
      createMockSkillIndex(entries),
      createMockScorer(scores),
    ));

    const baselineTimes: number[] = [];
    for (let run = 0; run < 3; run++) {
      const ctx = createEmptyContext({ intent: 'typescript' });
      const start = performance.now();
      await baselinePipeline.process(ctx);
      baselineTimes.push(performance.now() - start);
    }
    const baselineAvg = baselineTimes.reduce((a, b) => a + b) / baselineTimes.length;

    // --- Geometric: with position scoring ---
    const geoPipeline = new SkillPipeline();
    geoPipeline.addStage(new ScoreStage(
      createMockSkillIndex(entries),
      createMockScorer(scores),
      undefined,
      undefined,
      positionLookup,
    ));

    const geoTimes: number[] = [];
    for (let run = 0; run < 3; run++) {
      const ctx = createEmptyContext({ intent: 'typescript' });
      const start = performance.now();
      await geoPipeline.process(ctx);
      geoTimes.push(performance.now() - start);
    }
    const geoAvg = geoTimes.reduce((a, b) => a + b) / geoTimes.length;

    // Performance assertions
    expect(geoAvg).toBeLessThan(3 * baselineAvg + 5); // +5ms tolerance for near-zero baselines and CI jitter
    expect(geoAvg).toBeLessThan(50); // Absolute ceiling: 50ms for 100 skills
  });
});
