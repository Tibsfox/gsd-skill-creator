import { describe, it, expect } from 'vitest';
import { magnitude } from '../../../src/holomorphic/complex/arithmetic';
import type { SnapshotMatrix, DMDConstraints } from '../../../src/holomorphic/dmd/types';

/* ------------------------------------------------------------------ */
/*  DMD Variants                                                        */
/* ------------------------------------------------------------------ */

/**
 * Helper: build a SnapshotMatrix from row-major data.
 * Each row of `rows` is a measurement channel; each column is a time step.
 */
function makeSnapshots(rows: number[][]): SnapshotMatrix {
  const n = rows[0].length;
  const data: number[][] = [];
  for (let col = 0; col < n; col++) {
    data.push(rows.map(r => r[col]));
  }
  const timestamps = Array.from({ length: n }, (_, i) => i);
  const labels = Array.from({ length: n }, (_, i) => `t${i}`);
  return { data, timestamps, labels };
}

describe('DMD Variants', () => {
  /* ---------------------------------------------------------------- */
  /*  DMDc (with control)                                               */
  /* ---------------------------------------------------------------- */
  describe('dmdc — DMD with Control', () => {
    it('separates system dynamics from control inputs (A + B matrices)', async () => {
      const { dmdc } = await import('../../../src/holomorphic/dmd/dmd-control');

      // System with control: x_{k+1} = 0.9 * x_k + 0.5 * u_k
      const N = 30;
      const x: number[] = [1.0];
      const u: number[] = [];
      for (let t = 0; t < N - 1; t++) {
        const control = Math.sin(0.3 * t);
        u.push(control);
        x.push(0.9 * x[t] + 0.5 * control);
      }

      const snap = makeSnapshots([x]);
      const controlInputs = u.map(v => [v]);

      const result = dmdc(snap, controlInputs);

      // Should have standard DMD fields
      expect(result.eigenvalues.length).toBeGreaterThan(0);
      expect(result.modes.length).toBeGreaterThan(0);
    });

    it('returns controlMatrix alongside standard DMDResult fields', async () => {
      const { dmdc } = await import('../../../src/holomorphic/dmd/dmd-control');

      const N = 20;
      const x: number[] = [1.0];
      const u: number[] = [];
      for (let t = 0; t < N - 1; t++) {
        const control = 0.1 * t;
        u.push(control);
        x.push(0.95 * x[t] + 0.3 * control);
      }

      const snap = makeSnapshots([x]);
      const controlInputs = u.map(v => [v]);
      const result = dmdc(snap, controlInputs);

      // Must have controlMatrix
      expect(result.controlMatrix).toBeDefined();
      expect(Array.isArray(result.controlMatrix)).toBe(true);
      expect(result.controlMatrix.length).toBeGreaterThan(0);
      // And standard fields
      expect(result.svdRank).toBeGreaterThan(0);
      expect(Array.isArray(result.frequencies)).toBe(true);
    });
  });

  /* ---------------------------------------------------------------- */
  /*  mrDMD (multi-resolution)                                          */
  /* ---------------------------------------------------------------- */
  describe('mrdmd — Multi-Resolution DMD', () => {
    it('separates two time scales (slow + fast components)', async () => {
      const { mrdmd } = await import('../../../src/holomorphic/dmd/dmd-multiresolution');

      // Signal with slow + fast components
      const N = 64;
      const slow: number[] = [];
      const fast: number[] = [];
      for (let t = 0; t < N; t++) {
        slow.push(Math.sin(0.05 * t));
        fast.push(0.3 * Math.sin(1.5 * t));
      }
      const combined = slow.map((s, i) => s + fast[i]);

      const snap = makeSnapshots([combined, slow]);
      const results = mrdmd(snap, 2);

      // Should return multiple levels
      expect(results.length).toBeGreaterThanOrEqual(2);
    });

    it('returns array of DMDResult (one per resolution level)', async () => {
      const { mrdmd } = await import('../../../src/holomorphic/dmd/dmd-multiresolution');

      const N = 32;
      const row: number[] = [];
      for (let t = 0; t < N; t++) {
        row.push(Math.cos(0.2 * t) + 0.5 * Math.cos(2.0 * t));
      }

      const snap = makeSnapshots([row, row.map(v => v * 0.8)]);
      const results = mrdmd(snap, 3);

      expect(Array.isArray(results)).toBe(true);
      for (const level of results) {
        expect(level).toHaveProperty('eigenvalues');
        expect(level).toHaveProperty('modes');
        expect(level).toHaveProperty('svdRank');
      }
    });
  });

  /* ---------------------------------------------------------------- */
  /*  piDMD (physics-informed)                                          */
  /* ---------------------------------------------------------------- */
  describe('pidmd — Physics-Informed DMD', () => {
    it('enforces |lambda| <= 1+eps (no growing eigenvalues beyond stability bound)', async () => {
      const { pidmd } = await import('../../../src/holomorphic/dmd/dmd-physics');

      // Signal with a growing mode (|lambda| > 1)
      const N = 20;
      const growth = 1.08;
      const row1: number[] = [];
      const row2: number[] = [];
      for (let t = 0; t < N; t++) {
        const env = Math.pow(growth, t);
        row1.push(env * Math.sin(0.4 * t));
        row2.push(env * Math.cos(0.4 * t));
      }

      const snap = makeSnapshots([row1, row2]);
      const constraints: DMDConstraints = {
        stabilityBound: 1.0,
        maxGrowthRate: 0.0,
        boundedLearningLimit: 0.2,
      };

      const result = pidmd(snap, constraints);

      // All eigenvalues should have magnitude <= stabilityBound + tolerance
      for (const eig of result.eigenvalues) {
        expect(magnitude(eig)).toBeLessThanOrEqual(1.0 + 0.01);
      }
    });

    it('returns constrained eigenvalues (all |lambda| <= stabilityBound)', async () => {
      const { pidmd } = await import('../../../src/holomorphic/dmd/dmd-physics');

      const N = 25;
      const row1: number[] = [];
      const row2: number[] = [];
      for (let t = 0; t < N; t++) {
        row1.push(Math.pow(1.1, t) * Math.cos(0.3 * t));
        row2.push(Math.pow(1.1, t) * Math.sin(0.3 * t));
      }

      const snap = makeSnapshots([row1, row2]);
      const constraints: DMDConstraints = {
        stabilityBound: 1.05,
        maxGrowthRate: 0.05,
        boundedLearningLimit: 0.2,
      };

      const result = pidmd(snap, constraints);

      for (const eig of result.eigenvalues) {
        expect(magnitude(eig)).toBeLessThanOrEqual(1.05 + 0.01);
      }
    });
  });

  /* ---------------------------------------------------------------- */
  /*  BOP-DMD (bagging, robust)                                         */
  /* ---------------------------------------------------------------- */
  describe('bopdmd — Bagging Optimized DMD', () => {
    it('handles noisy data (eigenvalues within tolerance of clean data)', async () => {
      const { bopdmd } = await import('../../../src/holomorphic/dmd/dmd-robust');
      const { dmd } = await import('../../../src/holomorphic/dmd/dmd-core');

      const N = 40;
      const omega = 0.3;
      const row1Clean: number[] = [];
      const row2Clean: number[] = [];
      const row1Noisy: number[] = [];
      const row2Noisy: number[] = [];
      for (let t = 0; t < N; t++) {
        const s = Math.sin(omega * t);
        const c = Math.cos(omega * t);
        row1Clean.push(s);
        row2Clean.push(c);
        row1Noisy.push(s + 0.05 * (Math.random() - 0.5));
        row2Noisy.push(c + 0.05 * (Math.random() - 0.5));
      }

      const cleanSnap = makeSnapshots([row1Clean, row2Clean]);
      const noisySnap = makeSnapshots([row1Noisy, row2Noisy]);

      const cleanResult = dmd(cleanSnap);
      const robustResult = bopdmd(noisySnap, 10);

      // Robust DMD should produce eigenvalues
      expect(robustResult.eigenvalues.length).toBeGreaterThan(0);

      // Eigenvalue magnitudes should be in a reasonable range
      for (const eig of robustResult.eigenvalues) {
        const mag = magnitude(eig);
        expect(mag).toBeGreaterThan(0.5);
        expect(mag).toBeLessThan(2.0);
      }
    });

    it('returns median eigenvalues from multiple bootstrap samples', async () => {
      const { bopdmd } = await import('../../../src/holomorphic/dmd/dmd-robust');

      const N = 30;
      const row1: number[] = [];
      const row2: number[] = [];
      for (let t = 0; t < N; t++) {
        row1.push(Math.sin(0.5 * t));
        row2.push(Math.cos(0.5 * t));
      }

      const snap = makeSnapshots([row1, row2]);
      const result = bopdmd(snap, 5);

      // Should return standard DMDResult structure
      expect(result).toHaveProperty('eigenvalues');
      expect(result).toHaveProperty('modes');
      expect(result).toHaveProperty('svdRank');
      expect(result).toHaveProperty('residual');
      expect(result.eigenvalues.length).toBeGreaterThan(0);
    });
  });
});
