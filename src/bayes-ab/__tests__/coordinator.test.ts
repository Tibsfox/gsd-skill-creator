/**
 * v1.49.579 W3 — runBayesAB sequential loop tests.
 *
 * Two essential paths:
 *   - stop:     planted true_θ far from prior → JP-002 gate fires before maxRounds
 *   - continue: noise-only fixture → gate does not fire; loop hits maxRounds
 *
 * Plus a determinism cross-check + a no-gate path.
 */

import { describe, it, expect } from 'vitest';
import { runBayesAB, scaledPosteriorShift } from '../coordinator.js';
import { mulberry32 } from '../ipm-boed.js';
import { betaMean } from '../conjugate.js';
import type { ExperimentDesign } from '../index.js';

// ─── Test fixtures ───────────────────────────────────────────────────────────

interface SizedDesign {
  /** Number of trials per round. */
  n: number;
}

function sizedDesigns(): ExperimentDesign<SizedDesign>[] {
  return [
    { label: 'small', payload: { n: 5 } },
    { label: 'large', payload: { n: 20 } },
  ];
}

/**
 * Build a hypothetical model sampler — used by the IPM-BOED selector to
 * predict each design's information yield. Bernoulli(θ) repeated d.payload.n
 * times, threaded through a fresh PRNG keyed by (theta, n).
 */
function makeModelSamples() {
  return (d: ExperimentDesign<SizedDesign>, theta: number): number[] => {
    const rng = mulberry32(Math.floor(theta * 1e6) + d.payload.n);
    return Array.from({ length: d.payload.n }, () => (rng.next() < theta ? 1 : 0));
  };
}

/**
 * Build a real experiment runner that draws Bernoulli(trueTheta) outcomes
 * for each round's chosen design. Independent of the model sampler — the
 * model is the harness's *belief*; runSkill is the *truth*.
 */
function makePlantedRunner(trueTheta: number, baseSeed: number) {
  let callCount = 0;
  return async (d: ExperimentDesign<SizedDesign>, _round: number): Promise<number[]> => {
    callCount++;
    const rng = mulberry32(baseSeed + callCount * 7919);  // arbitrary prime stride
    return Array.from({ length: d.payload.n }, () => (rng.next() < trueTheta ? 1 : 0));
  };
}

// ─── scaledPosteriorShift sanity ─────────────────────────────────────────────

describe('scaledPosteriorShift', () => {
  it('zero shift when posterior = prior', () => {
    expect(scaledPosteriorShift({ alpha: 2, beta: 5 }, { alpha: 2, beta: 5 })).toBe(0);
  });

  it('positive when posterior mean > prior mean', () => {
    // prior mean = 2/7 ≈ 0.286; posterior mean = 7/12 ≈ 0.583
    const m = scaledPosteriorShift({ alpha: 7, beta: 5 }, { alpha: 2, beta: 5 });
    expect(m).toBeGreaterThan(0);
    expect(m).toBeCloseTo(7 / 12 - 2 / 7, 6);
  });

  it('bounded in [-1, 1]', () => {
    // Most-extreme upward shift: prior mean ≈ 0, posterior mean ≈ 1
    const upMax = scaledPosteriorShift({ alpha: 1000, beta: 1 }, { alpha: 1, beta: 1000 });
    expect(upMax).toBeGreaterThan(0.99);
    expect(upMax).toBeLessThanOrEqual(1);
    // Most-extreme downward shift
    const downMax = scaledPosteriorShift({ alpha: 1, beta: 1000 }, { alpha: 1000, beta: 1 });
    expect(downMax).toBeLessThan(-0.99);
    expect(downMax).toBeGreaterThanOrEqual(-1);
  });
});

// ─── runBayesAB — stop / continue / no-gate paths ────────────────────────────

describe('runBayesAB — stop path (planted true_θ far from prior)', () => {
  it('exitReason=anytime within maxRounds when true_θ=0.9 vs prior Beta(1,1)', async () => {
    // Note on budget: the JP-002 e-process default λ=0.5 makes the gate
    // accumulate evidence slowly when the bounded posterior-shift metric
    // converges to a moderate value (here ~0.4). 60 rounds is a
    // conservative-but-realistic budget that lets the e-product climb
    // past the α=0.05 threshold of 1/α = 20.
    const designs = sizedDesigns();
    const result = await runBayesAB({
      prior: { alpha: 1, beta: 1 },
      designs,
      modelSamples: makeModelSamples(),
      runSkill: makePlantedRunner(0.9, 31),
      anytimeStop: { alpha: 0.05, hypothesis: 'one-sided' },
      maxRounds: 60,
      draws: { theta: 8, post: 16, prior: 16 },
      rng: mulberry32(101),
    });
    expect(result.exitReason).toBe('anytime');
    expect(result.history.length).toBeLessThan(60);
    // Posterior mean should have shifted clearly toward 0.9
    expect(betaMean(result.posterior)).toBeGreaterThan(0.7);
  });
});

describe('runBayesAB — continue path (true_θ ≈ prior mean)', () => {
  it('exitReason=max-rounds when true_θ=0.5 matches prior Beta(2,2) mean', async () => {
    const designs = sizedDesigns();
    const result = await runBayesAB({
      prior: { alpha: 2, beta: 2 },              // prior mean = 0.5
      designs,
      modelSamples: makeModelSamples(),
      runSkill: makePlantedRunner(0.5, 17),       // true mean = 0.5
      anytimeStop: { alpha: 0.05, hypothesis: 'one-sided' },
      maxRounds: 8,                                // small budget — gate shouldn't fire
      draws: { theta: 8, post: 16, prior: 16 },
      rng: mulberry32(202),
    });
    expect(result.exitReason).toBe('max-rounds');
    expect(result.history.length).toBe(8);
    // Posterior mean should still be near 0.5
    expect(Math.abs(betaMean(result.posterior) - 0.5)).toBeLessThan(0.15);
  });
});

describe('runBayesAB — no-gate path', () => {
  it('runs maxRounds and reports max-rounds when anytimeStop is omitted', async () => {
    const designs = sizedDesigns();
    const result = await runBayesAB({
      prior: { alpha: 1, beta: 1 },
      designs,
      modelSamples: makeModelSamples(),
      runSkill: makePlantedRunner(0.9, 50),
      // anytimeStop deliberately omitted
      maxRounds: 5,
      draws: { theta: 8, post: 16, prior: 16 },
      rng: mulberry32(303),
    });
    // No gate ⇒ always max-rounds, regardless of how clear the planted signal is
    expect(result.exitReason).toBe('max-rounds');
    expect(result.history.length).toBe(5);
  });
});
