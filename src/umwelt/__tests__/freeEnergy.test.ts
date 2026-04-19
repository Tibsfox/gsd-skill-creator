/**
 * CF-M7-03 — free-energy minimiser convergence + reference agreement.
 *
 * Reference solver: direct Bayesian posterior from priors × likelihood,
 * renormalised. We compare the variational solution's q(I) and F against
 * the reference on a 100-node (intent class) model with 20 observation
 * types and 5 observed symbols. Convergence time must be ≤50 ms.
 */

import { describe, it, expect } from 'vitest';
import {
  minimiseFreeEnergy,
  referenceFreeEnergy,
} from '../freeEnergy.js';
import { makeUniformModel } from '../generativeModel.js';
import type { GenerativeModel } from '../../types/umwelt.js';

function randomModel(
  n: number,
  m: number,
  seed: number = 1,
): GenerativeModel {
  let s = seed;
  const rand = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  const condProbTable: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row: number[] = new Array(m);
    let total = 0;
    for (let j = 0; j < m; j++) {
      const v = 0.01 + rand(); // strictly positive
      row[j] = v;
      total += v;
    }
    for (let j = 0; j < m; j++) row[j] /= total;
    condProbTable.push(row);
  }
  const priors: number[] = new Array(n);
  let pTotal = 0;
  for (let i = 0; i < n; i++) {
    const v = 0.01 + rand();
    priors[i] = v;
    pTotal += v;
  }
  for (let i = 0; i < n; i++) priors[i] /= pTotal;
  return {
    intentClasses: Array.from({ length: n }, (_, i) => `c${i}`),
    condProbTable,
    priors,
  };
}

describe('CF-M7-03 — variational minimiser matches reference', () => {
  it('agrees with brute-force posterior to within 1e-4 L1 on a 100-node model', () => {
    const model = randomModel(100, 20, 7);
    const observations = [0, 5, 13, 8, 19];
    const vmp = minimiseFreeEnergy(model, observations);
    const ref = referenceFreeEnergy(model, observations);

    let l1 = 0;
    for (let i = 0; i < vmp.q.length; i++) l1 += Math.abs(vmp.q[i] - ref.q[i]);
    expect(l1).toBeLessThan(1e-4);
    expect(Math.abs(vmp.F - ref.F)).toBeLessThan(1e-4);
  });

  it('converges within 50 ms on a 100-node model', () => {
    const model = randomModel(100, 20, 13);
    const observations = [1, 2, 3, 4, 5];
    const t0 = performance.now();
    const result = minimiseFreeEnergy(model, observations);
    const elapsed = performance.now() - t0;
    expect(result.converged).toBe(true);
    expect(elapsed).toBeLessThan(50);
  });

  it('decomposes F into epistemic + pragmatic that sum to F', () => {
    const model = randomModel(50, 10, 3);
    const r = minimiseFreeEnergy(model, [0, 1, 2]);
    expect(r.epistemic + r.pragmatic).toBeCloseTo(r.F, 9);
  });

  it('handles empty observations by returning the prior', () => {
    const model = randomModel(20, 5, 21);
    const r = minimiseFreeEnergy(model, []);
    for (let i = 0; i < 20; i++) {
      expect(r.q[i]).toBeCloseTo(model.priors[i], 6);
    }
  });

  it('handles a zero-class model without NaN', () => {
    const model = makeUniformModel([], []);
    const r = minimiseFreeEnergy(model, []);
    expect(r.q).toEqual([]);
    expect(r.F).toBe(0);
    expect(r.converged).toBe(true);
  });

  it('is deterministic — same inputs, same output', () => {
    const model = randomModel(30, 6, 42);
    const a = minimiseFreeEnergy(model, [0, 1, 2, 3]);
    const b = minimiseFreeEnergy(model, [0, 1, 2, 3]);
    expect(a.q).toEqual(b.q);
    expect(a.F).toBe(b.F);
  });
});
