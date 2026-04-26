/**
 * v1.49.579 W2 — IPM-BOED design selector tests.
 *
 * Three concerns covered:
 *   1. determinism — same seed ⇒ same design pick
 *   2. ranking — high-information design beats low-information design
 *   3. corner case — single-design list returns that design
 *
 * Plus determinism + sanity checks on the Beta sampler itself (its mean
 * should track the closed-form Beta mean from W1 to within Monte-Carlo
 * tolerance over a few thousand draws).
 */

import { describe, it, expect } from 'vitest';
import {
  selectIpmBoedDesign,
  sampleBeta,
  sampleBetas,
  mulberry32,
} from '../ipm-boed.js';
import { betaMean } from '../conjugate.js';
import type { ExperimentDesign } from '../index.js';

// ─── Beta sampler sanity ─────────────────────────────────────────────────────

describe('sampleBeta — Monte-Carlo mean tracks closed-form mean', () => {
  it('Beta(2, 5): MC mean over 4000 draws within 0.02 of α/(α+β)=2/7', () => {
    const rng = mulberry32(42);
    const samples = sampleBetas({ alpha: 2, beta: 5 }, 4000, rng);
    const mcMean = samples.reduce((a, b) => a + b, 0) / samples.length;
    expect(Math.abs(mcMean - betaMean({ alpha: 2, beta: 5 }))).toBeLessThan(0.02);
  });

  it('Beta(10, 10): MC mean over 4000 draws within 0.02 of 0.5', () => {
    const rng = mulberry32(7);
    const samples = sampleBetas({ alpha: 10, beta: 10 }, 4000, rng);
    const mcMean = samples.reduce((a, b) => a + b, 0) / samples.length;
    expect(Math.abs(mcMean - 0.5)).toBeLessThan(0.02);
  });

  it('all Beta samples are in (0, 1)', () => {
    const rng = mulberry32(1);
    for (let i = 0; i < 200; i++) {
      const x = sampleBeta({ alpha: 2.5, beta: 7.5 }, rng);
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(1);
    }
  });

  it('mulberry32 is reproducible: same seed ⇒ same sequence', () => {
    const a = mulberry32(123);
    const b = mulberry32(123);
    for (let i = 0; i < 10; i++) {
      expect(a.next()).toBe(b.next());
    }
  });
});

// ─── selectIpmBoedDesign — the algorithm ─────────────────────────────────────

describe('selectIpmBoedDesign — determinism', () => {
  it('same seed ⇒ same design pick across two calls', () => {
    const designs: ExperimentDesign<number>[] = [
      { label: 'n=10', payload: 10 },
      { label: 'n=50', payload: 50 },
      { label: 'n=200', payload: 200 },
    ];
    const modelSamples = (d: ExperimentDesign<number>, theta: number): number[] => {
      // Bernoulli(θ) repeated d.payload times — but use a SEPARATE RNG so
      // the model RNG is independent of the BOED sampler RNG (mirroring the
      // contract: caller controls model randomness; harness controls
      // sampler randomness).
      const rng = mulberry32(Math.floor(theta * 1e6) + d.payload);
      return Array.from({ length: d.payload }, () => (rng.next() < theta ? 1 : 0));
    };
    const r1 = selectIpmBoedDesign({
      prior: { alpha: 2, beta: 2 },
      designs,
      modelSamples,
      draws: { theta: 8, post: 16, prior: 16 },
      rng: mulberry32(99),
    });
    const r2 = selectIpmBoedDesign({
      prior: { alpha: 2, beta: 2 },
      designs,
      modelSamples,
      draws: { theta: 8, post: 16, prior: 16 },
      rng: mulberry32(99),
    });
    expect(r1.design.label).toBe(r2.design.label);
    expect(r1.score).toBe(r2.score);
    expect(r1.perDesign).toEqual(r2.perDesign);
  });
});

describe('selectIpmBoedDesign — ranking', () => {
  it('prefers high-information design over low-information design', () => {
    // Two designs with stark information disparity:
    //   d_low:  outcomes are 50/50 regardless of θ (carries NO information)
    //   d_high: outcomes are concentrated around clamp(θ * 20) (high info)
    const designs: ExperimentDesign<'low' | 'high'>[] = [
      { label: 'low', payload: 'low' },
      { label: 'high', payload: 'high' },
    ];
    const modelSamples = (d: ExperimentDesign<'low' | 'high'>, theta: number): number[] => {
      const rng = mulberry32(Math.floor(theta * 1e6));
      if (d.payload === 'low') {
        // 50/50 regardless of θ — the design tells us nothing about θ
        return Array.from({ length: 20 }, () => (rng.next() < 0.5 ? 1 : 0));
      }
      // d_high: faithful Bernoulli(θ) — every trial is informative
      return Array.from({ length: 20 }, () => (rng.next() < theta ? 1 : 0));
    };

    let highWins = 0;
    const trials = 10;
    for (let seed = 0; seed < trials; seed++) {
      const r = selectIpmBoedDesign({
        prior: { alpha: 2, beta: 2 },
        designs,
        modelSamples,
        draws: { theta: 16, post: 32, prior: 32 },
        rng: mulberry32(seed),
      });
      if (r.design.label === 'high') highWins++;
    }
    // The signal is strong; expect ≥8/10 wins for the informative design
    expect(highWins).toBeGreaterThanOrEqual(8);
  });

  it('per-design scores reflect information content (high > low)', () => {
    const designs: ExperimentDesign<'low' | 'high'>[] = [
      { label: 'low', payload: 'low' },
      { label: 'high', payload: 'high' },
    ];
    const modelSamples = (d: ExperimentDesign<'low' | 'high'>, theta: number): number[] => {
      const rng = mulberry32(Math.floor(theta * 1e6));
      if (d.payload === 'low') {
        return Array.from({ length: 30 }, () => (rng.next() < 0.5 ? 1 : 0));
      }
      return Array.from({ length: 30 }, () => (rng.next() < theta ? 1 : 0));
    };
    const r = selectIpmBoedDesign({
      prior: { alpha: 2, beta: 2 },
      designs,
      modelSamples,
      draws: { theta: 24, post: 48, prior: 48 },
      rng: mulberry32(1234),
    });
    const lowScore = r.perDesign.find(p => p.label === 'low')!.score;
    const highScore = r.perDesign.find(p => p.label === 'high')!.score;
    expect(highScore).toBeGreaterThan(lowScore);
  });
});

describe('selectIpmBoedDesign — corner cases', () => {
  it('single-design list returns that design without consuming Monte-Carlo draws', () => {
    const onlyDesign: ExperimentDesign<number> = { label: 'only', payload: 42 };
    let modelCalls = 0;
    const modelSamples = (d: ExperimentDesign<number>, _theta: number): number[] => {
      modelCalls++;
      return [1, 0, 1];
    };
    const r = selectIpmBoedDesign({
      prior: { alpha: 1, beta: 1 },
      designs: [onlyDesign],
      modelSamples,
      rng: mulberry32(0),
    });
    expect(r.design).toBe(onlyDesign);
    expect(r.score).toBe(0);
    expect(r.perDesign).toEqual([{ label: 'only', score: 0 }]);
    expect(modelCalls).toBe(0);  // shortcut path — no model invocations
  });

  it('throws on empty design list', () => {
    expect(() => selectIpmBoedDesign({
      prior: { alpha: 1, beta: 1 },
      designs: [],
      modelSamples: () => [],
    })).toThrow(RangeError);
  });
});
