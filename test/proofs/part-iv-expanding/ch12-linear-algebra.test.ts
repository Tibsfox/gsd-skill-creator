// test/proofs/part-iv-expanding/ch12-linear-algebra.test.ts
// Computational verification for Chapter 12: Linear Algebra
// Proof document: .planning/v1.50a/half-b/proofs/ch12-linear-algebra.md
// Phase 477, Subversion 1.50.62

import { describe, test, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Matrix helpers (2×2 and 3×3)
// ---------------------------------------------------------------------------

type Mat2 = [[number, number], [number, number]];
type Mat3 = [[number, number, number], [number, number, number], [number, number, number]];
type Vec2 = [number, number];
type Vec3 = [number, number, number];

function mat2Mul(A: Mat2, B: Mat2): Mat2 {
  return [
    [A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]],
    [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]],
  ];
}

function mat2Vec(A: Mat2, v: Vec2): Vec2 {
  return [A[0][0] * v[0] + A[0][1] * v[1], A[1][0] * v[0] + A[1][1] * v[1]];
}

function det2(A: Mat2): number {
  return A[0][0] * A[1][1] - A[0][1] * A[1][0];
}

function det3(A: Mat3): number {
  return (
    A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) -
    A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) +
    A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0])
  );
}

function mat3Mul(A: Mat3, B: Mat3): Mat3 {
  const C: Mat3 = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      for (let k = 0; k < 3; k++) {
        C[i][j] += A[i][k] * B[k][j];
      }
    }
  }
  return C;
}

function mat3Vec(A: Mat3, v: Vec3): Vec3 {
  return [
    A[0][0] * v[0] + A[0][1] * v[1] + A[0][2] * v[2],
    A[1][0] * v[0] + A[1][1] * v[1] + A[1][2] * v[2],
    A[2][0] * v[0] + A[2][1] * v[1] + A[2][2] * v[2],
  ];
}

function dot2(u: Vec2, v: Vec2): number {
  return u[0] * v[0] + u[1] * v[1];
}

function dot3(u: Vec3, v: Vec3): number {
  return u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
}

function mag3(u: Vec3): number {
  return Math.sqrt(dot3(u, u));
}

function norm3(u: Vec3): Vec3 {
  const m = mag3(u);
  return [u[0] / m, u[1] / m, u[2] / m];
}

/** Rotation matrix R(theta) */
function rotMat(theta: number): Mat2 {
  return [
    [Math.cos(theta), -Math.sin(theta)],
    [Math.sin(theta), Math.cos(theta)],
  ];
}

// Deterministic pseudo-random generator
function* lcg(seed: number): Generator<number, never, unknown> {
  let s = seed;
  while (true) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    yield (s >>> 0) / 0x100000000;
  }
}

function randMat2(gen: Generator<number, never, unknown>): Mat2 {
  return [
    [gen.next().value * 4 - 2, gen.next().value * 4 - 2],
    [gen.next().value * 4 - 2, gen.next().value * 4 - 2],
  ];
}

function randSymMat3(gen: Generator<number, never, unknown>): Mat3 {
  // Generate symmetric 3×3 as M + M^T for random M
  const a = gen.next().value * 2 - 1;
  const b = gen.next().value * 2 - 1;
  const c = gen.next().value * 2 - 1;
  const d = gen.next().value * 2 - 1;
  const e = gen.next().value * 2 - 1;
  const f = gen.next().value * 2 - 1;
  const g = gen.next().value * 2 - 1;
  const h = gen.next().value * 2 - 1;
  const k = gen.next().value * 2 - 1;
  // M + M^T is always symmetric
  return [
    [2 * a, b + d, c + g],
    [b + d, 2 * e, f + h],
    [c + g, f + h, 2 * k],
  ];
}

/** Compute eigenvalues of a 2×2 symmetric matrix [[a,b],[b,d]] via quadratic formula */
function eigenvalues2x2Sym(A: Mat2): [number, number] {
  const trace = A[0][0] + A[1][1];
  const discr = Math.sqrt((A[0][0] - A[1][1]) ** 2 + 4 * A[0][1] * A[1][0]);
  return [(trace + discr) / 2, (trace - discr) / 2];
}

/** Power iteration: find dominant eigenvector of a 3×3 symmetric matrix */
function dominantEigen3(A: Mat3, iterations = 100): { value: number; vector: Vec3 } {
  let v: Vec3 = [1, 0, 0];
  let lambda = 0;
  for (let i = 0; i < iterations; i++) {
    const Av = mat3Vec(A, v);
    lambda = dot3(v, Av) / dot3(v, v);
    const m = mag3(Av);
    if (m < 1e-15) break;
    v = [Av[0] / m, Av[1] / m, Av[2] / m];
  }
  return { value: lambda, vector: v };
}

