// test/proofs/part-ii-hearing/ch06-standing-waves.test.ts
// Computational verification for Chapter 6: Standing Waves — Nodes, Modes, Boundary Conditions
// Proof document: .planning/v1.50a/half-b/proofs/ch06-standing-waves.md
// Phase 475, Subversion 1.50.56

import { describe, test, expect } from 'vitest';

describe('Chapter 6: Standing Waves — Computational Verification', () => {
  // ---------------------------------------------------------------------------
  // proof-6-1-standing-wave-superposition
  // A*sin(kx - wt) + A*sin(kx + wt) = 2A*sin(kx)*cos(wt)
  // Technique 1: Numerical evaluation at many (x, t) pairs
  // ---------------------------------------------------------------------------
  describe('proof-6-1: standing wave from superposition of traveling waves', () => {
    test('superposition formula holds at t=0 for multiple x values (cos(0)=1)', () => {
      const k = 2;
      const A = 1;
      const xValues = [0, 0.25, 0.5, 1.0, 1.5, Math.PI / k];
      for (const x of xValues) {
        // At t=0: A*sin(kx) + A*sin(kx) = 2A*sin(kx)*1
        const leftWave = A * Math.sin(k * x);
        const rightWave = A * Math.sin(k * x);
        const superposition = leftWave + rightWave;
        const standingWave = 2 * A * Math.sin(k * x) * Math.cos(0);
        expect(superposition).toBeCloseTo(standingWave, 10);
      }
    });

    test('superposition formula holds for arbitrary k, omega, A, x, t values', () => {
      const testCases = [
        { k: 1, omega: 1, A: 1 },
        { k: 2, omega: 3, A: 1 },
        { k: Math.PI, omega: 2 * Math.PI, A: 0.5 },
        { k: 0.5, omega: 0.7, A: 2 },
      ];

      for (const { k, omega, A } of testCases) {
        for (let t = 0; t < 2 * Math.PI; t += 0.4) {
          for (let x = 0; x < 2; x += 0.3) {
            const leftTraveling = A * Math.sin(k * x - omega * t);
            const rightTraveling = A * Math.sin(k * x + omega * t);
            const superposition = leftTraveling + rightTraveling;
            const standingWave = 2 * A * Math.sin(k * x) * Math.cos(omega * t);
            expect(superposition).toBeCloseTo(standingWave, 10);
          }
        }
      }
    });

    test('nodes (zero points) of standing wave are fixed in time', () => {
      const k = Math.PI; // node at x = 1 (sin(pi*1) = 0)
      const omega = 2;
      const A = 3;
      const nodeX = 1.0; // sin(k*nodeX) = sin(pi) = 0

      // At a node, the standing wave is zero for all t
      for (let t = 0; t < 2 * Math.PI; t += 0.2) {
        const standingWave = 2 * A * Math.sin(k * nodeX) * Math.cos(omega * t);
        expect(standingWave).toBeCloseTo(0, 10);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // proof-6-2-boundary-conditions: fixed endpoints force k_n = n*pi/L
  // Boundary condition: sin(k_n * L) = 0 requires k_n*L = n*pi
  // Technique 1: Numerical + Constructive
  // Platform connection: observer-bridge.ts velocity clamping (HIGH CONSEQUENCE)
  // ---------------------------------------------------------------------------
  describe('proof-6-2: boundary conditions quantize normal modes', () => {
    const L = 1.0; // string length

    test('sin(k_n * L) = 0 for all integer modes n = 1..10 (boundary condition satisfied)', () => {
      for (let n = 1; n <= 10; n++) {
        const kn = (n * Math.PI) / L;
        expect(Math.sin(kn * L)).toBeCloseTo(0, 8);
      }
    });

    test('both endpoints satisfy boundary condition for all modes', () => {
      for (let n = 1; n <= 5; n++) {
        const kn = (n * Math.PI) / L;
        // x = 0: sin(k_n * 0) = sin(0) = 0
        expect(Math.sin(kn * 0)).toBeCloseTo(0, 10);
        // x = L: sin(k_n * L) = sin(n*pi) = 0
        expect(Math.sin(kn * L)).toBeCloseTo(0, 8);
      }
    });

    test('mode frequencies are integer multiples of fundamental f1 = v/(2L)', () => {
      const v = 340; // wave speed (m/s)
      const f1 = v / (2 * L); // fundamental frequency

      for (let n = 1; n <= 10; n++) {
        const fn = (n * v) / (2 * L);
        expect(fn).toBeCloseTo(n * f1, 8);
      }
    });

    test('node positions for mode n are at x = m*L/n for m = 0..n', () => {
      const n = 4; // 4th harmonic has 4 nodes including endpoints
      const kn = (n * Math.PI) / L;

      for (let m = 0; m <= n; m++) {
        const nodeX = (m * L) / n;
        expect(Math.sin(kn * nodeX)).toBeCloseTo(0, 8);
      }
    });

    // NON-INTEGER MODE TEST — CVER requirement
    // Verifies that quantization is real: non-integer modes do NOT satisfy boundary condition.
    // This is the key computational evidence that modes are discrete, not continuous.
    test('non-integer mode n=1.5 does NOT satisfy boundary condition at x=L', () => {
      const nonIntegerN = 1.5; // Not a valid mode — violates boundary condition
      const k = (nonIntegerN * Math.PI) / L;
      const valueAtBoundary = Math.abs(Math.sin(k * L));
      // sin(1.5 * pi) = sin(270°) = -1, so |sin| = 1, definitely not zero
      expect(valueAtBoundary).toBeGreaterThan(0.5);
    });

    test('non-integer mode n=2.3 does NOT satisfy boundary condition at x=L', () => {
      const nonIntegerN = 2.3;
      const k = (nonIntegerN * Math.PI) / L;
      const valueAtBoundary = Math.abs(Math.sin(k * L));
      // sin(2.3 * pi) ≠ 0, so the boundary condition is violated
      expect(valueAtBoundary).toBeGreaterThan(0.1);
    });

    // Platform connection: angular velocity clamping in observer-bridge.ts
    // Boundary condition → finite maximum angular velocity → position stays bounded.
    // Test analog: a "speed limit" (MAX_ANGULAR_VELOCITY) restricts angular displacement per step.
    test('angular velocity clamping analog: position change bounded by max velocity', () => {
      const MAX_ANGULAR_VELOCITY = Math.PI / 8; // analogous to observer-bridge.ts clamp
      const initialTheta = Math.PI / 3;

      // Simulate 50 steps with random velocities; all should be clamped
      let theta = initialTheta;
      for (let step = 0; step < 50; step++) {
        const rawVelocity = (Math.random() - 0.5) * 2 * Math.PI; // large unclamped velocity
        const clampedVelocity = Math.max(-MAX_ANGULAR_VELOCITY, Math.min(MAX_ANGULAR_VELOCITY, rawVelocity));
        const newTheta = theta + clampedVelocity;
        // Verify that the step size is bounded
        expect(Math.abs(newTheta - theta)).toBeLessThanOrEqual(MAX_ANGULAR_VELOCITY + 1e-10);
        theta = newTheta;
      }
    });
  });

  // ---------------------------------------------------------------------------
  // proof-6-4-fourier-convergence (partial — L4 classification)
  // The full proof requires measure theory (Riemann-Lebesgue lemma) — acknowledged gap.
  // We verify the numerical convergence behavior only.
  // Technique 4: Convergence testing
  // ---------------------------------------------------------------------------
  describe('proof-6-4: Fourier series convergence (numerical verification)', () => {
    // Square wave Fourier series: f(x) = (4/pi) * sum_{k=1,3,5,...} sin(k*x)/k
    function squareWaveFourier(x: number, nTerms: number): number {
      let sum = 0;
      for (let k = 1; k <= 2 * nTerms - 1; k += 2) {
        sum += Math.sin(k * x) / k;
      }
      return (4 / Math.PI) * sum;
    }

    test('Fourier partial sums converge to +1 at x=pi/2 as N increases', () => {
      const x = Math.PI / 2;
      const targetValue = 1; // square wave value at pi/2 is +1
      const errors = [1, 5, 10, 20, 50, 100].map((n) =>
        Math.abs(squareWaveFourier(x, n) - targetValue),
      );
      // Errors should be decreasing (convergence)
      for (let i = 1; i < errors.length; i++) {
        expect(errors[i]).toBeLessThan(errors[i - 1] + 1e-6);
      }
      // With 100 terms, error should be < 5%
      expect(errors[errors.length - 1]).toBeLessThan(0.05);
    });

    test('Fourier series converges to midpoint (0) at jump discontinuity x=0', () => {
      // At x=0, sin(k*0) = 0 for all k, so sum is 0 regardless of N
      // (The Gibbs phenomenon appears at the jump, not at 0 itself)
      expect(squareWaveFourier(0, 100)).toBeCloseTo(0, 10);
    });

    test('Fourier coefficients decay as 1/k (odd harmonics only)', () => {
      // The amplitude of the k-th harmonic is 4/(pi*k) for odd k
      const amplitudeRatios = [1, 3, 5, 7, 9].map((k) => (4 / Math.PI) * (1 / k));
      // Each ratio should be less than the previous (coefficients are decreasing)
      for (let i = 1; i < amplitudeRatios.length; i++) {
        expect(amplitudeRatios[i]).toBeLessThan(amplitudeRatios[i - 1]);
      }
      // Verify the first coefficient matches the formula
      expect(amplitudeRatios[0]).toBeCloseTo(4 / Math.PI, 8);
    });
  });
});
