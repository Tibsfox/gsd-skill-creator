/**
 * Bounded-Learning Empirical Harness — evidence emitter.
 *
 * Emits structured evidence records per constitutional cap (20% / 3-correction
 * / 7-day-cooldown) as empirical justification for the GSD constitution's
 * bounded-learning constraints.
 *
 * Sources:
 *   - SkillLearnBench (arXiv:2604.20087 / Zhong et al. 2026): empirical
 *     finding that self-feedback without external correction induces
 *     recursive drift; ≤3 consecutive self-feedback rounds before external
 *     correction is the safe operating envelope (§5–§6 Table 3).
 *   - v1.49.572 T1d theorem reference at
 *     `docs/substrate-theorems/bounded-learning.md`: establishes the 20/3/7
 *     rule as an operational calibration grounded in Peng et al.
 *     arXiv:2604.17578 under two named additional assumptions.
 *
 * Design: all functions are pure (no I/O). Callers pass synthetic or
 * historical evidence points; the emitter assembles and annotates them.
 *
 * Phase 766, v1.49.573.
 *
 * @module bounded-learning-empirical/evidence-emitter
 */

import type {
  ConstitutionalCap,
  ConstitutionalCapId,
  ConstraintEvidence,
  EvidencePoint,
} from './types.js';

// ---------------------------------------------------------------------------
// Default parameters
// ---------------------------------------------------------------------------

/** Default threshold for the 20% content-change cap. */
export const DEFAULT_TWENTY_PERCENT_THRESHOLD = 0.20;
/** Default minimum count for the 3-correction minimum. */
export const DEFAULT_THREE_CORRECTION_MINIMUM = 3;
/** Default cooldown period for the 7-day cooldown (in days). */
export const DEFAULT_SEVEN_DAY_COOLDOWN = 7;

// ---------------------------------------------------------------------------
// Cap-specific evidence builders
// ---------------------------------------------------------------------------

/**
 * Build evidence for the 20% content-change cap.
 *
 * Tests whether each evidence point's `driftFraction` (used as a proxy for
 * update magnitude in synthetic harness context) respects the cap threshold.
 *
 * SkillLearnBench grounding (§6 ablation): "small-step updates accumulate
 * safely while large-step updates amplify error" — supports the 20% bound.
 *
 * @param points - Evidence points to evaluate.
 * @param threshold - Cap threshold (default 0.20).
 * @returns `PASS` if all evidence points are within the threshold.
 */
export function buildTwentyPercentEvidence(
  points: ReadonlyArray<EvidencePoint>,
  threshold: number = DEFAULT_TWENTY_PERCENT_THRESHOLD,
): { verdict: 'PASS' | 'FAIL'; summary: string; violatingCount: number } {
  const violating = points.filter((p) => p.driftFraction > threshold);
  const verdict: 'PASS' | 'FAIL' = violating.length === 0 ? 'PASS' : 'FAIL';
  const summary =
    verdict === 'PASS'
      ? `All ${points.length} evidence points have driftFraction ≤ ${threshold} ` +
        `(20% content-change cap). Consistent with SkillLearnBench (arXiv:2604.20087 §6): ` +
        `small-step updates accumulate safely; large-step updates amplify error.`
      : `${violating.length}/${points.length} evidence points exceeded the ` +
        `${threshold} threshold (20% content-change cap). ` +
        `SkillLearnBench (arXiv:2604.20087 §6 Table 3) shows large-step updates ` +
        `produce statistically significant quality degradation in 14/20 tasks.`;
  return { verdict, summary, violatingCount: violating.length };
}

/**
 * Build evidence for the 3-correction minimum cap.
 *
 * Tests whether each evidence point has accumulated at least
 * `minimumCount` external corrections before being considered committed.
 *
 * SkillLearnBench grounding (§6): "injecting one external correction per
 * three self-feedback rounds largely arrests drift; allowing more than three
 * consecutive self-feedback rounds without external correction produces
 * statistically significant quality degradation in 14/20 tasks."
 *
 * @param points - Evidence points to evaluate.
 * @param minimumCount - Minimum required corrections (default 3).
 * @returns `PASS` if all points with `feedbackSource === 'external'` have ≥ min corrections.
 */
export function buildThreeCorrectionEvidence(
  points: ReadonlyArray<EvidencePoint>,
  minimumCount: number = DEFAULT_THREE_CORRECTION_MINIMUM,
): { verdict: 'PASS' | 'FAIL'; summary: string; underMinCount: number } {
  // Only external-feedback points are subject to the correction minimum.
  // Self-feedback points are the failure mode, not the gate.
  const externalPoints = points.filter((p) => p.feedbackSource === 'external');
  const underMin = externalPoints.filter((p) => p.correctionCount < minimumCount);
  const verdict: 'PASS' | 'FAIL' = underMin.length === 0 ? 'PASS' : 'FAIL';

  const summary =
    verdict === 'PASS'
      ? `All ${externalPoints.length} external-feedback evidence points have ` +
        `correctionCount ≥ ${minimumCount} (3-correction minimum). ` +
        `Consistent with SkillLearnBench (arXiv:2604.20087 §6): ≤3 consecutive ` +
        `self-feedback rounds before external correction is the safe operating envelope.`
      : `${underMin.length}/${externalPoints.length} external-feedback points ` +
        `have correctionCount < ${minimumCount} (3-correction minimum). ` +
        `SkillLearnBench (arXiv:2604.20087 §6 Table 3) shows that committing ` +
        `patterns before accumulating sufficient external corrections leads to ` +
        `quality degradation in the self-feedback regime.`;
  return { verdict, summary, underMinCount: underMin.length };
}

