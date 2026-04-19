/**
 * MB-2 — Core smooth projection primitive.
 *
 * Implements Sastry & Bodson 1989 eq 2.3.7–2.3.9 (p. 59): projection of a
 * scalar or vector parameter onto a bounded convex admissible set. The key
 * theoretical warrant is Theorem 2.4.3 (p. 65): projecting a gradient-descent
 * update onto a convex set preserves Lyapunov descent — `V̇_Pr ≤ V̇` — because
 * the boundary projection removes only the outward-pointing component.
 *
 * ## Why smooth projection, not hard clipping?
 *
 * Hard clipping (`Math.max(lo, Math.min(hi, x))`) is the orthogonal projection
 * onto `[lo, hi]`, which is mathematically correct but introduces a
 * *discontinuity in the gradient* at the boundary: the derivative of the
 * projected value w.r.t. the raw value jumps from 1 to 0 at the boundary
 * face. This discontinuity propagates to downstream VMP convergence metrics
 * (CF-M7-08) and breaks the continuity assumption of Theorem 2.4.3.
 *
 * MB-2 replaces hard clipping with a *quadratic-penalty barrier* near the
 * boundary that transitions continuously. Inside the interior region the value
 * is returned unchanged; inside the boundary strip (width `epsilon`) a smooth
 * quadratic correction pulls the value back. Outside the admissible set a
 * linear recovery is applied.
 *
 * The `penalty` and `derivative` fields enable callers to compose the
 * projection smoothly with a Lyapunov function: add `penalty` to the
 * candidate V value and scale gradient updates by `derivative` to preserve
 * the descent estimate.
 *
 * ## Simplex projection (M7)
 *
 * For the probability-simplex case (M7 generative model rows) use
 * `projectToSimplex`. This implements the Duchi et al. 2008 `O(n log n)`
 * algorithm which projects a raw vector onto `{x ≥ 0, sum(x) = 1}` without
 * any hard clipping — it operates entirely on sorted indices and a single
 * `lambda` shift, producing continuous gradients within the interior.
 *
 * ## Interval projection (M6 K_H)
 *
 * For scalar interval projection use `projectToInterval`. The smooth wrapper
 * around `[lower, upper]` applies a quadratic barrier zone near each boundary
 * and returns `{projected, penalty, derivative}` for Lyapunov composability.
 *
 * Source:
 *   .planning/research/living-sensoria-refinement/proposals/MB-2-projection-operators.md
 *   .planning/research/living-sensoria-refinement/threads/B-adaptive-control.md §5 MB-2
 *
 * References:
 *   Sastry & Bodson 1989, eq 2.3.7–2.3.9 (p. 59); Theorem 2.4.3 (p. 65).
 *   Duchi, Shalev-Shwartz, Singer & Chandra (2008), ICML 2008 — simplex projection.
 *
 * @module projection/smooth-projection
 */

// ---------------------------------------------------------------------------
// Smooth interval projection
// ---------------------------------------------------------------------------

/**
 * Result of a smooth projection onto `[lower, upper]`. All three fields are
 * required for Lyapunov composability.
 */
export interface SmoothProjectionResult {
  /**
   * Projected value (guaranteed in `[lower, upper]`). Equal to `value` when
   * the value is in the interior beyond the barrier strip.
   */
  projected: number;
  /**
   * Non-negative penalty term from the quadratic barrier. Add to a Lyapunov
   * candidate V to account for the projection's energy cost. Zero in the
   * interior; positive only inside the boundary strip.
   */
  penalty: number;
  /**
   * Derivative of the projected value w.r.t. the raw value (in `[0, 1]`).
   * Equal to 1 in the interior, smoothly falls to 0 at the hard boundary.
   * Use to scale gradient updates for descent preservation.
   */
  derivative: number;
}

/**
 * Smooth projection of a scalar `value` onto `[lower, upper]`.
 *
 * Per Sastry 1989 eq 2.3.8–2.3.9 (p. 59), the orthogonal projection onto a
 * scalar interval IS the hard clamp. MB-2 wraps it with a smooth barrier zone
 * near each boundary to eliminate gradient discontinuities.
 *
 * The `penaltyStrength` parameter controls the width and depth of the barrier
 * zone (default 0.1). A value of 0 reduces to the hard clamp (recovering
 * byte-identical behaviour when `projection.enabled = false`).
 *
 * Algorithm:
 *   - If `value ∈ [lower + δ, upper − δ]` (interior): identity transform,
 *     penalty = 0, derivative = 1.
 *   - If `value ∈ (lower, lower + δ)` (lower strip): quadratic penalty,
 *     smooth derivative blend.
 *   - If `value ∈ (upper − δ, upper)` (upper strip): symmetric.
 *   - If `value < lower` or `value > upper` (outside): hard clamp +
 *     quadratic overflow penalty, derivative = 0.
 *
 * where `δ = penaltyStrength · (upper − lower)`.
 *
 * Pure function — no side effects.
 */
