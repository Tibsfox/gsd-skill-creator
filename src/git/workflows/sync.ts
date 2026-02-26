/**
 * Sync workflow orchestrator — wraps sync-manager with state detection,
 * config updates (lastSync), and operation logging.
 */

import { sync } from '../core/sync-manager.js';
import type { SyncOptions, SyncResult } from '../core/sync-manager.js';
import { detectState } from '../core/state-machine.js';
import { loadConfig, saveConfig } from '../core/repo-manager.js';
import { logOperation } from '../core/logger.js';
import * as path from 'node:path';

// --- Public types ---

export interface SyncWorkflowResult {
  newCommits: number;
  conflicted: boolean;
  conflictFiles?: string[];
  dryRun?: boolean;
  upstreamLog?: string[];
  message: string;
}

// --- Public functions ---

/**
 * Sync dev branch with upstream, orchestrated with logging and config updates.
 *
 * Flow:
 * 1. detectState (before)
 * 2. sync() — fetch + rebase/merge/dry-run
 * 3. If success and not dry-run: update config.lastSync, saveConfig
 * 4. detectState (after)
 * 5. logOperation
 *
 * @param repoPath - Absolute path to the git repository
 * @param options - Sync strategy and dry-run flag
 * @returns SyncWorkflowResult with human-readable message
 */
export async function syncWorkflow(
  repoPath: string,
  options?: SyncOptions,
): Promise<SyncWorkflowResult> {
  const config = await loadConfig(repoPath);
  const configDir = path.join(repoPath, '.sc-git');

  const stateBefore = await detectState(repoPath);

  const result: SyncResult = await sync(repoPath, options);

  const stateAfter = await detectState(repoPath);

  // Update lastSync on successful, non-dry-run sync
  if (!result.conflicted && !result.dryRun) {
    config.lastSync = new Date().toISOString();
    await saveConfig(repoPath, config);
  }

  // Determine success and error message
  const success = !result.conflicted;
  const error = result.conflicted
    ? `Sync conflict in ${result.conflictFiles?.length ?? 0} file(s): ${result.conflictFiles?.join(', ') ?? 'unknown'}`
    : undefined;

  const strategy = options?.strategy ?? 'rebase';
  const commands = result.dryRun
    ? ['git fetch upstream', `git log --oneline dev..upstream/${config.mainBranch}`]
    : ['git fetch upstream', `git ${strategy} upstream/${config.mainBranch}`];

  await logOperation(
    configDir,
    'sync',
    commands,
    stateBefore,
    stateAfter,
    success,
    error,
  );

  // Build message
  let message: string;
  if (result.dryRun) {
    message = `Dry run: ${result.newCommits} new commit(s) available from upstream`;
  } else if (result.conflicted) {
    message = `Sync failed: conflict in ${result.conflictFiles?.join(', ')}. Aborted safely.`;
  } else if (result.newCommits === 0) {
    message = 'Already up to date with upstream';
  } else {
    message = `Synced ${result.newCommits} commit(s) from upstream via ${strategy}`;
  }

  return {
    newCommits: result.newCommits,
    conflicted: result.conflicted,
    conflictFiles: result.conflictFiles,
    dryRun: result.dryRun,
    upstreamLog: result.upstreamLog,
    message,
  };
}
