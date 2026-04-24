/**
 * Wasserstein-Hebbian adapter-stack — test suite (Phase 751, MATH-19).
 *
 * Covers:
 *   - W₂² closed-form identity + shift (≥2)
 *   - Plasticity-rule shape + range validation (≥2)
 *   - Audit-finding round-trip (≥1)
 *   - CAPCOM-preservation regex on source (≥1)
 *   - Default-off byte-identical (≥1)
 *
 * Total target: ≥7.
 */

import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import * as wh from '../index.js';
import type { PlasticityRule } from '../index.js';

// ---------- helpers ----------

const SRC_DIR = path.resolve(__dirname, '..');

function writeFixture(content: unknown): string {
  const tmp = path.join(
    os.tmpdir(),
    `wh-settings-${Date.now()}-${Math.random().toString(36).slice(2)}.json`,
  );
  fs.writeFileSync(tmp, JSON.stringify(content));
  return tmp;
}

// ================ WASSERSTEIN GEOMETRY (≥2) ================

describe('w2SquaredGaussian: identical distributions have W₂² = 0', () => {
  it('N(0,1) to N(0,1) returns 0', () => {
    expect(wh.w2SquaredGaussian(0, 1, 0, 1)).toBeCloseTo(0, 12);
  });

  it('N(7, 3) to N(7, 3) returns 0 at any parameter', () => {
    expect(wh.w2SquaredGaussian(7, 3, 7, 3)).toBeCloseTo(0, 12);
  });
});

describe('w2SquaredGaussian: shifted-mean distance matches (μ1-μ2)²', () => {
  it('N(3, 1) to N(5, 1) returns 4', () => {
    expect(wh.w2SquaredGaussian(3, 1, 5, 1)).toBeCloseTo(4, 12);
  });

  it('mixed shift: N(2, 1) to N(5, 3) returns 9 + 4 = 13', () => {
    // (2-5)² + (1-3)² = 9 + 4 = 13
    expect(wh.w2SquaredGaussian(2, 1, 5, 3)).toBeCloseTo(13, 12);
  });
});

describe('checkBoundedVariance: σ² < threshold admits / rejects correctly', () => {
  it('σ=2, threshold=5 ⇒ σ²=4 < 5, returns true', () => {
    expect(wh.checkBoundedVariance(2, 5)).toBe(true);
  });

  it('σ=3, threshold=5 ⇒ σ²=9 ≥ 5, returns false', () => {
    expect(wh.checkBoundedVariance(3, 5)).toBe(false);
  });

  it('fail-closed on non-finite / negative inputs', () => {
    expect(wh.checkBoundedVariance(Number.NaN, 5)).toBe(false);
    expect(wh.checkBoundedVariance(1, Number.POSITIVE_INFINITY)).toBe(false);
    expect(wh.checkBoundedVariance(-1, 5)).toBe(false);
  });
});

// ================ PLASTICITY RULE VALIDATION (≥2) ================

describe('validatePlasticityRule: well-formed rule passes', () => {
  it('rule with ruleName + finite learningRate passes shape check', () => {
    const r: PlasticityRule = { ruleName: 'hebb-basic', learningRate: 0.1 };
    const res = wh.validatePlasticityRule(r);
    expect(res.ok).toBe(true);
    expect(res.violations).toEqual([]);
  });

  it('rule with optional regularization passes shape check', () => {
    const r: PlasticityRule = {
      ruleName: 'hebb-reg',
      learningRate: 0.5,
      regularization: 1.5,
    };
    expect(wh.validatePlasticityRule(r).ok).toBe(true);
    expect(wh.inStableRegion(r)).toBe(true);
  });
});

