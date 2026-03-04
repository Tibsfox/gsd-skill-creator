/**
 * Proxy Committer -- commits artifacts on behalf of remote mesh nodes.
 *
 * When a mesh node produces artifacts (e.g., model outputs, generated files),
 * the local GSD instance commits those artifacts to a mesh branch using
 * conventional commit messages with provenance metadata.
 *
 * CTXT-04: Proxy commit with provenance tracking
 */

import type { GitExecutor, MeshWorktreeManager } from './mesh-worktree.js';
import { createMeshWorktreeManager } from './mesh-worktree.js';

// ============================================================================
// Pure function
// ============================================================================

/**
 * Builds a conventional commit message for proxy-committed artifacts.
 *
 * Format:
 *   feat(mesh): {taskId} via {nodeName}
 *
 *   Artifacts: {artifactNames}
 *   Provenance: {origin}
 *   Proxy-Committed-By: local GSD on behalf of {nodeName}
 */
export function buildProxyCommitMessage(
  nodeName: string,
  taskId: string,
  artifactNames: string[],
  provenanceOrigin?: string,
): string {
  const origin = provenanceOrigin || 'local';
  return [
    `feat(mesh): ${taskId} via ${nodeName}`,
    '',
    `Artifacts: ${artifactNames.join(', ')}`,
    `Provenance: ${origin}`,
    `Proxy-Committed-By: local GSD on behalf of ${nodeName}`,
  ].join('\n');
}

// ============================================================================
// Types
// ============================================================================

/** Result of a proxy commit operation */
export interface ProxyCommitResult {
  success: boolean;
  branchName: string;
  commitHash?: string;
  error?: string;
}

/** An artifact to be committed */
export interface Artifact {
  path: string;
  content: string;
}

// ============================================================================
// ProxyCommitter
// ============================================================================

/**
 * Commits artifacts on behalf of a remote mesh node.
 *
 * Workflow:
 * 1. Creates a mesh branch via MeshWorktreeManager
 * 2. Stages each artifact with git add
 * 3. Commits with a proxy commit message including provenance
 */
export class ProxyCommitter {
  constructor(
    private readonly gitExecutor: GitExecutor,
    private readonly worktreeManager: MeshWorktreeManager,
  ) {}

  /**
   * Commits artifacts on behalf of a node.
   *
   * Creates a mesh branch, stages all artifacts, and commits with
   * provenance metadata in the commit message.
   */
  commitOnBehalf(
    nodeId: string,
    nodeName: string,
    taskId: string,
    artifacts: Artifact[],
    baseBranch?: string,
  ): ProxyCommitResult {
    const branchName = `mesh/${nodeId}/${taskId}`;

    try {
      // 1. Create mesh branch
      this.worktreeManager.createBranch(nodeId, taskId, baseBranch);

      // 2. Stage each artifact
      for (const artifact of artifacts) {
        this.gitExecutor(`git add ${artifact.path}`);
      }

      // 3. Build commit message and commit
      const artifactNames = artifacts.map((a) => a.path);
      const message = buildProxyCommitMessage(nodeName, taskId, artifactNames);
      const commitOutput = this.gitExecutor(`git commit -m "${message}"`);

      return {
        success: true,
        branchName,
        commitHash: commitOutput.trim(),
      };
    } catch (err) {
      return {
        success: false,
        branchName,
        error: String(err),
      };
    }
  }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Creates a ProxyCommitter with the given executor and worktree manager,
 * or sensible defaults.
 */
export function createProxyCommitter(
  gitExecutor?: GitExecutor,
  worktreeManager?: MeshWorktreeManager,
): ProxyCommitter {
  const defaultExecutor: GitExecutor = (cmd) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { execSync } = require('node:child_process');
    return execSync(cmd, { encoding: 'utf8' }) as string;
  };
  const executor = gitExecutor || defaultExecutor;
  const wtm = worktreeManager || createMeshWorktreeManager(executor);
  return new ProxyCommitter(executor, wtm);
}
