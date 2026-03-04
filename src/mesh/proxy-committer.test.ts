import { describe, it, expect, vi } from 'vitest';
import {
  buildProxyCommitMessage,
  ProxyCommitter,
  createProxyCommitter,
} from './proxy-committer.js';
import type { GitExecutor, MeshWorktreeManager, MeshBranchInfo } from './mesh-worktree.js';

// ============================================================================
// Mock factories
// ============================================================================

function makeMockExecutor(): GitExecutor & { calls: string[] } {
  const calls: string[] = [];
  const executor = ((cmd: string) => {
    calls.push(cmd);
    if (cmd.includes('git commit')) return 'abc1234';
    return '';
  }) as GitExecutor & { calls: string[] };
  executor.calls = calls;
  return executor;
}

function makeMockWorktreeManager(): MeshWorktreeManager & {
  createBranchCalls: Array<{ nodeId: string; taskId: string; baseBranch?: string }>;
} {
  const createBranchCalls: Array<{ nodeId: string; taskId: string; baseBranch?: string }> = [];
  return {
    createBranchCalls,
    createBranch: vi.fn((nodeId: string, taskId: string, baseBranch?: string): MeshBranchInfo => {
      createBranchCalls.push({ nodeId, taskId, baseBranch });
      return {
        branchName: `mesh/${nodeId}/${taskId}`,
        nodeId,
        taskId,
        createdAt: '2026-01-15T10:00:00Z',
      };
    }),
    mergeBranch: vi.fn(),
    listMeshBranches: vi.fn(() => []),
    deleteBranch: vi.fn(() => ({ success: true })),
  } as unknown as MeshWorktreeManager & {
    createBranchCalls: Array<{ nodeId: string; taskId: string; baseBranch?: string }>;
  };
}

// ============================================================================
// buildProxyCommitMessage (pure function)
// ============================================================================

describe('buildProxyCommitMessage', () => {
  it('includes node name in message', () => {
    const msg = buildProxyCommitMessage('gpu-worker', 'task-42', ['model.bin']);
    expect(msg).toContain('gpu-worker');
  });

  it('includes task ID in subject line', () => {
    const msg = buildProxyCommitMessage('gpu-worker', 'task-42', ['model.bin']);
    expect(msg).toContain('task-42');
  });

  it('includes artifact names', () => {
    const msg = buildProxyCommitMessage('gpu-worker', 'task-42', ['model.bin', 'config.json']);
    expect(msg).toContain('model.bin, config.json');
  });

  it('includes provenance origin when provided', () => {
    const msg = buildProxyCommitMessage('gpu-worker', 'task-42', ['model.bin'], 'remote-cluster');
    expect(msg).toContain('remote-cluster');
  });

  it('defaults provenance to local when not provided', () => {
    const msg = buildProxyCommitMessage('gpu-worker', 'task-42', ['model.bin']);
    expect(msg).toContain('Provenance: local');
  });

  it('includes Proxy-Committed-By line', () => {
    const msg = buildProxyCommitMessage('gpu-worker', 'task-42', ['model.bin']);
    expect(msg).toContain('Proxy-Committed-By: local GSD on behalf of gpu-worker');
  });

  it('uses conventional commit format (feat(mesh):)', () => {
    const msg = buildProxyCommitMessage('gpu-worker', 'task-42', ['model.bin']);
    expect(msg).toMatch(/^feat\(mesh\):/);
  });
});

// ============================================================================
// ProxyCommitter
// ============================================================================

describe('ProxyCommitter', () => {
  // ── commitOnBehalf ───────────────────────────────────────────────────────

  describe('commitOnBehalf', () => {
    it('creates branch via worktreeManager', () => {
      const executor = makeMockExecutor();
      const worktree = makeMockWorktreeManager();
      const committer = new ProxyCommitter(executor, worktree);

      committer.commitOnBehalf('node-alpha', 'gpu-worker', 'task-42', [
        { path: 'output/model.bin', content: 'binary-data' },
      ]);

      expect(worktree.createBranch).toHaveBeenCalledWith('node-alpha', 'task-42', undefined);
    });

    it('uses custom baseBranch when provided', () => {
      const executor = makeMockExecutor();
      const worktree = makeMockWorktreeManager();
      const committer = new ProxyCommitter(executor, worktree);

      committer.commitOnBehalf('node-alpha', 'gpu-worker', 'task-42', [
        { path: 'output/model.bin', content: 'binary-data' },
      ], 'dev');

      expect(worktree.createBranch).toHaveBeenCalledWith('node-alpha', 'task-42', 'dev');
    });

    it('calls gitExecutor with correct git add commands', () => {
      const executor = makeMockExecutor();
      const worktree = makeMockWorktreeManager();
      const committer = new ProxyCommitter(executor, worktree);

      committer.commitOnBehalf('node-alpha', 'gpu-worker', 'task-42', [
        { path: 'output/model.bin', content: 'data-1' },
        { path: 'output/config.json', content: 'data-2' },
      ]);

      const addCalls = executor.calls.filter((c) => c.includes('git add'));
      expect(addCalls).toHaveLength(2);
      expect(addCalls[0]).toContain('output/model.bin');
      expect(addCalls[1]).toContain('output/config.json');
    });

    it('calls gitExecutor with correct git commit command', () => {
      const executor = makeMockExecutor();
      const worktree = makeMockWorktreeManager();
      const committer = new ProxyCommitter(executor, worktree);

      committer.commitOnBehalf('node-alpha', 'gpu-worker', 'task-42', [
        { path: 'output/model.bin', content: 'binary-data' },
      ]);

      const commitCalls = executor.calls.filter((c) => c.includes('git commit'));
      expect(commitCalls).toHaveLength(1);
      expect(commitCalls[0]).toContain('feat(mesh):');
      expect(commitCalls[0]).toContain('task-42');
    });

    it('returns success with branchName and commitHash', () => {
      const executor = makeMockExecutor();
      const worktree = makeMockWorktreeManager();
      const committer = new ProxyCommitter(executor, worktree);

      const result = committer.commitOnBehalf('node-alpha', 'gpu-worker', 'task-42', [
        { path: 'output/model.bin', content: 'binary-data' },
      ]);

      expect(result.success).toBe(true);
      expect(result.branchName).toBe('mesh/node-alpha/task-42');
      expect(result.commitHash).toBe('abc1234');
    });

    it('returns { success: false } on git error', () => {
      const executor: GitExecutor = () => { throw new Error('Git failed'); };
      const worktree = makeMockWorktreeManager();
      const committer = new ProxyCommitter(executor, worktree);

      const result = committer.commitOnBehalf('node-alpha', 'gpu-worker', 'task-42', [
        { path: 'output/model.bin', content: 'binary-data' },
      ]);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Git failed');
    });
  });
});

// ============================================================================
// createProxyCommitter factory
// ============================================================================

describe('createProxyCommitter', () => {
  it('creates a ProxyCommitter with custom executor and worktreeManager', () => {
    const executor: GitExecutor = () => '';
    const worktree = makeMockWorktreeManager();
    const committer = createProxyCommitter(executor, worktree);
    expect(committer).toBeInstanceOf(ProxyCommitter);
  });

  it('creates a ProxyCommitter with defaults when no args provided', () => {
    const committer = createProxyCommitter();
    expect(committer).toBeInstanceOf(ProxyCommitter);
  });
});