describe('validatePlasticityRule: malformed / out-of-range rule rejected', () => {
  it('negative learningRate rejected by inStableRegion', () => {
    const r: PlasticityRule = { ruleName: 'bad', learningRate: -0.1 };
    expect(wh.validatePlasticityRule(r).ok).toBe(true);
    expect(wh.inStableRegion(r)).toBe(false);
    const reasons = wh.collectInconsistencyReasons(r);
    expect(reasons.length).toBeGreaterThan(0);
  });

  it('learningRate above 1 rejected by inStableRegion', () => {
    const r: PlasticityRule = { ruleName: 'hot', learningRate: 1.5 };
    expect(wh.inStableRegion(r)).toBe(false);
    expect(wh.collectInconsistencyReasons(r).some((s) => s.includes('learningRate'))).toBe(true);
  });

  it('empty ruleName flagged by shape validator', () => {
    const bad = { ruleName: '', learningRate: 0.1 } as PlasticityRule;
    const res = wh.validatePlasticityRule(bad);
    expect(res.ok).toBe(false);
    expect(res.violations.length).toBeGreaterThan(0);
  });

  it('non-finite learningRate flagged', () => {
    const bad = {
      ruleName: 'nan-rule',
      learningRate: Number.NaN,
    } as PlasticityRule;
    expect(wh.validatePlasticityRule(bad).ok).toBe(false);
  });

  it('regularization out of range reported in reasons', () => {
    const r: PlasticityRule = {
      ruleName: 'reg-out',
      learningRate: 0.1,
      regularization: 50,
    };
    expect(wh.inStableRegion(r)).toBe(false);
    expect(wh.collectInconsistencyReasons(r).some((s) => s.includes('regularization'))).toBe(true);
  });
});

// ================ AUDIT FINDING ROUND-TRIP (≥1) ================

describe('audit-finding: round-trip preserves fields', () => {
  it('emit → serialize → parse yields equal-shape finding (consistent)', () => {
    const r: PlasticityRule = {
      ruleName: 'rt-ok',
      learningRate: 0.2,
      regularization: 0.5,
    };
    const f = wh.emitFinding(r);
    expect(f.type).toBe('consistent');
    expect(f.reasons).toEqual([]);
    const ser = wh.serializeFinding(f);
    const round = wh.parseFinding(ser);
    expect(round).not.toBeNull();
    expect(round!.findingId).toBe(f.findingId);
    expect(round!.type).toBe('consistent');
    expect(round!.rule.ruleName).toBe('rt-ok');
    expect(round!.rule.learningRate).toBeCloseTo(0.2, 12);
    expect(round!.rule.regularization).toBeCloseTo(0.5, 12);
  });

  it('inconsistent verdict enumerates reasons in the finding', () => {
    const r: PlasticityRule = { ruleName: 'too-hot', learningRate: 5 };
    const f = wh.emitFinding(r);
    expect(f.type).toBe('inconsistent');
    expect(f.reasons.length).toBeGreaterThan(0);
  });

  it('unaudited verdict when shape invalid (empty ruleName)', () => {
    const bad = { ruleName: '', learningRate: 0.1 } as PlasticityRule;
    const f = wh.emitFinding(bad);
    expect(f.type).toBe('unaudited');
    expect(f.reasons.length).toBeGreaterThan(0);
  });

  it('parseFinding returns null on bad JSON', () => {
    expect(wh.parseFinding('{not valid json')).toBeNull();
  });

  it('validateFinding rejects malformed payloads', () => {
    expect(wh.validateFinding(null)).toBe(false);
    expect(wh.validateFinding({})).toBe(false);
    expect(
      wh.validateFinding({
        findingId: 'x',
        type: 'bogus',
        timestamp: 't',
        reasons: [],
        rule: { ruleName: 'r', learningRate: 0.1 },
      }),
    ).toBe(false);
  });
});

// ================ CAPCOM PRESERVATION (≥1) ================

// Token-assembly prevents the regex probe itself from triggering false
// positives on its own source text — the forbidden tokens NEVER appear as
// literal substrings in this file.
const CAPCOM_FRAG = {
  s: 's' + 'k' + 'i' + 'l' + 'l',
  d: 'D' + 'A' + 'G',
  g: 'g' + 'a' + 't' + 'e',
  bypass: 'b' + 'y' + 'p' + 'a' + 's' + 's',
  ov: 'o' + 'v' + 'e' + 'r' + 'r' + 'i' + 'd' + 'e',
  capcom: 'c' + 'a' + 'p' + 'c' + 'o' + 'm',
  state: 's' + 't' + 'a' + 't' + 'e',
  mutate: 'm' + 'u' + 't' + 'a' + 't' + 'e',
  writeSk: 'w' + 'r' + 'i' + 't' + 'e' + 'S' + 'k' + 'i' + 'l' + 'l',
  library: 'L' + 'i' + 'b' + 'r' + 'a' + 'r' + 'y',
} as const;

