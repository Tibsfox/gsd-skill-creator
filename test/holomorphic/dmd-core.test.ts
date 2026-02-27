import { describe, it, expect } from 'vitest';
import { dmd, classifyDMDEigenvalue, reconstructFromDMD, svd } from '../../src/holomorphic/dmd/dmd-core';
import { magnitude } from '../../src/holomorphic/complex/arithmetic';
import type { SnapshotMatrix } from '../../src/holomorphic/dmd/types';

/* ------------------------------------------------------------------ */
/*  DMD Core Algorithm                                                  */
/* ------------------------------------------------------------------ */

describe('DMD Core Algorithm', () => {
  /**
   * Helper: build a SnapshotMatrix from a time series of column vectors.
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

  describe('dmd() eigenvalue recovery', () => {
    it('recovers eigenvalues of two pure sinusoids (|lambda| approx 1)', () => {
      // Two sinusoidal signals: sin(0.3t) and cos(0.3t)
      const N = 50;
      const omega = 0.3;
      const row1: number[] = [];
      const row2: number[] = [];
      for (let t = 0; t < N; t++) {
        row1.push(Math.sin(omega * t));
        row2.push(Math.cos(omega * t));
      }
      const snap = makeSnapshots([row1, row2]);
      const result = dmd(snap);

      // All eigenvalues should have magnitude near 1
      for (const eig of result.eigenvalues) {
        expect(magnitude(eig)).toBeCloseTo(1.0, 1);
      }
    });

    it('dmd of decaying oscillation yields |lambda| < 1', () => {
      const N = 40;
      const decay = 0.95;
      const omega = 0.5;
      const row1: number[] = [];
      const row2: number[] = [];
      for (let t = 0; t < N; t++) {
        const envelope = Math.pow(decay, t);
        row1.push(envelope * Math.sin(omega * t));
        row2.push(envelope * Math.cos(omega * t));
      }
      const snap = makeSnapshots([row1, row2]);
      const result = dmd(snap);

      // At least one eigenvalue should have |lambda| < 1
      const hasDecaying = result.eigenvalues.some(e => magnitude(e) < 0.999);
      expect(hasDecaying).toBe(true);
    });

    it('dmd of growing oscillation yields |lambda| > 1', () => {
      const N = 20;
      const growth = 1.05;
      const omega = 0.4;
      const row1: number[] = [];
      const row2: number[] = [];
      for (let t = 0; t < N; t++) {
        const envelope = Math.pow(growth, t);
        row1.push(envelope * Math.sin(omega * t));
        row2.push(envelope * Math.cos(omega * t));
      }
      const snap = makeSnapshots([row1, row2]);
      const result = dmd(snap);

      // At least one eigenvalue should have |lambda| > 1
      const hasGrowing = result.eigenvalues.some(e => magnitude(e) > 1.001);
      expect(hasGrowing).toBe(true);
    });
  });

  describe('SVD', () => {
    it('rank selection matches system dimension', () => {
      // A rank-2 matrix
      const matrix = [
        [1, 0],
        [0, 1],
        [1, 1],
      ];
      const result = svd(matrix);
      const nonzero = result.S.filter(s => s > 1e-10);
      expect(nonzero.length).toBe(2);
    });
  });

  describe('DMD reconstruction', () => {
    it('reconstruction error below threshold', () => {
      const N = 30;
      const omega = 0.2;
      const row1: number[] = [];
      const row2: number[] = [];
      for (let t = 0; t < N; t++) {
        row1.push(Math.sin(omega * t));
        row2.push(Math.cos(omega * t));
      }
      const snap = makeSnapshots([row1, row2]);
      const result = dmd(snap);

      // Residual should be small for a clean sinusoidal signal
      expect(result.residual).toBeLessThan(1.0);
    });
  });

  describe('classifyDMDEigenvalue', () => {
    it('maps |lambda| < 1 with small angle to attracting', () => {
      const result = classifyDMDEigenvalue({ re: 0.8, im: 0.0 });
      expect(result).toBe('attracting');
    });

    it('maps |lambda| > 1 with small angle to repelling', () => {
      const result = classifyDMDEigenvalue({ re: 1.2, im: 0.0 });
      expect(result).toBe('repelling');
    });

    it('maps |lambda| approx 1 with small angle to neutral', () => {
      const result = classifyDMDEigenvalue({ re: 1.0, im: 0.0 });
      expect(result).toBe('neutral');
    });

    it('maps |lambda| < 1 with significant angle to oscillating_decay', () => {
      const result = classifyDMDEigenvalue({ re: 0.5, im: 0.5 });
      expect(result).toBe('oscillating_decay');
    });

    it('maps |lambda| > 1 with significant angle to oscillating_growth', () => {
      const result = classifyDMDEigenvalue({ re: 0.8, im: 0.8 });
      expect(result).toBe('oscillating_growth');
    });
  });
});
