/**
 * v1.49.580 W5 — multivariate paper-benchmark reproduction.
 *
 * Multivariate analog of v1.49.579's paper-benchmark.test.ts. 3-arm
 * Multinomial parameter recovery toy:
 *
 *   - latent: θ ~ Dirichlet([2, 2, 2]) (peaked at uniform [1/3, 1/3, 1/3])
 *   - designs: per-round sample-size choices [10, 50, 200]
 *   - model:   y_i | d, θ ~ Categorical(θ), repeated d.payload.n times
 *
 * Expected behaviour: more samples per round ⇒ tighter posterior ⇒ larger
 * expected SW shift ⇒ higher score. Bigger sample sizes win.
 */

import { describe, it, expect } from 'vitest';
import { selectIpmBoedDesignMv } from '../ipm-boed-mv.js';
import { mulberry32 } from '../ipm-boed.js';
import type { MvExperimentDesign } from '../index.js';

interface SizedDesign {
  n: number;
}

function sizedDesigns(): MvExperimentDesign<SizedDesign>[] {
  return [
    { label: 'n=10', payload: { n: 10 } },
    { label: 'n=50', payload: { n: 50 } },
    { label: 'n=200', payload: { n: 200 } },
  ];
}

/** Faithful Categorical(θ) model — d.payload.n trials. */
function categoricalModel(d: MvExperimentDesign<SizedDesign>, theta: number[]): number[] {
  const cum = theta.reduce<number[]>((acc, p) => {
    acc.push((acc[acc.length - 1] ?? 0) + p);
    return acc;
  }, []);
  const rng = mulberry32(Math.floor(theta.reduce((a, b) => a + b * 1e6, 0)) + d.payload.n);
  const out: number[] = [];
  for (let i = 0; i < d.payload.n; i++) {
    const u = rng.next();
    let k = 0;
    while (k < cum.length - 1 && u >= cum[k]) k++;
    out.push(k);
  }
  return out;
}

describe('IPM-BOED-MV paper benchmark — 3-arm Multinomial parameter recovery', () => {
  it('selectIpmBoedDesignMv picks n=200 for ≥4 of 5 seeds', () => {
    const designs = sizedDesigns();
    const seeds = [101, 202, 303, 404, 505];
    let largestWins = 0;
    for (const seed of seeds) {
      const r = selectIpmBoedDesignMv({
        prior: { alphas: [2, 2, 2] },
        designs,
        mvModelSamples: categoricalModel,
        draws: { theta: 16, post: 32, prior: 32 },
        projections: 32,
        rng: mulberry32(seed),
      });
      if (r.design.label === 'n=200') largestWins++;
    }
    expect(largestWins).toBeGreaterThanOrEqual(4);
  });

  it('per-design scores grow monotonically with sample size', () => {
    const designs = sizedDesigns();
    const seeds = [11, 22, 33, 44, 55, 66, 77, 88];
    const totals: Record<string, number> = { 'n=10': 0, 'n=50': 0, 'n=200': 0 };
    for (const seed of seeds) {
      const r = selectIpmBoedDesignMv({
        prior: { alphas: [2, 2, 2] },
        designs,
        mvModelSamples: categoricalModel,
        draws: { theta: 16, post: 32, prior: 32 },
        projections: 32,
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

  it('information growth is non-trivial: avg score(n=200) ≥ 1.20 × avg score(n=10)', () => {
    // Slightly looser than 1-D's 1.25 floor — SW Monte-Carlo noise compounds
    // with K (we project onto random unit vectors AND average over θ samples).
    // Empirically observed across 10 seeds: ratio is in the 1.3-1.5 range;
    // 1.20 leaves margin while still asserting meaningful (≥20%) growth.
    const designs = sizedDesigns();
    const seeds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    let total10 = 0;
    let total200 = 0;
    for (const seed of seeds) {
      const r = selectIpmBoedDesignMv({
        prior: { alphas: [2, 2, 2] },
        designs,
        mvModelSamples: categoricalModel,
        draws: { theta: 16, post: 32, prior: 32 },
        projections: 32,
        rng: mulberry32(seed),
      });
      total10 += r.perDesign.find(p => p.label === 'n=10')!.score;
      total200 += r.perDesign.find(p => p.label === 'n=200')!.score;
    }
    expect(total200 / total10).toBeGreaterThanOrEqual(1.20);
  });
});
