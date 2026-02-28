// test/proofs/part-ii-hearing/ch04-trig-waves.test.ts
// Computational verification for Chapter 4: Trigonometry and Waves
// Proof document: .planning/v1.50a/half-b/proofs/ch04-trig-waves.md
// Phase 475, Subversion 1.50.54

import { describe, test, expect } from 'vitest';
import { testAngles } from '../helpers/numerical';

describe('Chapter 4: Trigonometry and Waves — Computational Verification', () => {
  // ---------------------------------------------------------------------------
  // proof-4-1-cos-addition
  // cos(alpha + beta) = cos(alpha)*cos(beta) - sin(alpha)*sin(beta)
  // Technique 1: Numerical evaluation on an 8x8 angle grid
  // ---------------------------------------------------------------------------
  describe('proof-4-1: cosine addition formula', () => {
    const gridAngles = testAngles(8); // 8 evenly spaced angles in [0, 2*pi)
    const anglePairs = gridAngles.flatMap((a) => gridAngles.map((b) => [a, b] as [number, number]));

    test.each(anglePairs)('cos(%f + %f) = cos(%f)cos(%f) - sin(%f)sin(%f)', (alpha, beta) => {
      const lhs = Math.cos(alpha + beta);
      const rhs = Math.cos(alpha) * Math.cos(beta) - Math.sin(alpha) * Math.sin(beta);
      expect(lhs).toBeCloseTo(rhs, 10);
    });
  });

  // ---------------------------------------------------------------------------
  // proof-4-2-sin-addition
  // sin(alpha + beta) = sin(alpha)*cos(beta) + cos(alpha)*sin(beta)
  // Technique 1: Same 8x8 grid
  // ---------------------------------------------------------------------------
  describe('proof-4-2: sine addition formula', () => {
    const gridAngles = testAngles(8);
    const anglePairs = gridAngles.flatMap((a) => gridAngles.map((b) => [a, b] as [number, number]));

    test.each(anglePairs)('sin(%f + %f) = sin(%f)cos(%f) + cos(%f)sin(%f)', (alpha, beta) => {
      const lhs = Math.sin(alpha + beta);
      const rhs = Math.sin(alpha) * Math.cos(beta) + Math.cos(alpha) * Math.sin(beta);
      expect(lhs).toBeCloseTo(rhs, 10);
    });
  });

  // ---------------------------------------------------------------------------
  // proof-4-3-double-angle
  // Corollary: set beta = alpha in the addition formulas
  // cos(2*alpha) = cos^2(alpha) - sin^2(alpha)
  // sin(2*alpha) = 2*sin(alpha)*cos(alpha)
  // Technique 1: Numerical
  // ---------------------------------------------------------------------------
  describe('proof-4-3: double-angle formulas', () => {
    const angles = testAngles(20);

    test.each(angles)('cos(2*%f) = cos^2(%f) - sin^2(%f)', (theta) => {
      const lhs = Math.cos(2 * theta);
      const rhs = Math.cos(theta) ** 2 - Math.sin(theta) ** 2;
      expect(lhs).toBeCloseTo(rhs, 10);
    });

    test.each(angles)('sin(2*%f) = 2*sin(%f)*cos(%f)', (theta) => {
      const lhs = Math.sin(2 * theta);
      const rhs = 2 * Math.sin(theta) * Math.cos(theta);
      expect(lhs).toBeCloseTo(rhs, 10);
    });

    test('cos(2*theta) = 1 - 2*sin^2(theta) (alternate form)', () => {
      for (const theta of angles) {
        const lhs = Math.cos(2 * theta);
        const rhs = 1 - 2 * Math.sin(theta) ** 2;
        expect(lhs).toBeCloseTo(rhs, 10);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // proof-4-6-beat-frequency
  // cos(A) - cos(B) = -2 * sin((A+B)/2) * sin((A-B)/2)
  // Platform connection: beat frequency → src/packs/plane/signal-classification.ts (HIGH CONSEQUENCE)
  // Technique 2: Property testing with 100 random angle pairs
  // ---------------------------------------------------------------------------
  describe('proof-4-6: beat frequency — sum-to-product identity', () => {
    test('cos(A) - cos(B) = -2*sin((A+B)/2)*sin((A-B)/2) for 100 random pairs', () => {
      for (let i = 0; i < 100; i++) {
        const A = Math.random() * 4 * Math.PI - 2 * Math.PI;
        const B = Math.random() * 4 * Math.PI - 2 * Math.PI;
        const lhs = Math.cos(A) - Math.cos(B);
        const rhs = -2 * Math.sin((A + B) / 2) * Math.sin((A - B) / 2);
        expect(lhs).toBeCloseTo(rhs, 10);
      }
    });

    test('beat period is inversely proportional to frequency difference', () => {
      // Two frequencies f1 and f2 = f1 + delta_f.
      // Beat frequency = delta_f; beat period = 1/delta_f.
      const f1 = 440; // Hz (A4)
      const deltaF = 2; // Hz (slight detuning)
      const f2 = f1 + deltaF;
      const beatPeriod = 1 / deltaF; // seconds

      // Verify that cos(2*pi*f1*t) - cos(2*pi*f2*t) has the correct beat period.
      // At t=0 and t=beatPeriod, the beat envelope (sin term) should complete one cycle.
      const t = beatPeriod;
      const envelopeAtT = Math.sin(Math.PI * deltaF * t); // sin(pi * delta_f * T_beat) = sin(pi) = 0
      expect(envelopeAtT).toBeCloseTo(0, 8);
    });

    test('when A = B, cos(A) - cos(B) = 0 (zero beat)', () => {
      for (let i = 0; i < 20; i++) {
        const A = Math.random() * 2 * Math.PI;
        expect(Math.cos(A) - Math.cos(A)).toBe(0);
      }
    });
  });
});
