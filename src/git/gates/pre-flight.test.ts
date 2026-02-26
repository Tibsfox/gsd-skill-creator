import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DiffSummary, FileDiff, GitStateReport } from '../types.js';

// ---------------------------------------------------------------------------
// Mock child_process.execSync before importing the module under test
// ---------------------------------------------------------------------------

const { mockExecSync } = vi.hoisted(() => ({
  mockExecSync: vi.fn(),
}));

vi.mock('node:child_process', () => ({
  execSync: mockExecSync,
}));

vi.mock('node:fs', () => ({
  existsSync: vi.fn(() => false),
}));

// Import after mocks are set up
import { preFlightMerge, preFlightPR } from './pre-flight.js';
import type { PreFlightResult, PreFlightCheck, CommitEntry } from './pre-flight.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setupCleanRepo(): void {
  mockExecSync.mockImplementation((cmd: string) => {
    const command = cmd as string;
    if (command.includes('rev-parse --git-dir')) return '.git';
    if (command.includes('rev-parse --abbrev-ref HEAD')) return 'dev';
    if (command.includes('status --porcelain=v2')) return '';
    if (command.includes('remote -v')) {
      return 'origin\thttps://github.com/user/repo.git (fetch)\nupstream\thttps://github.com/upstream/repo.git (fetch)\n';
    }
    if (command.includes('config remote.')) return '+refs/heads/*:refs/remotes/origin/*';
    if (command.includes('rev-list --left-right --count')) return '0\t0';
    // Default for rev-list --count (commits ahead)
    if (command.includes('rev-list --count main..dev')) return '3';
    if (command.includes('rev-list --count dev..upstream/main')) return '0';
    if (command.includes('rev-list --count upstream/main..main')) return '3';
    // Diff stat
    if (command.includes('diff --stat main..dev') || command.includes('diff --stat upstream/main..main')) {
      return ' src/foo.ts | 10 +++++++---\n src/bar.ts | 5 +++++\n 2 files changed, 12 insertions(+), 3 deletions(-)';
    }
    // Name-status
    if (command.includes('diff --name-status main..dev') || command.includes('diff --name-status upstream/main..main')) {
      return 'A\tsrc/foo.ts\nM\tsrc/bar.ts';
    }
    // Numstat for large file check
    if (command.includes('diff --numstat')) {
      return '10\t3\tsrc/foo.ts\n5\t0\tsrc/bar.ts';
    }
    // Commit log
    if (command.includes('log --format=')) {
      return 'abc1234|feat: add foo|Alice|2026-02-26T10:00:00Z\ndef5678|fix: fix bar|Bob|2026-02-26T11:00:00Z\nghi9012|test: add tests|Alice|2026-02-26T12:00:00Z';
    }
    // Merge dry-run
    if (command.includes('merge --no-commit --no-ff')) return '';
    if (command.includes('merge --abort')) return '';
    if (command.includes('checkout')) return '';
    // cat-file for large binary detection
    if (command.includes('cat-file -s')) return '500';
    return '';
  });
}

// ---------------------------------------------------------------------------
// preFlightMerge
// ---------------------------------------------------------------------------

