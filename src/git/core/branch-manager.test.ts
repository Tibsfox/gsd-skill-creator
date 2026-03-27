/**
 * Tests for branch manager — branch creation, listing, removal,
 * worktree management, and naming convention enforcement.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockExecFile,
  mockAssertClean,
  mockDetectState,
  mockLoadConfig,
} = vi.hoisted(() => ({
  mockExecFile: vi.fn(),
  mockAssertClean: vi.fn(),
  mockDetectState: vi.fn(),
  mockLoadConfig: vi.fn(),
}));

vi.mock('node:child_process', () => ({
  execFile: mockExecFile,
}));

vi.mock('./state-machine.js', () => ({
  assertClean: (...args: unknown[]) => mockAssertClean(...args),
  detectState: (...args: unknown[]) => mockDetectState(...args),
}));

vi.mock('./repo-manager.js', () => ({
  loadConfig: (...args: unknown[]) => mockLoadConfig(...args),
}));

import {
  validateBranchName,
  createBranch,
  listBranches,
  removeBranch,
  listWorktrees,
} from './branch-manager.js';

/**
 * Helper: make mockExecFile resolve with given stdout.
 */
function execFileResolves(stdout: string): void {
  mockExecFile.mockImplementationOnce(
    (_cmd: string, _args: string[], _opts: unknown, cb: (err: null, stdout: string, stderr: string) => void) => {
      cb(null, stdout, '');
    },
  );
}

/**
 * Helper: make mockExecFile reject with given error.
 */
function execFileRejects(message: string, code = 1): void {
  mockExecFile.mockImplementationOnce(
    (_cmd: string, _args: string[], _opts: unknown, cb: (err: Error) => void) => {
      const err = new Error(message) as Error & { code: number };
      err.code = code;
      cb(err);
    },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAssertClean.mockResolvedValue(undefined);
  mockDetectState.mockResolvedValue({
    state: 'CLEAN',
    branch: 'dev',
    remotes: [],
    ahead: 0,
    behind: 0,
    staged: [],
    unstaged: [],
    untracked: [],
  });
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
});

describe('validateBranchName', () => {
  it('accepts valid bare name and prefixes with feature/', () => {
    const result = validateBranchName('login-page');
    expect(result).toBe('feature/login-page');
  });

  it('preserves existing feature/ prefix', () => {
    const result = validateBranchName('feature/auth-flow');
    expect(result).toBe('feature/auth-flow');
  });

  it('preserves existing fix/ prefix', () => {
    const result = validateBranchName('fix/memory-leak');
    expect(result).toBe('fix/memory-leak');
  });

  it('preserves existing docs/ prefix', () => {
    const result = validateBranchName('docs/api-guide');
    expect(result).toBe('docs/api-guide');
  });

  it('preserves existing refactor/ prefix', () => {
    const result = validateBranchName('refactor/cleanup');
    expect(result).toBe('refactor/cleanup');
  });

  it('rejects uppercase characters', () => {
    expect(() => validateBranchName('BAD-NAME')).toThrow();
  });

  it('rejects spaces', () => {
    expect(() => validateBranchName('bad name')).toThrow();
  });

  it('rejects special characters', () => {
    expect(() => validateBranchName('bad!name')).toThrow();
  });

  it('rejects double hyphens', () => {
    expect(() => validateBranchName('my--branch')).toThrow();
  });

  it('rejects names over 50 chars total', () => {
    const longName = 'feature/' + 'a'.repeat(50);
    expect(() => validateBranchName(longName)).toThrow();
  });

  it('accepts names exactly 50 chars', () => {
    // feature/ = 8 chars, so suffix can be 42 chars
    const name = 'feature/' + 'a'.repeat(42);
    expect(name.length).toBe(50);
    expect(() => validateBranchName(name)).not.toThrow();
  });
});

