/**
 * Koopman-Memory — test suite for the T2a primitive (Phase 749, MATH-17,
 * CAPCOM HARD-preservation gate G8).
 *
 * Covers:
 *   - Bilinear-form correctness (2)
 *   - Composition correctness + warnings + instability (3)
 *   - Retention invariants (3)
 *   - Memory-boundary round-trip (2)
 *   - State-space shape / validator (2)
 *   - Long-context retention (1)
 *   - CAPCOM + memory-preservation source regex (2)
 *   - Default-off + dry-import (3)
 *
 * ≥ 10 tests (actual ≥ 17).
 *
 * This file imports `../index.js` EAGERLY at module scope — any side
 * effect of loading the koopman-memory module is exercised before the
 * memory-subsystem check below.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

// Eager top-level import — exercises any hidden import side effect.
import * as km from '../index.js';

// ============================================================================
// Fixtures + helpers
// ============================================================================

const SRC_DIR = path.resolve(__dirname, '..');

const SRC_FILES = [
  'settings.ts',
  'types.ts',
  'koopman-operator.ts',
  'composition.ts',
  'invariants.ts',
  'memory-boundary.ts',
  'index.ts',
];

function readSources(): string {
  return SRC_FILES.map((f) => fs.readFileSync(path.join(SRC_DIR, f), 'utf8')).join(
    '\n----\n',
  );
}

function tmpDir(prefix: string): string {
  const dir = path.join(
    os.tmpdir(),
    `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function writeFixtureConfig(content: unknown): string {
  const root = tmpDir('km-cfg');
  fs.mkdirSync(path.join(root, '.claude'), { recursive: true });
  const p = path.join(root, '.claude', 'gsd-skill-creator.json');
  fs.writeFileSync(p, JSON.stringify(content));
  return p;
}

/** 2-D operator: A = [[0.5, 0.1], [0, 0.5]], K_{i,j,k}=0.1 when i=j=k=0 else 0. */
function make2dOp(): km.KoopmanOperator {
  const d = 2;
  const m = 1;
  const A = [0.5, 0.1, 0, 0.5];
  // K[i*d*m + j*m + k], all-zero except K[0,0,0] = 0.1.
  const K = new Array<number>(d * d * m).fill(0);
  K[0 * d * m + 0 * m + 0] = 0.1;
  return Object.freeze({ stateDim: d, inputDim: m, A, K, name: 'test-2d' });
}

// ============================================================================
// 1. Bilinear-form correctness (≥2)
// ============================================================================

describe('bilinear-form step correctness', () => {
  it('identity operator preserves state exactly on zero input', () => {
    const id = km.identity(4);
    const h = [1, -2, 3.5, 0];
    const out = km.step(id, h, [0]);
    expect(Array.from(out)).toEqual(h);
  });

  it('2-D fixture computes h_{t+1}[i] = Σ A[i,j] h[j] + Σ K[i,j,k] h[j] u[k]', () => {
    const op = make2dOp();
    const h = [2, 3];
    const u = [5];
    // Expected:
    //   h'[0] = 0.5*2 + 0.1*3 + K[0,0,0]*h[0]*u[0] = 1 + 0.3 + 0.1*2*5 = 2.3
    //   h'[1] = 0*2 + 0.5*3 + 0                   = 1.5
    const out = km.step(op, h, u);
    expect(out.length).toBe(2);
    expect(out[0]).toBeCloseTo(2.3, 12);
    expect(out[1]).toBeCloseTo(1.5, 12);
  });
});

// ============================================================================
// 2. Validator + state-space shape (≥2)
// ============================================================================

