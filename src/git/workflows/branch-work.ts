/**
 * Branch work workflow orchestrator — wraps branch-manager operations
 * with state detection, operation logging, and human-readable messaging.
 */

import { createBranch, removeBranch } from '../core/branch-manager.js';
import { detectState } from '../core/state-machine.js';
import { loadConfig } from '../core/repo-manager.js';
import { logOperation } from '../core/logger.js';
import * as path from 'node:path';

// --- Public types ---

export interface BranchWorkResult {
  branch: string;
  worktreePath?: string;
  message: string;
}

export interface BranchDoneResult {
  branch: string;
  message: string;
}

// --- Public functions ---

/**
 * Create a new feature branch with full workflow orchestration.
 *
 * Flow: detectState (before) -> createBranch -> detectState (after) -> log
 *
 * @param repoPath - Absolute path to the git repository
 * @param name - Branch name to create
 * @param options - Optional: worktree creation
 * @returns BranchWorkResult with branch info and message
 */
export async function branchWork(
  repoPath: string,
  name: string,
  options?: { worktree?: boolean },
): Promise<BranchWorkResult> {
  const config = await loadConfig(repoPath);
  const configDir = path.join(repoPath, '.sc-git');

  const stateBefore = await detectState(repoPath);

  const result = await createBranch(repoPath, name, options);

  const stateAfter = await detectState(repoPath);

  const commands = options?.worktree
    ? [`worktree-setup.sh ${repoPath} ${result.branch}`]
    : [`git checkout -b ${result.branch} ${config.devBranch}`, `git checkout ${config.devBranch}`];

  await logOperation(
    configDir,
    'branch-create',
    commands,
    stateBefore,
    stateAfter,
    true,
  );

  const worktreeMsg = result.worktreePath
    ? ` with worktree at ${result.worktreePath}`
    : '';

  return {
    branch: result.branch,
    worktreePath: result.worktreePath,
    message: `Created branch ${result.branch}${worktreeMsg}`,
  };
}

/**
 * Remove a branch with full workflow orchestration.
 *
 * Flow: detectState (before) -> removeBranch -> detectState (after) -> log
 *
 * @param repoPath - Absolute path to the git repository
 * @param name - Branch name to remove
 * @param options - Optional: force delete
 * @returns BranchDoneResult with cleanup summary
 */
export async function branchDone(
  repoPath: string,
  name: string,
  options?: { force?: boolean },
): Promise<BranchDoneResult> {
  const configDir = path.join(repoPath, '.sc-git');

  const stateBefore = await detectState(repoPath);

  await removeBranch(repoPath, name, options);

  const stateAfter = await detectState(repoPath);

  await logOperation(
    configDir,
    'branch-remove',
    [`git branch -${options?.force ? 'D' : 'd'} ${name}`],
    stateBefore,
    stateAfter,
    true,
  );

  return {
    branch: name,
    message: `Removed branch ${name}`,
  };
}
