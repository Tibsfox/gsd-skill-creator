/**
 * Mesh Worktree Manager -- git branch management for mesh task isolation.
 *
 * Each mesh node's work is isolated on a dedicated branch (mesh/{nodeId}/{taskId}),
 * enabling concurrent task execution without conflicts. Branches are created,
 * merged, listed, and cleaned up through an injectable GitExecutor.
 *
 * CTXT-03: Git worktree branch isolation for mesh tasks
 */

import { z } from 'zod';

// ============================================================================
// Pure function
// ============================================================================

/**
 * Builds a deterministic branch name from node and task identifiers.
 * Format: mesh/{nodeId}/{taskId}
 */
export function buildBranchName(nodeId: string, taskId: string): string {
  return `mesh/${nodeId}/${taskId}`;
}

// ============================================================================
// Schemas / Types
// ============================================================================

export const MeshBranchInfoSchema = z.object({
  branchName: z.string(),
  nodeId: z.string(),
  taskId: z.string(),
  createdAt: z.string(),
});

export type MeshBranchInfo = z.infer<typeof MeshBranchInfoSchema>;

/** Injected git command executor for testability */
export type GitExecutor = (command: string) => string;

// ============================================================================
// MeshWorktreeManager
// ============================================================================

/**
 * Manages git branches for mesh task isolation.
 *
 * All git operations go through the injected GitExecutor, making the class
 * fully testable with mock executors (no real git repo needed).
 */
export class MeshWorktreeManager {
  constructor(private gitExecutor: GitExecutor) {}

  /**
   * Creates a new mesh branch for a node's task.
   * Checks out a new branch from baseBranch (default: HEAD).
   */
  createBranch(nodeId: string, taskId: string, baseBranch = 'HEAD'): MeshBranchInfo {
    const branchName = buildBranchName(nodeId, taskId);
    this.gitExecutor(`git checkout -b ${branchName} ${baseBranch}`);
    return {
      branchName,
      nodeId,
      taskId,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Merges a branch into the target with --no-ff (preserves merge commit).
   * Returns success/failure with optional merge commit hash or error.
   */
  mergeBranch(
    branchName: string,
    targetBranch: string,
    message?: string,
  ): { success: boolean; mergeCommit?: string; error?: string } {
    try {
      const msg = message || `Merge ${branchName} into ${targetBranch}`;
      const result = this.gitExecutor(`git merge ${branchName} --no-ff -m "${msg}"`);
      return { success: true, mergeCommit: result.trim() };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  /**
   * Lists all mesh branches (mesh/*) and parses them into MeshBranchInfo.
   * Handles the asterisk marker on the current branch.
   */
  listMeshBranches(): MeshBranchInfo[] {
    const raw = this.gitExecutor('git branch --list "mesh/*"');
    if (!raw.trim()) return [];

    const lines = raw.split('\n').filter((l) => l.trim().length > 0);
    return lines.map((line) => {
      // Strip leading whitespace and asterisk (current branch marker)
      const cleaned = line.replace(/^\s*\*?\s*/, '');
      const parts = cleaned.split('/');
      // Format: mesh/{nodeId}/{taskId}
      const nodeId = parts[1] || '';
      const taskId = parts.slice(2).join('/') || '';
      return {
        branchName: cleaned,
        nodeId,
        taskId,
        createdAt: '', // Not available from branch listing
      };
    });
  }

  /**
   * Deletes a branch. Returns success/failure with optional error.
   */
  deleteBranch(branchName: string): { success: boolean; error?: string } {
    try {
      this.gitExecutor(`git branch -d ${branchName}`);
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Creates a MeshWorktreeManager with the given executor or a default
 * that shells out to real git via execSync.
 */
export function createMeshWorktreeManager(gitExecutor?: GitExecutor): MeshWorktreeManager {
  const defaultExecutor: GitExecutor = (cmd) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { execSync } = require('node:child_process');
    return execSync(cmd, { encoding: 'utf8' }) as string;
  };
  return new MeshWorktreeManager(gitExecutor || defaultExecutor);
}
