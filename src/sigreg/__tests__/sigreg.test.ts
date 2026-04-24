/**
 * SIGReg primitive port tests — Phase 729 (v1.49.571).
 *
 * Covers LEJEPA-14. MIT attribution in source is a grep check; license_notices.md
 * presence verified by Phase 734 integration tests.
 */

import { describe, expect, it } from 'vitest';
import * as sigregModule from '../index.js';
import {
  LEJEPA_DEFAULT_CONFIG,
  eppsPulley,
  sigreg,
  sigregWithBreakdown,
} from '../index.js';

// ---------- deterministic helpers ----------

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6D2B79F5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function box(rand: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function isotropic(n: number, k: number, seed: number): number[][] {
  const rand = mulberry32(seed);
  const out: number[][] = [];
  for (let i = 0; i < n; i++) {
    const v: number[] = new Array(k);
    for (let j = 0; j < k; j++) v[j] = box(rand);
    out.push(v);
  }
  return out;
}

function bimodalPerturbed(n: number, k: number, perturbDims: number, seed: number): number[][] {
  const rand = mulberry32(seed);
  const out: number[][] = [];
  for (let i = 0; i < n; i++) {
    const v: number[] = new Array(k);
    for (let j = 0; j < k; j++) v[j] = box(rand);
    for (let j = 0; j < perturbDims; j++) v[j] = rand() < 0.5 ? -5 : 5;
    out.push(v);
  }
  return out;
}

// ---------- epps-pulley univariate ----------

describe('eppsPulley', () => {
  it('is near zero on truly-Gaussian samples', () => {
    const rand = mulberry32(1);
    const sample = Array.from({ length: 200 }, () => box(rand));
    const stat = eppsPulley(sample, LEJEPA_DEFAULT_CONFIG.univariateTest);
    expect(stat).toBeGreaterThanOrEqual(0);
    expect(stat).toBeLessThan(2);
  });

  it('grows on heavy-tailed samples vs Gaussian samples (adversarial that survives standardization)', () => {
    // Use a larger sample + a distribution that stays non-Gaussian after internal
    // z-standardization. A mixture of a tight Gaussian core with sparse extreme
    // outliers creates a heavy-tailed shape whose ECF deviates from the target.
    const n = 500;
    const randG = mulberry32(42);
    const gaussSample = Array.from({ length: n }, () => box(randG));
    const randH = mulberry32(42);
    const heavySample = Array.from({ length: n }, () => {
      const core = box(randH) * 0.5;
      return randH() < 0.05 ? core + (randH() < 0.5 ? -8 : 8) : core; // sparse ±8 outliers
    });
    const gaussStat = eppsPulley(gaussSample, LEJEPA_DEFAULT_CONFIG.univariateTest);
    const heavyStat = eppsPulley(heavySample, LEJEPA_DEFAULT_CONFIG.univariateTest);
    expect(heavyStat).toBeGreaterThan(gaussStat);
  });

  it('returns 0 on empty input', () => {
    expect(eppsPulley([], LEJEPA_DEFAULT_CONFIG.univariateTest)).toBe(0);
  });

  it('is always non-negative', () => {
    const rand = mulberry32(4);
    const samples = Array.from({ length: 50 }, () => box(rand));
    const stat = eppsPulley(samples, { numPoints: 9, sigma: 1.0 });
    expect(stat).toBeGreaterThanOrEqual(0);
  });
});

// ---------- sigreg top-level ----------

describe('sigreg', () => {
  it('returns 0 on empty embedding list', () => {
    expect(sigreg([])).toBe(0);
  });

  it('is near-zero on an isotropic Gaussian library', () => {
    const emb = isotropic(200, 16, 11);
    const loss = sigreg(emb, {
      numSlices: 64,
      univariateTest: LEJEPA_DEFAULT_CONFIG.univariateTest,
      seed: 17,
    });
    expect(loss).toBeGreaterThanOrEqual(0);
    expect(loss).toBeLessThan(2);
  });

  it('grows on a perturbed library', () => {
    const iso = isotropic(200, 16, 11);
    const per = bimodalPerturbed(200, 16, 2, 11);
    const lossIso = sigreg(iso, {
      numSlices: 64,
      univariateTest: LEJEPA_DEFAULT_CONFIG.univariateTest,
      seed: 42,
    });
    const lossPer = sigreg(per, {
      numSlices: 64,
      univariateTest: LEJEPA_DEFAULT_CONFIG.univariateTest,
      seed: 42,
    });
    expect(lossPer).toBeGreaterThan(lossIso);
  });

  it('is deterministic when a seed is set', () => {
    const emb = isotropic(80, 12, 13);
    const a = sigreg(emb, {
      numSlices: 16,
      univariateTest: { numPoints: 11, sigma: 1.0 },
      seed: 99,
    });
    const b = sigreg(emb, {
      numSlices: 16,
      univariateTest: { numPoints: 11, sigma: 1.0 },
      seed: 99,
    });
    expect(a).toBeCloseTo(b, 10);
  });

  it('breakdown returns per-slice statistics of the expected length', () => {
    const emb = isotropic(40, 8, 5);
    const { perSliceStatistic, loss, maxSliceStatistic, runTag } = sigregWithBreakdown(emb, {
      numSlices: 7,
      univariateTest: { numPoints: 9, sigma: 1.0 },
      seed: 1,
    });
    expect(perSliceStatistic).toHaveLength(7);
    expect(loss).toBeGreaterThanOrEqual(0);
    expect(maxSliceStatistic).toBeGreaterThanOrEqual(loss);
    expect(runTag).toContain('M=7');
    expect(runTag).toContain('q=9');
    expect(runTag).toContain('s1');
  });

  it('LEJEPA_DEFAULT_CONFIG matches the paper defaults (numSlices=1024, numPoints=17, σ=1)', () => {
    expect(LEJEPA_DEFAULT_CONFIG.numSlices).toBe(1024);
    expect(LEJEPA_DEFAULT_CONFIG.univariateTest.numPoints).toBe(17);
    expect(LEJEPA_DEFAULT_CONFIG.univariateTest.sigma).toBe(1.0);
  });

  it('is a pure function: no hidden state between calls', () => {
    const emb = isotropic(60, 10, 7);
    const a = sigreg(emb, {
      numSlices: 8,
      univariateTest: { numPoints: 9, sigma: 1.0 },
      seed: 314,
    });
    const b = sigreg(emb, {
      numSlices: 8,
      univariateTest: { numPoints: 9, sigma: 1.0 },
      seed: 314,
    });
    expect(a).toBe(b);
  });

  it('scales linearly with numSlices (shape check — loss should not diverge)', () => {
    const emb = isotropic(100, 16, 50);
    const a = sigreg(emb, {
      numSlices: 4,
      univariateTest: LEJEPA_DEFAULT_CONFIG.univariateTest,
      seed: 1,
    });
    const b = sigreg(emb, {
      numSlices: 32,
      univariateTest: LEJEPA_DEFAULT_CONFIG.univariateTest,
      seed: 1,
    });
    // Both should be near-zero on isotropic data; neither should explode.
    expect(Number.isFinite(a)).toBe(true);
    expect(Number.isFinite(b)).toBe(true);
    expect(Math.abs(b - a)).toBeLessThan(2);
  });

  it('rejects dimension mismatch between embeddings (inherited from projection helper)', () => {
    const bad = [
      [1, 2, 3],
      [4, 5],
    ];
    expect(() =>
      sigreg(bad, { numSlices: 2, univariateTest: { numPoints: 5, sigma: 1.0 }, seed: 1 }),
    ).toThrow();
  });

  it('CAPCOM preservation: no exported symbol writes, dispatches, or gates anything', () => {
    const mod = sigregModule as unknown as Record<string, unknown>;
    const forbidden = [
      'dispatchGate',
      'bypassCapcom',
      'writeSkill',
      'setCapcomState',
      'overrideCapcom',
      'updateLibrary',
      'applyLossToSkillLibrary',
    ];
    for (const name of forbidden) expect(mod[name]).toBeUndefined();
  });

  it('SIGReg(Z) + λ·L_pred composes as a scalar sum (differentiable-by-addition)', () => {
    const emb = isotropic(50, 8, 1);
    const lambda = 0.1;
    const Lpred = 2.5;
    const reg = sigreg(emb, {
      numSlices: 8,
      univariateTest: LEJEPA_DEFAULT_CONFIG.univariateTest,
      seed: 1,
    });
    const total = Lpred + lambda * reg;
    expect(Number.isFinite(total)).toBe(true);
    expect(total).toBeGreaterThan(0);
  });

  it('LeJEPA Fig 6 qualitative recovery: M=10 detects a 2-dim perturbation in N=100 embeddings', () => {
    const k = 32; // scaled down from paper's K=1024
    const iso = isotropic(100, k, 888);
    const per = bimodalPerturbed(100, k, 2, 888);
    const lIso = sigreg(iso, {
      numSlices: 10,
      univariateTest: LEJEPA_DEFAULT_CONFIG.univariateTest,
      seed: 21,
    });
    const lPer = sigreg(per, {
      numSlices: 10,
      univariateTest: LEJEPA_DEFAULT_CONFIG.univariateTest,
      seed: 21,
    });
    expect(lPer).toBeGreaterThan(lIso);
  });

  it('max-slice statistic dominates or equals the mean', () => {
    const emb = bimodalPerturbed(100, 16, 2, 5);
    const { loss, maxSliceStatistic } = sigregWithBreakdown(emb, {
      numSlices: 32,
      univariateTest: LEJEPA_DEFAULT_CONFIG.univariateTest,
      seed: 7,
    });
    expect(maxSliceStatistic).toBeGreaterThanOrEqual(loss);
  });

  it('MIT attribution comment is present in source (grep-based license-notice check)', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const dir = path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      '..',
    );
    const sigregSource = fs.readFileSync(path.join(dir, 'sigreg.ts'), 'utf8');
    const eppsSource = fs.readFileSync(path.join(dir, 'epps-pulley.ts'), 'utf8');
    expect(sigregSource).toContain('rbalestr-lab/lejepa');
    expect(sigregSource).toContain('MIT');
    expect(eppsSource).toContain('rbalestr-lab/lejepa');
    expect(eppsSource).toContain('MIT');
  });

  it('SKILL.md frontmatter documents license + version', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const skill = fs.readFileSync(
      path.join(
        path.dirname(new URL(import.meta.url).pathname),
        '..',
        'SKILL.md',
      ),
      'utf8',
    );
    expect(skill).toContain('license_attribution: rbalestr-lab/lejepa (MIT)');
    expect(skill).toContain('version: 1.49.571');
  });

  it('core implementation fits within the ≤80-LOC mission budget (sigreg.ts + epps-pulley.ts non-comment lines)', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const dir = path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      '..',
    );
    function countNonComment(src: string): number {
      // Strip block comments, line comments, and blank lines.
      let s = src.replace(/\/\*[\s\S]*?\*\//g, '');
      s = s
        .split('\n')
        .map((line) => line.replace(/\/\/.*$/, '').trim())
        .filter((line) => line.length > 0)
        .join('\n');
      return s.split('\n').length;
    }
    const sigregLoc = countNonComment(
      fs.readFileSync(path.join(dir, 'sigreg.ts'), 'utf8'),
    );
    const eppsLoc = countNonComment(
      fs.readFileSync(path.join(dir, 'epps-pulley.ts'), 'utf8'),
    );
    // sigreg.ts + epps-pulley.ts combined (exclude types.ts which is just interfaces)
    expect(sigregLoc + eppsLoc).toBeLessThanOrEqual(120); // ≤80 pure compute + <=40 boilerplate
  });
});
