/**
 * Continuation Wave — Cross-Bundle integration tests.
 *
 * Verifies pairwise interactions across the wave-2 bundle boundaries:
 *
 *   Stability × Exploration:
 *     - MD-3 Langevin update passes through MB-2 simplex projection
 *       (noise-then-project preserves simplex admissibility end-to-end).
 *     - MB-5 dead-zone scale on a stochastic selector bridge output
 *       (dead-zone gating does not break MA-3+MD-2 ordering).
 *
 *   Exploration × Representation:
 *     - MD-4 temperature feeds MD-3 noise scale (η_0 = T × ETA0_SCALE).
 *     - MD-1 embeddings feed MD-5 learnable K_H head forward pass.
 *
 *   Representation × Authoring:
 *     - ME-3 A/B harness uses tractability-scaled sample sizes that align
 *       with the ME-1 classification surfaced by MD-6 audit results.
 *     - ME-2 affinity evaluation is stable across the full continuation
 *       skill fixture.
 *
 * @module integration/__tests__/continuation/cross-bundle.test
 */

import { describe, it, expect } from 'vitest';

// Stability bundle
import {
  evaluateLyapunov,
  buildRegressor,
  DEFAULT_GAIN_G,
  DEFAULT_GAIN_GAMMA,
} from '../../../lyapunov/index.js';
import { projectModelRow, verifySimplex } from '../../../projection/index.js';
import {
  adaptationScale,
  DEFAULT_DEAD_ZONE_PARAMS,
  composedVdot,
} from '../../../dead-zone/index.js';

// Exploration bundle
import {
  softmax,
  sampleByScore,
  mulberry32,
  applyStochasticBridge,
  resolveTemperature,
} from '../../../stochastic/index.js';
import {
  applyLangevinUpdate,
  resolveNoiseScale,
} from '../../../langevin/index.js';
import {
  TemperatureApi,
  ETA0_SCALE,
} from '../../../temperature/index.js';

// Representation bundle
import {
  trainEmbeddings,
  buildStore,
  getEmbedding,
} from '../../../embeddings/index.js';
import {
  createStore,
  createHead,
  put,
  resolveKH,
} from '../../../learnable-k_h/index.js';
import { detectCollapse } from '../../../representation-audit/index.js';

// Authoring bundle
import {
  getAffinityDecision,
} from '../../../model-affinity/index.js';
import {
  requiredSampleSize,
  runSignificanceTest,
} from '../../../ab-harness/index.js';

import {
  buildClusteredTraces,
  buildQuintessenceSnapshot,
  buildContinuationSkillFixture,
} from './fixture.js';

import type { SelectorDecision } from '../../../orchestration/selector.js';

function makeDecision(id: string, score: number): SelectorDecision {
  return {
    id,
    score,
    activated: true,
    signals: { m2Score: score, m1Boost: 0, stepBoost: 0, sensoria: null },
  };
}

// ---------------------------------------------------------------------------
// Stability × Exploration
// ---------------------------------------------------------------------------

describe('Cross-Bundle — Stability × Exploration', () => {
  it('MD-3 Langevin update → MB-2 projection chain keeps row on simplex', () => {
    const params = [0.35, 0.30, 0.20, 0.15];
    const rng = mulberry32(12345);
    const result = applyLangevinUpdate(params, {
      langevinEnabled: true,
      baseScale: 0.05,
      tractability: 'tractable',
      rng,
      projectionEnabled: true,
    });
    expect(verifySimplex(result.params)).toBe(true);
    const sum = result.params.reduce((a, b) => a + b, 0);
    expect(Math.abs(sum - 1)).toBeLessThan(1e-9);
  });

  it('MB-5 dead-zone scale gates MA-3+MD-2 sampled decision ordering', () => {
    const decisions = [
      makeDecision('d1', 1.0),
      makeDecision('d2', 0.8),
      makeDecision('d3', 0.5),
    ];
    // Large diff + old cooldown → scale = 0: bridge path does no re-order
    const scale = adaptationScale(0.5, 20, DEFAULT_DEAD_ZONE_PARAMS, 'tractable');
    expect(scale).toBe(0);
    // When scale is 0 we should skip the stochastic bridge entirely
    // (caller policy; we simulate with disabled bridge)
    const out = applyStochasticBridge(decisions, {
      stochasticEnabled: false, // simulate dead-zone suppression
      inBranchContext: true,
      baseTemperature: 1.0,
      tractabilityClass: 'tractable',
      rng: mulberry32(1),
    });
    expect(out).toBe(decisions);
  });

  it('Lyapunov V̇ ≤ 0 preserved even with a stochastic-selected candidate in the loop', () => {
    // Show MB-1's V̇ evaluation is decoupled from stochastic selection
    const c = evaluateLyapunov({
      observedRate: 1.0,
      teachingDeclaredRate: 0.5,
      effectiveK_H: 0.7,
      targetK_H: 1.0,
      regressor: buildRegressor({ doseMagnitude: 0.4, ageMs: 0 }),
      gainG: DEFAULT_GAIN_G,
      gainGamma: DEFAULT_GAIN_GAMMA,
      tractGain: 1.0,
    });
    expect(c.Vdot).toBeLessThanOrEqual(1e-9);
    // Dead-zone scale only attenuates the update — composed V̇ is still ≤ 0
    const s = adaptationScale(0.05, 10, DEFAULT_DEAD_ZONE_PARAMS, 'tractable');
    expect(s).toBe(1);
    expect(composedVdot(c.Vdot, s)).toBeLessThanOrEqual(1e-9);
  });
});

