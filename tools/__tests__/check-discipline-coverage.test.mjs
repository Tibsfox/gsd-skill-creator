/**
 * Tests for tools/check-discipline-coverage.mjs.
 *
 * Spawn-based harness (#10417: spawnSync over execSync so stderr survives
 * exit 0). Fixtures construct a temp repo with a known-count manifest +
 * release-notes tree so the asserted COVERED / PARTIAL / UNCODIFIED counts
 * are ground-truth-by-construction (#10450: tests must not be vacuously
 * true — the fixture's bucket counts are known before the tool runs).
 *
 * Covers the v1.49.912 --max-partial companion ceiling alongside the
 * existing --max-uncodified ceiling: over/under/equal boundaries, arg
 * validation, --json suppression of the stderr message, and the live
 * apply-to-self clean run.
 */

import { describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync, spawnSync } from 'node:child_process';

const TOOL = resolve(import.meta.dirname, '..', 'check-discipline-coverage.mjs');
const REPO_ROOT = resolve(import.meta.dirname, '..', '..');

// Build a temp repo whose manifest + release-notes tree yield a controlled
// set of bucket counts. `manifest` is the disciplines.json array; `docs`
// maps repo-relative paths → file content (the cited canonical docs);
// `versions` maps a version-dir name → its chapter/04-lessons.md content.
function setupFixture({ manifest, docs = {}, versions = {} }) {
  const dir = mkdtempSync(join(tmpdir(), 'cdc-test-'));
  execSync('git init -q', { cwd: dir });
  execSync('git config user.email t@t.io', { cwd: dir });
  execSync('git config user.name t', { cwd: dir });

  const manifestPath = join(dir, 'tools', 'render-claude-md', 'disciplines.json');
  mkdirSync(dirname(manifestPath), { recursive: true });
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  for (const [rel, content] of Object.entries(docs)) {
    const abs = join(dir, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  }

  for (const [version, lessons] of Object.entries(versions)) {
    const abs = join(dir, 'docs', 'release-notes', version, 'chapter', '04-lessons.md');
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, lessons);
  }

  return dir;
}

function run(dir, args = []) {
  const r = spawnSync(process.execPath, [TOOL, ...args], { cwd: dir, encoding: 'utf8' });
  return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '' };
}

// A fixture engineered to produce exactly:
//   COVERED    = 1  (#10001 — in manifest AND in cited doc)
//   PARTIAL    = 2  (#10002 manifest-only, #10003 doc-only)
//   UNCODIFIED = 2  (#10004, #10005 — 2+ refs, captured nowhere)
// plus #10006 (single ref, captured nowhere) which is DROPPED (refCount < 2).
function knownCountFixture() {
  return setupFixture({
    manifest: [
      { domain: 'Demo', canonical_docs: ['docs/demo.md'], key_lessons: ['#10001', '#10002'] },
    ],
    docs: {
      // doc cites #10001 (→ COVERED with manifest) and #10003 (→ doc-only PARTIAL)
      'docs/demo.md': 'Demo discipline. Refs #10001 and #10003.\n',
    },
    versions: {
      'v9.0.1':
        'Lesson #10001 emit. Lesson #10002 emit. Lesson #10003 emit. ' +
        'Lesson #10004 emit. Lesson #10005 emit. Lesson #10006 emit.\n',
      'v9.0.2': 'Lesson #10004 carry-forward. Lesson #10005 carry-forward.\n',
    },
  });
}

