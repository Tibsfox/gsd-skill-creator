/**
 * Tests for HealthScorer.
 *
 * Covers:
 * - Scoring a skill with full data (test results + success signals + metadata)
 * - Flagging skill with low precision below threshold
 * - Flagging skill with low success rate below threshold
 * - Showing N/A (null) for precision when no test results exist
 * - Showing N/A (null) for success rate when no signals exist
 * - Staleness fallback chain: updatedAt -> createdAt -> null
 * - Token efficiency calculation
 * - scoreAll returns array of HealthScores for all skills
 * - Overall score is weighted composite (0-100)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HealthScorer } from './health-scorer.js';
import type { ResultStore } from '../testing/result-store.js';
import type { SuccessTracker } from './success-tracker.js';
import type { SkillStore } from '../storage/skill-store.js';
import type { TestRunSnapshot } from '../types/test-run.js';

// Helper to create mock ResultStore
function createMockResultStore(overrides: Partial<ResultStore> = {}): ResultStore {
  return {
    getLatest: vi.fn().mockResolvedValue(null),
    list: vi.fn().mockResolvedValue([]),
    append: vi.fn().mockResolvedValue(undefined),
    count: vi.fn().mockResolvedValue(0),
    ...overrides,
  } as unknown as ResultStore;
}

// Helper to create mock SuccessTracker
function createMockSuccessTracker(overrides: Partial<SuccessTracker> = {}): SuccessTracker {
  return {
    getSuccessRate: vi.fn().mockResolvedValue({ rate: 0, total: 0, positive: 0, negative: 0 }),
    record: vi.fn().mockResolvedValue(undefined),
    getBySkill: vi.fn().mockResolvedValue([]),
    getAll: vi.fn().mockResolvedValue([]),
    clear: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as SuccessTracker;
}

// Helper to create mock SkillStore
function createMockSkillStore(overrides: Partial<SkillStore> = {}): SkillStore {
  return {
    list: vi.fn().mockResolvedValue([]),
    read: vi.fn().mockResolvedValue({
      metadata: {
        name: 'test-skill',
        description: 'A test skill',
        metadata: { extensions: { 'gsd-skill-creator': {} } },
      },
      body: 'Some body content here for testing.',
      path: '.claude/skills/test-skill/SKILL.md',
    }),
    exists: vi.fn().mockResolvedValue(true),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    ...overrides,
  } as unknown as SkillStore;
}

// Helper to create a minimal test run snapshot with precision
function makeSnapshot(precision: number, recall = 0.8, f1Score = 0.8): Partial<TestRunSnapshot> {
  return {
    id: 'snap-1',
    skillName: 'test-skill',
    runAt: new Date().toISOString(),
    duration: 100,
    threshold: 0.75,
    metrics: {
      total: 10,
      passed: 8,
      failed: 2,
      accuracy: 80,
      falsePositiveRate: 10,
      truePositives: 5,
      trueNegatives: 3,
      falsePositives: 1,
      falseNegatives: 1,
      edgeCaseCount: 0,
      precision,
      recall,
      f1Score,
    },
    results: [],
    positiveResults: [],
    negativeResults: [],
    edgeCaseResults: [],
    hints: [],
  };
}

describe('HealthScorer', () => {
  let resultStore: ResultStore;
  let successTracker: SuccessTracker;
  let skillStore: SkillStore;

  beforeEach(() => {
    resultStore = createMockResultStore();
    successTracker = createMockSuccessTracker();
    skillStore = createMockSkillStore();
  });

  it('scores a skill with full data (test results + success signals + metadata)', async () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();

    resultStore = createMockResultStore({
      getLatest: vi.fn().mockResolvedValue(makeSnapshot(0.85)),
    });
    successTracker = createMockSuccessTracker({
      getSuccessRate: vi.fn().mockResolvedValue({ rate: 0.75, total: 20, positive: 15, negative: 5 }),
    });
    skillStore = createMockSkillStore({
      read: vi.fn().mockResolvedValue({
        metadata: {
          name: 'test-skill',
          description: 'A test skill',
          metadata: {
            extensions: {
              'gsd-skill-creator': { updatedAt: tenDaysAgo },
            },
          },
        },
        body: 'Some body content for the test skill.',
        path: '.claude/skills/test-skill/SKILL.md',
      }),
    });

    const scorer = new HealthScorer(resultStore, successTracker, skillStore);
    const score = await scorer.scoreSkill('test-skill');

    expect(score.precision).toBe(0.85);
    expect(score.successRate).toBe(0.75);
    expect(score.staleness).toBeGreaterThanOrEqual(9);
    expect(score.staleness).toBeLessThanOrEqual(11);
    expect(score.overallScore).toBeGreaterThan(50);
    expect(score.flagged).toBe(false);
  });

  it('flags skill with low precision below threshold', async () => {
    resultStore = createMockResultStore({
      getLatest: vi.fn().mockResolvedValue(makeSnapshot(0.4)),
    });
    successTracker = createMockSuccessTracker({
      getSuccessRate: vi.fn().mockResolvedValue({ rate: 0.8, total: 10, positive: 8, negative: 2 }),
    });

    const scorer = new HealthScorer(resultStore, successTracker, skillStore);
    const score = await scorer.scoreSkill('test-skill');

    expect(score.flagged).toBe(true);
    expect(score.suggestions.length).toBeGreaterThan(0);
    expect(score.suggestions.some(s => s.toLowerCase().includes('precision'))).toBe(true);
  });

  it('flags skill with low success rate below threshold', async () => {
    resultStore = createMockResultStore({
      getLatest: vi.fn().mockResolvedValue(makeSnapshot(0.9)),
    });
    successTracker = createMockSuccessTracker({
      getSuccessRate: vi.fn().mockResolvedValue({ rate: 0.3, total: 10, positive: 3, negative: 7 }),
    });

    const scorer = new HealthScorer(resultStore, successTracker, skillStore);
    const score = await scorer.scoreSkill('test-skill');

    expect(score.flagged).toBe(true);
    expect(score.suggestions.some(s => s.toLowerCase().includes('success rate'))).toBe(true);
  });

  it('shows N/A (null) for precision when no test results exist', async () => {
    // resultStore.getLatest returns null by default
    successTracker = createMockSuccessTracker({
      getSuccessRate: vi.fn().mockResolvedValue({ rate: 0.8, total: 10, positive: 8, negative: 2 }),
    });

    const scorer = new HealthScorer(resultStore, successTracker, skillStore);
    const score = await scorer.scoreSkill('test-skill');

    expect(score.precision).toBeNull();
    expect(score.suggestions.some(s => s.includes('test generate'))).toBe(true);
  });

  it('shows N/A (null) for success rate when no signals exist', async () => {
    resultStore = createMockResultStore({
      getLatest: vi.fn().mockResolvedValue(makeSnapshot(0.85)),
    });
    // successTracker.getSuccessRate returns { rate: 0, total: 0 } by default

    const scorer = new HealthScorer(resultStore, successTracker, skillStore);
    const score = await scorer.scoreSkill('test-skill');

    expect(score.successRate).toBeNull();
  });

  it('staleness uses updatedAt when present', async () => {
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

    skillStore = createMockSkillStore({
      read: vi.fn().mockResolvedValue({
        metadata: {
          name: 'test-skill',
          description: 'A test skill',
          metadata: {
            extensions: {
              'gsd-skill-creator': {
                updatedAt: fiveDaysAgo,
                createdAt: '2020-01-01T00:00:00Z',
              },
            },
          },
        },
        body: 'Some body content.',
        path: '.claude/skills/test-skill/SKILL.md',
      }),
    });

    const scorer = new HealthScorer(resultStore, successTracker, skillStore);
    const score = await scorer.scoreSkill('test-skill');

    expect(score.staleness).toBeGreaterThanOrEqual(4);
    expect(score.staleness).toBeLessThanOrEqual(6);
  });

  it('staleness falls back to createdAt when updatedAt is absent', async () => {
    const twentyDaysAgo = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();

    skillStore = createMockSkillStore({
      read: vi.fn().mockResolvedValue({
        metadata: {
          name: 'test-skill',
          description: 'A test skill',
          metadata: {
            extensions: {
              'gsd-skill-creator': {
                createdAt: twentyDaysAgo,
              },
            },
          },
        },
        body: 'Some body content.',
        path: '.claude/skills/test-skill/SKILL.md',
      }),
    });

    const scorer = new HealthScorer(resultStore, successTracker, skillStore);
    const score = await scorer.scoreSkill('test-skill');

    expect(score.staleness).toBeGreaterThanOrEqual(19);
    expect(score.staleness).toBeLessThanOrEqual(21);
  });

  it('staleness is null when neither updatedAt nor createdAt is present', async () => {
    skillStore = createMockSkillStore({
      read: vi.fn().mockResolvedValue({
        metadata: {
          name: 'test-skill',
          description: 'A test skill',
          metadata: {
            extensions: {
              'gsd-skill-creator': {},
            },
          },
        },
        body: 'Some body content.',
        path: '.claude/skills/test-skill/SKILL.md',
      }),
    });

    const scorer = new HealthScorer(resultStore, successTracker, skillStore);
    const score = await scorer.scoreSkill('test-skill');

    expect(score.staleness).toBeNull();
  });

  it('computes token efficiency correctly for small skill', async () => {
    // 3000 chars out of 15000 budget -> efficiency ~ 0.80
    skillStore = createMockSkillStore({
      read: vi.fn().mockResolvedValue({
        metadata: {
          name: 'test-skill',
          description: 'A test skill',
          metadata: { extensions: { 'gsd-skill-creator': {} } },
        },
        body: 'x'.repeat(3000),
        path: '.claude/skills/test-skill/SKILL.md',
      }),
    });

    const scorer = new HealthScorer(resultStore, successTracker, skillStore);
    const score = await scorer.scoreSkill('test-skill');

    expect(score.tokenEfficiency).toBeCloseTo(0.80, 1);
  });

  it('computes token efficiency correctly for large skill', async () => {
    // 14000 chars out of 15000 budget -> efficiency ~ 0.067
    skillStore = createMockSkillStore({
      read: vi.fn().mockResolvedValue({
        metadata: {
          name: 'test-skill',
          description: 'A test skill',
          metadata: { extensions: { 'gsd-skill-creator': {} } },
        },
        body: 'x'.repeat(14000),
        path: '.claude/skills/test-skill/SKILL.md',
      }),
    });

    const scorer = new HealthScorer(resultStore, successTracker, skillStore);
    const score = await scorer.scoreSkill('test-skill');

    expect(score.tokenEfficiency).toBeCloseTo(0.067, 1);
  });

  it('scoreAll returns array of HealthScores for all skills', async () => {
    skillStore = createMockSkillStore({
      list: vi.fn().mockResolvedValue(['skill-a', 'skill-b', 'skill-c']),
      read: vi.fn().mockResolvedValue({
        metadata: {
          name: 'test-skill',
          description: 'A test skill',
          metadata: { extensions: { 'gsd-skill-creator': {} } },
        },
        body: 'Some body.',
        path: '.claude/skills/test-skill/SKILL.md',
      }),
    });

    const scorer = new HealthScorer(resultStore, successTracker, skillStore);
    const scores = await scorer.scoreAll();

    expect(scores).toHaveLength(3);
    expect(scores[0]).toHaveProperty('skillName');
    expect(scores[0]).toHaveProperty('overallScore');
    expect(scores[0]).toHaveProperty('flagged');
  });

  it('overall score is near 100 when all metrics are perfect', async () => {
    const now = new Date().toISOString();

    resultStore = createMockResultStore({
      getLatest: vi.fn().mockResolvedValue(makeSnapshot(1.0)),
    });
    successTracker = createMockSuccessTracker({
      getSuccessRate: vi.fn().mockResolvedValue({ rate: 1.0, total: 20, positive: 20, negative: 0 }),
    });
    skillStore = createMockSkillStore({
      read: vi.fn().mockResolvedValue({
        metadata: {
          name: 'test-skill',
          description: 'A test skill',
          metadata: {
            extensions: {
              'gsd-skill-creator': { updatedAt: now },
            },
          },
        },
        body: 'Short skill.',
        path: '.claude/skills/test-skill/SKILL.md',
      }),
    });

    const scorer = new HealthScorer(resultStore, successTracker, skillStore);
    const score = await scorer.scoreSkill('test-skill');

    expect(score.overallScore).toBeGreaterThanOrEqual(90);
  });

  it('overall score is well below 50 when all metrics are poor', async () => {
    const yearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();

    resultStore = createMockResultStore({
      getLatest: vi.fn().mockResolvedValue(makeSnapshot(0.1)),
    });
    successTracker = createMockSuccessTracker({
      getSuccessRate: vi.fn().mockResolvedValue({ rate: 0.1, total: 10, positive: 1, negative: 9 }),
    });
    skillStore = createMockSkillStore({
      read: vi.fn().mockResolvedValue({
        metadata: {
          name: 'test-skill',
          description: 'A test skill',
          metadata: {
            extensions: {
              'gsd-skill-creator': { updatedAt: yearAgo },
            },
          },
        },
        body: 'x'.repeat(14500),
        path: '.claude/skills/test-skill/SKILL.md',
      }),
    });

    const scorer = new HealthScorer(resultStore, successTracker, skillStore);
    const score = await scorer.scoreSkill('test-skill');

    expect(score.overallScore).toBeLessThan(50);
  });

  it('flagUnderperforming returns only flagged skills', async () => {
    const yearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();

    resultStore = createMockResultStore({
      getLatest: vi.fn().mockResolvedValue(makeSnapshot(0.1)),
    });
    successTracker = createMockSuccessTracker({
      getSuccessRate: vi.fn().mockResolvedValue({ rate: 0.1, total: 10, positive: 1, negative: 9 }),
    });
    skillStore = createMockSkillStore({
      list: vi.fn().mockResolvedValue(['bad-skill']),
      read: vi.fn().mockResolvedValue({
        metadata: {
          name: 'bad-skill',
          description: 'A bad skill',
          metadata: {
            extensions: {
              'gsd-skill-creator': { updatedAt: yearAgo },
            },
          },
        },
        body: 'x'.repeat(14500),
        path: '.claude/skills/bad-skill/SKILL.md',
      }),
    });

    const scorer = new HealthScorer(resultStore, successTracker, skillStore);
    const flagged = await scorer.flagUnderperforming();

    expect(flagged.length).toBeGreaterThan(0);
    expect(flagged.every(s => s.flagged)).toBe(true);
  });
});
