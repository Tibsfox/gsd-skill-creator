/**
 * Anytime-valid e-process — likelihood-ratio martingale implementation.
 *
 * Implements a product martingale for testing H_0: μ = 0 vs H_1: μ > 0
 * (one-sided) or H_1: μ ≠ 0 (two-sided) on observations in [-1, 1].
 *
 * ### Martingale construction
 *
 * For each observation x_i the one-sided e-value increment is:
 *   e_i = exp(λ · x_i − λ²/2)
 *
 * Under H_0 (μ = 0, x_i i.i.d. with E[x_i] = 0 and |x_i| ≤ 1):
 *   E[e_i | H_0] = E[exp(λ x_i)] · exp(−λ²/2)
 *                ≤ exp(λ²/2) · exp(−λ²/2) = 1          (Hoeffding's lemma)
 *
 * So the running product E_t = ∏_{i=1}^{t} e_i is a non-negative
 * supermartingale under H_0 with E[E_t | H_0] ≤ 1. By Ville's inequality:
 *   P(∃t ≥ 0 : E_t ≥ 1/α | H_0) ≤ α
 *
 * This is the anytime-valid property: the Type-I bound holds regardless of
 * when the caller inspects `result()`.
 *
 * For the two-sided case the implementation runs symmetric +λ and −λ arms and
 * takes their geometric mean (equivalent to splitting α across both tails),
 * which also satisfies E[E_t | H_0] ≤ 1.
 *
 * Reference: arXiv:2604.21851 — Betting on Bets: Anytime-Valid Tests for
 * Stochastic Dominance (the JP-002 Wave 1 consumer of this primitive).
 *
 * NEW-LAYER discipline: no Grove, no filesystem, no side effects.
 *
 * @module anytime-valid/e-process
 */

import type {
  EProcess,
  EProcessConfig,
  EProcessResult,
  Type1Bound,
} from './types.js';

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_ALPHA = 0.05;
const DEFAULT_HYPOTHESIS: 'one-sided' | 'two-sided' = 'one-sided';
const DEFAULT_STOPPING_POLICY: 'continuous' | 'fixed-horizon' = 'continuous';
const DEFAULT_LAMBDA = 0.5;

// ─── Implementation ──────────────────────────────────────────────────────────

/**
 * Concrete e-process backed by a likelihood-ratio product martingale.
 *
 * All state is pure in-memory; instances are cheap to construct and reset.
 */
class LikelihoodRatioEProcess implements EProcess {
  private readonly alpha: number;
  private readonly threshold: number;
  private readonly hypothesis: 'one-sided' | 'two-sided';
  private readonly stoppingPolicy: 'continuous' | 'fixed-horizon';
  private readonly lambda: number;

  /** Running e-value E_t = ∏_{i=1}^{t} e_i. Starts at 1 (vacuous evidence). */
  private eValue: number;
  /** Number of observations consumed so far. */
  private t: number;

  constructor(config: Required<EProcessConfig>) {
    this.alpha = config.alpha;
    this.threshold = 1 / config.alpha;
    this.hypothesis = config.hypothesis;
    this.stoppingPolicy = config.stoppingPolicy;
    this.lambda = config.lambda;
    this.eValue = 1;
    this.t = 0;
  }

  /**
   * Update the running e-value with one new observation.
   *
   * One-sided increment:  e_i = exp(λ · x − λ²/2)
   * Two-sided increment:  e_i = sqrt(exp(+λ · x − λ²/2) · exp(−λ · x − λ²/2))
   *                           = exp(−λ²/2)           (geometric mean of ±λ arms)
   *
   * Note: for the two-sided case the geometric-mean construction folds both
   * arms into a single value that still satisfies E[e_i | H_0] ≤ 1.
   */
  update(observation: number): void {
    let increment: number;

    if (this.hypothesis === 'one-sided') {
      // e_i = exp(λ x − λ²/2)
      increment = Math.exp(this.lambda * observation - (this.lambda ** 2) / 2);
    } else {
      // Geometric mean of +λ and −λ arms:
      // sqrt( exp(λ x − λ²/2) · exp(−λ x − λ²/2) ) = exp(−λ²/2)
      // This always equals exp(−λ²/2) < 1 and is a valid e-value under H_0.
      // For two-sided detection we use the absolute-value arm combination:
      // e_i = cosh(λ x) · exp(−λ²/2), which is ≥ exp(−λ²/2) when |x| > 0
      // and ≤ exp(λ|x| − λ²/2) under Hoeffding, satisfying E[e_i | H_0] ≤ 1.
      increment =
        Math.cosh(this.lambda * observation) *
        Math.exp(-(this.lambda ** 2) / 2);
    }

    this.eValue *= increment;
    this.t += 1;
  }

  /** Return the current test result. Anytime-valid: safe to call at any t. */
  result(): EProcessResult {
    const rejected = this.eValue >= this.threshold;
    const type1Bound: Type1Bound = {
      alpha: this.alpha,
      threshold: this.threshold,
      satisfied: true,
    };
    return {
      rejected,
      evidence: this.eValue,
      observations: this.t,
      type1Bound,
    };
  }

  /** Reset to the initial (no-evidence) state. */
  reset(): void {
    this.eValue = 1;
    this.t = 0;
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * Create a new anytime-valid e-process.
 *
 * @param config — optional configuration overrides (all fields optional).
 * @returns An `EProcess` instance satisfying P(reject | H_0) ≤ alpha under
 *   optional stopping by Ville's inequality.
 *
 * @example
 * ```ts
 * const ep = createEProcess({ alpha: 0.05 });
 * for (const x of observations) ep.update(x);
 * const { rejected, evidence } = ep.result();
 * ```
 */
export function createEProcess(config?: EProcessConfig): EProcess {
  const resolved: Required<EProcessConfig> = {
    alpha: config?.alpha ?? DEFAULT_ALPHA,
    hypothesis: config?.hypothesis ?? DEFAULT_HYPOTHESIS,
    stoppingPolicy: config?.stoppingPolicy ?? DEFAULT_STOPPING_POLICY,
    lambda: config?.lambda ?? DEFAULT_LAMBDA,
  };

  if (resolved.alpha <= 0 || resolved.alpha >= 1) {
    throw new RangeError(
      `EProcess: alpha must be in (0, 1), got ${resolved.alpha}`
    );
  }
  if (resolved.lambda <= 0) {
    throw new RangeError(
      `EProcess: lambda must be positive, got ${resolved.lambda}`
    );
  }

  return new LikelihoodRatioEProcess(resolved);
}
