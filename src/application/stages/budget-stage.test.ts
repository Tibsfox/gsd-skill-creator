import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BudgetStage } from './budget-stage.js';
import { createEmptyContext } from '../skill-pipeline.js';
import type { BudgetProfile } from '../../types/application.js';

// Mock TokenCounter
const mockTokenCounter = {
  count: vi.fn().mockResolvedValue({ count: 1000, source: 'estimate', confidence: 'medium' }),
  calculateBudget: vi.fn((size: number, pct: number) => Math.floor(size * pct)),
} as any;

// Mock SkillStore
const mockSkillStore = {
  read: vi.fn().mockImplementation((name: string) =>
    Promise.resolve({ body: `content-for-${name}`, data: {} })
  ),
} as any;

// Default test profile
const testProfile: BudgetProfile = {
  name: 'test-agent',
  budgetPercent: 0.05,
  hardCeilingPercent: 0.10,
  tiers: {
    critical: ['critical-skill'],
    standard: ['standard-skill'],
    optional: ['optional-skill'],
  },
  thresholds: { warn50: true, warn80: true, warn100: true },
};

describe('BudgetStage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset default mock: each skill = 1000 tokens
    mockTokenCounter.count.mockResolvedValue({ count: 1000, source: 'estimate', confidence: 'medium' });
  });

  it('earlyExit guard: returns context unchanged when earlyExit is true', async () => {
    const stage = new BudgetStage(mockTokenCounter, testProfile, mockSkillStore);
    const ctx = createEmptyContext({
      earlyExit: true,
      resolvedSkills: [{ name: 'critical-skill', score: 0.9, matchType: 'intent' }],
    });

    const result = await stage.process(ctx);

    expect(result.earlyExit).toBe(true);
    expect(result.resolvedSkills).toHaveLength(1);
    expect(mockSkillStore.read).not.toHaveBeenCalled();
  });

  it('processes all skills when budget is ample', async () => {
    // 200_000 * 0.05 = 10_000 token budget, each skill = 1000 tokens, 3 skills = 3000 < 10000
    const stage = new BudgetStage(mockTokenCounter, testProfile, mockSkillStore);
    const ctx = createEmptyContext({
      resolvedSkills: [
        { name: 'critical-skill', score: 0.9, matchType: 'intent' },
        { name: 'standard-skill', score: 0.7, matchType: 'intent' },
        { name: 'optional-skill', score: 0.5, matchType: 'intent' },
      ],
    });

    const result = await stage.process(ctx);

    expect(result.resolvedSkills).toHaveLength(3);
    expect(result.budgetSkipped).toHaveLength(0);
  });

  it('skips optional skills when standard budget is exhausted', async () => {
    // Tight budget: contextWindowSize=200_000 * 0.05 = 10_000 standard budget
    // Each skill = 6000 tokens, standard-skill (6000) nearly fills budget, optional (6000) exceeds it
    mockTokenCounter.count.mockResolvedValue({ count: 6000, source: 'estimate', confidence: 'medium' });

    const stage = new BudgetStage(mockTokenCounter, testProfile, mockSkillStore);
    const ctx = createEmptyContext({
      resolvedSkills: [
        { name: 'critical-skill', score: 0.9, matchType: 'intent' },
        { name: 'standard-skill', score: 0.7, matchType: 'intent' },
        { name: 'optional-skill', score: 0.5, matchType: 'intent' },
      ],
    });

    const result = await stage.process(ctx);

    // Critical loaded (uses hard ceiling), standard loaded (fills standard budget)
    // Optional skipped (standard budget exhausted)
    const skippedNames = result.budgetSkipped.map(s => s.name);
    expect(skippedNames).toContain('optional-skill');
    const optionalSkipped = result.budgetSkipped.find(s => s.name === 'optional-skill');
    expect(optionalSkipped!.reason).toBe('budget_exceeded');
    expect(optionalSkipped!.tier).toBe('optional');
  });

  it('critical skills load even past standard budget up to hard ceiling', async () => {
    // Standard budget = 10_000, hard ceiling = 20_000
    // Standard skill uses 9000 tokens (fills standard budget)
    // Critical skill = 9000 tokens, standard budget exhausted, but critical uses hard ceiling
    mockTokenCounter.count.mockResolvedValue({ count: 9000, source: 'estimate', confidence: 'medium' });

    const stage = new BudgetStage(mockTokenCounter, testProfile, mockSkillStore);
    const ctx = createEmptyContext({
      resolvedSkills: [
        { name: 'critical-skill', score: 0.9, matchType: 'intent' },
        { name: 'standard-skill', score: 0.7, matchType: 'intent' },
      ],
    });

    const result = await stage.process(ctx);

    const keptNames = result.resolvedSkills.map(s => s.name);
    expect(keptNames).toContain('critical-skill');
    expect(keptNames).toContain('standard-skill');
    expect(result.budgetSkipped).toHaveLength(0);
  });

  it('critical skills skipped when hard ceiling would be exceeded', async () => {
    // Hard ceiling = 20_000, critical skill = 25_000 tokens (exceeds hard ceiling)
    mockTokenCounter.count.mockResolvedValue({ count: 25000, source: 'estimate', confidence: 'medium' });

    const stage = new BudgetStage(mockTokenCounter, testProfile, mockSkillStore);
    const ctx = createEmptyContext({
      resolvedSkills: [
        { name: 'critical-skill', score: 0.9, matchType: 'intent' },
      ],
    });

    const result = await stage.process(ctx);

    expect(result.budgetSkipped).toHaveLength(1);
    expect(result.budgetSkipped[0].name).toBe('critical-skill');
    expect(result.budgetSkipped[0].reason).toBe('hard_ceiling_reached');
    expect(result.budgetSkipped[0].tier).toBe('critical');
  });

  it('unlisted skills default to standard tier', async () => {
    const stage = new BudgetStage(mockTokenCounter, testProfile, mockSkillStore);
    const ctx = createEmptyContext({
      resolvedSkills: [
        { name: 'unlisted-skill', score: 0.6, matchType: 'intent' },
      ],
    });

    const result = await stage.process(ctx);

    // Unlisted = standard tier, should fit in standard budget (1000 < 10000)
    expect(result.resolvedSkills).toHaveLength(1);
    expect(result.resolvedSkills[0].name).toBe('unlisted-skill');
  });

  it('warning at 50% threshold', async () => {
    // Standard budget = 10_000, skill = 5500 tokens (55% usage)
    mockTokenCounter.count.mockResolvedValue({ count: 5500, source: 'estimate', confidence: 'medium' });

    const stage = new BudgetStage(mockTokenCounter, testProfile, mockSkillStore);
    const ctx = createEmptyContext({
      resolvedSkills: [
        { name: 'standard-skill', score: 0.7, matchType: 'intent' },
      ],
    });

    const result = await stage.process(ctx);

    const thresholds = result.budgetWarnings.map(w => w.threshold);
    expect(thresholds).toContain(50);
  });

  it('warning at 80% threshold', async () => {
    // Standard budget = 10_000, two skills at 4500 each = 9000 tokens (45% + 45% = 90%)
    // Actually, we need ~85%. Use 8500 tokens in one skill.
    mockTokenCounter.count.mockResolvedValue({ count: 8500, source: 'estimate', confidence: 'medium' });

    const stage = new BudgetStage(mockTokenCounter, testProfile, mockSkillStore);
    const ctx = createEmptyContext({
      resolvedSkills: [
        { name: 'standard-skill', score: 0.7, matchType: 'intent' },
      ],
    });

    const result = await stage.process(ctx);

    const thresholds = result.budgetWarnings.map(w => w.threshold);
    expect(thresholds).toContain(80);
  });

  it('warning at 100% threshold', async () => {
    // Standard budget = 10_000, skill = 10_000 tokens (100%)
    mockTokenCounter.count.mockResolvedValue({ count: 10000, source: 'estimate', confidence: 'medium' });

    const stage = new BudgetStage(mockTokenCounter, testProfile, mockSkillStore);
    const ctx = createEmptyContext({
      resolvedSkills: [
        { name: 'standard-skill', score: 0.7, matchType: 'intent' },
      ],
    });

    const result = await stage.process(ctx);

    const thresholds = result.budgetWarnings.map(w => w.threshold);
    expect(thresholds).toContain(100);
  });

  it('no warnings when thresholds disabled', async () => {
    const noWarningsProfile: BudgetProfile = {
      ...testProfile,
      thresholds: { warn50: false, warn80: false, warn100: false },
    };

    mockTokenCounter.count.mockResolvedValue({ count: 8500, source: 'estimate', confidence: 'medium' });

    const stage = new BudgetStage(mockTokenCounter, noWarningsProfile, mockSkillStore);
    const ctx = createEmptyContext({
      resolvedSkills: [
        { name: 'standard-skill', score: 0.7, matchType: 'intent' },
      ],
    });

    const result = await stage.process(ctx);

    expect(result.budgetWarnings).toHaveLength(0);
  });

  it('resolvedSkills reordered: critical first, then standard, then optional', async () => {
    const stage = new BudgetStage(mockTokenCounter, testProfile, mockSkillStore);
    const ctx = createEmptyContext({
      resolvedSkills: [
        { name: 'optional-skill', score: 0.5, matchType: 'intent' },
        { name: 'standard-skill', score: 0.7, matchType: 'intent' },
        { name: 'critical-skill', score: 0.9, matchType: 'intent' },
      ],
    });

    const result = await stage.process(ctx);

    const names = result.resolvedSkills.map(s => s.name);
    expect(names).toEqual(['critical-skill', 'standard-skill', 'optional-skill']);
  });

  it('populates contentCache for loaded skills', async () => {
    const stage = new BudgetStage(mockTokenCounter, testProfile, mockSkillStore);
    const ctx = createEmptyContext({
      resolvedSkills: [
        { name: 'standard-skill', score: 0.7, matchType: 'intent' },
      ],
    });

    const result = await stage.process(ctx);

    expect(result.contentCache.has('standard-skill')).toBe(true);
    expect(result.contentCache.get('standard-skill')).toBe('content-for-standard-skill');
  });

  it('skipped skills not in contentCache', async () => {
    // Make optional skill get skipped by exhausting budget
    mockTokenCounter.count.mockResolvedValue({ count: 9000, source: 'estimate', confidence: 'medium' });

    const stage = new BudgetStage(mockTokenCounter, testProfile, mockSkillStore);
    const ctx = createEmptyContext({
      resolvedSkills: [
        { name: 'standard-skill', score: 0.7, matchType: 'intent' },
        { name: 'optional-skill', score: 0.5, matchType: 'intent' },
      ],
    });

    const result = await stage.process(ctx);

    // Optional should be skipped (9000 + 9000 > 10000 standard budget)
    expect(result.contentCache.has('optional-skill')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// ADAPT-05: High-value skill priority ordering within standard tier
// ---------------------------------------------------------------------------

describe('BudgetStage — ADAPT-05 high-value priority ordering', () => {
  const BASE_WINDOW = 10_000;

  // Budget that fits all 3 skills of 1000 tokens each (30% of 10_000 = 3_000 tokens)
  const priorityProfile: BudgetProfile = {
    name: 'priority-test',
    budgetPercent: 0.30,
    hardCeilingPercent: 0.50,
    tiers: {
      critical: [],
      standard: ['hv-skill-1', 'hv-skill-2', 'unranked-skill'],
      optional: [],
    },
    thresholds: { warn50: false, warn80: false, warn100: false },
  };

  // Budget that only fits 2 standard-tier skills at 1000 tokens each (20% of 10_000 = 2_000 tokens)
  const tightProfile: BudgetProfile = {
    name: 'tight-test',
    budgetPercent: 0.20,
    hardCeilingPercent: 0.30,
    tiers: {
      critical: [],
      standard: ['hv-skill-1', 'hv-skill-2', 'unranked-skill', 'first-skill', 'second-skill', 'third-skill'],
      optional: [],
    },
    thresholds: { warn50: false, warn80: false, warn100: false },
  };

  const mockTC = {
    count: vi.fn().mockResolvedValue({ count: 1000, source: 'estimate', confidence: 'medium' }),
    calculateBudget: vi.fn((size: number, pct: number) => Math.floor(size * pct)),
  } as any;

  const mockStore = {
    read: vi.fn().mockImplementation((name: string) =>
      Promise.resolve({ body: `content-for-${name}`, data: {} })
    ),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockTC.count.mockResolvedValue({ count: 1000, source: 'estimate', confidence: 'medium' });
  });

  it('high-value skills load before unranked skills when budget is tight', async () => {
    const highValueSkills = new Set(['hv-skill-1', 'hv-skill-2']);
    const stage = new BudgetStage(mockTC, tightProfile, mockStore, BASE_WINDOW, highValueSkills);

    const ctx = createEmptyContext({
      resolvedSkills: [
        { name: 'unranked-skill', score: 0.9, matchType: 'intent' as const },  // highest score but unranked
        { name: 'hv-skill-1', score: 0.7, matchType: 'intent' as const },
        { name: 'hv-skill-2', score: 0.6, matchType: 'intent' as const },
      ],
    });

    const result = await stage.process(ctx);

    // Budget = 20% of 10_000 = 2_000 tokens, each skill = 1000 tokens → only 2 fit
    // High-value skills (hv-skill-1, hv-skill-2) should load; unranked-skill should be budget-skipped
    const loadedNames = result.resolvedSkills.map(s => s.name);
    expect(loadedNames).toContain('hv-skill-1');
    expect(loadedNames).toContain('hv-skill-2');

    const skippedNames = result.budgetSkipped.map(s => s.name);
    expect(skippedNames).toContain('unranked-skill');
  });

  it('all skills load when budget is sufficient regardless of highValueSkills', async () => {
    const highValueSkills = new Set(['hv-skill-1']);
    const stage = new BudgetStage(mockTC, priorityProfile, mockStore, BASE_WINDOW, highValueSkills);

    const ctx = createEmptyContext({
      resolvedSkills: [
        { name: 'hv-skill-1', score: 0.9, matchType: 'intent' as const },
        { name: 'hv-skill-2', score: 0.7, matchType: 'intent' as const },
        { name: 'unranked-skill', score: 0.5, matchType: 'intent' as const },
      ],
    });

    const result = await stage.process(ctx);

    // Budget = 30% of 10_000 = 3_000 tokens, 3 skills × 1000 = 3_000 → all fit
    expect(result.resolvedSkills).toHaveLength(3);
    expect(result.budgetSkipped).toHaveLength(0);
  });

  it('backward compat: no highValueSkills param → original order preserved', async () => {
    // No highValueSkills parameter — behavior identical to pre-ADAPT-05
    const stage = new BudgetStage(mockTC, tightProfile, mockStore, BASE_WINDOW);

    const ctx = createEmptyContext({
      resolvedSkills: [
        { name: 'first-skill', score: 0.9, matchType: 'intent' as const },
        { name: 'second-skill', score: 0.7, matchType: 'intent' as const },
        { name: 'third-skill', score: 0.5, matchType: 'intent' as const },
      ],
    });

    const result = await stage.process(ctx);

    // Budget fits 2 skills: first two in original order load, third is skipped
    const loadedNames = result.resolvedSkills.map(s => s.name);
    expect(loadedNames).toContain('first-skill');
    expect(loadedNames).toContain('second-skill');
    expect(result.budgetSkipped.map(s => s.name)).toContain('third-skill');
  });

  it('empty highValueSkills set → original order preserved', async () => {
    const highValueSkills = new Set<string>(); // empty
    const stage = new BudgetStage(mockTC, tightProfile, mockStore, BASE_WINDOW, highValueSkills);

    const ctx = createEmptyContext({
      resolvedSkills: [
        { name: 'first-skill', score: 0.9, matchType: 'intent' as const },
        { name: 'second-skill', score: 0.7, matchType: 'intent' as const },
        { name: 'third-skill', score: 0.5, matchType: 'intent' as const },
      ],
    });

    const result = await stage.process(ctx);

    const loadedNames = result.resolvedSkills.map(s => s.name);
    expect(loadedNames).toContain('first-skill');
    expect(loadedNames).toContain('second-skill');
    expect(result.budgetSkipped.map(s => s.name)).toContain('third-skill');
  });
});