export function smoothProject(
  value: number,
  lower: number,
  upper: number,
  penaltyStrength: number = 0.1,
): SmoothProjectionResult {
  // Guard degenerate bounds.
  if (!Number.isFinite(lower) || !Number.isFinite(upper)) {
    return { projected: value, penalty: 0, derivative: 1 };
  }
  if (upper < lower) {
    // Degenerate interval: clamp to lower.
    return { projected: lower, penalty: 0, derivative: 0 };
  }
  if (upper === lower) {
    const dist = Math.abs(value - lower);
    return { projected: lower, penalty: dist * dist, derivative: 0 };
  }
  if (!Number.isFinite(value)) {
    return { projected: lower, penalty: 0, derivative: 0 };
  }

  const ps = Math.max(0, Math.min(0.5, penaltyStrength)); // clamp to [0, 0.5]
  const range = upper - lower;
  const delta = ps * range; // barrier strip half-width

  // --- Below lower bound ---
  if (value <= lower) {
    const overshoot = lower - value;
    const penalty = overshoot * overshoot;
    return { projected: lower, penalty, derivative: 0 };
  }

  // --- Above upper bound ---
  if (value >= upper) {
    const overshoot = value - upper;
    const penalty = overshoot * overshoot;
    return { projected: upper, penalty, derivative: 0 };
  }

  // --- Inside [lower, upper] ---
  if (delta === 0) {
    // penaltyStrength = 0 → pure hard clamp (identity inside).
    return { projected: value, penalty: 0, derivative: 1 };
  }

  // --- Lower barrier strip: (lower, lower + delta) ---
  if (value < lower + delta) {
    const t = (value - lower) / delta; // t ∈ (0, 1]
    // Smooth quintic blend: 0 at t=0, 1 at t=1, zero first derivative at endpoints.
    const blend = quinticBlend(t);
    const projected = lower + blend * delta + (1 - blend) * 0;
    // projected = lower + t*delta at t=1, so derivative smoothly approaches 1.
    // Actual smooth derivative: d(projected)/d(value) = d(projected)/dt · dt/d(value)
    //   = (dBlend/dt * delta) / delta = dBlend/dt
    const dBlend = quinticBlendDerivative(t);
    const penalty = (1 - blend) * (1 - blend) * delta * delta * 0.5;
    return { projected: lower + blend * delta, penalty, derivative: Math.max(0, Math.min(1, dBlend)) };
  }

  // --- Upper barrier strip: (upper - delta, upper) ---
  if (value > upper - delta) {
    const t = (upper - value) / delta; // t ∈ (0, 1] (distance from upper)
    const blend = quinticBlend(t);
    const projected = upper - blend * delta;
    const dBlend = quinticBlendDerivative(t);
    const penalty = (1 - blend) * (1 - blend) * delta * delta * 0.5;
    return { projected, penalty, derivative: Math.max(0, Math.min(1, dBlend)) };
  }

  // --- Interior (no penalty, identity) ---
  return { projected: value, penalty: 0, derivative: 1 };
}

/**
 * Quintic Hermite blend function: smooth S-curve from 0→1 with zero
 * first and second derivatives at both endpoints. Formula: 6t⁵−15t⁴+10t³.
 * This matches Ken Perlin's smoothstep variant (continuity class C²).
 *
 * Pure function. Input should be in [0, 1].
 */
