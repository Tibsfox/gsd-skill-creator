/**
 * MB-5 — cooldown-adapter.ts unit tests.
 *
 * Covers:
 *   - Degenerate (tau=Infinity) → hard Heaviside bit-exact
 *   - CF-MB5-03 fixture values (tau=3)
 *   - Smooth recovery: monotonically increasing with age
 *   - smoothDaysRemaining convenience
 */

import { describe, it, expect } from 'vitest';
import {
  recoveryScale,
  smoothDaysRemaining,
  DEFAULT_COOLDOWN_ADAPTER_PARAMS,
} from '../cooldown-adapter.js';

describe('recoveryScale', () => {
  describe('hard mode (tau = Infinity) — bit-exact M4 cooldown', () => {
    const hard = { cooldownDays: 7, tau: Infinity };

    it('returns 0 when age < cooldownDays', () => {
      expect(recoveryScale(0, hard)).toBe(0);
      expect(recoveryScale(1, hard)).toBe(0);
      expect(recoveryScale(6.99, hard)).toBe(0);
    });

    it('returns 1 when age >= cooldownDays', () => {
      expect(recoveryScale(7, hard)).toBe(1);
      expect(recoveryScale(7.01, hard)).toBe(1);
      expect(recoveryScale(100, hard)).toBe(1);
    });

    it('returns 1 at exact boundary (age = cooldownDays)', () => {
      expect(recoveryScale(7, hard)).toBe(1);
    });
  });

  describe('default params are hard (tau = Infinity)', () => {
    it('DEFAULT_COOLDOWN_ADAPTER_PARAMS has tau=Infinity', () => {
      expect(DEFAULT_COOLDOWN_ADAPTER_PARAMS.tau).toBe(Infinity);
      expect(DEFAULT_COOLDOWN_ADAPTER_PARAMS.cooldownDays).toBe(7);
    });

    it('default behaviour is hard Heaviside', () => {
      expect(recoveryScale(6)).toBe(0);
      expect(recoveryScale(7)).toBe(1);
    });
  });

  describe('CF-MB5-03 — smooth recovery at tau=3', () => {
    const params = { cooldownDays: 7, tau: 3 };

    it('day-8 → 1 − exp(−8/3) ≈ 0.931', () => {
      const expected = 1 - Math.exp(-8 / 3);
      expect(recoveryScale(8, params)).toBeCloseTo(expected, 6);
    });

    it('day-1 → 1 − exp(−1/3) ≈ 0.283', () => {
      const expected = 1 - Math.exp(-1 / 3);
      expect(recoveryScale(1, params)).toBeCloseTo(expected, 6);
    });

    it('day-0 → 0 (exp(0)=1, 1−1=0)', () => {
      expect(recoveryScale(0, params)).toBeCloseTo(0, 9);
    });

    it('approaches 1 asymptotically', () => {
      expect(recoveryScale(100, params)).toBeGreaterThan(0.9999);
    });
  });

  describe('smooth recovery is monotonically increasing', () => {
    it('scale increases with age for tau=3', () => {
      const params = { cooldownDays: 7, tau: 3 };
      const ages = [0, 0.5, 1, 2, 3, 5, 7, 10, 20];
      const scales = ages.map(a => recoveryScale(a, params));
      for (let i = 1; i < scales.length; i++) {
        expect(scales[i]!).toBeGreaterThanOrEqual(scales[i - 1]! - 1e-12);
      }
    });

    it('scale increases with age for tau=1', () => {
      const params = { cooldownDays: 7, tau: 1 };
      const ages = [0, 1, 2, 5, 10];
      const scales = ages.map(a => recoveryScale(a, params));
      for (let i = 1; i < scales.length; i++) {
        expect(scales[i]!).toBeGreaterThanOrEqual(scales[i - 1]! - 1e-12);
      }
    });
  });

  describe('output is in [0, 1]', () => {
    it('never exceeds 1 or goes below 0', () => {
      const params = { cooldownDays: 7, tau: 3 };
      for (const age of [0, 0.001, 1, 7, 30, 365, 1e6]) {
        const s = recoveryScale(age, params);
        expect(s).toBeGreaterThanOrEqual(0);
        expect(s).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('degenerate inputs', () => {
    it('non-finite age → treated as 0', () => {
      const params = { cooldownDays: 7, tau: 3 };
      expect(recoveryScale(NaN, params)).toBeCloseTo(0, 9);
      expect(recoveryScale(-Infinity, params)).toBeCloseTo(0, 9);
    });

    it('tau=0 → instant recovery (returns 1)', () => {
      const params = { cooldownDays: 7, tau: 0 };
      expect(recoveryScale(0, params)).toBe(1);
      expect(recoveryScale(1, params)).toBe(1);
    });
  });
});

describe('smoothDaysRemaining', () => {
  describe('hard mode — same as M4', () => {
    const hard = { cooldownDays: 7, tau: Infinity };

    it('returns cooldownDays − age when inside cooldown', () => {
      expect(smoothDaysRemaining(0, hard)).toBeCloseTo(7, 9);
      expect(smoothDaysRemaining(3, hard)).toBeCloseTo(4, 9);
      expect(smoothDaysRemaining(6, hard)).toBeCloseTo(1, 9);
    });

    it('returns 0 when age ≥ cooldownDays', () => {
      expect(smoothDaysRemaining(7, hard)).toBe(0);
      expect(smoothDaysRemaining(100, hard)).toBe(0);
    });
  });

  describe('smooth mode', () => {
    const params = { cooldownDays: 7, tau: 3 };

    it('returns 0 when already at the 0.9-recovery target', () => {
      // target age = −3 · ln(0.1) ≈ 6.908 days
      const targetAge = -3 * Math.log(0.1);
      const remaining = smoothDaysRemaining(targetAge, params, 0.9);
      expect(remaining).toBeCloseTo(0, 3);
    });

    it('returns positive value when younger than target', () => {
      const remaining = smoothDaysRemaining(1, params, 0.9);
      expect(remaining).toBeGreaterThan(0);
    });

    it('returns non-negative always', () => {
      for (const age of [0, 1, 5, 10, 100]) {
        expect(smoothDaysRemaining(age, params)).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
