/**
 * Tests for sync workflow orchestrator — orchestrates sync-manager
 * with state checks, config updates, and operation logging.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock sync-manager
const mockSync = vi.fn();
vi.mock('../core/sync-manager.js', () => ({
  sync: (...args: unknown[]) => mockSync(...args),
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
const mockSaveConfig = vi.fn();
vi.mock('../core/repo-manager.js', () => ({
  loadConfig: (...args: unknown[]) => mockLoadConfig(...args),
  saveConfig: (...args: unknown[]) => mockSaveConfig(...args),
}));

// Mock logger
const mockLogOperation = vi.fn();
vi.mock('../core/logger.js', () => ({
  logOperation: (...args: unknown[]) => mockLogOperation(...args),
}));

import { syncWorkflow } from './sync.js';

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

const baseConfig = {
  repo: 'test-repo',
  upstream: 'https://github.com/org/repo.git',
  origin: 'https://github.com/user/repo.git',
  devBranch: 'dev',
  mainBranch: 'main',
  gates: { mergeToMain: true, prToUpstream: true },
  worktreeRoot: '/tmp/worktrees/test-repo',
  installedAt: '2026-01-01T00:00:00Z',
  lastSync: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockAssertClean.mockResolvedValue(undefined);
  mockDetectState.mockResolvedValue(cleanState);
  mockLoadConfig.mockResolvedValue({ ...baseConfig });
  mockSaveConfig.mockResolvedValue(undefined);
  mockLogOperation.mockResolvedValue(undefined);
});

describe('syncWorkflow', () => {
  it('orchestrates: assertClean -> sync -> update lastSync -> log', async () => {
    mockSync.mockResolvedValue({
      newCommits: 3,
      conflicted: false,
      currentHead: 'abc1234',
    });

    const result = await syncWorkflow('/repo');

    expect(mockDetectState).toHaveBeenCalledWith('/repo');
    expect(mockSync).toHaveBeenCalledWith('/repo', undefined);
    expect(mockSaveConfig).toHaveBeenCalled();
    expect(mockLogOperation).toHaveBeenCalled();
    expect(result.newCommits).toBe(3);
    expect(result.message).toBeDefined();
  });

  it('updates config.lastSync on success', async () => {
    mockSync.mockResolvedValue({
      newCommits: 1,
      conflicted: false,
      currentHead: 'def5678',
    });

    await syncWorkflow('/repo');

    const savedConfig = mockSaveConfig.mock.calls[0][1];
    expect(savedConfig.lastSync).toBeDefined();
    expect(savedConfig.lastSync).not.toBeNull();
  });

  it('reports conflict with file list on failure', async () => {
    mockSync.mockResolvedValue({
      newCommits: 0,
      conflicted: true,
      conflictFiles: ['src/index.ts', 'src/utils.ts'],
    });

    const result = await syncWorkflow('/repo');

    expect(result.conflicted).toBe(true);
    expect(result.conflictFiles).toContain('src/index.ts');
    // Should NOT update lastSync on conflict
    expect(mockSaveConfig).not.toHaveBeenCalled();
  });

  it('dry-run reports without modifying config', async () => {
    mockSync.mockResolvedValue({
      newCommits: 4,
      conflicted: false,
      dryRun: true,
      upstreamLog: [
        'abc1234 fix: bug',
        'def5678 feat: thing',
        '1234567 docs: update',
        '7654321 chore: deps',
      ],
    });

    const result = await syncWorkflow('/repo', { dryRun: true });

    expect(result.dryRun).toBe(true);
    expect(result.newCommits).toBe(4);
    // Should NOT update lastSync on dry-run
    expect(mockSaveConfig).not.toHaveBeenCalled();
  });

  it('logs operation with before/after states', async () => {
    mockSync.mockResolvedValue({
      newCommits: 2,
      conflicted: false,
      currentHead: 'aaa1111',
    });

    await syncWorkflow('/repo');

    expect(mockLogOperation).toHaveBeenCalledWith(
      expect.any(String),
      'sync',
      expect.any(Array),
      cleanState,
      expect.any(Object),
      true,
      undefined,
    );
  });

  it('logs failed operation with error', async () => {
    mockSync.mockResolvedValue({
      newCommits: 0,
      conflicted: true,
      conflictFiles: ['README.md'],
    });

    await syncWorkflow('/repo');

    expect(mockLogOperation).toHaveBeenCalledWith(
      expect.any(String),
      'sync',
      expect.any(Array),
      cleanState,
      expect.any(Object),
      false,
      expect.stringContaining('conflict'),
    );
  });
});
