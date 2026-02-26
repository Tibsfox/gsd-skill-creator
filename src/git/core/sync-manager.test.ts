/**
 * Tests for sync manager — fetch upstream, rebase/merge strategies,
 * conflict detection and abort, dry-run mode.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockExecFile,
  mockAssertClean,
  mockAssertState,
  mockLoadConfig,
  mockSaveConfig,
} = vi.hoisted(() => ({
  mockExecFile: vi.fn(),
  mockAssertClean: vi.fn(),
  mockAssertState: vi.fn(),
  mockLoadConfig: vi.fn(),
  mockSaveConfig: vi.fn(),
}));

vi.mock('node:child_process', () => ({
  execFile: mockExecFile,
}));

vi.mock('./state-machine.js', () => ({
  assertClean: (...args: unknown[]) => mockAssertClean(...args),
  assertState: (...args: unknown[]) => mockAssertState(...args),
}));

vi.mock('./repo-manager.js', () => ({
  loadConfig: (...args: unknown[]) => mockLoadConfig(...args),
  saveConfig: (...args: unknown[]) => mockSaveConfig(...args),
}));

import { sync } from './sync-manager.js';
import type { SyncOptions } from './sync-manager.js';

/**
 * Helper: make mockExecFile resolve with stdout.
 */
function execFileResolves(stdout: string): void {
  mockExecFile.mockImplementationOnce(
    (_cmd: string, _args: string[], _opts: unknown, cb: (err: null, stdout: string, stderr: string) => void) => {
      cb(null, stdout, '');
    },
  );
}

/**
 * Helper: make mockExecFile reject with error.
 */
function execFileRejects(message: string): void {
  mockExecFile.mockImplementationOnce(
    (_cmd: string, _args: string[], _opts: unknown, cb: (err: Error) => void) => {
      const err = new Error(message);
      cb(err);
    },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAssertClean.mockResolvedValue(undefined);
  mockAssertState.mockResolvedValue(undefined);
  mockLoadConfig.mockResolvedValue({
    repo: 'test-repo',
    upstream: 'https://github.com/org/repo.git',
    origin: 'https://github.com/user/repo.git',
    devBranch: 'dev',
    mainBranch: 'main',
    gates: { mergeToMain: true, prToUpstream: true },
    worktreeRoot: '/tmp/worktrees/test-repo',
    installedAt: '2026-01-01T00:00:00Z',
    lastSync: null,
  });
  mockSaveConfig.mockResolvedValue(undefined);
});

describe('sync with rebase strategy (default)', () => {
  it('returns success with 0 new commits when up to date', async () => {
    // git fetch upstream
    execFileResolves('');
    // git rev-list --count dev..upstream/main
    execFileResolves('0');

    const result = await sync('/repo');

    expect(result.newCommits).toBe(0);
    expect(result.conflicted).toBe(false);
  });

  it('rebases successfully with new commits', async () => {
    // git fetch upstream
    execFileResolves('');
    // git rev-list --count dev..upstream/main
    execFileResolves('3');
    // git rebase upstream/main
    execFileResolves('');
    // git rev-parse HEAD
    execFileResolves('abc1234');

    const result = await sync('/repo');

    expect(result.newCommits).toBe(3);
    expect(result.conflicted).toBe(false);
    expect(result.currentHead).toBe('abc1234');
  });

  it('aborts rebase on conflict and reports conflict files', async () => {
    // git fetch upstream
    execFileResolves('');
    // git rev-list --count dev..upstream/main
    execFileResolves('2');
    // git rebase upstream/main (fails with conflict)
    execFileRejects('CONFLICT (content): Merge conflict in src/index.ts');
    // git diff --name-only --diff-filter=U (get conflict files)
    execFileResolves('src/index.ts\nsrc/utils.ts');
    // git rebase --abort
    execFileResolves('');

    const result = await sync('/repo');

    expect(result.conflicted).toBe(true);
    expect(result.conflictFiles).toContain('src/index.ts');
    expect(result.conflictFiles).toContain('src/utils.ts');
  });

  it('throws when working tree is dirty', async () => {
    mockAssertClean.mockRejectedValueOnce(
      new Error('Repository is not clean: state is DIRTY'),
    );

    await expect(sync('/repo')).rejects.toThrow('not clean');
  });
});

describe('sync with merge strategy', () => {
  it('merges successfully with new commits', async () => {
    // git fetch upstream
    execFileResolves('');
    // git rev-list --count dev..upstream/main
    execFileResolves('5');
    // git merge upstream/main --no-ff
    execFileResolves('');
    // git rev-parse HEAD
    execFileResolves('def5678');

    const options: SyncOptions = { strategy: 'merge' };
    const result = await sync('/repo', options);

    expect(result.newCommits).toBe(5);
    expect(result.conflicted).toBe(false);
    expect(result.currentHead).toBe('def5678');
  });

  it('aborts merge on conflict and reports files', async () => {
    // git fetch upstream
    execFileResolves('');
    // git rev-list --count dev..upstream/main
    execFileResolves('2');
    // git merge upstream/main --no-ff (fails)
    execFileRejects('CONFLICT (content): Merge conflict in README.md');
    // git diff --name-only --diff-filter=U
    execFileResolves('README.md');
    // git merge --abort
    execFileResolves('');

    const options: SyncOptions = { strategy: 'merge' };
    const result = await sync('/repo', options);

    expect(result.conflicted).toBe(true);
    expect(result.conflictFiles).toContain('README.md');
  });
});

describe('sync with dry-run', () => {
  it('fetches and counts commits without modifying local branch', async () => {
    // git fetch upstream
    execFileResolves('');
    // git rev-list --count dev..upstream/main
    execFileResolves('4');
    // git log --oneline dev..upstream/main
    execFileResolves(
      'abc1234 fix: memory leak\ndef5678 feat: new api\n1234567 docs: update readme\n7654321 chore: bump deps',
    );

    const result = await sync('/repo', { dryRun: true });

    expect(result.newCommits).toBe(4);
    expect(result.conflicted).toBe(false);
    expect(result.dryRun).toBe(true);
    expect(result.upstreamLog).toBeDefined();
    expect(result.upstreamLog!.length).toBe(4);
  });

  it('does NOT call rebase or merge', async () => {
    // git fetch upstream
    execFileResolves('');
    // git rev-list --count dev..upstream/main
    execFileResolves('2');
    // git log --oneline dev..upstream/main
    execFileResolves('abc1234 fix: bug\ndef5678 feat: thing');

    await sync('/repo', { dryRun: true });

    // Verify no rebase/merge commands were called
    const allCalls = mockExecFile.mock.calls;
    for (const call of allCalls) {
      const args = call[1] as string[];
      expect(args).not.toContain('rebase');
      expect(args).not.toContain('merge');
    }
  });
});
