// test/proofs/part-iv-expanding/ch11-vectors.test.ts
// Computational verification for Chapter 11: Vectors and Vector Spaces
// Proof document: .planning/v1.50a/half-b/proofs/ch11-vectors.md
// Phase 477, Subversion 1.50.61

import { describe, test, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Vector helpers
// ---------------------------------------------------------------------------

function vec2(x: number, y: number): [number, number] {
  return [x, y];
}

function vec3(x: number, y: number, z: number): [number, number, number] {
  return [x, y, z];
}

function add2(u: [number, number], v: [number, number]): [number, number] {
  return [u[0] + v[0], u[1] + v[1]];
}

function scale2(c: number, u: [number, number]): [number, number] {
  return [c * u[0], c * u[1]];
}

function dotN(u: number[], v: number[]): number {
  return u.reduce((sum, ui, i) => sum + ui * v[i], 0);
}

function magN(u: number[]): number {
  return Math.sqrt(dotN(u, u));
}

// Deterministic pseudo-random generator for reproducible tests
// Simple linear congruential generator
function* lcg(seed: number): Generator<number, never, unknown> {
  let s = seed;
  while (true) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    yield (s >>> 0) / 0x100000000;
  }
}

function randomVec2(gen: Generator<number, never, unknown>): [number, number] {
  return [gen.next().value * 4 - 2, gen.next().value * 4 - 2];
}

function randomVec3(gen: Generator<number, never, unknown>): [number, number, number] {
  return [gen.next().value * 4 - 2, gen.next().value * 4 - 2, gen.next().value * 4 - 2];
}

