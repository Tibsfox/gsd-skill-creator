import { describe, it, expect } from 'vitest';
import type {
  SnapshotMatrix,
  DMDResult,
  DMDEigenvalueClassification,
  DMDConstraints,
  KoopmanObservable,
} from '../../../src/holomorphic/dmd/types';

/* ------------------------------------------------------------------ */
/*  DMD and Koopman — Shared Types                                      */
/* ------------------------------------------------------------------ */

describe('DMD & Koopman — Shared Types', () => {
  it('SnapshotMatrix has data, timestamps, and labels', () => {
    const snap: SnapshotMatrix = {
      data: [[1, 2], [3, 4], [5, 6]],
      timestamps: [0, 0.1, 0.2],
      labels: ['x1', 'x2', 'x3'],
    };
    expect(snap.data).toHaveLength(3);
    expect(snap.data[0]).toEqual([1, 2]);
    expect(snap.timestamps).toEqual([0, 0.1, 0.2]);
    expect(snap.labels).toEqual(['x1', 'x2', 'x3']);
  });

  it('DMDResult has modes, eigenvalues, amplitudes, frequencies, growthRates, svdRank, residual', () => {
    const result: DMDResult = {
      modes: [[{ re: 1, im: 0 }, { re: 0, im: 1 }]],
      eigenvalues: [{ re: 0.9, im: 0.1 }],
      amplitudes: [{ re: 1.5, im: -0.3 }],
      frequencies: [0.1],
      growthRates: [-0.05],
      svdRank: 2,
      residual: 0.01,
    };
    expect(result.modes).toHaveLength(1);
    expect(result.modes[0]).toHaveLength(2);
    expect(result.eigenvalues[0].re).toBe(0.9);
    expect(result.amplitudes[0].im).toBe(-0.3);
    expect(result.frequencies).toEqual([0.1]);
    expect(result.growthRates).toEqual([-0.05]);
    expect(result.svdRank).toBe(2);
    expect(result.residual).toBe(0.01);
  });

  it('DMDEigenvalueClassification covers all 5 types', () => {
    const types: DMDEigenvalueClassification[] = [
      'attracting',
      'repelling',
      'neutral',
      'oscillating_decay',
      'oscillating_growth',
    ];
    expect(types).toHaveLength(5);
    expect(types).toContain('attracting');
    expect(types).toContain('repelling');
    expect(types).toContain('neutral');
    expect(types).toContain('oscillating_decay');
    expect(types).toContain('oscillating_growth');
  });

  it('DMDConstraints has stabilityBound, maxGrowthRate, boundedLearningLimit', () => {
    const constraints: DMDConstraints = {
      stabilityBound: 1.05,
      maxGrowthRate: 0.1,
      boundedLearningLimit: 0.20,
    };
    expect(constraints.stabilityBound).toBe(1.05);
    expect(constraints.maxGrowthRate).toBe(0.1);
    expect(constraints.boundedLearningLimit).toBe(0.20);
  });

  it('KoopmanObservable has name, evaluate, and type', () => {
    const obs: KoopmanObservable = {
      name: 'quadratic',
      evaluate: (x: number[]) => x[0] * x[0],
      type: 'polynomial',
    };
    expect(obs.name).toBe('quadratic');
    expect(obs.evaluate([3])).toBe(9);
    expect(obs.type).toBe('polynomial');
  });

  it('KoopmanObservable type covers all 4 variants', () => {
    const types: KoopmanObservable['type'][] = [
      'polynomial',
      'radial_basis',
      'fourier',
      'custom',
    ];
    expect(types).toHaveLength(4);
  });

  it('DMDResult modes are arrays of ComplexNumber vectors', () => {
    const result: DMDResult = {
      modes: [
        [{ re: 1, im: 0 }, { re: 0, im: 0 }],
        [{ re: 0, im: 0 }, { re: 1, im: 0 }],
      ],
      eigenvalues: [{ re: 1, im: 0 }, { re: -1, im: 0 }],
      amplitudes: [{ re: 1, im: 0 }, { re: 0.5, im: 0 }],
      frequencies: [0, Math.PI],
      growthRates: [0, 0],
      svdRank: 2,
      residual: 0.001,
    };
    expect(result.modes).toHaveLength(2);
    expect(result.eigenvalues).toHaveLength(2);
    expect(result.amplitudes).toHaveLength(2);
    expect(result.frequencies).toHaveLength(2);
    expect(result.growthRates).toHaveLength(2);
  });

  it('SnapshotMatrix data columns represent snapshots', () => {
    const snap: SnapshotMatrix = {
      data: [[1, 4], [2, 5], [3, 6]],
      timestamps: [0, 0.5, 1.0],
      labels: ['snapshot_0', 'snapshot_1', 'snapshot_2'],
    };
    // Each inner array is a snapshot (column of measurements)
    expect(snap.data[0]).toEqual([1, 4]);
    expect(snap.timestamps).toHaveLength(snap.data.length);
    expect(snap.labels).toHaveLength(snap.data.length);
  });
});
