/**
 * Branch manager — create, list, remove branches and worktrees
 * with naming convention enforcement.
 *
 * All branch operations go through assertClean first.
 * Protected branches (dev, main) cannot be deleted.
 * Naming convention: feature/, fix/, docs/, refactor/ prefixes,
 * lowercase + hyphens, no double hyphens, max 50 total chars.
 */

import { execFile } from 'node:child_process';
import * as path from 'node:path';
import { assertClean, detectState } from './state-machine.js';
import { loadConfig } from './repo-manager.js';
import type { GitStateReport } from '../types.js';

// --- Public types ---

export interface BranchResult {
  branch: string;
  worktreePath?: string;
}

export interface BranchInfo {
  name: string;
  head: string;
  subject: string;
  ahead: number;
  behind: number;
  current: boolean;
  worktreePath?: string;
}

export interface WorktreeInfo {
  path: string;
  branch: string;
  head: string;
  clean: boolean;
}

// --- Valid prefixes ---

const VALID_PREFIXES = ['feature/', 'fix/', 'docs/', 'refactor/'] as const;
const MAX_BRANCH_LENGTH = 50;

// --- Public functions ---

/**
 * Validate and normalize a branch name.
 *
 * - If the name already has a valid prefix, preserve it.
 * - If bare name, add 'feature/' prefix.
 * - Validate: lowercase + hyphens + digits only (after prefix), no double hyphens, max 50 total chars.
 *
 * @param name - Raw branch name input
 * @returns The validated full branch name
 * @throws Error if the name violates naming conventions
 */
export function validateBranchName(name: string): string {
  let fullName = name;
  let suffix: string;

  const hasPrefix = VALID_PREFIXES.some((p) => name.startsWith(p));
  if (hasPrefix) {
    const slashIdx = name.indexOf('/');
    suffix = name.substring(slashIdx + 1);
  } else {
    fullName = `feature/${name}`;
    suffix = name;
  }

  // Validate suffix: lowercase + hyphens + digits only, must start with letter
  if (!/^[a-z][a-z0-9-]*$/.test(suffix)) {
    throw new Error(
      `Invalid branch name "${name}": suffix must be lowercase letters, digits, and hyphens only, starting with a letter`,
    );
  }

  // No double hyphens
  if (suffix.includes('--')) {
    throw new Error(`Invalid branch name "${name}": double hyphens are not allowed`);
  }

  // Max total length
  if (fullName.length > MAX_BRANCH_LENGTH) {
    throw new Error(
      `Invalid branch name "${name}": exceeds maximum length of ${MAX_BRANCH_LENGTH} characters (got ${fullName.length})`,
    );
  }

  return fullName;
}

/**
 * Create a feature branch from dev.
 *
 * @param repoPath - Absolute path to the git repository
 * @param name - Branch name (will be validated and prefixed)
 * @param options - Optional: worktree creation, prefix override
 * @returns BranchResult with branch name and optional worktree path
 */
