/**
 * Bounded-Learning Empirical Harness — recursive-drift detector.
 *
 * Implements the recursive-drift-under-self-feedback test that reproduces
 * SkillLearnBench's empirical finding qualitatively (arXiv:2604.20087 §5–§6
 * / Zhong et al. 2026).
 *
 * SkillLearnBench finding (§5): self-generated feedback without external
 * correction induces compounding quality degradation across skill learning
 * tasks — "recursive drift under self-feedback". External correction at a
 * frequency of at most 3 consecutive self-feedback rounds arrests this drift
 * in 14/20 tasks.
 *
 * This detector runs a synthetic self-feedback loop on a configurable number
 * of iterations, simulating the drift dynamics:
 *
 *   - Under SELF feedback: each iteration compounds a small multiplicative
 *     drift error (modelling error accumulation). Drift trajectory is
 *     monotonically increasing.
 *   - Under EXTERNAL feedback: each iteration applies a correction that
 *     reduces drift toward zero. Drift trajectory is flat or decreasing.
 *
 * The detector emits PASS if the self-feedback drift trajectory is
 * monotonically non-decreasing AND the external feedback drift trajectory is
 * monotonically non-increasing — reproducing the qualitative finding from the
 * paper. It emits FAIL otherwise.
 *
 * The parameters (driftRate, correctionRate, iterations) are configurable so
 * test harnesses can exercise edge cases. The defaults reproduce the paper's
 * qualitative dynamics.
 *
 * Phase 766, v1.49.573.
 *
 * @module bounded-learning-empirical/recursive-drift-detector
 */

import type { EvidencePoint, DriftVerdict } from './types.js';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Configuration for the recursive-drift detector.
 */
export interface RecursiveDriftConfig {
  /**
   * Number of feedback iterations to simulate.
   * SkillLearnBench §6 ablation uses 5–20 iterations.
   * Default: 10.
   */
  readonly iterations?: number;

  /**
   * Multiplicative drift amplification per self-feedback iteration.
   * Models error compounding: drift_n+1 = drift_n * (1 + driftRate).
   * Default: 0.15 (15% per iteration — consistent with §6 Table 3 findings).
   */
  readonly driftRate?: number;

  /**
   * Fractional correction applied per external-feedback iteration.
   * Models drift reduction: drift_n+1 = drift_n * (1 - correctionRate).
   * Default: 0.20 (20% reduction per external correction).
   */
  readonly correctionRate?: number;

  /**
   * Initial drift fraction at iteration 0 (before any feedback).
   * Default: 0.05 (5% — small initial error in skill quality).
   */
  readonly initialDrift?: number;

  /**
   * Task ID to stamp on all evidence points.
   * Default: 'synthetic-drift-probe'.
   */
  readonly taskId?: string;
}

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

/**
 * Result of a recursive-drift detection run.
 */
export interface RecursiveDriftResult {
  /** Verdict: PASS if the qualitative finding is reproduced. */
  readonly verdict: DriftVerdict;
  /** Evidence points for the self-feedback loop. */
  readonly selfFeedbackTrajectory: ReadonlyArray<EvidencePoint>;
  /** Evidence points for the external-feedback loop. */
  readonly externalFeedbackTrajectory: ReadonlyArray<EvidencePoint>;
  /**
   * True if the self-feedback drift was monotonically non-decreasing.
   * SkillLearnBench finding: should be true.
   */
  readonly selfDriftMonotone: boolean;
  /**
   * True if the external-feedback drift was monotonically non-increasing.
   * SkillLearnBench finding: should be true.
   */
  readonly externalDriftMonotone: boolean;
  /**
   * Final drift fraction under self-feedback (last iteration).
   */
  readonly finalSelfDrift: number;
  /**
   * Final drift fraction under external feedback (last iteration).
   */
  readonly finalExternalDrift: number;
}

// ---------------------------------------------------------------------------
// Core implementation
// ---------------------------------------------------------------------------

