import { describe, it, expect } from 'vitest';
import type { ComplexNumber } from '../../../src/holomorphic/types';
import { mul, add, magnitude } from '../../../src/holomorphic/complex/arithmetic';
import {
  computeOrbit,
  detectPeriod,
  computeMultiplier,
  classifyFixedPoint,
  isRationalMultipleOfPi,
} from '../../../src/holomorphic/complex/iterate';

/* ------------------------------------------------------------------ */
/*  Iteration engine tests                                              */
/* ------------------------------------------------------------------ */

describe('Iteration Engine', () => {
  /** f(z) = z^2 */
  const fSquare = (z: ComplexNumber): ComplexNumber => mul(z, z);

  /** f(z) = z^2 + c */
  const fQuadratic = (c: ComplexNumber) => (z: ComplexNumber): ComplexNumber =>
    add(mul(z, z), c);

  it('computeOrbit(z0, f, maxIter) produces orbit points for f(z) = z^2', () => {
    const orbit = computeOrbit({ re: 0.5, im: 0 }, fSquare, 10);
    expect(orbit.points.length).toBeGreaterThan(0);
    expect(orbit.z0).toEqual({ re: 0.5, im: 0 });
  });

  it('Orbit of z0 = 0.5 under z^2 converges to 0 (escapeTime null, escaped false)', () => {
    const orbit = computeOrbit({ re: 0.5, im: 0 }, fSquare, 100);
    expect(orbit.escaped).toBe(false);
    expect(orbit.escapeTime).toBeNull();
    // 0.5^(2^n) → 0
    const last = orbit.points[orbit.points.length - 1];
    expect(magnitude(last)).toBeLessThan(0.01);
  });

  it('Orbit of z0 = 2 under z^2 escapes quickly (escaped true)', () => {
    const orbit = computeOrbit({ re: 2, im: 0 }, fSquare, 100);
    expect(orbit.escaped).toBe(true);
  });

  it('escapeTime for z0 = 2 under z^2 + 0 is 1 (|z^2| = 4 > 2)', () => {
    const orbit = computeOrbit({ re: 2, im: 0 }, fQuadratic({ re: 0, im: 0 }), 100);
    expect(orbit.escapeTime).toBe(1);
  });

  it('detectPeriod: orbit of z^2 + 0 from z0 = 0 returns period 1 (fixed at 0)', () => {
    const orbit = computeOrbit({ re: 0, im: 0 }, fQuadratic({ re: 0, im: 0 }), 50);
    const period = detectPeriod(orbit);
    expect(period).toBe(1);
  });

  it('computeMultiplier: f\'(z*) for z^2 at z* = 0 gives multiplier {re: 0, im: 0}', () => {
    const multiplier = computeMultiplier(fSquare, { re: 0, im: 0 });
    expect(multiplier.re).toBeCloseTo(0);
    expect(multiplier.im).toBeCloseTo(0);
  });

  it('classifyFixedPoint: multiplier = 0 is superattracting', () => {
    expect(classifyFixedPoint({ re: 0, im: 0 })).toBe('superattracting');
  });

  it('classifyFixedPoint: multiplier mag < 1 is attracting', () => {
    expect(classifyFixedPoint({ re: 0.5, im: 0.3 })).toBe('attracting');
  });

  it('classifyFixedPoint: multiplier mag > 1 is repelling', () => {
    expect(classifyFixedPoint({ re: 2, im: 0 })).toBe('repelling');
  });

  it('classifyFixedPoint: multiplier mag = 1, rational angle is rationally_indifferent', () => {
    // e^(i*PI/2) = (0, 1) — angle PI/2 is a rational multiple of PI
    expect(classifyFixedPoint({ re: 0, im: 1 })).toBe('rationally_indifferent');
  });

  it('classifyFixedPoint: multiplier mag = 1, irrational angle is irrationally_indifferent', () => {
    // angle = sqrt(2) ≈ 1.4142... is not a rational multiple of PI
    const theta = Math.sqrt(2);
    expect(classifyFixedPoint({ re: Math.cos(theta), im: Math.sin(theta) })).toBe(
      'irrationally_indifferent',
    );
  });

  it('isRationalMultipleOfPi: 0 is rational', () => {
    expect(isRationalMultipleOfPi(0)).toBe(true);
  });

  it('isRationalMultipleOfPi: PI/4 is rational, PI*sqrt(2) is not', () => {
    expect(isRationalMultipleOfPi(Math.PI / 4)).toBe(true);
    expect(isRationalMultipleOfPi(Math.PI * Math.sqrt(2))).toBe(false);
  });

  it('Orbit escapeRadius configurable (default 2)', () => {
    // z0 = 1.5 escapes under z^2 with radius 1 but not with default radius 2
    const orbitSmallRadius = computeOrbit({ re: 1.5, im: 0 }, fSquare, 10, 1);
    expect(orbitSmallRadius.escaped).toBe(true);
    expect(orbitSmallRadius.escapeTime).toBe(0); // |1.5| > 1 immediately

    const orbitDefaultRadius = computeOrbit({ re: 1.5, im: 0 }, fSquare, 10);
    // 1.5^2 = 2.25, |2.25| > 2 so escapes at step 1
    expect(orbitDefaultRadius.escaped).toBe(true);
    expect(orbitDefaultRadius.escapeTime).toBe(1);
  });

  it('computeOrbit returns maxIter points when no escape', () => {
    const orbit = computeOrbit({ re: 0, im: 0 }, fSquare, 20);
    expect(orbit.points).toHaveLength(20);
    expect(orbit.escaped).toBe(false);
  });
});
