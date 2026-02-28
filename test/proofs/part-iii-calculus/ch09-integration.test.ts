// test/proofs/part-iii-calculus/ch09-integration.test.ts
// Computational verification for Chapter 9: Integration
// Proof document: .planning/v1.50a/half-b/proofs/ch09-integration.md
// Phase 476, Subversion 1.50.59

import { describe, test, expect } from 'vitest';
import { numericalDerivative } from '../helpers/numerical';

// ---------------------------------------------------------------------------
// Helper: Midpoint Riemann sum for numerical integration
// Used for FTC and IBP numerical verification
// ---------------------------------------------------------------------------
function riemannSum(f: (x: number) => number, a: number, b: number, n = 10000): number {
  const h = (b - a) / n;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += f(a + (i + 0.5) * h) * h; // midpoint rule
  }
  return sum;
}

describe('Chapter 9: Integration — Computational Verification', () => {
  // ---------------------------------------------------------------------------
  // proof-9-1-ftc-part1: FTC Part 1 — d/dx(∫ₐˣ f(t)dt) = f(x)
  // Classification: L3 — requires MVT in the proof
  // Method: Numerical derivative of the integral function vs. integrand value
  // Platform connection: cumulative radius growth in observer-bridge.ts
  // ---------------------------------------------------------------------------
  describe('proof-9-1: FTC Part 1 — derivative of integral equals integrand', () => {
    test('d/dx(∫₀ˣ sin(t)dt) = sin(x) at multiple x values', () => {
      const xValues = [0.5, 1.0, 1.5, 2.0, 2.5];
      for (const x of xValues) {
        // G(x) = ∫₀ˣ sin(t)dt = -cos(x) + cos(0) = 1 - cos(x)
        // FTC Part 1: G'(x) should equal sin(x)
        const G = (t: number) => riemannSum(Math.sin, 0, t, 1000);
        const numericalDeriv = numericalDerivative(G, x, 1e-4);
        expect(numericalDeriv).toBeCloseTo(Math.sin(x), 2);
      }
    });

    test('d/dx(∫₀ˣ eᵗdt) = eˣ (FTC Part 1)', () => {
      const xValues = [0.0, 0.5, 1.0];
      for (const x of xValues) {
        const G = (t: number) => riemannSum(Math.exp, 0, t, 1000);
        const numericalDeriv = numericalDerivative(G, x, 1e-4);
        expect(numericalDeriv).toBeCloseTo(Math.exp(x), 2);
      }
    });

    test('d/dx(∫₀ˣ t²dt) = x² (FTC Part 1 — polynomial integrand)', () => {
      const xValues = [0.5, 1.0, 1.5, 2.0];
      for (const x of xValues) {
        const G = (t: number) => riemannSum((s) => s * s, 0, t, 1000);
        const numericalDeriv = numericalDerivative(G, x, 1e-4);
        expect(numericalDeriv).toBeCloseTo(x * x, 2);
      }
    });

    // Platform connection: discrete sum analog of FTC
    // The radius growth model (newRadius = existing.radius + 0.01) is a Riemann sum.
    // FTC guarantees the continuous limit is well-defined.
    test('discrete sum converges to integral: sum of (1/n) ≈ ∫₀¹ 1 dx = 1 as n → ∞', () => {
      const ns = [100, 1000, 10000];
      for (const n of ns) {
        let sum = 0;
        for (let i = 0; i < n; i++) {
          sum += 1 / n; // step size = 1/n, value = 1 at each point
        }
        expect(sum).toBeCloseTo(1, 4);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // proof-9-2-ftc-part2: FTC Part 2 — ∫ₐᵇ f dx = F(b) - F(a)
  // Classification: L3 — definite integral via antiderivative
  // Method: Riemann sum vs. antiderivative evaluation
  // ---------------------------------------------------------------------------
  describe('proof-9-2: FTC Part 2 — definite integral via antiderivative', () => {
    test('∫₀^π sin(x)dx = [-cos(x)]₀^π = 2', () => {
      const riemann = riemannSum(Math.sin, 0, Math.PI, 100000);
      expect(riemann).toBeCloseTo(2, 3);
      // Antiderivative: -cos(π) - (-cos(0)) = 1 + 1 = 2
      const antiderivative = -Math.cos(Math.PI) - -Math.cos(0);
      expect(antiderivative).toBeCloseTo(2, 10);
    });

    test('∫₀¹ x² dx = [x³/3]₀¹ = 1/3', () => {
      const riemann = riemannSum((x) => x * x, 0, 1, 100000);
      expect(riemann).toBeCloseTo(1 / 3, 4);
      const antiderivative = 1 / 3 - 0;
      expect(antiderivative).toBeCloseTo(1 / 3, 10);
    });

    test('∫₀¹ eˣ dx = e - 1', () => {
      const riemann = riemannSum(Math.exp, 0, 1, 100000);
      expect(riemann).toBeCloseTo(Math.E - 1, 4);
    });

    test('∫₀^(π/2) cos(x) dx = [sin(x)]₀^(π/2) = 1', () => {
      const riemann = riemannSum(Math.cos, 0, Math.PI / 2, 100000);
      expect(riemann).toBeCloseTo(1, 4);
      const antiderivative = Math.sin(Math.PI / 2) - Math.sin(0);
      expect(antiderivative).toBeCloseTo(1, 10);
    });

    test('∫₁² 1/x dx = ln(2)', () => {
      const riemann = riemannSum((x) => 1 / x, 1, 2, 100000);
      expect(riemann).toBeCloseTo(Math.log(2), 4);
    });

    test('Riemann sum convergence: more subdivisions → more accurate for ∫₀¹ x² dx', () => {
      const exact = 1 / 3;
      const ns = [10, 100, 1000, 10000];
      let prevError = 1;
      for (const n of ns) {
        const approx = riemannSum((x) => x * x, 0, 1, n);
        const error = Math.abs(approx - exact);
        expect(error).toBeLessThan(prevError + 1e-10);
        prevError = error;
      }
    });
  });

  // ---------------------------------------------------------------------------
  // proof-9-3-integration-by-parts: ∫u dv = uv - ∫v du
  // Classification: L2 — follows directly from product rule
  // Method: Numerical Riemann sum vs. analytical IBP result
  // ---------------------------------------------------------------------------
  describe('proof-9-3: integration by parts ∫u dv = uv - ∫v du', () => {
    test('∫₀¹ x·eˣ dx = 1 (IBP: u=x, dv=eˣdx → uv - ∫v du = x·eˣ - eˣ)', () => {
      // Antiderivative via IBP: x·eˣ - eˣ + C
      const antideriv = (x: number) => x * Math.exp(x) - Math.exp(x);
      const analytical = antideriv(1) - antideriv(0);
      // = (e - e) - (0 - 1) = 0 + 1 = 1
      expect(analytical).toBeCloseTo(1, 10);

      const riemann = riemannSum((x) => x * Math.exp(x), 0, 1, 100000);
      expect(riemann).toBeCloseTo(1, 4);
    });

    test('∫₀^(π/2) x·cos(x) dx = π/2 - 1 (IBP: u=x, dv=cos dx)', () => {
      // Antiderivative via IBP: x·sin(x) + cos(x) + C
      const antideriv = (x: number) => x * Math.sin(x) + Math.cos(x);
      const analytical = antideriv(Math.PI / 2) - antideriv(0);
      // = (π/2 · 1 + 0) - (0 + 1) = π/2 - 1
      expect(analytical).toBeCloseTo(Math.PI / 2 - 1, 8);

      const riemann = riemannSum((x) => x * Math.cos(x), 0, Math.PI / 2, 100000);
      expect(riemann).toBeCloseTo(Math.PI / 2 - 1, 4);
    });

    test('∫₀¹ x²·eˣ dx — IBP applied twice (reduction formula)', () => {
      // Antiderivative: x²eˣ - 2xeˣ + 2eˣ = eˣ(x² - 2x + 2)
      const antideriv = (x: number) => Math.exp(x) * (x * x - 2 * x + 2);
      const analytical = antideriv(1) - antideriv(0);
      // = e*(1 - 2 + 2) - 1*(0 - 0 + 2) = e - 2
      expect(analytical).toBeCloseTo(Math.E - 2, 8);

      const riemann = riemannSum((x) => x * x * Math.exp(x), 0, 1, 100000);
      expect(riemann).toBeCloseTo(Math.E - 2, 4);
    });

    // IBP from product rule: d/dx(uv) = u'v + uv' → ∫uv' dx = uv - ∫u'v dx
    // Numerical verification of the product rule → IBP derivation
    test('IBP is an exact consequence of the product rule (no approximation)', () => {
      // ∫₀¹ d/dx(x·eˣ) dx = [x·eˣ]₀¹ = 1·e - 0 = e (FTC Part 2)
      // d/dx(x·eˣ) = eˣ + x·eˣ (product rule)
      // So ∫₀¹(eˣ + x·eˣ)dx = e
      // Rearranging: ∫₀¹ x·eˣ dx = e - ∫₀¹ eˣ dx = e - (e - 1) = 1
      const integral1 = riemannSum(Math.exp, 0, 1, 100000); // ∫₀¹ eˣ dx = e - 1
      const integral2 = riemannSum((x) => x * Math.exp(x), 0, 1, 100000); // ∫₀¹ x·eˣ dx
      // Verify: (e - 1) + ∫₀¹ x·eˣ dx = e
      expect(integral1 + integral2).toBeCloseTo(Math.E, 4);
    });
  });

  // ---------------------------------------------------------------------------
  // proof-9-4-simpsons-rule: numerical integration via Simpson's rule
  // Classification: L2 — algebraic derivation from quadratic interpolation
  // Method: Composite Simpson's rule vs. exact analytical values
  // ---------------------------------------------------------------------------
  describe("proof-9-4: Simpson's rule numerical integration", () => {
    // Basic Simpson's rule: ∫ₐᵇ f dx ≈ (b-a)/6 * (f(a) + 4f((a+b)/2) + f(b))
    function simpsonBasic(f: (x: number) => number, a: number, b: number): number {
      const m = (a + b) / 2;
      return ((b - a) / 6) * (f(a) + 4 * f(m) + f(b));
    }

    // Composite Simpson's rule with 2n subintervals
    function simpsonComposite(f: (x: number) => number, a: number, b: number, n = 10): number {
      const h = (b - a) / (2 * n);
      let sum = f(a) + f(b);
      for (let i = 1; i < 2 * n; i++) {
        const coeff = i % 2 === 0 ? 2 : 4;
        sum += coeff * f(a + i * h);
      }
      return (h / 3) * sum;
    }

    test("Simpson's rule is exact for polynomials of degree ≤ 3 (∫₀¹ x² dx = 1/3)", () => {
      // Exact for degree ≤ 3 because it integrates quadratic interpolant exactly
      const approx = simpsonBasic((x) => x * x, 0, 1);
      expect(approx).toBeCloseTo(1 / 3, 10);
    });

    test("Simpson's rule is exact for ∫₀¹ x³ dx = 1/4", () => {
      const approx = simpsonBasic((x) => x * x * x, 0, 1);
      expect(approx).toBeCloseTo(1 / 4, 10);
    });

    test("composite Simpson's rule: ∫₀^π sin(x)dx ≈ 2 with good accuracy (n=10)", () => {
      const approx = simpsonComposite(Math.sin, 0, Math.PI, 10);
      expect(approx).toBeCloseTo(2, 4);
    });

    test("composite Simpson's rule convergence: more intervals → more accurate", () => {
      const exact = 2; // ∫₀^π sin(x) dx = 2
      const ns = [2, 5, 10, 20];
      let prevError = 1;
      for (const n of ns) {
        const approx = simpsonComposite(Math.sin, 0, Math.PI, n);
        const error = Math.abs(approx - exact);
        expect(error).toBeLessThan(prevError + 1e-10);
        prevError = error;
      }
    });

    test("Simpson's rule more accurate than midpoint rule for smooth functions", () => {
      // For ∫₀¹ eˣ dx = e - 1 ≈ 1.71828...
      const exact = Math.E - 1;
      const simpsonApprox = simpsonBasic(Math.exp, 0, 1);
      const midpointApprox = riemannSum(Math.exp, 0, 1, 1); // single midpoint
      const simpsonError = Math.abs(simpsonApprox - exact);
      const midpointError = Math.abs(midpointApprox - exact);
      expect(simpsonError).toBeLessThan(midpointError);
    });
  });
});
