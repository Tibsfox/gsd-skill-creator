import { describe, it, expect, vi } from 'vitest';
import {
  buildBranchName,
  MeshBranchInfoSchema,
  MeshWorktreeManager,
  createMeshWorktreeManager,
} from './mesh-worktree.js';
import type { GitExecutor, MeshBranchInfo } from './mesh-worktree.js';

// ============================================================================
// buildBranchName (pure function)
// ============================================================================

describe('buildBranchName', () => {
  it('returns mesh/{nodeId}/{taskId} format', () => {
    expect(buildBranchName('node-alpha', 'task-42')).toBe('mesh/node-alpha/task-42');
  });

  it('handles complex node and task identifiers', () => {
    expect(buildBranchName('node-1a2b3c', 'deploy-v2.1')).toBe('mesh/node-1a2b3c/deploy-v2.1');
  });
});

// ============================================================================
// MeshBranchInfoSchema
// ============================================================================

describe('MeshBranchInfoSchema', () => {
  it('validates a correct MeshBranchInfo object', () => {
    const info = {
      branchName: 'mesh/node-alpha/task-42',
      nodeId: 'node-alpha',
      taskId: 'task-42',
      createdAt: '2026-01-15T10:00:00Z',
    };
    const result = MeshBranchInfoSchema.parse(info);
    expect(result.branchName).toBe('mesh/node-alpha/task-42');
    expect(result.nodeId).toBe('node-alpha');
    expect(result.taskId).toBe('task-42');
    expect(result.createdAt).toBe('2026-01-15T10:00:00Z');
  });

  it('rejects objects with missing fields', () => {
    expect(() => MeshBranchInfoSchema.parse({ branchName: 'x' })).toThrow();
  });
});

// ============================================================================
// MeshWorktreeManager
// ============================================================================

