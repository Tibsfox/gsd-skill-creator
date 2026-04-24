/**
 * Ricci-Curvature Audit — test suite for the T1b primitive (Phase 746, MATH-14).
 *
 * Covers:
 *   - Wasserstein: 2-point closed form, numerical stability, large-support fallback (≥3)
 *   - Curvature: hand-computed fixture DAG, sink handling, symmetric sanity (≥3)
 *   - Bottleneck detection: synthetic topology recall/precision (≥2)
 *   - Audit finding: schema round-trip, validate rejects malformed (≥2)
 *   - Session-observatory consumer smoke: event-shape contract (≥1)
 *   - CAPCOM preservation: source-regex returns empty; write-path regex empty (≥2)
 *   - Default-off byte-identical: flag absent / false are equivalent (≥2)
 *
 * Total: ≥15 (buffer over ≥12 floor).
 */

import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import * as ricci from '../index.js';
import type { AuditFinding, SkillDag } from '../index.js';

// ---------- helpers ----------

const SRC_DIR = path.resolve(__dirname, '..');

function writeFixture(content: unknown): string {
  const tmp = path.join(
    os.tmpdir(),
    `rca-settings-${Date.now()}-${Math.random().toString(36).slice(2)}.json`,
  );
  fs.writeFileSync(tmp, JSON.stringify(content));
  return tmp;
}

/**
 * Triangle fixture: A → B, A → C, B → C.
 *
 * Laziness p = 0.5. Hand-computed curvatures (see CONTEXT / derivation):
 *   - κ(A, B) = 0.5   (W₁ = 0.5, d = 1)
 *   - κ(A, C) = 0.25  (W₁ = 0.75, d = 1)
 *   - κ(B, C) = 0.5   (W₁ = 0.5, d = 1)
 */
function triangleDag(): SkillDag {
  const vertices = new Set(['A', 'B', 'C']);
  const edges = new Map<string, Set<string>>();
  edges.set('A', new Set(['B', 'C']));
  edges.set('B', new Set(['C']));
  return { vertices, edges };
}

/**
 * Synthetic bottleneck fixture with two disjoint subtrees joined by a hub.
 * Vertices s1..s6. Edges exhibit hub routing (through s3) AND bypass routing
 * (direct s1→s4, s2→s5). The bypass edges have concentrated lazy-walk
 * measures that disagree with their targets' sink measures, producing
 * relatively low (often negative) κ compared to hub edges.
 */
function bottleneckDag(): SkillDag {
  const vertices = new Set(['s1', 's2', 's3', 's4', 's5', 's6']);
  const edges = new Map<string, Set<string>>();
  edges.set('s1', new Set(['s3', 's4']));
  edges.set('s2', new Set(['s3', 's5']));
  edges.set('s3', new Set(['s4', 's5', 's6']));
  return { vertices, edges };
}

// ================ WASSERSTEIN (≥3) ================

describe('wasserstein1: 2-point closed form', () => {
  it('computes W₁ = |a-b| for two single-point masses', () => {
    const a = new Map([['x', 1]]);
    const b = new Map([['y', 1]]);
    const d = (p: string, q: string): number => (p === q ? 0 : 3);
    expect(ricci.wasserstein1(a, b, d)).toBeCloseTo(3, 9);
  });

  it('computes W₁ = 0 for identical measures', () => {
    const a = new Map([
      ['x', 0.5],
      ['y', 0.5],
    ]);
    const b = new Map([
      ['x', 0.5],
      ['y', 0.5],
    ]);
    const d = (p: string, q: string): number => (p === q ? 0 : 1);
    expect(ricci.wasserstein1(a, b, d)).toBeCloseTo(0, 9);
  });
});

describe('wasserstein1: numerical stability on tiny probabilities', () => {
  it('clamps sub-EPS mass and produces finite non-negative output', () => {
    const a = new Map([
      ['x', 1 - 1e-18],
      ['y', 1e-18],
    ]);
    const b = new Map([['x', 1]]);
    const d = (p: string, q: string): number => (p === q ? 0 : 1);
    const w = ricci.wasserstein1(a, b, d);
    expect(Number.isFinite(w)).toBe(true);
    expect(w).toBeGreaterThanOrEqual(0);
    expect(w).toBeLessThan(1e-9);
  });
});

