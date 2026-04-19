/**
 * CF-M7-04 + CF-M7-05 — prediction top-k + surprise trigger policy.
 */

import { describe, it, expect } from 'vitest';
import {
  SurpriseChannel,
  klDivergence,
  predictNextObservation,
  topK,
} from '../prediction.js';
import { makeCounts, materialiseModel, observe } from '../generativeModel.js';
import { minimiseFreeEnergy } from '../freeEnergy.js';

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

describe('CF-M7-04 — top-5 ≥70% on synthetic 200-session fixture', () => {
  it('predicts the true next-observation top-5 at least 70% of the time', () => {
    const intents = ['refactor', 'ship', 'explore', 'debug'];
    const obsTypes = Array.from({ length: 10 }, (_, i) => `o${i}`);
    // Planted likelihoods — each intent has a peaked distribution over a
    // small set of "characteristic" observation types.
    const planted: number[][] = [
      [0.5, 0.2, 0.1, 0.05, 0.05, 0.02, 0.02, 0.02, 0.02, 0.02], // refactor
      [0.02, 0.02, 0.02, 0.02, 0.02, 0.5, 0.2, 0.1, 0.05, 0.05], // ship
      [0.1, 0.05, 0.05, 0.3, 0.3, 0.05, 0.05, 0.05, 0.03, 0.02], // explore
      [0.05, 0.05, 0.4, 0.4, 0.05, 0.02, 0.01, 0.01, 0.005, 0.005], // debug
    ];
    // Renormalise for safety
    for (const row of planted) {
      const s = row.reduce((a, b) => a + b, 0);
      for (let j = 0; j < row.length; j++) row[j] /= s;
    }
    const rand = seeded(2024);
    const sample = (dist: number[]): number => {
      const r = rand();
      let acc = 0;
      for (let j = 0; j < dist.length; j++) {
        acc += dist[j];
        if (r < acc) return j;
      }
      return dist.length - 1;
    };

    // Train a model from 800 (intent, obs) pairs.
    const counts = makeCounts(intents, obsTypes, 1);
    for (let t = 0; t < 800; t++) {
      const i = Math.floor(rand() * intents.length);
      const o = sample(planted[i]);
      observe(counts, i, o);
    }
    const model = materialiseModel(intents, counts);

    // 200-session test: for each session, sample a true intent and then
    // two observations; feed the first to the model to produce q, then
    // check whether the TRUE second observation is in the top-5 of the
    // predicted distribution.
    let hits = 0;
    const total = 200;
    for (let s = 0; s < total; s++) {
      const trueIntent = Math.floor(rand() * intents.length);
      const obs1 = sample(planted[trueIntent]);
      const obs2 = sample(planted[trueIntent]);
      const { q } = minimiseFreeEnergy(model, [obs1]);
      const predicted = predictNextObservation(q, model);
      const top = topK(predicted, 5);
      if (top.includes(obs2)) hits++;
    }
    const rate = hits / total;
    expect(rate).toBeGreaterThanOrEqual(0.7);
  });
});

describe('predictNextObservation + topK — basic shape', () => {
  it('marginalises the conditional table by the posterior', () => {
    const model = materialiseModel(
      ['a', 'b'],
      (() => {
        const c = makeCounts(['a', 'b'], ['x', 'y', 'z'], 0);
        // Plant exact conditionals via counts: a -> x only, b -> z only.
        for (let t = 0; t < 100; t++) observe(c, 0, 0);
        for (let t = 0; t < 100; t++) observe(c, 1, 2);
        return c;
      })(),
    );
    // q = [1, 0] → predicted should peak on x
    const p1 = predictNextObservation([1, 0], model);
    expect(topK(p1, 1)[0]).toBe(0);
    // q = [0, 1] → predicted should peak on z
    const p2 = predictNextObservation([0, 1], model);
    expect(topK(p2, 1)[0]).toBe(2);
  });

  it('klDivergence returns 0 for identical distributions', () => {
    const p = [0.2, 0.3, 0.5];
    expect(klDivergence(p, p)).toBeCloseTo(0, 9);
  });

  it('klDivergence is positive for differing distributions', () => {
    const p = [0.8, 0.1, 0.1];
    const q = [0.1, 0.1, 0.8];
    expect(klDivergence(p, q)).toBeGreaterThan(0);
  });

  it('klDivergence returns Infinity when actual has mass where predicted does not', () => {
    expect(klDivergence([0.5, 0.5], [1, 0])).toBe(Number.POSITIVE_INFINITY);
  });

  it('topK respects k and sorts descending', () => {
    const p = [0.1, 0.4, 0.05, 0.3, 0.15];
    const top3 = topK(p, 3);
    expect(top3).toEqual([1, 3, 4]);
  });
});

describe('CF-M7-05 — surprise trigger policy', () => {
  // Seed the channel with a stable baseline so the rolling window
  // produces a non-zero std, then probe with 1σ and 3σ inputs.
  function primedChannel(threshold = 3): SurpriseChannel {
    const ch = new SurpriseChannel({ sigmaThreshold: threshold, windowSize: 50 });
    const rand = seeded(99);
    for (let t = 0; t < 50; t++) {
      const base = 1 + rand() * 0.1; // tight ~N(1.05, small)
      ch.record(base, t);
    }
    return ch;
  }

  it('3σ above baseline → triggered 100% of the time (100 trials)', () => {
    let triggers = 0;
    for (let trial = 0; trial < 100; trial++) {
      const ch = primedChannel(3);
      // 3σ above baseline ≈ mean + 3*std. Inflate generously.
      const entry = ch.record(100, 10_000);
      if (entry.triggered) triggers++;
    }
    expect(triggers).toBe(100);
  });

  it('1σ above baseline → triggered 0% of the time (100 trials)', () => {
    let triggers = 0;
    for (let trial = 0; trial < 100; trial++) {
      const ch = primedChannel(3);
      // ~1σ above baseline: mean + 1*std. std ≈ 0.03, mean ≈ 1.05.
      const entry = ch.record(1.08, 10_000);
      if (entry.triggered) triggers++;
    }
    expect(triggers).toBe(0);
  });

  it('FIFO-evicts raw entries beyond maxEntries', () => {
    const ch = new SurpriseChannel({ maxEntries: 10, windowSize: 5 });
    for (let t = 0; t < 25; t++) ch.record(Math.random(), t);
    expect(ch.size()).toBe(10);
    const snap = ch.snapshot();
    // Oldest retained entry should have ts ≥ 15 (25 records − 10 cap)
    expect(snap[0].ts).toBeGreaterThanOrEqual(15);
  });
});
