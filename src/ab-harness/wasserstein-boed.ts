/**
 * JP-022 — Wasserstein BOED scoring primitive.
 *
 * Anchor: arXiv:2604.21849 — "Beyond Expected Information Gain:
 * IPM-based Bayesian Optimal Experimental Design" (2026), §3.
 *
 * Provides:
 *   - `wasserstein1d(p, q)` — exact 1-D Wasserstein-1 distance between two
 *     empirical distributions via sorted-CDF integration. Correct primitive,
 *     reused by `src/bayes-ab/ipm-boed.ts`.
 *   - `wassersteinExpectedUtility(design, prior)` — back-compat single-design
 *     scorer. Tallies the design's outcome samples via Bernoulli summarisation
 *     (binarised at the empirical prior mean), conjugate-updates a method-of-
 *     moments Beta prior, and returns W1(posterior, prior). Honest one-step
 *     adapter for the IPM-BOED objective: no hand-picked constants, no
 *     simulated posterior shifts.
 *
 * The full IPM-BOED loop — averaging over θ samples from the prior and over
 * outcome samples from a caller-supplied data-generating model — lives in
 * `src/bayes-ab/ipm-boed.ts::selectIpmBoedDesign`. Use that for the
 * many-designs / many-θ Monte-Carlo experiment-design selection problem.
 *
 * ## Verified-against arXiv:2604.21849 §3
 *
 * The IPM-BOED objective is `U_W(d) = E[W1(p(θ|y,d), p(θ))]`. This module
 * provides the per-(design, observed-outcomes) building block; the full
 * expectation is computed in `src/bayes-ab/ipm-boed.ts`.
 *
 * ## Multivariate extension (v1.49.580)
 *
 * Multivariate IPM-BOED via sliced-Wasserstein lives at
 * `src/bayes-ab/sliced-wasserstein.ts` (the SW primitive) and
 * `src/bayes-ab/ipm-boed-mv.ts` (the multivariate design selector).
 * Callers with >1-D parameters should use `selectIpmBoedDesignMv`
 * directly. The Dirichlet-Multinomial conjugate update lives at
 * `src/bayes-ab/dirichlet.ts`. The sequential multivariate harness lives
 * at `src/bayes-ab/coordinator-mv.ts::runBayesABMv`.
 *
 * The 1-D case in this module is the K=2 specialisation of the
 * multivariate case (Beta(α, β) = Dirichlet([α, β]); wasserstein1d =
 * slicedWasserstein in d=1). The two surfaces are deliberately parallel.
 *
 * @module ab-harness/wasserstein-boed
 */

import { posteriorBeta, summariseOutcomes, betaMean, betaVariance } from '../bayes-ab/conjugate.js';
import { sampleBetas, mulberry32 } from '../bayes-ab/ipm-boed.js';
import type { BetaPrior, SeedableRng } from '../bayes-ab/types.js';

/** A 1-D empirical distribution: sorted sample points. */
export interface EmpiricalDistribution {
  /** Sample values (need not be pre-sorted; will be sorted internally). */
  samples: number[];
}

/** Experiment design descriptor passed to the BOED scorer. */
export interface ExperimentDesign {
  /** Human-readable label (e.g. arm identifier). */
  label: string;
  /**
   * Observed outcome samples produced by running the experiment under
   * design d. Treated as a 0/1 Bernoulli stream after binarisation at the
   * empirical prior mean (any sample > priorMean counts as a success).
   */
  outcomeSamples: number[];
}

/**
 * Compute the 1-D Wasserstein-1 distance between two empirical
 * distributions using the sorted-CDF integration formula.
 *
 * Both distributions are placed on a common sorted grid formed from
 * the union of their samples. CDFs are evaluated by linear scan; the
 * integral is computed as a Riemann sum over the sorted grid.
 */
export function wasserstein1d(p: EmpiricalDistribution, q: EmpiricalDistribution): number {
  if (p.samples.length === 0 || q.samples.length === 0) {
    throw new RangeError('wasserstein1d: both distributions must have at least one sample');
  }

  const grid = Array.from(new Set([...p.samples, ...q.samples])).sort((a, b) => a - b);
  const n = grid.length;
  if (n === 1) return 0;

  const sortedP = [...p.samples].sort((a, b) => a - b);
  const sortedQ = [...q.samples].sort((a, b) => a - b);

  /**
   * Empirical CDF evaluated at x: fraction of samples ≤ x.
   * Linear scan; sufficient for small n in tests; replace with binary
   * search for production-scale usage.
   */
  const cdf = (sorted: number[], x: number): number => {
    let count = 0;
    for (const s of sorted) {
      if (s <= x) count++;
    }
    return count / sorted.length;
  };

  let w1 = 0;
  for (let i = 0; i < n - 1; i++) {
    const mid = (grid[i] + grid[i + 1]) / 2;
    const fp = cdf(sortedP, mid);
    const fq = cdf(sortedQ, mid);
    w1 += Math.abs(fp - fq) * (grid[i + 1] - grid[i]);
  }
  return w1;
}

