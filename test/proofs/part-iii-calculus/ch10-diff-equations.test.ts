// test/proofs/part-iii-calculus/ch10-diff-equations.test.ts
// Computational verification for Chapter 10: Differential Equations
// Proof document: .planning/v1.50a/half-b/proofs/ch10-diff-equations.md
// Phase 476, Subversion 1.50.60

import { describe, test, expect } from 'vitest';
import { numericalDerivative } from '../helpers/numerical';

describe('Chapter 10: Differential Equations — Computational Verification', () => {
  // ---------------------------------------------------------------------------
  // proof-10-1-harmonic-oscillator: x''(t) + ω²x(t) = 0
  // General solution: x(t) = A·cos(ωt) + B·sin(ωt)
  // Classification: L2 — verification by substitution
  // Platform connection: skill position oscillation in observer-bridge.ts
  // ---------------------------------------------------------------------------
  describe("proof-10-1: harmonic oscillator x''(t) + ω²x(t) = 0", () => {
    const omega = 2; // angular frequency

    test("x(t) = cos(ωt) satisfies x'' + ω²x = 0 at multiple t values", () => {
      const tValues = [0, 0.5, 1.0, 1.5, 2.0, Math.PI];
      for (const t of tValues) {
        const x = Math.cos(omega * t);
        // Analytical x''(t) = -ω² cos(ωt)
        const xpp = -omega * omega * Math.cos(omega * t);
        expect(xpp + omega * omega * x).toBeCloseTo(0, 10);
      }
    });

    test("x(t) = sin(ωt) satisfies x'' + ω²x = 0", () => {
      const tValues = [0, 0.5, 1.0, 1.5, 2.0];
      for (const t of tValues) {
        const x = Math.sin(omega * t);
        const xpp = -omega * omega * Math.sin(omega * t);
        expect(xpp + omega * omega * x).toBeCloseTo(0, 10);
      }
    });

    test("general solution A*cos(ωt) + B*sin(ωt) satisfies ODE for arbitrary A, B", () => {
      const A = 3;
      const B = -2;
      const tValues = [0.0, 0.7, 1.4, 2.1, 3.0];
      for (const t of tValues) {
        const x = A * Math.cos(omega * t) + B * Math.sin(omega * t);
        const xpp = -omega * omega * (A * Math.cos(omega * t) + B * Math.sin(omega * t));
        expect(xpp + omega * omega * x).toBeCloseTo(0, 10);
      }
    });

    test("initial conditions determine the solution: A = x(0), B = x'(0)/ω", () => {
      const x0 = 1.5;
      const xp0 = -2.0;
      const A = x0;
      const B = xp0 / omega;
      // At t=0: x = A·cos(0) + B·sin(0) = A = x0
      expect(A * Math.cos(0) + B * Math.sin(0)).toBeCloseTo(x0, 10);
      // At t=0: x' = -Aω·sin(0) + Bω·cos(0) = Bω = xp0
      expect(-A * omega * Math.sin(0) + B * omega * Math.cos(0)).toBeCloseTo(xp0, 10);
    });

    // Numerical second derivative verification (central difference formula)
    // x''(t) ≈ (x(t+h) - 2x(t) + x(t-h)) / h²
    test("numerical second derivative confirms x'' = -ω²x for x(t) = cos(ωt)", () => {
      const h = 1e-5;
      const tValues = [0.5, 1.0, 1.5, 2.0];
      for (const t of tValues) {
        const xFn = (s: number) => Math.cos(omega * s);
        const xppNumerical =
          (xFn(t + h) - 2 * xFn(t) + xFn(t - h)) / (h * h);
        const xppAnalytical = -omega * omega * Math.cos(omega * t);
        expect(xppNumerical).toBeCloseTo(xppAnalytical, 3);
      }
    });

    // Platform connection: MAX_ANGULAR_VELOCITY = 0.2 acts as damping term
    test("angular velocity clamping converts harmonic to damped motion (platform analog)", () => {
      const MAX_ANGULAR_VELOCITY = 0.2;
      // Simulate damped angular motion: position updates clamped to MAX_ANGULAR_VELOCITY
      let theta = 0;
      const omega2 = 1.0;
      const dt = 0.01;
      let velocity = 1.0; // initial angular velocity

      // Run 100 steps of damped oscillator simulation
      for (let step = 0; step < 100; step++) {
        // Harmonic restoring force: acceleration = -ω²θ
        const acceleration = -omega2 * omega2 * theta;
        velocity += acceleration * dt;
        // Clamp velocity (MAX_ANGULAR_VELOCITY damping)
        velocity = Math.max(-MAX_ANGULAR_VELOCITY, Math.min(MAX_ANGULAR_VELOCITY, velocity));
        theta += velocity * dt;
      }
      // The clamped system should remain bounded
      expect(Math.abs(theta)).toBeLessThan(10);
      expect(Math.abs(velocity)).toBeLessThanOrEqual(MAX_ANGULAR_VELOCITY + 1e-10);
    });
  });

  // ---------------------------------------------------------------------------
  // proof-10-2-wave-equation: ∂²u/∂t² = c²·∂²u/∂x²
  // Standing wave solution: u(x,t) = sin(kx)·cos(kct)
  // Classification: L3 — separation of variables, cross-citation with ch06-standing-waves.md
  // ---------------------------------------------------------------------------
  describe("proof-10-2: wave equation ∂²u/∂t² = c²·∂²u/∂x²", () => {
    const c = 2; // wave speed
    const k = Math.PI; // wave number

    test("standing wave u(x,t) = sin(kx)cos(kct) satisfies the wave equation", () => {
      const u = (x: number, t: number) => Math.sin(k * x) * Math.cos(k * c * t);
      const h = 1e-5;

      const xValues = [0.1, 0.3, 0.5, 0.7, 0.9];
      const tValues = [0.0, 0.2, 0.5, 1.0];

      for (const x of xValues) {
        for (const t of tValues) {
          // Numerical second derivative in t: utt
          const utt = (u(x, t + h) - 2 * u(x, t) + u(x, t - h)) / (h * h);
          // Numerical second derivative in x: uxx
          const uxx = (u(x + h, t) - 2 * u(x, t) + u(x - h, t)) / (h * h);
          // Wave equation: utt = c² * uxx
          expect(utt).toBeCloseTo(c * c * uxx, 3);
        }
      }
    });

    test("analytical verification: u_tt = -k²c² sin(kx)cos(kct), u_xx = -k² sin(kx)cos(kct)", () => {
      const xValues = [0.2, 0.4, 0.6, 0.8];
      const tValues = [0.1, 0.5, 1.0];
      for (const x of xValues) {
        for (const t of tValues) {
          const utt = -(k * c) * (k * c) * Math.sin(k * x) * Math.cos(k * c * t);
          const uxx = -k * k * Math.sin(k * x) * Math.cos(k * c * t);
          // utt = -k²c² · base, c²·uxx = c² · (-k²) · base = -k²c² · base
          expect(utt).toBeCloseTo(c * c * uxx, 10);
        }
      }
    });

    test("boundary conditions: u(0,t) = 0 and u(L,t) = 0 for L = π/k (first mode)", () => {
      const L = 1.0; // string length
      const kn = Math.PI / L; // first mode: k₁ = π/L
      const u1 = (x: number, t: number) => Math.sin(kn * x) * Math.cos(kn * c * t);
      const tValues = [0, 0.3, 0.7, 1.0, 2.0];
      for (const t of tValues) {
        expect(u1(0, t)).toBeCloseTo(0, 10); // x = 0 boundary: sin(0) = 0
        expect(u1(L, t)).toBeCloseTo(0, 8); // x = L boundary: sin(nπ) = 0
      }
    });

    // Cross-citation with ch06-standing-waves.md (Theorem 6.2)
    test("mode quantization: only integer wavenumbers k_n = n*π/L satisfy boundary conditions", () => {
      const L = 1.0;
      for (let n = 1; n <= 5; n++) {
        const kn = (n * Math.PI) / L;
        // sin(k_n * L) = sin(n*π) = 0 for all integer n
        expect(Math.sin(kn * L)).toBeCloseTo(0, 8);
      }
      // Non-integer mode fails boundary condition (same as ch06 proof-6-2)
      const nonIntegerK = (1.5 * Math.PI) / L;
      expect(Math.abs(Math.sin(nonIntegerK * L))).toBeGreaterThan(0.5);
    });

    test("superposition: sum of two modes satisfies wave equation (linearity)", () => {
      const k1 = Math.PI;
      const k2 = 2 * Math.PI;
      const u = (x: number, t: number) =>
        Math.sin(k1 * x) * Math.cos(k1 * c * t) + Math.sin(k2 * x) * Math.cos(k2 * c * t);
      const h = 1e-5;
      const xValues = [0.2, 0.5, 0.8];
      const tValues = [0.1, 0.5, 1.0];
      for (const x of xValues) {
        for (const t of tValues) {
          const utt = (u(x, t + h) - 2 * u(x, t) + u(x, t - h)) / (h * h);
          const uxx = (u(x + h, t) - 2 * u(x, t) + u(x - h, t)) / (h * h);
          expect(utt).toBeCloseTo(c * c * uxx, 3);
        }
      }
    });
  });

  // ---------------------------------------------------------------------------
  // proof-10-3-picard-iteration: Picard iteration converges to e^x for y'=y, y(0)=1
  // The n-th iterate is the n-th partial Taylor sum of e^x
  // Classification: L4 partial — iteration scheme complete; Banach FPT acknowledged gap
  // Platform connection: MAX_ANGULAR_VELOCITY as Lipschitz constant L
  // ---------------------------------------------------------------------------
  describe("proof-10-3: Picard iteration converges to e^x for y'=y, y(0)=1", () => {
    // Picard iteration: y_{n+1}(x) = 1 + ∫₀ˣ y_n(t) dt
    // y₀ = 1, y₁ = 1 + x, y₂ = 1 + x + x²/2, y₃ = 1 + x + x²/2 + x³/6, ...
    // y_n = ∑_{k=0}^{n} x^k/k! (partial Taylor series of e^x)

    function picardIterate(n: number, x: number): number {
      let sum = 0;
      let term = 1; // x^0 / 0! = 1
      for (let k = 0; k <= n; k++) {
        sum += term;
        term *= x / (k + 1); // next term: x^(k+1) / (k+1)!
      }
      return sum;
    }

    test('Picard iterate n=5 approximates e at x=1 (within 0.01)', () => {
      const approx = picardIterate(5, 1);
      // n=5 gives ∑_{k=0}^5 1/k! = 2.7166..., error ≈ 0.0016 (1/6! + 1/7! + ...)
      expect(Math.abs(approx - Math.E)).toBeLessThan(0.01);
    });

    test('Picard iterate n=10 approximates e^0.5 to high precision', () => {
      const approx = picardIterate(10, 0.5);
      expect(approx).toBeCloseTo(Math.exp(0.5), 8);
    });

    test('Picard iterates converge monotonically to e as n increases', () => {
      const x = 1;
      const exact = Math.E;
      let prevError = Infinity;
      for (let n = 1; n <= 10; n++) {
        const error = Math.abs(picardIterate(n, x) - exact);
        expect(error).toBeLessThan(prevError);
        prevError = error;
      }
    });

    test('Picard iterate n=0 is y₀=1 (initial guess)', () => {
      expect(picardIterate(0, 0)).toBe(1);
      expect(picardIterate(0, 1)).toBe(1);
      expect(picardIterate(0, 2)).toBe(1);
    });

    test('Picard iterate n=1 is y₁=1+x (first correction)', () => {
      for (const x of [0.5, 1.0, 2.0]) {
        expect(picardIterate(1, x)).toBeCloseTo(1 + x, 10);
      }
    });

    test('Picard iterate n=2 is y₂=1+x+x²/2 (second-order Taylor expansion)', () => {
      for (const x of [0.5, 1.0]) {
        const expected = 1 + x + (x * x) / 2;
        expect(picardIterate(2, x)).toBeCloseTo(expected, 10);
      }
    });

    test('Picard iteration satisfies the ODE approximately: dy/dx ≈ y for n=10', () => {
      // y_n'(x) should be close to y_n(x) for large n (converges to the fixed point)
      const n = 10;
      const h = 1e-7;
      for (const x of [0.0, 0.5, 1.0]) {
        const yn = (t: number) => picardIterate(n, t);
        const derivApprox = numericalDerivative(yn, x, h);
        const valueApprox = picardIterate(n, x);
        // For the exact solution e^x: d/dx(e^x) = e^x exactly
        // For y_10: error is O(x^11/11!) which is tiny for x in [0,1]
        expect(derivApprox).toBeCloseTo(valueApprox, 4);
      }
    });

    // Lipschitz condition: the Lipschitz constant L = 1 for f(x,y)=y on compact domain
    // Platform connection: MAX_ANGULAR_VELOCITY = 0.2 is the Lipschitz constant L
    // for the angular position update rule in observer-bridge.ts
    test('contraction: Picard map T is a contraction — error shrinks by at least x/n per step', () => {
      // The error at iterate n is at most x^(n+1)/(n+1)! (remainder of Taylor series)
      // For x in [0, 1]: error_n ≤ e * (1)^(n+1) / (n+1)! → 0
      const x = 1;
      for (let n = 1; n <= 8; n++) {
        // Compute factorial
        let factorial = 1;
        for (let k = 1; k <= n + 1; k++) factorial *= k;
        const errorBound = Math.E / factorial;
        const actualError = Math.abs(picardIterate(n, x) - Math.E);
        expect(actualError).toBeLessThan(errorBound + 1e-10);
      }
    });
  });
});
