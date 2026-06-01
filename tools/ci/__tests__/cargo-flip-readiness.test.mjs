/**
 * tools/ci/cargo-flip-readiness.mjs tests.
 *
 * Unit-covers the three pure functions (classifyCommit, computeReadiness,
 * detectFlipState) and exercises the CLI end-to-end via spawnSync + an injected
 * --runs-file fixture (no gh / no git — deterministic and headless, so it runs on the
 * macOS matrix leg too). spawnSync (not execSync) so stderr survives exit 0 (#10417).
 *
 * The cargo gate's counting model is the INVERSE-ish of the macOS gate's: a commit's
 * cargo green counts iff the commit did NOT modify the cargo lane definition (didn't
 * touch ci.yml). The headline divergence from macos-flip-readiness — a docs-only
 * commit is TRACKED here (a full fresh recompile = real lane-reliability evidence),
 * not inert — is pinned by an explicit test below.
 */
import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { classifyCommit, computeReadiness, detectFlipState } from '../cargo-flip-readiness.mjs';

const TOOL_PATH = resolve(fileURLToPath(import.meta.url), '..', '..', 'cargo-flip-readiness.mjs');

// Minimal ci.yml fixtures for flip-state detection (detectFlipState + --ci-file CLI).
// The cargo job carries a JOB-LEVEL `continue-on-error: true` while staged; the flip
// deletes it. A non-cargo job sits before it to exercise the job-isolation slice.
const STAGED_CI = `jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: npm run build
  cargo:
    name: Cargo Test (no-default-features)
    runs-on: ubuntu-latest
    continue-on-error: true
    steps:
      - run: cargo test --no-default-features --manifest-path src-tauri/Cargo.toml
`;
const FLIPPED_CI = `jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: npm run build
  cargo:
    name: Cargo Test (no-default-features)
    runs-on: ubuntu-latest
    steps:
      - run: cargo test --no-default-features --manifest-path src-tauri/Cargo.toml
`;
// A ci.yml with NO cargo lane → 'unknown' (the lane was dropped, or this is an old ci.yml).
const NO_CARGO_CI = `jobs:
  test:
    runs-on: \${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest]
`;

