/**
 * 7-day cooldown cap evidence tests.
 *
 * Verifies that `buildSevenDayCooldownEvidence` correctly:
 *   - emits PASS when all post-iteration-0 points have daysSinceLastCommit ≥ 7
 *   - emits FAIL when any post-iteration-0 point has daysSinceLastCommit < 7
 *   - skips iteration 0 points (same-day commit is allowed)
 *   - uses the correct default cooldown (7 days)
 *   - accepts a custom cooldown parameter
 *   - cites SkillLearnBench (arXiv:2604.20087 §5) in the summary
 *
 * SkillLearnBench grounding (§5 sparse-external-feedback regime): temporal
 * separation between update windows allows external-feedback signal to
 * accumulate before the next self-feedback cycle is permitted. Mapped to
 * `docs/substrate-theorems/bounded-learning.md` §3.2: the 7-day cooldown
 * enforces H3/H4 (memory buffer and data-dependent weights) from Peng et al.
 * (arXiv:2604.17578).
 */

import { describe, it, expect } from 'vitest';
import {
  buildSevenDayCooldownEvidence,
  DEFAULT_SEVEN_DAY_COOLDOWN,
} from '../evidence-emitter.js';
import type { EvidencePoint } from '../types.js';

function makePoint(
  iteration: number,
  daysSinceLastCommit: number,
): EvidencePoint {
  return {
    iteration,
    taskId: `task-${iteration}`,
    feedbackSource: 'external',
    driftFraction: 0.05,
    correctionCount: 3,
    daysSinceLastCommit,
  };
}

describe('buildSevenDayCooldownEvidence', () => {
  it('returns PASS when all post-iteration-0 points have ≥ 7 days since commit', () => {
    const points = [
      makePoint(0, 0), // iteration 0 — skipped
      makePoint(1, 7), // exactly at boundary
      makePoint(2, 14),
    ];
    const { verdict } = buildSevenDayCooldownEvidence(points);
    expect(verdict).toBe('PASS');
  });

  it('returns FAIL when any post-iteration-0 point has < 7 days since commit', () => {
    const points = [
      makePoint(0, 0), // skipped
      makePoint(1, 3), // violation: only 3 days
      makePoint(2, 8),
    ];
    const { verdict, violatingCount } = buildSevenDayCooldownEvidence(points);
    expect(verdict).toBe('FAIL');
    expect(violatingCount).toBe(1);
  });

  it('skips iteration 0 (same-day commit is always allowed)', () => {
    // Only iteration 0 points — all skipped, vacuously PASS
    const points = [makePoint(0, 0), makePoint(0, 1)];
    const { verdict } = buildSevenDayCooldownEvidence(points);
    expect(verdict).toBe('PASS');
  });

  it('uses DEFAULT_SEVEN_DAY_COOLDOWN = 7 as default', () => {
    expect(DEFAULT_SEVEN_DAY_COOLDOWN).toBe(7);
    // Exactly 7 days — passes
    const { verdict } = buildSevenDayCooldownEvidence([makePoint(1, 7)]);
    expect(verdict).toBe('PASS');
    // 6 days — fails
    const { verdict: v2 } = buildSevenDayCooldownEvidence([makePoint(1, 6)]);
    expect(v2).toBe('FAIL');
  });

  it('accepts a custom cooldown parameter', () => {
    const points = [makePoint(1, 3)];
    // 3-day custom cooldown — passes
    const { verdict } = buildSevenDayCooldownEvidence(points, 3);
    expect(verdict).toBe('PASS');
    // 5-day custom cooldown — fails
    const { verdict: v2 } = buildSevenDayCooldownEvidence(points, 5);
    expect(v2).toBe('FAIL');
  });

  it('PASS summary cites arXiv:2604.20087', () => {
    const points = [makePoint(0, 0), makePoint(1, 8)];
    const { summary } = buildSevenDayCooldownEvidence(points);
    expect(summary).toContain('arXiv:2604.20087');
  });

  it('FAIL summary cites arXiv:2604.20087', () => {
    const points = [makePoint(1, 2)]; // violation
    const { summary } = buildSevenDayCooldownEvidence(points);
    expect(summary).toContain('arXiv:2604.20087');
  });

  it('returns 0 violatingCount when all applicable points pass', () => {
    const points = [makePoint(0, 0), makePoint(1, 10), makePoint(2, 14)];
    const { violatingCount } = buildSevenDayCooldownEvidence(points);
    expect(violatingCount).toBe(0);
  });

  it('handles empty evidence array (vacuously PASS)', () => {
    const { verdict, violatingCount } = buildSevenDayCooldownEvidence([]);
    expect(verdict).toBe('PASS');
    expect(violatingCount).toBe(0);
  });

  it('counts all violating points (not just the first)', () => {
    const points = [
      makePoint(1, 1),
      makePoint(2, 2),
      makePoint(3, 3),
    ];
    const { verdict, violatingCount } = buildSevenDayCooldownEvidence(points);
    expect(verdict).toBe('FAIL');
    expect(violatingCount).toBe(3);
  });
});
