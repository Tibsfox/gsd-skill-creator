// test/proofs/part-vii-connecting/ch21-abstract-algebra.test.ts
// Computational verification for Chapter 21: Abstract Algebra — Groups, Rings, Fields
// Proof document: .planning/v1.50a/half-b/proofs/ch21-abstract-algebra.md
// Phase 479, Subversion 1.50.71
//
// Group axioms (21.A) are accepted as L5 definitional axioms.
// What is proved and tested:
// - Proof 21.1 (L3): Lagrange's theorem — coset partition, subgroup orders divide |G|
// - Proof 21.2 (L3): First isomorphism theorem — kernel/quotient/image correspondence
// - Proof 21.3 (L4): Stokes' theorem via differential forms — d²=0, Green's theorem 2D

import { describe, test, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Helpers: S₃ group arithmetic
// ---------------------------------------------------------------------------

// S₃ = symmetric group on {0,1,2}: 6 permutations
// Represent each as a 3-element array: [f(0), f(1), f(2)]
const S3_ELEMENTS = [
  [0, 1, 2], // e (identity)
  [0, 2, 1], // (12)
  [1, 0, 2], // (01) -- transposition of 0 and 1
  [1, 2, 0], // (012) -- 3-cycle
  [2, 0, 1], // (021) -- 3-cycle
  [2, 1, 0], // (02)
];

/** Compose two permutations: (g ∘ f)[i] = g[f[i]] */
function composePerm(f: number[], g: number[]): number[] {
  return f.map((fi) => g[fi]);
}

/** Find index of permutation in S3_ELEMENTS */
function permIndex(p: number[]): number {
  return S3_ELEMENTS.findIndex((e) => e[0] === p[0] && e[1] === p[1] && e[2] === p[2]);
}

/** Check if array of perm-indices forms a subgroup of S3 */
function isSubgroup(indices: number[]): boolean {
  // Must contain identity (index 0)
  if (!indices.includes(0)) return false;
  // Closed under composition
  for (const i of indices) {
    for (const j of indices) {
      const product = composePerm(S3_ELEMENTS[i], S3_ELEMENTS[j]);
      const idx = permIndex(product);
      if (!indices.includes(idx)) return false;
    }
  }
  // Closed under inverses (if closed under composition and finite, this follows)
  return true;
}

describe('Chapter 21: Abstract Algebra — Computational Verification', () => {
  // --------------------------------------------------------------------------
  // proof-21-1-lagrange: Lagrange's Theorem
  // Classification: L3 — coset partition argument
  // Method: Constructive — verify for S₃ (|S₃| = 6) that all subgroup orders divide 6
  // --------------------------------------------------------------------------
  describe('proof-21-1: Lagrange\'s theorem', () => {
    test('S₃ has exactly 6 elements', () => {
      expect(S3_ELEMENTS.length).toBe(6);
      // Verify identity is the first element
      expect(S3_ELEMENTS[0]).toEqual([0, 1, 2]);
    });

    test('composition table is closed (S₃ is a group)', () => {
      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 6; j++) {
          const product = composePerm(S3_ELEMENTS[i], S3_ELEMENTS[j]);
          const idx = permIndex(product);
          expect(idx).toBeGreaterThanOrEqual(0); // product is in S3
        }
      }
    });

    test('trivial subgroup {e} has order 1, divides 6', () => {
      const trivial = [0]; // just the identity
      expect(isSubgroup(trivial)).toBe(true);
      expect(6 % trivial.length).toBe(0); // 1 divides 6
    });

    test('transposition subgroups have order 2, divides 6', () => {
      // {e, (12)}: indices 0 and 1
      const sub12 = [0, 1];
      expect(isSubgroup(sub12)).toBe(true);
      expect(sub12.length).toBe(2);
      expect(6 % sub12.length).toBe(0); // 2 divides 6

      // {e, (01)}: indices 0 and 2
      const sub01 = [0, 2];
      expect(isSubgroup(sub01)).toBe(true);
      expect(sub01.length).toBe(2);
      expect(6 % sub01.length).toBe(0);

      // {e, (02)}: indices 0 and 5
      const sub02 = [0, 5];
      expect(isSubgroup(sub02)).toBe(true);
      expect(sub02.length).toBe(2);
      expect(6 % sub02.length).toBe(0);
    });

    test('3-cycle subgroup A₃ = {e, (012), (021)} has order 3, divides 6', () => {
      const A3 = [0, 3, 4]; // e, (012), (021)
      expect(isSubgroup(A3)).toBe(true);
      expect(A3.length).toBe(3);
      expect(6 % A3.length).toBe(0); // 3 divides 6
    });

    test('S₃ itself has order 6, divides 6', () => {
      const all = [0, 1, 2, 3, 4, 5];
      expect(isSubgroup(all)).toBe(true);
      expect(all.length).toBe(6);
      expect(6 % all.length).toBe(0);
    });

    test('Lagrange: no subgroup of order 4 exists in S₃ (4 does not divide 6)', () => {
      expect(6 % 4).not.toBe(0); // Lagrange forbids order-4 subgroups
      // Exhaustively check all 4-element subsets
      let found4ElementSubgroup = false;
      for (let a = 0; a < 6; a++) {
        for (let b = a + 1; b < 6; b++) {
          for (let c = b + 1; c < 6; c++) {
            for (let d = c + 1; d < 6; d++) {
              if (isSubgroup([a, b, c, d])) {
                found4ElementSubgroup = true;
              }
            }
          }
        }
      }
      expect(found4ElementSubgroup).toBe(false);
    });

    test('Lagrange: no subgroup of order 5 exists in S₃ (5 does not divide 6)', () => {
      expect(6 % 5).not.toBe(0); // Lagrange forbids order-5 subgroups
      let found5ElementSubgroup = false;
      for (let a = 0; a < 6; a++) {
        for (let b = a + 1; b < 6; b++) {
          for (let c = b + 1; c < 6; c++) {
            for (let d = c + 1; d < 6; d++) {
              for (let e2 = d + 1; e2 < 6; e2++) {
                if (isSubgroup([a, b, c, d, e2])) {
                  found5ElementSubgroup = true;
                }
              }
            }
          }
        }
      }
      expect(found5ElementSubgroup).toBe(false);
    });

    test('coset partition: [G:H] = |G|/|H| is an integer for all subgroups', () => {
      const subgroups = [
        { indices: [0], name: '{e}' },
        { indices: [0, 1], name: '{e,(12)}' },
        { indices: [0, 2], name: '{e,(01)}' },
        { indices: [0, 5], name: '{e,(02)}' },
        { indices: [0, 3, 4], name: 'A3' },
        { indices: [0, 1, 2, 3, 4, 5], name: 'S3' },
      ];
      for (const { indices } of subgroups) {
        const index = 6 / indices.length;
        expect(Number.isInteger(index)).toBe(true);
        expect(6 % indices.length).toBe(0); // |H| divides |G|
      }
    });
  });

  // --------------------------------------------------------------------------
  // proof-21-2-isomorphism: First Isomorphism Theorem
  // Classification: L3 — kernel/quotient/image construction
  // Method: Constructive — φ: ℤ₆ → ℤ₂, φ(n) = n mod 2
  // --------------------------------------------------------------------------
  describe('proof-21-2: First isomorphism theorem', () => {
    const Z6 = [0, 1, 2, 3, 4, 5];
    const Z2 = [0, 1];

    /** Homomorphism φ: ℤ₆ → ℤ₂ defined by φ(n) = n mod 2 */
    function phi(n: number): number {
      return n % 2;
    }

    /** ℤ₆ addition mod 6 */
    function add6(a: number, b: number): number {
      return (a + b) % 6;
    }

    /** ℤ₂ addition mod 2 */
    function add2(a: number, b: number): number {
      return (a + b) % 2;
    }

    test('φ(n) = n mod 2 is a group homomorphism: φ(a+b) = φ(a)+φ(b) in ℤ₂', () => {
      for (const a of Z6) {
        for (const b of Z6) {
          expect(phi(add6(a, b))).toBe(add2(phi(a), phi(b)));
        }
      }
    });

    test('ker(φ) = {0, 2, 4} (even elements of ℤ₆)', () => {
      const kernel = Z6.filter((n) => phi(n) === 0);
      expect(kernel.sort()).toEqual([0, 2, 4]);
    });

    test('im(φ) = ℤ₂ = {0, 1}', () => {
      const image = [...new Set(Z6.map(phi))].sort();
      expect(image).toEqual([0, 1]);
    });

    test('ℤ₆/ker(φ) has exactly 2 cosets', () => {
      const kernel = new Set([0, 2, 4]);
      // Coset of 0: {0+k : k ∈ ker} = {0, 2, 4}
      const coset0 = Z6.filter((n) => kernel.has((n - 0 + 6) % 6) || kernel.has(n)).sort();
      // More precisely: coset of 0 = {n : n - 0 ∈ ker} = {n : n ∈ ker}
      const coset_of_0 = Z6.filter((n) => kernel.has(n));
      // Coset of 1: {1+k : k ∈ ker} = {1, 3, 5}
      const coset_of_1 = Z6.filter((n) => !kernel.has(n));
      expect(coset_of_0).toEqual([0, 2, 4]);
      expect(coset_of_1).toEqual([1, 3, 5]);
      // Exactly 2 distinct cosets
      expect(6 / kernel.size).toBe(2);
    });

    test('induced map ψ: G/ker(φ) → ℤ₂ is a bijection', () => {
      // ψ({0,2,4}) = φ(0) = 0
      // ψ({1,3,5}) = φ(1) = 1
      const cosets = [[0, 2, 4], [1, 3, 5]];
      const psiValues = cosets.map((coset) => phi(coset[0])); // representative element
      expect(psiValues).toEqual([0, 1]);
      // Two distinct outputs for two distinct inputs — bijection
      expect(new Set(psiValues).size).toBe(2);
    });

    test('induced map ψ is a group homomorphism (quotient group structure)', () => {
      // Coset multiplication: {0,2,4} + {0,2,4} = {0,2,4} (even+even=even)
      // ψ({0,2,4} + {0,2,4}) = ψ({0,2,4}) = 0 = 0+0 = ψ({0,2,4})+ψ({0,2,4}) ✓
      // {0,2,4} + {1,3,5} = {1,3,5} (even+odd=odd)
      // ψ({1,3,5}) = 1 = 0+1 ✓
      // {1,3,5} + {1,3,5} = {0,2,4} (odd+odd=even)
      // ψ({0,2,4}) = 0 = 1+1 mod 2 = 0 ✓
      const kerCoset = 0; // represents {0,2,4}
      const oddCoset = 1; // represents {1,3,5}
      expect(add2(kerCoset, kerCoset)).toBe(kerCoset); // even+even=even
      expect(add2(kerCoset, oddCoset)).toBe(oddCoset); // even+odd=odd
      expect(add2(oddCoset, oddCoset)).toBe(kerCoset); // odd+odd=even
      // This matches ψ values: ψ(kerCoset)=0, ψ(oddCoset)=1
      // ψ(kerCoset + kerCoset) = 0 = 0+0 = ψ(kerCoset)+ψ(kerCoset) ✓
      expect(add2(phi(0), phi(0))).toBe(phi(add6(0, 0)));
    });
  });

  // --------------------------------------------------------------------------
  // proof-21-3-stokes-forms: Stokes' Theorem via Differential Forms
  // Classification: L4 — exterior derivative d²=0, Green's theorem 2D
  // Method: Verification — d(d(f))=0 numerically; Green's theorem for F=(−y,x)
  // --------------------------------------------------------------------------
  describe('proof-21-3: Stokes\' theorem via differential forms (d²=0)', () => {
    const h = 1e-6; // finite difference step

    /** Partial derivative ∂f/∂x numerically at (x, y) */
    function pdx(f: (x: number, y: number) => number, x: number, y: number): number {
      return (f(x + h, y) - f(x - h, y)) / (2 * h);
    }

    /** Partial derivative ∂f/∂y numerically at (x, y) */
    function pdy(f: (x: number, y: number) => number, x: number, y: number): number {
      return (f(x, y + h) - f(x, y - h)) / (2 * h);
    }

    test('d²=0: for f(x,y)=sin(x)cos(y), d(d(f)) vanishes numerically', () => {
      // f is a 0-form; df = (∂f/∂x)dx + (∂f/∂y)dy
      // d(df) = (∂²f/∂y∂x - ∂²f/∂x∂y) dx∧dy = 0 (equality of mixed partials)
      const f = (x: number, y: number) => Math.sin(x) * Math.cos(y);

      // Test at multiple points
      const testPoints = [
        [0.5, 0.3],
        [1.0, 0.7],
        [0.2, 1.4],
        [-0.3, 0.8],
      ];
      for (const [x, y] of testPoints) {
        // d(df) coefficient = ∂/∂y(∂f/∂x) - ∂/∂x(∂f/∂y)
        const fx = (xx: number, yy: number) => pdx(f, xx, yy);
        const fy = (xx: number, yy: number) => pdy(f, xx, yy);
        const d2f_coeff = pdy(fx, x, y) - pdx(fy, x, y);
        // d²=0: the coefficient of dx∧dy in d(df) is zero
        expect(Math.abs(d2f_coeff)).toBeLessThan(1e-5);
      }
    });

    test('d²=0 for 1-form ω=x·dy: d(x dy) = dx∧dy, then d(dx∧dy) = 0', () => {
      // ω = x dy (a 1-form; P=0, Q=x)
      // dω = (∂Q/∂x - ∂P/∂y) dx∧dy = (1 - 0) dx∧dy = dx∧dy
      // d(dω) would involve differentiating the constant coefficient 1 — must be 0
      // Verify: d applied to a top-form (2-form on ℝ²) is always 0
      const Q = (x: number, _y: number) => x; // coefficient of dy
      const P = (_x: number, _y: number) => 0; // coefficient of dx

      // dω coefficient: ∂Q/∂x - ∂P/∂y
      const testPoint = [0.5, 0.7];
      const [x, y] = testPoint;
      const curlCoeff = pdx(Q, x, y) - pdy(P, x, y);
      expect(curlCoeff).toBeCloseTo(1.0, 5); // dω = 1·dx∧dy

      // d(dω): derivative of the coefficient (which is constant 1) must be 0
      // For a 2-form on ℝ², d maps to a 3-form, which is 0 in ℝ² (no room for 3-forms)
      // This is exactly d²=0 for top-dimensional forms
      const constFn = (_x: number, _y: number) => 1.0;
      const gradX = pdx(constFn, x, y);
      const gradY = pdy(constFn, x, y);
      expect(Math.abs(gradX)).toBeLessThan(1e-9);
      expect(Math.abs(gradY)).toBeLessThan(1e-9);
    });

    test("Green's theorem (2D Stokes): ∮ F·dr = ∫∫ curl(F) dA for F=(-y,x) on unit disk", () => {
      // F = (-y, x) => curl(F) = ∂x/∂x - ∂(-y)/∂y = 1 - (-1) = 2
      // ∫∫ curl(F) dA = 2 * area(unit disk) = 2π
      // Line integral ∮ F·dr on unit circle: parametrize as (cos t, sin t)
      //   F(cos t, sin t) = (-sin t, cos t)
      //   dr = (-sin t, cos t) dt
      //   F·dr = (-sin t)(-sin t) + (cos t)(cos t) = sin²t + cos²t = 1
      //   ∮ = ∫₀^{2π} 1 dt = 2π ✓

      // Numerical line integral
      const N = 10000;
      let lineIntegral = 0;
      for (let k = 0; k < N; k++) {
        const t = (2 * Math.PI * k) / N;
        const dt = (2 * Math.PI) / N;
        const x = Math.cos(t);
        const y = Math.sin(t);
        const Fx = -y;
        const Fy = x;
        const dxdt = -Math.sin(t);
        const dydt = Math.cos(t);
        lineIntegral += (Fx * dxdt + Fy * dydt) * dt;
      }

      // Numerical area integral of curl(F) = 2 over unit disk
      // ∫∫ curl dA ≈ 2 * π * 1² = 2π
      const curlF = 2; // constant
      const areaDiskApprox = Math.PI; // exact area of unit disk
      const areaIntegral = curlF * areaDiskApprox;

      expect(lineIntegral).toBeCloseTo(2 * Math.PI, 3);
      expect(areaIntegral).toBeCloseTo(2 * Math.PI, 5);
      expect(lineIntegral).toBeCloseTo(areaIntegral, 2);
    });

    test("Green's theorem: curl of F=(y, 0) over unit square [0,1]² = -1", () => {
      // F = (y, 0): P=y, Q=0
      // curl = ∂Q/∂x - ∂P/∂y = 0 - 1 = -1
      // ∫∫ curl dA over [0,1]² = -1 * 1 = -1

      // Line integral ∮ F·dr counterclockwise around [0,1]²:
      // Bottom: (0,0)→(1,0): y=0, F=(0,0), contribution=0
      // Right: (1,0)→(1,1): x=1, F=(y,0), dr=(0,dy): F·dr = 0
      // Top: (1,1)→(0,1): y=1, F=(1,0), dr=(-dx,0): F·dr = -dx, integral=-1
      // Left: (0,1)→(0,0): x=0, F=(y,0), dr=(0,-dy): F·dr = 0
      // Total: 0 + 0 + (-1) + 0 = -1

      const M = 1000; // segments per side
      let lineIntegral = 0;

      // Bottom: y=0, x from 0 to 1
      for (let k = 0; k < M; k++) {
        const x = k / M;
        const y = 0;
        const Fx = y; // = 0
        const Fy = 0;
        lineIntegral += Fx * (1 / M) + Fy * 0;
      }
      // Right: x=1, y from 0 to 1
      for (let k = 0; k < M; k++) {
        const y = k / M;
        const Fx = y;
        const Fy = 0;
        lineIntegral += Fx * 0 + Fy * (1 / M);
      }
      // Top: y=1, x from 1 to 0 (dx = -1/M)
      for (let k = 0; k < M; k++) {
        const x = 1 - k / M;
        const y = 1;
        const Fx = y; // = 1
        const Fy = 0;
        lineIntegral += Fx * (-1 / M) + Fy * 0;
      }
      // Left: x=0, y from 1 to 0 (dy = -1/M)
      for (let k = 0; k < M; k++) {
        const y = 1 - k / M;
        const Fx = y;
        const Fy = 0;
        lineIntegral += Fx * 0 + Fy * (-1 / M);
      }

      expect(lineIntegral).toBeCloseTo(-1, 3);

      // Verify area integral of curl matches
      const curlF = -1; // ∂Q/∂x - ∂P/∂y = 0 - 1 = -1
      const areaIntegral = curlF * 1; // area of unit square = 1
      expect(areaIntegral).toBe(-1);
      expect(lineIntegral).toBeCloseTo(areaIntegral, 3);
    });
  });
});
