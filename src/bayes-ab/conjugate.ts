/**
 * v1.49.579 W1 — Beta-Bernoulli conjugate update.
 *
 * Closed-form Bayesian update for the conjugate family
 *   prior:      θ ~ Beta(α, β)
 *   likelihood: y_i | θ ~ Bernoulli(θ)
 *   posterior:  θ | y_{1..N} ~ Beta(α + s, β + f)   where s + f = N
 *
 * No Monte-Carlo here — the update is exact integer arithmetic on the
 * Beta shape parameters. Monte-Carlo lives in `ipm-boed.ts` (W2) at the
 * outer BOED loop only.
 *
 * Reference moments:
 *   mean(Beta(α, β)) = α / (α + β)
 *   var(Beta(α, β))  = αβ / ((α + β)² (α + β + 1))
 *
 * @module bayes-ab/conjugate
 */

import type { BetaPrior, BernoulliOutcome } from './types.js';

/**
 * Closed-form conjugate update.
 * Throws if the resulting α or β would be non-positive (defensive — should
 * never happen with valid inputs, but the invariant is load-bearing for the
 * Monte-Carlo posterior sampler in W2).
 */
export function posteriorBeta(prior: BetaPrior, outcome: BernoulliOutcome): BetaPrior {
  if (prior.alpha <= 0 || prior.beta <= 0) {
    throw new RangeError(
      `posteriorBeta: prior must have α, β > 0 (got α=${prior.alpha}, β=${prior.beta})`,
    );
  }
  if (outcome.successes < 0 || outcome.failures < 0) {
    throw new RangeError(
      `posteriorBeta: outcome counts must be ≥ 0 (got s=${outcome.successes}, f=${outcome.failures})`,
    );
  }
  return {
    alpha: prior.alpha + outcome.successes,
    beta: prior.beta + outcome.failures,
  };
}

/** Mean of Beta(α, β): α / (α + β). */
export function betaMean(b: BetaPrior): number {
  return b.alpha / (b.alpha + b.beta);
}

/** Variance of Beta(α, β): αβ / ((α + β)² (α + β + 1)). */
export function betaVariance(b: BetaPrior): number {
  const s = b.alpha + b.beta;
  return (b.alpha * b.beta) / (s * s * (s + 1));
}

/**
 * Tally a 0/1 stream into a {successes, failures} record. Treats any
 * non-zero finite numeric value as "success" (so callers can pass either
 * boolean-as-0/1 or weighted-but-binarised samples).
 */
export function summariseOutcomes(samples: number[]): BernoulliOutcome {
  let successes = 0;
  let failures = 0;
  for (const x of samples) {
    if (!Number.isFinite(x)) {
      throw new RangeError(`summariseOutcomes: non-finite value ${x}`);
    }
    if (x !== 0) successes++;
    else failures++;
  }
  return { successes, failures };
}
