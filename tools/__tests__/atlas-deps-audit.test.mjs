/**
 * atlas-deps-audit.mjs — vitest invariant tests (v1.49.607 W4a)
 *
 * 6 cases:
 *   1. Clean atlas surface passes (PASS + exit 0)
 *   2. Fixture with introduced bare-import fails with clear message
 *   3. Fixture with allowed cross-tree import passes
 *   4. --json mode produces parseable JSON
 *   5. --strict alias (same behavior as default on violation: exit 1)
 *   6. Live regression: the real atlas tree passes the audit (guards the
 *      CROSS_TREE_ALLOW_PATTERNS allowlist against drift; ADR-0003 acceptance test)
 *
 * Cases 1-5 are hermetic (tmp dirs with synthesized .ts fixtures). Cases 2/5
 * deliberately trigger a violation and assert the `FAIL` message on stderr; that
 * stderr is captured into err.stderr (NOT echoed to the vitest console) via
 * stdio:pipe in runAudit — the un-piped echo caused a false-alarm ship mis-read at
 * v1.49.914 (see docs/test-discipline/flake-audit-2026-05-30.md). Case 6 is
 * intentionally NON-hermetic — it scans the live src/atlas +
 * desktop/intelligence/atlas surfaces against the real package.json baseline.
 * Run via: npx vitest run --config vitest.tools.config.mjs
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = join(HERE, '..', 'atlas-deps-audit.mjs');
// The actual repo root (used to read real package.json for baseline deps)
const REPO_ROOT = join(HERE, '..', '..');

let tmpRoot;

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'atlas-audit-test-'));
});

afterEach(() => {
  try { rmSync(tmpRoot, { recursive: true, force: true }); } catch {}
});

/**
 * Run the audit script against a synthetic repo laid out in tmpRoot.
 * Returns { stdout, stderr, exitCode }.
 */
function runAudit(extraArgs = '', env = {}) {
  // We need to run against the actual REPO_ROOT package.json (for baseline deps)
  // but override atlas surface paths.
  // The script reads REPO_ROOT from its own __dirname, so we pass --root override.
  const cmd = `node "${SCRIPT_PATH}" --root "${REPO_ROOT}" --atlas-root "${tmpRoot}" ${extraArgs}`;
  try {
    // stdio: pipe stderr (not inherit) so the negative-path cases' expected
    // `atlas-deps-audit: FAIL …` line lands in err.stderr for assertions WITHOUT
    // leaking to the vitest console (that leak read as a real failure during the
    // v1.49.914 ship — see docs/test-discipline/flake-audit-2026-05-30.md).
    const stdout = execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, ...env } });
    return { stdout, stderr: '', exitCode: 0 };
  } catch (err) {
    return {
      stdout: err.stdout ?? '',
      stderr: err.stderr ?? '',
      exitCode: err.status ?? 1,
    };
  }
}

/**
 * Write a synthetic .ts file to tmpRoot/src/atlas/... and return the path.
 */
function writeAtlasFile(relPath, content) {
  const full = join(tmpRoot, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content, 'utf8');
  return full;
}

// ── helpers ──────────────────────────────────────────────────────────────────
function dirname2(p) {
  return p.split('/').slice(0, -1).join('/');
}