describe('preFlightMerge', () => {
  beforeEach(() => {
    mockExecSync.mockReset();
  });

  it('clean pass: dev ahead of main, clean tree, no conflicts', async () => {
    setupCleanRepo();

    const result = await preFlightMerge('/repo');

    expect(result).toBeDefined();
    expect(result.checks).toBeInstanceOf(Array);

    // All checks pass (none blocking)
    const blockers = result.checks.filter((c: PreFlightCheck) => c.level === 'BLOCKING' && !c.passed);
    expect(blockers).toHaveLength(0);

    // Summary has DiffSummary shape
    expect(result.summary).toBeDefined();
    expect(typeof result.summary.filesChanged).toBe('number');
    expect(typeof result.summary.insertions).toBe('number');
    expect(typeof result.summary.deletions).toBe('number');
    expect(result.summary.files).toBeInstanceOf(Array);

    // Commit log has entries
    expect(result.commitLog).toBeInstanceOf(Array);
    expect(result.commitLog.length).toBeGreaterThan(0);
    expect(result.commitLog[0]).toHaveProperty('hash');
    expect(result.commitLog[0]).toHaveProperty('subject');
    expect(result.commitLog[0]).toHaveProperty('author');
    expect(result.commitLog[0]).toHaveProperty('date');
  });

  it('dirty tree: uncommitted changes produce BLOCKING check', async () => {
    setupCleanRepo();
    mockExecSync.mockImplementation((cmd: string) => {
      if (cmd.includes('rev-parse --git-dir')) return '.git';
      if (cmd.includes('rev-parse --abbrev-ref HEAD')) return 'dev';
      if (cmd.includes('status --porcelain=v2')) return '1 .M N... 100644 100644 100644 abc def src/dirty.ts';
      if (cmd.includes('remote -v')) return 'origin\thttps://x (fetch)\nupstream\thttps://y (fetch)\n';
      if (cmd.includes('config remote.')) return '+refs/heads/*:refs/remotes/origin/*';
      if (cmd.includes('rev-list')) return '0';
      return '';
    });

    const result = await preFlightMerge('/repo');
    const blockers = result.checks.filter((c: PreFlightCheck) => c.level === 'BLOCKING' && !c.passed);
    expect(blockers.length).toBeGreaterThan(0);
    expect(blockers.some((b: PreFlightCheck) => b.message.toLowerCase().includes('clean'))).toBe(true);
  });

  it('nothing to merge: dev = main (0 commits ahead) produces BLOCKING check', async () => {
    setupCleanRepo();
    mockExecSync.mockImplementation((cmd: string) => {
      if (cmd.includes('rev-parse --git-dir')) return '.git';
      if (cmd.includes('rev-parse --abbrev-ref HEAD')) return 'dev';
      if (cmd.includes('status --porcelain=v2')) return '';
      if (cmd.includes('remote -v')) return 'origin\thttps://x (fetch)\nupstream\thttps://y (fetch)\n';
      if (cmd.includes('config remote.')) return '+refs/heads/*:refs/remotes/origin/*';
      if (cmd.includes('rev-list --left-right')) return '0\t0';
      if (cmd.includes('rev-list --count main..dev')) return '0';
      if (cmd.includes('rev-list --count dev..upstream/main')) return '0';
      return '';
    });

    const result = await preFlightMerge('/repo');
    const blockers = result.checks.filter((c: PreFlightCheck) => c.level === 'BLOCKING' && !c.passed);
    expect(blockers.length).toBeGreaterThan(0);
    expect(blockers.some((b: PreFlightCheck) => b.message.toLowerCase().includes('no commits'))).toBe(true);
  });

  it('behind upstream: dev behind upstream/main produces WARNING (not blocking)', async () => {
    setupCleanRepo();
    mockExecSync.mockImplementation((cmd: string) => {
      if (cmd.includes('rev-parse --git-dir')) return '.git';
      if (cmd.includes('rev-parse --abbrev-ref HEAD')) return 'dev';
      if (cmd.includes('status --porcelain=v2')) return '';
      if (cmd.includes('remote -v')) return 'origin\thttps://x (fetch)\nupstream\thttps://y (fetch)\n';
      if (cmd.includes('config remote.')) return '+refs/heads/*:refs/remotes/origin/*';
      if (cmd.includes('rev-list --left-right')) return '0\t0';
      if (cmd.includes('rev-list --count main..dev')) return '3';
      if (cmd.includes('rev-list --count dev..upstream/main')) return '2';
      if (cmd.includes('diff --stat')) return ' src/foo.ts | 10 +++\n 1 file changed, 10 insertions(+)';
      if (cmd.includes('diff --name-status')) return 'A\tsrc/foo.ts';
      if (cmd.includes('diff --numstat')) return '10\t0\tsrc/foo.ts';
      if (cmd.includes('log --format=')) return 'abc1234|feat: add foo|Alice|2026-02-26T10:00:00Z';
      if (cmd.includes('merge --no-commit')) return '';
      if (cmd.includes('merge --abort')) return '';
      if (cmd.includes('checkout')) return '';
      return '';
    });

    const result = await preFlightMerge('/repo');
    const warnings = result.checks.filter((c: PreFlightCheck) => c.level === 'WARNING' && !c.passed);
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.some((w: PreFlightCheck) => w.message.toLowerCase().includes('behind') || w.message.toLowerCase().includes('sync'))).toBe(true);

    // Not blocking
    const blockers = result.checks.filter((c: PreFlightCheck) => c.level === 'BLOCKING' && !c.passed);
    expect(blockers).toHaveLength(0);
  });

  it('conflict detected: dry-run merge fails produces BLOCKING check', async () => {
    setupCleanRepo();
    mockExecSync.mockImplementation((cmd: string) => {
      if (cmd.includes('rev-parse --git-dir')) return '.git';
      if (cmd.includes('rev-parse --abbrev-ref HEAD')) return 'dev';
      if (cmd.includes('status --porcelain=v2')) return '';
      if (cmd.includes('remote -v')) return 'origin\thttps://x (fetch)\nupstream\thttps://y (fetch)\n';
      if (cmd.includes('config remote.')) return '+refs/heads/*:refs/remotes/origin/*';
      if (cmd.includes('rev-list --left-right')) return '0\t0';
      if (cmd.includes('rev-list --count main..dev')) return '3';
      if (cmd.includes('rev-list --count dev..upstream/main')) return '0';
      if (cmd.includes('diff --stat')) return ' src/foo.ts | 10 +++\n 1 file changed, 10 insertions(+)';
      if (cmd.includes('diff --name-status')) return 'A\tsrc/foo.ts';
      if (cmd.includes('diff --numstat')) return '10\t0\tsrc/foo.ts';
      if (cmd.includes('log --format=')) return 'abc1234|feat: add foo|Alice|2026-02-26T10:00:00Z';
      if (cmd.includes('merge --no-commit --no-ff')) {
        throw new Error('merge conflict');
      }
      if (cmd.includes('merge --abort')) return '';
      if (cmd.includes('checkout')) return '';
      return '';
    });

    const result = await preFlightMerge('/repo');
    const blockers = result.checks.filter((c: PreFlightCheck) => c.level === 'BLOCKING' && !c.passed);
    expect(blockers.length).toBeGreaterThan(0);
    expect(blockers.some((b: PreFlightCheck) => b.message.toLowerCase().includes('conflict'))).toBe(true);
  });

  it('dry-run merge always aborted: git merge --abort called regardless of outcome', async () => {
    setupCleanRepo();

    await preFlightMerge('/repo');

    // Check that merge --abort was called
    const calls = mockExecSync.mock.calls.map((c: unknown[]) => String(c[0]));
    const mergeNoCommitIdx = calls.findIndex((c: string) => c.includes('merge --no-commit --no-ff'));
    const mergeAbortIdx = calls.findIndex((c: string, i: number) => i > mergeNoCommitIdx && c.includes('merge --abort'));

    // merge --no-commit was called
    expect(mergeNoCommitIdx).toBeGreaterThanOrEqual(0);
    // merge --abort was called AFTER merge --no-commit
    expect(mergeAbortIdx).toBeGreaterThan(mergeNoCommitIdx);
  });
});

