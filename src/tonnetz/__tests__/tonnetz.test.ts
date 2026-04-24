/**
 * Tonnetz — T3 primitive tests (MATH-20, Phase 752).
 *
 * Verifies:
 *   - Triad construction + quality inference
 *   - Neo-Riemannian P/L/R transforms against canonical reference values
 *   - 24-triad lattice has correct size
 *   - Combinatorial-geometry operations (distance, triangle, fundamental domain)
 *   - 360-species × 360-musicians unit-circle mapping round-trip + coverage
 *   - CAPCOM preservation (forbidden-token source grep; write-path grep)
 *   - Default-off behavior
 */

import { describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  applyTransform,
  buildStandardTonnetz,
  majorTriad,
  makeTriad,
  minorTriad,
} from '../lattice.js';
import {
  chordTriangle,
  fundamentalDomain,
  tonnetzDistance,
} from '../combinatorial-geometry.js';
import {
  SOPS_CATALOGUE_SIZE,
  SOPS_THETA_STEP,
  buildSoPSMapping,
  placeOnUnitCircle,
  sharedChord,
  thetaToPitchClass,
} from '../sops-mapping.js';
import { isTonnetzEnabled, readTonnetzConfig } from '../settings.js';

// ---------------------------------------------------------------------------
// 1. Triad construction
// ---------------------------------------------------------------------------

describe('tonnetz — triad construction', () => {
  it('C-major triad {0,4,7} has quality "major"', () => {
    const c = makeTriad([0, 4, 7]);
    expect(c.quality).toBe('major');
    expect(c.notes).toEqual([0, 4, 7]);
  });

  it('C-minor triad {0,3,7} has quality "minor"', () => {
    const c = makeTriad([0, 3, 7]);
    expect(c.quality).toBe('minor');
  });

  it('diminished and augmented triads inferred', () => {
    expect(makeTriad([0, 3, 6]).quality).toBe('diminished');
    expect(makeTriad([0, 4, 8]).quality).toBe('augmented');
  });
});

// ---------------------------------------------------------------------------
// 2. Neo-Riemannian P/L/R transforms (canonical reference values)
// ---------------------------------------------------------------------------

describe('tonnetz — neo-Riemannian transforms', () => {
  it('P(C-major) = C-minor {0,3,7}', () => {
    const p = applyTransform(majorTriad(0), 'P');
    expect(p.quality).toBe('minor');
    expect(p.notes).toEqual([0, 3, 7]);
  });

  it('R(C-major) = A-minor (root 9) {9,0,4}', () => {
    const r = applyTransform(majorTriad(0), 'R');
    expect(r.quality).toBe('minor');
    expect(r.notes).toEqual([9, 0, 4]);
  });

  it('L(C-major) = E-minor (root 4) {4,7,11}', () => {
    const l = applyTransform(majorTriad(0), 'L');
    expect(l.quality).toBe('minor');
    expect(l.notes).toEqual([4, 7, 11]);
  });

  it('each transform is an involution', () => {
    const base = majorTriad(0);
    for (const op of ['P', 'L', 'R'] as const) {
      const twice = applyTransform(applyTransform(base, op), op);
      expect(twice.quality).toBe(base.quality);
      expect(twice.notes).toEqual(base.notes);
    }
  });
});

// ---------------------------------------------------------------------------
// 3. Standard Tonnetz lattice
// ---------------------------------------------------------------------------

