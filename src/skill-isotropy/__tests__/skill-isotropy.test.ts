/**
 * Skill Space Isotropy Audit tests — Phase 728 (v1.49.571).
 *
 * Covers LEJEPA-13. Read-only audit, Cramér-Wold slicing over synthetic and
 * adversarial skill embeddings. Default-off guarantee is covered by the
 * feature-flag-off byte-identical test at Phase 734.
 */

import { describe, expect, it } from 'vitest';
import * as isotropyModule from '../index.js';
import {
  DEFAULT_AUDIT_CONFIG,
  LEJEPA_FIG6_REFERENCE,
  andersonDarlingA2,
  andersonDarlingPValue,
  ksStatistic,
  projectOntoDirection,
  runIsotropyAudit,
  runUnivariateTest,
  sampleUnitDirections,
} from '../index.js';
import type { SkillEmbedding } from '../index.js';

// ---------- helpers ----------

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

/** Build N skill embeddings drawn i.i.d. from an isotropic K-dim Gaussian. */
function isotropicLibrary(n: number, k: number, seed: number): SkillEmbedding[] {
  const rand = mulberry32(seed);
  const out: SkillEmbedding[] = [];
  for (let i = 0; i < n; i++) {
    const v = new Array<number>(k);
    for (let j = 0; j < k; j++) v[j] = box(rand);
    out.push({ skillId: `iso-${i}`, vector: v });
  }
  return out;
}

/**
 * Library with a deliberate collapse: first `collapseDims` carry bimodal values
 * ±5 (strongly non-Gaussian, detectable by Anderson-Darling after
 * standardization); remaining dims are exactly zero — severe dimensional
 * collapse. The bimodal choice ensures A² flags the anomaly even after the
 * per-direction standardization step that erases scale differences.
 */
function collapsedLibrary(
  n: number,
  k: number,
  collapseDims: number,
  seed: number,
): SkillEmbedding[] {
  const rand = mulberry32(seed);
  const out: SkillEmbedding[] = [];
  for (let i = 0; i < n; i++) {
    const v = new Array<number>(k).fill(0);
    for (let j = 0; j < collapseDims; j++) v[j] = rand() < 0.5 ? -5 : 5;
    out.push({ skillId: `col-${i}`, vector: v });
  }
  return out;
}

// ---------- direction sampling + projection ----------

describe('sampleUnitDirections', () => {
  it('returns requested number of unit directions of the right dimension', () => {
    const dirs = sampleUnitDirections(16, 64, 1);
    expect(dirs).toHaveLength(16);
    for (const d of dirs) {
      expect(d).toHaveLength(64);
      const norm = Math.sqrt(d.reduce((s, x) => s + x * x, 0));
      expect(norm).toBeCloseTo(1, 6);
    }
  });

  it('is deterministic when a seed is set', () => {
    const a = sampleUnitDirections(4, 8, 42);
    const b = sampleUnitDirections(4, 8, 42);
    expect(a).toEqual(b);
  });

  it('rejects bad arguments', () => {
    expect(() => sampleUnitDirections(0, 8, 1)).toThrow();
    expect(() => sampleUnitDirections(4, 0, 1)).toThrow();
  });
});

describe('projectOntoDirection', () => {
  it('computes dot products for every embedding', () => {
    const dir = [1, 0, 0];
    const emb = [
      [2, 3, 4],
      [-1, 5, 2],
    ];
    expect(projectOntoDirection(emb, dir)).toEqual([2, -1]);
  });

  it('rejects mismatched dimensions', () => {
    expect(() => projectOntoDirection([[1, 2]], [1, 0, 0])).toThrow();
  });
});

// ---------- univariate tests ----------