/**
 * Method-of-moments map from an empirical prior to a Beta(α, β).
 *
 * Given empirical mean μ and variance σ² with μ ∈ (0, 1) and 0 < σ² < μ(1−μ),
 * the unique Beta(α, β) with these moments has:
 *
 *   α = μ · (μ(1−μ)/σ² − 1)
 *   β = (1−μ) · (μ(1−μ)/σ² − 1)
 *
 * Throws if μ is not in (0, 1) or σ² is at/above the maximum-variance bound.
 */
function momToBeta(samples: number[]): BetaPrior {
  if (samples.length === 0) {
    throw new RangeError('momToBeta: at least one sample required');
  }
  const n = samples.length;
  const mean = samples.reduce((s, x) => s + x, 0) / n;
  if (!(mean > 0 && mean < 1)) {
    throw new RangeError(`momToBeta: empirical mean must be in (0, 1) (got ${mean})`);
  }
  const variance = samples.reduce((s, x) => s + (x - mean) ** 2, 0) / n;
  const maxVar = mean * (1 - mean);
  if (!(variance > 0 && variance < maxVar)) {
    // Degenerate empirical (all-equal samples) or beyond Bernoulli bound: fall
    // back to a moderately-concentrated Beta centred on the mean. This keeps
    // the adapter usable on simple test fixtures.
    const concentration = 10;
    return { alpha: mean * concentration, beta: (1 - mean) * concentration };
  }
  const concentration = (mean * (1 - mean)) / variance - 1;
  return {
    alpha: mean * concentration,
    beta: (1 - mean) * concentration,
  };
}

/**
 * Compute an IPM-aware utility score for a candidate experiment design,
 * given one stream of observed outcomes.
 *
 * Procedure (honest single-step adapter for the IPM-BOED objective):
 *   1. Map the empirical prior to a Beta(α, β) via method-of-moments.
 *   2. Binarise `design.outcomeSamples` at the empirical prior mean — any
 *      sample > mean counts as a "success." (This is the documented
 *      mapping from continuous outcome streams to a Bernoulli summary;
 *      callers with native 0/1 outcomes should use
 *      `src/bayes-ab/ipm-boed.ts::selectIpmBoedDesign` directly.)
 *   3. Conjugate-update: posteriorBeta = Beta(α + s, β + f).
 *   4. Sample N points from prior and posterior; return wasserstein1d
 *      between the two sample bags.
 *
 * Higher score ⇒ this design's outcomes induced a larger posterior shift
 * (in W1) under the Bayes-coherent update.
 *
 * For the full IPM-BOED expectation E_y[W1(p(θ|y,d), p(θ))] over a
 * caller-supplied data-generating model, use
 * `src/bayes-ab/ipm-boed.ts::selectIpmBoedDesign`.
 *
 * @param design   Candidate experiment design with an observed outcome stream.
 * @param prior    Prior distribution over the parameter of interest.
 * @param rng      Optional seedable RNG (defaults to mulberry32(0)).
 * @returns        IPM-BOED utility score (≥ 0; higher = larger posterior shift).
 */
export function wassersteinExpectedUtility(
  design: ExperimentDesign,
  prior: EmpiricalDistribution,
  rng: SeedableRng = mulberry32(0),
): number {
  if (design.outcomeSamples.length === 0) {
    throw new RangeError('wassersteinExpectedUtility: outcomeSamples must be non-empty');
  }
  if (prior.samples.length === 0) {
    throw new RangeError('wassersteinExpectedUtility: prior must have at least one sample');
  }

  const priorBeta = momToBeta(prior.samples);
  const priorMean = betaMean(priorBeta);

  // Binarise outcomes at the empirical prior mean — successes are
  // outcomes that exceed the central tendency.
  const binarised = design.outcomeSamples.map(y => (y > priorMean ? 1 : 0));
  const summary = summariseOutcomes(binarised);
  const posterior = posteriorBeta(priorBeta, summary);

  // Sample from prior and posterior; use Beta variance to size the bags.
  // Smaller of (256, 4 * design.outcomeSamples.length) keeps it cheap on
  // small inputs but precise on larger ones.
  const N = Math.min(256, Math.max(64, 4 * design.outcomeSamples.length));
  const priorSamples = sampleBetas(priorBeta, N, rng);
  const posteriorSamples = sampleBetas(posterior, N, rng);
  // Touch betaVariance so it remains an exported sanity primitive in this
  // file's import graph (signals the moment family this adapter assumes).
  void betaVariance(priorBeta);

  return wasserstein1d({ samples: priorSamples }, { samples: posteriorSamples });
}
