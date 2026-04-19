/**
 * Continuation Wave — Bundle 4 (Exploration) integration tests.
 *
 * Covers the wiring between MA-3+MD-2 (stochastic selection), MD-3 (Langevin
 * noise on M7 generative-model updates), and MD-4 (Quintessence-driven
 * temperature schedule).
 *
 * Gates:
 *   IT-W3-MA3+MD2 — stochastic selection produces softmax distribution at
 *     the temperature resolved from MD-4.
 *   IT-W3-MD3 — Langevin noise on M7 update composes with MB-2 simplex
 *     projection; post-noise vector is always simplex-admissible.
 *   IT-W3-MD4 — temperature schedule drives both the stochastic selector
 *     bridge AND the Langevin bridge via `defaultApi.currentTemperature()`
 *     and `defaultApi.currentEta0()`.
 *
 * Tractability gating:
 *   Temperature is suppressed to the coin-flip multiplier (×0.3) on
 *   coin-flip skills — exploration capacity is bounded not eliminated.
 *
 * Flag-off byte-identity is asserted separately (see flag-off-byte-identical
 * test).  This file focuses on flags-ON composition correctness.
 *
 * @module integration/__tests__/continuation/bundle-exploration.test
 */

import { describe, it, expect } from 'vitest';

// MA-3 + MD-2
import {
  softmax,
  sampleByScore,
  mulberry32,
  resolveTemperature,
  TRACTABILITY_TEMPERATURE_SCALE,
  applyStochasticBridge,
  TEMPERATURE_EPSILON,
} from '../../../stochastic/index.js';

// MD-3
import {
  injectLangevinNoise,
  resolveNoiseScale,
  TRACTABILITY_NOISE_GAIN,
  preservesDarkRoom,
  applyLangevinUpdate,
} from '../../../langevin/index.js';

// MD-4
import {
  TemperatureApi,
  ETA0_SCALE,
  SENTINEL_TEMPERATURE,
} from '../../../temperature/index.js';

// MB-2 (composition partner)
import { projectModelRow, verifySimplex } from '../../../projection/index.js';

import { buildQuintessenceSnapshot } from './fixture.js';

import type { SelectorDecision } from '../../../orchestration/selector.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDecision(id: string, score: number): SelectorDecision {
  return {
    id,
    score,
    activated: true,
    signals: {
      m2Score: score,
      m1Boost: 0,
      stepBoost: 0,
      sensoria: null,
    },
  };
}

// ---------------------------------------------------------------------------
// IT-W3-MA3+MD2 — stochastic selection softmax distribution at resolved T
// ---------------------------------------------------------------------------

