/**
 * Install workflow — parse repo URLs, orchestrate the full install flow.
 *
 * The primary entry point for sc-git support. Given a repo URL, produces
 * a fully configured local clone with upstream tracking, dev branch,
 * push safety (push.default=nothing), and HITL gates ready.
 *
 * Requirements: INSTALL-01, INSTALL-02, INSTALL-03, INSTALL-04
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { ScGitConfig, GitStateReport } from '../types.js';
import { installRepo, isInstalled, loadConfig, saveConfig } from '../core/repo-manager.js';
import { detectState } from '../core/state-machine.js';
import { logOperation } from '../core/logger.js';

// === Exported Types ===

/** Result of parsing a repository URL. */
export interface ParsedRepoUrl {
  /** Repository host (e.g. 'github.com', 'gitlab.com') */
  host: string;
  /** Repository owner or organization */
  owner: string;
  /** Repository name */
  repo: string;
  /** Protocol used in the original URL */
  protocol: 'https' | 'ssh';
  /** Normalized clone URL (always HTTPS with .git suffix) */
  cloneUrl: string;
}

/** Options for the install command. */
export interface InstallOptions {
  /** Root directory for all managed projects (default: process.cwd()) */
  projectRoot?: string;
  /** Override the main branch name (default: auto-detect from upstream) */
  mainBranch?: string;
  /** Override the dev branch name (default: 'dev') */
  devBranch?: string;
}

/** Result of the install flow. */
export interface InstallResult {
  /** Whether the install completed successfully */
  success: boolean;
  /** Whether the repo was already installed (skipped) */
  alreadyInstalled: boolean;
  /** Repository name */
  repoName?: string;
  /** Absolute path to the cloned repository */
  repoPath?: string;
  /** The generated configuration (if install succeeded) */
  config?: ScGitConfig;
  /** Error message (if install failed) */
  error?: string;
}

/** Resolved filesystem paths for an install. */
export interface InstallPaths {
  /** Path to the cloned repository */
  repoPath: string;
  /** Path to the worktree directory */
  worktreePath: string;
  /** Path to the .sc-git config directory */
  configDir: string;
}

// === URL Parsing ===

/** Regex for HTTPS URLs: https://host/owner/repo[.git][/] */
const HTTPS_REGEX = /^https?:\/\/([^/]+)\/([^/]+)\/([^/]+?)(?:\.git)?\/?\s*$/;

/** Regex for SSH URLs: git@host:owner/repo[.git] */
const SSH_REGEX = /^git@([^:]+):([^/]+)\/([^/]+?)(?:\.git)?$/;

/**
 * Parse a repository URL into its components.
 *
 * Handles HTTPS, SSH, and .git suffix formats for GitHub, GitLab, Bitbucket,
 * and other git hosting services.
 *
 * @param url - The repository URL to parse
 * @returns Parsed URL components with normalized clone URL
 * @throws Error if the URL format is not recognized or incomplete
 */
export function parseRepoUrl(url: string): ParsedRepoUrl {
  const trimmed = url.trim();

  // Try HTTPS format
  const httpsMatch = trimmed.match(HTTPS_REGEX);
  if (httpsMatch) {
    const [, host, owner, repo] = httpsMatch;
    if (!owner || !repo) {
      throw new Error(`Invalid repository URL: missing owner or repo in "${url}"`);
    }
    return {
      host,
      owner,
      repo,
      protocol: 'https',
      cloneUrl: `https://${host}/${owner}/${repo}.git`,
    };
  }

  // Try SSH format
  const sshMatch = trimmed.match(SSH_REGEX);
  if (sshMatch) {
    const [, host, owner, repo] = sshMatch;
    if (!owner || !repo) {
      throw new Error(`Invalid repository URL: missing owner or repo in "${url}"`);
    }
    return {
      host,
      owner,
      repo,
      protocol: 'ssh',
      cloneUrl: `https://${host}/${owner}/${repo}.git`,
    };
  }

  throw new Error(
    `Invalid repository URL: "${url}". Expected HTTPS (https://host/owner/repo) or SSH (git@host:owner/repo) format.`,
  );
}

// === Path Resolution ===

