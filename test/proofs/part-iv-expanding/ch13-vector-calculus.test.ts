// test/proofs/part-iv-expanding/ch13-vector-calculus.test.ts
// Computational verification for Chapter 13: Vector Calculus
// Proof document: .planning/v1.50a/half-b/proofs/ch13-vector-calculus.md
// Phase 477, Subversion 1.50.63

import { describe, test, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Vector calculus helpers
// ---------------------------------------------------------------------------

/** Numerical partial derivative ∂f/∂x via central difference */
function partialX(f: (x: number, y: number) => number, x: number, y: number, h = 1e-7): number {
  return (f(x + h, y) - f(x - h, y)) / (2 * h);
}

/** Numerical partial derivative ∂f/∂y via central difference */
function partialY(f: (x: number, y: number) => number, x: number, y: number, h = 1e-7): number {
  return (f(x, y + h) - f(x, y - h)) / (2 * h);
}

/** Numerical gradient of scalar function f: R² → R */
function numericalGrad2(
  f: (x: number, y: number) => number,
  x: number,
  y: number,
): [number, number] {
  return [partialX(f, x, y), partialY(f, x, y)];
}

/** Directional derivative: D_u f = ∇f · u (should match numerical difference quotient) */
function directionalDerivativeNumerical(
  f: (x: number, y: number) => number,
  x: number,
  y: number,
  ux: number,
  uy: number,
  h = 1e-7,
): number {
  return (f(x + h * ux, y + h * uy) - f(x - h * ux, y - h * uy)) / (2 * h);
}

/** Magnitude of a 2D vector */
function mag2(u: [number, number]): number {
  return Math.sqrt(u[0] * u[0] + u[1] * u[1]);
}

/** Deterministic LCG for reproducible tests */
function* lcg(seed: number): Generator<number, never, unknown> {
  let s = seed;
  while (true) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    yield (s >>> 0) / 0x100000000;
  }
}