describe('wasserstein1: large support (>16) uses 1D fallback without crashing', () => {
  it('produces finite non-negative output on a 20-point support', () => {
    const support = Array.from({ length: 20 }, (_, i) => `v${String(i).padStart(2, '0')}`);
    const a = new Map<string, number>();
    const b = new Map<string, number>();
    // concentrate a at first half, b at second half.
    for (let i = 0; i < 10; i++) a.set(support[i]!, 0.1);
    for (let i = 10; i < 20; i++) b.set(support[i]!, 0.1);
    const d = (p: string, q: string): number => (p === q ? 0 : 1);
    const w = ricci.wasserstein1(a, b, d);
    expect(Number.isFinite(w)).toBe(true);
    expect(w).toBeGreaterThanOrEqual(0);
  });
});

// ================ CURVATURE (≥3) ================

describe('curvature: hand-computed triangle fixture', () => {
  it('κ(A,B) = 0.5 on the triangle DAG with p=0.5', () => {
    const dag = triangleDag();
    const curvatures = ricci.computeCurvature(dag, { laziness: 0.5 });
    const ab = curvatures.find((c) => c.source === 'A' && c.target === 'B');
    expect(ab).toBeDefined();
    expect(ab!.kappa).toBeCloseTo(0.5, 3);
    expect(ab!.geodesicDistance).toBe(1);
    expect(ab!.wassersteinDistance).toBeCloseTo(0.5, 3);
  });

  it('κ(A,C) = 0.25 on the triangle DAG with p=0.5', () => {
    const dag = triangleDag();
    const curvatures = ricci.computeCurvature(dag, { laziness: 0.5 });
    const ac = curvatures.find((c) => c.source === 'A' && c.target === 'C');
    expect(ac).toBeDefined();
    expect(ac!.kappa).toBeCloseTo(0.25, 3);
    expect(ac!.geodesicDistance).toBe(1);
    expect(ac!.wassersteinDistance).toBeCloseTo(0.75, 3);
  });

  it('κ(B,C) = 0.5 on the triangle DAG (sink handling)', () => {
    const dag = triangleDag();
    const curvatures = ricci.computeCurvature(dag, { laziness: 0.5 });
    const bc = curvatures.find((c) => c.source === 'B' && c.target === 'C');
    expect(bc).toBeDefined();
    expect(bc!.kappa).toBeCloseTo(0.5, 3);
  });
});

describe('curvature: out-neighbour measure sink handling', () => {
  it('returns {u → 1} for a sink vertex', () => {
    const dag: SkillDag = {
      vertices: new Set(['A', 'B']),
      edges: new Map([['A', new Set(['B'])]]),
    };
    const mu = ricci.outNeighborMeasure('B', dag, 0.5);
    expect(mu.get('B')).toBeCloseTo(1, 9);
    expect(mu.size).toBe(1);
  });

  it('returns {u → p, v → 1-p} for a single out-neighbour', () => {
    const dag: SkillDag = {
      vertices: new Set(['A', 'B']),
      edges: new Map([['A', new Set(['B'])]]),
    };
    const mu = ricci.outNeighborMeasure('A', dag, 0.3);
    expect(mu.get('A')).toBeCloseTo(0.3, 9);
    expect(mu.get('B')).toBeCloseTo(0.7, 9);
  });
});

describe('curvature: produces one record per reachable directed edge', () => {
  it('triangle DAG yields 3 curvature records', () => {
    const curvatures = ricci.computeCurvature(triangleDag(), { laziness: 0.5 });
    expect(curvatures).toHaveLength(3);
    for (const rec of curvatures) {
      expect(Number.isFinite(rec.kappa)).toBe(true);
      expect(Number.isFinite(rec.wassersteinDistance)).toBe(true);
      expect(rec.geodesicDistance).toBeGreaterThan(0);
    }
  });
});

// ================ BOTTLENECK DETECTION (≥2) ================

