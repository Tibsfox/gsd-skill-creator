/**
 * Tests for tools/check-tools-test-coverage.mjs — the Layer-2 drift-guard for
 * vitest.tools.config.mjs (paired with the pre-tag-gate "tools-suite" step).
 *
 * Spawn-based harness (#10417: spawnSync over execSync so stderr survives
 * exit 0). Each fixture builds a temp repo with a known vitest.tools.config.mjs
 * include list + a known set of *.test.mjs files, so the asserted missing /
 * node:test / stale partition is ground-truth-by-construction (#10450 — the
 * tool's classifier is validated against a hand-built oracle, not a vacuous
 * pass). A live apply-to-self test asserts the real repo's include list is
 * complete, doubling as the regression guard that catches future drift.
 */

import { describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const TOOL = resolve(import.meta.dirname, '..', 'check-tools-test-coverage.mjs');
const REPO_ROOT = resolve(import.meta.dirname, '..', '..');

const VITEST_FILE = `import { describe, it, expect } from 'vitest';\ndescribe('x', () => { it('y', () => { expect(1).toBe(1); }); });\n`;
const NODE_TEST_FILE = `import { test } from 'node:test';\nimport assert from 'node:assert/strict';\ntest('x', () => assert.equal(1, 1));\n`;

/**
 * Build a temp repo. `files` maps a repo-relative path → 'vitest' | 'node:test'
 * (the runner the fake test imports). `include` is the vitest.tools.config.mjs
 * include array.
 */
function setupFixture({ files = {}, rawFiles = {}, include }) {
  const dir = mkdtempSync(join(tmpdir(), 'ttc-test-'));
  const cfg = `export default { test: { include: ${JSON.stringify(include)} } };\n`;
  writeFileSync(join(dir, 'vitest.tools.config.mjs'), cfg);
  for (const [rel, kind] of Object.entries(files)) {
    const abs = join(dir, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, kind === 'node:test' ? NODE_TEST_FILE : VITEST_FILE);
  }
  for (const [rel, content] of Object.entries(rawFiles)) {
    const abs = join(dir, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  }
  return dir;
}

function run(rootDir, args = []) {
  const r = spawnSync(process.execPath, [TOOL, `--root=${rootDir}`, ...args], { encoding: 'utf8' });
  return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '' };
}

function withFixture(spec, fn) {
  const dir = setupFixture(spec);
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe('check-tools-test-coverage — drift detection (ground-truth fixtures)', () => {
  it('flags a vitest file missing from the include list, exit 1', () => {
    withFixture(
      {
        files: {
          'tools/__tests__/foo.test.mjs': 'vitest',
          'tools/__tests__/bar.test.mjs': 'vitest', // NOT in include → missing
        },
        include: ['tools/__tests__/foo.test.mjs'],
      },
      (dir) => {
        const { status, stdout } = run(dir, ['--json']);
        expect(status).toBe(1);
        const j = JSON.parse(stdout);
        expect(j.ok).toBe(false);
        expect(j.missing).toEqual(['tools/__tests__/bar.test.mjs']);
      },
    );
  });

  it('passes (exit 0) when every vitest file is in the include list', () => {
    withFixture(
      {
        files: {
          'tools/__tests__/foo.test.mjs': 'vitest',
          'scripts/__tests__/bar.test.mjs': 'vitest',
        },
        include: ['tools/__tests__/foo.test.mjs', 'scripts/__tests__/bar.test.mjs'],
      },
      (dir) => {
        const { status, stdout } = run(dir, ['--json']);
        expect(status).toBe(0);
        const j = JSON.parse(stdout);
        expect(j.ok).toBe(true);
        expect(j.missing).toEqual([]);
      },
    );
  });

  it('excludes node:test files (reported, never required in the include list)', () => {
    withFixture(
      {
        files: {
          'tools/__tests__/foo.test.mjs': 'vitest',
          'tools/citation/__tests__/list.test.mjs': 'node:test', // NOT in list, must NOT be flagged
        },
        include: ['tools/__tests__/foo.test.mjs'],
      },
      (dir) => {
        const { status, stdout } = run(dir, ['--json']);
        expect(status).toBe(0); // node:test absence from the list is NOT drift
        const j = JSON.parse(stdout);
        expect(j.ok).toBe(true);
        expect(j.missing).toEqual([]);
        // ...but it is reported, not silently dropped (#10421 no-silent-caps)
        expect(j.node_test_files).toContain('tools/citation/__tests__/list.test.mjs');
      },
    );
  });

  it('flags a node:test file wrongly added to the include list, exit 1 (inverse guard)', () => {
    // A node:test file IN the vitest include list crashes the suite at runtime
    // (node:test's test() registers with the wrong runner). The drift-guard must
    // flag it as misclassified — not pass — rather than rely solely on Layer 1
    // (the suite run) crashing.
    withFixture(
      {
        files: {
          'tools/__tests__/foo.test.mjs': 'vitest',
          'tools/citation/__tests__/nt.test.mjs': 'node:test',
        },
        include: ['tools/__tests__/foo.test.mjs', 'tools/citation/__tests__/nt.test.mjs'],
      },
      (dir) => {
        const { status, stdout } = run(dir, ['--json']);
        expect(status).toBe(1);
        const j = JSON.parse(stdout);
        expect(j.ok).toBe(false);
        expect(j.misclassified_include).toEqual(['tools/citation/__tests__/nt.test.mjs']);
        // partition is still correct
        expect(j.vitest_count).toBe(1);
        expect(j.node_test_count).toBe(1);
      },
    );
  });

  it('classifies multi-line (prettier-wrapped) runner imports correctly — no false-positive', () => {
    // A named-import block wrapped across lines must still be detected as its
    // runner. The original [^\\n]* regex landed these in the "unknown" bucket and
    // false-positived (exit 1) on valid, runnable tests. v1.49.913 adversarial
    // finding — sibling of the #10450 embedded-string fixture above.
    const mlVitest =
      `import {\n  describe,\n  it,\n  expect,\n} from 'vitest';\n` +
      `describe('x', () => { it('y', () => { expect(1).toBe(1); }); });\n`;
    const mlNodeTest =
      `import {\n  test,\n} from 'node:test';\n` +
      `import assert from 'node:assert/strict';\ntest('x', () => assert.equal(1, 1));\n`;
    withFixture(
      {
        rawFiles: {
          'tools/__tests__/ml-vitest.test.mjs': mlVitest,
          'tools/citation/__tests__/ml-node.test.mjs': mlNodeTest,
        },
        include: ['tools/__tests__/ml-vitest.test.mjs'], // node:test correctly excluded
      },
      (dir) => {
        const { status, stdout } = run(dir, ['--json']);
        expect(status).toBe(0);
        const j = JSON.parse(stdout);
        expect(j.ok).toBe(true);
        expect(j.vitest_count).toBe(1); // ml-vitest detected as vitest, not unknown
        expect(j.node_test_count).toBe(1); // ml-node detected as node:test, not unknown
        expect(j.unknown).toEqual([]);
      },
    );
  });

  it('classifies a vitest file as vitest even when it embeds "node:test" as string data (#10450)', () => {
    // The runner classifier is line-anchored to a real top-level import, so a
    // node:test import that appears INSIDE a string/template literal (as this
    // very test file does, embedding NODE_TEST_FILE) is not misread as a
    // node:test runner. Without the line-anchor the file classifies as "mixed"
    // and the tool false-positives.
    const embedded =
      `import { describe, it, expect } from 'vitest';\n` +
      "const FIXTURE = `import { test } from 'node:test';`;\n" +
      `describe('x', () => { it('y', () => { expect(FIXTURE).toContain('node:test'); }); });\n`;
    withFixture(
      {
        rawFiles: { 'tools/__tests__/embed.test.mjs': embedded },
        include: ['tools/__tests__/embed.test.mjs'],
      },
      (dir) => {
        const { status, stdout } = run(dir, ['--json']);
        expect(status).toBe(0);
        const j = JSON.parse(stdout);
        expect(j.ok).toBe(true);
        expect(j.vitest_count).toBe(1);
        expect(j.node_test_count).toBe(0); // NOT misread as node:test
        expect(j.unknown).toEqual([]);
      },
    );
  });

  it('flags a stale include entry pointing at a non-existent file, exit 1', () => {
    withFixture(
      {
        files: { 'tools/__tests__/foo.test.mjs': 'vitest' },
        include: ['tools/__tests__/foo.test.mjs', 'tools/__tests__/deleted.test.mjs'],
      },
      (dir) => {
        const { status, stdout } = run(dir, ['--json']);
        expect(status).toBe(1);
        const j = JSON.parse(stdout);
        expect(j.stale).toEqual(['tools/__tests__/deleted.test.mjs']);
      },
    );
  });

  it('human output names the missing file and the remedy', () => {
    withFixture(
      {
        files: {
          'tools/__tests__/foo.test.mjs': 'vitest',
          'tools/__tests__/bar.test.mjs': 'vitest',
        },
        include: ['tools/__tests__/foo.test.mjs'],
      },
      (dir) => {
        const { status, stdout } = run(dir);
        expect(status).toBe(1);
        expect(stdout).toContain('tools/__tests__/bar.test.mjs');
        expect(stdout).toMatch(/DRIFT|MISSING/);
      },
    );
  });
});

describe('check-tools-test-coverage — live apply-to-self (regression guard)', () => {
  it('the real vitest.tools.config.mjs include list covers every tools/ + scripts/ vitest test', () => {
    // This is the load-bearing guard: if a new vitest *.test.mjs is added under
    // tools/ or scripts/ without registering it in vitest.tools.config.mjs, this
    // fails — closing the silent-rot window that hid the catalog/scorer/ftp red
    // tests for ~2 weeks (v1.49.913).
    const r = spawnSync(process.execPath, [TOOL, '--json'], { cwd: REPO_ROOT, encoding: 'utf8' });
    expect(r.status).toBe(0);
    const j = JSON.parse(r.stdout || '{}');
    expect(j.missing).toEqual([]);
    expect(j.stale).toEqual([]);
    expect(j.unknown).toEqual([]);
    // Non-vacuous: there really are vitest files on disk being checked.
    expect(j.vitest_count).toBeGreaterThan(40);
  });

  it('default (no-flag) drift-guard report is unchanged (v1.49.914 regression guard)', () => {
    // The new --print-node-test / --run-node-test flags must NOT alter the
    // default report path. This pins the success line byte-for-byte.
    const r = spawnSync(process.execPath, [TOOL], { cwd: REPO_ROOT, encoding: 'utf8' });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('PASS — include list covers all vitest test files');
  });
});

describe('check-tools-test-coverage — node:test runner mode (v1.49.914)', () => {
  // node:test-side drift-guard (Layer-2 companion to the vitest include-list
  // guard above). The vitest guard catches a new VITEST file that escapes the
  // include list; this guard catches a new NODE:TEST file that escapes the
  // node --test runner — forcing an explicit acknowledgement here.
  const EXPECTED_NODE_TEST_FILES = [
    'tools/citation-debt/__tests__/list.test.mjs',
    'tools/release-history/__tests__/phases-plans-extraction.test.mjs',
    'tools/ship-review/__tests__/write-attestation.test.mjs', // v1.49.1029 step P attestation (caught by the v2 review dogfood)
  ].sort();

  it('--print-node-test lists EXACTLY the three known node:test files, exit 0', () => {
    const r = spawnSync(process.execPath, [TOOL, '--print-node-test'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    });
    expect(r.status).toBe(0);
    const discovered = (r.stdout || '')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .sort();
    // Exact-set equality: a NEW node:test file added later breaks this until it
    // is acknowledged here (and wired into the node --test gate via the runner).
    expect(discovered).toEqual(EXPECTED_NODE_TEST_FILES);
  });

  it('--run-node-test exits 0 on the current tree and runs node\'s test runner', () => {
    // The two node:test suites are fast (~1s); allow a generous 30s budget.
    const r = spawnSync(process.execPath, [TOOL, '--run-node-test'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      timeout: 30000,
    });
    if (r.status !== 0) {
      throw new Error(`--run-node-test exited ${r.status}:\n${r.stdout}\n${r.stderr}`);
    }
    expect(r.status).toBe(0);
    // node --test emits TAP; the summary lines prove the runner actually ran.
    const out = `${r.stdout || ''}\n${r.stderr || ''}`;
    expect(out).toMatch(/# pass|tests \d+/);
  });
});
