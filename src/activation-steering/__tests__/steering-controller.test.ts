/**
 * Steering controller tests (Phase 767).
 *
 * @module activation-steering/__tests__/steering-controller
 */

import { describe, expect, it } from 'vitest';
import {
  controllerStep,
  passthroughStep,
} from '../steering-controller.js';

describe('controllerStep', () => {
  it('produces zero delta when current already equals target', () => {
    const x = [1, 2, 3];
    const t = [1, 2, 3];
    const step = controllerStep(x, t, 0.5);
    expect(step.delta).toEqual([0, 0, 0]);
    expect(step.nextActivation).toEqual([1, 2, 3]);
    expect(step.deltaNorm).toBe(0);
    expect(step.gain).toBe(0.5);
  });

  it('produces correct delta for known target (math correctness)', () => {
    // current = [0,0], target = [2,0], gain = 0.5
    // expected delta = 0.5 * ([2,0] - [0,0]) = [1, 0]
    // expected next  = [0,0] + [1,0]         = [1, 0]
    const step = controllerStep([0, 0], [2, 0], 0.5);
    expect(step.delta[0]).toBeCloseTo(1, 12);
    expect(step.delta[1]).toBeCloseTo(0, 12);
    expect(step.nextActivation[0]).toBeCloseTo(1, 12);
    expect(step.nextActivation[1]).toBeCloseTo(0, 12);
    expect(step.deltaNorm).toBeCloseTo(1, 12);
  });

  it('contracts strictly toward target for gain in (0, 1)', () => {
    const x = [10, -5];
    const t = [0, 0];
    const step = controllerStep(x, t, 0.3);
    // Distance to target should shrink by factor (1 - gain) = 0.7.
    const before = Math.sqrt(10 * 10 + 5 * 5);
    const after = Math.sqrt(
      step.nextActivation[0]! * step.nextActivation[0]! +
        step.nextActivation[1]! * step.nextActivation[1]!,
    );
    expect(after).toBeCloseTo(before * 0.7, 6);
    expect(after).toBeLessThan(before);
  });

  it('reaches target exactly at gain = 1', () => {
    const step = controllerStep([5, 5, 5], [-1, 0, 1], 1.0);
    expect(step.nextActivation).toEqual([-1, 0, 1]);
  });

  it('throws on dim mismatch', () => {
    expect(() => controllerStep([1, 2], [1, 2, 3])).toThrow(/dimension/);
  });

  it('throws on out-of-range gain', () => {
    expect(() => controllerStep([1], [1], 0)).toThrow(/gain/);
    expect(() => controllerStep([1], [1], 1.5)).toThrow(/gain/);
    expect(() => controllerStep([1], [1], NaN)).toThrow(/gain/);
  });
});

describe('passthroughStep', () => {
  it('returns input vector unchanged with zero delta', () => {
    const x = [0.1, 0.2, 0.3, 0.4];
    const step = passthroughStep(x);
    expect(step.nextActivation).toEqual(x);
    expect(step.delta).toEqual([0, 0, 0, 0]);
    expect(step.deltaNorm).toBe(0);
    expect(step.gain).toBe(0);
  });

  it('does not alias the input array (mutation safety)', () => {
    const x = [1, 2, 3];
    const step = passthroughStep(x);
    (step.nextActivation as number[])[0] = 99;
    expect(x[0]).toBe(1);
  });
});
