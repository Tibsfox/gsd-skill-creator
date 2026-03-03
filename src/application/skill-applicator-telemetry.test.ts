/**
 * End-to-end pipeline integration tests for telemetry wiring.
 *
 * Tests INTG-04 requirements:
 * - ScoreAdjuster wired into SkillApplicator pipeline when patternReport provided
 * - Score adjustments take effect on scoredSkills before BudgetStage
 * - Privacy boundary: TelemetryStage never emits user content fields
 * - Backward compatibility: no score-adjust stage when patternReport omitted
 */

import { describe, it, expect, vi } from 'vitest';
import { SkillApplicator } from './skill-applicator.js';
import { SkillPipeline, createEmptyContext } from './skill-pipeline.js';
import { TelemetryStage } from '../telemetry/telemetry-stage.js';
import { ScoreAdjuster } from '../telemetry/score-adjuster.js';
import type { PatternReport, PatternInsufficient } from '../telemetry/types.js';
import type { SkillIndex } from '../storage/skill-index.js';
import type { SkillStore } from '../storage/skill-store.js';
import type { EventStore } from '../telemetry/event-store.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePatternReport(overrides: Partial<PatternReport> = {}): PatternReport {
  return {
    type: 'report',
    totalSessions: 30,
    analyzedSkills: [],
    highValueSkills: [],
    deadSkills: [],
    budgetCasualties: [],
    correctionMagnets: [],
    scoreDriftSkills: [],
    loadNeverActivateSkills: [],
    ...overrides,
  };
}

function makeInsufficientResult(): PatternInsufficient {
  return {
    type: 'insufficient',
    sessionCount: 3,
    minimumRequired: 10,
    message: 'Insufficient data',
  };
}

function makeMockSkillIndex(): SkillIndex {
  return {
    getEnabled: vi.fn(async () => []),
    search: vi.fn(async () => []),
    add: vi.fn(async () => {}),
    remove: vi.fn(async () => {}),
    update: vi.fn(async () => {}),
    rebuild: vi.fn(async () => {}),
  } as unknown as SkillIndex;
}

function makeMockSkillStore(): SkillStore {
  return {
    read: vi.fn(async () => ({
      body: 'skill content',
      metadata: { name: 'test', description: 'test skill' },
    })),
    create: vi.fn(async () => {}),
    update: vi.fn(async () => {}),
    delete: vi.fn(async () => {}),
    list: vi.fn(async () => []),
    exists: vi.fn(async () => false),
  } as unknown as SkillStore;
}

function makeMockEventStore(): { store: EventStore; calls: unknown[] } {
  const calls: unknown[] = [];
  const store = {
    append: vi.fn(async (event: unknown) => { calls.push(event); }),
    read: vi.fn(async () => []),
    getFileSizeBytes: vi.fn(async () => 0),
    pruneOlderThan: vi.fn(async () => 0),
  } as unknown as EventStore;
  return { store, calls };
}

// ---------------------------------------------------------------------------
// Group 1: Stage wiring verification
// ---------------------------------------------------------------------------

describe('SkillApplicator stage wiring — ScoreAdjuster', () => {
  it('does NOT include score-adjust stage when no patternReport provided', () => {
    const applicator = new SkillApplicator(
      makeMockSkillIndex(),
      makeMockSkillStore(),
    );

    const names = applicator.getPipeline().getStageNames();
    expect(names).not.toContain('score-adjust');
  });

  it('includes score-adjust stage when PatternReport (type=report) provided', () => {
    const report = makePatternReport();
    const applicator = new SkillApplicator(
      makeMockSkillIndex(),
      makeMockSkillStore(),
      undefined, // config
      undefined, // budgetProfile
      undefined, // modelProfile
      undefined, // retrievalConfig
      undefined, // eventStore
      report,
    );

    const names = applicator.getPipeline().getStageNames();
    expect(names).toContain('score-adjust');
  });

  it('score-adjust stage appears after score and before resolve', () => {
    const report = makePatternReport();
    const applicator = new SkillApplicator(
      makeMockSkillIndex(),
      makeMockSkillStore(),
      undefined, undefined, undefined, undefined, undefined,
      report,
    );

    const names = applicator.getPipeline().getStageNames();
    const scoreIdx = names.indexOf('score');
    const adjustIdx = names.indexOf('score-adjust');
    const resolveIdx = names.indexOf('resolve');

    expect(scoreIdx).toBeGreaterThanOrEqual(0);
    expect(adjustIdx).toBeGreaterThan(scoreIdx);
    expect(resolveIdx).toBeGreaterThan(adjustIdx);
  });

  it('does NOT include score-adjust when patternReport has type=insufficient', () => {
    // PatternInsufficient is not PatternReport — the wiring only fires for type==='report'
    const insufficient = makeInsufficientResult();
    // Cast to simulate callers that might pass the union type
    const applicator = new SkillApplicator(
      makeMockSkillIndex(),
      makeMockSkillStore(),
      undefined, undefined, undefined, undefined, undefined,
      insufficient as unknown as PatternReport,
    );

    const names = applicator.getPipeline().getStageNames();
    expect(names).not.toContain('score-adjust');
  });
});