describe('univariate goodness-of-fit tests', () => {
  it('Anderson-Darling returns ≥0 for any input', () => {
    expect(andersonDarlingA2([0, 0, 0, 0])).toBeGreaterThanOrEqual(0);
    expect(andersonDarlingA2([1, 2, 3, 4, 5])).toBeGreaterThan(0);
  });

  it('Anderson-Darling is small on truly-Gaussian samples', () => {
    const rand = mulberry32(7);
    const sample = Array.from({ length: 400 }, () => box(rand));
    const a2 = andersonDarlingA2(sample);
    expect(a2).toBeLessThan(2.5); // loose but reliable under our PRNG
  });

  it('Anderson-Darling grows on clearly-non-Gaussian samples', () => {
    const skewed: number[] = [];
    const rand = mulberry32(3);
    for (let i = 0; i < 400; i++) {
      const x = box(rand);
      skewed.push(Math.abs(x)); // strictly positive — strongly non-normal
    }
    const a2 = andersonDarlingA2(skewed);
    expect(a2).toBeGreaterThan(5);
  });

  it('KS statistic is in [0,1]', () => {
    const rand = mulberry32(11);
    const sample = Array.from({ length: 200 }, () => box(rand));
    const d = ksStatistic(sample);
    expect(d).toBeGreaterThanOrEqual(0);
    expect(d).toBeLessThanOrEqual(1);
  });

  it('p-value approximations are in [0,1]', () => {
    expect(andersonDarlingPValue(0.5)).toBeGreaterThan(0);
    expect(andersonDarlingPValue(0.5)).toBeLessThanOrEqual(1);
    expect(andersonDarlingPValue(100)).toBeGreaterThanOrEqual(0);
  });

  it('runUnivariateTest dispatches to each test kind', () => {
    const rand = mulberry32(99);
    const sample = Array.from({ length: 80 }, () => box(rand));
    expect(
      runUnivariateTest(sample, 'anderson-darling', 'standard-gaussian').pValue,
    ).toBeGreaterThan(0);
    expect(
      runUnivariateTest(sample, 'ks-statistic', 'standard-gaussian').pValue,
    ).toBeGreaterThan(0);
    expect(
      runUnivariateTest(sample, 'shapiro-wilk', 'standard-gaussian').pValue,
    ).toBeGreaterThanOrEqual(0);
  });
});

// ---------- audit top-level ----------

