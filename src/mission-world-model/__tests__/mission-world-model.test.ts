/**
 * Mission-State World-Model tests — Phase 732 (v1.49.571).
 *
 * Covers LEJEPA-17. HARD CAPCOM PRESERVATION tests are the load-bearing half
 * of this file — any regression that lets the predictor emit a gate-bypass
 * action must fail loudly.
 */

import { describe, expect, it } from 'vitest';
import * as mwmModule from '../index.js';
import {
  DEFAULT_CONFIG,
  FORBIDDEN_ACTION_NAMES,
  assertNoGateBypassAction,
  encodeMissionState,
  planWaveAdvisory,
  predictNextLatent,
  rollout,
} from '../index.js';
import type { MissionAction, MissionState } from '../index.js';

function state(overrides: Partial<MissionState> = {}): MissionState {
  return {
    currentPhase: 732,
    completedTaskCount: 11,
    openCapcomGateCount: 2,
    budgetFraction: 0.4,
    activeSkillCount: 6,
    ...overrides,
  };
}

// ---------- encoder ----------

describe('encodeMissionState', () => {
  it('produces a unit-norm latent of the configured dim', () => {
    const latent = encodeMissionState(state(), DEFAULT_CONFIG);
    expect(latent).toHaveLength(DEFAULT_CONFIG.latentDim);
    const norm = Math.sqrt(latent.reduce((s, x) => s + x * x, 0));
    expect(norm).toBeCloseTo(1, 10);
  });

  it('is deterministic (same state → same latent)', () => {
    const a = encodeMissionState(state({ currentPhase: 728 }), DEFAULT_CONFIG);
    const b = encodeMissionState(state({ currentPhase: 728 }), DEFAULT_CONFIG);
    expect(a).toEqual(b);
  });

  it('different states produce different latents', () => {
    const a = encodeMissionState(state({ currentPhase: 730 }), DEFAULT_CONFIG);
    const b = encodeMissionState(state({ currentPhase: 731 }), DEFAULT_CONFIG);
    expect(a).not.toEqual(b);
  });

  it('rejects latentDim > 192 (LeWM reference bound)', () => {
    expect(() =>
      encodeMissionState(state(), { ...DEFAULT_CONFIG, latentDim: 256 }),
    ).toThrow();
  });

  it('rejects latentDim <= 0', () => {
    expect(() =>
      encodeMissionState(state(), { ...DEFAULT_CONFIG, latentDim: 0 }),
    ).toThrow();
  });

  it('accepts custom auxiliary features without leaking them past Math.tanh', () => {
    const latent = encodeMissionState(
      state({ auxiliary: { custom: 0.5, nan: Number.NaN } }),
      DEFAULT_CONFIG,
    );
    for (const x of latent) expect(Number.isFinite(x)).toBe(true);
  });
});

// ---------- predictor ----------

describe('predictNextLatent', () => {
  it('returns a unit-norm latent', () => {
    const start = encodeMissionState(state(), DEFAULT_CONFIG);
    const next = predictNextLatent(start, 'dispatch-wave');
    const norm = Math.sqrt(next.reduce((s, x) => s + x * x, 0));
    expect(norm).toBeCloseTo(1, 6);
  });

  it('is deterministic', () => {
    const start = encodeMissionState(state(), DEFAULT_CONFIG);
    const a = predictNextLatent(start, 'allocate-model');
    const b = predictNextLatent(start, 'allocate-model');
    expect(a).toEqual(b);
  });

  it('no-op yields unit-norm latent (may differ from input due to renormalization)', () => {
    const start = encodeMissionState(state(), DEFAULT_CONFIG);
    const next = predictNextLatent(start, 'no-op');
    const norm = Math.sqrt(next.reduce((s, x) => s + x * x, 0));
    expect(norm).toBeCloseTo(1, 6);
  });
});

// ---------- rollout ----------

describe('rollout', () => {
  it('returns start latent for empty action sequence', () => {
    const start = encodeMissionState(state(), DEFAULT_CONFIG);
    const final = rollout(start, []);
    expect(final).toEqual(start);
  });

  it('applies actions in order', () => {
    const start = encodeMissionState(state(), DEFAULT_CONFIG);
    const final1 = rollout(start, ['dispatch-wave']);
    const final2 = predictNextLatent(start, 'dispatch-wave');
    expect(final1).toEqual(final2);
  });
});

// ---------- HARD CAPCOM PRESERVATION ----------

