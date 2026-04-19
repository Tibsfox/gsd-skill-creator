/**
 * MB-1 — Adaptation-law tests: correctness, monotonicity, tractability gain.
 */

import { describe, it, expect } from 'vitest';
import {
  adaptKH,
  buildRegressor,
  resolveTractabilityGain,
  TRACTABILITY_GAIN_TABLE,
  DEFAULT_GAIN_G,
  DEFAULT_GAIN_GAMMA,
  DEFAULT_RECENCY_TAU_MS,
} from '../k_h-adaptation.js';

describe('resolveTractabilityGain — documented scaling table', () => {
  it('tractable → 1.0 (default confidence)', () => {
    expect(resolveTractabilityGain('tractable')).toBe(1.0);
  });
  it('coin-flip → 0.3 regardless of confidence', () => {
    expect(resolveTractabilityGain('coin-flip')).toBe(0.3);
    expect(resolveTractabilityGain('coin-flip', 1.0)).toBe(0.3);
    expect(resolveTractabilityGain('coin-flip', 0.0)).toBe(0.3);
  });
  it('unknown → 0.6 regardless of confidence', () => {
    expect(resolveTractabilityGain('unknown')).toBe(0.6);
    expect(resolveTractabilityGain('unknown', 0.1)).toBe(0.6);
  });
  it('tractable with low confidence falls to floor, not below', () => {
    // confidence 0.1 on tractable → max(0.3, 0.1) = 0.3
    expect(resolveTractabilityGain('tractable', 0.1)).toBe(0.3);
    // confidence 0.5 → max(0.3, 0.5) = 0.5
    expect(resolveTractabilityGain('tractable', 0.5)).toBe(0.5);
    // confidence 0.9 → 0.9
    expect(resolveTractabilityGain('tractable', 0.9)).toBeCloseTo(0.9, 12);
  });
  it('non-finite confidence defaults to 1.0 on tractable', () => {
    expect(resolveTractabilityGain('tractable', NaN)).toBe(1.0);
  });
  it('table values match the documented gain scaling', () => {
    expect(TRACTABILITY_GAIN_TABLE.tractable).toBe(1.0);
    expect(TRACTABILITY_GAIN_TABLE.unknown).toBe(0.6);
    expect(TRACTABILITY_GAIN_TABLE['coin-flip']).toBe(0.3);
  });
});

describe('buildRegressor — [doseMagnitude, recencyExponential]', () => {
  it('age = 0 → recency = 1 (just-activated skill)', () => {
    const w = buildRegressor({ doseMagnitude: 1, ageMs: 0 });
    expect(w).toHaveLength(2);
    expect(w[0]).toBe(1);
    expect(w[1]).toBe(1);
  });
  it('age = τ → recency = 1/e', () => {
    const tau = 10_000;
    const w = buildRegressor({ doseMagnitude: 2, ageMs: tau, tauMs: tau });
    expect(w[0]).toBe(2);
    expect(w[1]).toBeCloseTo(1 / Math.E, 12);
  });
  it('dose is clamped to ≥ 0', () => {
    const w = buildRegressor({ doseMagnitude: -5, ageMs: 0 });
    expect(w[0]).toBe(0);
  });
  it('negative age clamps to 0', () => {
    const w = buildRegressor({ doseMagnitude: 1, ageMs: -100 });
    expect(w[1]).toBe(1);
  });
  it('invalid tau falls back to default', () => {
    const w = buildRegressor({ doseMagnitude: 1, ageMs: DEFAULT_RECENCY_TAU_MS, tauMs: 0 });
    // With fallback tau = DEFAULT, recency = 1/e.
    expect(w[1]).toBeCloseTo(1 / Math.E, 12);
  });
});