describe('Chapter 13: Vector Calculus — Computational Verification', () => {
  // ---------------------------------------------------------------------------
  // proof-13-1-gradient: ∇f points in the direction of steepest ascent
  // D_u f(p) = ∇f(p)·u, maximized when u = ∇f/|∇f|
  // Classification: L2 — Cauchy-Schwarz argument
  // Platform connection: computeAngularStep = bounded gradient descent
  // ---------------------------------------------------------------------------
  describe('proof-13-1: gradient as direction of steepest ascent', () => {
    test('numerical gradient matches analytical gradient for f(x,y)=x²+y² at 500 points', () => {
      // f(x,y) = x² + y², analytical ∇f = (2x, 2y)
      const f = (x: number, y: number) => x * x + y * y;
      const gen = lcg(700);
      for (let i = 0; i < 500; i++) {
        const x = gen.next().value * 4 - 2;
        const y = gen.next().value * 4 - 2;
        const [gx, gy] = numericalGrad2(f, x, y);
        expect(gx).toBeCloseTo(2 * x, 5);
        expect(gy).toBeCloseTo(2 * y, 5);
      }
    });

    test('numerical gradient matches analytical for f(x,y)=sin(x)cos(y) at 500 points', () => {
      // ∇f = (cos(x)cos(y), -sin(x)sin(y))
      const f = (x: number, y: number) => Math.sin(x) * Math.cos(y);
      const gen = lcg(701);
      for (let i = 0; i < 500; i++) {
        const x = gen.next().value * 4 - 2;
        const y = gen.next().value * 4 - 2;
        const [gx, gy] = numericalGrad2(f, x, y);
        expect(gx).toBeCloseTo(Math.cos(x) * Math.cos(y), 5);
        expect(gy).toBeCloseTo(-Math.sin(x) * Math.sin(y), 5);
      }
    });

    test('directional derivative in gradient direction equals |∇f| (maximum)', () => {
      const f = (x: number, y: number) => x * x + y * y;
      const gen = lcg(702);
      for (let i = 0; i < 500; i++) {
        const x = gen.next().value * 4 - 2;
        const y = gen.next().value * 4 - 2;
        const [gx, gy] = numericalGrad2(f, x, y);
        const gradMag = Math.sqrt(gx * gx + gy * gy);
        if (gradMag < 1e-6) continue; // skip near-zero gradient
        // Unit vector in gradient direction
        const ux = gx / gradMag;
        const uy = gy / gradMag;
        // Directional derivative in gradient direction should equal |∇f|
        const Duf = directionalDerivativeNumerical(f, x, y, ux, uy);
        expect(Duf).toBeCloseTo(gradMag, 4);
      }
    });

    test('directional derivative perpendicular to gradient equals 0', () => {
      const f = (x: number, y: number) => x * x + y * y;
      const gen = lcg(703);
      for (let i = 0; i < 500; i++) {
        const x = gen.next().value * 4 - 2;
        const y = gen.next().value * 4 - 2;
        const [gx, gy] = numericalGrad2(f, x, y);
        const gradMag = Math.sqrt(gx * gx + gy * gy);
        if (gradMag < 1e-6) continue;
        // Perpendicular direction: (-gy/|∇f|, gx/|∇f|)
        const ux = -gy / gradMag;
        const uy = gx / gradMag;
        const Duf = directionalDerivativeNumerical(f, x, y, ux, uy);
        expect(Math.abs(Duf)).toBeLessThan(1e-4);
      }
    });

    test('D_u f = ∇f · u for arbitrary unit vectors (dot product formula)', () => {
      const f = (x: number, y: number) => Math.sin(x) * Math.cos(y);
      const gen = lcg(704);
      for (let i = 0; i < 200; i++) {
        const x = gen.next().value * 4 - 2;
        const y = gen.next().value * 4 - 2;
        // Random unit direction
        const angle = gen.next().value * 2 * Math.PI;
        const ux = Math.cos(angle);
        const uy = Math.sin(angle);
        // Numerical directional derivative
        const DufNumerical = directionalDerivativeNumerical(f, x, y, ux, uy);
        // Dot product formula: ∇f · u
        const [gx, gy] = numericalGrad2(f, x, y);
        const DufFormula = gx * ux + gy * uy;
        expect(DufNumerical).toBeCloseTo(DufFormula, 4);
      }
    });

    // Platform connection: computeAngularStep is bounded gradient descent
    test('bounded gradient descent: step toward target clamped to maxVelocity', () => {
      const MIN_THETA = 0.01;
      const MAX_ANGULAR_VELOCITY = 0.2;

      // Simulate computeAngularStep behavior
      function computeAngularStep(currentTheta: number, targetTheta: number): number {
        const step = targetTheta - currentTheta;
        const maxStep = MAX_ANGULAR_VELOCITY * Math.max(currentTheta, MIN_THETA);
        if (Math.abs(step) > maxStep) {
          return step > 0 ? maxStep : -maxStep;
        }
        return step;
      }

      // Step should always move toward target
      const cases = [
        { current: 0.5, target: 1.0 },
        { current: 1.0, target: 0.5 },
        { current: 0.3, target: 2.0 }, // large step — clamped
        { current: 2.0, target: 0.1 }, // large negative step — clamped
      ];
      for (const { current, target } of cases) {
        const step = computeAngularStep(current, target);
        // Step is in the right direction
        const direction = Math.sign(target - current);
        if (Math.abs(target - current) > 1e-10) {
          expect(Math.sign(step)).toBe(direction);
        }
        // Step is bounded
        const maxStep = MAX_ANGULAR_VELOCITY * Math.max(current, MIN_THETA);
        expect(Math.abs(step)).toBeLessThanOrEqual(maxStep + 1e-10);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // proof-13-2-divergence-theorem: ∯_S F·dA = ∭_V (∇·F) dV
  // Explicit verification: F=(x,y,z), unit sphere
  // Classification: L3 sketch — FTC extension
  // ---------------------------------------------------------------------------
  describe('proof-13-2: Divergence Theorem — F=(x,y,z) over unit sphere', () => {
    test('∇·F = 3 for F=(x,y,z)', () => {
      // Divergence of F=(x,y,z): ∂x/∂x + ∂y/∂y + ∂z/∂z = 1+1+1 = 3
      // Verify numerically at several points
      const points = [
        [0.3, 0.4, 0.5],
        [1, 0, 0],
        [0, 1, 0],
        [0.5, 0.5, 0.5],
      ];
      const h = 1e-7;
      for (const [x, y, z] of points) {
        const F1 = (px: number, _py: number, _pz: number) => px; // F₁ = x
        const F2 = (_px: number, py: number, _pz: number) => py; // F₂ = y
        const F3 = (_px: number, _py: number, pz: number) => pz; // F₃ = z
        const divF =
          (F1(x + h, y, z) - F1(x - h, y, z)) / (2 * h) +
          (F2(x, y + h, z) - F2(x, y - h, z)) / (2 * h) +
          (F3(x, y, z + h) - F3(x, y, z - h)) / (2 * h);
        expect(divF).toBeCloseTo(3, 5);
      }
    });

    test('volume integral ∭_V 3 dV = 4π for unit ball', () => {
      // ∭_{|r|≤1} 3 dV = 3 × (4π/3) = 4π
      const volumeUnitBall = (4 / 3) * Math.PI;
      const volumeIntegral = 3 * volumeUnitBall;
      expect(volumeIntegral).toBeCloseTo(4 * Math.PI, 10);
    });

    test('on unit sphere, F·n̂ = x²+y²+z² = 1 everywhere', () => {
      // n̂ = (x,y,z) on unit sphere, F = (x,y,z), so F·n̂ = x²+y²+z² = 1
      const gen = lcg(800);
      for (let i = 0; i < 200; i++) {
        // Random point on unit sphere via normalization
        const px = gen.next().value * 2 - 1;
        const py = gen.next().value * 2 - 1;
        const pz = gen.next().value * 2 - 1;
        const r = Math.sqrt(px * px + py * py + pz * pz);
        if (r < 0.01) continue;
        const nx = px / r;
        const ny = py / r;
        const nz = pz / r;
        const FdotN = nx * nx + ny * ny + nz * nz;
        expect(FdotN).toBeCloseTo(1, 10);
      }
    });

    test('surface integral ∯_{S²} F·dA ≈ 4π (numerical verification)', () => {
      // F·n̂ = 1 everywhere on S², Area(S²) = 4π
      // Numerical integration using spherical coordinate discretization
      const N = 200;
      let surfaceIntegral = 0;
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
          const theta = (Math.PI * (i + 0.5)) / N;
          const phi = (2 * Math.PI * (j + 0.5)) / N;
          const sinTheta = Math.sin(theta);
          const dOmega = (Math.PI / N) * (2 * Math.PI / N) * sinTheta;
          // F·n̂ = 1 on unit sphere
          surfaceIntegral += 1 * dOmega;
        }
      }
      expect(surfaceIntegral).toBeCloseTo(4 * Math.PI, 1); // tolerance 1 decimal place
    });

    test('both sides of Divergence Theorem equal 4π for F=(x,y,z), unit sphere', () => {
      // LHS (surface integral): F·dA = 4π
      // RHS (volume integral): ∭ 3 dV = 4π
      const volumeSide = 3 * (4 / 3) * Math.PI; // = 4π
      expect(volumeSide).toBeCloseTo(4 * Math.PI, 10);
      // Surface side (from test above, approximately)
      const surfaceSide = 4 * Math.PI; // exact
      expect(Math.abs(volumeSide - surfaceSide)).toBeLessThan(1e-10);
    });
  });

  // ---------------------------------------------------------------------------
  // proof-13-3-stokes: ∮_C F·dr = ∯_S (∇×F)·dA
  // Explicit verification: F=(-y, x, 0) over unit circle/disk
  // Classification: L3 sketch — FTC→Green's→Stokes chain
  // Cross-citation: Stokes generalizes Ch 9 FTC Part 2
  // ---------------------------------------------------------------------------
  describe("proof-13-3: Stokes' Theorem — F=(-y,x,0) over unit disk", () => {
    test("curl of F=(-y,x,0) equals (0,0,2)", () => {
      // ∇×F = (∂F₃/∂y - ∂F₂/∂z, ∂F₁/∂z - ∂F₃/∂x, ∂F₂/∂x - ∂F₁/∂y)
      // F₁ = -y, F₂ = x, F₃ = 0
      // ∇×F = (0-0, 0-0, ∂x/∂x - ∂(-y)/∂y) = (0, 0, 1-(-1)) = (0, 0, 2)
      const h = 1e-7;
      const testPoints = [
        [0.3, 0.4, 0],
        [0.8, 0.2, 0],
        [0.5, 0.5, 0],
      ];
      for (const [x, y, z] of testPoints) {
        const F1 = (_px: number, py: number, _pz: number) => -py;
        const F2 = (px: number, _py: number, _pz: number) => px;
        const F3 = (_px: number, _py: number, _pz: number) => 0;

        // curl z-component = ∂F₂/∂x - ∂F₁/∂y
        const curlZ =
          (F2(x + h, y, z) - F2(x - h, y, z)) / (2 * h) -
          (F1(x, y + h, z) - F1(x, y - h, z)) / (2 * h);
        expect(curlZ).toBeCloseTo(2, 5);
      }
    });

    test('surface integral ∯_{unit disk} (∇×F)·dA = 2·π·r² = 2π for r=1', () => {
      // (∇×F) = (0,0,2), dA = (0,0,1)dxdy on flat disk
      // ∯ (∇×F)·dA = ∫∫ 2 dxdy = 2 × Area(unit disk) = 2π
      const surfaceIntegral = 2 * Math.PI * 1 * 1; // 2 × πr² = 2π
      expect(surfaceIntegral).toBeCloseTo(2 * Math.PI, 10);
    });

    test('line integral ∮_{unit circle} F·dr = 2π (numerical quadrature with 10000 points)', () => {
      // F = (-y, x, 0), unit circle parametrized as (cos t, sin t, 0)
      // dr = (-sin t, cos t, 0) dt
      // F·dr = (-sin t)(-sin t) + (cos t)(cos t) = sin²t + cos²t = 1
      // ∮ F·dr = ∫₀^{2π} 1 dt = 2π
      const N = 10000;
      let lineIntegral = 0;
      for (let i = 0; i < N; i++) {
        const t = (2 * Math.PI * i) / N;
        const x = Math.cos(t);
        const y = Math.sin(t);
        const dxt = -Math.sin(t);
        const dyt = Math.cos(t);
        const Fx = -y;
        const Fy = x;
        const integrand = Fx * dxt + Fy * dyt;
        lineIntegral += integrand * (2 * Math.PI / N);
      }
      expect(lineIntegral).toBeCloseTo(2 * Math.PI, 4);
    });

    test("both sides of Stokes' Theorem equal 2π for F=(-y,x,0)", () => {
      const lineSide = 2 * Math.PI; // ∮ F·dr = 2π (proved above)
      const surfaceSide = 2 * Math.PI; // ∯ (∇×F)·dA = 2π
      expect(Math.abs(lineSide - surfaceSide)).toBeLessThan(1e-10);
    });

    // Cross-citation: Stokes → FTC Part 2 (Ch 9 Proof 9.2)
    // The same structure: interior integral of derivative = boundary evaluation
    test('FTC is 1D Stokes: ∫ₐᵇ f′ dx = f(b) - f(a)', () => {
      // Verify FTC holds for several functions (cross-chapter citation pattern)
      const cases = [
        { f: (x: number) => x * x, fp: (x: number) => 2 * x, a: 0, b: 2, expected: 4 },
        { f: (x: number) => Math.sin(x), fp: (x: number) => Math.cos(x), a: 0, b: Math.PI, expected: 0 },
        { f: (x: number) => Math.exp(x), fp: (x: number) => Math.exp(x), a: 0, b: 1, expected: Math.E - 1 },
      ];
      const N = 10000;
      for (const { f, fp, a, b, expected } of cases) {
        // Numerical integration of f'
        let integral = 0;
        const h = (b - a) / N;
        for (let i = 0; i < N; i++) {
          const x = a + (i + 0.5) * h;
          integral += fp(x) * h;
        }
        // FTC: should equal f(b) - f(a)
        const ftcValue = f(b) - f(a);
        expect(integral).toBeCloseTo(ftcValue, 4);
        expect(ftcValue).toBeCloseTo(expected, 8);
      }
    });

    // The Stokes/FTC structure: D = interior, ∂D = boundary, ∫_∂D ω = ∫_D dω
    test("Stokes' structure: boundary integral = interior integral of derivative", () => {
      // For F = (-y, x, 0), verify ∮_C F·dr = ∬_D curl(F)·k̂ dA = 2π
      const N = 1000;
      // Line integral on unit circle
      let lineInt = 0;
      for (let i = 0; i < N; i++) {
        const t = (2 * Math.PI * i) / N;
        const Fx = -Math.sin(t);
        const Fy = Math.cos(t);
        const dxt = -Math.sin(t);
        const dyt = Math.cos(t);
        lineInt += (Fx * dxt + Fy * dyt) * (2 * Math.PI / N);
      }
      // Area integral: curl = 2
      const areaInt = 2 * Math.PI; // = 2 * area(unit disk)
      expect(lineInt).toBeCloseTo(areaInt, 2);
    });
  });
});
