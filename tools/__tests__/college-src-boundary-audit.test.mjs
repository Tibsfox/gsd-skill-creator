/**
 * college-src-boundary-audit.mjs — vitest invariant tests (v1.49.930)
 *
 * 6 cases (sibling shape to atlas-deps-audit.test.mjs):
 *   1. Clean .college surface passes (PASS + exit 0)
 *   2. Fixture with an introduced .college/->src/ relative import fails with a
 *      clear file:line + CROSS_ROOTDIR_VIOLATION message
 *   3. Fixture with a bare 'src/...' import fails (the tsconfig-paths reach)
 *   4. --json mode produces parseable JSON
 *   5. --strict alias (same behavior as default on violation: exit 1)
 *   6. Live regression: the real .college/ tree passes the audit. This is the
 *      standing #10436 detector layer + #10461 Layer-2 drift-guard — it locks the
 *      .college/->src/ boundary clean (the v1.49.929 recon found exactly one
 *      violation, runbook-interface.ts, removed in v1.49.930 CF1a).
 *
 * Cases 1-5 are hermetic (tmp dirs). Cases 2/3/5 deliberately trigger a violation
 * and assert the `FAIL` message on stderr; that stderr is captured into err.stderr
 * (NOT echoed to the vitest console) via stdio:['ignore','pipe','pipe'] in
 * runAudit — the un-piped echo caused a false-alarm ship mis-read at v1.49.914
 * (see docs/test-discipline/flake-audit-2026-05-30.md). Case 6 is intentionally
 * NON-hermetic.
 *
 * Run via: npx vitest run --config vitest.tools.config.mjs
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = join(HERE, '..', 'college-src-boundary-audit.mjs');
const REPO_ROOT = join(HERE, '..', '..');

let tmpRoot;

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'college-src-audit-test-'));
});

afterEach(() => {
  try { rmSync(tmpRoot, { recursive: true, force: true }); } catch {}
});

/**
 * Run the audit script against a synthetic .college tree laid out under
 * tmpRoot/.college/. Returns { stdout, stderr, exitCode }.
 */
function runAudit(extraArgs = '', env = {}) {
  const collegeRoot = join(tmpRoot, '.college');
  const cmd = `node "${SCRIPT_PATH}" --root "${tmpRoot}" --college-root "${collegeRoot}" ${extraArgs}`;
  try {
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
 * Write a synthetic .ts file under tmpRoot/.college/... and return the path.
 */
function writeCollegeFile(relPath, content) {
  const full = join(tmpRoot, '.college', relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content, 'utf8');
  return full;
}

describe('college-src-boundary-audit', () => {
  // ── Case 1: clean .college surface passes ──────────────────────────────────
  it('passes when .college files use only intra-college relative + bare-package imports', () => {
    writeCollegeFile('departments/mathematics/concepts.ts', `
import { describe } from 'vitest';
import type { Local } from './local-types.js';
export const concepts: Local[] = [];
`);
    writeCollegeFile('departments/mathematics/local-types.ts', `
export interface Local { id: string; }
`);
    const { exitCode, stdout } = runAudit();
    expect(exitCode).toBe(0);
    expect(stdout).toContain('PASS');
  });

  // ── Case 2: relative .college/->src/ import fails ──────────────────────────
  it('fails and prints file:line when a relative ../src/ import is introduced', () => {
    writeCollegeFile('departments/cloud-systems/extensions/bad.ts', `
import type { OpenStackServiceName } from '../../../../src/types/openstack.js';
export type Svc = OpenStackServiceName;
`);
    const { exitCode, stderr } = runAudit('--strict');
    expect(exitCode).toBe(1);
    expect(stderr).toContain('FAIL');
    expect(stderr).toContain('CROSS_ROOTDIR_VIOLATION');
    expect(stderr).toContain('src/types/openstack.js');
  });

  // ── Case 3: bare 'src/...' import fails ────────────────────────────────────
  it('fails when a bare src/... specifier (tsconfig-paths reach) is introduced', () => {
    writeCollegeFile('departments/cloud-systems/bare.ts', `
import { thing } from 'src/orchestration/selector.js';
export const t = thing;
`);
    const { exitCode, stderr } = runAudit('--strict');
    expect(exitCode).toBe(1);
    expect(stderr).toContain('CROSS_ROOTDIR_VIOLATION');
    expect(stderr).toContain('src/orchestration/selector.js');
  });

  // ── Case 4: --json mode produces parseable JSON ────────────────────────────
  it('--json mode produces parseable JSON with expected shape', () => {
    writeCollegeFile('departments/mind-body/ok.ts', `
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

  // ── Case 5: --strict alias ─────────────────────────────────────────────────
  it('--strict alias exits 1 on violation (same behavior as default)', () => {
    writeCollegeFile('departments/culinary-arts/bad3.ts', `
import type { VerificationMethod } from '../../../src/types/openstack.js';
export type V = VerificationMethod;
`);
    const withStrict = runAudit('--strict');
    const withoutStrict = runAudit();
    expect(withStrict.exitCode).toBe(1);
    expect(withoutStrict.exitCode).toBe(1);
    expect(withStrict.stderr).toContain('CROSS_ROOTDIR_VIOLATION');
  });

  // ── Case 5b: a comment mentioning src/ does NOT trip the audit ─────────────
  // The removed runbook-interface.ts had a comment referencing 'src/dashboard';
  // the comment-stripping state machine must keep that from false-positiving.
  it('ignores src/ references that appear only inside comments', () => {
    writeCollegeFile('departments/mathematics/commented.ts', `
// This module mirrors types from src/types/openstack.ts (do not import them).
/* See src/orchestration/selector.ts for the consumer. */
export const ok = true;
`);
    const { exitCode, stdout } = runAudit();
    expect(exitCode).toBe(0);
    expect(stdout).toContain('PASS');
  });

  // ── Case 6: live regression — the real .college tree passes ────────────────
  // NON-hermetic by design: scans the actual .college/ surface (no --college-root
  // override). This is the standing gate (#10436 detector layer + #10461 Layer-2
  // drift-guard). A future un-redeclared .college/->src/ import fails loudly here,
  // because tsc does NOT catch that direction (asymmetric boundary, #10435).
  it('the live .college/ tree passes the audit (locks the .college/->src/ boundary clean)', () => {
    const stdout = execSync(`node "${SCRIPT_PATH}" --json`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const parsed = JSON.parse(stdout);
    expect(
      parsed.pass,
      `college-src-boundary-audit found ${parsed.violations} live .college/->src/ ` +
        `import(s): ${JSON.stringify(parsed.results)} — redeclare the needed type ` +
        `locally per the local-interface redeclaration discipline ` +
        `(docs/cross-rootdir-wire-discipline.md #10435); do NOT import across the ` +
        `rootdir boundary.`,
    ).toBe(true);
    expect(parsed.violations).toBe(0);
  });
});
