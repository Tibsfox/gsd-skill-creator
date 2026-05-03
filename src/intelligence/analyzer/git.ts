/**
 * C01 — Git metadata helper.
 *
 * gitMetadata: fetch commit_count, author_count, last_modified for a file.
 * Uses child_process.execFile with FIXED args only — never a shell string (D-22-05, S2).
 * Returns null if git is unavailable, repo is absent, or file is untracked.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

const execFileAsync = promisify(execFile);

export interface GitFileMetadata {
  /** ISO-8601 timestamp of the most recent commit touching this file. */
  last_modified: string;
  /** Number of unique commits that touched this file. */
  commit_count: number;
  /** Number of distinct author email addresses. */
  author_count: number;
  /** Number of commits in the last 90 days. */
  commit_count_90d: number;
}

/**
 * Get git metadata for a file.
 *
 * @param filePath - Absolute path to the file.
 * @param repoRoot - Directory to run git commands from. Defaults to dirname(filePath).
 * @returns Metadata object, or null if git is unavailable / not a repo / file not tracked.
 */
export async function gitMetadata(
  filePath: string,
  repoRoot?: string,
): Promise<GitFileMetadata | null> {
  const root = repoRoot ?? dirname(filePath);

  // Quick check: does a .git directory exist? (fast-path to return null for non-repos)
  if (!hasGitRepo(root)) {
    return null;
  }

  try {
    // Get all commit hashes + author emails + timestamps for this file
    // Fixed args — NO shell interpolation (S2 invariant: only allowlisted args)
    const { stdout: logOutput } = await execFileAsync(
      'git',
      [
        'log',
        '--follow',
        '--format=%H|%ae|%aI', // hash | author email | ISO author date
        '--',
        filePath, // file path is a fixed arg in the args array, never in a shell string
      ],
      { cwd: root, timeout: 10000 },
    );

    const lines = logOutput.trim().split('\n').filter(Boolean);
    if (lines.length === 0) {
      return null; // file not tracked or no commits
    }

    const hashes = new Set<string>();
    const authors = new Set<string>();
    let latestTimestamp = '';
    const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
    let count90d = 0;

    for (const line of lines) {
      const [hash, email, timestamp] = line.split('|');
      if (hash) hashes.add(hash);
      if (email) authors.add(email);
      if (timestamp) {
        if (!latestTimestamp || new Date(timestamp) > new Date(latestTimestamp)) {
          latestTimestamp = timestamp;
        }
        if (new Date(timestamp).getTime() >= ninetyDaysAgo) {
          count90d++;
        }
      }
    }

    return {
      last_modified: latestTimestamp,
      commit_count: hashes.size,
      author_count: authors.size,
      commit_count_90d: count90d,
    };
  } catch {
    // git not found, permission error, or other failure — return null gracefully
    return null;
  }
}

/**
 * Check if a .git directory exists anywhere up the directory tree from `dir`.
 * Stops at filesystem root.
 */
function hasGitRepo(dir: string): boolean {
  let current = dir;
  while (true) {
    if (existsSync(join(current, '.git'))) {
      return true;
    }
    const parent = dirname(current);
    if (parent === current) {
      break; // reached filesystem root
    }
    current = parent;
  }
  return false;
}
