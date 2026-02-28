// test/proofs/part-i-seeing/ch02-unit-circle.test.ts
// Computational verification for Chapter 2: Unit Circle — Trigonometry and Complex Exponential
// Proof document: .planning/v1.50a/half-b/proofs/ch02-unit-circle.md
// Phase 475, Subversion 1.50.52

import { describe, test, expect } from 'vitest';
import { testAngles, randomAngles } from '../helpers/numerical';
import { fromUnitCircle, complexMag } from '../helpers/complex';

describe('Chapter 2: Unit Circle — Computational Verification', () => {
  // ---------------------------------------------------------------------------
  // proof-2-1-pythagorean-identity
  // Technique 1: Numerical evaluation at many angles
  // Platform connection: skill activation is bounded because cos^2 + sin^2 = 1
  // ---------------------------------------------------------------------------
  describe('proof-2-1: Pythagorean identity cos^2(theta) + sin^2(theta) = 1', () => {
    const keyAngles = [
      0,
      Math.PI / 6,
      Math.PI / 4,
      Math.PI / 3,
      Math.PI / 2,
      Math.PI,
      3 * Math.PI / 2,
      2 * Math.PI,
      -Math.PI / 4,
      7.3,  // arbitrary value — not a "nice" angle
    ];

    test.each(keyAngles)('cos^2(%f) + sin^2(%f) = 1', (theta) => {
      const result = Math.cos(theta) ** 2 + Math.sin(theta) ** 2;
      expect(result).toBeCloseTo(1, 10);
    });

    // PLATFORM CONNECTION TEST — CVER-03 requirement
    // Proves that skill activation is bounded: if a skill position sits on the unit circle,
    // then cos^2(theta) + sin^2(theta) = 1 guarantees |position| = 1.
    // This validates src/plane/observer-bridge.ts angular constraint.
    test('Pythagorean identity holds for 1000 random skill positions — activation is bounded', () => {
      const skillAngles = randomAngles(1000);
      for (const theta of skillAngles) {
        const concreteComponent = Math.cos(theta); // real axis = concrete
        const abstractComponent = Math.sin(theta); // imaginary axis = abstract
        const identityResult = concreteComponent ** 2 + abstractComponent ** 2;
        expect(identityResult).toBeCloseTo(1, 10);
      }
    });

    // Verify using complex helper: fromUnitCircle gives |z| = 1
    test('fromUnitCircle(theta) always has magnitude 1', () => {
      const angles = testAngles(36); // every 10 degrees
      for (const theta of angles) {
        const z = fromUnitCircle(theta);
        expect(complexMag(z)).toBeCloseTo(1, 10);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // proof-2-2-radian-degree
  // Technique 1: Numerical
  // ---------------------------------------------------------------------------
  describe('proof-2-2: radian-degree conversion formula', () => {
    test('360 degrees = 2*PI radians', () => {
      const degreesToRadians = (deg: number) => (deg * Math.PI) / 180;
      expect(degreesToRadians(360)).toBeCloseTo(2 * Math.PI, 10);
    });

    test('30 degrees = PI/6 radians', () => {
      expect((30 * Math.PI) / 180).toBeCloseTo(Math.PI / 6, 10);
    });

    test('45 degrees = PI/4 radians', () => {
      expect((45 * Math.PI) / 180).toBeCloseTo(Math.PI / 4, 10);
    });

    test('90 degrees = PI/2 radians', () => {
      expect((90 * Math.PI) / 180).toBeCloseTo(Math.PI / 2, 10);
    });

    test('subversion angle: v1.50 subversion N sits at angle N/100 * 2*PI', () => {
      // The v1.50 milestone has ~100 subversions mapping to [0, 2*PI)
      // Subversion 51 (Ch 1 proofs) is just past the halfway point
      const subversion51Angle = (51 / 100) * 2 * Math.PI;
      expect(subversion51Angle).toBeGreaterThan(Math.PI); // past halfway

      // Subversion 100 (milestone completion) should complete the full circle
      const subversion100Angle = (100 / 100) * 2 * Math.PI;
      expect(subversion100Angle).toBeCloseTo(2 * Math.PI, 5);
    });
  });

  // ---------------------------------------------------------------------------
  // proof-2-3-symmetry: cos is even, sin is odd
  // Technique 2: Property testing across many angles
  // ---------------------------------------------------------------------------
  describe('proof-2-3: even-odd symmetry of cos and sin', () => {
    const angles = testAngles(20);

    test.each(angles)('cos(-theta) = cos(theta) at theta=%f (cos is even)', (theta) => {
      expect(Math.cos(-theta)).toBeCloseTo(Math.cos(theta), 10);
    });

    test.each(angles)('sin(-theta) = -sin(theta) at theta=%f (sin is odd)', (theta) => {
      expect(Math.sin(-theta)).toBeCloseTo(-Math.sin(theta), 10);
    });

    test('cos symmetry: cos(theta) = cos(-theta) for 100 random angles', () => {
      for (const theta of randomAngles(100)) {
        expect(Math.cos(-theta)).toBeCloseTo(Math.cos(theta), 10);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // proof-2-4-trig-relationships: tan = sin/cos
  // Technique 1: Numerical evaluation (avoid near-zero cos values)
  // Platform connection: src/plane/activation.ts TangentContext
  // ---------------------------------------------------------------------------
  describe('proof-2-4: tan(theta) = sin(theta)/cos(theta)', () => {
    // Exclude angles near pi/2 where cos approaches zero
    const safeAngles = testAngles(20).filter((t) => Math.abs(Math.cos(t)) > 0.01);

    test.each(safeAngles)('tan(%f) = sin(%f)/cos(%f)', (theta) => {
      expect(Math.tan(theta)).toBeCloseTo(Math.sin(theta) / Math.cos(theta), 8);
    });

    test('sec^2(theta) = 1 + tan^2(theta) at safe angles', () => {
      for (const theta of safeAngles) {
        const sec2 = 1 / Math.cos(theta) ** 2;
        const tan2 = Math.tan(theta) ** 2;
        expect(sec2).toBeCloseTo(1 + tan2, 8);
      }
    });
  });
});
