/**
 * MD-5 — Per-(skill, task-type) learnable K_H head.
 *
 * Each tractable skill owns a small linear head that maps an MD-1 task-type
 * embedding to a scalar K_H. The head is intentionally minimal so it remains
 * analysable and its gradient is hand-derivable:
 *
 *     z(x) = w · x + b
 *     s(z) = 1 / (1 + exp(−z))            // sigmoid
 *     K_H(x) = K_H_min + (K_H_max − K_H_min) · s(z)
 *
 * The output is guaranteed to stay in `[K_H_min, K_H_max]` — mirroring MB-2's
 * parameter-bounds contract. `K_H_min` and `K_H_max` are head-level constants
 * chosen by the caller at creation (typically `[K_H_base / 2, K_H_base · 2]`
 * around the frontmatter scalar so the head can nudge but not wildly deviate).
 *
 * The gradient is hand-derived (matches MD-1's skip-gram pattern):
 *
 *     dK_H/dz = (K_H_max − K_H_min) · s(z) · (1 − s(z))
 *     dK_H/dw_i = dK_H/dz · x_i
 *     dK_H/db   = dK_H/dz
 *
 * Pure functions throughout — no hidden mutation.
 *
 * @module learnable-k_h/head
 */

// ---------------------------------------------------------------------------
// Head data shape
// ---------------------------------------------------------------------------

export interface LearnableKHHead {
  /** Skill identifier this head is bound to. */
  readonly skillId: string;
  /** Embedding dimensionality (length of weight vector). */
  readonly dim: number;
  /** Lower bound of the head output (inclusive). */
  readonly kHMin: number;
  /** Upper bound of the head output (inclusive). */
  readonly kHMax: number;
  /** Linear weights (length = dim). Mutable array owned by the head. */
  readonly weights: number[];
  /** Linear bias. */
  bias: number;
  /** Number of SGD updates applied (for diagnostics / store bookkeeping). */
  updateCount: number;
}

/**
 * Construct a fresh head for a skill. The head is initialised to zero weights
 * and zero bias — equivalent to `sigmoid(0) = 0.5`, i.e. the midpoint of the
 * `[kHMin, kHMax]` band. Callers typically set `kHMin` and `kHMax` so that
 * the midpoint equals (or brackets) the frontmatter K_H scalar, giving an
 * "untrained head" output close to the legacy behaviour.
 */
export function createHead(opts: {
  skillId: string;
  dim: number;
  kHMin: number;
  kHMax: number;
}): LearnableKHHead {
  if (!Number.isFinite(opts.dim) || opts.dim <= 0 || !Number.isInteger(opts.dim)) {
    throw new Error(`dim must be a positive integer, got ${opts.dim}`);
  }
  if (!Number.isFinite(opts.kHMin) || !Number.isFinite(opts.kHMax) || opts.kHMax <= opts.kHMin) {
    throw new Error(
      `kHMin/kHMax must be finite with kHMax > kHMin; got ${opts.kHMin}, ${opts.kHMax}`,
    );
  }
  return {
    skillId: opts.skillId,
    dim: opts.dim,
    kHMin: opts.kHMin,
    kHMax: opts.kHMax,
    weights: new Array<number>(opts.dim).fill(0),
    bias: 0,
    updateCount: 0,
  };
}

// ---------------------------------------------------------------------------
// Forward pass
// ---------------------------------------------------------------------------

/**
 * Numerically stable sigmoid: `1 / (1 + exp(-z))` for z ≥ 0, and
 * `exp(z) / (1 + exp(z))` for z < 0 to avoid overflow on large negative z.
 */
export function sigmoid(z: number): number {
  if (!Number.isFinite(z)) {
    // +Infinity → 1, −Infinity → 0, NaN → 0.5 (neutral fallback).
    if (z === Infinity) return 1;
    if (z === -Infinity) return 0;
    return 0.5;
  }
  if (z >= 0) {
    return 1 / (1 + Math.exp(-z));
  }
  const ez = Math.exp(z);
  return ez / (1 + ez);
}

