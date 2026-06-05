/**
 * tools/ci/windows-flip-readiness.mjs tests.
 *
 * Unit-covers the two pure functions (classifyChurn, computeReadiness) and
 * exercises the CLI end-to-end via spawnSync + an injected --runs-file fixture
 * (no gh / no git — deterministic and headless, so it runs on every matrix leg).
 * spawnSync (not execSync) so stderr survives exit 0 (#10417).
 */
import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { classifyChurn, computeReadiness, detectFlipState } from '../windows-flip-readiness.mjs';

const TOOL_PATH = resolve(fileURLToPath(import.meta.url), '..', '..', 'windows-flip-readiness.mjs');

// Minimal ci.yml fixtures for flip-state detection (detectFlipState + --ci-file CLI).
const STAGED_CI = `jobs:
  test:
    runs-on: \${{ matrix.os }}
    continue-on-error: \${{ matrix.os == 'windows-latest' }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
`;
const FLIPPED_CI = `jobs:
  test:
    runs-on: \${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
`;

function runCli(runs, extraArgs = []) {
  const dir = mkdtempSync(join(tmpdir(), 'windows-flip-'));
  try {
    const f = join(dir, 'runs.json');
    writeFileSync(f, JSON.stringify(runs));
    const res = spawnSync('node', [TOOL_PATH, `--runs-file=${f}`, ...extraArgs], {
      encoding: 'utf8',
    });
    return { status: res.status, stdout: res.stdout, stderr: res.stderr };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// ─── classifyChurn ────────────────────────────────────────────────────────────

describe('classifyChurn', () => {
  it('is organic when any test-bearing root is touched', () => {
    expect(classifyChurn(['src/foo.ts'])).toBe('organic');
    expect(classifyChurn(['tests/integration/x.test.ts'])).toBe('organic');
    expect(classifyChurn(['.college/integration/y.ts'])).toBe('organic');
    expect(classifyChurn(['www/tibsfox/com/z.html'])).toBe('organic');
    expect(classifyChurn(['tools/ci/windows-flip-readiness.mjs'])).toBe('organic');
    expect(classifyChurn(['scripts/bump-version.mjs'])).toBe('organic');
  });

  it('is organic for test-config files outside the roots', () => {
    expect(classifyChurn(['vitest.tools.config.mjs'])).toBe('organic');
    expect(classifyChurn(['vitest.config.ts'])).toBe('organic');
    expect(classifyChurn(['tsconfig.json'])).toBe('organic');
  });

  it('package.json / package-lock.json are INERT (every release bump touches them)', () => {
    // Regression: including these marked every chore(release) commit organic and
    // produced a spurious READY 3/3 at v1.49.924 — the false-positive the gate exists
    // to prevent. Verified against ground truth (#10427).
    expect(classifyChurn(['package.json'])).toBe('inert');
    expect(classifyChurn(['package-lock.json'])).toBe('inert');
  });

  it('a chore(release) commit shape classifies INERT (release mechanics, not dev churn)', () => {
    const choreRelease = [
      'docs/release-notes/STORY.md',
      'docs/release-notes/v1.49.924/README.md',
      'docs/release-notes/v1.49.924/chapter/00-summary.md',
      'package-lock.json',
      'package.json',
      'src-tauri/Cargo.toml',
      'src-tauri/tauri.conf.json',
    ];
    expect(classifyChurn(choreRelease)).toBe('inert');
  });

  it('src-tauri/ does NOT match the src/ root (distinct top-level dir)', () => {
    expect(classifyChurn(['src-tauri/Cargo.toml'])).toBe('inert');
  });

  it('is inert for docs / release / CI-config / planning only', () => {
    expect(classifyChurn(['docs/release-notes/v1.49.924/README.md'])).toBe('inert');
    expect(classifyChurn(['RELEASE-HISTORY.md'])).toBe('inert');
    expect(classifyChurn(['.github/workflows/ci.yml'])).toBe('inert');
    expect(classifyChurn(['dashboard/index.html'])).toBe('inert');
    expect(classifyChurn(['.planning/STATE.md'])).toBe('inert');
    expect(classifyChurn(['CLAUDE.md'])).toBe('inert');
  });

  it('is inert for an empty / missing change list', () => {
    expect(classifyChurn([])).toBe('inert');
    expect(classifyChurn(undefined)).toBe('inert');
    expect(classifyChurn(null)).toBe('inert');
  });

  it('is organic when a mixed commit touches at least one test-bearing path', () => {
    expect(classifyChurn(['docs/x.md', 'RELEASE-HISTORY.md', 'src/y.ts'])).toBe('organic');
  });

  it('does not false-positive on a path that merely contains a root substring', () => {
    // "mysrc/" / "atools/" must NOT match the "src/" / "tools/" prefixes.
    expect(classifyChurn(['mysrc/a.ts', 'atools/b.mjs'])).toBe('inert');
  });
});

// ─── detectFlipState ─────────────────────────────────────────────────────────

describe('detectFlipState', () => {
  it("is 'staged' when the windows-gated continue-on-error is present", () => {
    expect(detectFlipState(STAGED_CI)).toBe('staged');
  });

  it("is 'flipped' when the gated continue-on-error is absent (post-flip)", () => {
    expect(detectFlipState(FLIPPED_CI)).toBe('flipped');
  });

  it("is 'flipped' when a comment references continue-on-error without the colon token", () => {
    // ci.yml's flip comment mentions `continue-on-error` (no colon) — must NOT be
    // misread as staged. Mirrors the real reworded comment shape.
    const commentedFlip =
      FLIPPED_CI + "    # the windows leg's `continue-on-error` line was deleted at the flip\n";
    expect(detectFlipState(commentedFlip)).toBe('flipped');
  });

  it("is 'unknown' for empty / null / undefined input", () => {
    expect(detectFlipState('')).toBe('unknown');
    expect(detectFlipState(null)).toBe('unknown');
    expect(detectFlipState(undefined)).toBe('unknown');
  });
});

// ─── computeReadiness ──────────────────────────────────────────────────────────

const green = (sha, churn = 'organic') => ({ sha, windowsConclusion: 'success', churn });
const red = (sha, churn = 'organic') => ({ sha, windowsConclusion: 'failure', churn });

describe('computeReadiness', () => {
  it('READY when >= N consecutive organic greens', () => {
    const r = computeReadiness([green('a'), green('b'), green('c')], { n: 3 });
    expect(r.ready).toBe(true);
    expect(r.streak).toBe(3);
  });

  it('NOT READY when organic greens < N', () => {
    const r = computeReadiness([green('a'), green('b')], { n: 3 });
    expect(r.ready).toBe(false);
    expect(r.streak).toBe(2);
  });

  it('inert commits are transparent — neither count nor break', () => {
    const runs = [
      green('a', 'organic'),
      { sha: 'docs1', windowsConclusion: 'success', churn: 'inert' },
      green('b', 'organic'),
      { sha: 'docs2', windowsConclusion: 'success', churn: 'inert' },
      green('c', 'organic'),
    ];
    const r = computeReadiness(runs, { n: 3 });
    expect(r.ready).toBe(true);
    expect(r.streak).toBe(3);
    expect(r.inertSkipped).toBe(2);
  });

  it('an inert RED does not break the streak (the leg result is on unchanged surface)', () => {
    const runs = [
      green('a'),
      { sha: 'docsRed', windowsConclusion: 'failure', churn: 'inert' },
      green('b'),
      green('c'),
    ];
    const r = computeReadiness(runs, { n: 3 });
    expect(r.streak).toBe(3);
    expect(r.ready).toBe(true);
  });

  it('an organic RED breaks the streak and stops the walk', () => {
    const runs = [green('a'), red('bad'), green('b'), green('c')];
    const r = computeReadiness(runs, { n: 3 });
    expect(r.streak).toBe(1);
    expect(r.ready).toBe(false);
    expect(r.broke).toMatchObject({ sha: 'bad', windowsConclusion: 'failure' });
  });

  it('an organic breaking non-failure conclusion (timed_out / cancelled / action_required) ALSO breaks', () => {
    // Pins the BREAKING Set boundary (defer-bias). A flaky-infra timeout/cancel is the
    // canonical lane-reliability signal this gate exists to de-risk — it MUST break the
    // streak, not fall through to the transparent "no verdict" branch (which would
    // silently ADVANCE the flip on a flaky leg). Without this, shrinking BREAKING to
    // just ['failure'] passes the rest of the suite. Mirrors macos/cargo-flip-readiness.
    for (const concl of ['timed_out', 'cancelled', 'action_required']) {
      const runs = [green('a'), { sha: 'flaky', windowsConclusion: concl, churn: 'organic' }, green('b'), green('c')];
      const r = computeReadiness(runs, { n: 3 });
      expect(r.streak).toBe(1);
      expect(r.ready).toBe(false);
      expect(r.broke).toMatchObject({ sha: 'flaky', windowsConclusion: concl });
    }
  });

  it('an organic non-green non-breaking conclusion (neutral) is transparent — does NOT advance', () => {
    // Pins the GREEN Set boundary (defer-bias). Only `success` may increment the streak;
    // a `neutral` (or any other non-success, non-breaking) organic conclusion must be
    // transparent — never counted — else a non-green run would ADVANCE the flip. Without
    // this, expanding GREEN to ['success','neutral'] passes the rest of the suite.
    const runs = [green('a'), { sha: 'neut', windowsConclusion: 'neutral', churn: 'organic' }, green('b')];
    const r = computeReadiness(runs, { n: 3 });
    expect(r.streak).toBe(2); // only the two greens counted; neutral neither advanced...
    expect(r.ready).toBe(false);
    expect(r.broke).toBeNull(); // ...nor broke the streak
  });

  it('the named transparent conclusions (stale / startup_failure / in_progress) do NOT advance', () => {
    // Extends the GREEN Set-boundary pin (#10464). The gate comment enumerates
    // stale / startup_failure / in_progress as "no verdict" states that are transparent
    // (neither GREEN nor BREAKING), but only `neutral` was test-pinned. Each must behave
    // exactly like `neutral`: the discriminating [green, X, green] @ n=3 shape FAILS if X
    // drifts into GREEN (streak would reach 3 / ready true) OR into BREAKING (broke set) —
    // so it catches a Set edit in either direction. Without it, expanding GREEN to include
    // any of these — or moving one into BREAKING — passes the rest of the suite. Mirrors
    // macos/cargo-flip-readiness (cross-leg Set-boundary symmetry).
    for (const concl of ['stale', 'startup_failure', 'in_progress']) {
      const runs = [green('a'), { sha: 'noverdict', windowsConclusion: concl, churn: 'organic' }, green('b')];
      const r = computeReadiness(runs, { n: 3 });
      expect(r.streak).toBe(2); // only the two greens counted...
      expect(r.ready).toBe(false);
      expect(r.broke).toBeNull(); // ...neither advanced nor broke the streak
    }
  });

  it('an organic commit with no leg verdict (skipped/null) is transparent', () => {
    const runs = [
      green('a'),
      { sha: 'skip', windowsConclusion: 'skipped', churn: 'organic' },
      green('b'),
      green('c'),
    ];
    const r = computeReadiness(runs, { n: 3 });
    expect(r.streak).toBe(3);
    expect(r.ready).toBe(true);
    expect(r.broke).toBeNull();
  });

  it('the all-inert reality at v1.49.924 is correctly NOT READY (streak 0)', () => {
    const runs = [
      { sha: '5e8fff48f', windowsConclusion: 'success', churn: 'inert' },
      { sha: '504a2aa77', windowsConclusion: 'success', churn: 'inert' },
      { sha: '9f8df0f2b', windowsConclusion: 'success', churn: 'inert' },
      { sha: 'e9d821911', windowsConclusion: 'success', churn: 'inert' },
    ];
    const r = computeReadiness(runs, { n: 3 });
    expect(r.streak).toBe(0);
    expect(r.ready).toBe(false);
    expect(r.inertSkipped).toBe(4);
  });
});

// ─── CLI (spawnSync + injected --runs-file; no gh/git) ──────────────────────────

describe('CLI', () => {
  it('exits 0 + prints READY when >= N organic greens (via changedFiles classification)', () => {
    const runs = [
      { sha: 'a', windowsConclusion: 'success', changedFiles: ['src/x.ts'] },
      { sha: 'b', windowsConclusion: 'success', changedFiles: ['tests/y.test.ts'] },
      { sha: 'c', windowsConclusion: 'success', changedFiles: ['tools/z.mjs'] },
    ];
    const { status, stdout } = runCli(runs);
    expect(status).toBe(0);
    expect(stdout).toContain('READY');
    expect(stdout).not.toContain('NOT READY');
  });

  it('exits 1 + prints NOT READY when organic greens < N', () => {
    const runs = [
      { sha: 'a', windowsConclusion: 'success', changedFiles: ['src/x.ts'] },
      { sha: 'docs', windowsConclusion: 'success', changedFiles: ['docs/r.md'] },
    ];
    const { status, stdout } = runCli(runs);
    expect(status).toBe(1);
    expect(stdout).toContain('NOT READY');
  });

  it('respects --n override (1 organic green is READY at --n=1)', () => {
    const runs = [{ sha: 'a', windowsConclusion: 'success', changedFiles: ['src/x.ts'] }];
    const { status, stdout } = runCli(runs, ['--n=1']);
    expect(status).toBe(0);
    expect(stdout).toContain('READY');
  });

  it('--json emits a parseable summary with the readiness fields', () => {
    const runs = [
      { sha: 'a', windowsConclusion: 'success', changedFiles: ['src/x.ts'] },
      { sha: 'b', windowsConclusion: 'success', changedFiles: ['src/y.ts'] },
      { sha: 'c', windowsConclusion: 'success', changedFiles: ['src/z.ts'] },
    ];
    const { status, stdout } = runCli(runs, ['--json']);
    expect(status).toBe(0);
    const parsed = JSON.parse(stdout);
    expect(parsed.ready).toBe(true);
    expect(parsed.streak).toBe(3);
    expect(parsed.n).toBe(3);
  });

  it('exits 2 (indeterminate) on an empty runs list', () => {
    const { status, stderr } = runCli([]);
    expect(status).toBe(2);
    expect(stderr).toContain('indeterminate');
  });

  it('rejects a non-integer --n (exit 2), matching the "positive integer" message', () => {
    const runs = [{ sha: 'a', windowsConclusion: 'success', changedFiles: ['src/x.ts'] }];
    const { status, stderr } = runCli(runs, ['--n=1.5']);
    expect(status).toBe(2);
    expect(stderr).toContain('positive integer');
  });

  it('flags windowExhausted when NOT READY and not broken by a red', () => {
    const runs = [
      { sha: 'a', windowsConclusion: 'success', changedFiles: ['src/x.ts'] },
      { sha: 'docs', windowsConclusion: 'success', changedFiles: ['docs/r.md'] },
    ];
    const { stdout } = runCli(runs, ['--json']);
    expect(JSON.parse(stdout).windowExhausted).toBe(true);
  });

  it('does NOT flag windowExhausted when the streak was broken by an organic red', () => {
    const runs = [
      { sha: 'a', windowsConclusion: 'success', changedFiles: ['src/x.ts'] },
      { sha: 'bad', windowsConclusion: 'failure', changedFiles: ['src/y.ts'] },
    ];
    const { stdout } = runCli(runs, ['--json']);
    expect(JSON.parse(stdout).windowExhausted).toBe(false);
  });

  it('runs correctly through a SYMLINK (the realpath CLI guard, not raw-string match)', () => {
    // A naive `import.meta.url === file://${argv[1]}` guard silently no-ops under
    // symlink invocation → empty output + exit 0 (= READY), inverting the bias.
    const dir = mkdtempSync(join(tmpdir(), 'windows-flip-link-'));
    try {
      const f = join(dir, 'runs.json');
      writeFileSync(f, JSON.stringify([
        { sha: 'a', windowsConclusion: 'success', changedFiles: ['src/x.ts'] },
        { sha: 'b', windowsConclusion: 'success', changedFiles: ['src/y.ts'] },
        { sha: 'c', windowsConclusion: 'success', changedFiles: ['src/z.ts'] },
      ]));
      const link = join(dir, 'linked-tool.mjs');
      symlinkSync(TOOL_PATH, link);
      const res = spawnSync('node', [link, `--runs-file=${f}`], { encoding: 'utf8' });
      expect(res.stdout).toContain('READY'); // main() actually ran
      expect(res.status).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('the real v1.49.924 history is NOT READY via changedFiles classification', () => {
    // Mirrors the actual ground-truth shape: two chore(release) bumps + two
    // post-ship docs commits are inert; only the staging commit (touches
    // tests/ + tools/) is organic → streak 1 < 3.
    const runs = [
      { sha: '5e8fff48f', windowsConclusion: 'success', changedFiles: ['docs/RELEASE-HISTORY.md', 'docs/release-notes/STORY.md'] },
      { sha: '504a2aa77', windowsConclusion: 'success', changedFiles: ['docs/release-notes/v1.49.924/README.md', 'package.json', 'package-lock.json', 'src-tauri/Cargo.toml'] },
      { sha: '9f8df0f2b', windowsConclusion: 'success', changedFiles: ['docs/RELEASE-HISTORY.md'] },
      { sha: 'e9d821911', windowsConclusion: 'success', changedFiles: ['docs/release-notes/v1.49.923/README.md', 'package.json', 'package-lock.json'] },
      { sha: '4ef0be9f0', windowsConclusion: 'success', changedFiles: ['.github/workflows/ci.yml', 'tests/integration/ci-matrix-parity.test.ts', 'tools/pre-tag-gate.sh'] },
    ];
    const { status, stdout } = runCli(runs, ['--json']);
    expect(status).toBe(1);
    const parsed = JSON.parse(stdout);
    expect(parsed.ready).toBe(false);
    expect(parsed.streak).toBe(1);
    expect(parsed.inertSkipped).toBe(4);
  });

  it('post-flip (--ci-file flipped): READY guidance says "ALREADY load-bearing" / REVERT, not "Safe to flip"', () => {
    const dir = mkdtempSync(join(tmpdir(), 'windows-flip-ci-'));
    try {
      const ci = join(dir, 'ci.yml');
      writeFileSync(ci, FLIPPED_CI);
      const runs = [
        { sha: 'a', windowsConclusion: 'success', changedFiles: ['src/x.ts'] },
        { sha: 'b', windowsConclusion: 'success', changedFiles: ['src/y.ts'] },
        { sha: 'c', windowsConclusion: 'success', changedFiles: ['src/z.ts'] },
      ];
      const { status, stdout } = runCli(runs, [`--ci-file=${ci}`]);
      expect(status).toBe(0);
      expect(stdout).toContain('READY');
      expect(stdout).toContain('ALREADY load-bearing');
      expect(stdout).toContain('REVERT');
      expect(stdout).not.toContain('Safe to flip');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('pre-flip (--ci-file staged): READY guidance says "Safe to flip", not the post-flip REVERT text', () => {
    const dir = mkdtempSync(join(tmpdir(), 'windows-flip-ci-'));
    try {
      const ci = join(dir, 'ci.yml');
      writeFileSync(ci, STAGED_CI);
      const runs = [
        { sha: 'a', windowsConclusion: 'success', changedFiles: ['src/x.ts'] },
        { sha: 'b', windowsConclusion: 'success', changedFiles: ['src/y.ts'] },
        { sha: 'c', windowsConclusion: 'success', changedFiles: ['src/z.ts'] },
      ];
      const { status, stdout } = runCli(runs, [`--ci-file=${ci}`]);
      expect(status).toBe(0);
      expect(stdout).toContain('Safe to flip');
      expect(stdout).not.toContain('ALREADY load-bearing');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('--json includes flipState (flipped via --ci-file)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'windows-flip-ci-'));
    try {
      const ci = join(dir, 'ci.yml');
      writeFileSync(ci, FLIPPED_CI);
      const runs = [{ sha: 'a', windowsConclusion: 'success', changedFiles: ['src/x.ts'] }];
      const { stdout } = runCli(runs, ['--json', `--ci-file=${ci}`]);
      expect(JSON.parse(stdout).flipState).toBe('flipped');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
