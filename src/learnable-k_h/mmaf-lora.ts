/**
 * MD-5 learnable K_H — MMAF-guided LoRA primitive.
 *
 * Implements the Magnitude-Masked Adapter Fusion (MMAF) pattern from
 * arXiv:2603.15055 as a lightweight LoRA rank-selection wrapper for the
 * learnable K_H head update path.
 *
 * Concept (arXiv:2603.15055 §3):
 *   A LoRA adapter factorises a weight update as ΔW = B · A (rank-r).
 *   MMAF gates each rank column by its L2 magnitude; ranks below a threshold
 *   `mask_floor` are suppressed (zeroed) before the update is applied.
 *   This reduces catastrophic interference between task-type adaptations
 *   while concentrating gradient signal in the most active adapter ranks.
 *
 * Integration with MD-5 (head.ts):
 *   MMAFLoRAAdapter wraps the `weights` vector of a `LearnableKHHead` with a
 *   low-rank factorisation B (dim × rank) · A (rank × 1). During an update
 *   step, per-rank magnitudes are computed and ranks below `maskFloor` are
 *   masked out. The remaining gradient is applied through the LoRA path.
 *   This is composable with the Lyapunov gate in `src/lyapunov/` — MMAF
 *   masking runs first; the Lyapunov check runs on the resulting masked update.
 *
 * JP-023, Wave 3, phase 841.
 *
 * @module learnable-k_h/mmaf-lora
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MMAFLoRAConfig {
  /** Dimensionality of the weight vector (matches LearnableKHHead.dim). */
  dim: number;
  /**
   * LoRA rank r. Must satisfy 1 ≤ r ≤ dim.
   * Lower rank = fewer parameters; higher rank = more capacity.
   * Default: Math.max(1, Math.floor(dim / 4))
   */
  rank?: number;
  /**
   * Magnitude floor for rank masking. Ranks whose column L2 norm in B
   * falls below this value are zeroed in the gradient step.
   * Default: 0.01
   */
  maskFloor?: number;
  /**
   * Learning rate for the LoRA factor update.
   * Default: 0.01
   */
  lr?: number;
}

export interface MMAFLoRAState {
  /** B factor (dim × rank). Row-major flat array, length = dim * rank. */
  B: Float64Array;
  /** A factor (rank × 1). Length = rank. */
  A: Float64Array;
  /** dim of the adapted weight vector. */
  dim: number;
  /** Effective rank. */
  rank: number;
  /** Magnitude floor for MMAF masking. */
  maskFloor: number;
  /** Learning rate. */
  lr: number;
  /** Number of update steps applied. */
  updateCount: number;
}

export interface MMAFUpdateResult {
  /** Per-rank magnitude norms (before masking). */
  rankNorms: readonly number[];
  /** Boolean mask: true = rank was active (not masked). */
  rankMask: readonly boolean[];
  /** Number of active ranks after masking. */
  activeRanks: number;
  /** The flat weight delta applied: ΔW = B_masked · A. */
  delta: readonly number[];
}

// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * Create a new MMAF LoRA adapter state with random initialisation.
 * B is initialised with small Gaussian noise; A is initialised to zero.
 */
export function createMMAFLoRA(config: MMAFLoRAConfig): MMAFLoRAState {
  const { dim } = config;
  const rank = config.rank ?? Math.max(1, Math.floor(dim / 4));
  if (rank < 1 || rank > dim) {
    throw new RangeError(`rank must satisfy 1 ≤ rank ≤ dim, got rank=${rank} dim=${dim}`);
  }

  // Xavier-style initialisation for B: scale = sqrt(1/rank)
  const scale = Math.sqrt(1 / rank);
  const B = new Float64Array(dim * rank);
  for (let i = 0; i < B.length; i++) {
    // Box-Muller for approximate Gaussian
    const u1 = Math.max(Math.random(), 1e-15);
    const u2 = Math.random();
    B[i] = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * scale;
  }

  return {
    B,
    A: new Float64Array(rank), // zero-init: no adapter effect at start
    dim,
    rank,
    maskFloor: config.maskFloor ?? 0.01,
    lr: config.lr ?? 0.01,
    updateCount: 0,
  };
}

// ─── Magnitude masking ────────────────────────────────────────────────────────

/**
 * Compute per-rank L2 norms of the B columns.
 * Column r has entries B[0*rank+r], B[1*rank+r], …, B[(dim-1)*rank+r].
 */
export function computeRankNorms(state: MMAFLoRAState): Float64Array {
  const { B, dim, rank } = state;
  const norms = new Float64Array(rank);
  for (let r = 0; r < rank; r++) {
    let sumSq = 0;
    for (let d = 0; d < dim; d++) {
      const val = B[d * rank + r]!;
      sumSq += val * val;
    }
    norms[r] = Math.sqrt(sumSq);
  }
  return norms;
}

/**
 * Apply a single MMAF-gated gradient step.
 *
 * Given a gradient vector `grad` (length = dim, ∂L/∂W),
 * computes ΔW = B_masked · (B_masked^T · grad) * lr and returns the
 * masked delta along with diagnostics.
 *
 * This does NOT mutate B or A — it returns a delta the caller applies
 * to the weight vector of a `LearnableKHHead`. The caller is responsible
 * for combining this delta with the Lyapunov gate before applying.
 */
export function mmafStep(
  state: MMAFLoRAState,
  grad: readonly number[],
): MMAFUpdateResult {
  if (grad.length !== state.dim) {
    throw new RangeError(
      `grad.length (${grad.length}) must equal state.dim (${state.dim})`,
    );
  }

  const { B, dim, rank, maskFloor, lr } = state;
  const norms = computeRankNorms(state);

  // Build rank mask
  const rankMask: boolean[] = [];
  for (let r = 0; r < rank; r++) {
    rankMask.push((norms[r] ?? 0) >= maskFloor);
  }
  const activeRanks = rankMask.filter(Boolean).length;

  // Project grad onto each active rank column of B: a_r = B_r^T · grad
  const a = new Float64Array(rank);
  for (let r = 0; r < rank; r++) {
    if (!rankMask[r]) continue;
    let dot = 0;
    for (let d = 0; d < dim; d++) {
      dot += B[d * rank + r]! * grad[d]!;
    }
    a[r] = dot;
  }

  // Reconstruct delta: Δw = B_masked · a * lr
  const delta = new Float64Array(dim);
  for (let d = 0; d < dim; d++) {
    let acc = 0;
    for (let r = 0; r < rank; r++) {
      if (!rankMask[r]) continue;
      acc += B[d * rank + r]! * a[r]!;
    }
    delta[d] = acc * lr;
  }

  return {
    rankNorms: Array.from(norms),
    rankMask,
    activeRanks,
    delta: Array.from(delta),
  };
}

/**
 * Apply the delta returned by `mmafStep` to a weight array in-place.
 * Typically called after a Lyapunov gate check approves the update.
 */
export function applyDelta(weights: number[], delta: readonly number[]): void {
  if (weights.length !== delta.length) {
    throw new RangeError(
      `weights.length (${weights.length}) must equal delta.length (${delta.length})`,
    );
  }
  for (let i = 0; i < weights.length; i++) {
    weights[i]! -= delta[i]!; // gradient descent
  }
}