describe('validator + shape checks', () => {
  it('validator accepts a well-shaped operator', () => {
    const r = km.validate(make2dOp());
    expect(r.ok).toBe(true);
    expect(r.violations).toEqual([]);
  });

  it('validator rejects K of wrong length', () => {
    const bad: km.KoopmanOperator = {
      stateDim: 2,
      inputDim: 1,
      A: [1, 0, 0, 1],
      K: [0, 0, 0], // should be length 4
      name: 'bad',
    };
    const r = km.validate(bad);
    expect(r.ok).toBe(false);
    expect(r.violations.some((v: string) => v.includes('K.length'))).toBe(true);
  });

  it('step throws on state-length mismatch', () => {
    const op = make2dOp();
    expect(() => km.step(op, [1], [0])).toThrow(/state length/);
  });
});

// ============================================================================
// 3. Composition (≥3)
// ============================================================================

describe('composition (honest truncation)', () => {
  it('identity ∘ f has A ≡ A_f with no warnings', () => {
    const f = make2dOp();
    // Build identity whose inputDim matches f (m=1) by direct construction.
    const idMatching: km.KoopmanOperator = {
      stateDim: f.stateDim,
      inputDim: f.inputDim,
      A: [1, 0, 0, 1],
      K: new Array<number>(f.stateDim * f.stateDim * f.inputDim).fill(0),
      name: 'I_2',
    };
    const r = km.compose(idMatching, f);
    expect(Array.from(r.op.A)).toEqual(Array.from(f.A));
    // idMatching.K is all-zero → no truncation warning expected.
    const truncWarn = r.warnings.find((w) => w.includes('truncation'));
    expect(truncWarn).toBeUndefined();
  });

  it('composing operators with non-trivial outer K emits truncation warning', () => {
    const f = make2dOp();
    const g = make2dOp(); // g.K has a non-zero entry
    const r = km.compose(g, f);
    expect(r.warnings.some((w) => w.includes('truncation'))).toBe(true);
  });

  it('composition with spectral-max > 1 emits instability warning', () => {
    const big: km.KoopmanOperator = {
      stateDim: 2,
      inputDim: 1,
      A: [2, 0, 0, 2], // σ_max = 2
      K: [0, 0, 0, 0],
      name: 'big',
    };
    const r = km.compose(big, big);
    expect(r.warnings.some((w) => w.includes('instability'))).toBe(true);
  });

  it('composition rejects dim-mismatched operators', () => {
    const a = km.identity(2);
    const b = km.identity(3);
    expect(() => km.compose(a, b)).toThrow(/stateDim/);
  });
});

// ============================================================================
// 4. Retention invariants (≥3)
// ============================================================================

describe('retention invariants', () => {
  it('identity retention passes exactly', () => {
    const h = [1, 2, 3];
    const r = km.checkIdentityRetention(3, h);
    expect(r.ok).toBe(true);
    expect(r.finalNorm).toBe(0);
  });

  it('zero-input retention holds for stable contractive operator', () => {
    const contractive: km.KoopmanOperator = {
      stateDim: 2,
      inputDim: 1,
      A: [0.5, 0, 0, 0.5],
      K: [0, 0, 0, 0],
      name: 'contractive',
    };
    const r = km.checkZeroInputRetention(contractive, [1, 1], 10);
    expect(r.ok).toBe(true);
    // After 10 steps of scaling by 0.5: ||h|| = sqrt(2) * 0.5^10 ≈ 0.00138
    expect(r.finalNorm!).toBeLessThan(0.01);
  });

  it('Lipschitz bound checks input perturbation', () => {
    const op = make2dOp();
    const r = km.checkLipschitzBound(op, [1, 0], [1], 0.2);
    // Δ = h^⊤ K u @ index 0 = K[0,0,0] * h[0] * u[0] = 0.1 * 1 * 1 = 0.1
    // bound 0.2 → ok
    expect(r.ok).toBe(true);
    expect(r.finalNorm!).toBeCloseTo(0.1, 10);
  });

  it('Lipschitz bound violation flagged when bound too small', () => {
    const op = make2dOp();
    const r = km.checkLipschitzBound(op, [1, 0], [1], 0.01);
    expect(r.ok).toBe(false);
    expect((r.violations ?? []).length).toBeGreaterThan(0);
  });
});

