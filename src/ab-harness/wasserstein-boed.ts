/**
 * JP-022 — Wasserstein BOED skill scoring primitive.
 *
 * Anchor: arXiv:2604.21849 — "Beyond Expected Information Gain:
 * IPM-based Bayesian Optimal Experimental Design" (2026).
 *
 * Instead of maximising Expected Information Gain (KL-divergence
 * between posterior and prior), we maximise an IPM-based utility that
 * measures the Wasserstein-1 distance between the predictive
 * distributions induced by a design under the prior and under the
 * (hypothetical) posterior.  This is more robust to prior
 * misspecification because W1 — unlike KL — does not blow up when the
 * two distributions have mismatched support.
 *
 * Implementation notes
 * --------------------
 * • 1-D Wasserstein-1 is computed exactly via sorted-CDF integration:
 *     W1(P, Q) = ∫ |F_P(x) − F_Q(x)| dx
 *   which, for empirical distributions over the same sorted grid, reduces
 *   to the mean absolute difference of the two CDFs.
 * • The BOED utility for a design d is:
 *     U_W(d) = E_{y~p(y|d)} [ W1(p(θ|y,d), p(θ)) ]
 *   approximated by Monte-Carlo over outcome samples.
 * • Only univariate distributions (1-D parameter θ) are handled here; a
 *   multivariate extension (sliced-Wasserstein) is left for a successor
 *   phase.
 */

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
   * Monte-Carlo draws from p(y | d, θ) collapsed over the prior on θ.
   * Each element is one outcome sample used to update a toy posterior.
   */
  outcomeSamples: number[];
}

/**
 * Compute the 1-D Wasserstein-1 distance between two empirical
 * distributions using the sorted-CDF integration formula.
 *
 * Both distributions are placed on a common sorted grid formed from
 * the union of their samples.  CDFs are evaluated by linear
 * interpolation; the integral is computed as a Riemann sum over the
 * sorted grid.
 */
export function wasserstein1d(p: EmpiricalDistribution, q: EmpiricalDistribution): number {
  if (p.samples.length === 0 || q.samples.length === 0) {
    throw new RangeError('wasserstein1d: both distributions must have at least one sample');
  }

  // Build a sorted union grid.
  const grid = Array.from(new Set([...p.samples, ...q.samples])).sort((a, b) => a - b);
  const n = grid.length;
  if (n === 1) return 0;

  const sortedP = [...p.samples].sort((a, b) => a - b);
  const sortedQ = [...q.samples].sort((a, b) => a - b);

  /**
   * Empirical CDF evaluated at x: fraction of samples ≤ x.
   * Uses a simple linear scan (sufficient for small n in tests; replace
   * with binary search for production-scale usage).
   */
  const cdf = (sorted: number[], x: number): number => {
    let count = 0;
    for (const s of sorted) {
      if (s <= x) count++;
    }
    return count / sorted.length;
  };

  // W1 = ∫ |F_P − F_Q| dx ≈ Σ |F_P(x_i) − F_Q(x_i)| * (x_{i+1} − x_i)
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
 * Compute the Wasserstein-BOED utility for a candidate experiment design.
 *
 * Algorithm (IPM-BOED, §3.1 of arXiv:2604.21849):
 *   1. For each outcome sample y_k in design.outcomeSamples, form a toy
 *      posterior p(θ | y_k) as a shift of the prior by the observation.
 *      (Here: robust bounded-update model — posterior mean shifts toward y_k
 *      by a step capped at MAX_SHIFT * prior_std to avoid runaway updates
 *      from out-of-distribution observations.  Variance shrinks by factor 0.8.)
 *   2. Compute W1 between that posterior and the prior.
 *   3. Return the mean W1 over all outcome samples as the BOED score.
 *
 * The capped shift is the key distinction from naive EIG: an extreme outlier
 * (y far outside the prior support) does NOT produce a proportionally large
 * W1 score because the posterior update is bounded.  Coherent in-distribution
 * observations that shift the whole prior mass uniformly score higher than
 * isolated outliers — which is the IPM-BOED property from arXiv:2604.21849.
 *
 * A higher score means the design is expected to produce larger
 * distributional movement — i.e. more informative experiments — under the
 * Wasserstein geometry.
 *
 * @param design   Candidate experiment design with outcome samples.
 * @param prior    Prior distribution over the parameter of interest.
 * @returns        BOED utility score (≥ 0; higher = more informative).
 */
export function wassersteinExpectedUtility(
  design: ExperimentDesign,
  prior: EmpiricalDistribution
): number {
  if (design.outcomeSamples.length === 0) {
    throw new RangeError('wassersteinExpectedUtility: outcomeSamples must be non-empty');
  }
  if (prior.samples.length === 0) {
    throw new RangeError('wassersteinExpectedUtility: prior must have at least one sample');
  }

  // Toy posterior update parameters (robust bounded-update model).
  const VAR_SHRINK = 0.8;
  // Maximum shift of the posterior mean, expressed as a fraction of the
  // prior's standard deviation.  This bounds the Wasserstein movement
  // produced by outliers (out-of-distribution observations get clipped).
  const MAX_SHIFT_STDS = 1.5;

  const n = prior.samples.length;
  const priorMean = prior.samples.reduce((s, x) => s + x, 0) / n;
  const priorVar = prior.samples.reduce((s, x) => s + (x - priorMean) ** 2, 0) / n;
  const priorStd = Math.sqrt(priorVar) || 1;

  let totalW1 = 0;
  for (const y of design.outcomeSamples) {
    // Raw shift: difference between observation and prior mean.
    const rawShift = y - priorMean;
    // Clamp to ±MAX_SHIFT_STDS * priorStd (robust against outliers).
    const clampedShift = Math.max(
      -MAX_SHIFT_STDS * priorStd,
      Math.min(MAX_SHIFT_STDS * priorStd, rawShift)
    );
    const posteriorMean = priorMean + clampedShift;

    // Shift each prior sample by the same clamped displacement, then
    // contract toward the posterior mean to simulate variance shrinkage.
    const posteriorSamples = prior.samples.map((theta) => {
      const shifted = theta + clampedShift;
      return posteriorMean + VAR_SHRINK * (shifted - posteriorMean);
    });
    totalW1 += wasserstein1d(prior, { samples: posteriorSamples });
  }
  return totalW1 / design.outcomeSamples.length;
}