function runCli(runs, extraArgs = []) {
  const dir = mkdtempSync(join(tmpdir(), 'cargo-flip-'));
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

// ─── classifyCommit ─────────────────────────────────────────────────────────

describe('classifyCommit', () => {
  it('is tracked when the commit ran the fixed lane (did NOT touch ci.yml)', () => {
    expect(classifyCommit(['src-tauri/src/main.rs'])).toBe('tracked');
    expect(classifyCommit(['src/foo.ts'])).toBe('tracked');
    expect(classifyCommit(['package.json', 'src-tauri/Cargo.toml'])).toBe('tracked');
  });

  it('KEY DIVERGENCE FROM macOS — a docs-only commit is TRACKED for cargo', () => {
    // For macOS a docs-only commit is INERT (re-runs the IDENTICAL TS surface). For
    // cargo it is TRACKED: every push does a FULL fresh apt-install + recompile + test,
    // so a green docs-only run IS fresh lane/infra-reliability evidence. This is the
    // single most important behavioral difference between the two gates.
    expect(classifyCommit(['docs/RELEASE-HISTORY.md'])).toBe('tracked');
    expect(classifyCommit(['docs/release-notes/STORY.md', 'docs/release-notes/v1.49.940/README.md'])).toBe('tracked');
  });

  it('a chore(release) commit shape is TRACKED (the version bump does not touch ci.yml)', () => {
    const choreRelease = [
      'docs/release-notes/STORY.md',
      'docs/release-notes/v1.49.940/README.md',
      'package-lock.json',
      'package.json',
      'src-tauri/Cargo.toml',
      'src-tauri/tauri.conf.json',
    ];
    expect(classifyCommit(choreRelease)).toBe('tracked');
  });

  it('is untracked when the commit modifies the cargo lane definition (touches ci.yml)', () => {
    // The introduction `ci(cargo)` commit (0cb1dfb65) and the future flip commit both
    // touch ci.yml — their cargo green is a self-test of the change, not track record.
    expect(classifyCommit(['.github/workflows/ci.yml'])).toBe('untracked');
    expect(classifyCommit(['.github/workflows/ci.yml', 'tests/integration/ci-matrix-parity.test.ts'])).toBe('untracked');
  });

  it('a mixed commit that ALSO touches ci.yml is untracked (any ci.yml touch wins, defer-safe)', () => {
    expect(classifyCommit(['src-tauri/src/lib.rs', '.github/workflows/ci.yml'])).toBe('untracked');
  });

  it('is untracked for an empty / missing change list (defer-safe — could not inspect)', () => {
    expect(classifyCommit([])).toBe('untracked');
    expect(classifyCommit(undefined)).toBe('untracked');
    expect(classifyCommit(null)).toBe('untracked');
  });

  it('does NOT false-positive on a path that merely contains the ci.yml substring', () => {
    // Only an EXACT match on the workflow path is a lane change; a different workflow
    // file or a doc that mentions the path must stay tracked.
    expect(classifyCommit(['.github/workflows/ci-other.yml'])).toBe('tracked');
    expect(classifyCommit(['docs/.github/workflows/ci.yml.md'])).toBe('tracked');
  });
});

// ─── detectFlipState ─────────────────────────────────────────────────────────

describe('detectFlipState', () => {
  it("is 'staged' when the cargo job carries continue-on-error: true", () => {
    expect(detectFlipState(STAGED_CI)).toBe('staged');
  });

  it("is 'flipped' when the cargo job has no continue-on-error (post-flip)", () => {
    expect(detectFlipState(FLIPPED_CI)).toBe('flipped');
  });

  it("is 'unknown' when there is no cargo lane in ci.yml", () => {
    expect(detectFlipState(NO_CARGO_CI)).toBe('unknown');
  });

  it("ignores a continue-on-error in a DIFFERENT job (job-isolation slice)", () => {
    // A `continue-on-error: true` in some other job must NOT make the cargo lane read
    // as staged. The flipped cargo job is bounded to its own block.
    const otherJobCoe = `jobs:
  flaky:
    runs-on: ubuntu-latest
    continue-on-error: true
    steps:
      - run: echo hi
  cargo:
    name: Cargo Test (no-default-features)
    runs-on: ubuntu-latest
    steps:
      - run: cargo test
`;
    expect(detectFlipState(otherJobCoe)).toBe('flipped');
  });

  it("is 'flipped' when a COMMENT mentions continue-on-error but the key is gone", () => {
    // The flip comment in ci.yml mentions `continue-on-error` — the `#` before it
    // breaks the `\\n<ws>continue-on-error: true` key match, so it does not read staged.
    const commentedFlip = FLIPPED_CI.replace(
      '    steps:\n      - run: cargo test --no-default-features --manifest-path src-tauri/Cargo.toml\n',
      '    # the job-level continue-on-error: true was deleted at the flip\n    steps:\n      - run: cargo test\n',
    );
    expect(detectFlipState(commentedFlip)).toBe('flipped');
  });

  it("is 'unknown' for empty / null / undefined input", () => {
    expect(detectFlipState('')).toBe('unknown');
    expect(detectFlipState(null)).toBe('unknown');
    expect(detectFlipState(undefined)).toBe('unknown');
  });
});

// ─── computeReadiness ──────────────────────────────────────────────────────────

const green = (sha, churn = 'tracked') => ({ sha, cargoConclusion: 'success', churn });
const red = (sha, churn = 'tracked') => ({ sha, cargoConclusion: 'failure', churn });

describe('computeReadiness', () => {
  it('READY when >= N consecutive tracked greens', () => {
    const r = computeReadiness([green('a'), green('b'), green('c')], { n: 3 });
    expect(r.ready).toBe(true);
    expect(r.streak).toBe(3);
  });

  it('NOT READY when tracked greens < N', () => {
    const r = computeReadiness([green('a'), green('b')], { n: 3 });
    expect(r.ready).toBe(false);
    expect(r.streak).toBe(2);
  });

  it('untracked commits are transparent — neither count nor break', () => {
    const runs = [
      green('a', 'tracked'),
      { sha: 'ci1', cargoConclusion: 'success', churn: 'untracked' },
      green('b', 'tracked'),
      { sha: 'ci2', cargoConclusion: 'success', churn: 'untracked' },
      green('c', 'tracked'),
    ];
    const r = computeReadiness(runs, { n: 3 });
    expect(r.ready).toBe(true);
    expect(r.streak).toBe(3);
    expect(r.untrackedSkipped).toBe(2);
  });

  it('an untracked RED does not break the streak (lane-modifying self-test failure)', () => {
    const runs = [
      green('a'),
      { sha: 'ciRed', cargoConclusion: 'failure', churn: 'untracked' },
      green('b'),
      green('c'),
    ];
    const r = computeReadiness(runs, { n: 3 });
    expect(r.streak).toBe(3);
    expect(r.ready).toBe(true);
  });

  it('a tracked RED breaks the streak and stops the walk', () => {
    const runs = [green('a'), red('bad'), green('b'), green('c')];
    const r = computeReadiness(runs, { n: 3 });
    expect(r.streak).toBe(1);
    expect(r.ready).toBe(false);
    expect(r.broke).toMatchObject({ sha: 'bad', cargoConclusion: 'failure' });
  });

  it('a tracked breaking non-failure conclusion (timed_out / cancelled / action_required) ALSO breaks', () => {
    // Pins the BREAKING Set boundary (defer-bias). A flaky-infra timeout/cancel is the
    // CANONICAL lane-reliability signal this gate exists to de-risk — it MUST break the
    // streak, not fall through to the transparent "no verdict" branch (which would
    // silently ADVANCE the flip on a flaky lane). Without this, shrinking BREAKING to
    // just ['failure'] passes the rest of the suite.
    for (const concl of ['timed_out', 'cancelled', 'action_required']) {
      const runs = [green('a'), { sha: 'flaky', cargoConclusion: concl, churn: 'tracked' }, green('b'), green('c')];
      const r = computeReadiness(runs, { n: 3 });
      expect(r.streak).toBe(1);
      expect(r.ready).toBe(false);
      expect(r.broke).toMatchObject({ sha: 'flaky', cargoConclusion: concl });
    }
  });

  it('a tracked non-green non-breaking conclusion (neutral) is transparent — does NOT advance', () => {
    // Pins the GREEN Set boundary (defer-bias). Only `success` may increment the streak;
    // a `neutral` (or any other non-success) tracked conclusion must be transparent — never
    // counted — else a non-green run would ADVANCE the flip. Without this, expanding GREEN
    // to ['success','neutral'] passes the rest of the suite.
    const runs = [green('a'), { sha: 'neut', cargoConclusion: 'neutral', churn: 'tracked' }, green('b')];
    const r = computeReadiness(runs, { n: 3 });
    expect(r.streak).toBe(2); // only the two greens counted; neutral neither advanced...
    expect(r.ready).toBe(false);
    expect(r.broke).toBeNull(); // ...nor broke the streak
  });

  it('a tracked commit with no cargo verdict (skipped/null) is transparent', () => {
    const runs = [
      green('a'),
      { sha: 'skip', cargoConclusion: 'skipped', churn: 'tracked' },
      green('b'),
      green('c'),
    ];
    const r = computeReadiness(runs, { n: 3 });
    expect(r.streak).toBe(3);
    expect(r.ready).toBe(true);
    expect(r.broke).toBeNull();
  });

  it('a pre-lane commit (no cargo job → null conclusion) is transparent', () => {
    const runs = [
      green('a'),
      { sha: 'preLane', cargoConclusion: null, churn: 'tracked' },
      green('b'),
      green('c'),
    ];
    const r = computeReadiness(runs, { n: 3 });
    expect(r.streak).toBe(3);
    expect(r.ready).toBe(true);
  });

  it('the real v936→v937 cargo reality is READY (3 tracked greens, 1 lane-change skipped)', () => {
    // Mirrors ground truth: three post-introduction green cargo runs on commits that
    // did NOT touch ci.yml, plus the lane-defining ci(cargo) commit (touches ci.yml →
    // untracked, excluded even though green).
    const runs = [
      { sha: 'aadee1e2f', cargoConclusion: 'success', churn: 'tracked' },   // v937 post-ship (docs)
      { sha: '2b1813ec2', cargoConclusion: 'success', churn: 'tracked' },   // v937 chore (bump)
      { sha: 'db30cfd78', cargoConclusion: 'success', churn: 'tracked' },   // v936 post-ship (docs)
      { sha: '0cb1dfb65', cargoConclusion: 'success', churn: 'untracked' }, // ci(cargo) lane def
    ];
    const r = computeReadiness(runs, { n: 3 });
    expect(r.ready).toBe(true);
    expect(r.streak).toBe(3);
    expect(r.untrackedSkipped).toBe(1);
  });
});

// ─── CLI (spawnSync + injected --runs-file; no gh/git) ──────────────────────────

describe('CLI', () => {
  it('exits 0 + prints READY when >= N tracked greens (via changedFiles classification)', () => {
    const runs = [
      { sha: 'a', cargoConclusion: 'success', changedFiles: ['docs/RELEASE-HISTORY.md'] },
      { sha: 'b', cargoConclusion: 'success', changedFiles: ['src-tauri/Cargo.toml'] },
      { sha: 'c', cargoConclusion: 'success', changedFiles: ['docs/release-notes/STORY.md'] },
    ];
    const { status, stdout } = runCli(runs);
    expect(status).toBe(0);
    expect(stdout).toContain('READY');
    expect(stdout).not.toContain('NOT READY');
  });

  it('exits 1 + prints NOT READY when tracked greens < N', () => {
    const runs = [
      { sha: 'a', cargoConclusion: 'success', changedFiles: ['docs/x.md'] },
      { sha: 'ci', cargoConclusion: 'success', changedFiles: ['.github/workflows/ci.yml'] },
    ];
    const { status, stdout } = runCli(runs);
    expect(status).toBe(1);
    expect(stdout).toContain('NOT READY');
  });

  it('respects --n override (1 tracked green is READY at --n=1)', () => {
    const runs = [{ sha: 'a', cargoConclusion: 'success', changedFiles: ['docs/x.md'] }];
    const { status, stdout } = runCli(runs, ['--n=1']);
    expect(status).toBe(0);
    expect(stdout).toContain('READY');
  });

  it('--json emits a parseable summary with the readiness fields', () => {
    const runs = [
      { sha: 'a', cargoConclusion: 'success', changedFiles: ['docs/a.md'] },
      { sha: 'b', cargoConclusion: 'success', changedFiles: ['src-tauri/Cargo.toml'] },
      { sha: 'c', cargoConclusion: 'success', changedFiles: ['docs/c.md'] },
    ];
    const { status, stdout } = runCli(runs, ['--json']);
    expect(status).toBe(0);
    const parsed = JSON.parse(stdout);
    expect(parsed.ready).toBe(true);
    expect(parsed.streak).toBe(3);
    expect(parsed.n).toBe(3);
    expect(parsed.trackedGreens).toBe(3);
  });

  it('exits 2 (indeterminate) on an empty runs list', () => {
    const { status, stderr } = runCli([]);
    expect(status).toBe(2);
    expect(stderr).toContain('indeterminate');
  });

  it('rejects a non-integer --n (exit 2), matching the "positive integer" message', () => {
    const runs = [{ sha: 'a', cargoConclusion: 'success', changedFiles: ['docs/x.md'] }];
    const { status, stderr } = runCli(runs, ['--n=1.5']);
    expect(status).toBe(2);
    expect(stderr).toContain('positive integer');
  });

  it('flags windowExhausted when NOT READY and not broken by a red', () => {
    const runs = [
      { sha: 'a', cargoConclusion: 'success', changedFiles: ['docs/x.md'] },
      { sha: 'ci', cargoConclusion: 'success', changedFiles: ['.github/workflows/ci.yml'] },
    ];
    const { stdout } = runCli(runs, ['--json']);
    expect(JSON.parse(stdout).windowExhausted).toBe(true);
  });

  it('does NOT flag windowExhausted when the streak was broken by a tracked red', () => {
    const runs = [
      { sha: 'a', cargoConclusion: 'success', changedFiles: ['docs/x.md'] },
      { sha: 'bad', cargoConclusion: 'failure', changedFiles: ['src-tauri/src/lib.rs'] },
    ];
    const { stdout } = runCli(runs, ['--json']);
    expect(JSON.parse(stdout).windowExhausted).toBe(false);
  });

  it('runs correctly through a SYMLINK (the realpath CLI guard, not raw-string match)', () => {
    // A naive `import.meta.url === file://${argv[1]}` guard silently no-ops under
    // symlink invocation → empty output + exit 0 (= READY), inverting the bias.
    const dir = mkdtempSync(join(tmpdir(), 'cargo-flip-link-'));
    try {
      const f = join(dir, 'runs.json');
      writeFileSync(f, JSON.stringify([
        { sha: 'a', cargoConclusion: 'success', changedFiles: ['docs/a.md'] },
        { sha: 'b', cargoConclusion: 'success', changedFiles: ['docs/b.md'] },
        { sha: 'c', cargoConclusion: 'success', changedFiles: ['docs/c.md'] },
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

  it('the real v936→v937 history is READY via changedFiles classification', () => {
    // Ground-truth shape: three post-introduction green cargo runs (docs-only / bump,
    // none touching ci.yml → tracked) + the lane-defining ci(cargo) commit (touches
    // ci.yml → untracked, excluded). streak 3 ≥ 3 → READY.
    const runs = [
      { sha: 'aadee1e2f', cargoConclusion: 'success', changedFiles: ['docs/RELEASE-HISTORY.md'] },
      { sha: '2b1813ec2', cargoConclusion: 'success', changedFiles: ['package.json', 'package-lock.json', 'src-tauri/Cargo.toml', 'src-tauri/tauri.conf.json', 'docs/release-notes/STORY.md'] },
      { sha: 'db30cfd78', cargoConclusion: 'success', changedFiles: ['docs/RELEASE-HISTORY.md'] },
      { sha: '0cb1dfb65', cargoConclusion: 'success', changedFiles: ['.github/workflows/ci.yml', 'tests/integration/ci-matrix-parity.test.ts'] },
    ];
    const { status, stdout } = runCli(runs, ['--json']);
    expect(status).toBe(0);
    const parsed = JSON.parse(stdout);
    expect(parsed.ready).toBe(true);
    expect(parsed.streak).toBe(3);
    expect(parsed.untrackedSkipped).toBe(1);
  });

  it('post-flip (--ci-file flipped): READY guidance says "ALREADY load-bearing" / REVERT', () => {
    const dir = mkdtempSync(join(tmpdir(), 'cargo-flip-ci-'));
    try {
      const ci = join(dir, 'ci.yml');
      writeFileSync(ci, FLIPPED_CI);
      const runs = [
        { sha: 'a', cargoConclusion: 'success', changedFiles: ['docs/a.md'] },
        { sha: 'b', cargoConclusion: 'success', changedFiles: ['docs/b.md'] },
        { sha: 'c', cargoConclusion: 'success', changedFiles: ['docs/c.md'] },
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

  it('pre-flip (--ci-file staged): READY guidance says "Safe to flip", not the REVERT text', () => {
    const dir = mkdtempSync(join(tmpdir(), 'cargo-flip-ci-'));
    try {
      const ci = join(dir, 'ci.yml');
      writeFileSync(ci, STAGED_CI);
      const runs = [
        { sha: 'a', cargoConclusion: 'success', changedFiles: ['docs/a.md'] },
        { sha: 'b', cargoConclusion: 'success', changedFiles: ['docs/b.md'] },
        { sha: 'c', cargoConclusion: 'success', changedFiles: ['docs/c.md'] },
      ];
      const { status, stdout } = runCli(runs, [`--ci-file=${ci}`]);
      expect(status).toBe(0);
      expect(stdout).toContain('Safe to flip');
      expect(stdout).not.toContain('ALREADY load-bearing');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('--json includes flipState (staged via --ci-file)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'cargo-flip-ci-'));
    try {
      const ci = join(dir, 'ci.yml');
      writeFileSync(ci, STAGED_CI);
      const runs = [{ sha: 'a', cargoConclusion: 'success', changedFiles: ['docs/a.md'] }];
      const { stdout } = runCli(runs, ['--json', `--ci-file=${ci}`]);
      expect(JSON.parse(stdout).flipState).toBe('staged');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