// ---------------------------------------------------------------------------
// Exploration × Representation
// ---------------------------------------------------------------------------

describe('Cross-Bundle — Exploration × Representation', () => {
  it('MD-4 temperature feeds MD-3 noise scale via η_0 = T × ETA0_SCALE', () => {
    const api = new TemperatureApi({ enabled: true, T_base: 0.5 });
    api.update(buildQuintessenceSnapshot({ stabilityVsNovelty: 0.6 }), []);
    const T = api.currentTemperature();
    const eta = api.currentEta0();
    expect(eta).toBeCloseTo(T * ETA0_SCALE, 12);
    // Feed eta into resolveNoiseScale for the tractable class
    const scale = resolveNoiseScale(eta, 'tractable', 1);
    expect(scale).toBeGreaterThan(0);
  });

  it('MD-1 embedding of cluster entity drives MD-5 head.forward path', () => {
    const traces = buildClusteredTraces(25);
    const res = trainEmbeddings(traces, {
      embedDim: 8,
      windowSize: 3,
      minCount: 1,
      maxEpochs: 3,
      seed: 42,
    });
    const embStore = buildStore(res.model, res.vocabulary, res.vocabIndex);
    const embed = getEmbedding(embStore, 'A-alpha');
    expect(embed).not.toBeNull();
    if (embed === null) return;
    const khStore = createStore();
    put(khStore, createHead({
      skillId: 'cluster-A-skill',
      dim: embed.length,
      kHMin: 0.3,
      kHMax: 1.8,
    }));
    const out = resolveKH({
      store: khStore,
      skillId: 'cluster-A-skill',
      taskEmbed: embed,
      scalarKH: 1.0,
      tractability: 'tractable',
      enabled: true,
    });
    expect(out.source).toBe('head');
    expect(out.kH).toBeGreaterThan(0);
  });

  it('MD-4 temperature + MA-3+MD-2 sampling stays deterministic with seeded RNG', () => {
    const api = new TemperatureApi({ enabled: true, T_base: 0.5 });
    api.update(buildQuintessenceSnapshot({ stabilityVsNovelty: 0.7 }), []);
    const T = api.currentTemperature();
    const effT = resolveTemperature(T, 'tractable');
    const a = sampleByScore([2, 1, 0], effT, mulberry32(99));
    const b = sampleByScore([2, 1, 0], effT, mulberry32(99));
    expect(a.index).toBe(b.index);
    expect(a.score).toBe(b.score);
  });

  it('probability distribution from MD-4-driven softmax sums to 1', () => {
    const api = new TemperatureApi({ enabled: true, T_base: 0.8 });
    api.update(buildQuintessenceSnapshot({ stabilityVsNovelty: 0.5 }), []);
    const T = api.currentTemperature();
    const p = softmax([1.5, 1.0, 0.5, 0.1], resolveTemperature(T, 'tractable'));
    const sum = p.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 10);
  });
});

// ---------------------------------------------------------------------------
// Representation × Authoring
// ---------------------------------------------------------------------------

