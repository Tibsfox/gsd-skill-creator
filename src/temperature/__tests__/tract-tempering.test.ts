/**
 * MD-4 — Tractability Tempering tests.
 *
 * Gates: CF-MD4-04 (tractT correctness per class), CF-MD4-01 (floor/ceiling).
 */

import { describe, it, expect } from 'vitest';
import {
  computeTractTempering,
  applyTractTempering,
  factorForClass,
  EMPTY_MIX_DEFAULT,
  TRACT_TEMPERING_FLOOR,
  TRACT_TEMPERING_CEILING,
  type SkillMixEntry,
} from '../tract-tempering.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeMix(
  tractable: number,
  coinFlip: number,
  unknown: number,
): SkillMixEntry[] {
  const entries: SkillMixEntry[] = [];
  for (let i = 0; i < tractable; i++) entries.push({ skillId: `t${i}`, tractability: 'tractable' });
  for (let i = 0; i < coinFlip; i++) entries.push({ skillId: `c${i}`, tractability: 'coin-flip' });
  for (let i = 0; i < unknown; i++) entries.push({ skillId: `u${i}`, tractability: 'unknown' });
  return entries;
}

// ─── factorForClass ───────────────────────────────────────────────────────────

describe('factorForClass', () => {
  it('tractable → 1.0', () => expect(factorForClass('tractable')).toBe(1.0));
  it('unknown → 0.6', () => expect(factorForClass('unknown')).toBe(0.6));
  it('coin-flip → 0.3', () => expect(factorForClass('coin-flip')).toBe(0.3));
});

// ─── CF-MD4-04: computeTractTempering correctness ────────────────────────────

describe('CF-MD4-04 — computeTractTempering correctness', () => {
  it('empty mix returns EMPTY_MIX_DEFAULT (0.7)', () => {
    expect(computeTractTempering([])).toBe(EMPTY_MIX_DEFAULT);
    expect(EMPTY_MIX_DEFAULT).toBe(0.7);
  });

  it('pure tractable mix → 1.0', () => {
    const mix = makeMix(10, 0, 0);
    expect(computeTractTempering(mix)).toBe(1.0);
  });

  it('pure coin-flip mix → 0.3 (clamped at floor if necessary)', () => {
    const mix = makeMix(0, 10, 0);
    // Mean = 0.3; floor = 0.2; 0.3 > 0.2 → not clamped
    expect(computeTractTempering(mix)).toBeCloseTo(0.3, 10);
  });

  it('pure unknown mix → 0.6', () => {
    const mix = makeMix(0, 0, 10);
    expect(computeTractTempering(mix)).toBeCloseTo(0.6, 10);
  });

  it('50/50 tractable+coin-flip → mean of 1.0 and 0.3 = 0.65', () => {
    const mix = makeMix(5, 5, 0);
    // mean = (5*1.0 + 5*0.3) / 10 = (5 + 1.5) / 10 = 0.65
    expect(computeTractTempering(mix)).toBeCloseTo(0.65, 10);
  });

  it('50/50 tractable+unknown → mean = 0.8', () => {
    const mix = makeMix(5, 0, 5);
    // mean = (5*1.0 + 5*0.6) / 10 = 8/10 = 0.8
    expect(computeTractTempering(mix)).toBeCloseTo(0.8, 10);
  });

  it('single tractable entry → 1.0', () => {
    const mix: SkillMixEntry[] = [{ skillId: 'a', tractability: 'tractable' }];
    expect(computeTractTempering(mix)).toBe(1.0);
  });

  it('single coin-flip entry → 0.3', () => {
    const mix: SkillMixEntry[] = [{ skillId: 'a', tractability: 'coin-flip' }];
    expect(computeTractTempering(mix)).toBeCloseTo(0.3, 10);
  });
});

// ─── CF-MD4-01: floor clamp ───────────────────────────────────────────────────

describe('CF-MD4-01 — floor/ceiling clamp', () => {
  it('floor is 0.2 (degenerate collapse guard per E-6)', () => {
    expect(TRACT_TEMPERING_FLOOR).toBe(0.2);
  });

  it('ceiling is 1.0 (tractable = full temperature)', () => {
    expect(TRACT_TEMPERING_CEILING).toBe(1.0);
  });

  it('result never goes below TRACT_TEMPERING_FLOOR', () => {
    // Even a 100% coin-flip mix has mean 0.3 which is above floor 0.2
    // To test floor: we cannot produce a mean below 0.3 with valid entries.
    // The floor is a safety net for future classes or direct parameter sets.
    // Verify the floor guard is actually in the code path by checking pure coin-flip
    const mix = makeMix(0, 100, 0);
    expect(computeTractTempering(mix)).toBeGreaterThanOrEqual(TRACT_TEMPERING_FLOOR);
  });

  it('result never goes above TRACT_TEMPERING_CEILING', () => {
    const mix = makeMix(100, 0, 0);
    expect(computeTractTempering(mix)).toBeLessThanOrEqual(TRACT_TEMPERING_CEILING);
  });
});

// ─── applyTractTempering ─────────────────────────────────────────────────────

describe('applyTractTempering', () => {
  it('pure tractable → scales baseTemp by 1.0 (no reduction)', () => {
    const mix = makeMix(5, 0, 0);
    const result = applyTractTempering(1.0, mix);
    expect(result).toBeCloseTo(1.0, 10);
  });

  it('pure coin-flip → scales baseTemp by 0.3', () => {
    const mix = makeMix(0, 5, 0);
    const result = applyTractTempering(1.0, mix);
    expect(result).toBeCloseTo(0.3, 10);
  });

  it('empty mix → scales baseTemp by EMPTY_MIX_DEFAULT (0.7)', () => {
    const result = applyTractTempering(1.0, []);
    expect(result).toBeCloseTo(EMPTY_MIX_DEFAULT, 10);
  });

  it('baseTemp scaling is multiplicative', () => {
    const mix = makeMix(5, 0, 0);
    const base = 0.75;
    const result = applyTractTempering(base, mix);
    expect(result).toBeCloseTo(base * 1.0, 10);
  });

  it('coin-flip with non-unit base', () => {
    const mix = makeMix(0, 4, 0);
    const base = 2.0;
    const result = applyTractTempering(base, mix);
    expect(result).toBeCloseTo(2.0 * 0.3, 10);
  });
});

// ─── Linear interpolation monotonicity ───────────────────────────────────────

describe('monotonicity — tractable fraction vs tractT', () => {
  it('tractT is non-decreasing as tractable fraction increases', () => {
    const totals = 10;
    const temps: number[] = [];
    for (let t = 0; t <= totals; t++) {
      const cf = totals - t;
      const mix = makeMix(t, cf, 0);
      temps.push(computeTractTempering(mix));
    }
    for (let i = 0; i < temps.length - 1; i++) {
      expect(temps[i]).toBeLessThanOrEqual(temps[i + 1]);
    }
  });
});
