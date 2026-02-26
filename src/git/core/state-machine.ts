/**
 * Git state machine — detects, asserts, and validates git repository states.
 *
 * The state machine is the safety foundation: every git workflow checks
 * repository state before proceeding, preventing operations in invalid states.
 *
 * Detects 6 states: CLEAN, DIRTY, MERGING, REBASING, DETACHED, CONFLICT.
 * Priority: CONFLICT > MERGING > REBASING > DETACHED > DIRTY > CLEAN.
 */

import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { GitState, GitStateReport, RemoteInfo } from '../types.js';

/**
 * Valid state transition map.
 * Keys are source states, values are arrays of allowed target states.
 */
const TRANSITIONS: Record<GitState, GitState[]> = {
  CLEAN: ['DIRTY', 'MERGING', 'REBASING', 'DETACHED'],
  DIRTY: ['CLEAN', 'DIRTY'],
  MERGING: ['CLEAN', 'CONFLICT'],
  REBASING: ['CLEAN', 'CONFLICT'],
  DETACHED: ['CLEAN', 'DIRTY'],
  CONFLICT: ['CLEAN', 'DIRTY'],
};

/**
 * Detect the current state of a git repository.
 *
 * Uses git plumbing commands directly via child_process.execSync
 * to determine the repository's state, branch, remotes, and file status.
 *
 * @param repoPath - Absolute path to the git repository
 * @returns A complete GitStateReport snapshot
 * @throws Error if the path is not a git repository
 */
export async function detectState(repoPath: string): Promise<GitStateReport> {
  // Verify it is a git repo
  try {
    exec('git rev-parse --git-dir', repoPath);
  } catch {
    throw new Error(`Not a git repository: ${repoPath}`);
  }

  // Detect branch
  let branch: string | null;
  try {
    const rawBranch = exec('git rev-parse --abbrev-ref HEAD', repoPath);
    branch = rawBranch === 'HEAD' ? null : rawBranch;
  } catch {
    branch = null;
  }

  // Detect special states from marker files
  const gitDir = path.join(repoPath, '.git');
  const isMerging = fs.existsSync(path.join(gitDir, 'MERGE_HEAD'));
  const isRebasing =
    fs.existsSync(path.join(gitDir, 'rebase-merge')) ||
    fs.existsSync(path.join(gitDir, 'rebase-apply'));

  // Parse porcelain v2 status
  const statusOutput = exec('git status --porcelain=v2', repoPath);
  const lines = statusOutput ? statusOutput.split('\n').filter((l) => l.length > 0) : [];

  const staged: string[] = [];
  const unstaged: string[] = [];
  const untracked: string[] = [];
  let hasConflicts = false;

  for (const line of lines) {
    if (line.startsWith('u ')) {
      // Unmerged entry — conflict
      hasConflicts = true;
      const filePath = extractFilePath(line);
      staged.push(filePath);
    } else if (line.startsWith('1 ') || line.startsWith('2 ')) {
      // Tracked change: format is "1 XY ..." or "2 XY ..."
      const xy = line.substring(2, 4);
      const indexStatus = xy[0];
      const worktreeStatus = xy[1];
      const filePath = extractFilePath(line);

      if (indexStatus !== '.') {
        staged.push(filePath);
      }
      if (worktreeStatus !== '.') {
        unstaged.push(filePath);
      }
    } else if (line.startsWith('? ')) {
      // Untracked file
      untracked.push(line.substring(2));
    }
  }

  // Determine state with priority: CONFLICT > MERGING > REBASING > DETACHED > DIRTY > CLEAN
  let state: GitState;
  if (hasConflicts) {
    state = 'CONFLICT';
  } else if (isMerging) {
    state = 'MERGING';
  } else if (isRebasing) {
    state = 'REBASING';
  } else if (branch === null) {
    state = 'DETACHED';
  } else if (staged.length > 0 || unstaged.length > 0 || untracked.length > 0) {
    state = 'DIRTY';
  } else {
    state = 'CLEAN';
  }

  // Detect ahead/behind
  let ahead = 0;
  let behind = 0;
  try {
    const counts = exec('git rev-list --left-right --count HEAD...@{upstream}', repoPath);
    const parts = counts.split(/\s+/);
    if (parts.length >= 2) {
      ahead = parseInt(parts[0], 10) || 0;
      behind = parseInt(parts[1], 10) || 0;
    }
  } catch {
    // No upstream configured — default to 0/0
  }

  // Detect remotes
  const remotes = parseRemotes(repoPath);

  return {
    state,
    branch,
    remotes,
    ahead,
    behind,
    staged,
    unstaged,
    untracked,
  };
}

