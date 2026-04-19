/**
 * MB-2 — Parameter-bounds registry tests.
 *
 * Coverage:
 *   - `getBounds`: tractability scaling, lower/upper override, coverage check.
 *   - `isAdmissible`: admissibility predicate.
 *   - `allParameterTypes`: registry completeness.
 *   - `getTractabilityBoundScale`: table values.
 */

import { describe, it, expect } from 'vitest';
import {
  getBounds,
  isAdmissible,
  allParameterTypes,
  getTractabilityBoundScale,
  type ParameterType,
} from '../parameter-bounds.js';

// ---------------------------------------------------------------------------
// Registry completeness
// ---------------------------------------------------------------------------

describe('allParameterTypes — registry coverage check', () => {
  it('returns all known parameter types', () => {
    const types = allParameterTypes();
    expect(types).toContain('K_H');
    expect(types).toContain('K_L');
    expect(types).toContain('cond_prob_cell');
    expect(types).toContain('prior_cell');
    // No unknown types — length matches.
    expect(types.length).toBe(4);
  });

  it('every type has valid lower ≤ upper bounds', () => {
    for (const type of allParameterTypes()) {
      const bounds = getBounds(type as ParameterType);
      expect(bounds.lower).toBeLessThanOrEqual(bounds.upper);
      expect(Number.isFinite(bounds.lower)).toBe(true);
      expect(Number.isFinite(bounds.upper)).toBe(true);
    }
  });

  it('every type has penaltyStrength in [0, 1]', () => {
    for (const type of allParameterTypes()) {
      const bounds = getBounds(type as ParameterType);
      expect(bounds.penaltyStrength).toBeGreaterThanOrEqual(0);
      expect(bounds.penaltyStrength).toBeLessThanOrEqual(1);
    }
  });

  it('every type has a non-empty description', () => {
    for (const type of allParameterTypes()) {
      const bounds = getBounds(type as ParameterType);
      expect(typeof bounds.description).toBe('string');
      expect(bounds.description.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// getBounds — tractability scaling
// ---------------------------------------------------------------------------

describe('getBounds — tractability scaling (mirrors MB-1 gain table)', () => {
  it('tractable: full range (scale 1.0)', () => {
    const bT = getBounds('K_H', { tractability: 'tractable' });
    const bDefault = getBounds('K_H');
    // tractable = default, no tightening.
    expect(bT.upper).toBeCloseTo(bDefault.upper, 10);
    expect(bT.lower).toBeCloseTo(bDefault.lower, 10);
  });

  it('coin-flip: tighter range (scale 0.5)', () => {
    const bT = getBounds('K_H', { tractability: 'tractable' });
    const bCF = getBounds('K_H', { tractability: 'coin-flip' });
    // coin-flip upper < tractable upper.
    expect(bCF.upper).toBeLessThan(bT.upper);
    // Scale is 0.5 → upper = lower + 0.5 * range.
    const range = bT.upper - bT.lower;
    expect(bCF.upper).toBeCloseTo(bT.lower + 0.5 * range, 10);
  });

  it('unknown: moderate tightening (scale 0.8)', () => {
    const bT = getBounds('K_H', { tractability: 'tractable' });
    const bU = getBounds('K_H', { tractability: 'unknown' });
    expect(bU.upper).toBeLessThan(bT.upper);
    const range = bT.upper - bT.lower;
    expect(bU.upper).toBeCloseTo(bT.lower + 0.8 * range, 10);
  });

  it('cond_prob_cell bounds are in [0, 1] for all tractability classes', () => {
    for (const cls of ['tractable', 'unknown', 'coin-flip'] as const) {
      const b = getBounds('cond_prob_cell', { tractability: cls });
      expect(b.lower).toBeGreaterThanOrEqual(0);
      expect(b.upper).toBeLessThanOrEqual(1);
    }
  });
});

// ---------------------------------------------------------------------------
// getBounds — overrides
// ---------------------------------------------------------------------------

describe('getBounds — caller overrides', () => {
  it('lowerOverride narrows lower bound', () => {
    const base = getBounds('K_H');
    const withOverride = getBounds('K_H', { lowerOverride: 1.0 });
    expect(withOverride.lower).toBeGreaterThanOrEqual(1.0);
    expect(withOverride.lower).toBeLessThanOrEqual(withOverride.upper);
    void base;
  });

  it('upperOverride narrows upper bound', () => {
    const base = getBounds('K_H', { tractability: 'tractable' });
    const withOverride = getBounds('K_H', { tractability: 'tractable', upperOverride: 5.0 });
    expect(withOverride.upper).toBeLessThanOrEqual(base.upper);
    expect(withOverride.upper).toBeCloseTo(5.0, 10);
  });

  it('combined overrides satisfy lower ≤ upper', () => {
    const b = getBounds('K_H', { lowerOverride: 2.0, upperOverride: 8.0 });
    expect(b.lower).toBeLessThanOrEqual(b.upper);
  });
});

// ---------------------------------------------------------------------------
// isAdmissible
// ---------------------------------------------------------------------------

describe('isAdmissible', () => {
  it('returns true for values within bounds', () => {
    expect(isAdmissible(0.5, 'cond_prob_cell')).toBe(true);
    expect(isAdmissible(5.0, 'K_H', { tractability: 'tractable' })).toBe(true);
  });

  it('returns false for values outside bounds', () => {
    // coin-flip K_H upper is 50 (0.5 * 100). Value of 60 is outside.
    expect(isAdmissible(60, 'K_H', { tractability: 'coin-flip' })).toBe(false);
  });

  it('returns true for boundary values', () => {
    const b = getBounds('K_H', { tractability: 'tractable' });
    expect(isAdmissible(b.lower, 'K_H', { tractability: 'tractable' })).toBe(true);
    expect(isAdmissible(b.upper, 'K_H', { tractability: 'tractable' })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getTractabilityBoundScale
// ---------------------------------------------------------------------------

describe('getTractabilityBoundScale — documented scale factors', () => {
  it('tractable → 1.0', () => {
    expect(getTractabilityBoundScale().tractable).toBe(1.0);
  });
  it('unknown → 0.8', () => {
    expect(getTractabilityBoundScale().unknown).toBe(0.8);
  });
  it('coin-flip → 0.5', () => {
    expect(getTractabilityBoundScale()['coin-flip']).toBe(0.5);
  });
});
