/**
 * MA-2 ACE — td-error.test.ts
 *
 * CF-MA2-01: TD error correctness on a hand-computed 20-step fixture.
 * Weight scaling per tractability class (LS-29).
 *
 * @module ace/__tests__/td-error.test
 */

import { describe, it, expect } from 'vitest';
import {
  computeTDError,
  averageReinforcementAcrossChannels,
  readingsFromMap,
  type ChannelReading,
} from '../td-error.js';
import { DEFAULT_GAMMA, TRACTABILITY_WEIGHT_FLOOR } from '../settings.js';

// Small helper to keep tests readable.
const mk = (
  channel: ChannelReading['channel'],
  eligibility: number,
  reinforcement: number,
): ChannelReading => ({ channel, eligibility, reinforcement });

describe('computeTDError — core identity', () => {
  it('δ = 0 when r̄ = 0 and ΔF_prev = γ·ΔF_curr (stationarity)', () => {
    // r=0 everywhere, deltaFPrev = 0.95 * deltaFCurr.
    const readings = readingsFromMap({});
    const negFCurr = 1.0;
    const negFPrev = DEFAULT_GAMMA * negFCurr;
    const r = computeTDError(readings, negFPrev, negFCurr, {
      tractabilityClass: 'tractable',
    });
    expect(r.rawDelta).toBeCloseTo(0, 12);
    expect(r.delta).toBeCloseTo(0, 12);
  });

  it('γ = 0 reduces to raw r̄ − ΔF_prev', () => {
    const readings = [
      mk('explicit_correction', 0.5, -1.0),
      mk('outcome_observed', 0.5, 1.0),
    ];
    // r̄ with equal |e| weights = (0.5·-1 + 0.5·1)/(0.5+0.5) = 0
    const r = computeTDError(readings, 0.7, 0.3, {
      gamma: 0,
      tractabilityClass: 'tractable',
    });
    expect(r.components.gamma).toBe(0);
    expect(r.rawDelta).toBeCloseTo(0 - 0.7, 12);
  });

  it('CF-MA2-01: hand-computed 20-step fixture matches expected δ trajectory', () => {
    // Fixture: linear negF ramp, r=0 everywhere, γ=0.95. Expected δ_t per
    // step equals (γ·negF_t − negF_{t-1}). Hand-compute, then compare.
    const gamma = 0.95;
    const steps: Array<{ negFPrev: number; negFCurr: number; expectedRaw: number }> = [];
    let prev = 0;
    for (let t = 1; t <= 20; t++) {
      const curr = t * 0.1; // 0.1, 0.2, ..., 2.0
      steps.push({
        negFPrev: prev,
        negFCurr: curr,
        expectedRaw: 0 + gamma * curr - prev,
      });
      prev = curr;
    }
    for (const s of steps) {
      const result = computeTDError([], s.negFPrev, s.negFCurr, {
        gamma,
        tractabilityClass: 'tractable',
      });
      expect(result.rawDelta).toBeCloseTo(s.expectedRaw, 12);
    }
  });

  it('r̄ is eligibility-weighted: direction preserved, magnitude averaged', () => {
    // Two channels, same eligibility magnitude, opposite-signed reinforcement.
    // r̄ = (0.5·1 + 0.5·-1)/(0.5+0.5) = 0
    const mean = averageReinforcementAcrossChannels([
      mk('explicit_correction', 0.5, 1),
      mk('outcome_observed', 0.5, -1),
    ]);
    expect(mean).toBeCloseTo(0, 12);

    // Weighted heavily on negative → r̄ < 0
    const negMean = averageReinforcementAcrossChannels([
      mk('explicit_correction', 0.8, -1),
      mk('outcome_observed', 0.2, 1),
    ]);
    expect(negMean).toBeLessThan(0);
  });

  it('r̄ falls back to arithmetic mean when no eligibility is live', () => {
    const mean = averageReinforcementAcrossChannels([
      mk('explicit_correction', 0, 1),
      mk('outcome_observed', 0, 1),
    ]);
    expect(mean).toBeCloseTo(1, 12);
  });
});

describe('computeTDError — tractability weighting (LS-29)', () => {
  it('tractable class with confidence 1.0 → weight = 1.0', () => {
    const r = computeTDError([], 0, 1, {
      tractabilityClass: 'tractable',
      tractabilityConfidence: 1.0,
    });
    expect(r.weight).toBe(1.0);
    expect(r.delta).toBeCloseTo(r.rawDelta, 12);
  });

  it('coin-flip class → weight = TRACTABILITY_WEIGHT_FLOOR (0.3)', () => {
    const r = computeTDError([], 0, 1, {
      tractabilityClass: 'coin-flip',
    });
    expect(r.weight).toBe(TRACTABILITY_WEIGHT_FLOOR);
    expect(r.delta).toBeCloseTo(TRACTABILITY_WEIGHT_FLOOR * r.rawDelta, 12);
  });

  it('unknown class → weight = TRACTABILITY_WEIGHT_FLOOR (0.3) (not zero: no eternal-silence bug)', () => {
    const r = computeTDError([], 0, 1, {
      tractabilityClass: 'unknown',
    });
    expect(r.weight).toBe(TRACTABILITY_WEIGHT_FLOOR);
    // Non-zero output preserves directional info in noisy regimes.
    expect(r.delta).not.toBe(0);
  });

  it('tractable class with low confidence still honours floor (no silencing)', () => {
    const r = computeTDError([], 0, 1, {
      tractabilityClass: 'tractable',
      tractabilityConfidence: 0.1,
    });
    // max(floor=0.3, 0.1) = 0.3
    expect(r.weight).toBe(0.3);
  });

  it('explicit tractabilityWeight override bypasses class mapping and clamps to floor', () => {
    const high = computeTDError([], 0, 1, { tractabilityWeight: 2.0 });
    expect(high.weight).toBe(1.0); // clamped to ≤ 1
    const low = computeTDError([], 0, 1, { tractabilityWeight: 0.05 });
    expect(low.weight).toBe(0.3); // clamped up to floor
  });

  it('tractable/coin-flip/unknown weight ratio is 1.0 : 0.3 : 0.3 for identical inputs (CF-MA2-04)', () => {
    const readings = [mk('explicit_correction', 0.5, -1)];
    const tract = computeTDError(readings, 0, 1, { tractabilityClass: 'tractable' });
    const coin = computeTDError(readings, 0, 1, { tractabilityClass: 'coin-flip' });
    const unk = computeTDError(readings, 0, 1, { tractabilityClass: 'unknown' });
    // raw is identical
    expect(tract.rawDelta).toBe(coin.rawDelta);
    expect(tract.rawDelta).toBe(unk.rawDelta);
    expect(tract.delta / coin.delta).toBeCloseTo(1.0 / 0.3, 8);
    expect(tract.delta / unk.delta).toBeCloseTo(1.0 / 0.3, 8);
  });
});