describe('tonnetz — standard lattice', () => {
  it('has 24 triads (12 major + 12 minor)', () => {
    const L = buildStandardTonnetz();
    expect(L.triads.length).toBe(24);
    const majors = L.triads.filter((t) => t.quality === 'major');
    const minors = L.triads.filter((t) => t.quality === 'minor');
    expect(majors.length).toBe(12);
    expect(minors.length).toBe(12);
  });

  it('every triad has all three P/L/R edges', () => {
    const L = buildStandardTonnetz();
    for (let i = 0; i < L.triads.length; i++) {
      const inner = L.edges.get(i);
      expect(inner).toBeDefined();
      expect(inner!.has('P')).toBe(true);
      expect(inner!.has('L')).toBe(true);
      expect(inner!.has('R')).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// 4. Combinatorial geometry
// ---------------------------------------------------------------------------

describe('tonnetz — combinatorial geometry', () => {
  it('tonnetzDistance(C-major, C-major) = 0', () => {
    const L = buildStandardTonnetz();
    expect(tonnetzDistance(L, majorTriad(0), majorTriad(0))).toBe(0);
  });

  it('tonnetzDistance(C-major, C-minor) = 1 via P', () => {
    const L = buildStandardTonnetz();
    expect(tonnetzDistance(L, majorTriad(0), minorTriad(0))).toBe(1);
  });

  it('tonnetzDistance(C-major, G-major) finite and ≤ 4', () => {
    const L = buildStandardTonnetz();
    const d = tonnetzDistance(L, majorTriad(0), majorTriad(7));
    expect(Number.isFinite(d)).toBe(true);
    expect(d).toBeLessThanOrEqual(4);
    expect(d).toBeGreaterThan(0);
  });

  it('chordTriangle recognizes a P-then-R-then-(back) triangle', () => {
    const L = buildStandardTonnetz();
    const a = majorTriad(0);
    const b = applyTransform(a, 'P'); // C-minor
    const c = applyTransform(a, 'R'); // A-minor
    // a↔b via P, a↔c via R — but b↔c is not a direct P/L/R neighbour in the
    // standard Tonnetz (both are minor; P/L/R all flip quality). Expect
    // valid=false when one edge is missing.
    const tri = chordTriangle(L, a, b, c);
    expect(tri.valid).toBe(false);
  });

  it('fundamentalDomain returns 2 triads (one major, one minor)', () => {
    const L = buildStandardTonnetz();
    const fd = fundamentalDomain(L);
    expect(fd.length).toBe(2);
    const qualities = fd.map((t) => t.quality).sort();
    expect(qualities).toEqual(['major', 'minor']);
  });
});

// ---------------------------------------------------------------------------
// 5. Sound of Puget Sound unit-circle mapping
// ---------------------------------------------------------------------------

describe('tonnetz — SoPS unit-circle mapping', () => {
  const speciesNames = Array.from({ length: SOPS_CATALOGUE_SIZE }, (_, i) =>
    `species-${String(i + 1).padStart(3, '0')}`,
  );
  const musicianNames = Array.from({ length: SOPS_CATALOGUE_SIZE }, (_, i) =>
    `musician-${String(i + 1).padStart(3, '0')}`,
  );

  it('placeOnUnitCircle with 360 names yields 360 entities at θ = i * 2π / 360', () => {
    const placed = placeOnUnitCircle(speciesNames, 'species');
    expect(placed.length).toBe(360);
    for (let i = 0; i < 360; i++) {
      expect(placed[i].position.theta).toBeCloseTo(i * SOPS_THETA_STEP, 10);
      expect(placed[i].kind).toBe('species');
      expect(placed[i].name).toBe(speciesNames[i]);
    }
  });

  it('placeOnUnitCircle rejects non-360 lengths', () => {
    expect(() => placeOnUnitCircle(['a', 'b'], 'species')).toThrow();
    expect(() =>
      placeOnUnitCircle(Array.from({ length: 359 }, () => 'x'), 'musician'),
    ).toThrow();
  });

  it('thetaToPitchClass produces 30° wedges across 12 pitch classes', () => {
    expect(thetaToPitchClass(0)).toBe(0);
    expect(thetaToPitchClass(Math.PI / 6)).toBe(1); // 30°
    expect(thetaToPitchClass(Math.PI)).toBe(6); // 180°
    expect(thetaToPitchClass(2 * Math.PI - 1e-12)).toBe(11);
  });

  it('360×360 coverage: every shared-θ (species, musician) pair returns a valid chord', () => {
    const L = buildStandardTonnetz();
    const mapping = buildSoPSMapping(speciesNames, musicianNames);
    expect(mapping.species.length).toBe(360);
    expect(mapping.musicians.length).toBe(360);
    for (let i = 0; i < 360; i++) {
      const chord = sharedChord(
        mapping.species[i].position,
        mapping.musicians[i].position,
        L,
      );
      expect(chord).not.toBeNull();
      expect(chord!.quality).toBe('major');
    }
  });

  it('sharedChord returns null when θ values disagree beyond epsilon', () => {
    const L = buildStandardTonnetz();
    const a = { theta: 0 };
    const b = { theta: 1.0 };
    expect(sharedChord(a, b, L)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 6. CAPCOM preservation (static source grep)
// ---------------------------------------------------------------------------

describe('tonnetz — CAPCOM preservation', () => {
  const srcDir = path.join(process.cwd(), 'src', 'tonnetz');

  it('contains no forbidden CAPCOM-bypass tokens in source', () => {
    const forbidden = /skill.?DAG|gate_bypass|gate_override|capcom.?state|mutateGate|writeSkillLibrary/i;
    const files = fs.readdirSync(srcDir).filter((f) => f.endsWith('.ts'));
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) {
      const contents = fs.readFileSync(path.join(srcDir, f), 'utf8');
      expect(contents).not.toMatch(forbidden);
    }
  });

  it('contains no write-path calls in module source (fs.write* / mkdir)', () => {
    const write = /fs\.write|fs\.mkdir|writeFileSync|mkdirSync/;
    // Module source excludes this __tests__ directory.
    const files = fs.readdirSync(srcDir).filter((f) => f.endsWith('.ts'));
    for (const f of files) {
      const contents = fs.readFileSync(path.join(srcDir, f), 'utf8');
      expect(contents).not.toMatch(write);
    }
  });
});

// ---------------------------------------------------------------------------
// 7. Default-off behavior
// ---------------------------------------------------------------------------

describe('tonnetz — default-off (fail-closed)', () => {
  function withTmpRoot(writeJson: (p: string) => void): boolean {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tonnetz-settings-'));
    try {
      const claudeDir = path.join(tmp, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      const cfg = path.join(claudeDir, 'gsd-skill-creator.json');
      writeJson(cfg);
      return isTonnetzEnabled(cfg);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  }

  it('returns false when config file is absent', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tonnetz-absent-'));
    try {
      const nonexistent = path.join(tmp, 'no-file.json');
      expect(isTonnetzEnabled(nonexistent)).toBe(false);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('returns false when mathematical-foundations block is absent', () => {
    const result = withTmpRoot((p) => fs.writeFileSync(p, '{}'));
    expect(result).toBe(false);
  });

  it('returns false when tonnetz.enabled is explicitly false', () => {
    const result = withTmpRoot((p) =>
      fs.writeFileSync(
        p,
        JSON.stringify({
          'gsd-skill-creator': {
            'mathematical-foundations': { tonnetz: { enabled: false } },
          },
        }),
      ),
    );
    expect(result).toBe(false);
  });

  it('returns true only when explicitly opted in', () => {
    const result = withTmpRoot((p) =>
      fs.writeFileSync(
        p,
        JSON.stringify({
          'gsd-skill-creator': {
            'mathematical-foundations': { tonnetz: { enabled: true } },
          },
        }),
      ),
    );
    expect(result).toBe(true);
  });

  it('default config exposes enabled:false', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tonnetz-default-'));
    try {
      const nonexistent = path.join(tmp, 'missing.json');
      expect(readTonnetzConfig(nonexistent).enabled).toBe(false);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