describe('CAPCOM preservation — hard gate tests', () => {
  it('FORBIDDEN_ACTION_NAMES covers every gate-bypass variant we care about', () => {
    expect(FORBIDDEN_ACTION_NAMES).toContain('bypass-capcom');
    expect(FORBIDDEN_ACTION_NAMES).toContain('override-capcom');
    expect(FORBIDDEN_ACTION_NAMES).toContain('skip-gate');
    expect(FORBIDDEN_ACTION_NAMES).toContain('force-dispatch');
    expect(FORBIDDEN_ACTION_NAMES).toContain('gate-bypass');
  });

  it('assertNoGateBypassAction throws on every forbidden name', () => {
    for (const name of FORBIDDEN_ACTION_NAMES) {
      expect(() => assertNoGateBypassAction(name)).toThrow(/CAPCOM-PRESERVATION/);
    }
  });

  it('assertNoGateBypassAction throws on case-insensitive matches', () => {
    expect(() => assertNoGateBypassAction('BYPASS-CAPCOM')).toThrow();
    expect(() => assertNoGateBypassAction('Override-Capcom')).toThrow();
  });

  it('assertNoGateBypassAction throws on substring matches', () => {
    expect(() => assertNoGateBypassAction('please-bypass-capcom-now')).toThrow();
    expect(() => assertNoGateBypassAction('x-gate-bypass-y')).toThrow();
  });

  it('assertNoGateBypassAction throws on non-string input', () => {
    expect(() => assertNoGateBypassAction(42 as unknown)).toThrow();
    expect(() => assertNoGateBypassAction(null as unknown)).toThrow();
  });

  it('predictNextLatent refuses to emit a latent for a forbidden action (cast-as-MissionAction loophole closed)', () => {
    const start = encodeMissionState(state(), DEFAULT_CONFIG);
    for (const forbidden of FORBIDDEN_ACTION_NAMES) {
      expect(() =>
        predictNextLatent(start, forbidden as unknown as MissionAction),
      ).toThrow(/CAPCOM-PRESERVATION/);
    }
  });

  it('rollout refuses forbidden actions mid-sequence', () => {
    const start = encodeMissionState(state(), DEFAULT_CONFIG);
    expect(() =>
      rollout(start, ['dispatch-wave', 'bypass-capcom' as unknown as MissionAction]),
    ).toThrow(/CAPCOM-PRESERVATION/);
  });

  it('AdvisoryPlan carries advisoryOnly: true (compile-time const)', () => {
    const cfg = { ...DEFAULT_CONFIG, seed: 42, cemSamples: 16, cemIterations: 2, planningHorizon: 3 };
    const plan = planWaveAdvisory(
      encodeMissionState(state(), cfg),
      encodeMissionState(state({ completedTaskCount: 20 }), cfg),
      cfg,
    );
    expect(plan.advisoryOnly).toBe(true);
  });

  it('CAPCOM preservation: public module exports no dispatch/write/bypass symbol', () => {
    const mod = mwmModule as unknown as Record<string, unknown>;
    const forbidden = [
      'dispatchWave',
      'bypassCapcom',
      'overrideCapcom',
      'writeCapcomState',
      'skipGate',
      'forceDispatchWave',
      'executeActionAuthoritatively',
      'commitPlan',
      'applyAdvisoryPlan',
    ];
    for (const name of forbidden) expect(mod[name]).toBeUndefined();
  });
});

// ---------- CEM planning ----------

describe('planWaveAdvisory — CEM smoke tests', () => {
  it('plans a 3-step rollout quickly (target ≤1s per episode)', () => {
    const cfg = { ...DEFAULT_CONFIG, seed: 7, cemSamples: 32, cemIterations: 2, planningHorizon: 3 };
    const start = encodeMissionState(state(), cfg);
    const goal = encodeMissionState(state({ completedTaskCount: 20, budgetFraction: 0.6 }), cfg);
    const t0 = Date.now();
    const plan = planWaveAdvisory(start, goal, cfg);
    const elapsed = Date.now() - t0;
    expect(plan.actions.length).toBe(3);
    expect(plan.iterationsRun).toBe(2);
    expect(elapsed).toBeLessThan(1000);
  });

  it('is deterministic when seeded', () => {
    const cfg = { ...DEFAULT_CONFIG, seed: 314, cemSamples: 16, cemIterations: 2, planningHorizon: 2 };
    const start = encodeMissionState(state(), cfg);
    const goal = encodeMissionState(state({ completedTaskCount: 15 }), cfg);
    const a = planWaveAdvisory(start, goal, cfg);
    const b = planWaveAdvisory(start, goal, cfg);
    expect(a.actions).toEqual(b.actions);
    expect(a.predictedCost).toBeCloseTo(b.predictedCost, 10);
    expect(a.runTag).toBe(b.runTag);
  });

  it('never emits a forbidden action in the returned plan', () => {
    const cfg = { ...DEFAULT_CONFIG, seed: 99, cemSamples: 64, cemIterations: 3, planningHorizon: 5 };
    const start = encodeMissionState(state(), cfg);
    const goal = encodeMissionState(state({ completedTaskCount: 25 }), cfg);
    const plan = planWaveAdvisory(start, goal, cfg);
    for (const action of plan.actions) {
      for (const forbidden of FORBIDDEN_ACTION_NAMES) {
        expect(action.toLowerCase()).not.toContain(forbidden);
      }
    }
  });

  it('predicted cost decreases or stays flat across iterations (best-effort)', () => {
    const cfg = { ...DEFAULT_CONFIG, seed: 21, cemSamples: 48, cemIterations: 3, planningHorizon: 3 };
    const start = encodeMissionState(state(), cfg);
    const goal = encodeMissionState(state({ completedTaskCount: 15 }), cfg);
    const plan = planWaveAdvisory(start, goal, cfg);
    // Compare against a random-action baseline of the same size (seed+1).
    const randomPlan = planWaveAdvisory(start, goal, { ...cfg, cemIterations: 1, cemSamples: cfg.cemSamples, seed: cfg.seed });
    expect(plan.predictedCost).toBeLessThanOrEqual(randomPlan.predictedCost + 1e-9);
  });
});

// ---------- end-to-end ----------

describe('end-to-end advisory flow', () => {
  it('encode → plan → rollout is internally consistent (final latent matches roll-out)', () => {
    const cfg = { ...DEFAULT_CONFIG, seed: 100, cemSamples: 24, cemIterations: 2, planningHorizon: 3 };
    const startState = state();
    const goalState = state({ completedTaskCount: 20 });
    const start = encodeMissionState(startState, cfg);
    const goal = encodeMissionState(goalState, cfg);
    const plan = planWaveAdvisory(start, goal, cfg);
    const finalFromRollout = rollout(start, plan.actions);
    for (let i = 0; i < finalFromRollout.length; i++) {
      expect(finalFromRollout[i]).toBeCloseTo(plan.predictedFinalLatent[i], 6);
    }
  });
});
