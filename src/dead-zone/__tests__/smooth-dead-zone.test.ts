/**
 * MB-5 — smooth-dead-zone.ts unit tests.
 *
 * Covers:
 *   - Function correctness (zero inside, ramp outside)
 *   - Smoothness: no derivative discontinuity above a threshold for finite sharpness
 *   - Monotonicity outside the zone (output increases with |error|)
 *   - Degenerate cases (halfWidth=0, sharpness=0, error=0)
 *   - Hard dead-zone convenience
 */

import { describe, it, expect } from 'vitest';
import { deadZone, hardDeadZone } from '../smooth-dead-zone.js';

describe('deadZone', () => {
  describe('zero inside the dead-zone', () => {
    it('returns 0 output at error = 0', () => {
      const r = deadZone(0, 0.2, 100);
      expect(r.output).toBeCloseTo(0, 9);
    });

    it('returns ~0 output well inside the zone (positive side)', () => {
      // error=0.05, halfWidth=0.2, high sharpness → deep inside zone
      const r = deadZone(0.05, 0.2, 500);
      expect(r.output).toBeCloseTo(0, 3);
    });

    it('returns ~0 output well inside the zone (negative side)', () => {
      const r = deadZone(-0.05, 0.2, 500);
      expect(r.output).toBeCloseTo(0, 3);
    });

    it('derivative is ~0 deep inside the zone', () => {
      const r = deadZone(0.05, 0.2, 500);
      expect(r.derivative).toBeCloseTo(0, 3);
    });
  });

  describe('ramp outside the dead-zone', () => {
    it('output ≈ error − halfWidth well outside (positive)', () => {
      // error=0.5, hw=0.2, high sharpness → outside zone → output ≈ 0.3
      const r = deadZone(0.5, 0.2, 500);
      expect(r.output).toBeCloseTo(0.3, 2);
    });

    it('output ≈ error + halfWidth well outside (negative)', () => {
      // error=−0.5, hw=0.2 → output ≈ −0.3
      const r = deadZone(-0.5, 0.2, 500);
      expect(r.output).toBeCloseTo(-0.3, 2);
    });

    it('derivative ≈ 1 well outside the zone', () => {
      const r = deadZone(0.5, 0.2, 500);
      expect(r.derivative).toBeCloseTo(1, 2);
    });
  });

  describe('symmetry', () => {
    it('|output(+e)| === |output(-e)|', () => {
      const pos = deadZone(0.3, 0.1, 50);
      const neg = deadZone(-0.3, 0.1, 50);
      expect(Math.abs(pos.output)).toBeCloseTo(Math.abs(neg.output), 9);
    });

    it('derivative(+e) === derivative(-e)', () => {
      const pos = deadZone(0.3, 0.1, 50);
      const neg = deadZone(-0.3, 0.1, 50);
      expect(pos.derivative).toBeCloseTo(neg.derivative, 9);
    });
  });

  describe('smoothness — no derivative discontinuity', () => {
    it('derivative is continuous around the boundary (finite sharpness)', () => {
      const hw = 0.2;
      const sharpness = 30;
      const eps = 1e-4;
      const errors = [hw - eps, hw, hw + eps];
      const derivs = errors.map(e => deadZone(e, hw, sharpness).derivative);
      // consecutive derivatives should not jump by more than 0.1 at finite sharpness
      for (let i = 1; i < derivs.length; i++) {
        expect(Math.abs(derivs[i]! - derivs[i - 1]!)).toBeLessThan(0.1);
      }
    });

    it('derivative is in [0, 1] everywhere', () => {
      const hw = 0.15;
      const sharpness = 50;
      const testErrors = [-1, -0.3, -0.15, -0.1, 0, 0.1, 0.15, 0.3, 1];
      for (const e of testErrors) {
        const r = deadZone(e, hw, sharpness);
        expect(r.derivative).toBeGreaterThanOrEqual(0);
        expect(r.derivative).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('monotonicity outside the zone', () => {
    it('output increases with |error| outside the zone', () => {
      const hw = 0.1;
      const sharpness = 100;
      const magnitudes = [0.2, 0.3, 0.4, 0.5, 0.6];
      let prev = deadZone(magnitudes[0]!, hw, sharpness).output;
      for (let i = 1; i < magnitudes.length; i++) {
        const curr = deadZone(magnitudes[i]!, hw, sharpness).output;
        expect(curr).toBeGreaterThan(prev);
        prev = curr;
      }
    });
  });

  describe('degenerate cases', () => {
    it('halfWidth=0 → passthrough (no dead-zone effect)', () => {
      const r = deadZone(0.5, 0, 100);
      expect(r.output).toBeCloseTo(0.5, 9);
      expect(r.derivative).toBeCloseTo(1, 9);
    });

    it('sharpness=0 → soft half-scale (gate=0.5)', () => {
      const r = deadZone(0.4, 0.1, 0);
      // gate=0.5, ramp = 0.4−0.1=0.3 → output ≈ 0.15
      expect(r.output).toBeCloseTo(0.5 * 0.3, 9);
    });

    it('non-finite error → {output:0, derivative:0}', () => {
      const r = deadZone(NaN, 0.2, 50);
      expect(r.output).toBe(0);
      expect(r.derivative).toBe(0);
    });

    it('error=0 → {output:0, derivative:0} regardless of sharpness', () => {
      for (const k of [0, 1, 100, 1e9]) {
        const r = deadZone(0, 0.2, k);
        expect(r.output).toBe(0);
        expect(r.derivative).toBe(0);
      }
    });
  });
});

describe('hardDeadZone', () => {
  it('returns 0 inside the zone', () => {
    expect(hardDeadZone(0.1, 0.2).output).toBe(0);
    expect(hardDeadZone(-0.1, 0.2).output).toBe(0);
    expect(hardDeadZone(0, 0.2).output).toBe(0);
  });

  it('returns error − hw outside the zone (positive)', () => {
    const r = hardDeadZone(0.5, 0.2);
    expect(r.output).toBeCloseTo(0.3, 9);
    expect(r.derivative).toBe(1);
  });

  it('returns error + hw outside the zone (negative)', () => {
    const r = hardDeadZone(-0.5, 0.2);
    expect(r.output).toBeCloseTo(-0.3, 9);
    expect(r.derivative).toBe(1);
  });

  it('at exact boundary (|error| = hw) → returns 0', () => {
    expect(hardDeadZone(0.2, 0.2).output).toBe(0);
    expect(hardDeadZone(-0.2, 0.2).output).toBe(0);
  });

  it('hw=0 → passthrough', () => {
    const r = hardDeadZone(0.7, 0);
    expect(r.output).toBe(0.7);
    expect(r.derivative).toBe(1);
  });
});