// ── Case 1: clean atlas surface passes ───────────────────────────────────────
describe('atlas-deps-audit', () => {
  it('passes when atlas surface has only relative + vitest imports', () => {
    writeAtlasFile('src/atlas/scales/linear.ts', `
export function linearScale(domain: [number, number], range: [number, number]) {
  return (v: number) => v;
}
`);
    writeAtlasFile('src/atlas/scales/__tests__/scales.test.ts', `
import { describe, it, expect } from 'vitest';
import { linearScale } from '../linear.js';
describe('scales', () => {
  it('works', () => { expect(linearScale([0,1],[0,100])(0.5)).toBe(0.5); });
});
`);
    const { exitCode, stdout } = runAudit();
    expect(exitCode).toBe(0);
    expect(stdout).toContain('PASS');
  });

  // ── Case 2: bare-import fails with clear message ─────────────────────────
  it('fails and prints file:line when a bare bare-module import is introduced', () => {
    writeAtlasFile('src/atlas/graph-renderer/bad.ts', `
import someExternalLib from 'some-unknown-package-xyz';
export function bad() { return someExternalLib; }
`);
    const { exitCode, stderr } = runAudit('--strict');
    expect(exitCode).toBe(1);
    expect(stderr).toContain('FAIL');
    expect(stderr).toContain('some-unknown-package-xyz');
    expect(stderr).toContain('BARE_VIOLATION');
  });

  // ── Case 3: allowed cross-tree import passes ──────────────────────────────
  it('allows W1 substrate cross-tree imports (src/intelligence/types.js)', () => {
    writeAtlasFile('desktop/intelligence/atlas/symbol-graph/filter-pipeline.ts', `
import type { AtlasSymbol } from '../../../../src/intelligence/types.js';
export function filter(s: AtlasSymbol) { return s; }
`);
    const { exitCode, stdout } = runAudit();
    expect(exitCode).toBe(0);
    expect(stdout).toContain('PASS');
  });

  // ── Case 4: --json mode produces parseable JSON ───────────────────────────
  it('--json mode produces parseable JSON with expected shape', () => {
    writeAtlasFile('src/atlas/scales/ok.ts', `
export const x = 1;
`);
    const { exitCode, stdout } = runAudit('--json');
    expect(exitCode).toBe(0);
    let parsed;
    expect(() => { parsed = JSON.parse(stdout); }).not.toThrow();
    expect(parsed).toHaveProperty('pass', true);
    expect(parsed).toHaveProperty('violations', 0);
    expect(parsed).toHaveProperty('scanned');
    expect(Array.isArray(parsed.results)).toBe(true);
  });

  // ── Case 5: --strict alias ────────────────────────────────────────────────
  it('--strict alias exits 1 on violation (same behavior as default)', () => {
    writeAtlasFile('src/atlas/pack-layout/bad2.ts', `
import lodash from 'lodash';
export const cloneDeep = lodash.cloneDeep;
`);
    const withStrict    = runAudit('--strict');
    const withoutStrict = runAudit();
    // Both should fail with exit 1
    expect(withStrict.exitCode).toBe(1);
    expect(withoutStrict.exitCode).toBe(1);
    expect(withStrict.stderr).toContain('lodash');
  });

  // ── Case 6: live regression — real atlas tree passes the audit ────────────
  // NON-hermetic by design: scans the actual src/atlas + desktop/intelligence/atlas
  // surfaces (no --atlas-root override) against the real package.json baseline. This
  // is the ADR-0003 acceptance test (docs/adr/0003-atlas-clean-room-policy.md §
  // Verification) wired into the gate+CI-enforced tools suite. It locks the live
  // CROSS_TREE_ALLOW_PATTERNS allowlist: a new un-allowlisted cross-tree import (e.g.
  // a future security-chokepoint wire) or a new external atlas dep fails loudly here.
  // Regression target: the v1.49.905 LoaderContext wire in spatial/pmtiles-reader.ts
  // went un-allowlisted until v1.49.915 — the audit reported a false-positive
  // violation because nothing gate-ran it against the real tree.
  it('the live atlas tree passes the audit (guards CROSS_TREE_ALLOW_PATTERNS against drift)', () => {
    const stdout = execSync(`node "${SCRIPT_PATH}" --json`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const parsed = JSON.parse(stdout);
    expect(
      parsed.pass,
      `atlas-deps-audit found ${parsed.violations} live violation(s): ` +
        `${JSON.stringify(parsed.results)} — either allowlist a legitimate in-tree ` +
        `primitive in CROSS_TREE_ALLOW_PATTERNS (ADR-0003 cat. b) or remove the ` +
        `external dep from the atlas surface.`,
    ).toBe(true);
    expect(parsed.violations).toBe(0);
  });
});