export interface ForwardResult {
  /** Pre-activation z = w·x + b. */
  z: number;
  /** Sigmoid output s(z) ∈ [0, 1]. */
  s: number;
  /** Final K_H = kHMin + (kHMax − kHMin) · s ∈ [kHMin, kHMax]. */
  kH: number;
}

/**
 * Forward pass. Pure function — does not mutate the head.
 * `taskEmbed` length must equal `head.dim`.
 */
export function forward(head: LearnableKHHead, taskEmbed: readonly number[]): ForwardResult {
  if (taskEmbed.length !== head.dim) {
    throw new Error(
      `taskEmbed length ${taskEmbed.length} does not match head.dim ${head.dim}`,
    );
  }
  let z = head.bias;
  for (let i = 0; i < head.dim; i += 1) {
    const wi = head.weights[i]!;
    const xi = taskEmbed[i]!;
    z += wi * xi;
  }
  const s = sigmoid(z);
  const kH = head.kHMin + (head.kHMax - head.kHMin) * s;
  return { z, s, kH };
}

// ---------------------------------------------------------------------------
// Gradient
// ---------------------------------------------------------------------------

export interface HeadGradient {
  /** ∂K_H/∂w_i, length = dim. */
  dWeights: number[];
  /** ∂K_H/∂b. */
  dBias: number;
  /** Scalar dK_H/dz = (kHMax − kHMin) · s · (1 − s). */
  dKHdZ: number;
}

/**
 * Compute the gradient of the scalar output `K_H` with respect to the head
 * parameters at a given input. Pure function.
 *
 *     dK_H/dz = (kHMax − kHMin) · s · (1 − s)
 *     dK_H/dw_i = (dK_H/dz) · x_i
 *     dK_H/db   = (dK_H/dz)
 */
export function gradient(
  head: LearnableKHHead,
  taskEmbed: readonly number[],
  fwd?: ForwardResult,
): HeadGradient {
  const f = fwd ?? forward(head, taskEmbed);
  const dKHdZ = (head.kHMax - head.kHMin) * f.s * (1 - f.s);
  const dWeights = new Array<number>(head.dim);
  for (let i = 0; i < head.dim; i += 1) {
    dWeights[i] = dKHdZ * taskEmbed[i]!;
  }
  return { dWeights, dBias: dKHdZ, dKHdZ };
}

/**
 * Apply an SGD-style in-place update: `w ← w − lr · (dLoss/dK_H) · dK_H/dw`.
 *
 * The trainer supplies the scalar `scaledGradient = lr · (dLoss/dK_H)` so
 * this primitive stays agnostic to the loss shape. Returns the mutated head
 * (same reference) for fluency. `updateCount` is incremented exactly once.
 */
export function applyUpdateInPlace(
  head: LearnableKHHead,
  grad: HeadGradient,
  scaledGradient: number,
): LearnableKHHead {
  if (!Number.isFinite(scaledGradient)) {
    throw new Error(`scaledGradient must be finite; got ${scaledGradient}`);
  }
  for (let i = 0; i < head.dim; i += 1) {
    head.weights[i] = head.weights[i]! - scaledGradient * grad.dWeights[i]!;
  }
  head.bias = head.bias - scaledGradient * grad.dBias;
  head.updateCount += 1;
  return head;
}

/**
 * Return a byte-level clone of the head. Used by the trainer to try an update,
 * evaluate its Lyapunov descent certificate, and reject if `V̇ > 0`.
 */
export function cloneHead(head: LearnableKHHead): LearnableKHHead {
  return {
    skillId: head.skillId,
    dim: head.dim,
    kHMin: head.kHMin,
    kHMax: head.kHMax,
    weights: head.weights.slice(),
    bias: head.bias,
    updateCount: head.updateCount,
  };
}
