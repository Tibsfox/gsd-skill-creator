import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PipelineContext } from '../application/skill-pipeline.js';
import { SkillPipeline, createEmptyContext } from '../application/skill-pipeline.js';
import type { PlaneClassification } from '../packs/engines/plane-classifier.js';

// Mock classifyProblem at module level (used by mfe-skill-type internals)
vi.mock('../packs/engines/plane-classifier.js', () => ({
  classifyProblem: vi.fn(),
}));

import { classifyProblem } from '../packs/engines/plane-classifier.js';
import {
  MfeScoreHook,
  MfeBudgetHook,
  wireMfeIntoExistingPipeline,
  MFE_BUDGET_PERCENT,
} from './pipeline-hooks.js';
import { MfeSkillType } from './mfe-skill-type.js';

const mockClassify = vi.mocked(classifyProblem);

function mockMathClassification(): void {
  mockClassify.mockReturnValue({
    position: { real: 0.0, imaginary: 0.0 },
    confidence: 0.7,
    activatedDomains: [
      { domainId: 'change' as any, score: 0.8, matchedPatterns: ['derivative'] },
    ],
    keywords: ['derivative'],
  });
}

function mockNonMathClassification(): void {
  mockClassify.mockReturnValue({
    position: { real: 0.0, imaginary: 0.0 },
    confidence: 0,
    activatedDomains: [],
    keywords: ['deploy', 'server'],
  });
}

function mockHighConfidenceMultiDomain(): void {
  mockClassify.mockReturnValue({
    position: { real: 0.1, imaginary: 0.2 },
    confidence: 0.8,
    activatedDomains: [
      { domainId: 'change' as any, score: 0.8, matchedPatterns: ['derivative'] },
      { domainId: 'structure' as any, score: 0.6, matchedPatterns: ['vector'] },
    ],
    keywords: ['derivative', 'vector'],
  });
}

describe('MfeScoreHook', () => {
  let skillType: MfeSkillType;
  let hook: MfeScoreHook;

  beforeEach(() => {
    vi.clearAllMocks();
    skillType = new MfeSkillType();
    hook = new MfeScoreHook(skillType);
  });

  it('implements PipelineStage with name mfe-score', () => {
    expect(hook.name).toBe('mfe-score');
  });

  it('adds mathematical-foundation ScoredSkill when intent contains mathematical structure', async () => {
    mockMathClassification();
    const ctx = createEmptyContext({ intent: 'derivative of x^2' });
    const result = await hook.process(ctx);
    expect(result.scoredSkills).toHaveLength(1);
    expect(result.scoredSkills[0].name).toBe('mathematical-foundation');
    expect(result.scoredSkills[0].matchType).toBe('intent');
    expect(result.scoredSkills[0].score).toBeGreaterThan(0);
  });

  it('does not modify scoredSkills when intent is non-mathematical', async () => {
    mockNonMathClassification();
    const ctx = createEmptyContext({ intent: 'deploy the server' });
    const result = await hook.process(ctx);
    expect(result.scoredSkills).toHaveLength(0);
  });

  it('sets earlyExit to false when earlyExit is true but math detected', async () => {
    mockMathClassification();
    const ctx = createEmptyContext({ intent: 'derivative of x^2', earlyExit: true } as any);
    // Override earlyExit to true
    ctx.earlyExit = true;
    const result = await hook.process(ctx);
    expect(result.earlyExit).toBe(false);
    expect(result.scoredSkills).toHaveLength(1);
  });

  it('leaves earlyExit as true when earlyExit is true and no math', async () => {
    mockNonMathClassification();
    const ctx = createEmptyContext({ intent: 'deploy the server' });
    ctx.earlyExit = true;
    const result = await hook.process(ctx);
    expect(result.earlyExit).toBe(true);
    expect(result.scoredSkills).toHaveLength(0);
  });

  it('does not duplicate: if mathematical-foundation already in scoredSkills', async () => {
    mockMathClassification();
    const ctx = createEmptyContext({ intent: 'derivative of x^2' });
    ctx.scoredSkills = [{ name: 'mathematical-foundation', score: 0.5, matchType: 'intent' }];
    const result = await hook.process(ctx);
    expect(result.scoredSkills).toHaveLength(1); // Same length, not duplicated
  });

  it('passes MfeSkillType.score() result through to the ScoredSkill', async () => {
    mockHighConfidenceMultiDomain();
    const ctx = createEmptyContext({ intent: 'derivative vector analysis' });
    const result = await hook.process(ctx);
    expect(result.scoredSkills).toHaveLength(1);
    // Score should be confidence * (1 + 0.1 * domainCount) = 0.8 * 1.2 = 0.96
    expect(result.scoredSkills[0].score).toBeCloseTo(0.96, 1);
  });

  it('does nothing when no intent or context provided', async () => {
    const ctx = createEmptyContext({});
    const result = await hook.process(ctx);
    expect(result.scoredSkills).toHaveLength(0);
  });
});

