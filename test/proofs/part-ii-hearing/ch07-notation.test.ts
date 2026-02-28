// test/proofs/part-ii-hearing/ch07-notation.test.ts
// Computational verification for Chapter 7: Musical Notation as Coordinate System
// Proof document: .planning/v1.50a/half-b/proofs/ch07-notation.md
// Phase 476, Subversion 1.50.57

import { describe, test, expect } from 'vitest';
import { closeToRel } from '../helpers/numerical';

describe('Chapter 7: Musical Notation as Coordinate System — Computational Verification', () => {
  // ---------------------------------------------------------------------------
  // proof-7-1-z12-group: Z₁₂ group axioms (constructive verification)
  // Theorem 7.1: (Z/12Z, +) is an abelian group
  // Method: Exhaustive enumeration of all 144 pairs for closure and commutativity
  // ---------------------------------------------------------------------------
  describe('proof-7-1: Z₁₂ group axioms (constructive verification)', () => {
    const Z12 = Array.from({ length: 12 }, (_, i) => i);

    test('closure: (a + b) mod 12 is in {0..11} for all a, b in Z₁₂', () => {
      for (const a of Z12) {
        for (const b of Z12) {
          const sum = (a + b) % 12;
          expect(sum).toBeGreaterThanOrEqual(0);
          expect(sum).toBeLessThan(12);
        }
      }
    });

    test('identity: a + 0 ≡ a (mod 12) for all a in Z₁₂', () => {
      for (const a of Z12) {
        expect((a + 0) % 12).toBe(a);
      }
    });

    test('inverses: every element has an additive inverse in Z₁₂', () => {
      for (const a of Z12) {
        const inverse = (12 - a) % 12;
        expect((a + inverse) % 12).toBe(0);
      }
    });

    test('commutativity: a + b ≡ b + a (mod 12) for all a, b — exhaustive check', () => {
      for (const a of Z12) {
        for (const b of Z12) {
          expect((a + b) % 12).toBe((b + a) % 12);
        }
      }
    });

    test('associativity: (a + b) + c ≡ a + (b + c) (mod 12) — exhaustive check', () => {
      for (const a of Z12) {
        for (const b of Z12) {
          for (const c of Z12) {
            const left = ((a + b) % 12 + c) % 12;
            const right = (a + (b + c) % 12) % 12;
            expect(left).toBe(right);
          }
        }
      }
    });

    test('musical interpretation: perfect fifth (7) + perfect fifth (7) = major second (2)', () => {
      const perfectFifth = 7;
      expect((perfectFifth + perfectFifth) % 12).toBe(2); // two P5ths = major second (14 ≡ 2)
    });

    test('musical interpretation: tritone (6) is its own inverse (6 + 6 = 12 ≡ 0)', () => {
      const tritone = 6;
      expect((tritone + tritone) % 12).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // proof-7-2-geometric-series: ∑(1/2)^n convergence
  // Theorem 7.2: ∑_{n=0}^∞ (1/2)^n = 2
  // Method: Convergence testing — partial sums vs. closed-form formula
  // ---------------------------------------------------------------------------
  describe('proof-7-2: geometric series sum ∑(1/2)^n = 2', () => {
    test('partial sums of (1/2)^n starting at n=0 converge to 2', () => {
      let sum = 0;
      for (let n = 0; n <= 50; n++) {
        sum += Math.pow(0.5, n);
      }
      expect(sum).toBeCloseTo(2, 8);
    });

    test('partial sums starting at n=1 converge to 1 (whole note durations)', () => {
      let sum = 0;
      for (let n = 1; n <= 50; n++) {
        sum += Math.pow(0.5, n);
      }
      expect(sum).toBeCloseTo(1, 8);
    });

    test('geometric series closed-form: 1/(1-r) for r=1/2 equals 2', () => {
      const r = 0.5;
      const closedForm = 1 / (1 - r);
      expect(closedForm).toBeCloseTo(2, 10);
    });

    test('partial sum formula S_N = 2(1 - (1/2)^(N+1)) matches direct computation', () => {
      for (const N of [5, 10, 20, 40]) {
        // Direct partial sum
        let directSum = 0;
        for (let n = 0; n <= N; n++) {
          directSum += Math.pow(0.5, n);
        }
        // Closed-form partial sum
        const formulaSum = 2 * (1 - Math.pow(0.5, N + 1));
        expect(directSum).toBeCloseTo(formulaSum, 10);
      }
    });

    test('convergence: geometric bound holds — |S_N - 2| < (1/2)^N', () => {
      for (const N of [5, 10, 20]) {
        let sum = 0;
        for (let n = 0; n <= N; n++) {
          sum += Math.pow(0.5, n);
        }
        const gap = Math.abs(sum - 2);
        const bound = Math.pow(0.5, N);
        expect(gap).toBeLessThan(bound + 1e-14);
      }
    });

    test('convergence is monotonically decreasing (each partial sum is closer to 2)', () => {
      const Ns = [5, 10, 20, 40];
      let prevError = 1;
      for (const N of Ns) {
        let sum = 0;
        for (let n = 0; n <= N; n++) sum += Math.pow(0.5, n);
        const error = Math.abs(2 - sum);
        expect(error).toBeLessThan(prevError);
        prevError = error;
      }
    });
  });

  // ---------------------------------------------------------------------------
  // proof-7-3-information-density: Shannon entropy log₂ calculations
  // Theorem 7.3: H = log₂(A) for uniform distribution over A symbols
  // Method: Numerical evaluation + additivity verification
  // ---------------------------------------------------------------------------
  describe('proof-7-3: information density — Shannon entropy log₂(A)', () => {
    test('12 chromatic pitches: H = log₂(12) ≈ 3.585 bits', () => {
      expect(Math.log2(12)).toBeCloseTo(3.585, 2);
    });

    test('7 diatonic pitches: H = log₂(7) ≈ 2.807 bits', () => {
      expect(Math.log2(7)).toBeCloseTo(2.807, 2);
    });

    test('4 duration values: H = log₂(4) = 2 bits (exactly)', () => {
      expect(Math.log2(4)).toBeCloseTo(2, 10);
    });

    test('chromatic scale encodes strictly more information than diatonic scale', () => {
      expect(Math.log2(12)).toBeGreaterThan(Math.log2(7));
    });

    test('combined coordinate 12×4×4=192 outcomes has H = log₂(192) ≈ 7.585 bits', () => {
      const A_combined = 12 * 4 * 4; // pitch × duration × dynamics
      expect(Math.log2(A_combined)).toBeCloseTo(7.585, 2);
    });

    test('entropy additivity: log₂(12×4×4) = log₂(12) + log₂(4) + log₂(4)', () => {
      const combined = Math.log2(12 * 4 * 4);
      const additive = Math.log2(12) + Math.log2(4) + Math.log2(4);
      expect(combined).toBeCloseTo(additive, 10);
    });

    test('combined entropy exceeds any single-dimension entropy', () => {
      const H_combined = Math.log2(12 * 4 * 4);
      const H_pitch = Math.log2(12);
      const H_duration = Math.log2(4);
      const H_dynamics = Math.log2(4);
      expect(H_combined).toBeGreaterThan(H_pitch);
      expect(H_combined).toBeGreaterThan(H_duration);
      expect(H_combined).toBeGreaterThan(H_dynamics);
    });

    test('information density ratio: combined/pitch > 2.0', () => {
      const ratio = Math.log2(12 * 4 * 4) / Math.log2(12);
      expect(ratio).toBeGreaterThan(2.0);
    });

    // Platform connection: subversion angle encodes position on curriculum circle
    test('subversion angle formula: angle for subversion N is (N/100) * 2π', () => {
      // Subversion 57 (this chapter): 57/100 * 2π ≈ 3.581
      const sub57 = (57 / 100) * 2 * Math.PI;
      expect(sub57).toBeCloseTo(3.581, 2);
      // All 100 subversions map to [0, 2π)
      for (let N = 1; N <= 100; N++) {
        const angle = (N / 100) * 2 * Math.PI;
        expect(angle).toBeGreaterThan(0);
        expect(angle).toBeLessThanOrEqual(2 * Math.PI + 1e-10);
      }
    });
  });
});
