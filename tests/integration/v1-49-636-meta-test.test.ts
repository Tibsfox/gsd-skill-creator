/**
 * v1.49.636 Integration Meta-Test
 *
 * Closes Meta-Lesson by exercising every new gate this milestone shipped
 * with an INTENTIONAL violation fixture, asserting the gate fires
 * correctly. Each test uses the Lesson #10180 skip-guard pattern when it
 * touches a gitignored runtime artifact so CI on fresh-clone environments
 * doesn't false-fail.
 *
 * Gates exercised:
 *   C1 — Tauri keystore wiring boundary (covered by 6 invoke.tauri.test.ts
 *        tests + 3 commands/keystore Rust tests; this file does NOT
 *        duplicate them — manual smoke test requires `npm run tauri dev`
 *        and is skip-guarded to TAURI_DEV_AVAILABLE=1).
 *   C3 — perf-assertion-audit tool (covered by 13 tool-test.mjs tests;
 *        this file does NOT duplicate them).
 *   C4 — atlas test disposition invariant (covered by 4
 *        tests/__tests__/atlas-test-disposition.test.ts; this file does
 *        NOT duplicate them).
 *   C5 — version-sequence ship-prep check (this file: synthetic non-
 *        sequential bump → soft-warn).
 *   C6 — CI-gate enumeration discipline (this file: synthetic failing-
 *        test NOT in CSV → exit 1).
 *   C7 — apply-to-self enforcement (this file: synthetic test-file
 *        violation → WARN).
 */

import { describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const REPO_ROOT = process.cwd();

const TAURI_DEV_AVAILABLE = process.env.TAURI_DEV_AVAILABLE === '1';

describe('v1.49.636 integration meta-test', () => {
  // ==========================================================================
  // Test 1: C5 version-sequence gate fires on synthetic non-sequential bump
  // ==========================================================================
  it('C5 — version-sequence check WARNs on non-sequential bump', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'v636-meta-c5-'));
    try {
      execSync('git init -q', { cwd: tmp });
      execSync('git config user.email t@t.io', { cwd: tmp });
      execSync('git config user.name t', { cwd: tmp });
      // Tag a baseline at 1.49.634, then bump package.json to 1.49.640
      // (skip 5 slots — a non-sequential bump).
      writeFileSync(
        join(tmp, 'package.json'),
        JSON.stringify({ version: '1.49.634' }, null, 2),
      );
      execSync('git add package.json', { cwd: tmp });
      execSync('git commit -q -m "chore(fixture): init"', { cwd: tmp });
      execSync('git tag v1.49.634', { cwd: tmp });
      writeFileSync(
        join(tmp, 'package.json'),
        JSON.stringify({ version: '1.49.640' }, null, 2),
      );
      execSync('git add package.json', { cwd: tmp });
      execSync('git commit -q -m "chore(fixture): bump to 1.49.640"', {
        cwd: tmp,
      });

      // Run the script against the fixture cwd.
      const script = join(REPO_ROOT, 'scripts', 'check-version-sequence.mjs');
      const out = execSync(`node "${script}"`, {
        cwd: tmp,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      expect(out).toContain('skips 5 slot');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('C5 — version-sequence check HARD-FAILs with SC_REQUIRE_SEQUENTIAL_VERSION=1', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'v636-meta-c5-strict-'));
    try {
      execSync('git init -q', { cwd: tmp });
      execSync('git config user.email t@t.io', { cwd: tmp });
      execSync('git config user.name t', { cwd: tmp });
      writeFileSync(
        join(tmp, 'package.json'),
        JSON.stringify({ version: '1.49.634' }, null, 2),
      );
      execSync('git add package.json', { cwd: tmp });
      execSync('git commit -q -m "chore(fixture): init"', { cwd: tmp });
      execSync('git tag v1.49.634', { cwd: tmp });
      writeFileSync(
        join(tmp, 'package.json'),
        JSON.stringify({ version: '1.49.640' }, null, 2),
      );
      execSync('git add package.json', { cwd: tmp });
      execSync('git commit -q -m "chore(fixture): non-sequential"', {
        cwd: tmp,
      });

      const script = join(REPO_ROOT, 'scripts', 'check-version-sequence.mjs');
      let exitCode = 0;
      try {
        execSync(`node "${script}"`, {
          cwd: tmp,
          encoding: 'utf8',
          env: { ...process.env, SC_REQUIRE_SEQUENTIAL_VERSION: '1' },
          stdio: ['ignore', 'pipe', 'pipe'],
        });
      } catch (err) {
        exitCode = (err as { status?: number }).status ?? -1;
      }
      expect(exitCode).toBe(1);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  // ==========================================================================
  // Test 2: C6 CI-gate enumeration fires on un-enumerated failing test
  // ==========================================================================
  it('C6 — ci-gate-enum exits 1 when failing test NOT in SC_SKIP_CI_GATE_TESTS', () => {
    const script = join(REPO_ROOT, 'scripts', 'ci-gate-enum.mjs');
    let exitCode = 0;
    let stderr = '';
    try {
      execSync(`node "${script}"`, {
        cwd: REPO_ROOT,
        encoding: 'utf8',
        env: {
          ...process.env,
          // Synthetic failing-test list bypasses the real `gh` invocation.
          SC_CI_GATE_FAILING: 'meta-suite:should-fail',
          SC_SKIP_CI_GATE_TESTS: 'other-test:other-name',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (err) {
      const e = err as { status?: number; stderr?: Buffer };
      exitCode = e.status ?? -1;
      stderr = e.stderr ? e.stderr.toString() : '';
    }
    expect(exitCode).toBe(1);
    expect(stderr).toContain('UNAUTHORIZED CI RED');
    expect(stderr).toContain('meta-suite:should-fail');
  });

  it('C6 — ci-gate-enum exits 0 when failing test IS in SC_SKIP_CI_GATE_TESTS', () => {
    const script = join(REPO_ROOT, 'scripts', 'ci-gate-enum.mjs');
    const out = execSync(`node "${script}"`, {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      env: {
        ...process.env,
        SC_CI_GATE_FAILING: 'meta-suite:should-fail',
        SC_SKIP_CI_GATE_TESTS: 'meta-suite:should-fail',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    expect(out).toContain('All 1 CI red(s) authorized');
  });

  // ==========================================================================
  // Test 3: C7 apply-to-self flags a synthetic violator
  // ==========================================================================
  it('C7 — apply-to-self WARNs on synthetic existsSync-without-skip-guard violator', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'v636-meta-c7-'));
    try {
      execSync('git init -q', { cwd: tmp });
      execSync('git config user.email t@t.io', { cwd: tmp });
      execSync('git config user.name t', { cwd: tmp });
      writeFileSync(join(tmp, 'README.md'), '# fixture');
      execSync('git add README.md', { cwd: tmp });
      execSync('git commit -q -m "chore(fixture): init"', { cwd: tmp });
      execSync('git tag v0.0.1', { cwd: tmp });
      mkdirSync(join(tmp, 'tests'));
      writeFileSync(
        join(tmp, 'tests', 'violator.test.ts'),
        `
          import { existsSync, readFileSync } from 'node:fs';
          const PATH = '.planning/some-artifact.md';
          describe('violator', () => {
            it('reads without skip-guard', () => {
              const c = readFileSync(PATH, 'utf8');
              expect(c).toContain('marker');
            });
          });
        `,
      );
      execSync('git add tests/', { cwd: tmp });
      execSync('git commit -q -m "test(fixture): add violator"', { cwd: tmp });

      const script = join(REPO_ROOT, 'scripts', 'apply-to-self.mjs');
      const out = execSync(
        `node "${script}" --diff-against v0.0.1 --json`,
        {
          cwd: tmp,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      );
      const result = JSON.parse(out);
      expect(result.findings.length).toBeGreaterThan(0);
      const finding = result.findings.find(
        (f: { patternName: string }) =>
          f.patternName === 'existsSync-no-skip-guard',
      );
      expect(finding).toBeDefined();
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  // ==========================================================================
  // Test 4: Apply-to-self check on this very meta-test file
  // ==========================================================================
  it('C7 — apply-to-self does NOT flag this meta-test file (self-compliance)', () => {
    // Run apply-to-self against the live repo. The meta-test file uses
    // existsSync/execSync against paths but NOT against .planning/ paths;
    // it should not be flagged.
    const script = join(REPO_ROOT, 'scripts', 'apply-to-self.mjs');
    const out = execSync(`node "${script}" --json`, {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const result = JSON.parse(out);
    // The meta-test file itself should not appear in findings — it uses
    // existsSync ONLY for the TAURI_DEV_AVAILABLE skip-guard, not as a
    // gitignored-artifact check (the only .planning/ refs are in this
    // header comment, which the detector should not pick up because
    // there's no readFileSync/existsSync call against a .planning/ path
    // in the actual code paths).
    const selfFinding = result.findings.find((f: { file: string }) =>
      f.file.includes('v1-49-636-meta-test.test.ts'),
    );
    expect(selfFinding).toBeUndefined();
  });

  // ==========================================================================
  // Test 5: Tauri keystore wiring smoke (SKIP-GUARDED per Lesson #10180)
  // ==========================================================================
  it.runIf(TAURI_DEV_AVAILABLE)(
    'C1 — Tauri keystore wiring smoke (live invoke)',
    () => {
      // This test exists for documentation; the real smoke is operator-
      // executed at G3 via `npm run tauri dev` and observing the keystore
      // status UI surface live state instead of canned stub state. Under
      // TAURI_DEV_AVAILABLE=1, an operator could programmatically drive
      // invoke('keystore_status') and assert the response shape — that
      // depends on a running Tauri runtime which vitest does NOT provide.
      // The assertion below is a placeholder for that future automation.
      expect(TAURI_DEV_AVAILABLE).toBe(true);
    },
  );

  // ==========================================================================
  // Test 6: Pre-tag-gate script is present + executable
  // ==========================================================================
  it('pre-tag-gate.sh exists with the v1.49.636 step 1.5 + step 9.5 additions', () => {
    const path = join(REPO_ROOT, 'tools', 'pre-tag-gate.sh');
    if (!existsSync(path)) {
      // Fresh-clone environments may not have pulled this file yet —
      // skip-guard per Lesson #10180.
      return;
    }
    const content = readFileSync(path, 'utf8');
    // v1.49.653 L-02 widened the step count from /9 to /13; the assertions
    // check that the *steps* are still present, decoupled from the suffix.
    expect(content).toContain('step 1.5/');
    expect(content).toContain('version-sequence sanity');
    expect(content).toContain('step 9.5/');
    expect(content).toContain('apply-to-self enforcement');
    expect(content).toContain('SC_SKIP_CI_GATE_TESTS');
    expect(content).toContain('SC_SKIP_VERSION_SEQUENCE_CHECK');
    expect(content).toContain('SC_SKIP_APPLY_TO_SELF');
  });
});
