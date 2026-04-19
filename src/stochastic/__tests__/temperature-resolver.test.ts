/**
 * MA-3 + MD-2 — Temperature Resolver tests.
 *
 * Covers the gain table per tractability class:
 *   tractable   → 1.0
 *   unknown     → 0.5
 *   coin-flip   → 0.3
 *
 * Also verifies:
 *   - Multiplicative behaviour (T_eff = T_base × scale)
 *   - Zero baseTemp always returns 0 (deterministic path at any class)
 *   - Scale is independent of _confidence (reserved param)
 *
 * @module stochastic/__tests__/temperature-resolver.test
 */

import { describe, it, expect } from 'vitest';
import { resolveTemperature, TRACTABILITY_TEMPERATURE_SCALE } from '../temperature-resolver.js';
import type { TractabilityClass } from '../../tractability/selector-api.js';

describe('resolveTemperature', () => {
  describe('gain table', () => {
    it('tractable → scale 1.0 (full temperature)', () => {
      expect(resolveTemperature(1.0, 'tractable')).toBeCloseTo(1.0, 10);
    });

    it('unknown → scale 0.5 (conservative)', () => {
      expect(resolveTemperature(1.0, 'unknown')).toBeCloseTo(0.5, 10);
    });

    it('coin-flip → scale 0.3 (reduced exploration)', () => {
      expect(resolveTemperature(1.0, 'coin-flip')).toBeCloseTo(0.3, 10);
    });
  });

  describe('multiplicative behaviour', () => {
    it('T_eff = T_base × scale for tractable', () => {
      const base = 2.5;
      expect(resolveTemperature(base, 'tractable')).toBeCloseTo(base * 1.0, 10);
    });

    it('T_eff = T_base × scale for unknown', () => {
      const base = 2.5;
      expect(resolveTemperature(base, 'unknown')).toBeCloseTo(base * 0.5, 10);
    });

    it('T_eff = T_base × scale for coin-flip', () => {
      const base = 2.5;
      expect(resolveTemperature(base, 'coin-flip')).toBeCloseTo(base * 0.3, 10);
    });

    it('zero baseTemp always returns 0 regardless of class', () => {
      const classes: TractabilityClass[] = ['tractable', 'unknown', 'coin-flip'];
      for (const cls of classes) {
        expect(resolveTemperature(0, cls)).toBe(0);
      }
    });

    it('T_eff preserves precision for small base temps', () => {
      expect(resolveTemperature(0.01, 'unknown')).toBeCloseTo(0.005, 10);
      expect(resolveTemperature(0.01, 'coin-flip')).toBeCloseTo(0.003, 10);
    });
  });

  describe('confidence parameter (reserved)', () => {
    it('passing confidence does not change the result', () => {
      // _confidence is reserved; ignoring it is the contract.
      expect(resolveTemperature(1.0, 'tractable', 0.9))
        .toBeCloseTo(resolveTemperature(1.0, 'tractable'), 10);
      expect(resolveTemperature(1.0, 'unknown', 0.5))
        .toBeCloseTo(resolveTemperature(1.0, 'unknown'), 10);
      expect(resolveTemperature(1.0, 'coin-flip', 0.1))
        .toBeCloseTo(resolveTemperature(1.0, 'coin-flip'), 10);
    });
  });

  describe('TRACTABILITY_TEMPERATURE_SCALE table', () => {
    it('table has all three keys', () => {
      expect(TRACTABILITY_TEMPERATURE_SCALE).toHaveProperty('tractable');
      expect(TRACTABILITY_TEMPERATURE_SCALE).toHaveProperty('unknown');
      expect(TRACTABILITY_TEMPERATURE_SCALE).toHaveProperty('coin-flip');
    });

    it('tractable scale is 1.0', () => {
      expect(TRACTABILITY_TEMPERATURE_SCALE.tractable).toBe(1.0);
    });

    it('unknown scale is 0.5', () => {
      expect(TRACTABILITY_TEMPERATURE_SCALE.unknown).toBe(0.5);
    });

    it('coin-flip scale is 0.3', () => {
      expect(TRACTABILITY_TEMPERATURE_SCALE['coin-flip']).toBe(0.3);
    });

    it('coin-flip scale < unknown scale < tractable scale', () => {
      expect(TRACTABILITY_TEMPERATURE_SCALE['coin-flip'])
        .toBeLessThan(TRACTABILITY_TEMPERATURE_SCALE.unknown);
      expect(TRACTABILITY_TEMPERATURE_SCALE.unknown)
        .toBeLessThan(TRACTABILITY_TEMPERATURE_SCALE.tractable);
    });
  });

  describe('ordering invariant (Thread E T-E-D resolution)', () => {
    it('coin-flip gets lower effective T than unknown at any base temp', () => {
      const base = 3.0;
      expect(resolveTemperature(base, 'coin-flip'))
        .toBeLessThan(resolveTemperature(base, 'unknown'));
    });

    it('unknown gets lower effective T than tractable at any base temp', () => {
      const base = 3.0;
      expect(resolveTemperature(base, 'unknown'))
        .toBeLessThan(resolveTemperature(base, 'tractable'));
    });

    it('coin-flip scale is > 0 (exploration never fully suppressed)', () => {
      // Per proposal: coin-flip gets T·0.3, NOT T·0
      expect(TRACTABILITY_TEMPERATURE_SCALE['coin-flip']).toBeGreaterThan(0);
    });
  });
});