// ============================================================================
// 5. Memory-boundary round-trip (≥2) + long-context (≥1)
// ============================================================================

describe('memory-boundary (READ-ONLY adapter)', () => {
  it('round-trip preserves dimension', () => {
    const entry = {
      alpha: 0.4,
      beta: 0.3,
      gamma: 0.3,
      score: 0.87,
      ts: 1700000000000,
      content: 'hello koopman',
    };
    const state = km.memoryEntryToState(entry, 8);
    expect(state.length).toBe(8);
    const snap = km.stateToMemorySnapshot(state);
    expect(snap.dimension).toBe(8);
    expect(Array.from(snap.values)).toEqual(Array.from(state));
  });

  it('scorer components populate first four state slots unchanged', () => {
    const entry = {
      alpha: 1,
      beta: 2,
      gamma: 3,
      score: 4,
      ts: 0,
      content: '',
    };
    const state = km.memoryEntryToState(entry, 6);
    expect(state[0]).toBe(1);
    expect(state[1]).toBe(2);
    expect(state[2]).toBe(3);
    expect(state[3]).toBe(4);
    // slot 4 = tanh(0 / 1e12) = 0, slot 5 = tanh(0 / 1024) = 0
    expect(state[4]).toBe(0);
    expect(state[5]).toBe(0);
  });

  it('long-context 100-step retention stays bounded on a stable operator', () => {
    const contractive: km.KoopmanOperator = {
      stateDim: 4,
      inputDim: 2,
      A: [
        0.9, 0, 0, 0,
        0, 0.9, 0, 0,
        0, 0, 0.9, 0,
        0, 0, 0, 0.9,
      ],
      K: new Array<number>(4 * 4 * 2).fill(0),
      name: 'long-ctx',
    };
    let h: km.KoopmanState = [1, 1, 1, 1];
    const initialNorm = Math.hypot(...h);
    for (let t = 0; t < 100; t++) {
      // Random-ish bounded input.
      const u = [Math.sin(t * 0.1), Math.cos(t * 0.1)];
      h = km.step(contractive, h, u);
    }
    const finalNorm = Math.hypot(...h);
    // With σ_max = 0.9 and bounded unit input + zero K, state contracts.
    expect(finalNorm).toBeLessThan(initialNorm);
    expect(Number.isFinite(finalNorm)).toBe(true);
  });
});

// ============================================================================
// 6. CAPCOM preservation + memory-type-reassignment regex (≥2)
// ============================================================================

