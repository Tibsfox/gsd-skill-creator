/**
 * v1.49.580 W3 — Multivariate IPM-BOED design selector tests.
 *
 * Mirrors the v1.49.579 W2 tests for selectIpmBoedDesign:
 *   - determinism (same seed → same pick + same score)
 *   - ranking (high-information design beats low-information design in d=3)
 *   - corner case (single-design list returns shortcut)
 *   - empty list throws
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
  ];
}

/**
 * Faithful Categorical(θ) model — d.payload.n trials. Returns indices in
 * 0..K-1 by drawing uniform variates and finding the bucket on the
 * cumulative distribution of θ.
 */
function categoricalModel(d: MvExperimentDesign<SizedDesign>, theta: number[]): number[] {
  const cum = theta.reduce<number[]>((acc, p) => {
    acc.push((acc[acc.length - 1] ?? 0) + p);
    return acc;
  }, []);
  // Seed by theta hash + design size for reproducibility.
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

// ─── Determinism ─────────────────────────────────────────────────────────────

describe('selectIpmBoedDesignMv — determinism', () => {
  it('same seed ⇒ same design pick + same score across two calls', () => {
    const designs = sizedDesigns();
    const r1 = selectIpmBoedDesignMv({
      prior: { alphas: [2, 2, 2] },
      designs,
      mvModelSamples: categoricalModel,
      draws: { theta: 8, post: 16, prior: 16 },
      projections: 16,
      rng: mulberry32(99),
    });
    const r2 = selectIpmBoedDesignMv({
      prior: { alphas: [2, 2, 2] },
      designs,
      mvModelSamples: categoricalModel,
      draws: { theta: 8, post: 16, prior: 16 },
      projections: 16,
      rng: mulberry32(99),
    });
    expect(r1.design.label).toBe(r2.design.label);
    expect(r1.score).toBe(r2.score);
    expect(r1.perDesign).toEqual(r2.perDesign);
  });
});

// ─── Ranking ─────────────────────────────────────────────────────────────────

describe('selectIpmBoedDesignMv — ranking in d=3', () => {
  it('prefers high-information design over low-information design', () => {
    // Two designs in K=3:
    //   d_low:  outcomes uniformly distributed across categories regardless of θ (no info)
    //   d_high: faithful Categorical(θ) (every trial is informative about θ)
    const designs: MvExperimentDesign<'low' | 'high'>[] = [
      { label: 'low', payload: 'low' },
      { label: 'high', payload: 'high' },
    ];
    const mvModelSamples = (d: MvExperimentDesign<'low' | 'high'>, theta: number[]): number[] => {
      const rng = mulberry32(Math.floor(theta.reduce((a, b) => a + b * 1e6, 0)));
      if (d.payload === 'low') {
        // Uniform 0..2 regardless of θ — design tells us nothing about θ
        return Array.from({ length: 20 }, () => Math.floor(rng.next() * 3));
      }
      // d_high: faithful Categorical(θ)
      const cum = theta.reduce<number[]>((acc, p) => {
        acc.push((acc[acc.length - 1] ?? 0) + p);
        return acc;
      }, []);
      const out: number[] = [];
      for (let i = 0; i < 20; i++) {
        const u = rng.next();
        let k = 0;
        while (k < cum.length - 1 && u >= cum[k]) k++;
        out.push(k);
      }
      return out;
    };

    let highWins = 0;
    const trials = 10;
    for (let seed = 0; seed < trials; seed++) {
      const r = selectIpmBoedDesignMv({
        prior: { alphas: [2, 2, 2] },
        designs,
        mvModelSamples,
        draws: { theta: 16, post: 32, prior: 32 },
        projections: 32,
        rng: mulberry32(seed),
      });
      if (r.design.label === 'high') highWins++;
    }
    expect(highWins).toBeGreaterThanOrEqual(8);
  });

  it('per-design scores reflect information content (high > low in d=3)', () => {
    const designs: MvExperimentDesign<'low' | 'high'>[] = [
      { label: 'low', payload: 'low' },
      { label: 'high', payload: 'high' },
    ];
    const mvModelSamples = (d: MvExperimentDesign<'low' | 'high'>, theta: number[]): number[] => {
      const rng = mulberry32(Math.floor(theta.reduce((a, b) => a + b * 1e6, 0)));
      if (d.payload === 'low') {
        return Array.from({ length: 30 }, () => Math.floor(rng.next() * 3));
      }
      const cum = theta.reduce<number[]>((acc, p) => {
        acc.push((acc[acc.length - 1] ?? 0) + p);
        return acc;
      }, []);
      const out: number[] = [];
      for (let i = 0; i < 30; i++) {
        const u = rng.next();
        let k = 0;
        while (k < cum.length - 1 && u >= cum[k]) k++;
        out.push(k);
      }
      return out;
    };
    const r = selectIpmBoedDesignMv({
      prior: { alphas: [2, 2, 2] },
      designs,
      mvModelSamples,
      draws: { theta: 24, post: 48, prior: 48 },
      projections: 48,
      rng: mulberry32(1234),
    });
    const lowScore = r.perDesign.find(p => p.label === 'low')!.score;
    const highScore = r.perDesign.find(p => p.label === 'high')!.score;
    expect(highScore).toBeGreaterThan(lowScore);
  });
});

// ─── Corner cases ────────────────────────────────────────────────────────────

describe('selectIpmBoedDesignMv — corner cases', () => {
  it('single-design list returns that design without consuming Monte-Carlo draws', () => {
    const onlyDesign: MvExperimentDesign<number> = { label: 'only', payload: 42 };
    let modelCalls = 0;
    const mvModelSamples = () => {
      modelCalls++;
      return [0, 1, 2];
    };
    const r = selectIpmBoedDesignMv({
      prior: { alphas: [1, 1, 1] },
      designs: [onlyDesign],
      mvModelSamples,
      rng: mulberry32(0),
    });
    expect(r.design).toBe(onlyDesign);
    expect(r.score).toBe(0);
    expect(r.perDesign).toEqual([{ label: 'only', score: 0 }]);
    expect(modelCalls).toBe(0);
  });

  it('throws on empty design list', () => {
    expect(() => selectIpmBoedDesignMv({
      prior: { alphas: [1, 1, 1] },
      designs: [],
      mvModelSamples: () => [],
    })).toThrow(RangeError);
  });
});
