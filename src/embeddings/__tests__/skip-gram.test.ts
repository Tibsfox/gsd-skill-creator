/**
 * Skip-gram unit tests — gradient correctness + SGD monotone loss decrease.
 *
 * Gradient check: for a single (center, context) positive pair with one
 * negative sample, the analytic gradients computed inside `trainStep` must
 * match a hand-derived expression on a small fixture.
 *
 * @module embeddings/__tests__/skip-gram.test
 */

import { describe, it, expect } from 'vitest';
import {
  createSkipGramModel,
  evalLoss,
  sigmoid,
  dotRows,
  trainStep,
  getInputRow,
  type SkipGramModel,
} from '../skip-gram.js';
import { mulberry32 } from '../trainer.js';

function deterministicModel(vocabSize: number, dim: number, seed = 7): SkipGramModel {
  return createSkipGramModel(vocabSize, dim, mulberry32(seed));
}

describe('skip-gram sigmoid + dot helpers', () => {
  it('sigmoid is bounded [0, 1]', () => {
    for (const x of [-100, -5, -1, 0, 1, 5, 100]) {
      const y = sigmoid(x);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(1);
    }
    expect(sigmoid(0)).toBeCloseTo(0.5, 10);
  });

  it('sigmoid clamps at ±30 without NaN', () => {
    expect(Number.isFinite(sigmoid(1000))).toBe(true);
    expect(Number.isFinite(sigmoid(-1000))).toBe(true);
    expect(sigmoid(1000)).toBe(1);
    expect(sigmoid(-1000)).toBe(0);
  });

  it('dotRows reads the right rows', () => {
    const a = new Float64Array([1, 2, 3, 4]); // 2×2
    const b = new Float64Array([10, 20, 30, 40]); // 2×2
    expect(dotRows(a, 0, b, 0, 2)).toBe(1 * 10 + 2 * 20);
    expect(dotRows(a, 1, b, 1, 2)).toBe(3 * 30 + 4 * 40);
    expect(dotRows(a, 0, b, 1, 2)).toBe(1 * 30 + 2 * 40);
  });
});

describe('createSkipGramModel', () => {
  it('has the correct shape', () => {
    const m = deterministicModel(10, 8);
    expect(m.vocabSize).toBe(10);
    expect(m.dim).toBe(8);
    expect(m.inputEmbeddings.length).toBe(80);
    expect(m.outputEmbeddings.length).toBe(80);
  });

  it('input embeddings are within the expected init band', () => {
    const dim = 16;
    const m = deterministicModel(50, dim);
    const band = 0.5 / dim;
    for (let i = 0; i < m.inputEmbeddings.length; i++) {
      expect(Math.abs(m.inputEmbeddings[i])).toBeLessThanOrEqual(band + 1e-12);
    }
  });

  it('output embeddings init to zero', () => {
    const m = deterministicModel(20, 4);
    for (let i = 0; i < m.outputEmbeddings.length; i++) {
      expect(m.outputEmbeddings[i]).toBe(0);
    }
  });

  it('is deterministic given the same seed', () => {
    const a = deterministicModel(10, 4, 123);
    const b = deterministicModel(10, 4, 123);
    expect(Array.from(a.inputEmbeddings)).toEqual(Array.from(b.inputEmbeddings));
  });

  it('throws for non-positive shape', () => {
    expect(() => createSkipGramModel(0, 4, mulberry32(1))).toThrow();
    expect(() => createSkipGramModel(4, 0, mulberry32(1))).toThrow();
  });
});

