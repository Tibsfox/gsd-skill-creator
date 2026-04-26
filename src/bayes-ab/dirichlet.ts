/**
 * v1.49.580 W1 — Dirichlet conjugate update + sampler.
 *
 * Multivariate analog of `src/bayes-ab/conjugate.ts` (which handles the
 * 1-D Beta-Bernoulli case). The conjugate family:
 *
 *   prior:      θ ~ Dirichlet(α_1, ..., α_K)
 *   likelihood: y_i | θ ~ Categorical(θ)        (one-hot of length K)
 *   posterior:  θ | y ~ Dirichlet(α_1 + n_1, ..., α_K + n_K)
 *
 * where n_k is the count of observations in category k.
 *
 * The 1-D case (K=2) is exactly Beta-Bernoulli: Dirichlet([α, β]) updated
 * with counts [s, f] gives Dirichlet([α + s, β + f]) ↔ Beta(α + s, β + f).
 *
 * Sampling: Dirichlet draws are constructed as K independent Gamma(α_k, 1)
 * draws normalised by their sum (the standard Dirichlet construction).
 * Reuses `sampleGamma` from `src/bayes-ab/ipm-boed.ts`.
 *
 * @module bayes-ab/dirichlet
 */

import type { SeedableRng } from './types.js';
import type { DirichletPrior, MultinomialOutcome } from './mv-types.js';
import { sampleGamma } from './ipm-boed.js';

/**
 * Closed-form Dirichlet conjugate update.
 * Throws on length mismatch or invalid prior / counts.
 */
export function posteriorDirichlet(prior: DirichletPrior, outcome: MultinomialOutcome): DirichletPrior {
  if (prior.alphas.length !== outcome.counts.length) {
    throw new RangeError(
      `posteriorDirichlet: dimension mismatch — alphas.length=${prior.alphas.length}, counts.length=${outcome.counts.length}`,
    );
  }
  for (let i = 0; i < prior.alphas.length; i++) {
    if (!(prior.alphas[i] > 0)) {
      throw new RangeError(`posteriorDirichlet: alphas[${i}] must be > 0 (got ${prior.alphas[i]})`);
    }
    if (!(outcome.counts[i] >= 0) || !Number.isFinite(outcome.counts[i])) {
      throw new RangeError(`posteriorDirichlet: counts[${i}] must be a finite non-negative number (got ${outcome.counts[i]})`);
    }
  }
  return {
    alphas: prior.alphas.map((a, i) => a + outcome.counts[i]),
  };
}

/** Mean of Dirichlet(α_1, ..., α_K): [α_k / Σα] for k = 1..K. */
export function dirichletMean(p: DirichletPrior): number[] {
  const sum = p.alphas.reduce((a, b) => a + b, 0);
  if (sum <= 0) {
    throw new RangeError(`dirichletMean: sum of alphas must be > 0 (got ${sum})`);
  }
  return p.alphas.map(a => a / sum);
}

/** One sample from Dirichlet(α): K independent Gamma(α_k, 1) draws normalised. */
export function sampleDirichlet(p: DirichletPrior, rng: SeedableRng): number[] {
  if (p.alphas.length === 0) {
    throw new RangeError('sampleDirichlet: alphas must be non-empty');
  }
  const gammas = p.alphas.map(a => sampleGamma(a, rng));
  const sum = gammas.reduce((a, b) => a + b, 0);
  if (!(sum > 0)) {
    // Should never happen with valid α > 0, but defensive — Gamma(0,1) is degenerate.
    throw new RangeError(`sampleDirichlet: degenerate sum=${sum} from gamma draws`);
  }
  return gammas.map(g => g / sum);
}

/**
 * Tally a stream of category indices (0..K-1) into per-category counts.
 * Throws on out-of-range indices (negative, ≥ K, or non-integer).
 */
export function summariseMultinomial(samples: number[], K: number): MultinomialOutcome {
  if (!Number.isInteger(K) || K < 1) {
    throw new RangeError(`summariseMultinomial: K must be a positive integer (got ${K})`);
  }
  const counts = new Array<number>(K).fill(0);
  for (const x of samples) {
    if (!Number.isInteger(x) || x < 0 || x >= K) {
      throw new RangeError(`summariseMultinomial: category index out of range [0, ${K}) (got ${x})`);
    }
    counts[x] += 1;
  }
  return { counts };
}
