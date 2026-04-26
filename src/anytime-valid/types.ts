/**
 * Anytime-valid testing primitives — shared interfaces.
 *
 * An anytime-valid test controls Type-I error at every sample size
 * simultaneously, enabling optional stopping without inflating α.
 * The core invariant is Ville's inequality: for any martingale M_t with
 * E[M_t | H_0] ≤ 1 and threshold τ = 1/α, P(∃t: M_t ≥ τ | H_0) ≤ α.
 *
 * Reference: arXiv:2604.21851 — Betting on Bets: Anytime-Valid Tests for
 * Stochastic Dominance.
 *
 * @module anytime-valid/types
 */

// ─── Optional Stopping Policy ───────────────────────────────────────────────

/**
 * Describes the optional-stopping rule applied when checking `result()`.
 *
 * - `'continuous'` — decision can be made after every observation (default).
 * - `'fixed-horizon'` — classic fixed-sample test; optional stopping not used.
 */
export type OptionalStoppingPolicy = 'continuous' | 'fixed-horizon';

// ─── Type-I Bound ────────────────────────────────────────────────────────────

/**
 * Evidence of the Type-I error guarantee at the point of evaluation.
 *
 * The bound `P(reject | H_0) ≤ alpha` holds under the given stopping policy
 * by Ville's inequality applied to the running e-value.
 */
export interface Type1Bound {
  /** The nominal significance level configured for this process. */
  alpha: number;
  /** The rejection threshold derived from α: τ = 1/α. */
  threshold: number;
  /**
   * Whether the anytime-valid invariant is satisfied.
   * Always `true` for a correctly implemented e-process.
   */
  satisfied: boolean;
}

// ─── E-Process Result ────────────────────────────────────────────────────────

/**
 * Snapshot of the running e-process state after the current observations.
 */
export interface EProcessResult {
  /** Whether the null hypothesis is rejected at the configured α level. */
  rejected: boolean;
  /**
   * The running e-value E_t = ∏_{i=1}^{t} e_i.
   * Rejection occurs when E_t ≥ 1/α (Ville's inequality).
   */
  evidence: number;
  /** Number of observations consumed so far. */
  observations: number;
  /** Type-I bound guarantee at the current evidence level. */
  type1Bound: Type1Bound;
}

// ─── E-Process Config ────────────────────────────────────────────────────────

/**
 * Configuration for an e-process instance.
 */
export interface EProcessConfig {
  /**
   * Type-I error level. Default: 0.05.
   * Rejection occurs when the running e-value E_t ≥ 1/alpha.
   */
  alpha?: number;
  /**
   * Hypothesis directionality.
   * - `'one-sided'` — H_1: μ > 0 (default).
   * - `'two-sided'` — H_1: μ ≠ 0 (splits α equally across both tails).
   */
  hypothesis?: 'one-sided' | 'two-sided';
  /**
   * The optional-stopping policy governing when `result()` is consulted.
   * Does not affect the e-process computation; used for documentation in
   * `Type1Bound` and to gate fixed-horizon mode.
   * Default: `'continuous'`.
   */
  stoppingPolicy?: OptionalStoppingPolicy;
  /**
   * Learning-rate parameter λ for the likelihood-ratio martingale
   * e_i = exp(λ · x_i − λ²/2).
   * Positive values tune sensitivity to positive drift. Default: 0.5.
   * For two-sided tests the implementation uses ±λ and takes the geometric
   * mean, so |λ| applies symmetrically.
   */
  lambda?: number;
}

// ─── E-Process Interface ─────────────────────────────────────────────────────

/**
 * An anytime-valid sequential test based on an e-process (product martingale).
 *
 * Under H_0 the sequence (E_t)_{t≥0} is a non-negative supermartingale with
 * E[E_t | H_0] ≤ 1, so by Ville's inequality
 *   P(∃t ≥ 0 : E_t ≥ 1/α | H_0) ≤ α.
 *
 * This means `result().rejected` can be consulted at ANY time without
 * inflating the Type-I error rate — the defining anytime-valid property.
 */
export interface EProcess {
  /**
   * Incorporate one new observation into the running e-value.
   * @param observation — a bounded real number in the domain supported by the
   *   configured hypothesis (typically [-1, 1] for the default martingale).
   */
  update(observation: number): void;
  /**
   * Return the current test result. Safe to call after any number of updates
   * without inflating Type-I error.
   */
  result(): EProcessResult;
  /** Reset the running e-value and observation count to their initial state. */
  reset(): void;
}

// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * Factory function signature for constructing a concrete e-process.
 * Implemented in `e-process.ts`; declared here for interface consumers.
 */
export type CreateEProcess = (config?: EProcessConfig) => EProcess;