// ---------------------------------------------------------------------------
// Group 2: Score adjustment effect — tested via SkillPipeline directly
// ---------------------------------------------------------------------------

describe('Score adjustment effect in pipeline (INTG-04)', () => {
  it('high-value skill score is boosted by 20% through the score-adjust stage', async () => {
    const report = makePatternReport({ highValueSkills: ['hv-skill'] });
    const adjuster = new ScoreAdjuster();

    const pipeline = new SkillPipeline();
    pipeline.addStage({
      name: 'score',
      process: async (ctx) => {
        ctx.scoredSkills = [{ name: 'hv-skill', score: 0.5, matchType: 'intent' }];
        return ctx;
      },
    });
    pipeline.addStage({
      name: 'score-adjust',
      process: async (context) => {
        if (!context.earlyExit) {
          context.scoredSkills = adjuster.adjust(context.scoredSkills, report);
        }
        return context;
      },
    });
    pipeline.addStage({ name: 'resolve', process: async (ctx) => ctx });

    const result = await pipeline.process(createEmptyContext());

    expect(result.scoredSkills).toHaveLength(1);
    expect(result.scoredSkills[0].score).toBeCloseTo(0.6, 10); // 0.5 × 1.20 = 0.60
  });

  it('dead skill score is dampened by 20% through the score-adjust stage', async () => {
    const report = makePatternReport({ deadSkills: ['dead-skill'] });
    const adjuster = new ScoreAdjuster();

    const pipeline = new SkillPipeline();
    pipeline.addStage({
      name: 'score',
      process: async (ctx) => {
        ctx.scoredSkills = [{ name: 'dead-skill', score: 0.5, matchType: 'intent' }];
        return ctx;
      },
    });
    pipeline.addStage({
      name: 'score-adjust',
      process: async (context) => {
        if (!context.earlyExit) {
          context.scoredSkills = adjuster.adjust(context.scoredSkills, report);
        }
        return context;
      },
    });
    pipeline.addStage({ name: 'resolve', process: async (ctx) => ctx });

    const result = await pipeline.process(createEmptyContext());

    expect(result.scoredSkills[0].score).toBeCloseTo(0.4, 10); // 0.5 × 0.80 = 0.40
  });

  it('unranked skill score is unchanged when score-adjust stage is present', async () => {
    const report = makePatternReport(); // empty high-value and dead lists
    const adjuster = new ScoreAdjuster();

    const pipeline = new SkillPipeline();
    pipeline.addStage({
      name: 'score',
      process: async (ctx) => {
        ctx.scoredSkills = [{ name: 'plain-skill', score: 0.5, matchType: 'intent' }];
        return ctx;
      },
    });
    pipeline.addStage({
      name: 'score-adjust',
      process: async (context) => {
        if (!context.earlyExit) {
          context.scoredSkills = adjuster.adjust(context.scoredSkills, report);
        }
        return context;
      },
    });
    pipeline.addStage({ name: 'resolve', process: async (ctx) => ctx });

    const result = await pipeline.process(createEmptyContext());

    expect(result.scoredSkills[0].score).toBe(0.5); // unchanged
  });

  it('score-adjust stage respects earlyExit — does not adjust when earlyExit is true', async () => {
    const report = makePatternReport({ highValueSkills: ['hv-skill'] });
    const adjuster = new ScoreAdjuster();

    const pipeline = new SkillPipeline();
    pipeline.addStage({
      name: 'score',
      process: async (ctx) => {
        ctx.scoredSkills = [{ name: 'hv-skill', score: 0.5, matchType: 'intent' }];
        ctx.earlyExit = true;
        return ctx;
      },
    });
    pipeline.addStage({
      name: 'score-adjust',
      process: async (context) => {
        if (!context.earlyExit) {
          context.scoredSkills = adjuster.adjust(context.scoredSkills, report);
        }
        return context;
      },
    });

    const result = await pipeline.process(createEmptyContext());

    // earlyExit=true → score-adjust skipped → score unchanged
    expect(result.scoredSkills[0].score).toBe(0.5);
  });
});

