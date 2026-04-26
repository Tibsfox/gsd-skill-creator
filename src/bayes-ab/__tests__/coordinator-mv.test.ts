/**
 * v1.49.580 W4 — runBayesABMv sequential loop tests.
 *
 * Mirrors the v1.49.579 W3 coordinator tests:
 *   - mvScaledPosteriorShift sanity (zero / positive / clipped to 1)
 *   - stop path (planted true_θ far from prior → JP-002 gate fires)
 *   - continue path (true_θ matches prior mean → max-rounds)
 *   - no-gate path (anytimeStop omitted → always max-rounds)
 */

import { describe, it, expect } from 'vitest';
import { runBayesABMv, mvScaledPosteriorShift } from '../coordinator-mv.js';
import { dirichletMean } from '../dirichlet.js';
import { mulberry32 } from '../ipm-boed.js';
import type { MvExperimentDesign } from '../index.js';

// ─── Test fixtures ───────────────────────────────────────────────────────────

interface SizedDesign {
  n: number;
}

function sizedDesigns(): MvExperimentDesign<SizedDesign>[] {
  return [
    { label: 'small', payload: { n: 5 } },
    { label: 'large', payload: { n: 20 } },
  ];
}

/** Categorical(θ) model — d.payload.n trials. */
function categoricalModel(d: MvExperimentDesign<SizedDesign>, theta: number[]): number[] {
  const cum = theta.reduce<number[]>((acc, p) => {
    acc.push((acc[acc.length - 1] ?? 0) + p);
    return acc;
  }, []);
  const rng = mulberry32(Math.floor(theta.reduce((a, b) => a + b * 1e6, 0)) + d.payload.n);
  const out: number[] = [];
  for (let i = 0; i < d.payload.n; i++) {
    const u = rng.next();
    let k = 0;
    while (k < cum.length - 1 && u >= cum[k]) k++;
    out.push(k);
  }
  return out;
}

/** Real experiment runner: planted true_θ vector, independent of model belief. */
function plantedMvRunner(trueTheta: number[], baseSeed: number) {
  let call = 0;
  const cum = trueTheta.reduce<number[]>((acc, p) => {
    acc.push((acc[acc.length - 1] ?? 0) + p);
    return acc;
  }, []);
  return async (d: MvExperimentDesign<SizedDesign>, _round: number): Promise<number[]> => {
    call++;
    const rng = mulberry32(baseSeed + call * 7919);
    const out: number[] = [];
    for (let i = 0; i < d.payload.n; i++) {
      const u = rng.next();
      let k = 0;
      while (k < cum.length - 1 && u >= cum[k]) k++;
      out.push(k);
    }
    return out;
  };
}

// ─── mvScaledPosteriorShift sanity ───────────────────────────────────────────

describe('mvScaledPosteriorShift', () => {
  it('zero shift when posterior = prior', () => {
    expect(mvScaledPosteriorShift({ alphas: [1, 1, 1] }, { alphas: [1, 1, 1] })).toBe(0);
  });

  it('positive when posterior mean differs from prior mean', () => {
    const m = mvScaledPosteriorShift({ alphas: [10, 1, 1] }, { alphas: [1, 1, 1] });
    expect(m).toBeGreaterThan(0);
  });

  it('clipped to 1 in extreme cases (opposite-corner posterior and prior in K=3)', () => {
    // Posterior concentrated on first category (mean ≈ [1, 0, 0]) vs prior
    // concentrated on third category (mean ≈ [0, 0, 1]). L1 = 2; raw = 2/3 * 2
    // ≈ 1.333; clipped to 1.
    const m = mvScaledPosteriorShift(
      { alphas: [1000, 0.001, 0.001] },
      { alphas: [0.001, 0.001, 1000] },
    );
    expect(m).toBe(1);
  });

  it('correct unclipped value for moderate displacement (uniform-vs-concentrated in K=3)', () => {
    // Posterior [1000, 0.001, 0.001] (mean ≈ [1, 0, 0]) vs uniform prior
    // (mean = [1/3, 1/3, 1/3]). L1 ≈ 2/3 + 1/3 + 1/3 = 4/3; raw = 2/3 * 4/3
    // ≈ 0.889; uncliped because raw < 1.
    const m = mvScaledPosteriorShift({ alphas: [1000, 0.001, 0.001] }, { alphas: [1, 1, 1] });
    expect(m).toBeCloseTo(8 / 9, 3);  // 4/3 * 2/3 = 8/9
    expect(m).toBeLessThan(1);
  });

  it('throws on dimension mismatch', () => {
    expect(() => mvScaledPosteriorShift({ alphas: [1, 1] }, { alphas: [1, 1, 1] })).toThrow(RangeError);
  });
});

