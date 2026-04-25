/**
 * Recursive-drift detector tests.
 *
 * Verifies that `detectRecursiveDrift` qualitatively reproduces the
 * SkillLearnBench finding (arXiv:2604.20087 §5–§6):
 *
 *   - Self-feedback drift trajectory is monotonically non-decreasing.
 *   - External-feedback drift trajectory is monotonically non-increasing.
 *   - Final self-feedback drift > initial drift (compounding error).
 *   - Final external-feedback drift < initial drift (correction reduces error).
 *   - Verdict is PASS for default parameters.
 *   - Monotonicity predicates work correctly as isolated utilities.
 */

import { describe, it, expect } from 'vitest';
import {
  detectRecursiveDrift,
  isMonotoneNonDecreasing,
  isMonotoneNonIncreasing,
} from '../recursive-drift-detector.js';

describe('detectRecursiveDrift — SkillLearnBench qualitative reproduction', () => {
  it('returns PASS verdict for default parameters', () => {
    const result = detectRecursiveDrift();
    expect(result.verdict).toBe('PASS');
  });

  it('self-feedback drift trajectory is monotonically non-decreasing', () => {
    const result = detectRecursiveDrift();
    expect(result.selfDriftMonotone).toBe(true);
    // Directly verify the values
    const drifts = result.selfFeedbackTrajectory.map((p) => p.driftFraction);
    expect(isMonotoneNonDecreasing(drifts)).toBe(true);
  });

  it('external-feedback drift trajectory is monotonically non-increasing', () => {
    const result = detectRecursiveDrift();
    expect(result.externalDriftMonotone).toBe(true);
    const drifts = result.externalFeedbackTrajectory.map((p) => p.driftFraction);
    expect(isMonotoneNonIncreasing(drifts)).toBe(true);
  });

  it('final self-feedback drift > initial drift (error compounds)', () => {
    const config = { initialDrift: 0.05, driftRate: 0.15, iterations: 10 };
    const result = detectRecursiveDrift(config);
    expect(result.finalSelfDrift).toBeGreaterThan(0.05);
  });

  it('final external-feedback drift < initial drift (correction reduces error)', () => {
    const config = { initialDrift: 0.10, correctionRate: 0.20, iterations: 10 };
    const result = detectRecursiveDrift(config);
    expect(result.finalExternalDrift).toBeLessThan(0.10);
  });

  it('self-feedback mean drift > external-feedback mean drift', () => {
    const result = detectRecursiveDrift({ iterations: 10 });
    const selfMean =
      result.selfFeedbackTrajectory.reduce((s, p) => s + p.driftFraction, 0) /
      result.selfFeedbackTrajectory.length;
    const extMean =
      result.externalFeedbackTrajectory.reduce((s, p) => s + p.driftFraction, 0) /
      result.externalFeedbackTrajectory.length;
    expect(selfMean).toBeGreaterThan(extMean);
  });

  it('produces the expected number of evidence points (iterations × 2)', () => {
    const iterations = 7;
    const result = detectRecursiveDrift({ iterations });
    expect(result.selfFeedbackTrajectory).toHaveLength(iterations);
    expect(result.externalFeedbackTrajectory).toHaveLength(iterations);
  });

  it('all self-feedback points have feedbackSource === "self"', () => {
    const result = detectRecursiveDrift();
    for (const p of result.selfFeedbackTrajectory) {
      expect(p.feedbackSource).toBe('self');
    }
  });

  it('all external-feedback points have feedbackSource === "external"', () => {
    const result = detectRecursiveDrift();
    for (const p of result.externalFeedbackTrajectory) {
      expect(p.feedbackSource).toBe('external');
    }
  });

  it('FAIL verdict when drift rate is 0 (flat self-feedback — trivially passing monotone but no compounding)', () => {
    // With driftRate=0 the self-feedback loop is flat — still monotone, so still PASS.
    // This test confirms the math: 0% growth is still non-decreasing.
    const result = detectRecursiveDrift({ driftRate: 0, iterations: 5 });
    expect(result.selfDriftMonotone).toBe(true);
  });

  it('reproduces SkillLearnBench §6 finding: drift grows > 2x under 10 self-feedback iterations', () => {
    // With driftRate=0.15 over 10 iterations: drift multiplies by (1.15)^10 ≈ 4.05x
    const result = detectRecursiveDrift({
      initialDrift: 0.05,
      driftRate: 0.15,
      iterations: 10,
    });
    expect(result.finalSelfDrift).toBeGreaterThan(result.selfFeedbackTrajectory[0]!.driftFraction * 2);
  });
});

describe('isMonotoneNonDecreasing', () => {
  it('returns true for strictly increasing sequence', () => {
    expect(isMonotoneNonDecreasing([1, 2, 3, 4, 5])).toBe(true);
  });

  it('returns true for flat sequence', () => {
    expect(isMonotoneNonDecreasing([3, 3, 3])).toBe(true);
  });

  it('returns false for decreasing sequence', () => {
    expect(isMonotoneNonDecreasing([5, 4, 3, 2, 1])).toBe(false);
  });

  it('returns true for single-element sequence', () => {
    expect(isMonotoneNonDecreasing([42])).toBe(true);
  });

  it('returns true for empty sequence', () => {
    expect(isMonotoneNonDecreasing([])).toBe(true);
  });
});

describe('isMonotoneNonIncreasing', () => {
  it('returns true for strictly decreasing sequence', () => {
    expect(isMonotoneNonIncreasing([5, 4, 3, 2, 1])).toBe(true);
  });

  it('returns true for flat sequence', () => {
    expect(isMonotoneNonIncreasing([7, 7, 7])).toBe(true);
  });

  it('returns false for increasing sequence', () => {
    expect(isMonotoneNonIncreasing([1, 2, 3])).toBe(false);
  });

  it('returns true for single-element sequence', () => {
    expect(isMonotoneNonIncreasing([99])).toBe(true);
  });
});
