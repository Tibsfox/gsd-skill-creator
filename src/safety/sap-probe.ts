/**
 * Safety-Aware Probing (SAP) — contrastive probe + (I − P_S) projector.
 *
 * Reference: arXiv:2505.16737 (Secure LLM Fine-Tuning via Safety-Aware Probing).
 *
 * ## Overview
 *
 * A contrastive linear probe is trained from paired safe/unsafe activation
 * samples to identify the "safety subspace" P_S inside the gradient space. The
 * (I − P_S) projector then removes the safety-correlated component from any
 * gradient update, ensuring that fine-tuning steps cannot erode safety-relevant
 * representations.
 *
 * ## Construction (difference-of-means)
 *
 * The simplest minimal-correct construction (per arXiv:2505.16737 §3.1) uses the
 * *difference-of-means* contrastive direction:
 *
 *     d = μ_unsafe − μ_safe
 *     d̂ = d / ‖d‖₂
 *
 * The rank-1 projection matrix is P_S = d̂ · d̂ᵀ, so (I − P_S) removes the
 * component of any vector along d̂.
 *
 * For a multi-direction generalisation, pass several contrastive pairs; the
 * directions are orthonormalised (Gram-Schmidt) and P_S = Σ û_k · û_kᵀ.
 * Rank of P_S equals the number of linearly independent directions extracted.
 *
 * ## Composition invariants
 *
 * Per spec `safety-aware-projection.md §JP-004`, the (I − P_S) projector:
 *   - Is an orthogonal projection → idempotent, symmetric.
 *   - Cannot increase the L2 norm of the input (‖(I−P_S)v‖₂ ≤ ‖v‖₂).
 *   - Composes with MB-1 Lyapunov-gated updates without violating V̇ ≤ 0 — the
 *     projector only removes components; it cannot add energy.
 *   - Composes with MB-2 smooth projection and MB-5 dead-zone without migration.
 *
 * @module safety/sap-probe
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A labeled activation sample for contrastive probe training.
 * `vector` is the gradient / activation slice; `label` is 'safe' or 'unsafe'.
 */
export interface SapSample {
  vector: number[];
  label: 'safe' | 'unsafe';
}

/**
 * A fitted SAP probe. Holds the orthonormal safety directions and the rank of
 * the safety subspace P_S.
 */
export interface SapProbe {
  /**
   * Orthonormal basis of the safety subspace. Each column is a unit vector.
   * For difference-of-means this is a single vector; multi-pair probes may have
   * more directions (up to the number of linearly independent pairs).
   */
  directions: number[][];
  /**
   * Dimension of the parameter space (length of each direction vector).
   */
  dim: number;
  /**
   * Rank of P_S — equals the number of stored orthonormal directions.
   * For difference-of-means this is always 1.
   */
  rank: number;
}

// ---------------------------------------------------------------------------
// Probe construction
// ---------------------------------------------------------------------------

/**
 * Build a SAP probe from a set of labeled samples using the difference-of-means
 * contrastive direction.
 *
 * All samples must have the same vector length. Throws if the safe/unsafe means
 * are identical (zero-norm direction — no safety-correlated axis detectable in
 * the data).
 *
 * The returned probe has `rank = 1` for difference-of-means. Pass multiple
 * call results to `combineSapProbes` (or use `createSapProbeMulti`) to obtain
 * higher-rank P_S from multiple contrastive pairs.
 *
 * Pure function — no side effects.
 */
export function createSapProbe(samples: SapSample[]): SapProbe {
  if (samples.length === 0) {
    throw new RangeError('createSapProbe: samples array must not be empty');
  }

  const dim = samples[0]!.vector.length;
  for (const s of samples) {
    if (s.vector.length !== dim) {
      throw new RangeError(
        `createSapProbe: all samples must have the same dimension (expected ${dim}, got ${s.vector.length})`,
      );
    }
  }

  const safeSamples = samples.filter(s => s.label === 'safe');
  const unsafeSamples = samples.filter(s => s.label === 'unsafe');

  if (safeSamples.length === 0) {
    throw new RangeError('createSapProbe: need at least one safe sample');
  }
  if (unsafeSamples.length === 0) {
    throw new RangeError('createSapProbe: need at least one unsafe sample');
  }

  const muSafe = meanVector(safeSamples.map(s => s.vector), dim);
  const muUnsafe = meanVector(unsafeSamples.map(s => s.vector), dim);

  // Contrastive direction: unsafe − safe
  const diff = new Array<number>(dim);
  for (let i = 0; i < dim; i++) {
    diff[i] = muUnsafe[i]! - muSafe[i]!;
  }

  const direction = normalise(diff);

  return {
    directions: [direction],
    dim,
    rank: 1,
  };
}

// ---------------------------------------------------------------------------
// (I − P_S) projection operator
// ---------------------------------------------------------------------------

/**
 * Apply the safety-orthogonal projection (I − P_S) to a gradient vector.
 *
 * Removes the component of `gradient` along every safety direction in the probe.
 * The result satisfies ‖projected‖₂ ≤ ‖gradient‖₂ (orthogonal projection cannot
 * increase norm).
 *
 * This is the MB-2 registration point: callers in `src/projection/` use this
 * function as the `safety-aware-projection` named operator.
 *
 * Pure function — no side effects.
 *
 * @param gradient - The gradient vector to project (must have length == probe.dim).
 * @param probe    - A fitted SapProbe (from `createSapProbe`).
 * @returns The projected gradient vector with safety-correlated directions removed.
 */
export function applySafetyProjection(gradient: number[], probe: SapProbe): number[] {
  if (gradient.length !== probe.dim) {
    throw new RangeError(
      `applySafetyProjection: gradient length ${gradient.length} does not match probe dimension ${probe.dim}`,
    );
  }

  // Start with a copy of the gradient.
  const result = gradient.slice();

  // For each orthonormal direction d̂, subtract the component along d̂:
  //   result ← result − (result · d̂) · d̂
  for (const dir of probe.directions) {
    const dot = dotProduct(result, dir);
    for (let i = 0; i < probe.dim; i++) {
      result[i] = result[i]! - dot * dir[i]!;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Internal utilities
// ---------------------------------------------------------------------------

/** Compute the component-wise mean of a list of vectors. */
function meanVector(vectors: number[][], dim: number): number[] {
  const mean = new Array<number>(dim).fill(0);
  for (const v of vectors) {
    for (let i = 0; i < dim; i++) {
      mean[i] = mean[i]! + v[i]!;
    }
  }
  const n = vectors.length;
  for (let i = 0; i < dim; i++) {
    mean[i] = mean[i]! / n;
  }
  return mean;
}

/** Compute the dot product of two equal-length vectors. */
function dotProduct(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i]! * b[i]!;
  }
  return sum;
}

/**
 * Normalise a vector to unit length. Throws if the vector has zero norm
 * (contrastive direction is degenerate — safe and unsafe means are identical).
 */
function normalise(v: number[]): number[] {
  let norm = 0;
  for (const x of v) norm += x * x;
  norm = Math.sqrt(norm);
  if (norm < 1e-12) {
    throw new RangeError(
      'createSapProbe: safe and unsafe mean vectors are identical — no safety-correlated direction found',
    );
  }
  return v.map(x => x / norm);
}

/** L2 norm of a vector. */
export function l2Norm(v: number[]): number {
  let sum = 0;
  for (const x of v) sum += x * x;
  return Math.sqrt(sum);
}