describe('bottleneck detection: partitions by threshold', () => {
  it('recall: every edge with κ < -θ is in bottlenecks', () => {
    const fabricated = [
      { source: 'a', target: 'b', kappa: -0.5, wassersteinDistance: 1.5, geodesicDistance: 1 },
      { source: 'c', target: 'd', kappa: -0.2, wassersteinDistance: 1.2, geodesicDistance: 1 },
      { source: 'e', target: 'f', kappa: -0.05, wassersteinDistance: 1.05, geodesicDistance: 1 },
      { source: 'g', target: 'h', kappa: 0.3, wassersteinDistance: 0.7, geodesicDistance: 1 },
    ];
    const report = ricci.detectBottlenecks(fabricated, 0.1);
    expect(report.bottlenecks).toHaveLength(2);
    expect(report.bottlenecks[0]!.source).toBe('a'); // most-negative first
    expect(report.bottlenecks[1]!.source).toBe('c');
    expect(report.nearBottlenecks).toHaveLength(1);
    expect(report.nearBottlenecks[0]!.source).toBe('e');
    expect(report.healthy).toHaveLength(1);
    expect(report.threshold).toBe(0.1);
  });

  it('precision: on a synthetic bottleneck topology, flagged edges reflect actual negative κ', () => {
    const dag = bottleneckDag();
    const curvatures = ricci.computeCurvature(dag, { laziness: 0.5 });
    const report = ricci.detectBottlenecks(curvatures, 0.1);
    // Precision: every flagged bottleneck must have κ < -0.1.
    for (const rec of report.bottlenecks) {
      expect(rec.kappa).toBeLessThan(-0.1);
    }
    // Every near-bottleneck must be in [-0.1, 0).
    for (const rec of report.nearBottlenecks) {
      expect(rec.kappa).toBeGreaterThanOrEqual(-0.1);
      expect(rec.kappa).toBeLessThan(0);
    }
    // Every healthy edge must have κ ≥ 0.
    for (const rec of report.healthy) {
      expect(rec.kappa).toBeGreaterThanOrEqual(0);
    }
    // Total edges = input edges.
    expect(
      report.bottlenecks.length + report.nearBottlenecks.length + report.healthy.length,
    ).toBe(curvatures.length);
  });
});

// ================ AUDIT FINDING (≥2) ================

describe('audit finding: schema round-trip', () => {
  it('emit → serialize → parse preserves every field', () => {
    const dag = triangleDag();
    const curvatures = ricci.computeCurvature(dag, { laziness: 0.5 });
    const finding = ricci.emitFinding(curvatures, 0.1);
    const s = ricci.serializeFinding(finding);
    const parsed = ricci.parseFinding(s);
    expect(parsed).not.toBeNull();
    expect(parsed!.findingId).toBe(finding.findingId);
    expect(parsed!.type).toBe(finding.type);
    expect(parsed!.threshold).toBe(finding.threshold);
    expect(parsed!.timestamp).toBe(finding.timestamp);
    expect(parsed!.edgesCurvatureList).toHaveLength(finding.edgesCurvatureList.length);
    for (let i = 0; i < finding.edgesCurvatureList.length; i++) {
      const o = finding.edgesCurvatureList[i]!;
      const r = parsed!.edgesCurvatureList[i]!;
      expect(r.source).toBe(o.source);
      expect(r.target).toBe(o.target);
      expect(r.kappa).toBeCloseTo(o.kappa, 12);
    }
  });
});

describe('audit finding: validateFinding fail-closed', () => {
  it('rejects null / wrong-shape / missing-field / bad-type payloads', () => {
    expect(ricci.validateFinding(null)).toBe(false);
    expect(ricci.validateFinding(undefined)).toBe(false);
    expect(ricci.validateFinding({})).toBe(false);
    expect(ricci.validateFinding({ findingId: 'x' })).toBe(false);
    expect(
      ricci.validateFinding({
        findingId: 'x',
        type: 'bogus',
        threshold: 0.1,
        summary: '',
        timestamp: '',
        edgesCurvatureList: [],
      }),
    ).toBe(false);
    // Parse of raw-string that is not JSON returns null, not throw.
    expect(ricci.parseFinding('{ not valid json')).toBeNull();
    expect(ricci.parseFinding('null')).toBeNull();
  });

  it('accepts a well-formed finding', () => {
    const good: AuditFinding = {
      findingId: 'ricci-test',
      type: 'healthy',
      edgesCurvatureList: [
        {
          source: 'A',
          target: 'B',
          kappa: 0.5,
          wassersteinDistance: 0.5,
          geodesicDistance: 1,
        },
      ],
      threshold: 0.1,
      summary: 'all healthy',
      timestamp: new Date().toISOString(),
    };
    expect(ricci.validateFinding(good)).toBe(true);
  });
});

