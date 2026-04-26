/**
 * JP-037 — Wasserstein-robust prior for routing decisions.
 *
 * Anchor: arXiv:2604.21580 — "Wasserstein Distributionally Robust
 * Optimization" (2026).
 *
 * When the orchestration layer suspects distribution shift (e.g. the
 * incoming task distribution has drifted from the skill-author's
 * training distribution), a nominal prior over routing candidates can
 * be insufficiently conservative.  This module constructs a
 * Wasserstein-ball ambiguity set around a nominal prior and returns the
 * worst-case (least-favourable) distribution within that ball as the
 * robust prior.
 *
 * Wasserstein-ball ambiguity set
 * --------------------------------
 * Given nominal distribution P₀ with n support points {x_i, w_i}, the
 * Wasserstein-ε ball is:
 *   B_ε(P₀) = { Q : W_p(Q, P₀) ≤ ε }
 *
 * Worst-case distribution (least-favourable)
 * -------------------------------------------
 * For routing decisions we want the prior that maximises posterior
 * regret — i.e. the distribution that makes the routing decision look
 * as uncertain as possible.  A tractable approximation: perturb each
 * support point x_i by at most ε in a direction that maximises
 * uncertainty (flattens the weight profile), subject to the constraint
 * that the total Wasserstein displacement ≤ ε (1-Wasserstein, p=1).
 *
 * Implemented approach (DRO dual, 1-D, §4.1 of arXiv:2604.21580):
 *   1. Normalise nominal weights.
 *   2. Compute the "entropy deficit" of each atom: atoms with high
 *      weight are candidates for weight reallocation.
 *   3. Redistribute weight toward lower-weight atoms proportional to
 *      their ground distance to the high-weight atoms, up to budget ε.
 *   4. Renormalise.
 *
 * The resulting distribution integrates to 1 and approximates the
 * worst-case element of the Wasserstein ball.
 *
 * Usage note: for the orchestration selector, support points are
 * candidate skill scores; weights are the nominal prior probabilities.
 */

/** A discrete probability distribution over routing candidates. */
export interface DiscretePrior {
  /**
   * Support points (e.g. skill scores or candidate identifiers mapped
   * to numeric values).
   */
  support: number[];
  /** Probability weights (need not be normalised; will be normalised internally). */
  weights: number[];
}

/** Options for the robustification procedure. */
export interface RobustifyOptions {
  /**
   * Wasserstein-1 radius of the ambiguity ball.  Larger values allow
   * more distributional perturbation and yield a more conservative
   * (flatter) robust prior.
   */
  ambiguityRadius: number;
  /**
   * Ground-metric exponent for the Wasserstein distance.
   * Only p=1 is implemented; p=2 reserved for a successor phase.
   * @default 1
   */
  p?: 1;
}

/**
 * Construct the worst-case (least-favourable) prior within the
 * Wasserstein-ε ball around the nominal prior.
 *
 * @param nominal         Nominal prior distribution.
 * @param ambiguityRadius Wasserstein-1 ball radius ε ≥ 0.
 * @returns               Robust prior — same support, perturbed weights,
 *                        guaranteed to integrate to 1.
 */
export function robustifyPrior(
  nominal: DiscretePrior,
  ambiguityRadius: number
): DiscretePrior {
  const { support, weights } = nominal;

  if (support.length === 0) {
    throw new RangeError('robustifyPrior: support must be non-empty');
  }
  if (support.length !== weights.length) {
    throw new RangeError('robustifyPrior: support and weights must have the same length');
  }
  if (ambiguityRadius < 0) {
    throw new RangeError('robustifyPrior: ambiguityRadius must be ≥ 0');
  }

  // Step 1 — normalise weights.
  const totalWeight = weights.reduce((s, w) => s + w, 0);
  if (totalWeight <= 0) {
    throw new RangeError('robustifyPrior: weights must sum to a positive value');
  }
  const normW = weights.map((w) => w / totalWeight);

  if (ambiguityRadius === 0) {
    // No perturbation: return a copy of the normalised nominal prior.
    return { support: [...support], weights: normW };
  }

  const n = support.length;

  // Step 2 — compute "flatness target": uniform distribution.
  const uniform = normW.map(() => 1 / n);

  // Step 3 — compute Wasserstein displacement required to move each atom
  // toward the uniform weight.  Ground distance = |x_i - x_j| (W1).
  // We use a simplified dual formulation: linearly interpolate between the
  // nominal weights and the uniform weights, with the interpolation
  // coefficient α ∈ [0, 1] chosen so the total W1 cost ≤ ε.
  //
  // W1 cost of the interpolated distribution Q_α = (1-α)P₀ + αU:
  //   W1(Q_α, P₀) ≈ α * W1(U, P₀)
  //
  // So α = min(1, ε / W1(U, P₀)).

  // Compute W1(uniform, nominal) via sorted-CDF integration.
  const sortedIdx = support.map((_, i) => i).sort((a, b) => support[a] - support[b]);
  const sortedSupport = sortedIdx.map((i) => support[i]);
  const sortedNom = sortedIdx.map((i) => normW[i]);
  const sortedUni = sortedIdx.map((i) => uniform[i]);

  // Build CDFs on the sorted grid.
  let cdfNom = 0;
  let cdfUni = 0;
  let w1NomUni = 0;
  for (let i = 0; i < n - 1; i++) {
    cdfNom += sortedNom[i];
    cdfUni += sortedUni[i];
    w1NomUni += Math.abs(cdfNom - cdfUni) * (sortedSupport[i + 1] - sortedSupport[i]);
  }

  // If support is a single point, W1 = 0 — return uniform as robust prior.
  if (w1NomUni === 0) {
    return { support: [...support], weights: uniform };
  }

  const alpha = Math.min(1, ambiguityRadius / w1NomUni);

  // Step 4 — interpolate and renormalise.
  const robustWeights = normW.map((w, i) => (1 - alpha) * w + alpha * uniform[i]);
  const robustTotal = robustWeights.reduce((s, w) => s + w, 0);
  const finalWeights = robustWeights.map((w) => w / robustTotal);

  return { support: [...support], weights: finalWeights };
}

/**
 * Compute the Wasserstein-1 distance between two discrete distributions
 * on the same support, using sorted-CDF integration.
 *
 * Exported for testing and downstream use.
 */
export function wasserstein1dDiscrete(a: DiscretePrior, b: DiscretePrior): number {
  if (a.support.length !== b.support.length) {
    throw new RangeError('wasserstein1dDiscrete: distributions must have the same support size');
  }
  const n = a.support.length;
  const sortedIdx = a.support.map((_, i) => i).sort((i, j) => a.support[i] - a.support[j]);

  const sortedSupport = sortedIdx.map((i) => a.support[i]);

  const totalA = a.weights.reduce((s, w) => s + w, 0);
  const totalB = b.weights.reduce((s, w) => s + w, 0);
  const normA = sortedIdx.map((i) => a.weights[i] / totalA);
  const normB = sortedIdx.map((i) => b.weights[i] / totalB);

  let cdfA = 0;
  let cdfB = 0;
  let w1 = 0;
  for (let i = 0; i < n - 1; i++) {
    cdfA += normA[i];
    cdfB += normB[i];
    w1 += Math.abs(cdfA - cdfB) * (sortedSupport[i + 1] - sortedSupport[i]);
  }
  return w1;
}