// ---------------------------------------------------------------------------
// Group 3: Privacy boundary at integration level (INTG-02)
// ---------------------------------------------------------------------------

describe('Privacy boundary — TelemetryStage emits no user content (INTG-02)', () => {
  it('events emitted by TelemetryStage contain no user content fields', async () => {
    const { store: mockStore, calls } = makeMockEventStore();
    const telemetryStage = new TelemetryStage(mockStore);

    const pipeline = new SkillPipeline();

    // Stub score stage sets skills AND simulates user content in context
    pipeline.addStage({
      name: 'score',
      process: async (ctx) => {
        ctx.scoredSkills = [
          { name: 'skill-a', score: 0.8, matchType: 'intent' },
          { name: 'skill-b', score: 0.6, matchType: 'file' },
        ];
        return ctx;
      },
    });
    pipeline.addStage(telemetryStage);

    // Intent contains user content that must NOT appear in events
    const ctx = createEmptyContext({
      intent: 'USER_PRIVATE_QUERY: build me a backdoor',
      file: 'SENSITIVE_FILE.ts',
      context: 'SECRET_CONTEXT_DATA',
    });

    await pipeline.process(ctx);

    expect(calls.length).toBeGreaterThan(0);

    const allEventJson = JSON.stringify(calls);

    // User content must NOT appear in any emitted event
    expect(allEventJson).not.toContain('USER_PRIVATE_QUERY');
    expect(allEventJson).not.toContain('SENSITIVE_FILE.ts');
    expect(allEventJson).not.toContain('SECRET_CONTEXT_DATA');

    // Prohibited field names must not be present in any event
    for (const event of calls as Array<Record<string, unknown>>) {
      const keys = Object.keys(event);
      expect(keys).not.toContain('intent');
      expect(keys).not.toContain('file');
      expect(keys).not.toContain('context');
      expect(keys).not.toContain('query');
      expect(keys).not.toContain('userMessage');
      expect(keys).not.toContain('transcript');
    }
  });

  it('each emitted event has exactly the expected privacy-safe fields for its type', async () => {
    const { store: mockStore, calls } = makeMockEventStore();
    const telemetryStage = new TelemetryStage(mockStore);

    const pipeline = new SkillPipeline();
    pipeline.addStage({
      name: 'score',
      process: async (ctx) => {
        ctx.scoredSkills = [{ name: 'git-commit', score: 0.9, matchType: 'intent' }];
        ctx.loaded = ['git-commit'];
        ctx.contentCache.set('git-commit', 'x'.repeat(400));
        return ctx;
      },
    });
    pipeline.addStage(telemetryStage);

    await pipeline.process(createEmptyContext({ intent: 'commit my changes' }));

    // Find the skill-scored event
    const scoredEvt = (calls as Array<{ type: string }>).find(e => e.type === 'skill-scored');
    expect(scoredEvt).toBeDefined();
    expect(Object.keys(scoredEvt!).sort()).toEqual(
      ['matchType', 'score', 'sessionId', 'skillName', 'timestamp', 'type'].sort()
    );

    // Find the skill-loaded event
    const loadedEvt = (calls as Array<{ type: string }>).find(e => e.type === 'skill-loaded');
    expect(loadedEvt).toBeDefined();
    expect(Object.keys(loadedEvt!).sort()).toEqual(
      ['sessionId', 'skillName', 'timestamp', 'tokenCount', 'type'].sort()
    );
  });
});

// ---------------------------------------------------------------------------
// Group 4: Backward compatibility
// ---------------------------------------------------------------------------

describe('Backward compatibility — no patternReport', () => {
  it('SkillApplicator with patternReport has exactly one more stage than without', () => {
    const baseline = new SkillApplicator(
      makeMockSkillIndex(),
      makeMockSkillStore(),
    );

    const withReport = new SkillApplicator(
      makeMockSkillIndex(),
      makeMockSkillStore(),
      undefined, undefined, undefined, undefined, undefined,
      makePatternReport(),
    );

    const baselineNames = baseline.getPipeline().getStageNames();
    const withReportNames = withReport.getPipeline().getStageNames();

    // withReport has one extra stage: 'score-adjust'
    expect(withReportNames.length).toBe(baselineNames.length + 1);
    expect(withReportNames).toContain('score-adjust');
    expect(baselineNames).not.toContain('score-adjust');
  });

  it('SkillApplicator without patternReport has no score-adjust stage at any position', () => {
    const applicator = new SkillApplicator(
      makeMockSkillIndex(),
      makeMockSkillStore(),
    );

    const names = applicator.getPipeline().getStageNames();
    expect(names.filter(n => n === 'score-adjust')).toHaveLength(0);
  });
});
