/**
 * Wasserstein-Hebbian adapter — Wasserstein-2 geometry helpers.
 *
 * This module ships a narrow, closed-form W₂² helper on 1-D Gaussian
 * distributions and a bounded-variance check. It is **not** a general
 * optimal-transport library; it is the minimum-viable geometric probe
 * required for a structural audit of a plasticity rule's Wasserstein-flow
 * plausibility.
 *
 * ### Closed-form W₂² on 1-D Gaussians
 *
 * For two univariate normal distributions N(μ₁, σ₁²) and N(μ₂, σ₂²), the
 * squared Wasserstein-2 distance has the analytic closed form
 *
 *     W₂²(N(μ₁, σ₁²), N(μ₂, σ₂²)) = (μ₁ − μ₂)² + (σ₁ − σ₂)²
 *
 * (see, e.g., Villani 2008 or Santambrogio 2015 for the standard
 * derivation; this special case is lifted to the module because it
 * requires no numerical transport plan).
 *
 * ### Simplifications / deviations from the source monograph
 *
 * - Only the 1-D Gaussian case is supported. Higher-dimensional Gaussians
 *   with covariance matrices, and non-Gaussian measures in 𝒫₂(ℝᵈ),
 *   require numerical transport plans or spectral computations — out of
 *   scope for a substrate-audit helper.
 * - No gradient-flow stepping. The helper computes a distance between two
 *   fixed distributions. Stepping along a flow is Phase-753+ work.
 *
 * @module wasserstein-hebbian/wasserstein-geometry
 */

/**
 * Compute the squared Wasserstein-2 distance between two 1-D Gaussian
 * distributions with parameters (μ₁, σ₁) and (μ₂, σ₂).
 *
 * Returns the analytic closed form: (μ₁ − μ₂)² + (σ₁ − σ₂)².
 *
 * Preconditions: σ₁ ≥ 0 and σ₂ ≥ 0 (standard deviations). If either σ is
 * negative, the caller is outside the supported domain; this function does
 * not throw — it applies the closed form as-is and returns a non-negative
 * number whose interpretation is the caller's responsibility.
 *
 * Not-finite inputs yield `NaN` by the ordinary IEEE-754 propagation rules.
 */
export function w2SquaredGaussian(
  mu1: number,
  sigma1: number,
  mu2: number,
  sigma2: number,
): number {
  const dMean = mu1 - mu2;
  const dSigma = sigma1 - sigma2;
  return dMean * dMean + dSigma * dSigma;
}

/**
 * Check whether the variance σ² of a 1-D Gaussian lies within the bounded
 * region σ² < threshold. Used as a structural sanity check: Wasserstein-2
 * gradient flows on bounded second-moment distributions are well-posed
 * under the Tan 2026 framework assumptions; this helper exposes that
 * bounded-moment check to the plasticity-rule auditor.
 *
 * Returns `true` iff σ² < threshold. Handles σ, threshold ≥ 0 only; for
 * non-finite or negative inputs, the result is `false` (fail-closed).
 */
export function checkBoundedVariance(sigma: number, threshold: number): boolean {
  if (!Number.isFinite(sigma) || !Number.isFinite(threshold)) return false;
  if (sigma < 0 || threshold < 0) return false;
  return sigma * sigma < threshold;
}

/** Default variance bound used by consumers that do not configure one. */
export const DEFAULT_VARIANCE_THRESHOLD = 100;