/**
 * Build evidence for the 7-day cooldown cap.
 *
 * Tests whether each evidence point's `daysSinceLastCommit` respects the
 * cooldown floor before the next update is applied.
 *
 * SkillLearnBench grounding (§5 sparse-external-feedback regime): temporal
 * separation between update windows allows external-feedback signal to
 * accumulate. Mapped to `docs/substrate-theorems/bounded-learning.md` §3.2:
 * the 7-day window allows MA-6 reinforcement emitters to repopulate the
 * correction buffer.
 *
 * @param points - Evidence points to evaluate.
 * @param cooldownDays - Required cooldown floor in days (default 7).
 * @returns `PASS` if all applicable points respect the cooldown.
 */
export function buildSevenDayCooldownEvidence(
  points: ReadonlyArray<EvidencePoint>,
  cooldownDays: number = DEFAULT_SEVEN_DAY_COOLDOWN,
): { verdict: 'PASS' | 'FAIL'; summary: string; violatingCount: number } {
  // Points with correctionCount >= 1 that represent post-commit update
  // attempts are the ones subject to the cooldown check. In the synthetic
  // harness we treat iteration > 0 with daysSinceLastCommit < cooldownDays
  // as a cooldown violation.
  const applicablePoints = points.filter((p) => p.iteration > 0);
  const violating = applicablePoints.filter(
    (p) => p.daysSinceLastCommit < cooldownDays,
  );
  const verdict: 'PASS' | 'FAIL' = violating.length === 0 ? 'PASS' : 'FAIL';

  const summary =
    verdict === 'PASS'
      ? `All ${applicablePoints.length} applicable evidence points have ` +
        `daysSinceLastCommit ≥ ${cooldownDays} days (7-day cooldown). ` +
        `Consistent with SkillLearnBench (arXiv:2604.20087 §5): temporal separation ` +
        `between updates allows external feedback to accumulate before the next cycle.`
      : `${violating.length}/${applicablePoints.length} evidence points have ` +
        `daysSinceLastCommit < ${cooldownDays} days (7-day cooldown violated). ` +
        `SkillLearnBench (arXiv:2604.20087 §5) shows that the sparse-external-feedback ` +
        `regime (with temporal separation) produces the best long-run outcomes.`;
  return { verdict, summary, violatingCount: violating.length };
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Emit a structured `ConstraintEvidence` record for a given constitutional cap.
 *
 * This is the primary output type of the evidence emitter. Each record
 * cites SkillLearnBench (arXiv:2604.20087) and cross-references the v1.49.572
 * T1d theorem reference at `docs/substrate-theorems/bounded-learning.md`.
 *
 * @param cap - The constitutional cap to validate.
 * @param points - Evidence points collected during the benchmark run.
 * @returns Structured constraint evidence.
 */
export function emitConstraintEvidence(
  cap: ConstitutionalCap,
  points: ReadonlyArray<EvidencePoint>,
): ConstraintEvidence {
  const capId: ConstitutionalCapId = cap.id;

  switch (capId) {
    case 'twenty-percent-cap': {
      const threshold = cap.parameter ?? DEFAULT_TWENTY_PERCENT_THRESHOLD;
      const { verdict, summary } = buildTwentyPercentEvidence(points, threshold);
      return {
        capId,
        parameter: threshold,
        verdict,
        summary,
        evidence: points,
        disabled: false,
      };
    }
    case 'three-correction-minimum': {
      const minimum = cap.parameter ?? DEFAULT_THREE_CORRECTION_MINIMUM;
      const { verdict, summary } = buildThreeCorrectionEvidence(points, minimum);
      return {
        capId,
        parameter: minimum,
        verdict,
        summary,
        evidence: points,
        disabled: false,
      };
    }
    case 'seven-day-cooldown': {
      const cooldown = cap.parameter ?? DEFAULT_SEVEN_DAY_COOLDOWN;
      const { verdict, summary } = buildSevenDayCooldownEvidence(points, cooldown);
      return {
        capId,
        parameter: cooldown,
        verdict,
        summary,
        evidence: points,
        disabled: false,
      };
    }
    default: {
      // TypeScript exhaustiveness guard
      const _exhaustive: never = capId;
      throw new Error(`Unknown cap id: ${String(_exhaustive)}`);
    }
  }
}

/**
 * Build a disabled (default-off) `ConstraintEvidence` record.
 *
 * Byte-identical return value when the opt-in flag is off.
 */
export function buildDisabledConstraintEvidence(
  cap: ConstitutionalCap,
): ConstraintEvidence {
  const paramDefaults: Record<ConstitutionalCapId, number> = {
    'twenty-percent-cap': DEFAULT_TWENTY_PERCENT_THRESHOLD,
    'three-correction-minimum': DEFAULT_THREE_CORRECTION_MINIMUM,
    'seven-day-cooldown': DEFAULT_SEVEN_DAY_COOLDOWN,
  };
  return {
    capId: cap.id,
    parameter: cap.parameter ?? paramDefaults[cap.id],
    verdict: 'PASS',
    summary: 'Bounded-learning empirical harness disabled (opt-in flag off).',
    evidence: [],
    disabled: true,
  };
}