describe('trainStep — gradient correctness (hand-computed)', () => {
  it('matches hand-derived SGNS update on a single positive pair with no negatives', () => {
    // 2 vocab, dim=2. Hand-construct weights:
    //   v_in(0)  = [1, 0]
    //   v_out(1) = [0.5, 0]
    //   posScore = 0.5 ; σ(0.5) = s
    //   grad_out(1) = (s-1) * v_in(0) = [(s-1), 0]
    //   grad_in(0)  = (s-1) * v_out(1) = [0.5(s-1), 0]
    //   After lr=0.1 update:
    //     v_in(0)  = [1 - 0.1*0.5*(s-1), 0]
    //     v_out(1) = [0.5 - 0.1*(s-1), 0]
    const model: SkipGramModel = {
      vocabSize: 2,
      dim: 2,
      inputEmbeddings: new Float64Array([1, 0, 0, 0]),
      outputEmbeddings: new Float64Array([0, 0, 0.5, 0]),
    };
    const s = sigmoid(0.5);
    const lr = 0.1;
    trainStep(model, 0, 1, [], lr);

    expect(model.inputEmbeddings[0]).toBeCloseTo(1 - lr * 0.5 * (s - 1), 12);
    expect(model.inputEmbeddings[1]).toBe(0);
    expect(model.outputEmbeddings[2]).toBeCloseTo(0.5 - lr * (s - 1), 12);
    expect(model.outputEmbeddings[3]).toBe(0);
  });

  it('matches hand-derived update with one negative sample', () => {
    // 3 vocab, dim=1.
    //   v_in(0)  = [a]
    //   v_out(1) = [b]  (positive)
    //   v_out(2) = [c]  (negative)
    //   posSig = σ(ab);  negSig = σ(ac)
    //   grad_out(1) = (posSig-1)*a
    //   grad_out(2) = negSig*a
    //   grad_in(0)  = (posSig-1)*b + negSig*c
    const a = 0.8,
      b = 0.5,
      c = -0.3;
    const model: SkipGramModel = {
      vocabSize: 3,
      dim: 1,
      inputEmbeddings: new Float64Array([a, 0, 0]),
      outputEmbeddings: new Float64Array([0, b, c]),
    };
    const lr = 0.2;
    const posSig = sigmoid(a * b);
    const negSig = sigmoid(a * c);
    trainStep(model, 0, 1, [2], lr);

    expect(model.inputEmbeddings[0]).toBeCloseTo(
      a - lr * ((posSig - 1) * b + negSig * c),
      12,
    );
    expect(model.outputEmbeddings[1]).toBeCloseTo(b - lr * (posSig - 1) * a, 12);
    expect(model.outputEmbeddings[2]).toBeCloseTo(c - lr * negSig * a, 12);
  });

  it('returns loss equal to evalLoss of pre-update state', () => {
    const m = deterministicModel(5, 4, 99);
    // Perturb to ensure non-zero pre-update loss.
    for (let i = 0; i < m.outputEmbeddings.length; i++) {
      m.outputEmbeddings[i] = 0.01 * i;
    }
    const preLoss = evalLoss(m, 0, 1, [2, 3]);
    const returned = trainStep(m, 0, 1, [2, 3], 0.05);
    expect(returned).toBeCloseTo(preLoss, 10);
  });

  it('rejects out-of-range ids', () => {
    const m = deterministicModel(3, 2);
    expect(() => trainStep(m, -1, 0, [], 0.1)).toThrow();
    expect(() => trainStep(m, 0, 99, [], 0.1)).toThrow();
    expect(() => trainStep(m, 0, 1, [99], 0.1)).toThrow();
  });
});

describe('trainStep — SGD monotone loss decrease', () => {
  it('repeated SGD steps on a single pair drive loss down on the trend', () => {
    const m = deterministicModel(6, 4, 11);
    const losses: number[] = [];
    for (let i = 0; i < 200; i++) {
      const l = trainStep(m, 0, 1, [2, 3], 0.1);
      losses.push(l);
    }
    // Loss need not be STRICTLY monotone at every step for a generic
    // multi-negative setting, but: (a) the final loss must be strictly
    // below the initial loss, and (b) the moving average over the tail
    // must be below the moving average over the head.
    expect(losses[losses.length - 1]).toBeLessThan(losses[0]);
    const headAvg = losses.slice(0, 20).reduce((a, b) => a + b, 0) / 20;
    const tailAvg = losses.slice(-20).reduce((a, b) => a + b, 0) / 20;
    expect(tailAvg).toBeLessThan(headAvg);
  });

  it('converges toward the SGNS optimum on a positive-only two-word fixture', () => {
    // With no negatives, optimal is v_in(0) · v_out(1) → +∞ (σ → 1).
    // Loss should approach 0.
    const m = deterministicModel(2, 3, 13);
    let last = Infinity;
    for (let i = 0; i < 200; i++) {
      last = trainStep(m, 0, 1, [], 0.5);
    }
    expect(last).toBeLessThan(0.05);
  });
});

describe('getInputRow', () => {
  it('returns a copy (mutation does not affect the matrix)', () => {
    const m = deterministicModel(4, 3, 1);
    const row = getInputRow(m, 1);
    row[0] = 99;
    expect(m.inputEmbeddings[3]).not.toBe(99);
  });

  it('rejects out-of-range ids', () => {
    const m = deterministicModel(4, 3, 1);
    expect(() => getInputRow(m, -1)).toThrow();
    expect(() => getInputRow(m, 4)).toThrow();
  });
});