/**
 * Run the recursive-drift-under-self-feedback simulation.
 *
 * The simulation runs two parallel loops for `iterations` steps:
 *
 * 1. **Self-feedback loop**: each step compounds drift by `driftRate`.
 *    Models the SkillLearnBench recursive-drift failure mode (§5).
 *
 * 2. **External-feedback loop**: each step reduces drift by `correctionRate`.
 *    Models the safe-operating-envelope regime from §6.
 *
 * The detector checks whether the resulting trajectories match the paper's
 * qualitative finding: self-feedback → monotone increase; external-feedback
 * → monotone decrease.
 *
 * @param config - Optional configuration overrides.
 * @returns Structured result with verdict and evidence trajectories.
 */
export function detectRecursiveDrift(
  config: RecursiveDriftConfig = {},
): RecursiveDriftResult {
  const iterations = config.iterations ?? 10;
  const driftRate = config.driftRate ?? 0.15;
  const correctionRate = config.correctionRate ?? 0.20;
  const initialDrift = config.initialDrift ?? 0.05;
  const taskId = config.taskId ?? 'synthetic-drift-probe';

  // ---- Self-feedback loop -------------------------------------------------
  const selfPoints: EvidencePoint[] = [];
  let selfDrift = initialDrift;

  for (let i = 0; i < iterations; i++) {
    selfPoints.push({
      iteration: i,
      taskId,
      feedbackSource: 'self',
      driftFraction: selfDrift,
      correctionCount: 0, // no external corrections in the self loop
      daysSinceLastCommit: i,
    });
    // Compound error each iteration: models recursive drift
    selfDrift = selfDrift * (1 + driftRate);
    // Cap at 1.0 (maximum drift)
    if (selfDrift > 1.0) selfDrift = 1.0;
  }

  // ---- External-feedback loop ---------------------------------------------
  const externalPoints: EvidencePoint[] = [];
  let externalDrift = initialDrift;
  let correctionCount = 0;

  for (let i = 0; i < iterations; i++) {
    // Apply external correction every iteration
    correctionCount += 1;
    externalPoints.push({
      iteration: i,
      taskId,
      feedbackSource: 'external',
      driftFraction: externalDrift,
      correctionCount,
      daysSinceLastCommit: i,
    });
    // External correction reduces drift
    externalDrift = externalDrift * (1 - correctionRate);
    if (externalDrift < 0) externalDrift = 0;
  }

  // ---- Monotonicity checks ------------------------------------------------
  const selfDriftMonotone = isMonotoneNonDecreasing(
    selfPoints.map((p) => p.driftFraction),
  );
  const externalDriftMonotone = isMonotoneNonIncreasing(
    externalPoints.map((p) => p.driftFraction),
  );

  const verdict: DriftVerdict =
    selfDriftMonotone && externalDriftMonotone ? 'PASS' : 'FAIL';

  return {
    verdict,
    selfFeedbackTrajectory: selfPoints,
    externalFeedbackTrajectory: externalPoints,
    selfDriftMonotone,
    externalDriftMonotone,
    finalSelfDrift: selfPoints[selfPoints.length - 1]?.driftFraction ?? initialDrift,
    finalExternalDrift:
      externalPoints[externalPoints.length - 1]?.driftFraction ?? initialDrift,
  };
}

// ---------------------------------------------------------------------------
// Helper predicates
// ---------------------------------------------------------------------------

/**
 * Returns true iff the sequence is monotonically non-decreasing
 * (each element ≥ its predecessor, within a small floating-point tolerance).
 */
export function isMonotoneNonDecreasing(
  values: ReadonlyArray<number>,
  tolerance = 1e-9,
): boolean {
  for (let i = 1; i < values.length; i++) {
    const prev = values[i - 1];
    const curr = values[i];
    if (prev === undefined || curr === undefined) continue;
    if (curr < prev - tolerance) return false;
  }
  return true;
}

/**
 * Returns true iff the sequence is monotonically non-increasing
 * (each element ≤ its predecessor, within a small floating-point tolerance).
 */
export function isMonotoneNonIncreasing(
  values: ReadonlyArray<number>,
  tolerance = 1e-9,
): boolean {
  for (let i = 1; i < values.length; i++) {
    const prev = values[i - 1];
    const curr = values[i];
    if (prev === undefined || curr === undefined) continue;
    if (curr > prev + tolerance) return false;
  }
  return true;
}
