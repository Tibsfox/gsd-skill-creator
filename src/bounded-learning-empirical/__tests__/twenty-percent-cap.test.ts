/**
 * 20% content-change cap evidence tests.
 *
 * Verifies that `buildTwentyPercentEvidence` correctly:
 *   - emits PASS when all evidence points are within the 20% threshold
 *   - emits FAIL when any evidence point exceeds the threshold
 *   - uses the correct default threshold (0.20)
 *   - accepts a custom threshold parameter
 *   - cites SkillLearnBench (arXiv:2604.20087 §6) in the summary
 *
 * SkillLearnBench grounding: §6 ablation shows that "small-step updates
 * accumulate safely while large-step updates amplify error" — empirical
 * support for the 20% content-change cap.
 */

import { describe, it, expect } from 'vitest';
import {
  buildTwentyPercentEvidence,
  DEFAULT_TWENTY_PERCENT_THRESHOLD,
} from '../evidence-emitter.js';
import type { EvidencePoint } from '../types.js';

function makePoint(driftFraction: number, i = 0): EvidencePoint {
  return {
    iteration: i,
    taskId: `task-${i}`,
    feedbackSource: 'external',
    driftFraction,
    correctionCount: 1,
    daysSinceLastCommit: 7,
  };
}

describe('buildTwentyPercentEvidence', () => {
  it('returns PASS when all points are within the 20% threshold', () => {
    const points = [
      makePoint(0.05, 0),
      makePoint(0.10, 1),
      makePoint(0.18, 2),
      makePoint(0.20, 3), // exactly at threshold
    ];
    const { verdict } = buildTwentyPercentEvidence(points);
    expect(verdict).toBe('PASS');
  });

  it('returns FAIL when any point exceeds the 20% threshold', () => {
    const points = [
      makePoint(0.10, 0),
      makePoint(0.25, 1), // exceeds 0.20
    ];
    const { verdict, violatingCount } = buildTwentyPercentEvidence(points);
    expect(verdict).toBe('FAIL');
    expect(violatingCount).toBe(1);
  });

  it('uses DEFAULT_TWENTY_PERCENT_THRESHOLD = 0.20 as default', () => {
    expect(DEFAULT_TWENTY_PERCENT_THRESHOLD).toBe(0.20);
    // Points right at the boundary
    const points = [makePoint(0.20, 0)];
    const { verdict } = buildTwentyPercentEvidence(points);
    expect(verdict).toBe('PASS');
  });

  it('accepts a custom threshold parameter', () => {
    const points = [makePoint(0.15, 0)];
    // Custom threshold of 0.10 — 0.15 exceeds it
    const { verdict } = buildTwentyPercentEvidence(points, 0.10);
    expect(verdict).toBe('FAIL');
    // Custom threshold of 0.20 — 0.15 passes
    const { verdict: v2 } = buildTwentyPercentEvidence(points, 0.20);
    expect(v2).toBe('PASS');
  });

  it('PASS summary cites arXiv:2604.20087', () => {
    const { summary } = buildTwentyPercentEvidence([makePoint(0.10, 0)]);
    expect(summary).toContain('arXiv:2604.20087');
  });

  it('FAIL summary cites arXiv:2604.20087', () => {
    const { summary } = buildTwentyPercentEvidence([makePoint(0.30, 0)]);
    expect(summary).toContain('arXiv:2604.20087');
  });

  it('returns 0 violatingCount when all points pass', () => {
    const points = [makePoint(0.05), makePoint(0.15)];
    const { violatingCount } = buildTwentyPercentEvidence(points);
    expect(violatingCount).toBe(0);
  });

  it('handles empty evidence array (edge case — vacuously PASS)', () => {
    const { verdict, violatingCount } = buildTwentyPercentEvidence([]);
    expect(verdict).toBe('PASS');
    expect(violatingCount).toBe(0);
  });
});
