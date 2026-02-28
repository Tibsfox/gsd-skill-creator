// test/proofs/part-i-seeing/ch03-pythagorean.test.ts
// Computational verification for Chapter 3: Pythagorean Theorem — Geometry and Distance
// Proof document: .planning/v1.50a/half-b/proofs/ch03-pythagorean.md
// Phase 475, Subversion 1.50.53

import { describe, test, expect } from 'vitest';
import { dot2D, mag2D } from '../helpers/numerical';

describe('Chapter 3: Pythagorean Theorem — Computational Verification', () => {
  // ---------------------------------------------------------------------------
  // proof-3-1/3-2: Pythagorean theorem and integer triples
  // Technique 1: Exact integer arithmetic
  // ---------------------------------------------------------------------------
  describe('proof-3-1: a^2 + b^2 = c^2 for right triangles', () => {
    const pythagoreanTriples: [number, number, number][] = [
      [3, 4, 5],
      [5, 12, 13],
      [8, 15, 17],
      [7, 24, 25],
      [20, 21, 29],
      [9, 40, 41],
    ];

    test.each(pythagoreanTriples)('(%i)^2 + (%i)^2 = (%i)^2', (a, b, c) => {
      expect(a * a + b * b).toBe(c * c);
    });
  });

  describe('proof-3-2: parametric family of Pythagorean triples (m^2-n^2, 2mn, m^2+n^2)', () => {
    test('Euclid\'s parametric formula generates valid triples for m > n > 0', () => {
      const params: [number, number][] = [[2, 1], [3, 2], [4, 1], [4, 3], [5, 2]];
      for (const [m, n] of params) {
        const a = m * m - n * n;
        const b = 2 * m * n;
        const c = m * m + n * n;
        expect(a * a + b * b).toBe(c * c);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // proof-3-4-distance-formula
  // Technique 1: Numerical evaluation at known points
  // ---------------------------------------------------------------------------
  describe('proof-3-4: distance formula d = sqrt((x2-x1)^2 + (y2-y1)^2)', () => {
    test('d((0,0), (3,4)) = 5', () => {
      const d = Math.sqrt(3 * 3 + 4 * 4);
      expect(d).toBeCloseTo(5, 10);
    });

    test('d((0,0), (5,12)) = 13', () => {
      const d = Math.sqrt(5 * 5 + 12 * 12);
      expect(d).toBeCloseTo(13, 10);
    });

    test('distance is symmetric: d(P,Q) = d(Q,P) for 100 random pairs', () => {
      for (let i = 0; i < 100; i++) {
        const x1 = Math.random() * 200 - 100;
        const y1 = Math.random() * 200 - 100;
        const x2 = Math.random() * 200 - 100;
        const y2 = Math.random() * 200 - 100;
        const dPQ = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const dQP = Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
        expect(dPQ).toBeCloseTo(dQP, 10);
      }
    });

    test('triangle inequality: d(P,R) <= d(P,Q) + d(Q,R) for 100 random triangles', () => {
      for (let i = 0; i < 100; i++) {
        const pts = Array.from({ length: 6 }, () => Math.random() * 100 - 50);
        const [px, py, qx, qy, rx, ry] = pts;
        const dPQ = Math.sqrt((qx - px) ** 2 + (qy - py) ** 2);
        const dQR = Math.sqrt((rx - qx) ** 2 + (ry - qy) ** 2);
        const dPR = Math.sqrt((rx - px) ** 2 + (ry - py) ** 2);
        expect(dPR).toBeLessThanOrEqual(dPQ + dQR + 1e-10);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // proof-3-3-cauchy-schwarz: |u·v| <= |u||v|
  // Technique 2: Property testing
  // Platform connection: tangentScore in src/plane/activation.ts is bounded <= 1
  // This is labeled HIGH CONSEQUENCE in the proof document.
  // ---------------------------------------------------------------------------
  describe('proof-3-5: Cauchy-Schwarz inequality |u·v| <= |u||v|', () => {
    test('Cauchy-Schwarz holds for 200 random 2D vector pairs', () => {
      for (let i = 0; i < 200; i++) {
        const u = { x: Math.random() * 200 - 100, y: Math.random() * 200 - 100 };
        const v = { x: Math.random() * 200 - 100, y: Math.random() * 200 - 100 };
        const dotUV = Math.abs(dot2D(u, v));
        const magU = mag2D(u);
        const magV = mag2D(v);
        expect(dotUV).toBeLessThanOrEqual(magU * magV + 1e-10);
      }
    });

    test('Cauchy-Schwarz achieves equality when vectors are parallel (v = k*u)', () => {
      const u = { x: 3, y: 4 }; // |u| = 5
      const v = { x: 6, y: 8 }; // v = 2u, |v| = 10
      const dotUV = Math.abs(dot2D(u, v));
      const magU = mag2D(u);
      const magV = mag2D(v);
      expect(dotUV).toBeCloseTo(magU * magV, 10); // equality when parallel
    });

    test('Cauchy-Schwarz achieves equality when vectors are anti-parallel (v = -k*u)', () => {
      const u = { x: 3, y: 4 };
      const v = { x: -6, y: -8 }; // v = -2u
      const dotUV = Math.abs(dot2D(u, v));
      const magU = mag2D(u);
      const magV = mag2D(v);
      expect(dotUV).toBeCloseTo(magU * magV, 10);
    });

    // PLATFORM CONNECTION TEST
    // Proves that the dot product of two unit-circle skill positions is in [-1, 1].
    // This bounds the tangentScore used in src/plane/activation.ts.
    // When both u and v are on the unit circle (|u| = |v| = 1),
    // Cauchy-Schwarz gives |u·v| <= 1*1 = 1, so dot product is in [-1, 1].
    test('activation score analog: unit-vector dot product is bounded in [-1, 1]', () => {
      for (let i = 0; i < 200; i++) {
        const theta1 = Math.random() * 2 * Math.PI;
        const theta2 = Math.random() * 2 * Math.PI;
        // Unit-circle skill positions
        const u = { x: Math.cos(theta1), y: Math.sin(theta1) };
        const v = { x: Math.cos(theta2), y: Math.sin(theta2) };
        const dotProduct = dot2D(u, v);
        // By Cauchy-Schwarz with unit vectors: |u·v| <= 1
        expect(dotProduct).toBeGreaterThanOrEqual(-1 - 1e-10);
        expect(dotProduct).toBeLessThanOrEqual(1 + 1e-10);
      }
    });
  });
});