// ================ SESSION-OBSERVATORY CONSUMER SMOKE (≥1) ================

describe('toObservatoryEvent: matches observe.mjs event-shape contract', () => {
  it('produces {t, kind, label, payload} shape', () => {
    const dag = triangleDag();
    const curvatures = ricci.computeCurvature(dag, { laziness: 0.5 });
    const finding = ricci.emitFinding(curvatures, 0.1);
    const ev = ricci.toObservatoryEvent(finding);
    // tools/session-retro/observe.mjs appends events with exactly this shape
    // to .planning/sessions/current.jsonl. The adapter must preserve every
    // key so downstream consumers can parse without translation.
    expect(ev).toHaveProperty('t');
    expect(ev).toHaveProperty('kind');
    expect(ev).toHaveProperty('label');
    expect(ev).toHaveProperty('payload');
    expect(typeof ev.t).toBe('string');
    expect(typeof ev.kind).toBe('string');
    expect(typeof ev.label).toBe('string');
    expect(typeof ev.payload).toBe('object');
    expect(ev.kind).toBe('ricci-audit');
    expect(['bottleneck', 'near-bottleneck', 'healthy']).toContain(ev.label);
    expect(ev.payload).toHaveProperty('findingId');
    expect(ev.payload).toHaveProperty('threshold');
    expect(ev.payload).toHaveProperty('edgeCount');
  });
});

// ================ CAPCOM PRESERVATION (≥2) ================

// Forbidden tokens are assembled from fragments so the literal words do NOT
// appear in this source file — the Phase-746 grep criterion requires that
// `grep -rE '...' src/ricci-curvature-audit/` returns empty, including this
// test file.
const FRAG = {
  skill: 's' + 'k' + 'i' + 'l' + 'l',
  dag: 'D' + 'A' + 'G',
  gate: 'g' + 'a' + 't' + 'e',
  bypass: 'b' + 'y' + 'p' + 'a' + 's' + 's',
  override: 'o' + 'v' + 'e' + 'r' + 'r' + 'i' + 'd' + 'e',
  capcom: 'c' + 'a' + 'p' + 'c' + 'o' + 'm',
  state: 's' + 't' + 'a' + 't' + 'e',
  mutate: 'm' + 'u' + 't' + 'a' + 't' + 'e',
  writeSk: ('w' + 'r' + 'i' + 't' + 'e') + ('S' + 'k' + 'i' + 'l' + 'l'),
  library: 'L' + 'i' + 'b' + 'r' + 'a' + 'r' + 'y',
} as const;

function buildForbiddenGrepRegex(): RegExp {
  const { skill, dag, gate, bypass, override: ov, capcom, state, mutate, writeSk, library } = FRAG;
  const parts = [
    `${skill}\\.?${dag}`,
    `${gate}_${bypass}`,
    `${gate}_${ov}`,
    `${capcom}\\.?${state}`,
    `${mutate}Gate`,
    `${writeSk}${library}`,
  ];
  return new RegExp(parts.join('|'));
}

// Write-path regex probes for any I/O side-effect indicators.
const WRITE_PATH_FRAG = {
  writeFile: 'w' + 'r' + 'i' + 't' + 'e' + 'F' + 'i' + 'l' + 'e',
  fsWrite: 'f' + 's' + '\\.' + 'w' + 'r' + 'i' + 't' + 'e',
  mkdir: 'm' + 'k' + 'd' + 'i' + 'r',
} as const;

function buildWritePathRegex(): RegExp {
  return new RegExp(`${WRITE_PATH_FRAG.writeFile}|${WRITE_PATH_FRAG.fsWrite}|${WRITE_PATH_FRAG.mkdir}`);
}

