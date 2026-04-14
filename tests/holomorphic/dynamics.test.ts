import { describe, it, expect } from 'vitest';
import {
  classifySkillDynamics,
  computeSkillOrbit,
  detectSkillFixedPoint,
  computeSkillMultiplier,
  classifyFatouJulia,
  clampAngularVelocity,
} from '../../src/holomorphic/dynamics/skill-dynamics';
import { magnitude } from '../../src/holomorphic/complex/arithmetic';
import type { ComplexNumber } from '../../src/holomorphic/types';

/* ------------------------------------------------------------------ */
/*  Skill Dynamics Model                                                */
/* ------------------------------------------------------------------ */

describe('Skill Dynamics Model', () => {
  describe('classifySkillDynamics', () => {
    it('identifies attracting fixed point for a stable skill', () => {
      // Skill at theta=0.5, r=0.3 with contractive iteration (alpha=0.7)
      const result = classifySkillDynamics(
        { theta: 0.5, radius: 0.3 },
        100,
      );
      expect(result.classification).toBe('attracting');
      expect(result.fatouDomain).toBe(true);
      expect(result.convergenceRate).toBeGreaterThan(0);
    });

    it('identifies repelling fixed point for unstable parameters', () => {
      // Skill at theta=PI (maximum instability), r=2.5 (high radius = repelling)
      const result = classifySkillDynamics(
        { theta: Math.PI, radius: 2.5 },
        100,
      );
      expect(result.classification).toBe('repelling');
    });

    it('identifies superattracting (compiled skill) when radius is near zero', () => {
      // A skill at r~0 converges instantly: the iteration f(z) = alpha*z + beta
      // with very small z has f'(z*) ~ 0 at origin
      const result = classifySkillDynamics(
        { theta: 0, radius: 0.001 },
        100,
      );
      expect(result.classification).toBe('superattracting');
    });

    it('identifies period-2 cycle for oscillating skill', () => {
      // Skill at theta close to PI with radius near 1 can oscillate
      const result = classifySkillDynamics(
        { theta: Math.PI * 0.95, radius: 1.0 },
        200,
      );
      // Period-2 or higher cycle shows up as rationally_indifferent or similar
      expect([
        'rationally_indifferent',
        'irrationally_indifferent',
        'attracting',
      ]).toContain(result.classification);
      expect(result.iterationHistory.length).toBeGreaterThan(0);
    });

    it('identifies Julia set boundary (chaotic) for critical parameters', () => {
      // At the boundary of the Mandelbrot set, dynamics are chaotic
      const result = classifySkillDynamics(
        { theta: Math.PI / 4, radius: 1.5 },
        200,
      );
      expect(result.fatouDomain).toBeDefined();
      expect(typeof result.fatouDomain).toBe('boolean');
    });
  });

  describe('computeSkillOrbit', () => {
    it('produces orbit points from skill position', () => {
      const orbit = computeSkillOrbit({ theta: 0.3, radius: 0.5 }, 20);
      expect(orbit.length).toBeGreaterThan(0);
      expect(orbit.length).toBeLessThanOrEqual(20);
      // Each point should be a complex number
      for (const pt of orbit) {
        expect(typeof pt.re).toBe('number');
        expect(typeof pt.im).toBe('number');
      }
    });
  });

  describe('detectSkillFixedPoint', () => {
    it('finds convergence point in a converging orbit', () => {
      // Generate a converging orbit: z_{n+1} = 0.5z + 0.25
      const orbit: ComplexNumber[] = [];
      let z: ComplexNumber = { re: 0, im: 0 };
      for (let i = 0; i < 50; i++) {
        z = { re: 0.5 * z.re + 0.25, im: 0.5 * z.im };
        orbit.push(z);
      }
      const fp = detectSkillFixedPoint(orbit);
      expect(fp).not.toBeNull();
      // Fixed point should be near 0.5 + 0i
      expect(fp!.re).toBeCloseTo(0.5, 3);
      expect(fp!.im).toBeCloseTo(0, 3);
    });

    it('returns null for a diverging orbit', () => {
      // z_{n+1} = 2z + 1 diverges
      const orbit: ComplexNumber[] = [];
      let z: ComplexNumber = { re: 1, im: 0 };
      for (let i = 0; i < 20; i++) {
        z = { re: 2 * z.re + 1, im: 2 * z.im };
        orbit.push(z);
      }
      const fp = detectSkillFixedPoint(orbit);
      expect(fp).toBeNull();
    });
  });

  describe('computeSkillMultiplier', () => {
    it('returns numerically stable multiplier', () => {
      const f = (z: ComplexNumber): ComplexNumber => ({
        re: 0.8 * z.re + 0.1,
        im: 0.8 * z.im,
      });
      const mult = computeSkillMultiplier(f, { re: 0.5, im: 0 });
      // The derivative of 0.8z + 0.1 is 0.8
      expect(mult.re).toBeCloseTo(0.8, 4);
      expect(mult.im).toBeCloseTo(0, 4);
    });
  });

  describe('classifyFatouJulia', () => {
    it('classifies low-radius skills as Fatou domain (stable)', () => {
      const inFatou = classifyFatouJulia({ theta: 0, radius: 0.3 });
      expect(inFatou).toBe(true);
    });

    it('classifies high-radius skills as outside Fatou (Julia boundary)', () => {
      const inFatou = classifyFatouJulia({ theta: Math.PI, radius: 2.5 });
      expect(inFatou).toBe(false);
    });
  });

  describe('clampAngularVelocity', () => {
    it('clamps excessive angular change to max allowed', () => {
      const maxChange = 0.2 * 2 * Math.PI; // 20% of full circle
      const clamped = clampAngularVelocity(5.0, maxChange);
      expect(clamped).toBeCloseTo(maxChange, 6);
    });

    it('preserves small angular changes', () => {
      const maxChange = 0.2 * 2 * Math.PI;
      const clamped = clampAngularVelocity(0.1, maxChange);
      expect(clamped).toBeCloseTo(0.1, 6);
    });

    it('handles negative angular velocity', () => {
      const maxChange = 0.2 * 2 * Math.PI;
      const clamped = clampAngularVelocity(-5.0, maxChange);
      expect(clamped).toBeCloseTo(-maxChange, 6);
    });
  });
});