function withFixture(makeDir, fn) {
  const dir = makeDir();
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe('check-discipline-coverage — classification (ground-truth fixture)', () => {
  it('classifies COVERED / PARTIAL / UNCODIFIED at the known counts', () => {
    withFixture(knownCountFixture, (dir) => {
      const { status, stdout } = run(dir, ['--json']);
      expect(status).toBe(0);
      const j = JSON.parse(stdout);
      expect(j.covered_count).toBe(1);
      expect(j.partial_count).toBe(2);
      expect(j.uncodified_count).toBe(2);
      // single-ref uncaptured lesson (#10006) is dropped, not bucketed
      const allBucketed = [
        ...j.buckets.COVERED,
        ...j.buckets.PARTIAL,
        ...j.buckets.UNCODIFIED,
      ].map((e) => e.id);
      expect(allBucketed).not.toContain('#10006');
    });
  });

  it('emits the human-readable count lines the gate greps', () => {
    withFixture(knownCountFixture, (dir) => {
      const { stdout } = run(dir);
      // pre-tag-gate step 13 greps "UNCODIFIED.*: N" and "PARTIAL.*: N"
      expect(stdout).toMatch(/UNCODIFIED.*: 2/);
      expect(stdout).toMatch(/PARTIAL.*: 2/);
      expect(stdout).toMatch(/COVERED.*: 1/);
    });
  });
});

describe('check-discipline-coverage — --max-uncodified ceiling', () => {
  it('exits 0 when UNCODIFIED equals the ceiling', () => {
    withFixture(knownCountFixture, (dir) => {
      expect(run(dir, ['--max-uncodified=2']).status).toBe(0);
    });
  });

  it('exits 1 with a stderr message when UNCODIFIED exceeds the ceiling', () => {
    withFixture(knownCountFixture, (dir) => {
      const { status, stderr } = run(dir, ['--max-uncodified=1']);
      expect(status).toBe(1);
      expect(stderr).toContain('UNCODIFIED count 2 EXCEEDS ceiling 1');
    });
  });
});

describe('check-discipline-coverage — --max-partial ceiling (v1.49.912)', () => {
  it('exits 0 when PARTIAL equals the ceiling', () => {
    withFixture(knownCountFixture, (dir) => {
      expect(run(dir, ['--max-partial=2']).status).toBe(0);
    });
  });

  it('exits 1 with a stderr message when PARTIAL exceeds the ceiling', () => {
    withFixture(knownCountFixture, (dir) => {
      const { status, stderr } = run(dir, ['--max-partial=1']);
      expect(status).toBe(1);
      expect(stderr).toContain('PARTIAL count 2 EXCEEDS ceiling 1');
    });
  });

  it('exits 0 when both ceilings are within range', () => {
    withFixture(knownCountFixture, (dir) => {
      expect(run(dir, ['--max-uncodified=5', '--max-partial=5']).status).toBe(0);
    });
  });

  it('UNCODIFIED ceiling is checked before PARTIAL when both are exceeded', () => {
    withFixture(knownCountFixture, (dir) => {
      const { status, stderr } = run(dir, ['--max-uncodified=1', '--max-partial=1']);
      expect(status).toBe(1);
      // UNCODIFIED check runs first → its message is the one emitted
      expect(stderr).toContain('UNCODIFIED count 2 EXCEEDS ceiling 1');
    });
  });

  it('suppresses the stderr ceiling message under --json but still exits 1', () => {
    withFixture(knownCountFixture, (dir) => {
      const { status, stdout, stderr } = run(dir, ['--json', '--max-partial=1']);
      expect(status).toBe(1);
      expect(stderr).not.toContain('EXCEEDS');
      // stdout is still valid JSON with the real partial count
      expect(JSON.parse(stdout).partial_count).toBe(2);
    });
  });
});

describe('check-discipline-coverage — arg validation', () => {
  it('rejects negative --max-partial with exit 2', () => {
    withFixture(knownCountFixture, (dir) => {
      const { status, stderr } = run(dir, ['--max-partial=-1']);
      expect(status).toBe(2);
      expect(stderr).toContain('--max-partial requires a non-negative integer');
    });
  });

  it('rejects non-numeric --max-partial with exit 2', () => {
    withFixture(knownCountFixture, (dir) => {
      expect(run(dir, ['--max-partial=abc']).status).toBe(2);
    });
  });

  it('rejects non-integer --max-partial with exit 2', () => {
    withFixture(knownCountFixture, (dir) => {
      expect(run(dir, ['--max-partial=2.5']).status).toBe(2);
    });
  });

  it('still rejects negative --max-uncodified (regression guard)', () => {
    withFixture(knownCountFixture, (dir) => {
      expect(run(dir, ['--max-uncodified=-1']).status).toBe(2);
    });
  });

  it('--help documents --max-partial and exits 0', () => {
    withFixture(knownCountFixture, (dir) => {
      const { status, stdout } = run(dir, ['--help']);
      expect(status).toBe(0);
      expect(stdout).toContain('--max-partial=N');
    });
  });
});

describe('check-discipline-coverage — live apply-to-self', () => {
  it('passes the v1.49.912 ratcheted ceilings (5/5) on the current repo', () => {
    // Current engine state: UNCODIFIED 0 / PARTIAL 0 — within the new 5/5
    // ceilings. This doubles as a regression guard that the live repo stays
    // within the ratcheted ceilings.
    const { status } = run(REPO_ROOT, ['--max-uncodified=5', '--max-partial=5']);
    expect(status).toBe(0);
  });

  it('reports the live drained-to-zero baseline (catches within-ceiling drift)', () => {
    // Tighter than the exit-code guard above: asserts the actual counts, so a
    // classification regression that stays UNDER the ceiling is still caught.
    const { status, stdout } = run(REPO_ROOT, ['--json']);
    expect(status).toBe(0);
    const j = JSON.parse(stdout);
    expect(j.uncodified_count).toBe(0);
    expect(j.partial_count).toBe(0);
  });
});