export async function createBranch(
  repoPath: string,
  name: string,
  options?: { worktree?: boolean },
): Promise<BranchResult> {
  await assertClean(repoPath);

  const branchName = validateBranchName(name);
  const config = await loadConfig(repoPath);

  if (options?.worktree) {
    // Use worktree-setup.sh
    const worktreePath = path.join(
      config.worktreeRoot,
      branchName.replace(/\//g, '-'),
    );
    const scriptPath = path.join(
      path.dirname(path.dirname(__filename)),
      'scripts',
      'worktree-setup.sh',
    );

    const stdout = await execGit(
      scriptPath,
      [repoPath, branchName, worktreePath],
      repoPath,
    );
    const result = JSON.parse(stdout);

    if (!result.success) {
      throw new Error(`Worktree creation failed: ${result.reason}`);
    }

    return {
      branch: branchName,
      worktreePath: result.path,
    };
  }

  // Create branch without worktree
  await execGit('git', ['checkout', '-b', branchName, config.devBranch], repoPath);
  await execGit('git', ['checkout', config.devBranch], repoPath);
  await execGit('git', ['config', `branch.${branchName}.pushRemote`, 'origin'], repoPath);

  return { branch: branchName };
}

/**
 * List all branches with metadata.
 *
 * @param repoPath - Absolute path to the git repository
 * @returns Array of BranchInfo objects
 */
export async function listBranches(repoPath: string): Promise<BranchInfo[]> {
  const branchOutput = await execGit(
    'git',
    ['branch', '-v', '--format=%(refname:short) %(objectname:short) %(subject) %(upstream:track)'],
    repoPath,
  );

  const currentBranch = (
    await execGit('git', ['branch', '--show-current'], repoPath)
  ).trim();

  const worktrees = await listWorktrees(repoPath);
  const worktreeMap = new Map<string, string>();
  for (const wt of worktrees) {
    if (wt.branch) {
      worktreeMap.set(wt.branch, wt.path);
    }
  }

  const branches: BranchInfo[] = [];

  for (const line of branchOutput.split('\n').filter((l) => l.trim())) {
    const parsed = parseBranchLine(line);
    if (!parsed) continue;

    branches.push({
      ...parsed,
      current: parsed.name === currentBranch,
      worktreePath: worktreeMap.get(parsed.name),
    });
  }

  return branches;
}

/**
 * List active worktrees.
 *
 * @param repoPath - Absolute path to the git repository
 * @returns Array of WorktreeInfo objects
 */
export async function listWorktrees(repoPath: string): Promise<WorktreeInfo[]> {
  const output = await execGit('git', ['worktree', 'list', '--porcelain'], repoPath);
  const worktrees: WorktreeInfo[] = [];

  const blocks = output.split('\n\n').filter((b) => b.trim());

  for (const block of blocks) {
    const lines = block.split('\n');
    let wtPath = '';
    let head = '';
    let branch = '';

    for (const line of lines) {
      if (line.startsWith('worktree ')) {
        wtPath = line.substring('worktree '.length);
      } else if (line.startsWith('HEAD ')) {
        head = line.substring('HEAD '.length);
      } else if (line.startsWith('branch ')) {
        // branch refs/heads/feature/auth -> feature/auth
        const ref = line.substring('branch '.length);
        branch = ref.replace('refs/heads/', '');
      }
    }

    if (wtPath) {
      let clean = true;
      try {
        const state: GitStateReport = await detectState(wtPath);
        clean = state.state === 'CLEAN';
      } catch {
        clean = false;
      }

      worktrees.push({ path: wtPath, branch, head, clean });
    }
  }

  return worktrees;
}

/**
 * Remove a branch and its associated worktree.
 *
 * @param repoPath - Absolute path to the git repository
 * @param name - Branch name to remove
 * @param options - Optional: force delete unmerged branches
 * @throws Error if branch is protected (dev, main) or unmerged without force
 */
export async function removeBranch(
  repoPath: string,
  name: string,
  options?: { force?: boolean },
): Promise<void> {
  const config = await loadConfig(repoPath);

  // Protected branch check
  if (name === config.devBranch || name === 'dev') {
    throw new Error(`Cannot remove dev branch — it is protected`);
  }
  if (name === config.mainBranch || name === 'main') {
    throw new Error(`Cannot remove main branch — it is protected`);
  }

  // Check for associated worktree
  const worktreeOutput = await execGit('git', ['worktree', 'list', '--porcelain'], repoPath);
  const hasWorktree = worktreeOutput.includes(`branch refs/heads/${name}`);

  if (hasWorktree) {
    // Find worktree path
    const blocks = worktreeOutput.split('\n\n');
    for (const block of blocks) {
      if (block.includes(`branch refs/heads/${name}`)) {
        const pathLine = block.split('\n').find((l) => l.startsWith('worktree '));
        if (pathLine) {
          const wtPath = pathLine.substring('worktree '.length);
          await execGit('git', ['worktree', 'remove', wtPath], repoPath);
        }
        break;
      }
    }
  }

  if (options?.force) {
    // Force delete — skip merge check
    await execGit('git', ['branch', '-D', name], repoPath);
    return;
  }

  // Check if branch is merged into dev
  try {
    await execGit(
      'git',
      ['merge-base', '--is-ancestor', name, config.devBranch],
      repoPath,
    );
  } catch {
    throw new Error(
      `Branch "${name}" has unmerged commits. Use force option to delete anyway.`,
    );
  }

  await execGit('git', ['branch', '-d', name], repoPath);
}

// --- Internal helpers ---

/**
 * Execute a command via execFile and return stdout.
 * Uses execFile (not exec) to avoid shell injection.
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

/**
 * Parse a single git branch -v output line.
 */
function parseBranchLine(
  line: string,
): { name: string; head: string; subject: string; ahead: number; behind: number } | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // Format: "branchname abc1234 subject [ahead N, behind M]"
  const parts = trimmed.split(/\s+/);
  if (parts.length < 3) return null;

  const name = parts[0];
  const head = parts[1];

  // Extract tracking info from the end
  let ahead = 0;
  let behind = 0;
  const trackMatch = trimmed.match(/\[ahead (\d+)(?:, behind (\d+))?\]/);
  const behindOnlyMatch = trimmed.match(/\[behind (\d+)\]/);

  if (trackMatch) {
    ahead = parseInt(trackMatch[1], 10) || 0;
    behind = parseInt(trackMatch[2], 10) || 0;
  } else if (behindOnlyMatch) {
    behind = parseInt(behindOnlyMatch[1], 10) || 0;
  }

  // Subject is everything between head and tracking info
  const headIdx = trimmed.indexOf(head) + head.length;
  let subjectEnd = trimmed.length;
  const bracketIdx = trimmed.indexOf('[', headIdx);
  if (bracketIdx !== -1) {
    subjectEnd = bracketIdx;
  }
  const subject = trimmed.substring(headIdx, subjectEnd).trim();

  return { name, head, subject, ahead, behind };
}