// ---------------------------------------------------------------------------
// preFlightPR
// ---------------------------------------------------------------------------

describe('preFlightPR', () => {
  beforeEach(() => {
    mockExecSync.mockReset();
  });

  it('clean pass: main ahead of upstream, clean tree', async () => {
    setupCleanRepo();
    // Override to be on main branch
    mockExecSync.mockImplementation((cmd: string) => {
      if (cmd.includes('rev-parse --git-dir')) return '.git';
      if (cmd.includes('rev-parse --abbrev-ref HEAD')) return 'main';
      if (cmd.includes('status --porcelain=v2')) return '';
      if (cmd.includes('remote -v')) return 'origin\thttps://x (fetch)\nupstream\thttps://y (fetch)\n';
      if (cmd.includes('config remote.')) return '+refs/heads/*:refs/remotes/origin/*';
      if (cmd.includes('rev-list --left-right')) return '0\t0';
      if (cmd.includes('rev-list --count upstream/main..main')) return '3';
      if (cmd.includes('diff --stat')) return ' src/foo.ts | 10 +++\n 1 file changed, 10 insertions(+)';
      if (cmd.includes('diff --name-status')) return 'A\tsrc/foo.ts';
      if (cmd.includes('diff --numstat')) return '10\t0\tsrc/foo.ts';
      if (cmd.includes('log --format=')) return 'abc1234|feat: add foo|Alice|2026-02-26T10:00:00Z';
      if (cmd.includes('cat-file -s')) return '500';
      return '';
    });

    const result = await preFlightPR('/repo');

    expect(result).toBeDefined();
    expect(result.checks).toBeInstanceOf(Array);

    // No blocking failures
    const blockers = result.checks.filter((c: PreFlightCheck) => c.level === 'BLOCKING' && !c.passed);
    expect(blockers).toHaveLength(0);

    // Summary has DiffSummary shape
    expect(result.summary).toBeDefined();
    expect(typeof result.summary.filesChanged).toBe('number');
    expect(result.summary.files).toBeInstanceOf(Array);
  });

  it('nothing to PR: main = upstream/main produces BLOCKING check', async () => {
    mockExecSync.mockImplementation((cmd: string) => {
      if (cmd.includes('rev-parse --git-dir')) return '.git';
      if (cmd.includes('rev-parse --abbrev-ref HEAD')) return 'main';
      if (cmd.includes('status --porcelain=v2')) return '';
      if (cmd.includes('remote -v')) return 'origin\thttps://x (fetch)\nupstream\thttps://y (fetch)\n';
      if (cmd.includes('config remote.')) return '+refs/heads/*:refs/remotes/origin/*';
      if (cmd.includes('rev-list --left-right')) return '0\t0';
      if (cmd.includes('rev-list --count upstream/main..main')) return '0';
      return '';
    });

    const result = await preFlightPR('/repo');
    const blockers = result.checks.filter((c: PreFlightCheck) => c.level === 'BLOCKING' && !c.passed);
    expect(blockers.length).toBeGreaterThan(0);
    expect(blockers.some((b: PreFlightCheck) => b.message.toLowerCase().includes('no commits'))).toBe(true);
  });

  it('dirty state produces BLOCKING check', async () => {
    mockExecSync.mockImplementation((cmd: string) => {
      if (cmd.includes('rev-parse --git-dir')) return '.git';
      if (cmd.includes('rev-parse --abbrev-ref HEAD')) return 'main';
      if (cmd.includes('status --porcelain=v2')) return '1 .M N... 100644 100644 100644 abc def src/dirty.ts';
      if (cmd.includes('remote -v')) return 'origin\thttps://x (fetch)\nupstream\thttps://y (fetch)\n';
      if (cmd.includes('config remote.')) return '+refs/heads/*:refs/remotes/origin/*';
      if (cmd.includes('rev-list')) return '0';
      return '';
    });

    const result = await preFlightPR('/repo');
    const blockers = result.checks.filter((c: PreFlightCheck) => c.level === 'BLOCKING' && !c.passed);
    expect(blockers.length).toBeGreaterThan(0);
    expect(blockers.some((b: PreFlightCheck) => b.message.toLowerCase().includes('clean'))).toBe(true);
  });

  it('large binary warning: file >1MB produces WARNING', async () => {
    mockExecSync.mockImplementation((cmd: string) => {
      if (cmd.includes('rev-parse --git-dir')) return '.git';
      if (cmd.includes('rev-parse --abbrev-ref HEAD')) return 'main';
      if (cmd.includes('status --porcelain=v2')) return '';
      if (cmd.includes('remote -v')) return 'origin\thttps://x (fetch)\nupstream\thttps://y (fetch)\n';
      if (cmd.includes('config remote.')) return '+refs/heads/*:refs/remotes/origin/*';
      if (cmd.includes('rev-list --left-right')) return '0\t0';
      if (cmd.includes('rev-list --count upstream/main..main')) return '1';
      if (cmd.includes('diff --stat')) return ' assets/big.bin | Bin 0 -> 2097152\n 1 file changed, 0 insertions(+)';
      if (cmd.includes('diff --name-status')) return 'A\tassets/big.bin';
      if (cmd.includes('diff --numstat')) return '-\t-\tassets/big.bin';
      if (cmd.includes('log --format=')) return 'abc1234|feat: add binary|Alice|2026-02-26T10:00:00Z';
      if (cmd.includes('cat-file -s')) return '2097152'; // 2MB
      return '';
    });

    const result = await preFlightPR('/repo');
    const warnings = result.checks.filter((c: PreFlightCheck) => c.level === 'WARNING' && !c.passed);
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.some((w: PreFlightCheck) => w.message.toLowerCase().includes('large'))).toBe(true);
  });

  it('poorly formed commit messages produce WARNING (not blocking)', async () => {
    mockExecSync.mockImplementation((cmd: string) => {
      if (cmd.includes('rev-parse --git-dir')) return '.git';
      if (cmd.includes('rev-parse --abbrev-ref HEAD')) return 'main';
      if (cmd.includes('status --porcelain=v2')) return '';
      if (cmd.includes('remote -v')) return 'origin\thttps://x (fetch)\nupstream\thttps://y (fetch)\n';
      if (cmd.includes('config remote.')) return '+refs/heads/*:refs/remotes/origin/*';
      if (cmd.includes('rev-list --left-right')) return '0\t0';
      if (cmd.includes('rev-list --count upstream/main..main')) return '2';
      if (cmd.includes('diff --stat')) return ' src/foo.ts | 10 +++\n 1 file changed, 10 insertions(+)';
      if (cmd.includes('diff --name-status')) return 'M\tsrc/foo.ts';
      if (cmd.includes('diff --numstat')) return '10\t0\tsrc/foo.ts';
      if (cmd.includes('log --format=')) return 'abc1234|WIP fixup squash|Alice|2026-02-26T10:00:00Z\ndef5678|fixup! temporary|Bob|2026-02-26T11:00:00Z';
      if (cmd.includes('cat-file -s')) return '500';
      return '';
    });

    const result = await preFlightPR('/repo');
    const warnings = result.checks.filter((c: PreFlightCheck) => c.level === 'WARNING' && !c.passed);
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.some((w: PreFlightCheck) =>
      w.message.toLowerCase().includes('commit') || w.message.toLowerCase().includes('wip') || w.message.toLowerCase().includes('quality'),
    )).toBe(true);

    // Not blocking
    const blockers = result.checks.filter((c: PreFlightCheck) => c.level === 'BLOCKING' && !c.passed);
    expect(blockers).toHaveLength(0);
  });
});