describe('runIsotropyAudit', () => {
  it('returns healthy verdict on an isotropic library', () => {
    const skills = isotropicLibrary(300, 64, 1234);
    const report = runIsotropyAudit(skills, {
      ...DEFAULT_AUDIT_CONFIG,
      numDirections: 16,
      seed: 5,
    });
    expect(report.verdict).toBe('healthy');
    expect(report.findings).toHaveLength(0);
  });

  it('returns collapse-suspected on a heavily-collapsed library', () => {
    const skills = collapsedLibrary(200, 64, 2, 77);
    const report = runIsotropyAudit(skills, {
      ...DEFAULT_AUDIT_CONFIG,
      numDirections: 24,
      seed: 13,
    });
    // Heavy collapse: most dims are exactly zero → projections along a random
    // direction are near-degenerate. Findings must appear and the verdict must
    // escalate past 'healthy'.
    expect(report.verdict).not.toBe('healthy');
    expect(report.findings.length).toBeGreaterThan(0);
    expect(report.maxDeviationScore).toBeGreaterThan(1);
  });

  it('handles the empty library without crashing', () => {
    const report = runIsotropyAudit([]);
    expect(report.skillCount).toBe(0);
    expect(report.findings).toHaveLength(0);
    expect(report.verdict).toBe('healthy');
  });

  it('rejects dimension mismatch between skills', () => {
    const skills: SkillEmbedding[] = [
      { skillId: 'a', vector: [1, 0, 0] },
      { skillId: 'b', vector: [1, 0] },
    ];
    expect(() => runIsotropyAudit(skills)).toThrow();
  });

  it('is deterministic across runs when a seed is fixed', () => {
    const skills = isotropicLibrary(100, 32, 3);
    const a = runIsotropyAudit(skills, {
      ...DEFAULT_AUDIT_CONFIG,
      numDirections: 8,
      seed: 42,
    });
    const b = runIsotropyAudit(skills, {
      ...DEFAULT_AUDIT_CONFIG,
      numDirections: 8,
      seed: 42,
    });
    expect(a.meanDeviationScore).toBeCloseTo(b.meanDeviationScore, 10);
    expect(a.maxDeviationScore).toBeCloseTo(b.maxDeviationScore, 10);
    expect(a.runTag).toBe(b.runTag);
  });

  it('sorts findings by descending deviation score', () => {
    const skills = collapsedLibrary(150, 48, 3, 55);
    const report = runIsotropyAudit(skills, {
      ...DEFAULT_AUDIT_CONFIG,
      numDirections: 20,
      seed: 1,
    });
    for (let i = 1; i < report.findings.length; i++) {
      expect(report.findings[i - 1].deviationScore).toBeGreaterThanOrEqual(
        report.findings[i].deviationScore,
      );
    }
  });

  it('runTag encodes every distinguishing config knob', () => {
    const skills = isotropicLibrary(50, 16, 0);
    const report = runIsotropyAudit(skills, {
      numDirections: 8,
      univariateTest: 'ks-statistic',
      target: 'zero-mean',
      significanceLevel: 0.05,
      seed: 9,
    });
    expect(report.runTag).toContain('ks-statistic');
    expect(report.runTag).toContain('zero-mean');
    expect(report.runTag).toContain('M=8');
    expect(report.runTag).toContain('α=0.05');
    expect(report.runTag).toContain('s9');
  });

  it('LeJEPA Fig 6 reference constant is exposed for downstream tests', () => {
    expect(LEJEPA_FIG6_REFERENCE).toEqual({
      embeddingDim: 1024,
      numDirections: 10,
      sampleCount: 100,
      perturbationDims: 2,
    });
  });

  it('replicates the LeJEPA Figure 6 qualitative recovery pattern', () => {
    // K=1024 is expensive in a unit test; scale to K=32 with the same M=10 / N=100
    // pattern. Anderson-Darling standardizes internally, so a pure scale
    // perturbation cancels out — we use a bimodal (sign-based) perturbation that
    // changes distribution shape rather than scale. This is the same "recovers a
    // perturbed 1024-dim Gaussian with M=10, N=100" qualitative claim.
    const n = LEJEPA_FIG6_REFERENCE.sampleCount;
    const k = 32;
    const perturb = LEJEPA_FIG6_REFERENCE.perturbationDims;
    const rand = mulberry32(888);
    const emb: SkillEmbedding[] = [];
    for (let i = 0; i < n; i++) {
      const v = new Array<number>(k);
      for (let j = 0; j < k; j++) v[j] = box(rand);
      // Bimodal perturbation: force the first `perturb` dims into a two-mode
      // distribution at ±4. Standardization-invariant anomaly — A² will pick it up.
      for (let j = 0; j < perturb; j++) v[j] = rand() < 0.5 ? -4 : 4;
      emb.push({ skillId: `fig6-${i}`, vector: v });
    }
    const report = runIsotropyAudit(emb, {
      numDirections: LEJEPA_FIG6_REFERENCE.numDirections,
      univariateTest: 'anderson-darling',
      target: 'standard-gaussian',
      significanceLevel: 0.05,
      seed: 21,
    });
    const baseline = runIsotropyAudit(
      isotropicLibrary(n, k, 888).slice(0, n),
      {
        numDirections: LEJEPA_FIG6_REFERENCE.numDirections,
        univariateTest: 'anderson-darling',
        target: 'standard-gaussian',
        significanceLevel: 0.05,
        seed: 21,
      },
    );
    // Key Fig 6 signal: mean deviation is clearly elevated vs an isotropic baseline
    // under the same M, N, K, seed. The paper reports that M=10 suffices to detect
    // a perturbation in a high-K Gaussian; this scaled-down version matches.
    expect(report.meanDeviationScore).toBeGreaterThan(baseline.meanDeviationScore);
  });

  it('per-skill metadata is preserved in the input but not leaked into findings', () => {
    const skills: SkillEmbedding[] = isotropicLibrary(40, 8, 9).map((s) => ({
      ...s,
      metadata: { secret: 'do-not-leak' },
    }));
    const report = runIsotropyAudit(skills, {
      ...DEFAULT_AUDIT_CONFIG,
      numDirections: 4,
      seed: 2,
    });
    const serialized = JSON.stringify(report);
    expect(serialized).not.toContain('do-not-leak');
  });

  it('mean deviation score is lower on isotropic libraries than on collapsed ones', () => {
    const iso = runIsotropyAudit(isotropicLibrary(200, 32, 1), {
      ...DEFAULT_AUDIT_CONFIG,
      numDirections: 16,
      seed: 100,
    });
    const col = runIsotropyAudit(collapsedLibrary(200, 32, 2, 1), {
      ...DEFAULT_AUDIT_CONFIG,
      numDirections: 16,
      seed: 100,
    });
    expect(col.meanDeviationScore).toBeGreaterThan(iso.meanDeviationScore);
  });

  it('verdict categories partition the output space', () => {
    const v = runIsotropyAudit(isotropicLibrary(100, 16, 1), {
      ...DEFAULT_AUDIT_CONFIG,
      seed: 1,
    }).verdict;
    expect(['healthy', 'watch', 'collapse-suspected']).toContain(v);
  });

  it('is a pure function: running twice on the same input yields identical reports', () => {
    const s = isotropicLibrary(80, 24, 314);
    const a = runIsotropyAudit(s, { ...DEFAULT_AUDIT_CONFIG, seed: 314 });
    const b = runIsotropyAudit(s, { ...DEFAULT_AUDIT_CONFIG, seed: 314 });
    expect(a.findings.length).toBe(b.findings.length);
    expect(a.verdict).toBe(b.verdict);
  });

  it('CAPCOM preservation: no exported symbol writes, dispatches, or gates anything', () => {
    // The module's public API is audit + primitives. If any future change exports a
    // function named 'dispatchGate', 'bypassCapcom', 'writeSkill', etc., this test
    // catches it — SC-CAPCOM-PRESERVE.
    const mod = isotropyModule as unknown as Record<string, unknown>;
    const forbidden = [
      'dispatchGate',
      'bypassCapcom',
      'writeSkill',
      'setCapcomState',
      'overrideCapcom',
      'updateLibrary',
      'applyCollapseFix',
    ];
    for (const name of forbidden) expect(mod[name]).toBeUndefined();
  });
});
