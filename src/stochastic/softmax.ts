/**
 * MA-3 + MD-2 — Numerically Stable Softmax.
 *
 * Pure function: no I/O, no side effects.
 *
 * Implements the max-subtraction trick to prevent floating-point overflow:
 *   p(i) = exp((s_i − max_s) / T) / Σ_j exp((s_j − max_s) / T)
 *
 * At T → 0 (≤ 1e-9), returns a one-hot vector concentrated on argmax(scores),
 * with ties broken by first occurrence (lowest index). This is the T=0 limit
 * that makes selection byte-identical to deterministic top-k (CF-MA3-01).
 *
 * At T → ∞ (≥ 1e12), probabilities converge to the uniform distribution.
 *
 * Source: Sutton & Barto (2018) §13.2; Haarnoja et al. (2018) SAC α parameter.
 *
 * @module stochastic/softmax
 */

/** Lower bound on temperature — below this, argmax is returned (CF-MA3-01). */
export const TEMPERATURE_EPSILON = 1e-9;

/**
 * Compute numerically stable softmax probabilities.
 *
 * @param scores  Array of raw scores. Must be non-empty. NaN/Infinity values
 *                are replaced with 0 before computation.
 * @param temperature  Inverse softness parameter T > 0. At T ≤ 1e-9 returns
 *                     a one-hot vector on argmax (deterministic limit).
 * @returns  Normalised probability array (sums to 1.0), same length as scores.
 */
export function softmax(scores: readonly number[], temperature: number): number[] {
  if (scores.length === 0) return [];

  // Sanitise inputs — replace non-finite values with 0.
  const safe = scores.map(s => (Number.isFinite(s) ? s : 0));

  // T → 0 limit: one-hot on argmax (CF-MA3-01 / CF-MD2-01).
  if (temperature <= TEMPERATURE_EPSILON) {
    return _oneHotArgmax(safe);
  }

  // Numerically stable softmax: subtract max before exp.
  const max = Math.max(...safe);
  const exps = safe.map(s => Math.exp((s - max) / temperature));
  const Z = exps.reduce((a, b) => a + b, 0);

  // Guard against degenerate Z (all -Inf after subtraction — can't happen with
  // finite inputs but guard for correctness).
  if (Z === 0 || !Number.isFinite(Z)) {
    return _oneHotArgmax(safe);
  }

  return exps.map(e => e / Z);
}

// ─── Internal helpers ──────────────────────────────────────────────────────

/**
 * Return a one-hot probability vector with mass on the first argmax index.
 * Tie-breaking by first occurrence matches deterministic top-k sort order.
 */
function _oneHotArgmax(scores: readonly number[]): number[] {
  let maxIdx = 0;
  for (let i = 1; i < scores.length; i++) {
    if (scores[i] > scores[maxIdx]) maxIdx = i;
  }
  return scores.map((_, i) => (i === maxIdx ? 1 : 0));
}
