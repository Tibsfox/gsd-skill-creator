// test/proofs/part-iii-calculus/ch08-calculus-i.test.ts
// Computational verification for Chapter 8: Calculus I — Limits, Derivatives, and Transcendentals
// Proof document: .planning/v1.50a/half-b/proofs/ch08-calculus-i.md
// Phase 476, Subversion 1.50.58

import { describe, test, expect } from 'vitest';
import { closeToAbs, testAngles, numericalDerivative } from '../helpers/numerical';

describe('Chapter 8: Calculus I — Computational Verification', () => {
  // ---------------------------------------------------------------------------
  // proof-8-1-epsilon-delta-linear: ε-δ limit lim_{x→2}(3x-1) = 5 with δ = ε/3
  // Classification: L2 — standard ε-δ example
  // Method: Numerical — verify |3x-1 - 5| < ε whenever 0 < |x-2| < δ = ε/3
  // ---------------------------------------------------------------------------
  describe('proof-8-1: ε-δ limit lim_{x→2}(3x-1) = 5 with δ = ε/3', () => {
    const epsilons = [0.1, 0.01, 0.001];

    test.each(epsilons)(
      'for ε = %f, δ = ε/3 satisfies the ε-δ condition at 100 random x values',
      (epsilon) => {
        const delta = epsilon / 3;
        for (let i = 0; i < 100; i++) {
          // x within delta of 2 (but not exactly 2)
          const offset = (Math.random() * 2 - 1) * delta * 0.99;
          if (Math.abs(offset) < 1e-15) continue;
          const x = 2 + offset;
          const fDiff = Math.abs((3 * x - 1) - 5);
          expect(fDiff).toBeLessThan(epsilon);
        }
      },
    );

    test('δ = ε/3 is tight: x exactly delta away gives |f - L| exactly epsilon', () => {
      // For f(x) = 3x - 1: |f(x) - 5| = |3x - 6| = 3|x - 2|
      // So |x - 2| = delta = epsilon/3 => |f(x) - 5| = 3 * delta = epsilon
      const epsilon = 0.1;
      const delta = epsilon / 3;
      const x = 2 + delta;
      const fDiff = Math.abs((3 * x - 1) - 5);
      expect(fDiff).toBeCloseTo(epsilon, 10);
    });
  });

  // ---------------------------------------------------------------------------
  // proof-8-2-limit-sum-law: limit of sum equals sum of limits
  // Classification: L3 — requires epsilon-delta argument for sum
  // Method: Numerical verification at limit point
  // ---------------------------------------------------------------------------
  describe('proof-8-2: limit sum law — verified numerically', () => {
    test('lim_{x→0}(sin x + x²) = lim sin x + lim x² = 0 + 0 = 0', () => {
      const h = 1e-6;
      const limit = Math.sin(h) + h * h;
      expect(limit).toBeCloseTo(0, 5);
    });

    test('lim_{x→1}(x² + 2x) = 1 + 2 = 3 (sum law)', () => {
      const h = 1e-7;
      const x = 1 + h;
      const val = x * x + 2 * x;
      expect(val).toBeCloseTo(3, 5);
    });

    test('sum law: lim(f + g) = lim f + lim g for f=sin, g=cos at x→0', () => {
      const h = 1e-8;
      const sumAtZero = Math.sin(h) + Math.cos(h);
      expect(sumAtZero).toBeCloseTo(0 + 1, 5); // sin(0)=0, cos(0)=1
    });
  });

  // ---------------------------------------------------------------------------
  // proof-8-3-power-rule: d/dx(x^n) = n*x^(n-1)
  // Classification: L2 — follows from binomial theorem
  // Method: Numerical central difference vs. analytical formula
  // ---------------------------------------------------------------------------
  describe('proof-8-3: power rule d/dx(x^n) = n*x^(n-1)', () => {
    const xValues = [0.5, 1.0, 2.0, 3.0];
    const nValues = [1, 2, 3, 4, 5];

    test.each(nValues.flatMap((n) => xValues.map((x) => [n, x])))(
      'd/dx(x^%i) = %i*x^(%i-1) at x = %f',
      (n, x) => {
        const analytical = n * Math.pow(x, n - 1);
        const numerical = numericalDerivative((t) => Math.pow(t, n), x);
        expect(numerical).toBeCloseTo(analytical, 5);
      },
    );

    test('power rule at negative x (n=2): d/dx(x²) = 2x at x = -1.5', () => {
      const x = -1.5;
      const analytical = 2 * x;
      const numerical = numericalDerivative((t) => t * t, x);
      expect(numerical).toBeCloseTo(analytical, 5);
    });
  });

  // ---------------------------------------------------------------------------
  // proof-8-4-product-rule: d/dx(fg) = f'g + fg'
  // Classification: L2 — follows from limit definition
  // Method: Numerical derivative vs. analytical product rule expression
  // ---------------------------------------------------------------------------
  describe("proof-8-4: product rule d/dx(fg) = f'g + fg'", () => {
    test("d/dx(x² * sin x) = 2x*sin(x) + x²*cos(x) — product rule", () => {
      const testXs = [0.5, 1.0, 1.5, 2.0, -1.0];
      for (const x of testXs) {
        const analytical = 2 * x * Math.sin(x) + x * x * Math.cos(x);
        const numerical = numericalDerivative((t) => t * t * Math.sin(t), x);
        expect(numerical).toBeCloseTo(analytical, 5);
      }
    });

    test("d/dx(e^x * cos x) = e^x*(cos x - sin x) — product rule", () => {
      const testXs = [0.0, 0.5, 1.0, -0.5];
      for (const x of testXs) {
        const analytical = Math.exp(x) * (Math.cos(x) - Math.sin(x));
        const numerical = numericalDerivative((t) => Math.exp(t) * Math.cos(t), x);
        expect(numerical).toBeCloseTo(analytical, 5);
      }
    });

    test("d/dx(x³ * e^x) = x²*e^x*(3 + x) — product rule", () => {
      const testXs = [0.5, 1.0, 2.0];
      for (const x of testXs) {
        const analytical = x * x * Math.exp(x) * (3 + x);
        const numerical = numericalDerivative((t) => t * t * t * Math.exp(t), x);
        expect(numerical).toBeCloseTo(analytical, 4);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // proof-8-5-chain-rule: d/dx(f(g(x))) = f'(g(x)) * g'(x)
  // Classification: L3 — Q(y) auxiliary function required
  // Method: Numerical derivative vs. analytical chain rule expression
  // ---------------------------------------------------------------------------
  describe("proof-8-5: chain rule d/dx(f(g(x))) = f'(g(x))*g'(x)", () => {
    test("d/dx(sin(x²)) = 2x*cos(x²) — chain rule", () => {
      const testXs = [0.5, 1.0, 1.5, 2.0, -1.0];
      for (const x of testXs) {
        const analytical = 2 * x * Math.cos(x * x);
        const numerical = numericalDerivative((t) => Math.sin(t * t), x);
        expect(numerical).toBeCloseTo(analytical, 5);
      }
    });

    test("d/dx(e^(sin x)) = e^(sin x) * cos x — chain rule", () => {
      const testXs = [0.0, 0.5, 1.0, Math.PI / 4];
      for (const x of testXs) {
        const analytical = Math.exp(Math.sin(x)) * Math.cos(x);
        const numerical = numericalDerivative((t) => Math.exp(Math.sin(t)), x);
        expect(numerical).toBeCloseTo(analytical, 5);
      }
    });

    test("d/dx(cos(3x + 1)) = -3*sin(3x + 1) — chain rule", () => {
      const testXs = [0.0, 0.5, 1.0, -0.5];
      for (const x of testXs) {
        const analytical = -3 * Math.sin(3 * x + 1);
        const numerical = numericalDerivative((t) => Math.cos(3 * t + 1), x);
        expect(numerical).toBeCloseTo(analytical, 5);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // proof-8-6-sinh-over-h: sin(h)/h → 1 as h → 0 (Squeeze Theorem)
  // Classification: L2/L3 — geometric squeeze argument
  // Method: Convergence testing + squeeze inequality bounds
  // ---------------------------------------------------------------------------
  describe('proof-8-6: sin(h)/h → 1 as h → 0 (Squeeze Theorem)', () => {
    const smallH = [0.1, 0.01, 0.001, 0.0001];

    test.each(smallH)('sin(%f) / %f is within Taylor error bound of 1', (h) => {
      const ratio = Math.sin(h) / h;
      // Taylor series: sin(h)/h = 1 - h²/6 + h⁴/120 - ...
      // Error from 1 is bounded by h²/6
      const errorBound = (h * h) / 6 + 1e-14;
      expect(Math.abs(ratio - 1)).toBeLessThan(errorBound);
    });

    test('squeeze bounds hold: cos(h) < sin(h)/h < 1 for 0 < h < π/2', () => {
      const hValues = [0.1, 0.3, 0.5, 0.8, 1.0, 1.4];
      for (const h of hValues) {
        const ratio = Math.sin(h) / h;
        // Lower squeeze bound: cos(h) ≤ sin(h)/h
        expect(ratio).toBeGreaterThanOrEqual(Math.cos(h) - 1e-10);
        // Upper squeeze bound: sin(h)/h ≤ 1
        expect(ratio).toBeLessThanOrEqual(1 + 1e-10);
      }
    });

    test('convergence: |sin(h)/h - 1| decreases as h → 0', () => {
      const hValues = [0.1, 0.01, 0.001, 0.0001];
      let prevError = 1;
      for (const h of hValues) {
        const error = Math.abs(Math.sin(h) / h - 1);
        expect(error).toBeLessThan(prevError);
        prevError = error;
      }
    });
  });

  // ---------------------------------------------------------------------------
  // proof-8-7-derivative-sin: d/dx(sin x) = cos x
  // Classification: L2 — follows from sin(h)/h → 1 and cos(h) → 1
  // Method: Numerical derivative matches analytical formula at test angles
  // ---------------------------------------------------------------------------
  describe('proof-8-7: d/dx(sin x) = cos x', () => {
    const angles = testAngles(20);

    test.each(angles)(
      'numerical derivative of sin at θ=%f equals cos(θ)',
      (theta) => {
        const analytical = Math.cos(theta);
        const numerical = numericalDerivative(Math.sin, theta);
        expect(numerical).toBeCloseTo(analytical, 5);
      },
    );

    test('d/dx(cos x) = -sin x at multiple angles', () => {
      for (const theta of testAngles(12)) {
        const analytical = -Math.sin(theta);
        const numerical = numericalDerivative(Math.cos, theta);
        expect(numerical).toBeCloseTo(analytical, 5);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // proof-8-8-exp-derivative: d/dx(e^x) = e^x
  // Classification: L2 — defining property of e; L5 acknowledgment for uniform convergence
  // Method: Numerical central difference matches e^x at multiple x values
  // ---------------------------------------------------------------------------
  describe('proof-8-8: d/dx(e^x) = e^x (the unique fixed point of differentiation)', () => {
    const xValues = [-2, -1, 0, 0.5, 1, 2, 3];

    test.each(xValues)('numerical derivative of e^%f equals e^%f', (x) => {
      const analytical = Math.exp(x);
      const numerical = numericalDerivative(Math.exp, x);
      expect(numerical).toBeCloseTo(analytical, 5);
    });

    test('e^x is its own derivative: d/dx(e^x) - e^x ≈ 0 at x = 0, 1, 2', () => {
      for (const x of [0, 1, 2]) {
        const diff = numericalDerivative(Math.exp, x) - Math.exp(x);
        expect(Math.abs(diff)).toBeLessThan(1e-5);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // proof-8-9-lhopital: L'Hôpital's rule — numerical application verification
  // Classification: L2 applied, L4 acknowledged for the rule itself
  // Method: Verify limit values predicted by L'Hôpital's rule numerically
  // ---------------------------------------------------------------------------
  describe("proof-8-9: L'Hôpital's rule (application verification)", () => {
    test("lim_{x→0} sin(x)/x = 1 (L'Hôpital: cos(0)/1 = 1)", () => {
      const h = 1e-8;
      expect(Math.sin(h) / h).toBeCloseTo(1, 5);
    });

    test("lim_{x→0} (e^x - 1)/x = 1 (L'Hôpital: e^0/1 = 1)", () => {
      const h = 1e-8;
      expect((Math.exp(h) - 1) / h).toBeCloseTo(1, 5);
    });

    test("lim_{x→0} (1 - cos x)/x² = 1/2 (L'Hôpital applied twice: sin(0)/2 → cos(0)/2 = 1/2)", () => {
      // Use larger h to avoid numerical cancellation
      const h = 1e-4;
      const limit = (1 - Math.cos(h)) / (h * h);
      expect(limit).toBeCloseTo(0.5, 3);
    });

    test("lim_{x→0} (x - sin x)/x³ = 1/6 (L'Hôpital applied three times)", () => {
      const h = 1e-4;
      const limit = (h - Math.sin(h)) / (h * h * h);
      expect(limit).toBeCloseTo(1 / 6, 3);
    });
  });
});
