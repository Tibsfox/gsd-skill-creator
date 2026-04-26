/**
 * v1.49.580 W5 — multivariate end-to-end integration test.
 *
 * Plants true_θ = [0.6, 0.3, 0.1] against a uniform Dirichlet([1,1,1]) prior;
 * runs the full runBayesABMv loop with the JP-002 anytime-valid stop;
 * asserts the gate fires and the posterior mean is close to the planted truth.
 */

import { describe, it, expect } from 'vitest';
import { runBayesABMv } from '../coordinator-mv.js';
import { mulberry32 } from '../ipm-boed.js';
import { dirichletMean } from '../dirichlet.js';
import type { MvExperimentDesign } from '../index.js';

interface SizedDesign {
  n: number;
}

const TRUE_THETA: number[] = [0.6, 0.3, 0.1];
const PRIOR: { alphas: number[] } = { alphas: [1, 1, 1] };
const DESIGNS: MvExperimentDesign<SizedDesign>[] = [
  { label: 'small', payload: { n: 5 } },
  { label: 'large', payload: { n: 20 } },
];

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

function plantedRunner(seedBase: number) {
  let call = 0;
  const cum = TRUE_THETA.reduce<number[]>((acc, p) => {
    acc.push((acc[acc.length - 1] ?? 0) + p);
    return acc;
  }, []);
  return async (d: MvExperimentDesign<SizedDesign>, _round: number): Promise<number[]> => {
    call++;
    const rng = mulberry32(seedBase + call * 7919);
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

describe('runBayesABMv — end-to-end integration', () => {
  it('plant true_θ=[0.6,0.3,0.1], prior Dirichlet([1,1,1]), maxRounds=150 → anytime stop + close posterior', async () => {
    // Note on budget: the L1 posterior-shift metric for this fixture
    // converges to roughly 2/3 · (|0.6 - 1/3| + |0.3 - 1/3| + |0.1 - 1/3|)
    // ≈ 0.36 once the posterior has settled. At JP-002 default λ=0.5,
    // per-round log-e-value ≈ 0.5·0.36 − 0.125 ≈ 0.05; need ~80 effective
    // rounds to clear the α=0.05 threshold of 1/α=20. The early rounds
    // contribute less while the posterior is still wide, so 150 rounds is
    // a conservative-but-realistic budget.
    const result = await runBayesABMv({
      prior: PRIOR,
      designs: DESIGNS,
      mvModelSamples: categoricalModel,
      runSkill: plantedRunner(31),
      anytimeStop: { alpha: 0.05, hypothesis: 'one-sided' },
      maxRounds: 150,
      draws: { theta: 8, post: 16, prior: 16 },
      projections: 16,
      rng: mulberry32(7),
    });

    expect(result.exitReason).toBe('anytime');
    expect(result.history.length).toBeLessThan(150);
    expect(result.history.length).toBeGreaterThanOrEqual(1);

    // Posterior mean within L∞ 0.10 of the planted truth.
    const posteriorMean = dirichletMean(result.posterior);
    for (let k = 0; k < TRUE_THETA.length; k++) {
      expect(Math.abs(posteriorMean[k] - TRUE_THETA[k])).toBeLessThan(0.10);
    }

    // Meaningful evidence accumulated: posterior precision (sum of α) > 30
    // (compared to prior precision = 3).
    const posteriorPrecision = result.posterior.alphas.reduce((a, b) => a + b, 0);
    expect(posteriorPrecision).toBeGreaterThan(30);
  }, 30_000);

  it('history records every round in order with monotone-growing precision', async () => {
    const result = await runBayesABMv({
      prior: PRIOR,
      designs: DESIGNS,
      mvModelSamples: categoricalModel,
      runSkill: plantedRunner(99),
      anytimeStop: { alpha: 0.05, hypothesis: 'one-sided' },
      maxRounds: 150,
      draws: { theta: 8, post: 16, prior: 16 },
      projections: 16,
      rng: mulberry32(13),
    });

    // Round indices are 1-based and contiguous.
    for (let i = 0; i < result.history.length; i++) {
      expect(result.history[i].round).toBe(i + 1);
    }

    // Posterior precision must grow monotonically.
    for (let i = 1; i < result.history.length; i++) {
      const prev = result.history[i - 1].posterior.alphas.reduce((a, b) => a + b, 0);
      const cur = result.history[i].posterior.alphas.reduce((a, b) => a + b, 0);
      expect(cur).toBeGreaterThanOrEqual(prev);
    }

    // Each round's design label is one of the configured labels.
    const validLabels = new Set(DESIGNS.map(d => d.label));
    for (const r of result.history) {
      expect(validLabels.has(r.designLabel)).toBe(true);
    }
  }, 30_000);
});