function buildForbiddenGrepRegex(): RegExp {
  const { s, d, g, bypass, ov, capcom, state, mutate, writeSk, library } = CAPCOM_FRAG;
  const parts = [
    `${s}.?${d}`,
    `${g}_${bypass}`,
    `${g}_${ov}`,
    `${capcom}\\.?${state}`,
    `${mutate}Gate`,
    `${writeSk}${library}`,
  ];
  return new RegExp(parts.join('|'));
}

const WRITE_PATH_FRAG = {
  writeFile: 'w' + 'r' + 'i' + 't' + 'e' + 'F' + 'i' + 'l' + 'e',
  fsWrite: 'f' + 's' + '\\.' + 'w' + 'r' + 'i' + 't' + 'e',
  mkdir: 'm' + 'k' + 'd' + 'i' + 'r',
} as const;

function buildWritePathRegex(): RegExp {
  return new RegExp(`${WRITE_PATH_FRAG.writeFile}|${WRITE_PATH_FRAG.fsWrite}|${WRITE_PATH_FRAG.mkdir}`);
}

function walkTs(dir: string): string[] {
  const out: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === '__tests__') continue;
      out.push(...walkTs(full));
    } else if (e.isFile() && e.name.endsWith('.ts')) {
      out.push(full);
    }
  }
  return out;
}

describe('CAPCOM preservation: forbidden-token regex is empty across source', () => {
  it('no file under src/wasserstein-hebbian/ references any forbidden token', () => {
    const files = walkTs(SRC_DIR);
    const rx = buildForbiddenGrepRegex();
    for (const f of files) {
      const text = fs.readFileSync(f, 'utf8');
      expect(rx.test(text), `forbidden token in ${f}`).toBe(false);
    }
  });

  it('no file under src/wasserstein-hebbian/ contains write-path tokens (read-only audit)', () => {
    const files = walkTs(SRC_DIR);
    const rx = buildWritePathRegex();
    for (const f of files) {
      const text = fs.readFileSync(f, 'utf8');
      expect(rx.test(text), `write-path token in ${f}`).toBe(false);
    }
  });
});

// ================ DEFAULT-OFF BYTE-IDENTICAL (≥1) ================

describe('settings: default-off when config is absent or malformed', () => {
  it('isWassersteinHebbianEnabled returns false on non-existent path', () => {
    expect(
      wh.isWassersteinHebbianEnabled('/tmp/definitely-not-a-real-file-wh.json'),
    ).toBe(false);
  });

  it('readWassersteinHebbianConfig returns default-disabled on malformed JSON', () => {
    const tmp = path.join(os.tmpdir(), `wh-bad-${Date.now()}.json`);
    fs.writeFileSync(tmp, '{ not valid json');
    try {
      expect(wh.readWassersteinHebbianConfig(tmp).enabled).toBe(false);
    } finally {
      fs.unlinkSync(tmp);
    }
  });

  it('flag-absent and flag-false fixtures produce equivalent readConfig output', () => {
    const absent = writeFixture({ 'gsd-skill-creator': { 'mathematical-foundations': {} } });
    const off = writeFixture({
      'gsd-skill-creator': {
        'mathematical-foundations': { 'wasserstein-hebbian': { enabled: false } },
      },
    });
    try {
      const a = wh.readWassersteinHebbianConfig(absent);
      const b = wh.readWassersteinHebbianConfig(off);
      expect(a).toEqual(b);
      expect(a.enabled).toBe(false);
      // No observable side effects from the import; surface remains callable.
      expect(typeof wh.w2SquaredGaussian).toBe('function');
      expect(typeof wh.checkBoundedVariance).toBe('function');
      expect(typeof wh.validatePlasticityRule).toBe('function');
      expect(typeof wh.inStableRegion).toBe('function');
      expect(typeof wh.emitFinding).toBe('function');
    } finally {
      fs.unlinkSync(absent);
      fs.unlinkSync(off);
    }
  });

  it('opt-in fixture flips flag to true', () => {
    const p = writeFixture({
      'gsd-skill-creator': {
        'mathematical-foundations': {
          'wasserstein-hebbian': { enabled: true, varianceThreshold: 50 },
        },
      },
    });
    try {
      expect(wh.isWassersteinHebbianEnabled(p)).toBe(true);
      const cfg = wh.readWassersteinHebbianConfig(p);
      expect(cfg.enabled).toBe(true);
      expect(cfg.varianceThreshold).toBe(50);
    } finally {
      fs.unlinkSync(p);
    }
  });
});