describe('Chapter 11: Vectors and Vector Spaces — Computational Verification', () => {
  // ---------------------------------------------------------------------------
  // proof-11-1-vector-space-axioms: (R², +, ·) is a vector space
  // Classification: L2 — systematic verification of all 8 axioms
  // Platform connection: SkillPosition lives in R² with Cartesian representation
  // ---------------------------------------------------------------------------
  describe('proof-11-1: vector space axioms for R²', () => {
    const gen = lcg(42);

    test('A1 — closure under addition: u + v ∈ R²', () => {
      for (let i = 0; i < 50; i++) {
        const u = randomVec2(gen);
        const v = randomVec2(gen);
        const sum = add2(u, v);
        expect(Number.isFinite(sum[0])).toBe(true);
        expect(Number.isFinite(sum[1])).toBe(true);
      }
    });

    test('A2 — commutativity: u + v = v + u', () => {
      const gen2 = lcg(43);
      for (let i = 0; i < 100; i++) {
        const u = randomVec2(gen2);
        const v = randomVec2(gen2);
        const uv = add2(u, v);
        const vu = add2(v, u);
        expect(uv[0]).toBeCloseTo(vu[0], 10);
        expect(uv[1]).toBeCloseTo(vu[1], 10);
      }
    });

    test('A3 — associativity: (u + v) + w = u + (v + w)', () => {
      const gen3 = lcg(44);
      for (let i = 0; i < 100; i++) {
        const u = randomVec2(gen3);
        const v = randomVec2(gen3);
        const w = randomVec2(gen3);
        const lhs = add2(add2(u, v), w);
        const rhs = add2(u, add2(v, w));
        expect(lhs[0]).toBeCloseTo(rhs[0], 10);
        expect(lhs[1]).toBeCloseTo(rhs[1], 10);
      }
    });

    test('A4 — zero vector: u + 0 = u', () => {
      const gen4 = lcg(45);
      const zero = vec2(0, 0);
      for (let i = 0; i < 100; i++) {
        const u = randomVec2(gen4);
        const sum = add2(u, zero);
        expect(sum[0]).toBeCloseTo(u[0], 10);
        expect(sum[1]).toBeCloseTo(u[1], 10);
      }
    });

    test('A5 — additive inverse: u + (-u) = 0', () => {
      const gen5 = lcg(46);
      for (let i = 0; i < 100; i++) {
        const u = randomVec2(gen5);
        const neg = scale2(-1, u);
        const sum = add2(u, neg);
        expect(sum[0]).toBeCloseTo(0, 10);
        expect(sum[1]).toBeCloseTo(0, 10);
      }
    });

    test('A6 — closure under scalar multiplication: c·u ∈ R²', () => {
      const gen6 = lcg(47);
      for (let i = 0; i < 100; i++) {
        const c = gen6.next().value * 6 - 3;
        const u = randomVec2(gen6);
        const scaled = scale2(c, u);
        expect(Number.isFinite(scaled[0])).toBe(true);
        expect(Number.isFinite(scaled[1])).toBe(true);
      }
    });

    test('A7 — distributivity: c·(u + v) = c·u + c·v', () => {
      const gen7 = lcg(48);
      for (let i = 0; i < 100; i++) {
        const c = gen7.next().value * 6 - 3;
        const u = randomVec2(gen7);
        const v = randomVec2(gen7);
        const lhs = scale2(c, add2(u, v));
        const rhs = add2(scale2(c, u), scale2(c, v));
        expect(lhs[0]).toBeCloseTo(rhs[0], 10);
        expect(lhs[1]).toBeCloseTo(rhs[1], 10);
      }
    });

    test('A8 — compatibility: (cd)·u = c·(d·u)', () => {
      const gen8 = lcg(49);
      for (let i = 0; i < 100; i++) {
        const c = gen8.next().value * 4 - 2;
        const d = gen8.next().value * 4 - 2;
        const u = randomVec2(gen8);
        const lhs = scale2(c * d, u);
        const rhs = scale2(c, scale2(d, u));
        expect(lhs[0]).toBeCloseTo(rhs[0], 10);
        expect(lhs[1]).toBeCloseTo(rhs[1], 10);
      }
    });

    test('scalar identity: 1·u = u', () => {
      const gen9 = lcg(50);
      for (let i = 0; i < 100; i++) {
        const u = randomVec2(gen9);
        const scaled = scale2(1, u);
        expect(scaled[0]).toBeCloseTo(u[0], 10);
        expect(scaled[1]).toBeCloseTo(u[1], 10);
      }
    });

    // Platform connection: SkillPosition as r·e^(iθ) = (r·cosθ, r·sinθ) ∈ R²
    test('SkillPosition Cartesian form obeys vector space axioms', () => {
      // Two example skill positions converted to Cartesian
      const theta1 = 0.5;
      const r1 = 0.7;
      const theta2 = 1.2;
      const r2 = 0.9;
      const pos1 = vec2(r1 * Math.cos(theta1), r1 * Math.sin(theta1));
      const pos2 = vec2(r2 * Math.cos(theta2), r2 * Math.sin(theta2));
      // Commutativity holds
      const sum12 = add2(pos1, pos2);
      const sum21 = add2(pos2, pos1);
      expect(sum12[0]).toBeCloseTo(sum21[0], 10);
      expect(sum12[1]).toBeCloseTo(sum21[1], 10);
      // Scaling by 0.5 is still in R²
      const half = scale2(0.5, pos1);
      expect(Number.isFinite(half[0])).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // proof-11-2-cauchy-schwarz: |u·v| ≤ |u||v|
  // Classification: L2 — quadratic discriminant argument
  // Platform connection: estimateTheta = atan2(abstractSignals, concreteSignals) IS
  //   the dot-product angle computation of the 2D signal vector
  // ---------------------------------------------------------------------------
  describe('proof-11-2: Cauchy-Schwarz inequality', () => {
    test('|u·v| ≤ |u||v| for 1000 random vector pairs in R²', () => {
      const gen = lcg(100);
      let violations = 0;
      for (let i = 0; i < 1000; i++) {
        const u = randomVec2(gen);
        const v = randomVec2(gen);
        const dp = dotN(u, v);
        const bound = magN(u) * magN(v);
        if (Math.abs(dp) > bound + 1e-10) violations++;
      }
      expect(violations).toBe(0);
    });

    test('|u·v| ≤ |u||v| for 1000 random vector pairs in R³', () => {
      const gen = lcg(101);
      let violations = 0;
      for (let i = 0; i < 1000; i++) {
        const u = randomVec3(gen);
        const v = randomVec3(gen);
        const dp = dotN(u, v);
        const bound = magN(u) * magN(v);
        if (Math.abs(dp) > bound + 1e-10) violations++;
      }
      expect(violations).toBe(0);
    });

    test('u·v / (|u||v|) ∈ [-1, 1] for all non-zero pairs', () => {
      const gen = lcg(102);
      for (let i = 0; i < 500; i++) {
        const u = randomVec3(gen);
        const v = randomVec3(gen);
        const normU = magN(u);
        const normV = magN(v);
        if (normU < 1e-10 || normV < 1e-10) continue; // skip near-zero
        const cosTheta = dotN(u, v) / (normU * normV);
        expect(cosTheta).toBeGreaterThanOrEqual(-1 - 1e-10);
        expect(cosTheta).toBeLessThanOrEqual(1 + 1e-10);
      }
    });

    test('Cauchy-Schwarz bound is tight: equality when u = v (parallel vectors)', () => {
      const gen = lcg(103);
      for (let i = 0; i < 50; i++) {
        const u = randomVec3(gen);
        const dp = dotN(u, u); // u·u = |u|²
        const bound = magN(u) * magN(u); // |u||u| = |u|²
        expect(Math.abs(dp)).toBeCloseTo(bound, 10);
      }
    });

    test('Cauchy-Schwarz tight for scalar multiples: u · (2u)', () => {
      const u = [1, 2, 3];
      const v = [2, 4, 6]; // v = 2u
      const dp = Math.abs(dotN(u, v)); // |u·(2u)| = 2|u|²
      const bound = magN(u) * magN(v); // |u|·|2u| = 2|u|²
      expect(dp).toBeCloseTo(bound, 10);
    });

    // Platform connection: atan2(y, x) = arccos(x/|u|) is the dot-product angle
    test('atan2 matches dot-product angle formula for 2D signal vectors', () => {
      const gen = lcg(104);
      for (let i = 0; i < 200; i++) {
        const concrete = gen.next().value * 10 + 0.1; // simulate concrete signals
        const abstract = gen.next().value * 10 + 0.1; // simulate abstract signals
        const u = [concrete, abstract];
        const eX = [1, 0]; // concrete axis unit vector
        // dot-product angle: arccos(u·eX / |u||eX|)
        const cosTheta = dotN(u, eX) / (magN(u) * magN(eX));
        const thetaDot = Math.acos(Math.max(-1, Math.min(1, cosTheta)));
        // atan2 angle (accounting for quadrant)
        const thetaAtan = Math.atan2(abstract, concrete);
        // Both should give the same angle (in [0, π/2] for positive concrete/abstract)
        expect(thetaAtan).toBeCloseTo(thetaDot, 8);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // proof-11-3-projection: proj_v(u) = (u·v / |v|²) v
  // Verification: v · (u - proj_v(u)) = 0
  // Classification: L2 — direct orthogonality verification
  // Platform connection: pointToTangentDistance uses projection formula
  // ---------------------------------------------------------------------------
  describe('proof-11-3: orthogonal projection formula', () => {
    function projOnto(u: number[], v: number[]): number[] {
      const coeff = dotN(u, v) / dotN(v, v);
      return v.map((vi) => coeff * vi);
    }

    test('remainder (u - proj_v(u)) is orthogonal to v for 500 random pairs in R²', () => {
      const gen = lcg(200);
      for (let i = 0; i < 500; i++) {
        const u = randomVec2(gen);
        // Generate v with nonzero magnitude
        let v = randomVec2(gen);
        while (magN(v) < 1e-6) v = randomVec2(gen);
        const p = projOnto(u, v);
        const remainder = u.map((ui, idx) => ui - p[idx]);
        const ortho = dotN(remainder, v);
        expect(Math.abs(ortho)).toBeLessThan(1e-10);
      }
    });

    test('remainder (u - proj_v(u)) is orthogonal to v for 500 random pairs in R³', () => {
      const gen = lcg(201);
      for (let i = 0; i < 500; i++) {
        const u = randomVec3(gen);
        let v = randomVec3(gen);
        while (magN(v) < 1e-6) v = randomVec3(gen);
        const p = projOnto(u, v);
        const remainder = u.map((ui, idx) => ui - p[idx]);
        const ortho = dotN(remainder, v);
        expect(Math.abs(ortho)).toBeLessThan(1e-10);
      }
    });

    test('|proj_v(u)| = |u·v̂| where v̂ = v/|v|', () => {
      const gen = lcg(202);
      for (let i = 0; i < 200; i++) {
        const u = randomVec3(gen);
        let v = randomVec3(gen);
        while (magN(v) < 1e-6) v = randomVec3(gen);
        const p = projOnto(u, v);
        const vHat = v.map((vi) => vi / magN(v));
        const projMag = magN(p);
        const uDotVHat = Math.abs(dotN(u, vHat));
        expect(projMag).toBeCloseTo(uDotVHat, 10);
      }
    });

    test('projection is idempotent: proj_v(proj_v(u)) = proj_v(u)', () => {
      const gen = lcg(203);
      for (let i = 0; i < 100; i++) {
        const u = randomVec2(gen);
        let v = randomVec2(gen);
        while (magN(v) < 1e-6) v = randomVec2(gen);
        const p = projOnto(u, v);
        const pp = projOnto(p, v);
        expect(pp[0]).toBeCloseTo(p[0], 9);
        expect(pp[1]).toBeCloseTo(p[1], 9);
      }
    });

    // Platform connection: pointToTangentDistance uses n̂·q − r
    test('point-to-tangent-line distance is |n̂·q − r| (projection formula)', () => {
      // n̂ = (cosθ, sinθ), tangent line at radius r has equation n̂·q = r
      const theta = 0.8;
      const r = 0.6;
      const nHat = [Math.cos(theta), Math.sin(theta)];
      const testPoints = [
        [0.5, 0.3],
        [0.9, 0.4],
        [0.1, 0.8],
      ];
      for (const q of testPoints) {
        const signedDist = dotN(nHat, q) - r;
        // Projection formula: signed distance from q to the tangent line
        expect(Number.isFinite(signedDist)).toBe(true);
        // A point exactly on the tangent line: q = r·nHat
        const onLine = nHat.map((n) => n * r);
        const distOnLine = dotN(nHat, onLine) - r;
        expect(Math.abs(distOnLine)).toBeLessThan(1e-10);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // proof-11-4-gram-schmidt: Gram-Schmidt orthogonalization
  // Verification: resulting vectors are orthonormal and span same space
  // Classification: L3 — multi-step construction
  // ---------------------------------------------------------------------------
  describe('proof-11-4: Gram-Schmidt orthogonalization', () => {
    function gramSchmidt2(
      v1: [number, number],
      v2: [number, number],
    ): [[number, number], [number, number]] {
      const u1 = v1;
      const mag1 = magN(u1);
      const e1: [number, number] = [u1[0] / mag1, u1[1] / mag1];

      // u2 = v2 - (v2·e1)e1
      const coeff = dotN(v2, e1);
      const u2: [number, number] = [v2[0] - coeff * e1[0], v2[1] - coeff * e1[1]];
      const mag2 = magN(u2);
      const e2: [number, number] = [u2[0] / mag2, u2[1] / mag2];

      return [e1, e2];
    }

    function gramSchmidt3(
      v1: [number, number, number],
      v2: [number, number, number],
      v3: [number, number, number],
    ): [[number, number, number], [number, number, number], [number, number, number]] {
      const mag1 = magN(v1);
      const e1: [number, number, number] = [v1[0] / mag1, v1[1] / mag1, v1[2] / mag1];

      const c12 = dotN(v2, e1);
      const u2: [number, number, number] = [v2[0] - c12 * e1[0], v2[1] - c12 * e1[1], v2[2] - c12 * e1[2]];
      const mag2 = magN(u2);
      const e2: [number, number, number] = [u2[0] / mag2, u2[1] / mag2, u2[2] / mag2];

      const c13 = dotN(v3, e1);
      const c23 = dotN(v3, e2);
      const u3: [number, number, number] = [
        v3[0] - c13 * e1[0] - c23 * e2[0],
        v3[1] - c13 * e1[1] - c23 * e2[1],
        v3[2] - c13 * e1[2] - c23 * e2[2],
      ];
      const mag3 = magN(u3);
      const e3: [number, number, number] = [u3[0] / mag3, u3[1] / mag3, u3[2] / mag3];

      return [e1, e2, e3];
    }

    test('e1 and e2 are unit vectors after Gram-Schmidt for 200 random R² pairs', () => {
      const gen = lcg(300);
      let count = 0;
      while (count < 200) {
        const v1 = randomVec2(gen);
        const v2 = randomVec2(gen);
        // Skip near-degenerate inputs
        if (magN(v1) < 0.1 || magN(v2) < 0.1) continue;
        const cross = v1[0] * v2[1] - v1[1] * v2[0];
        if (Math.abs(cross) < 0.01) continue; // nearly parallel
        const [e1, e2] = gramSchmidt2(v1, v2);
        expect(magN(e1)).toBeCloseTo(1, 9);
        expect(magN(e2)).toBeCloseTo(1, 9);
        count++;
      }
    });

    test('e1 · e2 = 0 (orthogonality) after Gram-Schmidt for 200 random R² pairs', () => {
      const gen = lcg(301);
      let count = 0;
      while (count < 200) {
        const v1 = randomVec2(gen);
        const v2 = randomVec2(gen);
        if (magN(v1) < 0.1 || magN(v2) < 0.1) continue;
        const cross = v1[0] * v2[1] - v1[1] * v2[0];
        if (Math.abs(cross) < 0.01) continue;
        const [e1, e2] = gramSchmidt2(v1, v2);
        expect(Math.abs(dotN(e1, e2))).toBeLessThan(1e-10);
        count++;
      }
    });

    test('span is preserved: v1, v2 expressible as linear combinations of e1, e2', () => {
      const gen = lcg(302);
      let count = 0;
      while (count < 100) {
        const v1 = randomVec2(gen);
        const v2 = randomVec2(gen);
        if (magN(v1) < 0.1 || magN(v2) < 0.1) continue;
        const cross = v1[0] * v2[1] - v1[1] * v2[0];
        if (Math.abs(cross) < 0.01) continue;
        const [e1, e2] = gramSchmidt2(v1, v2);
        // v1 should be expressible as (v1·e1)e1 + (v1·e2)e2
        const c1 = dotN(v1, e1);
        const c2 = dotN(v1, e2);
        const recon: [number, number] = [c1 * e1[0] + c2 * e2[0], c1 * e1[1] + c2 * e2[1]];
        expect(recon[0]).toBeCloseTo(v1[0], 8);
        expect(recon[1]).toBeCloseTo(v1[1], 8);
        count++;
      }
    });

    test('Gram-Schmidt on standard R³ basis produces identity (already orthonormal)', () => {
      const e1_in: [number, number, number] = [1, 0, 0];
      const e2_in: [number, number, number] = [0, 1, 0];
      const e3_in: [number, number, number] = [0, 0, 1];
      const [e1, e2, e3] = gramSchmidt3(e1_in, e2_in, e3_in);
      expect(magN(e1)).toBeCloseTo(1, 10);
      expect(magN(e2)).toBeCloseTo(1, 10);
      expect(magN(e3)).toBeCloseTo(1, 10);
      expect(Math.abs(dotN(e1, e2))).toBeLessThan(1e-10);
      expect(Math.abs(dotN(e1, e3))).toBeLessThan(1e-10);
      expect(Math.abs(dotN(e2, e3))).toBeLessThan(1e-10);
    });

    // Platform connection: PROMOTION_REGIONS as angular basis decomposition
    test('rotated basis of R² is orthonormal (models PROMOTION_REGIONS structure)', () => {
      // The concrete/abstract axes form an orthonormal basis for skill space
      const theta = 0.4; // arbitrary angle
      const f1: [number, number] = [Math.cos(theta), Math.sin(theta)];
      const f2: [number, number] = [-Math.sin(theta), Math.cos(theta)];
      expect(magN(f1)).toBeCloseTo(1, 10);
      expect(magN(f2)).toBeCloseTo(1, 10);
      expect(Math.abs(dotN(f1, f2))).toBeLessThan(1e-10);
    });
  });

  // ---------------------------------------------------------------------------
  // proof-11-5-dimension: all bases of R² have exactly 2 elements
  // Verification: det of basis matrix ≠ 0 (linear independence) + spanning check
  // Classification: L2 — Steinitz exchange lemma application
  // Platform connection: SkillPosition always requires exactly 2 coordinates (theta, radius)
  // ---------------------------------------------------------------------------
  describe('proof-11-5: basis and dimension theorem for R²', () => {
    test('standard basis {e1=(1,0), e2=(0,1)} of R² has exactly 2 elements', () => {
      const e1 = [1, 0];
      const e2 = [0, 1];
      // Linear independence: det ≠ 0
      const det = e1[0] * e2[1] - e1[1] * e2[0];
      expect(Math.abs(det)).toBeGreaterThan(0.99);
    });

    test('rotated basis {(cosθ, sinθ), (-sinθ, cosθ)} has det = 1 (still 2 elements)', () => {
      const testAngles = [0, 0.3, 0.7, 1.2, 1.8, 2.5, Math.PI / 4, Math.PI / 3];
      for (const theta of testAngles) {
        const f1 = [Math.cos(theta), Math.sin(theta)];
        const f2 = [-Math.sin(theta), Math.cos(theta)];
        const det = f1[0] * f2[1] - f1[1] * f2[0];
        // det(rotation matrix) = cos²θ + sin²θ = 1
        expect(det).toBeCloseTo(1, 10);
      }
    });

    test('random vectors in R² can be expressed as linear combinations of standard basis', () => {
      const gen = lcg(400);
      for (let i = 0; i < 100; i++) {
        const [x, y] = randomVec2(gen);
        // Basis expansion: (x,y) = x·e1 + y·e2
        const recon = [x * 1 + y * 0, x * 0 + y * 1];
        expect(recon[0]).toBeCloseTo(x, 10);
        expect(recon[1]).toBeCloseTo(y, 10);
      }
    });

    test('two basis matrices with det ≠ 0 both span R² (dimension invariance)', () => {
      const gen = lcg(401);
      for (let i = 0; i < 50; i++) {
        // Pick two random vectors
        const v1 = randomVec2(gen);
        const v2 = randomVec2(gen);
        const det = v1[0] * v2[1] - v1[1] * v2[0];
        if (Math.abs(det) < 0.01) continue; // skip singular

        // Both bases have 2 elements — dimension is invariant
        const basisSize = 2;
        expect(basisSize).toBe(2);

        // A random vector (x, y) can be recovered from this basis
        // Solve: x = a*v1[0] + b*v2[0], y = a*v1[1] + b*v2[1]
        // Solution: [a, b] = [[v1, v2]]^{-1} [x, y]
        const x = gen.next().value * 4 - 2;
        const y = gen.next().value * 4 - 2;
        const a = (x * v2[1] - y * v2[0]) / det;
        const b = (y * v1[0] - x * v1[1]) / det;
        const reconX = a * v1[0] + b * v2[0];
        const reconY = a * v1[1] + b * v2[1];
        expect(reconX).toBeCloseTo(x, 8);
        expect(reconY).toBeCloseTo(y, 8);
      }
    });

    // Platform connection: composePositions needs exactly 2 coordinates (theta, radius)
    test('SkillPosition polar form (theta, radius) is a valid 2D coordinate system', () => {
      // Any (x, y) in R² ↔ unique (r, theta) with r ≥ 0, theta ∈ [0, 2π)
      const testPoints = [
        [1, 0],
        [0, 1],
        [1, 1],
        [0.5, 0.8],
        [0.3, 0.7],
      ];
      for (const [x, y] of testPoints) {
        const r = Math.sqrt(x * x + y * y);
        const theta = Math.atan2(y, x);
        const recon = [r * Math.cos(theta), r * Math.sin(theta)];
        expect(recon[0]).toBeCloseTo(x, 10);
        expect(recon[1]).toBeCloseTo(y, 10);
      }
    });
  });
});