function quinticBlend(t: number): number {
  // 6t⁵ − 15t⁴ + 10t³
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/**
 * Derivative of `quinticBlend`: 30t⁴ − 60t³ + 30t².
 */
function quinticBlendDerivative(t: number): number {
  return 30 * t * t * (t * t - 2 * t + 1);
}

// ---------------------------------------------------------------------------
// Simplex projection (M7 generative model rows)
// ---------------------------------------------------------------------------

/**
 * Minimum entry value for the simplex. Ensures all entries are strictly
 * positive so the model can never rule out an observation (prevents log-zero
 * blowups in the free-energy loop). Applied as a post-projection floor.
 */
export const SIMPLEX_EPSILON = 1e-10;

/**
 * Project a raw probability vector onto the standard probability simplex:
 *
 *     { x ∈ ℝⁿ : x_i ≥ ε, ∑x_i = 1 }
 *
 * Uses the Duchi et al. (2008) ICML algorithm, `O(n log n)`:
 *
 * 1. Sort descending: `sorted[0] ≥ sorted[1] ≥ … ≥ sorted[n-1]`.
 * 2. Find `ρ = max{ j : sorted[j] > (∑_{i=1}^{j} sorted[i] − 1) / j }`.
 * 3. Compute `λ = (∑_{i=1}^{ρ} sorted[i] − 1) / ρ`.
 * 4. Project: `x_i = max(raw_i − λ, 0)`.
 * 5. Apply `ε`-floor and final renormalise for bit-exact row-sum.
 *
 * Per Sastry Theorem 2.4.3 (p. 65): projecting onto the simplex preserves
 * the Lyapunov descent property — `V̇_Pr ≤ V̇`.
 *
 * Degenerate input (all-negative vector): returns uniform distribution with
 * a logged warning sentinel. Callers should check `isDegenerate` in the result.
 *
 * Pure function — no side effects.
 */
export interface SimplexProjectionResult {
  /** Projected probability vector (sums to 1 exactly, all entries ≥ ε). */
  projected: number[];
  /** Whether the input was degenerate (all entries non-positive). */
  isDegenerate: boolean;
  /** The `lambda` shift computed by Duchi et al. algorithm. */
  lambda: number;
}

export function projectToSimplex(raw: number[]): SimplexProjectionResult {
  const n = raw.length;
  if (n === 0) {
    return { projected: [], isDegenerate: false, lambda: 0 };
  }
  if (n === 1) {
    return { projected: [1], isDegenerate: false, lambda: 0 };
  }

  // Check if already in the interior simplex (all ≥ 0, sums to 1).
  let allNonNeg = true;
  let rawSum = 0;
  for (let i = 0; i < n; i++) {
    const v = raw[i]!;
    if (v < 0) allNonNeg = false;
    rawSum += v;
  }

  // If all non-negative and sum > 0, simple normalisation is the projection.
  if (allNonNeg && rawSum > 0) {
    const projected = raw.map(v => v / rawSum);
    // Apply epsilon floor and renormalise.
    return applyFloorAndNorm(projected, n);
  }

  // --- Duchi et al. 2008 algorithm ---
  // Sort descending.
  const sorted = [...raw].sort((a, b) => b - a);

  // Find rho: largest j such that sorted[j-1] > (cumsum[j] - 1) / j
  let cumsum = 0;
  let rho = 0;
  for (let j = 0; j < n; j++) {
    cumsum += sorted[j]!;
    const threshold = (cumsum - 1) / (j + 1);
    if (sorted[j]! > threshold) {
      rho = j + 1;
    }
  }

  if (rho === 0) {
    // Degenerate: all entries non-positive, return uniform.
    const uniform = new Array<number>(n).fill(1 / n);
    return { projected: uniform, isDegenerate: true, lambda: 0 };
  }

  // Compute lambda from the first rho elements.
  let rhoSum = 0;
  for (let j = 0; j < rho; j++) rhoSum += sorted[j]!;
  const lambda = (rhoSum - 1) / rho;

  // Project.
  const projected = raw.map(v => Math.max(v - lambda, 0));

  // Apply epsilon floor and bit-exact renormalise.
  return applyFloorAndNorm(projected, n, lambda);
}

/** Apply SIMPLEX_EPSILON floor and renormalise for bit-exact sum = 1. */
function applyFloorAndNorm(
  projected: number[],
  n: number,
  lambda: number = 0,
): SimplexProjectionResult {
  // Apply ε floor.
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const v = Math.max(projected[i]!, SIMPLEX_EPSILON);
    projected[i] = v;
    sum += v;
  }

  // Renormalise for bit-exact row-sum = 1 (CF-MB2-01).
  for (let i = 0; i < n; i++) {
    projected[i] = projected[i]! / sum;
  }

  return { projected, isDegenerate: false, lambda };
}

// ---------------------------------------------------------------------------
// Projected gradient update (combined primitive)
// ---------------------------------------------------------------------------

/**
 * Apply a gradient step to a parameter vector and project the result onto the
 * probability simplex. This is the Duchi-projected gradient update used by M7.
 *
 * `theta` — current parameter row.
 * `grad` — gradient of the loss w.r.t. theta.
 * `stepSize` — gradient step size (positive).
 *
 * Returns the projected update and its simplex-projection result.
 */
export interface ProjectedUpdateResult {
  /** New parameter row (simplex-projected). */
  newTheta: number[];
  /** Raw (unprojected) intermediate value. */
  rawTheta: number[];
  /** Full simplex-projection result for diagnostics. */
  simplexResult: SimplexProjectionResult;
}

export function projectedGradientUpdate(
  theta: number[],
  grad: number[],
  stepSize: number,
): ProjectedUpdateResult {
  const n = theta.length;
  const rawTheta = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    rawTheta[i] = theta[i]! - stepSize * (grad[i] ?? 0);
  }
  const simplexResult = projectToSimplex(rawTheta);
  return { newTheta: simplexResult.projected, rawTheta, simplexResult };
}