describe('MeshWorktreeManager', () => {
  function makeMockExecutor(): GitExecutor & { calls: string[] } {
    const calls: string[] = [];
    const executor = ((cmd: string) => {
      calls.push(cmd);
      return '';
    }) as GitExecutor & { calls: string[] };
    executor.calls = calls;
    return executor;
  }

  // ── createBranch ─────────────────────────────────────────────────────────

  describe('createBranch', () => {
    it('calls gitExecutor with correct checkout command', () => {
      const executor = makeMockExecutor();
      const mgr = new MeshWorktreeManager(executor);

      mgr.createBranch('node-alpha', 'task-42');

      expect(executor.calls).toHaveLength(1);
      expect(executor.calls[0]).toBe('git checkout -b mesh/node-alpha/task-42 HEAD');
    });

    it('uses custom baseBranch when provided', () => {
      const executor = makeMockExecutor();
      const mgr = new MeshWorktreeManager(executor);

      mgr.createBranch('node-beta', 'task-7', 'dev');

      expect(executor.calls[0]).toBe('git checkout -b mesh/node-beta/task-7 dev');
    });

    it('returns MeshBranchInfo with correct fields', () => {
      const executor = makeMockExecutor();
      const mgr = new MeshWorktreeManager(executor);

      const info = mgr.createBranch('node-alpha', 'task-42');

      expect(info.branchName).toBe('mesh/node-alpha/task-42');
      expect(info.nodeId).toBe('node-alpha');
      expect(info.taskId).toBe('task-42');
      expect(typeof info.createdAt).toBe('string');
      // Validates against schema
      expect(() => MeshBranchInfoSchema.parse(info)).not.toThrow();
    });
  });

  // ── mergeBranch ──────────────────────────────────────────────────────────

  describe('mergeBranch', () => {
    it('calls gitExecutor with --no-ff flag and returns success', () => {
      const executor = makeMockExecutor();
      const mgr = new MeshWorktreeManager(executor);

      const result = mgr.mergeBranch('mesh/node-alpha/task-42', 'main');

      expect(result.success).toBe(true);
      expect(executor.calls[0]).toContain('--no-ff');
      expect(executor.calls[0]).toContain('mesh/node-alpha/task-42');
    });

    it('uses default merge message when none provided', () => {
      const executor = makeMockExecutor();
      const mgr = new MeshWorktreeManager(executor);

      mgr.mergeBranch('mesh/node-alpha/task-42', 'main');

      expect(executor.calls[0]).toContain('Merge mesh/node-alpha/task-42 into main');
    });

    it('uses custom message when provided', () => {
      const executor = makeMockExecutor();
      const mgr = new MeshWorktreeManager(executor);

      mgr.mergeBranch('mesh/node-alpha/task-42', 'main', 'Custom merge message');

      expect(executor.calls[0]).toContain('Custom merge message');
    });

    it('returns mergeCommit from gitExecutor output', () => {
      const executor: GitExecutor = (cmd: string) => '  abc1234  \n';
      const mgr = new MeshWorktreeManager(executor);

      const result = mgr.mergeBranch('feat-branch', 'main');

      expect(result.success).toBe(true);
      expect(result.mergeCommit).toBe('abc1234');
    });

    it('returns { success: false, error } when gitExecutor throws', () => {
      const executor: GitExecutor = () => { throw new Error('Merge conflict'); };
      const mgr = new MeshWorktreeManager(executor);

      const result = mgr.mergeBranch('feat-branch', 'main');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Merge conflict');
    });
  });

  // ── listMeshBranches ─────────────────────────────────────────────────────

  describe('listMeshBranches', () => {
    it('parses branch output into MeshBranchInfo array', () => {
      const executor: GitExecutor = (cmd: string) => {
        if (cmd.includes('branch --list')) {
          return '  mesh/node-alpha/task-42\n  mesh/node-beta/task-7\n';
        }
        return '';
      };
      const mgr = new MeshWorktreeManager(executor);

      const branches = mgr.listMeshBranches();

      expect(branches).toHaveLength(2);
      expect(branches[0].branchName).toBe('mesh/node-alpha/task-42');
      expect(branches[0].nodeId).toBe('node-alpha');
      expect(branches[0].taskId).toBe('task-42');
      expect(branches[1].branchName).toBe('mesh/node-beta/task-7');
      expect(branches[1].nodeId).toBe('node-beta');
      expect(branches[1].taskId).toBe('task-7');
    });

    it('returns empty array when no mesh branches exist', () => {
      const executor: GitExecutor = () => '';
      const mgr = new MeshWorktreeManager(executor);

      const branches = mgr.listMeshBranches();

      expect(branches).toEqual([]);
    });

    it('handles branches with asterisk (current branch marker)', () => {
      const executor: GitExecutor = () => '* mesh/node-alpha/task-42\n  mesh/node-beta/task-7\n';
      const mgr = new MeshWorktreeManager(executor);

      const branches = mgr.listMeshBranches();

      expect(branches).toHaveLength(2);
      expect(branches[0].branchName).toBe('mesh/node-alpha/task-42');
    });
  });

  // ── deleteBranch ─────────────────────────────────────────────────────────

  describe('deleteBranch', () => {
    it('calls gitExecutor with correct delete command', () => {
      const executor = makeMockExecutor();
      const mgr = new MeshWorktreeManager(executor);

      const result = mgr.deleteBranch('mesh/node-alpha/task-42');

      expect(result.success).toBe(true);
      expect(executor.calls[0]).toBe('git branch -d mesh/node-alpha/task-42');
    });

    it('returns { success: false, error } when gitExecutor throws', () => {
      const executor: GitExecutor = () => { throw new Error('Branch not found'); };
      const mgr = new MeshWorktreeManager(executor);

      const result = mgr.deleteBranch('nonexistent-branch');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Branch not found');
    });
  });
});

// ============================================================================
// createMeshWorktreeManager factory
// ============================================================================

describe('createMeshWorktreeManager', () => {
  it('creates a MeshWorktreeManager with custom executor', () => {
    const executor: GitExecutor = () => '';
    const mgr = createMeshWorktreeManager(executor);
    expect(mgr).toBeInstanceOf(MeshWorktreeManager);
  });

  it('creates a MeshWorktreeManager with default executor when none provided', () => {
    const mgr = createMeshWorktreeManager();
    expect(mgr).toBeInstanceOf(MeshWorktreeManager);
  });
});