describe('adaptKH — update law K̇_H = −g·tractGain·(w·e)', () => {
  const baseOpts = {
    currentKH: 5,
    targetKH: 5,          // φ = 0
    observedRate: 1,
    teachingDeclaredRate: 0,  // e = 1
    regressor: [1, 0.5],
    tractabilityGain: 1.0,
    stepSize: 1.0,
    gainG: 0.1,
    gainGamma: 1.0,
    floor: 0.01,
    ceiling: 10,
  };

  it('positive error + positive regressor pushes K_H down', () => {
    const r = adaptKH(baseOpts);
    // K̇_H = −0.1·1·(1·1 + 0.5·1) = −0.15 ; stepSize=1 → newKH = 5 − 0.15 = 4.85
    expect(r.deltaKHRaw).toBeCloseTo(-0.15, 12);
    expect(r.newKH).toBeCloseTo(4.85, 12);
    expect(r.candidate.e).toBe(1);
    expect(r.candidate.phi).toBe(0);
    expect(r.effectiveGain).toBeCloseTo(0.1, 12);
  });

  it('negative error flips the K_H direction', () => {
    const r = adaptKH({ ...baseOpts, observedRate: 0, teachingDeclaredRate: 1 });
    // e = -1 → K̇_H = −0.1·1·(-1.5) = +0.15
    expect(r.deltaKHRaw).toBeCloseTo(0.15, 12);
    expect(r.newKH).toBeCloseTo(5.0 + 0.15, 12);
  });

  it('tractability gain scales update proportionally (documented table)', () => {
    const rT = adaptKH({ ...baseOpts, tractabilityGain: 1.0 });
    const rU = adaptKH({ ...baseOpts, tractabilityGain: 0.6 });
    const rC = adaptKH({ ...baseOpts, tractabilityGain: 0.3 });
    // Gain scales linearly.
    expect(Math.abs(rU.deltaKHRaw)).toBeCloseTo(Math.abs(rT.deltaKHRaw) * 0.6, 12);
    expect(Math.abs(rC.deltaKHRaw)).toBeCloseTo(Math.abs(rT.deltaKHRaw) * 0.3, 12);
    expect(rU.effectiveGain).toBeCloseTo(0.1 * 0.6, 12);
    expect(rC.effectiveGain).toBeCloseTo(0.1 * 0.3, 12);
  });

  it('zero tractability gain → zero update (edge case; floor below 0.3 honoured)', () => {
    const r = adaptKH({ ...baseOpts, tractabilityGain: 0 });
    expect(Math.abs(r.deltaKHRaw)).toBe(0);
    expect(r.newKH).toBe(baseOpts.currentKH);
  });

  it('non-finite tractability gain defaults to 0.3 floor', () => {
    const r = adaptKH({ ...baseOpts, tractabilityGain: NaN });
    // Should still produce an update at the 0.3 floor gain.
    expect(Math.abs(r.deltaKHRaw)).toBeGreaterThan(0);
    // Gain scaling: 0.3 × full = 0.3 × 0.15 = 0.045
    expect(Math.abs(r.deltaKHRaw)).toBeCloseTo(0.15 * 0.3, 12);
  });

  it('zero tracking error → zero update (descent to equilibrium)', () => {
    const r = adaptKH({
      ...baseOpts,
      observedRate: 1.0,
      teachingDeclaredRate: 1.0, // e = 0
    });
    expect(Math.abs(r.deltaKHRaw)).toBe(0); // tolerate ±0
    expect(r.newKH).toBe(baseOpts.currentKH);
  });

  it('applies floor clamp (never below K_L · floorRatio)', () => {
    const r = adaptKH({
      ...baseOpts,
      currentKH: 0.1,
      floor: 0.1, // pinned at floor
      observedRate: 100, teachingDeclaredRate: 0, // huge positive e
    });
    expect(r.newKH).toBe(0.1);
    // Raw delta is large negative.
    expect(r.deltaKHRaw).toBeLessThan(0);
  });

  it('applies ceiling clamp (never above targetKH when ceiling omitted)', () => {
    const r = adaptKH({
      ...baseOpts,
      currentKH: 4.99,
      observedRate: 0, teachingDeclaredRate: 100, // large negative e pushes up
      ceiling: undefined, // default to targetKH = 5
    });
    expect(r.newKH).toBe(5);
    expect(r.deltaKHRaw).toBeGreaterThan(0);
  });

  it('monotonicity: repeated application under persistent positive error decreases K_H', () => {
    let kH = 5;
    const trace: number[] = [kH];
    for (let i = 0; i < 50; i += 1) {
      const r = adaptKH({
        ...baseOpts,
        currentKH: kH,
        floor: 0.05,
      });
      kH = r.newKH;
      trace.push(kH);
    }
    // Should be strictly decreasing (monotone).
    for (let i = 1; i < trace.length; i += 1) {
      expect(trace[i]!).toBeLessThanOrEqual(trace[i - 1]!);
    }
    // Final state is strictly below starting state.
    expect(trace[trace.length - 1]!).toBeLessThan(trace[0]!);
  });

  it('uses default gains when omitted', () => {
    const r = adaptKH({
      currentKH: 5,
      targetKH: 5,
      observedRate: 1,
      teachingDeclaredRate: 0,
      regressor: [1],
      tractabilityGain: 1.0,
    });
    // K̇_H = −DEFAULT_GAIN_G·1·(1·1) = −0.01 ; stepSize defaults to 1
    expect(r.deltaKHRaw).toBeCloseTo(-DEFAULT_GAIN_G, 12);
    expect(r.effectiveGain).toBeCloseTo(DEFAULT_GAIN_G, 12);
  });

  it('zero stepSize → no update (pure diagnostic pass)', () => {
    const r = adaptKH({ ...baseOpts, stepSize: 0 });
    expect(Math.abs(r.deltaKHRaw)).toBe(0);
    expect(r.newKH).toBe(baseOpts.currentKH);
  });

  it('empty regressor → no update', () => {
    const r = adaptKH({ ...baseOpts, regressor: [] });
    expect(Math.abs(r.deltaKHRaw)).toBe(0);
    expect(r.newKH).toBe(baseOpts.currentKH);
  });

  it('candidate snapshot uses DEFAULT_GAIN_GAMMA when gainGamma omitted', () => {
    const r = adaptKH({
      currentKH: 6,
      targetKH: 5,        // φ = 1
      observedRate: 1,
      teachingDeclaredRate: 0,
      regressor: [1],
      tractabilityGain: 1.0,
    });
    // V = 0.5·1² + 0.5·DEFAULT·1² = 0.5 + 0.5 = 1
    expect(r.candidate.V).toBeCloseTo(0.5 + 0.5 * DEFAULT_GAIN_GAMMA, 12);
  });
});
