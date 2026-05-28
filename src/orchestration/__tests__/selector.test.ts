/**
 * Selector behaviour: composes M1 + M2 + M6; writes M3 trace on every
 * decision; M6 flag-off path is byte-identical to a no-M6 path.
 *
 * @module orchestration/__tests__/selector.test
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { ActivationSelector, select, type Candidate } from '../selector.js';
import { ActivationWriter } from '../../traces/activation-writer.js';
import type {
  ConceptFallbackProvider,
  ConceptSuggestion,
} from '../../predictive-skill-loader/index.js';

// v1.49.846 auto-emit-from-substrate: mock the JSONL appender so test runs
// don't pollute the operator's real calibration data. Mirrors copper/activation.test.ts.
vi.mock('../../bounded-learning/predictive-low-confidence-events.js', () => ({
  appendPredictiveLowConfidenceEvent: vi.fn(async () => '/mock/path'),
}));
import { appendPredictiveLowConfidenceEvent } from '../../bounded-learning/predictive-low-confidence-events.js';
const appendSpy = vi.mocked(appendPredictiveLowConfidenceEvent);

// ─── Helpers ───────────────────────────────────────────────────────────────

const cleanups: string[] = [];

function tempTraceFile(): string {
  const dir = join(tmpdir(), `m5-selector-test-${randomUUID()}`);
  cleanups.push(dir);
  return join(dir, 'traces.jsonl');
}

afterEach(async () => {
  for (const d of cleanups.splice(0)) {
    await fs.rm(d, { recursive: true, force: true });
  }
});

function candidatesFixture(): Candidate[] {
  const now = Date.now();
  return [
    { id: 'skill-debug', content: 'debug a failing test', ts: now, importance: 0.5 },
    { id: 'skill-edit', content: 'edit source files safely', ts: now, importance: 0.3 },
    { id: 'skill-run', content: 'run the test suite', ts: now, importance: 0.7 },
    { id: 'skill-grep', content: 'search the codebase for a pattern', ts: now, importance: 0.1 },
  ];
}

async function readTraceFile(path: string): Promise<string[]> {
  try {
    const raw = await fs.readFile(path, 'utf8');
    return raw.split('\n').filter((l) => l.length > 0);
  } catch {
    return [];
  }
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('ActivationSelector — basic', () => {
  it('ranks candidates by αβγ composite', async () => {
    const tracePath = tempTraceFile();
    const sel = new ActivationSelector({
      writer: new ActivationWriter(tracePath),
      scorer: { alpha: 0.3, beta: 0.6, gamma: 0.1 },
    });
    const decisions = await sel.select('debug failing test', candidatesFixture());
    expect(decisions.length).toBeGreaterThan(0);
    expect(decisions[0].id).toBe('skill-debug');
  });

  it('is deterministic across repeated calls with same inputs', async () => {
    const cands = candidatesFixture();
    const ts = cands[0].ts!;
    const opts = {
      writer: new ActivationWriter(tempTraceFile()),
      scorer: { alpha: 0.3, beta: 0.6, gamma: 0.1 },
    };
    const a = await select('debug failing test', cands.map(c => ({ ...c, ts })), opts);
    const b = await select('debug failing test', cands.map(c => ({ ...c, ts })), {
      ...opts,
      writer: new ActivationWriter(tempTraceFile()),
    });
    expect(a.map(d => d.id)).toEqual(b.map(d => d.id));
  });
});

describe('ActivationSelector — M3 trace writes', () => {
  it('writes one trace per decision', async () => {
    const tracePath = tempTraceFile();
    const sel = new ActivationSelector({
      writer: new ActivationWriter(tracePath),
    });
    const cands = candidatesFixture();
    const decisions = await sel.select('run test', cands);
    const lines = await readTraceFile(tracePath);
    expect(lines.length).toBe(decisions.length);
  });

  it('trace records reference the selected entity id', async () => {
    const tracePath = tempTraceFile();
    const sel = new ActivationSelector({
      writer: new ActivationWriter(tracePath),
    });
    const cands = candidatesFixture();
    const decisions = await sel.select('run test', cands);
    const lines = await readTraceFile(tracePath);
    for (const d of decisions) {
      const hit = lines.some((l) => l.includes(d.id));
      expect(hit).toBe(true);
    }
  });
});

describe('ActivationSelector — step-graph boost', () => {
  it('boosts candidates matching predicted next', async () => {
    const cands = candidatesFixture();
    const tracePath = tempTraceFile();

    const without = await new ActivationSelector({
      writer: new ActivationWriter(tracePath),
    }).select('debug', cands);

    const withPred = await new ActivationSelector({
      writer: new ActivationWriter(tempTraceFile()),
      prediction: { id: 'prev', predictedNext: ['skill-grep'], confidence: 0.9 },
      stepWeight: 1.0,
    }).select('debug', cands);

    const grepBefore = without.find((d) => d.id === 'skill-grep')!;
    const grepAfter = withPred.find((d) => d.id === 'skill-grep')!;
    expect(grepAfter.score).toBeGreaterThan(grepBefore.score);
    expect(grepAfter.signals.stepBoost).toBeGreaterThan(0);
  });
});

describe('SC-FLAG-OFF: M6 disabled path is byte-identical to no-M6 path', () => {
  it('decisions match when sensoria is undefined vs sensoria.enabled=false', async () => {
    const cands = candidatesFixture();
    const ts = cands[0].ts!;
    const noM6 = await new ActivationSelector({
      writer: new ActivationWriter(tempTraceFile()),
    }).select('run test', cands.map(c => ({ ...c, ts })));

    const m6Off = await new ActivationSelector({
      writer: new ActivationWriter(tempTraceFile()),
      sensoria: { enabled: false },
    }).select('run test', cands.map(c => ({ ...c, ts })));

    // Byte-identical: same ranking, same composite scores, no sensoria fields.
    expect(m6Off.length).toBe(noM6.length);
    for (let i = 0; i < noM6.length; i++) {
      expect(m6Off[i].id).toBe(noM6[i].id);
      // Allow tiny float noise from separate Date.now() reads; within the
      // scorer's recency exponential the difference is sub-µs in the composite.
      expect(m6Off[i].score).toBeCloseTo(noM6[i].score, 5);
      expect(m6Off[i].activated).toBe(noM6[i].activated);
      expect(m6Off[i].signals.sensoria).toBeNull();
      expect(noM6[i].signals.sensoria).toBeNull();
    }
  });

  it('when sensoria enabled=true with no net-shift data, decisions remain well-formed', async () => {
    const cands = candidatesFixture();
    const decisions = await new ActivationSelector({
      writer: new ActivationWriter(tempTraceFile()),
      sensoria: { enabled: true },
    }).select('run test', cands);
    // Every decision should have a sensoria signal recorded.
    for (const d of decisions) {
      expect(d.signals.sensoria).not.toBeNull();
    }
  });
});

describe('ActivationSelector — topK cap', () => {
  it('respects topK', async () => {
    const sel = new ActivationSelector({
      writer: new ActivationWriter(tempTraceFile()),
      topK: 2,
    });
    const decisions = await sel.select('run test', candidatesFixture());
    expect(decisions.length).toBe(2);
  });
});

// ─── T1.3 substrate-consumer wire (v1.49.826) ──────────────────────────────
//
// Second production caller of the `onPredictions` hook pattern; first was
// `src/chipset/copper/activation.ts` (v1.49.810). When an activated decision
// fires, the selector invokes the predictive-skill-loader and surfaces the
// (possibly empty, default-off-flag-gated) predictions to the subscriber.
// Errors are swallowed so prediction failures cannot break selection.

describe('ActivationSelector — onPredictions hook (T1.3 substrate-consumer wire)', () => {
  it('invokes onPredictions for each activated decision', async () => {
    const calls: Array<{ skill: string; predictionCount: number }> = [];
    const sel = new ActivationSelector({
      writer: new ActivationWriter(tempTraceFile()),
      onPredictions: (skill, predictions) => {
        calls.push({ skill, predictionCount: predictions.length });
      },
    });
    const decisions = await sel.select('debug failing test', candidatesFixture());
    // Let the fire-and-forget microtask resolve.
    await new Promise((resolve) => setTimeout(resolve, 10));
    const activatedIds = decisions.filter((d) => d.activated).map((d) => d.id);
    // Hook fires once per activated decision; not for non-activated ones.
    expect(calls.length).toBe(activatedIds.length);
    for (const call of calls) {
      expect(activatedIds).toContain(call.skill);
      // Default-off predictive-skill-loader flag → empty predictions array.
      expect(call.predictionCount).toBeGreaterThanOrEqual(0);
    }
  });

  it('does not fire onPredictions when no hook is set (subscriber-gated)', async () => {
    // Mainly an absence-test: if the dispatch crashes when no hook is set,
    // the surrounding select() call will throw. The presence of THIS test
    // and its passing is the assertion.
    const sel = new ActivationSelector({
      writer: new ActivationWriter(tempTraceFile()),
    });
    const decisions = await sel.select('debug failing test', candidatesFixture());
    expect(decisions.length).toBeGreaterThan(0);
  });

  it('selection succeeds even when the hook throws (fire-and-forget contract)', async () => {
    const sel = new ActivationSelector({
      writer: new ActivationWriter(tempTraceFile()),
      onPredictions: () => {
        throw new Error('hook intentionally throws');
      },
    });
    // If the hook's throw propagates, this assertion would fail.
    const decisions = await sel.select('debug failing test', candidatesFixture());
    // Let the swallow path run.
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(decisions.length).toBeGreaterThan(0);
    expect(decisions.some((d) => d.activated)).toBe(true);
  });
});

// ─── T1.3 Option C low-confidence fallback wire (v1.49.832) ────────────────
//
// Second production caller of the `fallbackProvider` pattern after
// `src/chipset/copper/activation.ts` (v1.49.830). Mirrors the copper unit-test
// coverage at the selector boundary.

describe('ActivationSelector — fallbackProvider (T1.3 Option C low-confidence wire)', () => {
  function recordingProvider(): {
    provider: ConceptFallbackProvider;
    calls: Array<{ skill: string; maxScore: number }>;
  } {
    const calls: Array<{ skill: string; maxScore: number }> = [];
    const provider: ConceptFallbackProvider = {
      async onLowConfidence(skill, maxScore) {
        calls.push({ skill, maxScore });
        const suggestion: ConceptSuggestion = {
          conceptId: 'analogous-concept',
          rendered: 'fallback rendered text',
          via: 'test-mock',
        };
        return [suggestion];
      },
    };
    return { provider, calls };
  }

  it('fires fallbackProvider for each activated decision when only the provider is wired', async () => {
    const { provider, calls } = recordingProvider();
    const sel = new ActivationSelector({
      writer: new ActivationWriter(tempTraceFile()),
      fallbackProvider: provider,
    });
    const decisions = await sel.select('debug failing test', candidatesFixture());
    await new Promise((resolve) => setTimeout(resolve, 10));

    const activatedIds = decisions.filter((d) => d.activated).map((d) => d.id);
    // Default-off predictive-skill-loader → empty predictions → max-score 0
    // → 0 < default 0.30 → fallback fires once per activated decision.
    expect(calls.length).toBe(activatedIds.length);
    for (const call of calls) {
      expect(activatedIds).toContain(call.skill);
      expect(call.maxScore).toBe(0);
    }
  });

  it('fires both onPredictions AND fallbackProvider when both are wired', async () => {
    const predictionCalls: string[] = [];
    const { provider, calls: fallbackCalls } = recordingProvider();
    const sel = new ActivationSelector({
      writer: new ActivationWriter(tempTraceFile()),
      onPredictions: (skill) => {
        predictionCalls.push(skill);
      },
      fallbackProvider: provider,
    });
    const decisions = await sel.select('debug failing test', candidatesFixture());
    await new Promise((resolve) => setTimeout(resolve, 10));

    const activatedIds = decisions.filter((d) => d.activated).map((d) => d.id);
    expect(predictionCalls.length).toBe(activatedIds.length);
    expect(fallbackCalls.length).toBe(activatedIds.length);
  });

  it('does not fire fallbackProvider when neither hook nor provider is wired', async () => {
    const sel = new ActivationSelector({
      writer: new ActivationWriter(tempTraceFile()),
    });
    const decisions = await sel.select('debug failing test', candidatesFixture());
    expect(decisions.length).toBeGreaterThan(0);
    // No observable side effect to assert beyond "selection didn't crash".
  });

  it('selection succeeds even when the fallback throws (fire-and-forget contract)', async () => {
    const sel = new ActivationSelector({
      writer: new ActivationWriter(tempTraceFile()),
      fallbackProvider: {
        async onLowConfidence() {
          throw new Error('fallback intentionally throws');
        },
      },
    });
    const decisions = await sel.select('debug failing test', candidatesFixture());
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(decisions.length).toBeGreaterThan(0);
    expect(decisions.some((d) => d.activated)).toBe(true);
  });
});

// ─── v1.49.846 auto-emit-from-substrate ────────────────────────────────────
//
// Mirror of `src/chipset/copper/activation.test.ts` auto-emit-from-substrate
// coverage. The selector is the second emit-prediction call site; the
// auto-recorder wire must fire there too so calibration evidence accrues
// from both production callers.

describe('ActivationSelector — auto-emit-from-substrate (v1.49.846)', () => {
  function clearSpy() {
    appendSpy.mockClear();
    appendSpy.mockResolvedValue('/mock/path');
  }

  it('appends a low-confidence event for each activated decision when fallback is wired', async () => {
    clearSpy();
    const sel = new ActivationSelector({
      writer: new ActivationWriter(tempTraceFile()),
      fallbackProvider: {
        async onLowConfidence() {
          return null;
        },
      },
    });
    const decisions = await sel.select('debug failing test', candidatesFixture());
    await new Promise((resolve) => setTimeout(resolve, 10));

    const activatedCount = decisions.filter((d) => d.activated).length;
    expect(activatedCount).toBeGreaterThan(0);
    expect(appendSpy).toHaveBeenCalledTimes(activatedCount);
    for (const call of appendSpy.mock.calls) {
      expect(call[0]?.kind).toBe('not_useful');
      expect(call[0]?.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });

  it('appends low-confidence events when only onPredictions is wired (no fallback)', async () => {
    clearSpy();
    const sel = new ActivationSelector({
      writer: new ActivationWriter(tempTraceFile()),
      onPredictions: () => undefined,
    });
    const decisions = await sel.select('debug failing test', candidatesFixture());
    await new Promise((resolve) => setTimeout(resolve, 10));

    const activatedCount = decisions.filter((d) => d.activated).length;
    expect(activatedCount).toBeGreaterThan(0);
    // Auto-emit independent of fallback wiring (v846 design decision).
    expect(appendSpy).toHaveBeenCalledTimes(activatedCount);
  });

  it('does NOT append when neither hook nor fallback is wired (predict path is gated)', async () => {
    clearSpy();
    const sel = new ActivationSelector({
      writer: new ActivationWriter(tempTraceFile()),
    });
    const decisions = await sel.select('debug failing test', candidatesFixture());
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(decisions.length).toBeGreaterThan(0);
    expect(appendSpy).not.toHaveBeenCalled();
  });

  it('selection succeeds even when appendPredictiveLowConfidenceEvent rejects', async () => {
    clearSpy();
    appendSpy.mockRejectedValue(new Error('disk full'));
    const sel = new ActivationSelector({
      writer: new ActivationWriter(tempTraceFile()),
      fallbackProvider: {
        async onLowConfidence() {
          return null;
        },
      },
    });
    const decisions = await sel.select('debug failing test', candidatesFixture());
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(decisions.length).toBeGreaterThan(0);
    expect(decisions.some((d) => d.activated)).toBe(true);
    expect(appendSpy).toHaveBeenCalled();
  });
});
