/**
 * v1.49.580 W0 — type-shape smoke test for src/bayes-ab/mv-types.ts.
 *
 * Pure type-only module. We verify the public surface exists and has the
 * expected shape via a structural sanity check: importing the types via
 * the barrel and instantiating canonical values.
 */

import { describe, it, expect } from 'vitest';
import type {
  DirichletPrior,
  MultinomialOutcome,
  MvExperimentDesign,
} from '../index.js';

describe('src/bayes-ab/mv-types — public surface', () => {
  it('type shapes accept canonical instances', () => {
    const prior: DirichletPrior = { alphas: [1, 1, 1] };
    expect(prior.alphas).toEqual([1, 1, 1]);

    const outcome: MultinomialOutcome = { counts: [3, 5, 2] };
    expect(outcome.counts.reduce((a, b) => a + b, 0)).toBe(10);

    const design: MvExperimentDesign<{ n: number }> = {
      label: 'n=20',
      payload: { n: 20 },
    };
    expect(design.payload.n).toBe(20);
    expect(design.label).toBe('n=20');
  });

  it('DirichletPrior length and MultinomialOutcome length must match in callers (documentation-only invariant)', () => {
    // No runtime check here — that invariant is enforced inside posteriorDirichlet (W1).
    // This test exists to record the contract: alphas.length === counts.length === K.
    const K = 3;
    const prior: DirichletPrior = { alphas: Array(K).fill(1) };
    const outcome: MultinomialOutcome = { counts: Array(K).fill(0) };
    expect(prior.alphas.length).toBe(K);
    expect(outcome.counts.length).toBe(K);
    expect(prior.alphas.length).toBe(outcome.counts.length);
  });
});
