/**
 * skill-promotion — Wave 0 contract tests.
 *
 * Tests:
 *  1. Landauer constant is ≈ 2.871 × 10⁻²¹ J/bit at 300 K.
 *  2. SkillCandidate / ROIBreakdown interface stability (smoke-construct).
 *  3. computeROI produces a correctly-shaped breakdown with correct arithmetic.
 *  4. shouldInstall returns false for Wave 0 placeholder (any input).
 */

import { describe, it, expect } from 'vitest';
import {
  LANDAUER_FLOOR_JPB,
  computeROI,
  shouldInstall,
} from '../index.js';
import type { SkillCandidate, ROIBreakdown } from '../index.js';

// ─── Landauer constant ────────────────────────────────────────────────────────

describe('LANDAUER_FLOOR_JPB', () => {
  it('is approximately k_B * T * ln(2) at T = 300 K', () => {
    // k_B = 1.380649e-23 J/K (exact, 2019 SI)
    // T   = 300 K (room temperature)
    // ln2 = 0.693147...
    // The constant is computed as 1.380649e-23 * 300 * Math.LN2 so the
    // comparison is exact to floating-point precision.
    const expected = 1.380649e-23 * 300 * Math.LN2;
    expect(LANDAUER_FLOOR_JPB).toBe(expected);
  });

  it('is in the range [2.86e-21, 2.88e-21] J/bit', () => {
    expect(LANDAUER_FLOOR_JPB).toBeGreaterThan(2.86e-21);
    expect(LANDAUER_FLOOR_JPB).toBeLessThan(2.88e-21);
  });
});

// ─── Interface stability / smoke-construct ────────────────────────────────────

describe('SkillCandidate interface stability', () => {
  it('constructs a valid SkillCandidate literal with all required fields', () => {
    const candidate: SkillCandidate = {
      id: 'test-skill-001',
      estimatedUses: 100,
      perUseSavingsBits: 50,
      estimatedIK: 1,
    };
    expect(candidate.id).toBe('test-skill-001');
    expect(candidate.estimatedUses).toBe(100);
    expect(candidate.perUseSavingsBits).toBe(50);
    expect(candidate.estimatedIK).toBe(1);
  });

  it('uses estimatedIK = 1 as conservative default for unknown mutual information', () => {
    const conservative: SkillCandidate = {
      id: 'unknown-ik-skill',
      estimatedUses: 10,
      perUseSavingsBits: 8,
      estimatedIK: 1, // conservative floor per spec
    };
    expect(conservative.estimatedIK).toBe(1);
  });
});

// ─── computeROI arithmetic ────────────────────────────────────────────────────

describe('computeROI', () => {
  const candidate: SkillCandidate = {
    id: 'roi-test-skill',
    estimatedUses: 200,
    perUseSavingsBits: 40,
    estimatedIK: 3,
  };

  let breakdown: ROIBreakdown;

  it('returns a breakdown with the correct shape', () => {
    breakdown = computeROI(candidate);
    expect(breakdown).toHaveProperty('candidate');
    expect(breakdown).toHaveProperty('payoffBits');
    expect(breakdown).toHaveProperty('installCostJoules');
    expect(breakdown).toHaveProperty('decision');
    expect(breakdown).toHaveProperty('marginBits');
  });

  it('payoffBits = estimatedUses * perUseSavingsBits', () => {
    breakdown = computeROI(candidate);
    expect(breakdown.payoffBits).toBe(200 * 40); // 8000
  });

  it('installCostJoules = LANDAUER_FLOOR_JPB * estimatedIK', () => {
    breakdown = computeROI(candidate);
    expect(breakdown.installCostJoules).toBeCloseTo(LANDAUER_FLOOR_JPB * 3, 30);
  });

  it('marginBits = payoffBits - estimatedIK (bits-normalised)', () => {
    breakdown = computeROI(candidate);
    // marginBits = payoffBits - (installCostJoules / LANDAUER_FLOOR_JPB)
    //            = payoffBits - estimatedIK
    expect(breakdown.marginBits).toBe(200 * 40 - 3); // 7997
  });

  it('decision is "install" when marginBits > 0 (JP-005 gate, candidate has payoff 8000 > IK 3)', () => {
    breakdown = computeROI(candidate);
    expect(breakdown.decision).toBe('install');
  });

  it('preserves candidate reference in breakdown', () => {
    breakdown = computeROI(candidate);
    expect(breakdown.candidate).toBe(candidate);
  });
});

// ─── shouldInstall JP-005 gate ────────────────────────────────────────────────

describe('shouldInstall (JP-005 real gate)', () => {
  it('returns true for a clearly positive-ROI candidate', () => {
    const highROI: SkillCandidate = {
      id: 'high-roi-skill',
      estimatedUses: 1_000_000,
      perUseSavingsBits: 1000,
      estimatedIK: 1,
    };
    expect(shouldInstall(highROI)).toBe(true);
  });

  it('returns false for a zero-use candidate (payoffBits = 0 < IK = 1)', () => {
    const noUse: SkillCandidate = {
      id: 'zero-use-skill',
      estimatedUses: 0,
      perUseSavingsBits: 0,
      estimatedIK: 1,
    };
    expect(shouldInstall(noUse)).toBe(false);
  });
});
