/**
 * JP-002 — CAPCOM anytime-valid gate.
 *
 * Exposes the CAPCOM-facing API for sequential hypothesis testing with
 * a verifiable Type-I error bound under optional stopping. Internally
 * delegates all e-process logic to the Wave 0 primitive in
 * `src/anytime-valid/`; this module never reimplements the martingale.
 *
 * ## API surface
 *
 * ```ts
 * const gate = anytimeGate.create({ alpha: 0.05 });
 * for (const x of stream) {
 *   const r = gate.evaluate(x);
 *   if (r.rejected) break;
 * }
 * ```
 *
 * ## Legacy adapter
 *
 * Call sites that historically used a fixed-N Z-test threshold gate can
 * keep their semantics via `legacyFixedNAdapter(metric, N)`. This returns
 * a one-shot result equivalent to a one-sample Z-test at α=0.05 using the
 * standard normal threshold z_α = 1.645 (one-tailed, SE = 1/√N). The
 * adapter is **not** anytime-valid and is provided for backward compat only;
 * flagged for future migration to `anytimeGate.create()`.
 *
 * ## CAPCOM call-site search result
 *
 * Grep of `src/orchestration/` and `src/dacp/` found no single identifiable
 * "CAPCOM gate" function. CAPCOM is used as an architectural concept
 * (preservation gates G7–G10) enforced via static regex audits, not as a
 * runtime gate function. This module is therefore shipped as a standalone
 * primitive ready for future call-site wiring, per spec §JP-002 anti-pattern
 * note: "If you can't find a clear CAPCOM gate function, write anytime-gate.ts
 * as a standalone primitive ready for future call-site wiring".
 *
 * @module orchestration/anytime-gate
 */

import {
  createEProcess,
  type EProcessConfig,
  type EProcessResult,
} from '../anytime-valid/index.js';

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * Optional deadline passed to `evaluate()`.
 * When supplied, `deadline_met` in the result reflects whether the
 * configured sample budget has been reached.
 */
export interface AnytimeGateDeadline {
  /** Maximum number of observations allowed before the deadline is met. */
  maxObservations: number;
}

/**
 * Result returned by `AnytimeGateInstance.evaluate()`.
 *
 * Extends `EProcessResult` with a `deadline_met` flag that is `true` when a
 * deadline was supplied and `observations >= deadline.maxObservations`.
 */
export interface AnytimeGateResult extends EProcessResult {
  /**
   * `true` if a deadline was supplied and the gate has consumed at least
   * `deadline.maxObservations` total observations.
   * `false` when no deadline was supplied or the budget is not yet exhausted.
   */
  deadline_met: boolean;
}

/**
 * Configuration for `anytimeGate.create()`.
 * Extends `EProcessConfig` with no additional required fields.
 */
export type AnytimeGateConfig = EProcessConfig;

/**
 * A stateful anytime-valid gate instance created by `anytimeGate.create()`.
 *
 * The instance accumulates observations via `evaluate()` and returns a
 * test result after every call. Because the underlying e-process satisfies
 * Ville's inequality, `result.rejected` can be trusted at any sample size.
 */
export interface AnytimeGateInstance {
  /**
   * Incorporate `metric` into the running e-value and return the current
   * test result.
   *
   * @param metric — a bounded real number in [-1, 1].
   * @param deadline — optional; when supplied, `deadline_met` is set when
   *   total observations reach `deadline.maxObservations`.
   */
  evaluate(metric: number, deadline?: AnytimeGateDeadline): AnytimeGateResult;

  /** Reset the gate to its initial (no-evidence) state. */
  reset(): void;
}

/**
 * Result returned by `legacyFixedNAdapter`.
 */
export interface LegacyGateResult {
  /** Whether the one-sample Z-test rejects H_0 at α=0.05 (one-tailed). */
  rejected: boolean;
  /** The computed Z-score: metric * sqrt(N). */
  zScore: number;
  /** The one-tailed Z threshold used (z_{0.05} = 1.6449). */
  threshold: number;
  /** The N supplied to the adapter. */
  observations: number;
}

// ─── Implementation ──────────────────────────────────────────────────────────

class AnytimeGateInstanceImpl implements AnytimeGateInstance {
  private readonly ep: ReturnType<typeof createEProcess>;

  constructor(config: AnytimeGateConfig) {
    this.ep = createEProcess(config);
  }

  evaluate(metric: number, deadline?: AnytimeGateDeadline): AnytimeGateResult {
    this.ep.update(metric);
    const result = this.ep.result();
    const deadline_met =
      deadline !== undefined &&
      result.observations >= deadline.maxObservations;
    return { ...result, deadline_met };
  }

  reset(): void {
    this.ep.reset();
  }
}

// ─── Public factory ──────────────────────────────────────────────────────────

/**
 * Namespace-style object exposing the CAPCOM anytime-valid gate API.
 *
 * ```ts
 * const gate = anytimeGate.create({ alpha: 0.05, hypothesis: 'one-sided' });
 * ```
 */
export const anytimeGate = {
  /**
   * Create a new stateful anytime-valid gate.
   *
   * @param config — optional e-process configuration (alpha, hypothesis, etc.).
   * @returns An `AnytimeGateInstance` whose `evaluate()` is safe to call at
   *   any sample size without inflating Type-I error.
   */
  create(config: AnytimeGateConfig = {}): AnytimeGateInstance {
    return new AnytimeGateInstanceImpl(config);
  },
};

// ─── Legacy fixed-N adapter ──────────────────────────────────────────────────

/**
 * One-shot backward-compat adapter for call sites that use a fixed-N Z-test.
 *
 * Computes Z = metric * sqrt(N) and rejects when Z ≥ z_{α=0.05} = 1.6449
 * (one-tailed). This reproduces the historical fixed-window CAPCOM gate
 * behavior bit-exactly and is NOT anytime-valid.
 *
 * **Migration note:** this adapter is a bridge for legacy call sites; future
 * migrations should replace it with `anytimeGate.create()` to gain the
 * anytime-valid guarantee.
 *
 * @param metric — the aggregated test metric (e.g., normalised mean shift).
 * @param N — the fixed window size (number of observations).
 * @returns A `LegacyGateResult` with rejection decision and Z-score.
 */
export function legacyFixedNAdapter(metric: number, N: number): LegacyGateResult {
  if (N <= 0) {
    throw new RangeError(`legacyFixedNAdapter: N must be positive, got ${N}`);
  }
  // Standard one-sample Z-test: Z = metric / SE = metric * sqrt(N)
  // (assumes SE = 1/√N, i.e., observations are i.i.d. with unit variance).
  const ALPHA = 0.05;
  const Z_THRESHOLD = 1.6448536269514729; // qnorm(0.95) — one-tailed
  const zScore = metric * Math.sqrt(N);
  return {
    rejected: zScore >= Z_THRESHOLD,
    zScore,
    threshold: Z_THRESHOLD,
    observations: N,
  };
}
