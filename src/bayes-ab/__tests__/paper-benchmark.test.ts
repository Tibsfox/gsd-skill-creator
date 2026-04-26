/**
 * v1.49.579 W5 — paper-benchmark reproduction.
 *
 * Reproduces the qualitative IPM-BOED behaviour from arXiv:2604.21849 on a
 * parameter-recovery toy:
 *
 *   - latent: θ ~ Beta(2, 2) (peaked at 0.5)
 *   - designs: per-round sample-size choices [10, 50, 200]
 *   - model:   y_i | d, θ ~ Bernoulli(θ), repeated d.payload.n times
 *
 * Expected behaviour (IPM-BOED §3): more samples per round ⇒ tighter
 * posterior ⇒ larger expected W1 shift ⇒ higher score. Bigger sample sizes
 * should win the design-selection contest.
 */

import { describe, it, expect } from 'vitest';
import { selectIpmBoedDesign, mulberry32 } from '../ipm-boed.js';
import type { ExperimentDesign } from '../index.js';

interface SizedDesign {
  n: number;
}

function sizedDesigns(): ExperimentDesign<SizedDesign>[] {
  return [
    { label: 'n=10', payload: { n: 10 } },
    { label: 'n=50', payload: { n: 50 } },
    { label: 'n=200', payload: { n: 200 } },
  ];
}

/** Faithful Bernoulli(θ) model — d.payload.n trials. */
function bernoulliModel(d: ExperimentDesign<SizedDesign>, theta: number): number[] {
  const rng = mulberry32(Math.floor(theta * 1e6) + d.payload.n);
  return Array.from({ length: d.payload.n }, () => (rng.next() < theta ? 1 : 0));
}

describe('IPM-BOED paper benchmark — parameter recovery with sample-size designs', () => {
  it('selectIpmBoedDesign picks n=200 for ≥4 of 5 seeds', () => {
    const designs = sizedDesigns();
    const seeds = [101, 202, 303, 404, 505];
    let largestWins = 0;
    for (const seed of seeds) {
      const r = selectIpmBoedDesign({
        prior: { alpha: 2, beta: 2 },
        designs,
        modelSamples: bernoulliModel,
        draws: { theta: 16, post: 32, prior: 32 },
        rng: mulberry32(seed),
      });
      if (r.design.label === 'n=200') largestWins++;
    }
    expect(largestWins).toBeGreaterThanOrEqual(4);
  });

  it('per-design scores grow monotonically with sample size', () => {
    const designs = sizedDesigns();
    // Average across multiple seeds to smooth Monte-Carlo noise.
    const seeds = [11, 22, 33, 44, 55, 66, 77, 88];
    const totals: Record<string, number> = { 'n=10': 0, 'n=50': 0, 'n=200': 0 };
    for (const seed of seeds) {
      const r = selectIpmBoedDesign({
        prior: { alpha: 2, beta: 2 },
        designs,
        modelSamples: bernoulliModel,
        draws: { theta: 16, post: 32, prior: 32 },
        rng: mulberry32(seed),
      });
      for (const p of r.perDesign) totals[p.label] += p.score;
    }
    const avg10 = totals['n=10'] / seeds.length;
    const avg50 = totals['n=50'] / seeds.length;
    const avg200 = totals['n=200'] / seeds.length;
    expect(avg10).toBeLessThan(avg50);
    expect(avg50).toBeLessThan(avg200);
  });

  it('information growth is non-trivial: avg score(n=200) ≥ 1.25 × avg score(n=10)', () => {
    // The paper's qualitative result is that larger designs produce
    // meaningfully larger W1 shifts — not flat. Ratio gate guards against
    // a degenerate "all designs score the same" failure mode.
    //
    // Why 1.25, not larger: for a Beta(2,2) prior with θ samples
    // clustering around 0.5, most W1 difference comes from posterior
    // variance shrinkage which scales as ~1/√n. Going n=10 → n=200 gives
    // ~4.5× in variance reduction but the prior is itself diffuse so the
    // relative W1 effect is dampened. Empirically observed ratio across
    // 10 seeds: ~1.36×. The 1.25 floor leaves margin while still asserting
    // a meaningful (≥25%) information advantage.
    const designs = sizedDesigns();
    const seeds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    let total10 = 0;
    let total200 = 0;
    for (const seed of seeds) {
      const r = selectIpmBoedDesign({
        prior: { alpha: 2, beta: 2 },
        designs,
        modelSamples: bernoulliModel,
        draws: { theta: 16, post: 32, prior: 32 },
        rng: mulberry32(seed),
      });
      total10 += r.perDesign.find(p => p.label === 'n=10')!.score;
      total200 += r.perDesign.find(p => p.label === 'n=200')!.score;
    }
    expect(total200 / total10).toBeGreaterThanOrEqual(1.25);
  });
});
