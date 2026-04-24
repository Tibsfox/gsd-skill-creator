/**
 * Koopman-Memory — types.
 *
 * State-space + Koopman bilinear update per arXiv:2604.17221 (Fujii 2026,
 * `fujii2026mambakoopman`) and M5 §m5-mamba:
 *
 *     h_{t+1} = A · h_t + h_t^⊤ K u_t
 *
 * where `A` is the linear dynamics matrix (d×d), `K` is the bilinear form
 * (d×d×m tensor flattened row-major), and `u_t` is the per-step input
 * vector (length m).
 *
 * All numeric types are readonly arrays so that operators and states are
 * structurally safe to pass across module boundaries without deep copies.
 *
 * @module koopman-memory/types
 */

/** Hidden state vector of fixed dimension `d`. */
export type KoopmanState = readonly number[];

/** Per-step input vector of dimension `m`. */
export type KoopmanInput = readonly number[];

/**
 * Linear dynamics matrix `A ∈ R^{d×d}` flattened row-major: entry (i, j) is
 * at index `i * d + j`.
 */
export type LinearOperator = readonly number[];

/**
 * Bilinear form `K ∈ R^{d×d×m}` flattened as `i * d * m + j * m + k`. For
 * each output coordinate `i`, the d×m slice `K[i, :, :]` maps `(h, u)` to
 * the bilinear contribution `Σ_{j,k} K[i,j,k] · h[j] · u[k]`.
 */
export type BilinearOperator = readonly number[];

/**
 * A Koopman update parameterised by `(A, K, d, m)` and a descriptive name.
 *
 * Invariants enforced by {@link validate}:
 *   - `stateDim > 0` and `inputDim > 0`
 *   - `A.length === stateDim * stateDim`
 *   - `K.length === stateDim * stateDim * inputDim`
 *   - All entries finite
 */
export interface KoopmanOperator {
  readonly stateDim: number; // d
  readonly inputDim: number; // m
  readonly A: LinearOperator;
  readonly K: BilinearOperator;
  readonly name: string;
}

/** Spectral data for the linear part of an operator. */
export interface OperatorSpectrum {
  /** Approximate max singular value of `A` via power iteration on `A^T A`. */
  readonly maxSingularValue: number;
  /** Lower-bound proxy; power iteration does not cheaply produce σ_min. */
  readonly minSingularValue: number;
  /** True iff `maxSingularValue ≤ 1` (non-expansive linear part). */
  readonly stable: boolean;
}

/**
 * Result of {@link compose}.
 *
 * Honest stance: Koopman bilinear composition is **not closed in general** —
 * composing two updates `h → Ah + h^⊤ K u` produces purely-quadratic-in-`h`
 * terms that exit the bilinear class. `compose()` therefore returns a
 * principled truncation (linear part is exact, bilinear keeps the dominant
 * `A_g · K_f` cross term) and surfaces a warning.
 */
export interface CompositionResult {
  readonly op: KoopmanOperator;
  readonly warnings: readonly string[];
}

/** Output of a memory-retention predicate. */
export interface RetentionResult {
  readonly ok: boolean;
  readonly finalNorm?: number;
  readonly violations?: readonly string[];
}

/** Shape-only snapshot produced by {@link stateToMemorySnapshot}. */
export interface MemoryStateSnapshot {
  readonly dimension: number;
  readonly values: readonly number[];
}

/** Output of {@link validate}. */
export interface ValidationResult {
  readonly ok: boolean;
  readonly violations: readonly string[];
}