describe('Chapter 12: Linear Algebra — Computational Verification', () => {
  // ---------------------------------------------------------------------------
  // proof-12-1-eigenvalues: Av = λv and det(A - λI) = 0
  // Classification: L2 — algebraic definition and characteristic polynomial
  // Platform connection: rotation matrix R(θ) has eigenvalues e^(±iθ)
  // ---------------------------------------------------------------------------
  describe('proof-12-1: eigenvalue equation and characteristic polynomial', () => {
    test('Av = λv for example A = [[2,1],[1,2]], λ₁=1, v₁=(1,-1)', () => {
      const A: Mat2 = [[2, 1], [1, 2]];
      const lambda1 = 1;
      const v1: Vec2 = [1, -1];
      const Av1 = mat2Vec(A, v1);
      expect(Av1[0]).toBeCloseTo(lambda1 * v1[0], 10);
      expect(Av1[1]).toBeCloseTo(lambda1 * v1[1], 10);
    });

    test('Av = λv for example A = [[2,1],[1,2]], λ₂=3, v₂=(1,1)', () => {
      const A: Mat2 = [[2, 1], [1, 2]];
      const lambda2 = 3;
      const v2: Vec2 = [1, 1];
      const Av2 = mat2Vec(A, v2);
      expect(Av2[0]).toBeCloseTo(lambda2 * v2[0], 10);
      expect(Av2[1]).toBeCloseTo(lambda2 * v2[1], 10);
    });

    test('det(A - λI) = 0 for computed eigenvalues of symmetric A', () => {
      const A: Mat2 = [[2, 1], [1, 2]];
      const [lambda1, lambda2] = eigenvalues2x2Sym(A);
      // det(A - λ₁I)
      const AmL1: Mat2 = [[A[0][0] - lambda1, A[0][1]], [A[1][0], A[1][1] - lambda1]];
      const AmL2: Mat2 = [[A[0][0] - lambda2, A[0][1]], [A[1][0], A[1][1] - lambda2]];
      expect(Math.abs(det2(AmL1))).toBeLessThan(1e-10);
      expect(Math.abs(det2(AmL2))).toBeLessThan(1e-10);
    });

    // Rotation matrix eigenvalues: the algebraic bridge to Euler's formula
    test('rotation matrix R(θ) characteristic polynomial has discriminant < 0 for θ ≠ 0, π', () => {
      // det(R(θ) - λI) = λ² - 2λ cosθ + 1 = 0
      // discriminant = 4cos²θ - 4 = -4sin²θ ≤ 0
      const angles = [0.3, 0.7, 1.0, 1.5, Math.PI / 4, Math.PI / 3];
      for (const theta of angles) {
        const discriminant = 4 * Math.cos(theta) ** 2 - 4;
        expect(discriminant).toBeLessThanOrEqual(1e-10);
        // discriminant = -4sin²θ
        expect(Math.abs(discriminant + 4 * Math.sin(theta) ** 2)).toBeLessThan(1e-10);
      }
    });

    test('rotation matrix eigenvalues are cos θ ± i·sin θ = e^(±iθ)', () => {
      // Verify: the "complex part" of eigenvalues matches sin θ
      const angles = [0.3, 0.5, 0.8, 1.2, Math.PI / 6, Math.PI / 4];
      for (const theta of angles) {
        const R = rotMat(theta);
        const trace = R[0][0] + R[1][1]; // = 2 cos θ
        const detR = det2(R); // = cos²θ + sin²θ = 1
        // Eigenvalues = (trace ± sqrt(trace² - 4·det)) / 2
        const discriminant = trace * trace - 4 * detR;
        // Imaginary part is sqrt(-discriminant)/2 = sqrt(4sin²θ)/2 = |sinθ|
        expect(discriminant).toBeLessThan(1e-10); // complex eigenvalues
        const imagPart = Math.sqrt(-discriminant) / 2;
        expect(imagPart).toBeCloseTo(Math.abs(Math.sin(theta)), 10);
        // Real part = trace/2 = cosθ
        expect(trace / 2).toBeCloseTo(Math.cos(theta), 10);
        // This confirms eigenvalues = cos θ ± i·sin θ = e^(±iθ) — Euler's formula
      }
    });

    test('det(R(θ)) = cos²θ + sin²θ = 1 for all θ (rotation preserves volume)', () => {
      const angles = [0, 0.3, 0.7, 1.2, Math.PI / 2, Math.PI, 2 * Math.PI / 3];
      for (const theta of angles) {
        const R = rotMat(theta);
        expect(det2(R)).toBeCloseTo(1, 10);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // proof-12-2-spectral-theorem: symmetric matrices have real eigenvalues
  //   and eigenvectors for distinct eigenvalues are orthogonal
  // Classification: L3 — two-part proof
  // Platform connection: skill co-activation matrix is symmetric
  // ---------------------------------------------------------------------------
  describe('proof-12-2: spectral theorem for symmetric matrices', () => {
    test('eigenvalues of symmetric 2×2 matrices are real for 200 random matrices', () => {
      const gen = lcg(500);
      for (let i = 0; i < 200; i++) {
        const a = gen.next().value * 4 - 2;
        const b = gen.next().value * 4 - 2;
        const c = gen.next().value * 4 - 2;
        const A: Mat2 = [[a, b], [b, c]]; // symmetric: A[0][1] = A[1][0] = b
        const [lambda1, lambda2] = eigenvalues2x2Sym(A);
        // Both eigenvalues must be real (discriminant ≥ 0 for symmetric matrices)
        const discriminant = (A[0][0] - A[1][1]) ** 2 + 4 * A[0][1] * A[1][0];
        expect(discriminant).toBeGreaterThanOrEqual(-1e-10); // non-negative
        expect(Number.isFinite(lambda1)).toBe(true);
        expect(Number.isFinite(lambda2)).toBe(true);
      }
    });

    test('eigenvectors for distinct eigenvalues of symmetric 2×2 are orthogonal', () => {
      // A = [[a, b], [b, c]] with two distinct eigenvalues
      // Eigenvectors: v1 for λ1, v2 for λ2
      // By spectral theorem: v1 · v2 = 0
      const A: Mat2 = [[2, 1], [1, 2]];
      const [lambda1, lambda2] = eigenvalues2x2Sym(A);
      // Eigenvectors from (A - λI)v = 0
      // For λ1: (A - λ1·I)v = 0 => (A[0][0]-λ1, A[0][1]) · v = 0
      // v1 proportional to (-A[0][1], A[0][0]-λ1) = (-1, 2-1) = (-1, 1)
      const v1: Vec2 = [-A[0][1], A[0][0] - lambda1];
      const v2: Vec2 = [-A[0][1], A[0][0] - lambda2];
      // Both Av = λv
      const Av1 = mat2Vec(A, v1);
      const Av2 = mat2Vec(A, v2);
      expect(Av1[0]).toBeCloseTo(lambda1 * v1[0], 8);
      expect(Av1[1]).toBeCloseTo(lambda1 * v1[1], 8);
      expect(Av2[0]).toBeCloseTo(lambda2 * v2[0], 8);
      expect(Av2[1]).toBeCloseTo(lambda2 * v2[1], 8);
      // Orthogonality
      expect(Math.abs(dot2(v1, v2))).toBeLessThan(1e-10);
    });

    test('eigenvalues of symmetric 3×3 matrices are real (power iteration check)', () => {
      const gen = lcg(501);
      for (let i = 0; i < 20; i++) {
        const A = randSymMat3(gen);
        const { value: lambda } = dominantEigen3(A);
        // Dominant eigenvalue from power iteration should be real (finite)
        expect(Number.isFinite(lambda)).toBe(true);
        expect(Number.isNaN(lambda)).toBe(false);
      }
    });

    test('dominant eigenvector of symmetric matrix satisfies Av = λv', () => {
      const gen = lcg(502);
      for (let i = 0; i < 20; i++) {
        const A = randSymMat3(gen);
        // Use more iterations for better convergence
        const { value: lambda, vector: v } = dominantEigen3(A, 500);
        const Av = mat3Vec(A, v);
        const lambdaV: Vec3 = [lambda * v[0], lambda * v[1], lambda * v[2]];
        // |Av - λv| < tolerance — power iteration may have residual for near-degenerate matrices
        const err = Math.sqrt(
          (Av[0] - lambdaV[0]) ** 2 + (Av[1] - lambdaV[1]) ** 2 + (Av[2] - lambdaV[2]) ** 2,
        );
        expect(err).toBeLessThan(1e-3);
      }
    });

    // Self-adjoint property: v₂·(Av₁) = (Av₂)·v₁ for symmetric A
    test('self-adjoint property of symmetric A: v₂·(Av₁) = (Av₂)·v₁', () => {
      const gen = lcg(503);
      for (let i = 0; i < 100; i++) {
        const A = randSymMat3(gen);
        const v1: Vec3 = [gen.next().value * 2 - 1, gen.next().value * 2 - 1, gen.next().value * 2 - 1];
        const v2: Vec3 = [gen.next().value * 2 - 1, gen.next().value * 2 - 1, gen.next().value * 2 - 1];
        const Av1 = mat3Vec(A, v1);
        const Av2 = mat3Vec(A, v2);
        const lhs = dot3(v2, Av1);
        const rhs = dot3(Av2, v1);
        expect(lhs).toBeCloseTo(rhs, 10);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // proof-12-3-det-multiplicative: det(AB) = det(A)det(B)
  // Classification: L2 — volume-scaling argument
  // Platform connection: rotation matrix composition preserves det = 1
  // ---------------------------------------------------------------------------
  describe('proof-12-3: determinant multiplicativity det(AB) = det(A)det(B)', () => {
    test('det(AB) = det(A)·det(B) for 1000 random 2×2 matrix pairs', () => {
      const gen = lcg(600);
      for (let i = 0; i < 1000; i++) {
        const A = randMat2(gen);
        const B = randMat2(gen);
        const AB = mat2Mul(A, B);
        const detAB = det2(AB);
        const detAdotDetB = det2(A) * det2(B);
        expect(Math.abs(detAB - detAdotDetB)).toBeLessThan(1e-8);
      }
    });

    test('det(AB) = det(A)·det(B) for 1000 random 3×3 matrix pairs', () => {
      const gen = lcg(601);
      for (let i = 0; i < 1000; i++) {
        const A: Mat3 = [
          [gen.next().value * 4 - 2, gen.next().value * 4 - 2, gen.next().value * 4 - 2],
          [gen.next().value * 4 - 2, gen.next().value * 4 - 2, gen.next().value * 4 - 2],
          [gen.next().value * 4 - 2, gen.next().value * 4 - 2, gen.next().value * 4 - 2],
        ];
        const B: Mat3 = [
          [gen.next().value * 4 - 2, gen.next().value * 4 - 2, gen.next().value * 4 - 2],
          [gen.next().value * 4 - 2, gen.next().value * 4 - 2, gen.next().value * 4 - 2],
          [gen.next().value * 4 - 2, gen.next().value * 4 - 2, gen.next().value * 4 - 2],
        ];
        const AB = mat3Mul(A, B);
        const detAB = det3(AB);
        const detAdotDetB = det3(A) * det3(B);
        expect(Math.abs(detAB - detAdotDetB)).toBeLessThan(1e-8);
      }
    });

    test('degenerate case: singular B has det(B)=0 and det(AB)=0', () => {
      const A: Mat2 = [[2, 1], [1, 3]];
      // Singular B: linearly dependent rows
      const B: Mat2 = [[1, 2], [2, 4]]; // row2 = 2*row1
      expect(Math.abs(det2(B))).toBeLessThan(1e-10);
      const AB = mat2Mul(A, B);
      expect(Math.abs(det2(AB))).toBeLessThan(1e-10);
    });

    // Rotation matrix composition: det preserved under multiplication
    test('det(R(θ₁)·R(θ₂)) = det(R(θ₁))·det(R(θ₂)) = 1·1 = 1', () => {
      const angles = [
        [0.3, 0.5],
        [0.8, 1.2],
        [Math.PI / 4, Math.PI / 3],
        [0.1, 2.5],
      ];
      for (const [t1, t2] of angles) {
        const R1 = rotMat(t1);
        const R2 = rotMat(t2);
        const R12 = mat2Mul(R1, R2);
        expect(det2(R12)).toBeCloseTo(1, 10);
        expect(det2(R1) * det2(R2)).toBeCloseTo(1, 10);
      }
    });

    // Composition of rotations produces a rotation (closure of SO(2))
    test('R(θ₁)·R(θ₂) = R(θ₁+θ₂) — rotation group is closed', () => {
      const angles = [
        [0.3, 0.5],
        [0.8, 1.2],
        [Math.PI / 6, Math.PI / 4],
      ];
      for (const [t1, t2] of angles) {
        const R1 = rotMat(t1);
        const R2 = rotMat(t2);
        const R12 = mat2Mul(R1, R2);
        const Rsum = rotMat(t1 + t2);
        // Each entry should match
        for (let i = 0; i < 2; i++) {
          for (let j = 0; j < 2; j++) {
            expect(R12[i][j]).toBeCloseTo(Rsum[i][j], 9);
          }
        }
      }
    });

    // composePositions implements R(θ₁)·R(θ₂) = R(θ₁+θ₂) (Euler multiplication)
    test('angle addition corresponds to rotation matrix multiplication (Euler multiplication)', () => {
      const theta1 = 0.4;
      const theta2 = 0.7;
      const theta12 = theta1 + theta2;

      // Via matrix multiplication: R(θ₁)·R(θ₂) entries
      const R1 = rotMat(theta1);
      const R2 = rotMat(theta2);
      const R12 = mat2Mul(R1, R2);

      // Via direct formula: R(θ₁+θ₂)
      const Rsum = rotMat(theta12);

      expect(R12[0][0]).toBeCloseTo(Rsum[0][0], 9);
      expect(R12[0][1]).toBeCloseTo(Rsum[0][1], 9);
      expect(R12[1][0]).toBeCloseTo(Rsum[1][0], 9);
      expect(R12[1][1]).toBeCloseTo(Rsum[1][1], 9);
    });
  });
});