/**
 * Assert that a repository is in a specific state.
 *
 * @param repoPath - Absolute path to the git repository
 * @param expected - The expected GitState
 * @throws Error if the actual state does not match expected
 */
export async function assertState(repoPath: string, expected: GitState): Promise<void> {
  const report = await detectState(repoPath);
  if (report.state !== expected) {
    throw new Error(
      `Git state assertion failed: expected ${expected} but got ${report.state}`,
    );
  }
}

/**
 * Assert that a repository is completely clean.
 *
 * Checks not only the state but also that there are no staged,
 * unstaged, or untracked files.
 *
 * @param repoPath - Absolute path to the git repository
 * @throws Error if the repository has any uncommitted changes or untracked files
 */
export async function assertClean(repoPath: string): Promise<void> {
  const report = await detectState(repoPath);
  const issues: string[] = [];

  if (report.state !== 'CLEAN') {
    issues.push(`state is ${report.state}`);
  }
  if (report.staged.length > 0) {
    issues.push(`${report.staged.length} staged file(s)`);
  }
  if (report.unstaged.length > 0) {
    issues.push(`${report.unstaged.length} unstaged file(s)`);
  }
  if (report.untracked.length > 0) {
    issues.push(`${report.untracked.length} untracked file(s)`);
  }

  if (issues.length > 0) {
    throw new Error(`Repository is not clean: ${issues.join(', ')}`);
  }
}

/**
 * Check whether a state transition is valid.
 *
 * @param from - The current state
 * @param to - The target state
 * @param operation - The operation triggering the transition (for future audit use)
 * @returns true if the transition is allowed, false otherwise
 */
export function isValidTransition(from: GitState, to: GitState, operation: string): boolean {
  void operation; // reserved for future audit logging
  return TRANSITIONS[from]?.includes(to) ?? false;
}

// --- Internal helpers ---

/**
 * Execute a git command synchronously and return trimmed stdout.
 */
function exec(command: string, cwd: string): string {
  return execSync(command, { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

/**
 * Extract file path from a porcelain v2 status line.
 *
 * Format for type 1 (ordinary): "1 XY sub mH mI mW hH hI path"
 * Format for type 2 (rename):   "2 XY sub mH mI mW hH hI X## origPath\tpath"
 */
function extractFilePath(line: string): string {
  if (line.startsWith('2 ')) {
    // Rename entry — path is after the tab
    const tabIdx = line.indexOf('\t');
    if (tabIdx !== -1) {
      return line.substring(tabIdx + 1);
    }
  }
  // Ordinary entry or unmerged — path is the last space-separated field
  // For porcelain v2: "1 XY sub mH mI mW hH hI path"
  // That's 8 fields before the path
  const parts = line.split(' ');
  if (line.startsWith('u ')) {
    // Unmerged: "u XY sub m1 m2 m3 mW h1 h2 h3 path"
    // 10 fields before path
    return parts.slice(10).join(' ');
  }
  // Type 1: 8 fields before path
  return parts.slice(8).join(' ');
}

/**
 * Parse git remotes from `git remote -v` output.
 * Returns only fetch entries (one per remote name).
 */
function parseRemotes(repoPath: string): RemoteInfo[] {
  let output: string;
  try {
    output = exec('git remote -v', repoPath);
  } catch {
    return [];
  }

  if (!output) return [];

  const remotes: RemoteInfo[] = [];
  const seen = new Set<string>();

  for (const line of output.split('\n')) {
    if (!line.includes('(fetch)')) continue;
    const parts = line.split(/\s+/);
    if (parts.length < 2) continue;
    const name = parts[0];
    const url = parts[1];
    if (seen.has(name)) continue;
    seen.add(name);

    // Get fetch refspec
    let fetchRefspec = '';
    try {
      fetchRefspec = exec(`git config remote.${name}.fetch`, repoPath);
    } catch {
      fetchRefspec = `+refs/heads/*:refs/remotes/${name}/*`;
    }

    remotes.push({ name, url, fetch: fetchRefspec });
  }

  return remotes;
}
