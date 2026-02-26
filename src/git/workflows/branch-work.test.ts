/**
 * Tests for branch-work workflow orchestrator — orchestrates
 * branch creation and removal with state checks and logging.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock branch-manager
const mockCreateBranch = vi.fn();
const mockRemoveBranch = vi.fn();
vi.mock('../core/branch-manager.js', () => ({
  createBranch: (...args: unknown[]) => mockCreateBranch(...args),
  removeBranch: (...args: unknown[]) => mockRemoveBranch(...args),
}));

// Mock state-machine
const mockAssertClean = vi.fn();
const mockDetectState = vi.fn();
vi.mock('../core/state-machine.js', () => ({
  assertClean: (...args: unknown[]) => mockAssertClean(...args),
  detectState: (...args: unknown[]) => mockDetectState(...args),
}));

// Mock repo-manager
const mockLoadConfig = vi.fn();
vi.mock('../core/repo-manager.js', () => ({
  loadConfig: (...args: unknown[]) => mockLoadConfig(...args),
}));

// Mock logger
const mockLogOperation = vi.fn();
vi.mock('../core/logger.js', () => ({
  logOperation: (...args: unknown[]) => mockLogOperation(...args),
}));

import { branchWork, branchDone } from './branch-work.js';

const cleanState = {
  state: 'CLEAN' as const,
  branch: 'dev',
  remotes: [],
  ahead: 0,
  behind: 0,
  staged: [],
  unstaged: [],
  untracked: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockAssertClean.mockResolvedValue(undefined);
  mockDetectState.mockResolvedValue(cleanState);
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
  mockLogOperation.mockResolvedValue(undefined);
});

describe('branchWork', () => {
  it('orchestrates: assertClean -> createBranch -> log operation', async () => {
    mockCreateBranch.mockResolvedValue({
      branch: 'feature/login-page',
      worktreePath: undefined,
    });

    const result = await branchWork('/repo', 'login-page');

    expect(mockDetectState).toHaveBeenCalledWith('/repo');
    expect(mockCreateBranch).toHaveBeenCalledWith('/repo', 'login-page', undefined);
    expect(mockLogOperation).toHaveBeenCalled();
    expect(result.branch).toBe('feature/login-page');
    expect(result.message).toBeDefined();
  });

  it('reports success with branch name and worktree path', async () => {
    mockCreateBranch.mockResolvedValue({
      branch: 'feature/auth-flow',
      worktreePath: '/tmp/worktrees/test-repo/feature-auth-flow',
    });

    const result = await branchWork('/repo', 'auth-flow', { worktree: true });

    expect(result.branch).toBe('feature/auth-flow');
    expect(result.worktreePath).toBe('/tmp/worktrees/test-repo/feature-auth-flow');
  });

  it('passes worktree option to createBranch', async () => {
    mockCreateBranch.mockResolvedValue({
      branch: 'feature/thing',
      worktreePath: '/tmp/worktrees/test-repo/feature-thing',
    });

    await branchWork('/repo', 'thing', { worktree: true });

    expect(mockCreateBranch).toHaveBeenCalledWith('/repo', 'thing', { worktree: true });
  });
});

describe('branchDone', () => {
  it('orchestrates: removeBranch -> log operation', async () => {
    mockRemoveBranch.mockResolvedValue(undefined);

    await branchDone('/repo', 'feature/login-page');

    expect(mockDetectState).toHaveBeenCalledWith('/repo');
    expect(mockRemoveBranch).toHaveBeenCalledWith('/repo', 'feature/login-page', undefined);
    expect(mockLogOperation).toHaveBeenCalled();
  });

  it('reports cleanup summary', async () => {
    mockRemoveBranch.mockResolvedValue(undefined);

    const result = await branchDone('/repo', 'feature/login-page');

    expect(result.message).toBeDefined();
    expect(result.branch).toBe('feature/login-page');
  });

  it('passes force option to removeBranch', async () => {
    mockRemoveBranch.mockResolvedValue(undefined);

    await branchDone('/repo', 'feature/unmerged', { force: true });

    expect(mockRemoveBranch).toHaveBeenCalledWith('/repo', 'feature/unmerged', { force: true });
  });
});
