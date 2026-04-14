import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ============================================================================
// Types (imported after they exist)
// ============================================================================

import { runCritiqueLoop } from './loop.js';
import type {
  CritiqueFinding,
  CritiqueStage,
  CritiqueConfig,
  SkillDraft,
} from './types.js';

// ============================================================================
// Helpers
// ============================================================================

function makeDraft(body = 'Hello world'): SkillDraft {
  return {
    skillName: 'test-skill',
    skillDir: '/tmp/test-skill',
    body,
    metadata: { name: 'test-skill', description: 'A test skill' },
    files: new Map(),
  };
}

function makeConfig(overrides: Partial<CritiqueConfig> = {}): CritiqueConfig {
  return {
    maxIterations: 5,
    convergenceWindow: 2,
    stallDetection: true,
    logDir: '.local/critique-logs',
    ...overrides,
  };
}

function makeFinding(msg = 'found an issue', stage = 'spec-compliance'): CritiqueFinding {
  return { stage, severity: 'error', message: msg };
}

/**
 * A mock critique stage returning scripted findings per call.
 * When repeatLast=true (default false), repeats the final queue entry forever
 * rather than returning [] after the queue is exhausted.
 */
class MockStage implements CritiqueStage {
  readonly name: string;
  private queue: CritiqueFinding[][];
  private repeatLast: boolean;
  private lastEntry: CritiqueFinding[] = [];
  private callCount = 0;

  constructor(
    name: string,
    scriptedResponses: CritiqueFinding[][] = [],
    repeatLast = false,
  ) {
    this.name = name;
    this.queue = [...scriptedResponses];
    this.repeatLast = repeatLast;
    if (scriptedResponses.length > 0) {
      this.lastEntry = scriptedResponses[scriptedResponses.length - 1]!;
    }
  }

  async run(_draft: SkillDraft): Promise<CritiqueFinding[]> {
    this.callCount++;
    if (this.queue.length > 0) {
      const findings = this.queue.shift()!;
      this.lastEntry = findings;
      return findings;
    }
    return this.repeatLast ? this.lastEntry : [];
  }

  get calls(): number {
    return this.callCount;
  }
}

/** Deterministic revise dep — just appends " (revised)" to body. */
const mockDeps = {
  revise: async (draft: SkillDraft, _findings: CritiqueFinding[]): Promise<SkillDraft> => ({
    ...draft,
    body: draft.body + ' (revised)',
  }),
  hashBody: (body: string) => Buffer.from(body).toString('base64'),
};

// ============================================================================
// Tests
// ============================================================================

describe('runCritiqueLoop', () => {
  it('converges in 2 iterations when stages report zero findings twice in a row', async () => {
    const stage = new MockStage('spec', [[], []]); // always passes
    const result = await runCritiqueLoop(makeDraft(), [stage], makeConfig(), mockDeps);

    expect(result.status).toBe('converged');
    expect(result.iterations).toBe(2); // window=2, converges on iteration 2
    expect(result.finalFindings).toHaveLength(0);
  });

  it('exits max-iterations when reviewer keeps flagging', async () => {
    // repeatLast=true ensures the stage always returns findings → never converges.
    // stallDetection=false to distinguish max-iterations from stall (both fire when
    // findings are identical, but this test explicitly wants max-iterations behavior).
    const stage = new MockStage('spec', [[makeFinding('persistent issue')]], true);
    const config = makeConfig({ maxIterations: 3, convergenceWindow: 2, stallDetection: false });
    const result = await runCritiqueLoop(makeDraft(), [stage], config, mockDeps);

    expect(result.status).toBe('max-iterations');
    expect(result.iterations).toBe(3);
    expect(result.finalFindings.length).toBeGreaterThan(0);
  });

  it('stalls when consecutive iterations produce identical findings', async () => {
    const finding = makeFinding('same issue');
    // Same finding repeated with repeatLast=true → stall detected on iteration 2
    // convergenceWindow=3 ensures we don't converge (would need 3 zero-finding iterations)
    const stage = new MockStage('spec', [[finding]], true);
    const config = makeConfig({ maxIterations: 5, convergenceWindow: 3, stallDetection: true });
    const result = await runCritiqueLoop(makeDraft(), [stage], config, mockDeps);

    expect(result.status).toBe('stalled');
  });

  it('calls reviseDraft exactly iterations-1 times on converge', async () => {
    const reviseSpy = vi.fn(async (draft: SkillDraft, _f: CritiqueFinding[]) => draft);
    const deps = { ...mockDeps, revise: reviseSpy };

    const stage = new MockStage('spec', [[], []]); // converges at iteration 2
    const config = makeConfig({ convergenceWindow: 2, maxIterations: 5 });
    const result = await runCritiqueLoop(makeDraft(), [stage], config, deps);

    expect(result.status).toBe('converged');
    expect(result.iterations).toBe(2);
    // revise is called ONLY between iterations, not on the converging iteration
    expect(reviseSpy).toHaveBeenCalledTimes(1);
  });

  it('passes stage findings through unchanged', async () => {
    const finding: CritiqueFinding = {
      stage: 'link-check',
      severity: 'warning',
      message: 'broken link',
      location: { file: 'SKILL.md', line: 10 },
      fixHint: 'Update the URL',
    };
    const stage = new MockStage('link-check', [
      [finding],
      [finding],
      [],
      [],
    ]);
    const config = makeConfig({ convergenceWindow: 2, maxIterations: 5 });
    const result = await runCritiqueLoop(makeDraft(), [stage], config, mockDeps);

    expect(result.log[0].findings[0]).toMatchObject({
      stage: 'link-check',
      severity: 'warning',
      message: 'broken link',
    });
  });

  it('calls each stage in registration order each iteration', async () => {
    const calls: string[] = [];
    const stageA: CritiqueStage = {
      name: 'a',
      run: async (d) => { calls.push('a'); return []; },
    };
    const stageB: CritiqueStage = {
      name: 'b',
      run: async (d) => { calls.push('b'); return []; },
    };
    const config = makeConfig({ convergenceWindow: 2, maxIterations: 5 });
    await runCritiqueLoop(makeDraft(), [stageA, stageB], config, mockDeps);

    // Should alternate a,b per iteration
    expect(calls.slice(0, 4)).toEqual(['a', 'b', 'a', 'b']);
  });

  it('does NOT import OptimizationDriver (meta-test)', () => {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const loopSource = readFileSync(join(__dirname, 'loop.ts'), 'utf-8');
    expect(loopSource).not.toContain('optimization-driver');
    expect(loopSource).not.toContain('OptimizationDriver');
    expect(loopSource).not.toContain('MultiModelBenchmarkRunner');
    expect(loopSource).not.toContain('ModelAwareGrader');
  });

  it('includes a skillHash in the result', async () => {
    const stage = new MockStage('spec', [[], []]);
    const result = await runCritiqueLoop(makeDraft(), [stage], makeConfig(), mockDeps);
    expect(typeof result.skillHash).toBe('string');
    expect(result.skillHash.length).toBeGreaterThan(0);
  });

  it('includes iteration log entries', async () => {
    const stage = new MockStage('spec', [[], []]);
    const result = await runCritiqueLoop(makeDraft(), [stage], makeConfig(), mockDeps);
    expect(result.log.length).toBe(2);
    expect(result.log[0]).toHaveProperty('iteration', 1);
    expect(result.log[0]).toHaveProperty('findings');
    expect(result.log[0]).toHaveProperty('durationMs');
  });
});
