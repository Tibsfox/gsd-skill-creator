/**
 * 3-correction minimum cap evidence tests.
 *
 * Verifies that `buildThreeCorrectionEvidence` correctly:
 *   - emits PASS when all external-feedback points have ≥ 3 corrections
 *   - emits FAIL when any external-feedback point has < 3 corrections
 *   - ignores self-feedback points (they are the failure mode, not the gate)
 *   - uses the correct default minimum (3)
 *   - accepts a custom minimum parameter
 *   - cites SkillLearnBench (arXiv:2604.20087 §6) in the summary
 *
 * SkillLearnBench grounding (§6): "injecting one external correction per
 * three self-feedback rounds largely arrests drift; allowing more than three
 * consecutive self-feedback rounds without external correction produces
 * statistically significant quality degradation in 14/20 tasks."
 */

import { describe, it, expect } from 'vitest';
import {
  buildThreeCorrectionEvidence,
  DEFAULT_THREE_CORRECTION_MINIMUM,
} from '../evidence-emitter.js';
import type { EvidencePoint } from '../types.js';

function makeExternalPoint(correctionCount: number, i = 0): EvidencePoint {
  return {
    iteration: i,
    taskId: `task-${i}`,
    feedbackSource: 'external',
    driftFraction: 0.05,
    correctionCount,
    daysSinceLastCommit: 7,
  };
}

function makeSelfPoint(correctionCount: number, i = 0): EvidencePoint {
  return {
    iteration: i,
    taskId: `task-${i}`,
    feedbackSource: 'self',
    driftFraction: 0.10,
    correctionCount,
    daysSinceLastCommit: 2,
  };
}

describe('buildThreeCorrectionEvidence', () => {
  it('returns PASS when all external points have ≥ 3 corrections', () => {
    const points = [
      makeExternalPoint(3, 0),
      makeExternalPoint(4, 1),
      makeExternalPoint(10, 2),
    ];
    const { verdict } = buildThreeCorrectionEvidence(points);
    expect(verdict).toBe('PASS');
  });

  it('returns FAIL when any external point has < 3 corrections', () => {
    const points = [
      makeExternalPoint(3, 0),
      makeExternalPoint(1, 1), // below minimum
    ];
    const { verdict, underMinCount } = buildThreeCorrectionEvidence(points);
    expect(verdict).toBe('FAIL');
    expect(underMinCount).toBe(1);
  });

  it('ignores self-feedback points regardless of correction count', () => {
    // Self-feedback points with 0 corrections should not trigger FAIL
    const points = [
      makeSelfPoint(0, 0), // self — ignored
      makeSelfPoint(0, 1), // self — ignored
      makeExternalPoint(5, 2), // external — passes
    ];
    const { verdict } = buildThreeCorrectionEvidence(points);
    expect(verdict).toBe('PASS');
  });

  it('uses DEFAULT_THREE_CORRECTION_MINIMUM = 3 as default', () => {
    expect(DEFAULT_THREE_CORRECTION_MINIMUM).toBe(3);
    // Point with exactly 3 corrections
    const { verdict } = buildThreeCorrectionEvidence([makeExternalPoint(3, 0)]);
    expect(verdict).toBe('PASS');
    // Point with 2 corrections
    const { verdict: v2 } = buildThreeCorrectionEvidence([makeExternalPoint(2, 0)]);
    expect(v2).toBe('FAIL');
  });

  it('accepts a custom minimum parameter', () => {
    const points = [makeExternalPoint(2, 0)];
    // Custom minimum of 2 — passes
    const { verdict } = buildThreeCorrectionEvidence(points, 2);
    expect(verdict).toBe('PASS');
    // Custom minimum of 5 — fails
    const { verdict: v2 } = buildThreeCorrectionEvidence(points, 5);
    expect(v2).toBe('FAIL');
  });

  it('PASS summary cites arXiv:2604.20087', () => {
    const { summary } = buildThreeCorrectionEvidence([makeExternalPoint(3, 0)]);
    expect(summary).toContain('arXiv:2604.20087');
  });

  it('FAIL summary cites arXiv:2604.20087', () => {
    const { summary } = buildThreeCorrectionEvidence([makeExternalPoint(1, 0)]);
    expect(summary).toContain('arXiv:2604.20087');
  });

  it('returns 0 underMinCount when all external points pass', () => {
    const { underMinCount } = buildThreeCorrectionEvidence([
      makeExternalPoint(3),
      makeExternalPoint(7),
    ]);
    expect(underMinCount).toBe(0);
  });

  it('handles empty evidence array (vacuously PASS)', () => {
    const { verdict, underMinCount } = buildThreeCorrectionEvidence([]);
    expect(verdict).toBe('PASS');
    expect(underMinCount).toBe(0);
  });

  it('handles only self-feedback points (no external points to check — vacuously PASS)', () => {
    const points = [makeSelfPoint(0, 0), makeSelfPoint(0, 1)];
    const { verdict, underMinCount } = buildThreeCorrectionEvidence(points);
    expect(verdict).toBe('PASS');
    expect(underMinCount).toBe(0);
  });
});