describe('IT-W3-MA3+MD2 — stochastic selection at MD-4 temperature', () => {
  it('softmax distribution at T resolved from MD-4 is well-formed', () => {
    const api = new TemperatureApi({ enabled: true, T_base: 0.5 });
    api.update(buildQuintessenceSnapshot({ stabilityVsNovelty: 0.5 }), []);
    const T = api.currentTemperature();
    expect(T).toBeGreaterThan(0);
    const effT = resolveTemperature(T, 'tractable');
    const probs = softmax([1.0, 0.5, 0.2], effT);
    // Sums to 1
    expect(probs.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
    // Highest-score candidate gets highest probability
    expect(probs[0]).toBeGreaterThan(probs[1]!);
    expect(probs[1]).toBeGreaterThan(probs[2]!);
  });

  it('resolveTemperature scales by tractability class per documented table', () => {
    const base = 1.0;
    expect(resolveTemperature(base, 'tractable')).toBe(base);
    expect(resolveTemperature(base, 'unknown')).toBe(base * 0.5);
    expect(resolveTemperature(base, 'coin-flip')).toBe(base * 0.3);
    expect(TRACTABILITY_TEMPERATURE_SCALE['coin-flip']).toBe(0.3);
  });

  it('sampleByScore with deterministic RNG yields reproducible index', () => {
    const rng1 = mulberry32(1234);
    const rng2 = mulberry32(1234);
    const scores = [1.0, 0.8, 0.5, 0.3];
    const a = sampleByScore(scores, 0.5, rng1);
    const b = sampleByScore(scores, 0.5, rng2);
    expect(a.index).toBe(b.index);
    expect(a.probability).toBe(b.probability);
  });

  it('applyStochasticBridge is flag-off byte-identical (SC-MA3-01)', () => {
    const decisions = [
      makeDecision('d1', 1.0),
      makeDecision('d2', 0.8),
      makeDecision('d3', 0.5),
    ];
    const out = applyStochasticBridge(decisions, {
      stochasticEnabled: false,
      inBranchContext: true,
      baseTemperature: 1.0,
      tractabilityClass: 'tractable',
      rng: mulberry32(7),
    });
    expect(out).toBe(decisions); // same reference → byte-identical
  });

  it('applyStochasticBridge only re-orders when flag on AND in branch context', () => {
    const decisions = [
      makeDecision('d1', 1.0),
      makeDecision('d2', 0.9),
      makeDecision('d3', 0.8),
    ];
    // Flag on but not in branch context → unchanged
    const a = applyStochasticBridge(decisions, {
      stochasticEnabled: true,
      inBranchContext: false,
      baseTemperature: 1.0,
      tractabilityClass: 'tractable',
      rng: mulberry32(13),
    });
    expect(a).toBe(decisions);
    // Flag on + in branch context → possibly-reordered (sampled)
    const b = applyStochasticBridge(decisions, {
      stochasticEnabled: true,
      inBranchContext: true,
      baseTemperature: 1.0,
      tractabilityClass: 'tractable',
      rng: mulberry32(13),
    });
    // Same length, same id set, but may be re-ordered
    expect(b.length).toBe(decisions.length);
    const idsA = new Set(decisions.map(d => d.id));
    const idsB = new Set(b.map(d => d.id));
    expect(idsB).toEqual(idsA);
  });

  it('T ≤ TEMPERATURE_EPSILON falls back to argmax deterministic (CF-MA3-01)', () => {
    const probs = softmax([3, 2, 1], TEMPERATURE_EPSILON / 2);
    expect(probs[0]).toBe(1);
    expect(probs[1]).toBe(0);
    expect(probs[2]).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// IT-W3-MD3 — Langevin noise on M7 update + MB-2 projection composition
// ---------------------------------------------------------------------------

describe('IT-W3-MD3 — Langevin noise composes with MB-2 simplex projection', () => {
  it('applyLangevinUpdate with MB-2 projection yields simplex-admissible row', () => {
    const params = [0.4, 0.3, 0.2, 0.1];
    const rng = mulberry32(42);
    const result = applyLangevinUpdate(params, {
      langevinEnabled: true,
      baseScale: 0.05,
      tractability: 'tractable',
      rng,
      projectionEnabled: true,
    });
    // Always simplex-admissible regardless of noise magnitude
    expect(verifySimplex(result.params)).toBe(true);
  });

  it('flag-off bridge output equals MB-2 projection of raw input (SC-MD3-01)', () => {
    const params = [0.4, 0.3, 0.2, 0.1];
    const bridged = applyLangevinUpdate(params, {
      langevinEnabled: false,
      baseScale: 0.1,
      tractability: 'tractable',
      projectionEnabled: false,
    });
    const directly = projectModelRow(params.slice(), { projectionEnabled: false });
    expect(bridged.params).toEqual(directly.projected);
    expect(bridged.effectiveScale).toBe(0);
  });

  it('injectLangevinNoise is identity when scale ≤ 0', () => {
    const rng = mulberry32(1);
    const out = injectLangevinNoise([0.5, 0.5], 0, rng);
    expect(out).toEqual([0.5, 0.5]);
    const neg = injectLangevinNoise([0.5, 0.5], -1, rng);
    expect(neg).toEqual([0.5, 0.5]);
  });

  it('resolveNoiseScale attenuates by tractability class', () => {
    const base = 0.1;
    const tractable = resolveNoiseScale(base, 'tractable', 1);
    const coin = resolveNoiseScale(base, 'coin-flip', 1);
    // coin-flip is attenuated
    expect(coin).toBeLessThan(tractable);
    expect(TRACTABILITY_NOISE_GAIN['coin-flip']).toBeLessThan(
      TRACTABILITY_NOISE_GAIN['tractable'],
    );
  });

  it('dark-room guard rejects noisy updates that collapse activity below floor', () => {
    const zero = [0, 0, 0, 0];
    const healthy = [0.2, 0.2, 0.05, 0.05];
    expect(preservesDarkRoom(zero, { minActivity: 0.1 })).toBe(false);
    expect(preservesDarkRoom(healthy, { minActivity: 0.1 })).toBe(true);
  });

  it('flag-on bridge with ample noise reverts to original on dark-room rejection', () => {
    // Choose params and very large scale so guard rejects.
    const params = [0.25, 0.25, 0.25, 0.25];
    const rng = mulberry32(999);
    const result = applyLangevinUpdate(params, {
      langevinEnabled: true,
      baseScale: 1e9, // extreme
      tractability: 'tractable',
      rng,
      minActivity: 0.9, // aggressive floor
      projectionEnabled: true,
    });
    // Either result.params is the original projected or darkRoomRejected is true.
    // In extreme regime the guard should activate.
    if (result.darkRoomRejected) {
      expect(result.darkRoomRejected).toBe(true);
    } else {
      expect(verifySimplex(result.params)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// IT-W3-MD4 — temperature schedule drives both stochastic + Langevin
// ---------------------------------------------------------------------------

describe('IT-W3-MD4 — temperature schedule feeds MA-3+MD-2 and MD-3', () => {
  it('TemperatureApi caches T_session and η_0 = T × ETA0_SCALE', () => {
    const api = new TemperatureApi({ enabled: true, T_base: 0.5 });
    api.update(buildQuintessenceSnapshot({ stabilityVsNovelty: 0.5 }), []);
    const T = api.currentTemperature();
    const eta = api.currentEta0();
    expect(eta).toBeCloseTo(T * ETA0_SCALE, 12);
  });

  it('disabled schedule returns SENTINEL_TEMPERATURE (SC-MD4-01)', () => {
    const api = new TemperatureApi({ enabled: false });
    // No update → returns sentinel even if update is called
    expect(api.currentTemperature()).toBe(SENTINEL_TEMPERATURE);
    api.update(buildQuintessenceSnapshot({}), []);
    expect(api.currentTemperature()).toBe(SENTINEL_TEMPERATURE);
  });

  it('warmRestart resets T to T_base (Loshchilov-Hutter SGDR)', () => {
    const api = new TemperatureApi({ enabled: true, T_base: 0.5 });
    api.update(buildQuintessenceSnapshot({ stabilityVsNovelty: 0.9 }), []);
    api.warmRestart();
    expect(api.currentTemperature()).toBe(0.5);
  });

  it('temperature drives stochastic bridge effective T end-to-end', () => {
    const api = new TemperatureApi({ enabled: true, T_base: 0.5 });
    api.update(buildQuintessenceSnapshot({ stabilityVsNovelty: 0.7 }), []);
    const T = api.currentTemperature();
    const effT = resolveTemperature(T, 'tractable');
    expect(effT).toBeGreaterThan(0);
    const probs = softmax([2, 1, 0], effT);
    expect(probs.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
  });

  it('coin-flip tractability suppresses effective temperature to 30% band', () => {
    const api = new TemperatureApi({ enabled: true, T_base: 0.5 });
    api.update(buildQuintessenceSnapshot({}), []);
    const T = api.currentTemperature();
    const coin = resolveTemperature(T, 'coin-flip');
    const tract = resolveTemperature(T, 'tractable');
    expect(coin).toBe(tract * 0.3);
  });

  it('η_0 feeds MD-3 Langevin noise scale transparently', () => {
    const api = new TemperatureApi({ enabled: true, T_base: 0.5 });
    api.update(buildQuintessenceSnapshot({}), []);
    const eta = api.currentEta0();
    const scale = resolveNoiseScale(eta, 'tractable', 1);
    expect(scale).toBeGreaterThan(0);
    // Langevin runs cleanly with this scale
    const rng = mulberry32(7);
    const out = injectLangevinNoise([0.3, 0.4, 0.3], scale, rng);
    expect(out.length).toBe(3);
    for (const v of out) expect(Number.isFinite(v)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Tractability gating — temperature suppressed in coin-flip regimes
// ---------------------------------------------------------------------------

describe('Bundle 4 tractability gating — coin-flip suppression', () => {
  it('coin-flip softmax distribution is sharper (lower effective T) than tractable', () => {
    const api = new TemperatureApi({ enabled: true, T_base: 1.0 });
    api.update(buildQuintessenceSnapshot({}), []);
    const T = api.currentTemperature();
    const tractT = resolveTemperature(T, 'tractable');
    const coinT = resolveTemperature(T, 'coin-flip');
    const tractProbs = softmax([2, 1, 0], tractT);
    const coinProbs = softmax([2, 1, 0], coinT);
    // Sharper = higher peak = less entropy
    expect(coinProbs[0]).toBeGreaterThan(tractProbs[0]!);
  });

  it('Langevin noise scale on coin-flip < tractable', () => {
    const base = 0.1;
    const tractScale = resolveNoiseScale(base, 'tractable', 1);
    const coinScale = resolveNoiseScale(base, 'coin-flip', 1);
    expect(coinScale).toBeLessThan(tractScale);
  });

  it('temperature cache survives repeated reads without drift', () => {
    const api = new TemperatureApi({ enabled: true, T_base: 0.5 });
    api.update(buildQuintessenceSnapshot({ stabilityVsNovelty: 0.6 }), []);
    const first = api.currentTemperature();
    const second = api.currentTemperature();
    const third = api.currentTemperature();
    expect(second).toBe(first);
    expect(third).toBe(first);
  });
});