describe('createBranch', () => {
  it('creates a branch from dev without worktree', async () => {
    // git checkout -b feature/login-page dev
    execFileResolves('');
    // git checkout dev (switch back)
    execFileResolves('');
    // git config branch.feature/login-page.pushRemote origin
    execFileResolves('');

    const result = await createBranch('/repo', 'login-page');

    expect(mockAssertClean).toHaveBeenCalledWith('/repo');
    expect(result.branch).toBe('feature/login-page');
    expect(result.worktreePath).toBeUndefined();
  });

  it('creates a branch with worktree', async () => {
    // worktree-setup.sh call
    execFileResolves('{"success":true,"path":"/tmp/worktrees/test-repo/feature-login-page","branch":"feature/login-page"}');

    const result = await createBranch('/repo', 'login-page', { worktree: true });

    expect(mockAssertClean).toHaveBeenCalledWith('/repo');
    expect(result.branch).toBe('feature/login-page');
    expect(result.worktreePath).toBeDefined();
  });

  it('refuses if working tree is dirty', async () => {
    mockAssertClean.mockRejectedValueOnce(new Error('Repository is not clean: state is DIRTY'));

    await expect(createBranch('/repo', 'login-page')).rejects.toThrow('not clean');
  });

  it('sets pushRemote to origin', async () => {
    execFileResolves(''); // checkout -b
    execFileResolves(''); // checkout dev
    execFileResolves(''); // git config

    await createBranch('/repo', 'login-page');

    // Third call should be git config for pushRemote
    const configCall = mockExecFile.mock.calls.find(
      (call: unknown[]) => {
        const args = call[1] as string[];
        return args.includes('config') && args.some((a: string) => a.includes('pushRemote'));
      },
    );
    expect(configCall).toBeDefined();
  });
});

describe('listBranches', () => {
  it('returns all branches with metadata', async () => {
    // git branch --format
    execFileResolves(
      'dev abc1234 latest commit [ahead 2, behind 1]\n' +
      'feature/auth def5678 auth work [ahead 1]\n' +
      'main 1234567 release',
    );
    // git branch --show-current
    execFileResolves('dev');
    // git worktree list --porcelain (for cross-reference)
    execFileResolves('');

    const branches = await listBranches('/repo');

    expect(branches.length).toBeGreaterThanOrEqual(2);
    expect(branches.find((b) => b.name === 'dev')).toBeDefined();
  });
});

describe('listWorktrees', () => {
  it('returns active worktrees with details', async () => {
    execFileResolves(
      'worktree /repo\nHEAD abc1234\nbranch refs/heads/dev\n\n' +
      'worktree /tmp/worktrees/test-repo/feature-auth\nHEAD def5678\nbranch refs/heads/feature/auth\n',
    );
    // detectState for each worktree
    mockDetectState.mockResolvedValueOnce({
      state: 'CLEAN', branch: 'dev', remotes: [], ahead: 0, behind: 0, staged: [], unstaged: [], untracked: [],
    });
    mockDetectState.mockResolvedValueOnce({
      state: 'CLEAN', branch: 'feature/auth', remotes: [], ahead: 0, behind: 0, staged: [], unstaged: [], untracked: [],
    });

    const worktrees = await listWorktrees('/repo');

    expect(worktrees.length).toBe(2);
    expect(worktrees[0].path).toBe('/repo');
    expect(worktrees[1].branch).toBe('feature/auth');
  });
});

describe('removeBranch', () => {
  it('removes branch and associated worktree', async () => {
    // git worktree list --porcelain (check for worktree)
    execFileResolves(
      'worktree /tmp/worktrees/test-repo/feature-auth\nHEAD def5678\nbranch refs/heads/feature/auth\n',
    );
    // git merge-base --is-ancestor
    execFileResolves('');
    // git worktree remove
    execFileResolves('');
    // git branch -d
    execFileResolves('');

    await expect(removeBranch('/repo', 'feature/auth')).resolves.not.toThrow();
  });

  it('refuses to delete dev branch', async () => {
    await expect(removeBranch('/repo', 'dev')).rejects.toThrow(/[Cc]annot.*dev/);
  });

  it('refuses to delete main branch', async () => {
    await expect(removeBranch('/repo', 'main')).rejects.toThrow(/[Cc]annot.*main/);
  });

  it('throws for unmerged branch without force', async () => {
    // git worktree list --porcelain
    execFileResolves('');
    // git merge-base --is-ancestor fails (not merged)
    execFileRejects('not ancestor');

    await expect(removeBranch('/repo', 'feature/unmerged')).rejects.toThrow(/unmerged/i);
  });

  it('allows force delete of unmerged branch', async () => {
    // git worktree list --porcelain (no worktree)
    execFileResolves('');
    // git branch -D (force — skips merge check entirely)
    execFileResolves('');

    await expect(removeBranch('/repo', 'feature/unmerged', { force: true })).resolves.not.toThrow();
  });
});
