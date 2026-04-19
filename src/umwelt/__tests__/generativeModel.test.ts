/**
 * CF-M7-02 + CF-M7-08 — generative model shape + online adaptation.
 */

import { describe, it, expect } from 'vitest';
import {
  UniformInitialiser,
  makeCounts,
  makeUniformModel,
  materialiseModel,
  observe,
  validateModel,
} from '../generativeModel.js';

describe('CF-M7-02 — generative model initialisation', () => {
  it('UniformInitialiser produces correct shape with uniform rows/priors', () => {
    const init = new UniformInitialiser();
    const intentClasses = ['refactor', 'ship', 'explore', 'debug'];
    const observationTypes = ['read', 'write', 'exec', 'correct', 'commit'];
    const model = init.init(intentClasses, observationTypes);

    expect(model.intentClasses).toEqual(intentClasses);
    expect(model.condProbTable).toHaveLength(4);
    for (const row of model.condProbTable) {
      expect(row).toHaveLength(5);
      const s = row.reduce((a, b) => a + b, 0);
      expect(s).toBeCloseTo(1, 9);
      for (const v of row) expect(v).toBeCloseTo(0.2, 9);
    }
    expect(model.priors).toHaveLength(4);
    for (const p of model.priors) expect(p).toBeCloseTo(0.25, 9);
  });

  it('validateModel accepts a well-formed uniform model', () => {
    const model = makeUniformModel(['a', 'b'], ['x', 'y', 'z']);
    expect(() => validateModel(model)).not.toThrow();
  });

  it('validateModel rejects a row that does not sum to 1', () => {
    const model = makeUniformModel(['a', 'b'], ['x', 'y']);
    model.condProbTable[0][0] = 0.9; // row now sums to 1.4
    expect(() => validateModel(model)).toThrow(/row 0 sums/);
  });

  it('validateModel rejects negative / non-finite probabilities', () => {
    const model = makeUniformModel(['a'], ['x', 'y']);
    model.condProbTable[0][0] = -0.1;
    model.condProbTable[0][1] = 1.1;
    expect(() => validateModel(model)).toThrow(/non-negative/);

    const model2 = makeUniformModel(['a'], ['x', 'y']);
    model2.condProbTable[0][0] = Number.NaN;
    expect(() => validateModel(model2)).toThrow();
  });

  it('validateModel rejects priors that do not sum to 1', () => {
    const model = makeUniformModel(['a', 'b'], ['x']);
    model.priors[0] = 0.9;
    model.priors[1] = 0.9;
    expect(() => validateModel(model)).toThrow(/priors sum to/);
  });
});

describe('CF-M7-08 — online model adaptation recovers planted distribution', () => {
  it('converges to within L1 < 0.1 of the planted conditional after 1000 steps', () => {
    // Planted generative process:
    //   2 intent classes, 3 observation types.
    //   intent 0 emits obs with p = [0.7, 0.2, 0.1]
    //   intent 1 emits obs with p = [0.1, 0.3, 0.6]
    //   uniform prior over intents.
    const intentClasses = ['i0', 'i1'];
    const observationTypes = ['o0', 'o1', 'o2'];
    const planted = [
      [0.7, 0.2, 0.1],
      [0.1, 0.3, 0.6],
    ];
    const priorPlanted = [0.5, 0.5];

    // Deterministic PRNG (LCG) for reproducibility.
    let seed = 0x12345678;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    const sample = (dist: number[]): number => {
      const r = rand();
      let acc = 0;
      for (let j = 0; j < dist.length; j++) {
        acc += dist[j];
        if (r < acc) return j;
      }
      return dist.length - 1;
    };

    const counts = makeCounts(intentClasses, observationTypes, 1);
    for (let t = 0; t < 1000; t++) {
      const intent = sample(priorPlanted);
      const obs = sample(planted[intent]);
      observe(counts, intent, obs);
    }
    const learned = materialiseModel(intentClasses, counts);
    validateModel(learned);

    // L1 distance row-by-row
    for (let i = 0; i < 2; i++) {
      let l1 = 0;
      for (let j = 0; j < 3; j++) {
        l1 += Math.abs(learned.condProbTable[i][j] - planted[i][j]);
      }
      expect(l1).toBeLessThan(0.1);
    }
    // Priors too
    let priorL1 = 0;
    for (let i = 0; i < 2; i++) priorL1 += Math.abs(learned.priors[i] - 0.5);
    expect(priorL1).toBeLessThan(0.1);
  });

  it('observe() throws on out-of-range indices', () => {
    const counts = makeCounts(['a', 'b'], ['x', 'y']);
    expect(() => observe(counts, -1, 0)).toThrow(RangeError);
    expect(() => observe(counts, 2, 0)).toThrow(RangeError);
    expect(() => observe(counts, 0, -1)).toThrow(RangeError);
    expect(() => observe(counts, 0, 2)).toThrow(RangeError);
  });

  it('Laplace smoothing keeps every probability strictly positive', () => {
    const counts = makeCounts(['a'], ['x', 'y', 'z'], 1);
    // Only observe (0, 0) ten times — no (0, 1) or (0, 2) evidence.
    for (let t = 0; t < 10; t++) observe(counts, 0, 0);
    const model = materialiseModel(['a'], counts);
    for (const p of model.condProbTable[0]) {
      expect(p).toBeGreaterThan(0);
    }
    expect(model.condProbTable[0][0]).toBeGreaterThan(model.condProbTable[0][1]);
  });
});