/**
 * Resolve filesystem paths for an install.
 *
 * Pure function — no I/O. Computes the directory structure for a
 * managed repository based on its name and the project root.
 *
 * @param repo - Repository name
 * @param projectRoot - Root directory for managed projects (default: process.cwd())
 * @returns Resolved paths for repo, worktrees, and config
 */
export function resolveInstallPaths(repo: string, projectRoot?: string): InstallPaths {
  const root = projectRoot ?? process.cwd();
  return {
    repoPath: path.join(root, 'projects', repo),
    worktreePath: path.join(root, 'worktrees', repo),
    configDir: path.join(root, '.sc-git'),
  };
}

// === Install Orchestration ===

/**
 * Run the full install flow for a repository.
 *
 * 8-step orchestration:
 * 1. Parse the URL
 * 2. Resolve filesystem paths
 * 3. Check if already installed (offer update-or-skip)
 * 4. Create directories (projects/, worktrees/, .sc-git/)
 * 5. Delegate to repo-manager for clone + remote configuration
 * 6. Detect default branch and configure
 * 7. Build and save ScGitConfig
 * 8. Log operation to JSONL and return result
 *
 * @param url - The repository URL to install
 * @param options - Optional install configuration
 * @returns The install result with success status and configuration
 */
export async function install(url: string, options?: InstallOptions): Promise<InstallResult> {
  // Step 1: Parse URL
  let parsed: ParsedRepoUrl;
  try {
    parsed = parseRepoUrl(url);
  } catch (err) {
    return {
      success: false,
      alreadyInstalled: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // Step 2: Resolve paths
  const paths = resolveInstallPaths(parsed.repo, options?.projectRoot);

  // Step 3: Check if already installed
  const alreadyExists = await isInstalled(paths.repoPath);
  if (alreadyExists) {
    const existingConfig = await loadConfig(paths.repoPath);
    return {
      success: true,
      alreadyInstalled: true,
      repoName: parsed.repo,
      repoPath: paths.repoPath,
      config: existingConfig,
    };
  }

  // Capture state before for logging
  const emptyState: GitStateReport = {
    state: 'CLEAN',
    branch: null,
    remotes: [],
    ahead: 0,
    behind: 0,
    staged: [],
    unstaged: [],
    untracked: [],
  };

  try {
    // Step 4: Create directories
    fs.mkdirSync(paths.repoPath, { recursive: true });
    fs.mkdirSync(paths.worktreePath, { recursive: true });
    fs.mkdirSync(paths.configDir, { recursive: true });

    // Step 5: Clone and configure via repo-manager
    const repoConfig = await installRepo(parsed.cloneUrl, paths.repoPath);

    // Step 6: Default branch is detected inside installRepo,
    // but we can override via options
    const config: ScGitConfig = {
      ...repoConfig,
      repo: parsed.repo,
      upstream: parsed.cloneUrl,
      origin: parsed.cloneUrl,
      devBranch: options?.devBranch ?? repoConfig.devBranch ?? 'dev',
      mainBranch: options?.mainBranch ?? repoConfig.mainBranch ?? 'main',
      worktreeRoot: paths.worktreePath,
    };

    // Step 7: Save config
    await saveConfig(paths.repoPath, config);

    // Step 8: Verify post-install state and log
    const stateAfter = await detectState(paths.repoPath);

    await logOperation(
      paths.configDir,
      'install',
      ['clone', 'configure-remotes', 'create-dev-branch', 'set-push-safety'],
      emptyState,
      stateAfter,
      true,
    );

    return {
      success: true,
      alreadyInstalled: false,
      repoName: parsed.repo,
      repoPath: paths.repoPath,
      config,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);

    // Log the failed operation
    try {
      await logOperation(
        paths.configDir,
        'install',
        ['clone', 'configure-remotes', 'create-dev-branch', 'set-push-safety'],
        emptyState,
        emptyState,
        false,
        errorMessage,
      );
    } catch {
      // Logging failure should not mask the install error
    }

    return {
      success: false,
      alreadyInstalled: false,
      repoName: parsed.repo,
      repoPath: paths.repoPath,
      error: errorMessage,
    };
  }
}
