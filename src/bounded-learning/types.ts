/**
 * Bounded-learning calibration loop — shared types.
 *
 * The bounded-learning loop uses an anytime-valid e-process (see
 * `src/anytime-valid/`) to decide when there is statistically sound evidence
 * to recommend a configuration-threshold change. Each candidate threshold
 * gets its own e-process instance; operator decisions on surfaced
 * suggestions are mapped into observations in [-1, 1] and fed into the
 * e-process. When Ville's bound is crossed the loop emits a
 * `CalibrationRecommendation` proposing a single-step adjustment.
 *
 * H_0: the current threshold is balanced — operator accept/dismiss decisions
 *      are symmetric around zero, no systematic mis-calibration.
 * H_1: the threshold is mis-calibrated — there is a directional bias in
 *      operator decisions that indicates the threshold should move.
 *
 * @module bounded-learning/types
 */

/**
 * The operator's decision on a surfaced suggestion. Drawn directly from
 * `.planning/patterns/suggestions.json` entries managed by `/sc:suggest`.
 */
export type SuggestionDecision = 'accepted' | 'dismissed' | 'deferred' | 'pending';

/**
 * Configuration thresholds the loop can calibrate. Wired through the CLI:
 * `suggestions.min_occurrences` (v1.49.795) and `suggestions.cooldown_days`
 * (v1.49.796). Future ships extend to the remaining members.
 */
export type CalibratableThreshold =
  | 'suggestions.min_occurrences'
  | 'suggestions.cooldown_days'
  | 'suggestions.auto_dismiss_after_days'
  | 'token_budget.warn_at_percent'
  | 'token_budget.max_percent'
  | 'observation.retention_days';

/**
 * Direction in which the loop recommends adjusting a threshold.
 *
 * - `'decrease'` — operator decisions skew accept (positive evidence); lower
 *   the threshold so more candidate patterns surface earlier.
 * - `'increase'` — operator decisions skew dismiss (negative evidence); raise
 *   the threshold so fewer noisy patterns surface.
 * - `'hold'` — e-process has not rejected H_0; insufficient evidence to
 *   recommend a change.
 */
export type AdjustmentDirection = 'decrease' | 'increase' | 'hold';

/**
 * A single observation fed into the e-process. Always in [-1, 1].
 */
export interface CalibrationObservation {
  /** The suggestion's stable identifier (forensic-traceable). */
  suggestionId: string;
  /** The operator's decision that produced this observation. */
  decision: SuggestionDecision;
  /** The mapped value: accept=+1, dismiss=-1, defer/pending=0. */
  value: number;
  /** ISO 8601 timestamp of the operator's decision (best-effort). */
  observedAt: string | null;
}

/**
 * Recommendation emitted by the loop after consuming a sequence of
 * observations. Carries enough context for downstream tooling (CLI report,
 * threshold writer, audit log) to act safely.
 */
export interface CalibrationRecommendation {
  /** The threshold the loop ran against. */
  threshold: CalibratableThreshold;
  /** The current value of the threshold (read from skill-creator config). */
  currentValue: number;
  /**
   * The proposed new value. Computed as a single-step adjustment from
   * `currentValue` in the recommended direction. `null` when direction is
   * `'hold'` (no change recommended).
   */
  proposedValue: number | null;
  /** Whether and how to move the threshold. */
  direction: AdjustmentDirection;
  /** Whether the e-process rejected H_0 at the configured alpha. */
  rejected: boolean;
  /** The accumulated e-value at the point of emission. */
  evidence: number;
  /** The rejection threshold derived from alpha (= 1/alpha). */
  rejectionThreshold: number;
  /** Number of observations consumed. */
  observations: number;
  /** Mean of the observation values (positive → favors decrease). */
  meanObservation: number;
  /** Configured alpha (anytime-valid Type-I error level). */
  alpha: number;
  /** Reason string suitable for operator-facing report. */
  reason: string;
}

/**
 * Configuration for `runCalibrationLoop`.
 *
 * `alpha` controls Type-I error; `lambda` tunes martingale sensitivity.
 * Defaults match the underlying e-process defaults (alpha=0.05, lambda=0.5,
 * two-sided hypothesis so positive AND negative drift can both trigger
 * rejection).
 */
export interface CalibrationLoopConfig {
  /** Type-I error level. Default 0.05. */
  alpha?: number;
  /** Likelihood-ratio martingale rate. Default 0.5. */
  lambda?: number;
}
