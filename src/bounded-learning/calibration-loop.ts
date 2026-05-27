/**
 * Bounded-learning calibration loop — core e-process driver.
 *
 * Consumes a sequence of `CalibrationObservation` values, runs them through
 * a pair of anytime-valid one-sided e-processes from `src/anytime-valid/`,
 * and emits a `CalibrationRecommendation` carrying the decision (hold /
 * decrease / increase) plus rejection evidence.
 *
 * ## Why two one-sided e-processes (not one two-sided)
 *
 * Operator decisions on suggestions are binary — accept (+1) or dismiss
 * (-1). The two-sided likelihood-ratio e-process (cosh(λx)·exp(−λ²/2))
 * cannot grow above 1 on observations strictly at |x|=1; for any λ>0,
 * cosh(λ)·exp(−λ²/2) ≤ 1 with equality only at λ=0. So a two-sided
 * martingale is insensitive to unanimous-direction binary sequences.
 *
 * Instead we run two ONE-SIDED e-processes in parallel:
 *
 *   - `epPositive` — tests H_1: μ>0 (accept-skew) with observations as-is.
 *     Rejection ⇒ recommend DECREASE threshold (more accepts than expected).
 *   - `epNegative` — tests H_1: μ>0 with sign-flipped observations.
 *     Rejection ⇒ recommend INCREASE threshold (more dismisses than expected).
 *
 * Each runs at α/2 so the union rejection rate is bounded by α
 * (Bonferroni). The directional rejection that fires (or neither) drives
 * the recommendation.
 *
 * ## Single-step adjustment
 *
 * When the loop recommends a change, the proposed new value is
 * `currentValue ± 1` clamped at 1. Larger steps require more accumulated
 * evidence — out of scope for ship 1.
 *
 * @module bounded-learning/calibration-loop
 */

import { createEProcess } from '../anytime-valid/index.js';
import type {
  AdjustmentDirection,
  CalibrationLoopConfig,
  CalibrationObservation,
  CalibrationRecommendation,
  CalibratableThreshold,
} from './types.js';

const DEFAULT_ALPHA = 0.05;
const DEFAULT_LAMBDA = 0.5;

/**
 * Floor for thresholds where 0 would degrade the surface (e.g. you cannot
 * have `min_occurrences < 1` because zero would surface every pattern).
 */
const ABSOLUTE_FLOOR = 1;

function proposeNewValue(
  currentValue: number,
  direction: AdjustmentDirection,
): number | null {
  if (direction === 'hold') return null;
  if (direction === 'decrease') return Math.max(ABSOLUTE_FLOOR, currentValue - 1);
  return currentValue + 1;
}

function buildReason(
  direction: AdjustmentDirection,
  meanObservation: number,
  evidence: number,
  rejectionThreshold: number,
  observations: number,
  currentValue: number,
  proposedValue: number | null,
): string {
  if (direction === 'hold' || proposedValue === null) {
    if (observations === 0) {
      return 'No terminal accept/dismiss observations yet; threshold held at ' +
        `${currentValue}. Run \`/sc:suggest\` to accumulate acceptance data.`;
    }
    return `Insufficient evidence to recommend a change after ${observations} ` +
      `observation(s). Max one-sided evidence ${evidence.toFixed(4)} < threshold ` +
      `${rejectionThreshold.toFixed(4)} (α/2 = ${(rejectionThreshold === 0 ? 0 : 1 / rejectionThreshold).toFixed(4)}). ` +
      `Threshold held at ${currentValue}.`;
  }
  const directionLabel = direction === 'decrease' ? 'lower' : 'raise';
  const polarity = meanObservation > 0
    ? `${meanObservation.toFixed(3)} (accept skew)`
    : `${meanObservation.toFixed(3)} (dismiss skew)`;
  return `After ${observations} observation(s) with mean ${polarity}, ` +
    `directional evidence ${evidence.toFixed(4)} ≥ rejection threshold ` +
    `${rejectionThreshold.toFixed(4)}. Recommend ${directionLabel} ` +
    `threshold from ${currentValue} → ${proposedValue}.`;
}

/**
 * Run the bounded-learning calibration loop against a sequence of
 * observations and return the resulting recommendation.
 *
 * Uses two one-sided e-processes at α/2 each (Bonferroni); see module
 * docstring for the motivation.
 *
 * @param threshold     The configuration threshold being calibrated.
 * @param currentValue  The current value of that threshold (from skill-creator config).
 * @param observations  Sequence of operator decisions mapped to [-1, 1].
 * @param config        Optional e-process tuning (alpha, lambda).
 */
export function runCalibrationLoop(
  threshold: CalibratableThreshold,
  currentValue: number,
  observations: CalibrationObservation[],
  config: CalibrationLoopConfig = {},
): CalibrationRecommendation {
  const alpha = config.alpha ?? DEFAULT_ALPHA;
  const lambda = config.lambda ?? DEFAULT_LAMBDA;
  const perSideAlpha = alpha / 2;

  // ── Two one-sided e-processes, α/2 each (Bonferroni) ──────────────────
  const epPositive = createEProcess({ alpha: perSideAlpha, lambda, hypothesis: 'one-sided' });
  const epNegative = createEProcess({ alpha: perSideAlpha, lambda, hypothesis: 'one-sided' });
  for (const obs of observations) {
    epPositive.update(obs.value);
    epNegative.update(-obs.value);
  }
  const posResult = epPositive.result();
  const negResult = epNegative.result();

  const meanObservation = observations.length === 0
    ? 0
    : observations.reduce((sum, o) => sum + o.value, 0) / observations.length;

  // Determine direction from which side rejected (or neither).
  let direction: AdjustmentDirection;
  let rejected: boolean;
  let evidence: number;

  if (posResult.rejected && !negResult.rejected) {
    direction = 'decrease';
    rejected = true;
    evidence = posResult.evidence;
  } else if (negResult.rejected && !posResult.rejected) {
    direction = 'increase';
    rejected = true;
    evidence = negResult.evidence;
  } else if (posResult.rejected && negResult.rejected) {
    // Pathological: both sides reject (would require very large |x|
    // pattern not achievable with x ∈ {-1, 0, +1}). Hold conservatively
    // since the result is ambiguous.
    direction = 'hold';
    rejected = true;
    evidence = Math.max(posResult.evidence, negResult.evidence);
  } else {
    direction = 'hold';
    rejected = false;
    // Report the larger of the two evidences for the operator-facing
    // "current state" message.
    evidence = Math.max(posResult.evidence, negResult.evidence);
  }

  const rejectionThreshold = posResult.type1Bound.threshold; // = 1 / (α/2)
  const proposedValue = proposeNewValue(currentValue, direction);
  const reason = buildReason(
    direction,
    meanObservation,
    evidence,
    rejectionThreshold,
    posResult.observations,
    currentValue,
    proposedValue,
  );

  return {
    threshold,
    currentValue,
    proposedValue,
    direction,
    rejected,
    evidence,
    rejectionThreshold,
    observations: posResult.observations,
    meanObservation,
    alpha,
    reason,
  };
}