describe('MfeBudgetHook', () => {
  let skillType: MfeSkillType;
  let hook: MfeBudgetHook;

  beforeEach(() => {
    vi.clearAllMocks();
    skillType = new MfeSkillType();
    hook = new MfeBudgetHook(skillType, 200_000);
  });

  it('implements PipelineStage with name mfe-budget', () => {
    expect(hook.name).toBe('mfe-budget');
  });

  it('adds summary tier content to contentCache when mathematical-foundation in resolvedSkills', async () => {
    const ctx = createEmptyContext({});
    ctx.resolvedSkills = [{ name: 'mathematical-foundation', score: 0.7, matchType: 'intent' }];
    const result = await hook.process(ctx);
    expect(result.contentCache.has('mathematical-foundation')).toBe(true);
    const content = result.contentCache.get('mathematical-foundation')!;
    expect(content.length).toBeGreaterThan(0);
    // Summary should be roughly ~4K characters
    expect(content.length).toBeLessThanOrEqual(6000);
  });

  it('passes through unchanged when mathematical-foundation not in resolvedSkills', async () => {
    const ctx = createEmptyContext({});
    ctx.resolvedSkills = [{ name: 'some-other-skill', score: 0.5, matchType: 'intent' }];
    const result = await hook.process(ctx);
    expect(result.contentCache.has('mathematical-foundation')).toBe(false);
  });

  it('never loads reference tier content', async () => {
    const ctx = createEmptyContext({});
    ctx.resolvedSkills = [{ name: 'mathematical-foundation', score: 0.9, matchType: 'intent' }];
    const result = await hook.process(ctx);
    const content = result.contentCache.get('mathematical-foundation') || '';
    // Reference tier would add ~40K worth of content
    expect(content.length).toBeLessThan(20000);
  });

  it('adds BudgetWarning when total MFE demand exceeds budget', async () => {
    // Use tiny context window so MFE budget is very small
    const tinyHook = new MfeBudgetHook(skillType, 1000);
    const ctx = createEmptyContext({});
    ctx.resolvedSkills = [{ name: 'mathematical-foundation', score: 0.7, matchType: 'intent' }];
    const result = await tinyHook.process(ctx);
    // With 1000 token window, 5% = 50 tokens. Summary alone is ~4K which exceeds this.
    expect(result.budgetWarnings.length).toBeGreaterThan(0);
    expect(result.budgetWarnings.some(w => w.message.includes('MFE'))).toBe(true);
  });

  it('loads summary content even when budget is constrained', async () => {
    // Even with tiny budget, summary should be loaded (with warning)
    const tinyHook = new MfeBudgetHook(skillType, 1000);
    const ctx = createEmptyContext({});
    ctx.resolvedSkills = [{ name: 'mathematical-foundation', score: 0.7, matchType: 'intent' }];
    const result = await tinyHook.process(ctx);
    // Summary is always loaded
    expect(result.contentCache.has('mathematical-foundation')).toBe(true);
  });
});

describe('wireMfeIntoExistingPipeline', () => {
  let pipeline: SkillPipeline;

  beforeEach(() => {
    vi.clearAllMocks();
    pipeline = new SkillPipeline();
    // Build minimal pipeline with required stages
    pipeline.addStage({ name: 'score', process: async (ctx) => ctx });
    pipeline.addStage({ name: 'resolve', process: async (ctx) => ctx });
    pipeline.addStage({ name: 'model-filter', process: async (ctx) => ctx });
    pipeline.addStage({ name: 'cache-order', process: async (ctx) => ctx });
    pipeline.addStage({ name: 'budget', process: async (ctx) => ctx });
    pipeline.addStage({ name: 'load', process: async (ctx) => ctx });
  });

  it('inserts MfeScoreHook after score stage', () => {
    wireMfeIntoExistingPipeline(pipeline);
    const names = pipeline.getStageNames();
    const scoreIdx = names.indexOf('score');
    const mfeScoreIdx = names.indexOf('mfe-score');
    expect(mfeScoreIdx).toBe(scoreIdx + 1);
  });

  it('inserts MfeBudgetHook before budget stage', () => {
    wireMfeIntoExistingPipeline(pipeline);
    const names = pipeline.getStageNames();
    const budgetIdx = names.indexOf('budget');
    const mfeBudgetIdx = names.indexOf('mfe-budget');
    expect(mfeBudgetIdx).toBe(budgetIdx - 1);
  });

  it('produces correct pipeline stage order', () => {
    wireMfeIntoExistingPipeline(pipeline);
    const names = pipeline.getStageNames();
    expect(names).toEqual([
      'score',
      'mfe-score',
      'resolve',
      'model-filter',
      'cache-order',
      'mfe-budget',
      'budget',
      'load',
    ]);
  });

  it('throws if pipeline has no score stage', () => {
    const badPipeline = new SkillPipeline();
    badPipeline.addStage({ name: 'budget', process: async (ctx) => ctx });
    badPipeline.addStage({ name: 'load', process: async (ctx) => ctx });
    expect(() => wireMfeIntoExistingPipeline(badPipeline)).toThrow();
  });

  it('throws if pipeline has no budget stage', () => {
    const badPipeline = new SkillPipeline();
    badPipeline.addStage({ name: 'score', process: async (ctx) => ctx });
    badPipeline.addStage({ name: 'load', process: async (ctx) => ctx });
    expect(() => wireMfeIntoExistingPipeline(badPipeline)).toThrow();
  });

  it('works with minimal pipeline (just score + budget + load)', () => {
    const minimal = new SkillPipeline();
    minimal.addStage({ name: 'score', process: async (ctx) => ctx });
    minimal.addStage({ name: 'budget', process: async (ctx) => ctx });
    minimal.addStage({ name: 'load', process: async (ctx) => ctx });
    wireMfeIntoExistingPipeline(minimal);
    expect(minimal.getStageNames()).toEqual([
      'score',
      'mfe-score',
      'mfe-budget',
      'budget',
      'load',
    ]);
  });
});

describe('MFE_BUDGET_PERCENT', () => {
  it('equals 0.05 (5% of context window)', () => {
    expect(MFE_BUDGET_PERCENT).toBe(0.05);
  });
});
