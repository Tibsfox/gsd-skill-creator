/**
 * Repository manager — clone, configure, and persist sc-git repo configuration.
 *
 * Handles the full install flow: clone from upstream, rename remotes,
 * set push.default=nothing (safety critical), create dev branch,
 * and persist .sc-git/config.json.
 */

import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { ScGitConfig } from '../types.js';

/**
 * Install a repository for sc-git management.
 *
 * Follows the 12-step installation sequence:
 * 1. Clone from URL
 * 2. Rename origin to upstream
 * 3. Add origin (same URL in v1, fork URL in future)
 * 4. Set push.default=nothing
 * 5. Set remote.pushDefault=origin
 * 6. Fetch upstream
 * 7. Detect default branch (main/master)
 * 8. Create and checkout dev branch
 * 9. Set branch.dev.pushRemote=origin
 * 10. Write .sc-git/config.json
 *
 * @param url - The upstream repository URL (HTTPS or local path)
 * @param targetDir - The target directory for the clone
 * @returns The generated ScGitConfig
 * @throws Error if any git command fails
 */
export async function installRepo(url: string, targetDir: string): Promise<ScGitConfig> {
  // 1. Clone
  exec(`git clone "${url}" "${targetDir}"`);

  // 2. Rename origin to upstream
  exec('git remote rename origin upstream', targetDir);

  // 3. Add origin (same URL in v1 — no fork info yet)
  exec(`git remote add origin "${url}"`, targetDir);

  // 4. push.default = nothing (SAFETY CRITICAL)
  exec('git config push.default nothing', targetDir);

  // 5. remote.pushDefault = origin
  exec('git config remote.pushDefault origin', targetDir);

  // 6. Fetch upstream
  exec('git fetch upstream', targetDir);

  // 7. Detect default branch
  const mainBranch = detectDefaultBranch(targetDir);

  // 8. Create and checkout dev branch
  exec(`git checkout -b dev upstream/${mainBranch}`, targetDir);

  // 9. Set dev pushRemote
  exec('git config branch.dev.pushRemote origin', targetDir);

  // 10. Configure user for the repo (inherit from global or set defaults)
  try {
    exec('git config user.name', targetDir);
  } catch {
    exec('git config user.name "sc-git user"', targetDir);
  }
  try {
    exec('git config user.email', targetDir);
  } catch {
    exec('git config user.email "sc-git@localhost"', targetDir);
  }

  // 11. Create .sc-git directory and write config
  const scGitDir = path.join(targetDir, '.sc-git');
  fs.mkdirSync(scGitDir, { recursive: true });

  const repoName = deriveRepoName(url);
  const config: ScGitConfig = {
    repo: repoName,
    upstream: url,
    origin: url,
    devBranch: 'dev',
    mainBranch,
    gates: {
      mergeToMain: true,
      prToUpstream: true,
    },
    worktreeRoot: path.join(path.dirname(targetDir), 'worktrees', repoName),
    installedAt: new Date().toISOString(),
    lastSync: null,
  };

  fs.writeFileSync(
    path.join(scGitDir, 'config.json'),
    JSON.stringify(config, null, 2),
    'utf-8',
  );

  return config;
}

/**
 * Check whether a directory is an sc-git managed repository.
 *
 * @param targetDir - Path to check
 * @returns true if .sc-git/config.json exists
 */
export async function isInstalled(targetDir: string): Promise<boolean> {
  return fs.existsSync(path.join(targetDir, '.sc-git', 'config.json'));
}

/**
 * Load the sc-git configuration from a managed repository.
 *
 * @param targetDir - Path to the managed repository
 * @returns The parsed ScGitConfig
 * @throws Error if .sc-git/config.json does not exist or is invalid JSON
 */
export async function loadConfig(targetDir: string): Promise<ScGitConfig> {
  const configPath = path.join(targetDir, '.sc-git', 'config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error(`No sc-git config found at ${configPath}`);
  }
  const raw = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(raw) as ScGitConfig;
}

/**
 * Save an sc-git configuration to a managed repository.
 *
 * Creates the .sc-git directory if it does not exist.
 *
 * @param targetDir - Path to the managed repository
 * @param config - The ScGitConfig to persist
 */
export async function saveConfig(targetDir: string, config: ScGitConfig): Promise<void> {
  const scGitDir = path.join(targetDir, '.sc-git');
  fs.mkdirSync(scGitDir, { recursive: true });
  fs.writeFileSync(
    path.join(scGitDir, 'config.json'),
    JSON.stringify(config, null, 2),
    'utf-8',
  );
}

// --- Internal helpers ---

/**
 * Execute a command synchronously and return trimmed stdout.
 */
function exec(command: string, cwd?: string): string {
  const opts: { cwd?: string; encoding: BufferEncoding; stdio: ['pipe', 'pipe', 'pipe'] } = {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  };
  if (cwd) {
    opts.cwd = cwd;
  }
  return execSync(command, opts).trim();
}

/**
 * Detect the default branch of the upstream remote.
 *
 * Tries git symbolic-ref first, then falls back to checking
 * for 'main' or 'master' branches.
 */
function detectDefaultBranch(repoPath: string): string {
  try {
    const ref = exec('git symbolic-ref refs/remotes/upstream/HEAD', repoPath);
    // Format: refs/remotes/upstream/main
    const parts = ref.split('/');
    return parts[parts.length - 1];
  } catch {
    // Fallback: check which branches exist
    try {
      exec('git rev-parse --verify upstream/main', repoPath);
      return 'main';
    } catch {
      try {
        exec('git rev-parse --verify upstream/master', repoPath);
        return 'master';
      } catch {
        // Last resort: list remote branches and pick the first one
        const branches = exec('git branch -r', repoPath);
        const match = branches.match(/upstream\/(\S+)/);
        if (match) {
          return match[1];
        }
        return 'main'; // absolute fallback
      }
    }
  }
}

/**
 * Derive a repository name from a URL.
 *
 * Extracts the last path segment and removes the .git suffix.
 * For local paths, uses the directory name.
 */
function deriveRepoName(url: string): string {
  // Remove trailing slashes
  const cleaned = url.replace(/\/+$/, '');
  // Get last segment
  const lastSegment = cleaned.split('/').pop() || 'repo';
  // Remove .git suffix
  return lastSegment.replace(/\.git$/, '');
}
