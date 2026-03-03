import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TelemetryStage } from './telemetry-stage.js';
import { createEmptyContext } from '../application/skill-pipeline.js';
import type { EventStore } from './event-store.js';
import type { SkillBudgetSkippedEvent, SkillLoadedEvent, SkillScoredEvent } from './types.js';

function makeMockStore(): { store: EventStore; calls: unknown[] } {
  const calls: unknown[] = [];
  const store = {
    append: vi.fn(async (event: unknown) => {
      calls.push(event);
    }),
    read: vi.fn(async () => []),
    getFileSizeBytes: vi.fn(async () => 0),
    pruneOlderThan: vi.fn(async () => 0),
  } as unknown as EventStore;
  return { store, calls };
}

describe('TelemetryStage', () => {
  let stage: TelemetryStage;
  let mockStore: EventStore;
  let calls: unknown[];

  beforeEach(() => {
    const mock = makeMockStore();
    mockStore = mock.store;
    calls = mock.calls;
    stage = new TelemetryStage(mockStore);
  });

  it('has name "telemetry"', () => {
    expect(stage.name).toBe('telemetry');
  });

  it('returns context unchanged', async () => {
    const ctx = createEmptyContext({ intent: 'test' });
    const result = await stage.process(ctx);
    expect(result).toBe(ctx);
    expect(result.intent).toBe('test');
  });

  it('emits no events when earlyExit is true and all arrays empty', async () => {
    const ctx = createEmptyContext({ earlyExit: true });
    await stage.process(ctx);
    expect(calls).toHaveLength(0);
  });

  it('emits one skill-scored event per scoredSkill', async () => {
    const ctx = createEmptyContext({
      scoredSkills: [
        { name: 'git-commit', score: 0.9, matchType: 'intent' },
        { name: 'typescript-patterns', score: 0.7, matchType: 'context' },
      ],
    });
    await stage.process(ctx);

    const scored = calls.filter((e: unknown) => (e as SkillScoredEvent).type === 'skill-scored');
    expect(scored).toHaveLength(2);
    expect((scored[0] as SkillScoredEvent).skillName).toBe('git-commit');
    expect((scored[0] as SkillScoredEvent).score).toBe(0.9);
    expect((scored[0] as SkillScoredEvent).matchType).toBe('intent');
    expect((scored[1] as SkillScoredEvent).skillName).toBe('typescript-patterns');
  });

  it('emits one skill-budget-skipped event per budgetSkipped entry', async () => {
    const ctx = createEmptyContext({
      budgetSkipped: [
        { name: 'large-skill', tier: 'standard', reason: 'budget_exceeded', estimatedTokens: 1200 },
      ],
    });
    await stage.process(ctx);

    const skipped = calls.filter(
      (e: unknown) => (e as SkillBudgetSkippedEvent).type === 'skill-budget-skipped'
    );
    expect(skipped).toHaveLength(1);
    expect((skipped[0] as SkillBudgetSkippedEvent).skillName).toBe('large-skill');
    expect((skipped[0] as SkillBudgetSkippedEvent).reason).toBe('budget_exceeded');
    expect((skipped[0] as SkillBudgetSkippedEvent).estimatedTokens).toBe(1200);
  });

  it('emits one skill-loaded event per loaded skill name', async () => {
    const ctx = createEmptyContext({
      loaded: ['git-commit', 'typescript-patterns'],
    });
    await stage.process(ctx);

    const loaded = calls.filter((e: unknown) => (e as SkillLoadedEvent).type === 'skill-loaded');
    expect(loaded).toHaveLength(2);
    expect((loaded[0] as SkillLoadedEvent).skillName).toBe('git-commit');
    expect((loaded[1] as SkillLoadedEvent).skillName).toBe('typescript-patterns');
  });

  it('sets tokenCount from contentCache (chars / 4 rounded)', async () => {
    const content = 'x'.repeat(400); // 400 chars => 100 tokens
    const ctx = createEmptyContext({
      loaded: ['skill-a'],
    });
    ctx.contentCache.set('skill-a', content);
    await stage.process(ctx);

    const loadedEvents = calls.filter(
      (e: unknown) => (e as SkillLoadedEvent).type === 'skill-loaded'
    );
    expect((loadedEvents[0] as SkillLoadedEvent).tokenCount).toBe(100);
  });

  it('sets tokenCount to 0 when skill not in contentCache', async () => {
    const ctx = createEmptyContext({ loaded: ['uncached-skill'] });
    await stage.process(ctx);

    const loadedEvents = calls.filter(
      (e: unknown) => (e as SkillLoadedEvent).type === 'skill-loaded'
    );
    expect((loadedEvents[0] as SkillLoadedEvent).tokenCount).toBe(0);
  });

  it('all events share the same sessionId from context', async () => {
    const ctx = createEmptyContext({
      scoredSkills: [{ name: 'a', score: 0.5, matchType: 'intent' }],
      budgetSkipped: [{ name: 'b', tier: 'optional', reason: 'budget_exceeded', estimatedTokens: 500 }],
      loaded: ['c'],
    });
    const expectedSessionId = ctx.sessionId;
    await stage.process(ctx);

    for (const event of calls as Array<{ sessionId: string }>) {
      expect(event.sessionId).toBe(expectedSessionId);
    }
  });

  it('does not throw when store.append rejects — errors are caught internally', async () => {
    const failingStore = {
      append: vi.fn().mockRejectedValue(new Error('disk full')),
      read: vi.fn(async () => []),
      getFileSizeBytes: vi.fn(async () => 0),
      pruneOlderThan: vi.fn(async () => 0),
    } as unknown as EventStore;
    const failingStage = new TelemetryStage(failingStore);

    const ctx = createEmptyContext({
      scoredSkills: [{ name: 'x', score: 0.5, matchType: 'intent' }],
    });

    // Must not throw
    await expect(failingStage.process(ctx)).resolves.toBeDefined();
  });

  it('emits events even when earlyExit is true but there is data (scored skills)', async () => {
    const ctx = createEmptyContext({
      earlyExit: true,
      scoredSkills: [{ name: 'skill-x', score: 0.6, matchType: 'file' }],
    });
    await stage.process(ctx);

    // earlyExit with data — should still emit
    const scored = calls.filter((e: unknown) => (e as SkillScoredEvent).type === 'skill-scored');
    expect(scored).toHaveLength(1);
  });

  it('calls pruneOlderThan(90) after appending events (INTG-03)', async () => {
    const ctx = createEmptyContext({
      scoredSkills: [{ name: 'a', score: 0.5, matchType: 'intent' }],
    });
    await stage.process(ctx);

    expect((mockStore.pruneOlderThan as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(90);
  });

  it('does not throw when pruneOlderThan rejects', async () => {
    (mockStore.pruneOlderThan as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('prune fail'));
    const ctx = createEmptyContext({
      scoredSkills: [{ name: 'a', score: 0.5, matchType: 'intent' }],
    });
    await expect(stage.process(ctx)).resolves.toBeDefined();
  });

  it('does not read user content fields from context', async () => {
    // This test verifies the stage only touches the fields it should
    const ctx = createEmptyContext({
      intent: 'THIS SHOULD NOT APPEAR IN ANY EVENT',
      file: 'SECRET_FILE.ts',
      context: 'USER_PRIVATE_CONTEXT',
      scoredSkills: [{ name: 'skill-a', score: 0.8, matchType: 'intent' }],
    });
    await stage.process(ctx);

    const allEventJson = JSON.stringify(calls);
    expect(allEventJson).not.toContain('THIS SHOULD NOT APPEAR IN ANY EVENT');
    expect(allEventJson).not.toContain('SECRET_FILE.ts');
    expect(allEventJson).not.toContain('USER_PRIVATE_CONTEXT');
  });
});
