/**
 * v1.49.579 W5 — end-to-end integration test for runBayesAB.
 *
 * Runs the full Bayesian sequential A/B harness loop with a planted
 * effect (true_θ = 0.75) against a uniform Beta(1, 1) prior. Asserts that:
 *   - the JP-002 anytime-valid e-process fires within the budget
 *   - the final posterior mean is close to the planted truth
 *   - meaningful evidence accumulated (posterior precision ≫ prior)
 */

import { describe, it, expect } from 'vitest';
import { runBayesAB } from '../coordinator.js';
import { mulberry32 } from '../ipm-boed.js';
import { betaMean } from '../conjugate.js';
import type { ExperimentDesign } from '../index.js';

interface SizedDesign {
  n: number;
}

const TRUE_THETA = 0.75;
const PRIOR = { alpha: 1, beta: 1 } as const;       // uniform
const DESIGNS: ExperimentDesign<SizedDesign>[] = [
  { label: 'small', payload: { n: 5 } },
  { label: 'large', payload: { n: 20 } },
];

function bernoulliModel(d: ExperimentDesign<SizedDesign>, theta: number): number[] {
  const rng = mulberry32(Math.floor(theta * 1e6) + d.payload.n);
  return Array.from({ length: d.payload.n }, () => (rng.next() < theta ? 1 : 0));
}

/** Real experiment runner: planted true_θ, independent of model belief. */
function plantedRunner(seedBase: number) {
  let call = 0;
  return async (d: ExperimentDesign<SizedDesign>, _round: number): Promise<number[]> => {
    call++;
    const rng = mulberry32(seedBase + call * 7919);
    return Array.from({ length: d.payload.n }, () => (rng.next() < TRUE_THETA ? 1 : 0));
  };
}

describe('runBayesAB — end-to-end integration', () => {
  it('plant true_θ=0.75, prior Beta(1,1), maxRounds=80 → anytime stop + close posterior', async () => {
    const result = await runBayesAB({
      prior: PRIOR,
      designs: DESIGNS,
      modelSamples: bernoulliModel,
      runSkill: plantedRunner(31),
      anytimeStop: { alpha: 0.05, hypothesis: 'one-sided' },
      maxRounds: 80,
      draws: { theta: 8, post: 16, prior: 16 },
      rng: mulberry32(7),
    });

    expect(result.exitReason).toBe('anytime');
    // Loop terminated before exhausting the budget.
    expect(result.history.length).toBeLessThan(80);
    expect(result.history.length).toBeGreaterThanOrEqual(1);

    // Posterior mean within 10pp of the planted truth.
    const posteriorMean = betaMean(result.posterior);
    expect(Math.abs(posteriorMean - TRUE_THETA)).toBeLessThan(0.10);

    // Meaningful evidence accumulated: posterior precision (α + β) > 30
    // (compared to prior precision = 2).
    expect(result.posterior.alpha + result.posterior.beta).toBeGreaterThan(30);
  }, 30_000);

  it('history records every round in order with monotone-growing precision', async () => {
    const result = await runBayesAB({
      prior: PRIOR,
      designs: DESIGNS,
      modelSamples: bernoulliModel,
      runSkill: plantedRunner(99),
      anytimeStop: { alpha: 0.05, hypothesis: 'one-sided' },
      maxRounds: 80,
      draws: { theta: 8, post: 16, prior: 16 },
      rng: mulberry32(13),
    });

    // Round indices are 1-based and contiguous.
    for (let i = 0; i < result.history.length; i++) {
      expect(result.history[i].round).toBe(i + 1);
    }

    // Posterior precision must grow monotonically (each conjugate update
    // adds non-negative successes + failures).
    for (let i = 1; i < result.history.length; i++) {
      const prev = result.history[i - 1].posterior;
      const cur = result.history[i].posterior;
      expect(cur.alpha + cur.beta).toBeGreaterThanOrEqual(prev.alpha + prev.beta);
    }

    // Each round's design label is one of the configured labels.
    const validLabels = new Set(DESIGNS.map(d => d.label));
    for (const r of result.history) {
      expect(validLabels.has(r.designLabel)).toBe(true);
    }
  }, 30_000);
});