// ─── runBayesABMv — stop / continue / no-gate paths ──────────────────────────

describe('runBayesABMv — stop path (planted true_θ far from prior)', () => {
  it('exitReason=anytime within maxRounds when true_θ=[0.7,0.2,0.1] vs prior Dirichlet([1,1,1])', async () => {
    // Note on budget: the JP-002 e-process default λ=0.5 with the L1 metric
    // and the 2/K scaling accumulates evidence at a rate proportional to the
    // L1 distance. With K=3 and a 0.7-vs-0.333 first-coordinate gap, raw is
    // approximately 2/3 * (|0.7-0.33| + |0.2-0.33| + |0.1-0.33|) ≈ 0.49,
    // putting the e-product slightly above the breakeven threshold. 80
    // rounds is conservative-but-realistic.
    const designs = sizedDesigns();
    const result = await runBayesABMv({
      prior: { alphas: [1, 1, 1] },
      designs,
      mvModelSamples: categoricalModel,
      runSkill: plantedMvRunner([0.7, 0.2, 0.1], 31),
      anytimeStop: { alpha: 0.05, hypothesis: 'one-sided' },
      maxRounds: 80,
      draws: { theta: 8, post: 16, prior: 16 },
      projections: 16,
      rng: mulberry32(101),
    });
    expect(result.exitReason).toBe('anytime');
    expect(result.history.length).toBeLessThan(80);
    // First coordinate of posterior mean should have shifted clearly toward 0.7
    expect(dirichletMean(result.posterior)[0]).toBeGreaterThan(0.55);
  }, 30_000);
});

describe('runBayesABMv — continue path (true_θ ≈ prior mean)', () => {
  it('exitReason=max-rounds when true_θ=[1/3,1/3,1/3] matches Dirichlet([2,2,2]) mean', async () => {
    const designs = sizedDesigns();
    const result = await runBayesABMv({
      prior: { alphas: [2, 2, 2] },                  // prior mean = [1/3, 1/3, 1/3]
      designs,
      mvModelSamples: categoricalModel,
      runSkill: plantedMvRunner([1 / 3, 1 / 3, 1 / 3], 17),  // true mean matches
      anytimeStop: { alpha: 0.05, hypothesis: 'one-sided' },
      maxRounds: 8,                                   // small budget — gate shouldn't fire
      draws: { theta: 8, post: 16, prior: 16 },
      projections: 16,
      rng: mulberry32(202),
    });
    expect(result.exitReason).toBe('max-rounds');
    expect(result.history.length).toBe(8);
    // Posterior mean still close to uniform.
    const m = dirichletMean(result.posterior);
    for (const v of m) expect(Math.abs(v - 1 / 3)).toBeLessThan(0.20);
  });
});

describe('runBayesABMv — no-gate path', () => {
  it('runs maxRounds and reports max-rounds when anytimeStop is omitted', async () => {
    const designs = sizedDesigns();
    const result = await runBayesABMv({
      prior: { alphas: [1, 1, 1] },
      designs,
      mvModelSamples: categoricalModel,
      runSkill: plantedMvRunner([0.9, 0.05, 0.05], 50),
      // anytimeStop deliberately omitted
      maxRounds: 5,
      draws: { theta: 8, post: 16, prior: 16 },
      projections: 16,
      rng: mulberry32(303),
    });
    expect(result.exitReason).toBe('max-rounds');
    expect(result.history.length).toBe(5);
  });
});
