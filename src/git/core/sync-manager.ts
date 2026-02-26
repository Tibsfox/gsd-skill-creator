/**
 * Sync manager — fetch upstream and rebase/merge dev with
 * conflict detection, abort safety, and dry-run mode.
 *
 * Never auto-resolves conflicts. Never uses --force.
 * Uses execFile (not exec) to prevent shell injection.
 */

import { execFile } from 'node:child_process';
import { assertClean } from './state-machine.js';
import { loadConfig } from './repo-manager.js';

// --- Public types ---

export interface SyncOptions {
  /** Sync strategy: 'rebase' (default) or 'merge' */
  strategy?: 'rebase' | 'merge';
  /** If true, fetch and report without modifying local branch */
  dryRun?: boolean;
}

export interface SyncResult {
  /** Number of new commits from upstream */
  newCommits: number;
  /** Whether conflicts were detected */
  conflicted: boolean;
  /** Files with conflicts (only when conflicted is true) */
  conflictFiles?: string[];
  /** Current HEAD after sync (only on success) */
  currentHead?: string;
  /** Whether this was a dry-run */
  dryRun?: boolean;
  /** Upstream commit log (only in dry-run mode) */
  upstreamLog?: string[];
}

// --- Public functions ---

/**
 * Sync local dev branch with upstream.
 *
 * 1. Assert clean working tree
 * 2. Fetch upstream
 * 3. Count new commits
 * 4. If 0: return early (already up to date)
 * 5. If dry-run: log commits and return without modifying
 * 6. Rebase or merge (based on strategy)
 * 7. On conflict: abort and report conflict files
 *
 * @param repoPath - Absolute path to the git repository
 * @param options - Sync strategy and dry-run flag
 * @returns SyncResult with commit count, conflict status, and details
 */
export async function sync(
  repoPath: string,
  options?: SyncOptions,
): Promise<SyncResult> {
  await assertClean(repoPath);

  const config = await loadConfig(repoPath);
  const strategy = options?.strategy ?? 'rebase';
  const dryRun = options?.dryRun ?? false;
  const upstreamRef = `upstream/${config.mainBranch}`;

  // Fetch upstream
  await execGit('git', ['fetch', 'upstream'], repoPath);

  // Count new commits
  const countOutput = await execGit(
    'git',
    ['rev-list', '--count', `${config.devBranch}..${upstreamRef}`],
    repoPath,
  );
  const newCommits = parseInt(countOutput.trim(), 10) || 0;

  // Already up to date
  if (newCommits === 0) {
    return { newCommits: 0, conflicted: false };
  }

  // Dry-run: show commits without modifying
  if (dryRun) {
    const logOutput = await execGit(
      'git',
      ['log', '--oneline', `${config.devBranch}..${upstreamRef}`],
      repoPath,
    );
    const upstreamLog = logOutput
      .split('\n')
      .filter((l) => l.trim());

    return {
      newCommits,
      conflicted: false,
      dryRun: true,
      upstreamLog,
    };
  }

  // Apply changes
  if (strategy === 'merge') {
    return applyMerge(repoPath, upstreamRef, newCommits);
  }
  return applyRebase(repoPath, upstreamRef, newCommits);
}

// --- Internal helpers ---

/**
 * Apply upstream changes via rebase.
 */
async function applyRebase(
  repoPath: string,
  upstreamRef: string,
  newCommits: number,
): Promise<SyncResult> {
  try {
    await execGit('git', ['rebase', upstreamRef], repoPath);
    const head = await execGit('git', ['rev-parse', 'HEAD'], repoPath);
    return {
      newCommits,
      conflicted: false,
      currentHead: head.trim(),
    };
  } catch {
    // Conflict — get file list then abort
    const conflictFiles = await getConflictFiles(repoPath);
    await execGit('git', ['rebase', '--abort'], repoPath);
    return {
      newCommits: 0,
      conflicted: true,
      conflictFiles,
    };
  }
}

/**
 * Apply upstream changes via merge with --no-ff.
 */
async function applyMerge(
  repoPath: string,
  upstreamRef: string,
  newCommits: number,
): Promise<SyncResult> {
  try {
    await execGit('git', ['merge', upstreamRef, '--no-ff'], repoPath);
    const head = await execGit('git', ['rev-parse', 'HEAD'], repoPath);
    return {
      newCommits,
      conflicted: false,
      currentHead: head.trim(),
    };
  } catch {
    // Conflict — get file list then abort
    const conflictFiles = await getConflictFiles(repoPath);
    await execGit('git', ['merge', '--abort'], repoPath);
    return {
      newCommits: 0,
      conflicted: true,
      conflictFiles,
    };
  }
}

/**
 * Get list of files with conflicts.
 */
async function getConflictFiles(repoPath: string): Promise<string[]> {
  try {
    const output = await execGit(
      'git',
      ['diff', '--name-only', '--diff-filter=U'],
      repoPath,
    );
    return output
      .split('\n')
      .filter((f) => f.trim());
  } catch {
    return [];
  }
}

/**
 * Execute a command via execFile and return stdout.
 */
function execGit(cmd: string, args: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { cwd }, (err, stdout, _stderr) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(typeof stdout === 'string' ? stdout.trim() : '');
    });
  });
}
