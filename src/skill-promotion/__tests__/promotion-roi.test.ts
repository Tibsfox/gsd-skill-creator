/**
 * skill-promotion — JP-005 ROI gate tests (Wave 2 / phase 835).
 *
 * Tests:
 *  1. Candidate rejected when projected uses fall below Landauer × I_K threshold.
 *  2. Candidate accepted (ROI > 0) when payoff exceeds Landauer × I_K.
 *  3. Exact break-even boundary: marginBits == 0 → reject (not strictly positive).
 *  4. ROIBreakdown shape is fully populated on both accept and reject paths.
 *
 * Reference: arXiv:2604.20897 §3 — deployment-horizon ROI gate.
 */

import { describe, it, expect } from 'vitest';
import { computeROI, shouldInstall } from '../index.js';
import { LANDAUER_FLOOR_JPB } from '../index.js';
import type { SkillCandidate } from '../index.js';

// ─── Rejection below Landauer × I_K threshold ─────────────────────────────────

describe('JP-005 ROI gate — rejection', () => {
  it('rejects a candidate whose payoffBits < estimatedIK (below Landauer threshold)', () => {
    // payoffBits = 2 * 0.4 = 0.8; estimatedIK = 1 → marginBits = -0.2 → reject
    const candidate: SkillCandidate = {
      id: 'low-roi-skill',
      estimatedUses: 2,
      perUseSavingsBits: 0.4,
      estimatedIK: 1,
    };
    const breakdown = computeROI(candidate);
    expect(breakdown.decision).toBe('reject');
    expect(breakdown.marginBits).toBeLessThan(0);
    expect(shouldInstall(candidate)).toBe(false);
  });

  it('rejects a candidate with zero estimated uses regardless of savings', () => {
    const candidate: SkillCandidate = {
      id: 'zero-uses-skill',
      estimatedUses: 0,
      perUseSavingsBits: 100,
      estimatedIK: 1,
    };
    const breakdown = computeROI(candidate);
    // payoffBits = 0; marginBits = 0 - 1 = -1 → reject
    expect(breakdown.decision).toBe('reject');
    expect(breakdown.marginBits).toBe(-1);
    expect(shouldInstall(candidate)).toBe(false);
  });

  it('rejects at exact break-even (marginBits = 0, not strictly positive)', () => {
    // payoffBits = estimatedIK exactly → marginBits = 0 → reject
    const candidate: SkillCandidate = {
      id: 'break-even-skill',
      estimatedUses: 5,
      perUseSavingsBits: 2,   // payoffBits = 10
      estimatedIK: 10,        // marginBits = 10 - 10 = 0
    };
    const breakdown = computeROI(candidate);
    expect(breakdown.marginBits).toBe(0);
    expect(breakdown.decision).toBe('reject');
    expect(shouldInstall(candidate)).toBe(false);
  });
});

// ─── Acceptance above Landauer × I_K threshold ───────────────────────────────

describe('JP-005 ROI gate — acceptance', () => {
  it('accepts a candidate whose payoffBits > estimatedIK (above Landauer threshold)', () => {
    // payoffBits = 50 * 10 = 500; estimatedIK = 3 → marginBits = 497 → install
    const candidate: SkillCandidate = {
      id: 'high-roi-skill',
      estimatedUses: 50,
      perUseSavingsBits: 10,
      estimatedIK: 3,
    };
    const breakdown = computeROI(candidate);
    expect(breakdown.decision).toBe('install');
    expect(breakdown.marginBits).toBeGreaterThan(0);
    expect(shouldInstall(candidate)).toBe(true);
  });

  it('produces a fully-populated ROIBreakdown on accept path', () => {
    const candidate: SkillCandidate = {
      id: 'full-breakdown-skill',
      estimatedUses: 100,
      perUseSavingsBits: 8,
      estimatedIK: 2,
    };
    const breakdown = computeROI(candidate);

    // Shape
    expect(breakdown).toHaveProperty('candidate');
    expect(breakdown).toHaveProperty('payoffBits');
    expect(breakdown).toHaveProperty('installCostJoules');
    expect(breakdown).toHaveProperty('decision');
    expect(breakdown).toHaveProperty('marginBits');

    // Arithmetic: payoffBits = 100 * 8 = 800; IK = 2 → marginBits = 798
    expect(breakdown.payoffBits).toBe(800);
    expect(breakdown.installCostJoules).toBeCloseTo(LANDAUER_FLOOR_JPB * 2, 30);
    expect(breakdown.marginBits).toBe(798);
    expect(breakdown.decision).toBe('install');
  });

  it('accepts with a minimal 1-bit-over-threshold margin', () => {
    // payoffBits = estimatedIK + 1 (just over break-even)
    const ik = 7;
    const candidate: SkillCandidate = {
      id: 'barely-above-threshold',
      estimatedUses: 1,
      perUseSavingsBits: ik + 1,  // payoffBits = 8
      estimatedIK: ik,             // marginBits = 8 - 7 = 1
    };
    const breakdown = computeROI(candidate);
    expect(breakdown.marginBits).toBe(1);
    expect(breakdown.decision).toBe('install');
    expect(shouldInstall(candidate)).toBe(true);
  });
});
