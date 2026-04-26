/**
 * JP-022 — Wasserstein BOED scoring primitive (illustrative IPM-aware
 * heuristic; see Limitations below).
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
 * • The BOED utility for a design d is conceptually:
 *     U_W(d) = E_{y~p(y|d)} [ W1(p(θ|y,d), p(θ)) ]
 *   approximated by Monte-Carlo over outcome samples.
 * • Only univariate distributions (1-D parameter θ) are handled here; a
 *   multivariate extension (sliced-Wasserstein) is left for a successor
 *   phase.
 *
 * ## Limitations
 *
 * This module ships an **illustrative IPM-aware heuristic**, not a faithful
 * implementation of the IPM-BOED algorithm in arXiv:2604.21849. Specifically:
 *
 * - The "posterior" used inside `wassersteinExpectedUtility` is a
 *   hand-constructed bounded-update simulation: prior samples are shifted
 *   toward each observation by an amount clamped at `MAX_SHIFT_STDS = 1.5`
 *   prior standard deviations, then contracted toward the posterior mean by
 *   `VAR_SHRINK = 0.8`. These constants are NOT from the paper; they are
 *   chosen to produce IPM-BOED-like ranking behaviour on bounded-support
 *   priors.
 * - A faithful IPM-BOED implementation requires (a) an actual data-generating
 *   model `p(y | d, θ)` from which to sample outcomes, and (b) a real Bayesian
 *   posterior `p(θ | y, d)` (or a simulator thereof). Both are application-
 *   specific and out of scope for this primitive.
 * - The provided ranking-reversal test passes on fixtures designed to
 *   exhibit IPM-BOED's qualitative property (clipped sensitivity to outliers
 *   versus naive EIG); the heuristic reproduces that qualitative property,
 *   not the paper's quantitative algorithm.
 *
 * Use this module as a citation-anchor implementation that exposes the
 * Wasserstein-1 primitive (`wasserstein1d`) for downstream consumers; replace
 * `wassersteinExpectedUtility` with a model-aware implementation when a
 * concrete `p(y | d, θ)` is available.
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
 * Compute an IPM-aware utility score for a candidate experiment design.
 *
 * **NOTE: this is the illustrative heuristic described in the module's
 * Limitations section — not the IPM-BOED algorithm of arXiv:2604.21849.**
 *
 * Procedure (heuristic posterior simulation):
 *   1. For each outcome sample y_k in design.outcomeSamples, simulate a
 *      "posterior" by shifting every prior sample toward y_k. The shift is
 *      clamped at MAX_SHIFT_STDS (= 1.5) prior standard deviations and
 *      shrunk toward the posterior mean by VAR_SHRINK (= 0.8). Both
 *      constants are chosen to mimic the qualitative robustness property
 *      of IPM-BOED on bounded-support priors.
 *   2. Compute W1 between that simulated posterior and the prior.
 *   3. Return the mean W1 over all outcome samples as the heuristic score.
 *
 * The clamped shift is what produces the IPM-BOED-like qualitative
 * behaviour: an extreme outlier (y far outside the prior support) does
 * NOT produce a proportionally large W1 score because the simulated
 * posterior update is bounded. This is the qualitative property the
 * faithful IPM-BOED algorithm exhibits, but the quantitative computation
 * here is a heuristic, not Bayes.
 *
 * A higher score means the design is expected to produce larger
 * (clamped) distributional movement under the Wasserstein geometry.
 *
 * @param design   Candidate experiment design with outcome samples.
 * @param prior    Prior distribution over the parameter of interest.
 * @returns        Heuristic utility score (≥ 0; higher = more informative
 *                 under the simulated posterior model).
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