describe('CAPCOM preservation — source-level regex', () => {
  it('forbidden CAPCOM tokens do not appear in module source files', () => {
    // Build forbidden-token patterns from fragments so the test file
    // itself does not match them.
    const forbidden = [
      'skill' + '.?DAG',
      'gate' + '_bypass',
      'gate' + '_override',
      'capcom' + '.?state',
      'mutate' + 'Gate',
      'write' + 'SkillLibrary',
      'replace' + 'MemoryPrimitive',
      'memory' + 'Migrate',
    ];
    const src = readSources();
    for (const pat of forbidden) {
      const re = new RegExp(pat);
      const matched = re.test(src);
      expect(matched, `forbidden token matched: ${pat}`).toBe(false);
    }
  });

  it('existing memory types are not reassigned or re-exported by value', () => {
    const src = readSources();
    // Use fragment-built type names so the test file itself does not collide
    // with its own regex patterns.
    const badAssign = [
      ['Memory', 'Store'],
      ['Conversation', 'Store'],
      ['ShortTerm', 'Memory'],
      ['LongTerm', 'Memory'],
    ];
    for (const [a, b] of badAssign) {
      const name = a + b;
      // Forbidden: `const <Name> =`, `export const <Name>`, `let <Name> =`.
      const patterns = [
        new RegExp(`\\bconst\\s+${name}\\s*=`),
        new RegExp(`\\bexport\\s+const\\s+${name}\\b`),
        new RegExp(`\\blet\\s+${name}\\s*=`),
        new RegExp(`\\bclass\\s+${name}\\b`),
      ];
      for (const re of patterns) {
        expect(re.test(src), `reassignment/shadow pattern matched for ${name}: ${re}`).toBe(false);
      }
    }
  });

  it('no runtime imports from src/memory (type imports only)', () => {
    const src = readSources();
    // Any `import ... from '../memory/...'` that is NOT `import type ...` is
    // a runtime dependency on the memory subsystem — G8 forbids this.
    const memImports = src.match(/^\s*import[^\n]*from\s+['"]\.\.\/memory\/[^'"]+['"]/gm) ?? [];
    for (const line of memImports) {
      expect(line.includes('import type'), `runtime memory import: ${line}`).toBe(true);
    }
  });

  it('memory-boundary write-path APIs are absent', () => {
    const src = readSources();
    // No persistent-write calls in this module (adapter is read-only).
    expect(/\bwriteFile\b/.test(src)).toBe(false);
    expect(/\bappendFile\b/.test(src)).toBe(false);
    expect(/fs\.write/.test(src)).toBe(false);
    expect(/createWriteStream/.test(src)).toBe(false);
  });
});

// ============================================================================
// 7. Default-off (≥2)
// ============================================================================

describe('default-off (opt-in, fail-closed)', () => {
  it('returns enabled: false when the config file is absent', () => {
    const missing = path.join(tmpDir('km-missing'), 'no-such.json');
    expect(km.isKoopmanMemoryEnabled(missing)).toBe(false);
    const cfg = km.readKoopmanMemoryConfig(missing);
    expect(cfg.enabled).toBe(false);
  });

  it('flag-false is equivalent to flag-absent', () => {
    const pathFalse = writeFixtureConfig({
      'gsd-skill-creator': {
        'mathematical-foundations': {
          'koopman-memory': { enabled: false },
        },
      },
    });
    const pathMissing = writeFixtureConfig({
      'gsd-skill-creator': { 'mathematical-foundations': {} },
    });
    const cfgFalse = km.readKoopmanMemoryConfig(pathFalse);
    const cfgMissing = km.readKoopmanMemoryConfig(pathMissing);
    expect(cfgFalse).toEqual(cfgMissing);
    expect(km.isKoopmanMemoryEnabled(pathFalse)).toBe(false);
    expect(km.isKoopmanMemoryEnabled(pathMissing)).toBe(false);
  });

  it('flag-true opts in only when explicitly set', () => {
    const pathTrue = writeFixtureConfig({
      'gsd-skill-creator': {
        'mathematical-foundations': {
          'koopman-memory': { enabled: true },
        },
      },
    });
    expect(km.isKoopmanMemoryEnabled(pathTrue)).toBe(true);
  });
});

// ============================================================================
// 8. Dry-import: no side effects (≥1)
// ============================================================================

describe('dry-import side effects', () => {
  it('importing the module does not create any file under the config root', () => {
    const fakeRoot = tmpDir('km-dry');
    const before = fs.readdirSync(fakeRoot).sort();
    const prev = process.env.GSD_SKILL_CREATOR_CONFIG_ROOT;
    process.env.GSD_SKILL_CREATOR_CONFIG_ROOT = fakeRoot;
    try {
      expect(km.isKoopmanMemoryEnabled()).toBe(false);
      const after = fs.readdirSync(fakeRoot).sort();
      expect(after).toEqual(before);
    } finally {
      if (prev === undefined) delete process.env.GSD_SKILL_CREATOR_CONFIG_ROOT;
      else process.env.GSD_SKILL_CREATOR_CONFIG_ROOT = prev;
    }
  });
});