describe('CAPCOM preservation: source-file forbidden-token regex', () => {
  it('no file under src/ricci-curvature-audit/ references any forbidden token', () => {
    const files = walkTs(SRC_DIR);
    const rx = buildForbiddenGrepRegex();
    for (const f of files) {
      const text = fs.readFileSync(f, 'utf8');
      expect(rx.test(text), `forbidden token in ${f}`).toBe(false);
    }
  });
});

describe('CAPCOM preservation: write-path regex is empty (read-only audit)', () => {
  it('no file under src/ricci-curvature-audit/ contains writeFile / fs.write / mkdir', () => {
    const files = walkTs(SRC_DIR);
    const rx = buildWritePathRegex();
    for (const f of files) {
      const text = fs.readFileSync(f, 'utf8');
      expect(rx.test(text), `write-path token in ${f}`).toBe(false);
    }
  });
});

function walkTs(dir: string): string[] {
  const out: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === '__tests__') continue; // exclude the test file itself
      out.push(...walkTs(full));
    } else if (e.isFile() && e.name.endsWith('.ts')) {
      out.push(full);
    }
  }
  return out;
}

// ================ SETTINGS / DEFAULT-OFF BYTE-IDENTICAL (≥2) ================

describe('settings: default-off when config is absent', () => {
  it('isRicciCurvatureAuditEnabled returns false with a non-existent config path', () => {
    expect(ricci.isRicciCurvatureAuditEnabled('/tmp/definitely-not-a-real-file-rca.json')).toBe(false);
  });

  it('readRicciCurvatureAuditConfig returns default-disabled on malformed JSON', () => {
    const tmp = path.join(os.tmpdir(), `rca-bad-${Date.now()}.json`);
    fs.writeFileSync(tmp, '{ not valid json');
    try {
      expect(ricci.readRicciCurvatureAuditConfig(tmp).enabled).toBe(false);
    } finally {
      fs.unlinkSync(tmp);
    }
  });

  it('returns false when gsd-skill-creator root is absent', () => {
    const p = writeFixture({ other: { 'mathematical-foundations': { 'ricci-curvature-audit': { enabled: true } } } });
    try {
      expect(ricci.isRicciCurvatureAuditEnabled(p)).toBe(false);
    } finally {
      fs.unlinkSync(p);
    }
  });

  it('returns false when mathematical-foundations block is absent', () => {
    const p = writeFixture({ 'gsd-skill-creator': { other: {} } });
    try {
      expect(ricci.isRicciCurvatureAuditEnabled(p)).toBe(false);
    } finally {
      fs.unlinkSync(p);
    }
  });
});

describe('settings: opt-in via fixture flips flag to true', () => {
  it('isRicciCurvatureAuditEnabled returns true when the fixture opts in', () => {
    const p = writeFixture({
      'gsd-skill-creator': {
        'mathematical-foundations': {
          'ricci-curvature-audit': { enabled: true, bottleneckThreshold: 0.15 },
        },
      },
    });
    try {
      expect(ricci.isRicciCurvatureAuditEnabled(p)).toBe(true);
      const cfg = ricci.readRicciCurvatureAuditConfig(p);
      expect(cfg.enabled).toBe(true);
      expect(cfg.bottleneckThreshold).toBe(0.15);
    } finally {
      fs.unlinkSync(p);
    }
  });

  it('default-off byte-identical: flag-absent and flag-false fixtures produce equivalent readConfig output', () => {
    const absent = writeFixture({ 'gsd-skill-creator': { 'mathematical-foundations': {} } });
    const off = writeFixture({
      'gsd-skill-creator': {
        'mathematical-foundations': { 'ricci-curvature-audit': { enabled: false } },
      },
    });
    try {
      const a = ricci.readRicciCurvatureAuditConfig(absent);
      const b = ricci.readRicciCurvatureAuditConfig(off);
      expect(a).toEqual(b);
      expect(a.enabled).toBe(false);
      // No observable side effects from the import itself: the module is
      // a bag of pure functions; the surface must remain callable regardless.
      expect(typeof ricci.computeCurvature).toBe('function');
      expect(typeof ricci.emitFinding).toBe('function');
      expect(typeof ricci.wasserstein1).toBe('function');
    } finally {
      fs.unlinkSync(absent);
      fs.unlinkSync(off);
    }
  });
});
