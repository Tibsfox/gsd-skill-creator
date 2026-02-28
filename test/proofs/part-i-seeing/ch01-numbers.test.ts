// test/proofs/part-i-seeing/ch01-numbers.test.ts
// Computational verification for Chapter 1: Numbers — Real Number System and Computability
// Proof document: .planning/v1.50a/half-b/proofs/ch01-numbers.md
// Phase 475, Subversion 1.50.51

import { describe, test, expect } from 'vitest';
import { closeToAbs, closeToRel, testAngles } from '../helpers/numerical';

// Suppress unused import warnings: helpers are available for all chapter tests
void closeToAbs;
void closeToRel;
void testAngles;

describe('Chapter 1: Numbers — Computational Verification', () => {
  // ---------------------------------------------------------------------------
  // proof-1-1-sqrt2-irrational
  // Technique: Numerical + exhaustive search
  // ---------------------------------------------------------------------------
  describe('proof-1-1: sqrt(2) is irrational', () => {
    test('no integer pair p/q with q<=1000 satisfies (p/q)^2 = 2 exactly', () => {
      // If sqrt(2) = p/q, then p^2 = 2*q^2. We check all q up to 1000.
      let foundExact = false;
      for (let q = 1; q <= 1000; q++) {
        // p = round(sqrt(2) * q), check if p^2 = 2*q^2 exactly
        const p = Math.round(Math.sqrt(2) * q);
        if (p * p === 2 * q * q) {
          foundExact = true;
          break;
        }
      }
      expect(foundExact).toBe(false);
    });

    test('rational approximations to sqrt(2) converge monotonically but never reach it', () => {
      // Continued fraction convergents for sqrt(2): 1/1, 3/2, 7/5, 17/12, 41/29, 99/70
      const convergents: [number, number][] = [[1, 1], [3, 2], [7, 5], [17, 12], [41, 29], [99, 70]];
      const sqrt2 = Math.sqrt(2);
      const errors = convergents.map(([p, q]) => Math.abs(p / q - sqrt2));

      // Each approximation has strictly positive error (never equal to sqrt2)
      for (const error of errors) {
        expect(error).toBeGreaterThan(0);
      }

      // Errors are decreasing (convergents get closer to sqrt(2))
      for (let i = 1; i < errors.length; i++) {
        expect(errors[i]).toBeLessThan(errors[i - 1]);
      }

      // Last convergent 99/70 should be within 1e-4 of sqrt(2)
      const [p, q] = convergents[convergents.length - 1];
      expect(Math.abs(p / q - sqrt2)).toBeLessThan(1e-4);
    });
  });

  // ---------------------------------------------------------------------------
  // proof-1-4-density: density of rationals in reals
  // Technique 3: Constructive — build the rational and check it lies in (a, b)
  // ---------------------------------------------------------------------------
  describe('proof-1-4: density of rationals (constructive verification)', () => {
    test('for any two distinct real values a < b, a rational lies strictly between them', () => {
      // Test pairs covering several intervals including near-integer and transcendental
      const pairs: [number, number][] = [
        [0.1, 0.2],
        [0.999, 1.0],
        [Math.PI - 0.01, Math.PI + 0.01],
        [Math.E, Math.E + 0.001],
        [1.4142, 1.4143],  // near sqrt(2)
      ];

      for (const [a, b] of pairs) {
        // Archimedean property: choose n > 1/(b-a), then ceil(a*n)/n lies in (a,b)
        const n = Math.ceil(1 / (b - a)) + 1;
        const m = Math.ceil(a * n);
        const rational = m / n;
        expect(rational).toBeGreaterThan(a);
        expect(rational).toBeLessThan(b);
      }
    });

    test('rational constructed between consecutive integer parts has integer numerator and denominator', () => {
      // 12-TET context: between 1.0 and 2.0, the midpoint 3/2 is rational
      const a = 1.0;
      const b = 2.0;
      const midpoint = (a + b) / 2; // = 1.5 = 3/2
      // Verify 3/2 lies strictly in (1, 2)
      expect(midpoint).toBeGreaterThan(a);
      expect(midpoint).toBeLessThan(b);
      // Verify 3/2 = 1.5 is representable as a ratio of small integers
      expect(3 / 2).toBe(midpoint);
    });
  });

  // ---------------------------------------------------------------------------
  // proof-1-2-rationals-countable (structural verification)
  // Technique: Constructive enumeration — Cantor zigzag
  // ---------------------------------------------------------------------------
  describe('proof-1-2: rational enumeration (Cantor zigzag structural check)', () => {
    test('first 20 positive rationals in Cantor diagonal enumeration are distinct', () => {
      // Cantor zigzag: enumerate p/q for (p+q) = 2, 3, 4, ...
      const seen = new Set<string>();
      const rationals: string[] = [];

      for (let sum = 2; sum <= 8 && rationals.length < 20; sum++) {
        for (let p = 1; p < sum && rationals.length < 20; p++) {
          const q = sum - p;
          // Reduce fraction to lowest terms using GCD
          const g = gcd(p, q);
          const key = `${p / g}/${q / g}`;
          if (!seen.has(key)) {
            seen.add(key);
            rationals.push(key);
          }
        }
      }

      // Each rational in the enumeration is unique
      expect(new Set(rationals).size).toBe(rationals.length);
      expect(rationals.length).toBe(20);
    });
  });
});

// Helper: greatest common divisor (Euclidean algorithm)
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}