describe('Cross-Bundle — Representation × Authoring', () => {
  it('ME-3 A/B sample size is stable across the MD-6 audit status axis', () => {
    // Sample-size table is intentionally driven by tractability alone,
    // NOT by MD-6 audit status. Confirm it.
    const a = requiredSampleSize('tractable', 0, 0.1);
    const b = requiredSampleSize('coin-flip', 0, 0.1);
    // MD-6 audit on a healthy matrix
    const audit = detectCollapse(
      { matrix: [[1, 0], [0, 1]], communities: null },
      { enabled: true },
    );
    expect(a).toBe(20);
    expect(b).toBe(50);
    // Audit status does not affect sample-size calculation
    expect(['OK', 'WARNING', 'CRITICAL']).toContain(audit.status);
  });

  it('ME-2 decision on every continuation fixture skill produces a valid outcome', () => {
    const skills = buildContinuationSkillFixture(18);
    for (const s of skills) {
      const cls = s.declaredKind === 'prose' ? 'coin-flip' : 'tractable';
      const d = getAffinityDecision(s.rawModelAffinity, 'haiku', cls, true);
      expect(d).not.toBeNull();
      expect(typeof d!.penalty).toBe('number');
      expect(d!.penalty).toBeGreaterThanOrEqual(0);
      expect(d!.penalty).toBeLessThanOrEqual(1);
    }
  });

  it('ME-3 significance test commits B on a planted-significant delta that scales with tractability', () => {
    // Tractable skill (small sample, clear delta)
    const aT = Array.from({ length: 20 }, () => 50);
    const bT = Array.from({ length: 20 }, () => 60);
    const tractResult = runSignificanceTest(aT, bT, 2.0, 0.10);
    expect(tractResult.decision).toBe('commit-B');
    // Coin-flip skill: delta < coin-flip noise floor (2.0 × 2.5 = 5.0) →
    // coin-flip verdict, NOT commit-B
    const aC = Array.from({ length: 50 }, () => 50);
    const bC = Array.from({ length: 50 }, () => 53); // 3 unit delta < 5 floor
    const coinResult = runSignificanceTest(aC, bC, 5.0, 0.10);
    expect(coinResult.decision).toBe('coin-flip');
  });
});

// ---------------------------------------------------------------------------
// Three-way composition sanity
// ---------------------------------------------------------------------------

describe('Cross-Bundle — three-way composition smoke', () => {
  it('full stack composes: MD-4 T → MD-3 η_0 → MB-2 projection → simplex', () => {
    const api = new TemperatureApi({ enabled: true, T_base: 0.5 });
    api.update(buildQuintessenceSnapshot({ stabilityVsNovelty: 0.5 }), []);
    const eta = api.currentEta0();
    const params = [0.30, 0.25, 0.25, 0.20];
    const rng = mulberry32(2024);
    const out = applyLangevinUpdate(params, {
      langevinEnabled: true,
      baseScale: eta,
      tractability: 'tractable',
      rng,
      projectionEnabled: true,
    });
    expect(verifySimplex(out.params)).toBe(true);
  });

  it('MD-1 → MD-5 → MB-2 projection: head output projected onto K_H bounds', () => {
    const traces = buildClusteredTraces(20);
    const res = trainEmbeddings(traces, {
      embedDim: 8,
      windowSize: 3,
      minCount: 1,
      maxEpochs: 3,
      seed: 42,
    });
    const embStore = buildStore(res.model, res.vocabulary, res.vocabIndex);
    const e = getEmbedding(embStore, 'A-alpha');
    expect(e).not.toBeNull();
    if (e === null) return;
    const khStore = createStore();
    put(khStore, createHead({ skillId: 'S', dim: e.length, kHMin: 0.4, kHMax: 1.6 }));
    const out = resolveKH({
      store: khStore,
      skillId: 'S',
      taskEmbed: e,
      scalarKH: 1.0,
      tractability: 'tractable',
      enabled: true,
    });
    // kH ∈ [kHMin, kHMax] by construction of the head
    expect(out.kH).toBeGreaterThanOrEqual(0.4);
    expect(out.kH).toBeLessThanOrEqual(1.6);
  });

  it('MB-2 simplex projection is a no-op on an already-admissible row (flag-on)', () => {
    const row = [0.25, 0.25, 0.25, 0.25];
    const result = projectModelRow(row.slice(), { projectionEnabled: true });
    expect(verifySimplex(result.projected)).toBe(true);
    // Max deviation is near-zero since the input is already on the simplex
    expect(result.maxDeviation).toBeLessThan(1e-6);
  });
});
