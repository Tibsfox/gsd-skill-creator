/**
 * CLI registration for sc git subcommands.
 *
 * Exports registerGitCommands() which returns descriptors for all
 * git-related CLI commands. Each command is a thin wrapper that
 * parses arguments, resolves the repo path, delegates to the
 * handler from Phase 395-396, and formats the result.
 *
 * Requirements: SKILL-02 (pipeline registration via YAML triggers)
 */

import { install } from './workflows/install.js';
import type { InstallOptions } from './workflows/install.js';
import { detectState } from './core/state-machine.js';
import { createBranch, listWorktrees } from './core/branch-manager.js';
import { sync } from './core/sync-manager.js';
import type { SyncOptions } from './core/sync-manager.js';
import { presentMergeGate, presentPRGate } from './gates/hitl-gate.js';
import type { GatePromptFn, PRPromptFn } from './gates/hitl-gate.js';

// === Types ===

/** Result returned by all CLI command handlers. */
export interface CommandResult {
  success: boolean;
  message: string;
}

/** Descriptor for a CLI command. */
export interface GitCommand {
  /** Command name (e.g. 'install', 'status') */
  name: string;
  /** Human-readable description */
  description: string;
  /** Usage string shown in help */
  usage: string;
  /** Handler function — receives raw CLI args, returns result */
  handler: (args: string[], deps?: CommandDeps) => Promise<CommandResult>;
}

/** Injectable dependencies for testability. */
export interface CommandDeps {
  cwd?: string;
  gatePromptFn?: GatePromptFn;
  prPromptFn?: PRPromptFn;
}

// === Argument Parsing Helpers ===

function getFlag(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  return args[idx + 1];
}

function hasFlag(args: string[], flag: string): boolean {
  return args.includes(flag);
}

function getPositional(args: string[], index: number): string | undefined {
  const positionals = args.filter((a) => !a.startsWith('--'));
  return positionals[index];
}

function rejectUnknownFlags(args: string[], known: string[]): string | null {
  for (const arg of args) {
    if (arg.startsWith('--') && !known.includes(arg)) {
      return `Unknown flag: ${arg}`;
    }
  }
  return null;
}

// === Command Handlers ===

async function installHandler(args: string[], deps?: CommandDeps): Promise<CommandResult> {
  const unknownErr = rejectUnknownFlags(args, ['--main-branch', '--dev-branch']);
  if (unknownErr) return { success: false, message: unknownErr };

  const url = getPositional(args, 0);
  if (!url) {
    return {
      success: false,
      message: 'URL is required. Usage: sc install <url> [--main-branch <name>] [--dev-branch <name>]',
    };
  }

  const options: InstallOptions = {
    projectRoot: deps?.cwd,
    mainBranch: getFlag(args, '--main-branch'),
    devBranch: getFlag(args, '--dev-branch'),
  };

  const result = await install(url, options);

  if (!result.success) {
    return { success: false, message: `Install failed: ${result.error}` };
  }

  if (result.alreadyInstalled) {
    return { success: true, message: `Already installed: ${result.repoName} at ${result.repoPath}` };
  }

  return {
    success: true,
    message: `Installed ${result.repoName} at ${result.repoPath}`,
  };
}

async function statusHandler(args: string[], deps?: CommandDeps): Promise<CommandResult> {
  const unknownErr = rejectUnknownFlags(args, []);
  if (unknownErr) return { success: false, message: unknownErr };

  const repoPath = getPositional(args, 0) ?? deps?.cwd ?? process.cwd();

  try {
    const report = await detectState(repoPath);
    const lines = [
      `State:     ${report.state}`,
      `Branch:    ${report.branch ?? '(detached HEAD)'}`,
      `Ahead:     ${report.ahead}`,
      `Behind:    ${report.behind}`,
      `Staged:    ${report.staged.length} file(s)`,
      `Unstaged:  ${report.unstaged.length} file(s)`,
      `Untracked: ${report.untracked.length} file(s)`,
      `Remotes:   ${report.remotes.map((r) => r.name).join(', ') || 'none'}`,
    ];
    return { success: true, message: lines.join('\n') };
  } catch (err) {
    return {
      success: false,
      message: `Status failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

async function syncHandler(args: string[], deps?: CommandDeps): Promise<CommandResult> {
  const unknownErr = rejectUnknownFlags(args, ['--strategy', '--dry-run']);
  if (unknownErr) return { success: false, message: unknownErr };

  const repoPath = deps?.cwd ?? process.cwd();
  const strategy = getFlag(args, '--strategy') as SyncOptions['strategy'] | undefined;
  const dryRun = hasFlag(args, '--dry-run');

  if (strategy && strategy !== 'merge' && strategy !== 'rebase') {
    return { success: false, message: 'Invalid strategy. Use: merge or rebase' };
  }

  try {
    const result = await sync(repoPath, { strategy, dryRun });

    if (result.conflicted) {
      const files = result.conflictFiles?.join(', ') ?? 'unknown';
      return { success: false, message: `Sync conflict in: ${files}. Operation aborted safely.` };
    }

    if (result.dryRun) {
      const lines = [`${result.newCommits} new commit(s) available from upstream`];
      if (result.upstreamLog && result.upstreamLog.length > 0) {
        lines.push('', ...result.upstreamLog);
      }
      return { success: true, message: lines.join('\n') };
    }

    if (result.newCommits === 0) {
      return { success: true, message: 'Already up to date with upstream' };
    }

    return {
      success: true,
      message: `Synced ${result.newCommits} commit(s) from upstream`,
    };
  } catch (err) {
    return {
      success: false,
      message: `Sync failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

async function workHandler(args: string[], deps?: CommandDeps): Promise<CommandResult> {
  const unknownErr = rejectUnknownFlags(args, ['--type', '--worktree']);
  if (unknownErr) return { success: false, message: unknownErr };

  const name = getPositional(args, 0);
  if (!name) {
    return {
      success: false,
      message: 'Branch name is required. Usage: sc git work <name> [--type feature|fix|docs|refactor] [--worktree]',
    };
  }

  const repoPath = deps?.cwd ?? process.cwd();
  const typePrefix = getFlag(args, '--type');
  const useWorktree = hasFlag(args, '--worktree');

  const validTypes = ['feature', 'fix', 'docs', 'refactor'];
  if (typePrefix && !validTypes.includes(typePrefix)) {
    return { success: false, message: `Invalid type: ${typePrefix}. Use: ${validTypes.join(', ')}` };
  }

  const branchName = typePrefix ? `${typePrefix}/${name}` : name;

  try {
    const result = await createBranch(repoPath, branchName, { worktree: useWorktree });

    const worktreeMsg = result.worktreePath
      ? ` with worktree at ${result.worktreePath}`
      : '';

    return {
      success: true,
      message: `Created branch ${result.branch}${worktreeMsg}`,
    };
  } catch (err) {
    return {
      success: false,
      message: `Branch creation failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

async function gateMergeHandler(_args: string[], deps?: CommandDeps): Promise<CommandResult> {
  const repoPath = deps?.cwd ?? process.cwd();
  const promptFn = deps?.gatePromptFn;

  if (!promptFn) {
    return { success: false, message: 'Gate merge requires a prompt function (interactive mode)' };
  }

  try {
    const decision = await presentMergeGate(repoPath, promptFn);

    if (decision.approved) {
      return { success: true, message: 'Gate 1 approved: dev -> main merge authorized' };
    }

    return { success: true, message: 'Gate 1 rejected: no changes made' };
  } catch (err) {
    return {
      success: false,
      message: `Gate merge failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

async function gatePrHandler(_args: string[], deps?: CommandDeps): Promise<CommandResult> {
  const repoPath = deps?.cwd ?? process.cwd();
  const prPromptFn = deps?.prPromptFn;

  if (!prPromptFn) {
    return { success: false, message: 'Gate PR requires a prompt function (interactive mode)' };
  }

  try {
    const decision = await presentPRGate(repoPath, prPromptFn);

    if (decision.approved) {
      return {
        success: true,
        message: `Gate 2 approved: PR "${decision.prTitle}" authorized`,
      };
    }

    return { success: true, message: 'Gate 2 rejected: zero upstream contact' };
  } catch (err) {
    return {
      success: false,
      message: `Gate PR failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

async function worktreeListHandler(_args: string[], deps?: CommandDeps): Promise<CommandResult> {
  const repoPath = deps?.cwd ?? process.cwd();

  try {
    const worktrees = await listWorktrees(repoPath);

    if (worktrees.length === 0) {
      return { success: true, message: 'No active worktrees' };
    }

    const lines = worktrees.map((wt) => {
      const cleanStatus = wt.clean ? 'clean' : 'dirty';
      return `  ${wt.branch || '(detached)'} -> ${wt.path} [${cleanStatus}]`;
    });

    return {
      success: true,
      message: `Active worktrees:\n${lines.join('\n')}`,
    };
  } catch (err) {
    return {
      success: false,
      message: `Worktree list failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// === Registration ===

/**
 * Register all git-related CLI command descriptors.
 *
 * Returns an array of GitCommand objects that can be consumed
 * by the skill-creator CLI router. Each command has a name,
 * description, usage string, and async handler.
 *
 * @returns Array of GitCommand descriptors
 */
export function registerGitCommands(): GitCommand[] {
  return [
    {
      name: 'install',
      description: 'Install a git repository with upstream tracking and contribution workflow',
      usage: 'sc install <url> [--main-branch <name>] [--dev-branch <name>]',
      handler: installHandler,
    },
    {
      name: 'git-status',
      description: 'Show git state machine report for a managed repository',
      usage: 'sc git status [path]',
      handler: statusHandler,
    },
    {
      name: 'git-sync',
      description: 'Fetch upstream changes and integrate into dev branch',
      usage: 'sc git sync [--strategy merge|rebase] [--dry-run]',
      handler: syncHandler,
    },
    {
      name: 'git-work',
      description: 'Create a named feature branch with optional worktree',
      usage: 'sc git work <name> [--type feature|fix|docs|refactor] [--worktree]',
      handler: workHandler,
    },
    {
      name: 'git-gate-merge',
      description: 'Present Gate 1 (dev -> main merge) for human approval',
      usage: 'sc git gate merge',
      handler: gateMergeHandler,
    },
    {
      name: 'git-gate-pr',
      description: 'Present Gate 2 (main -> upstream PR) for human approval',
      usage: 'sc git gate pr',
      handler: gatePrHandler,
    },
    {
      name: 'git-worktree-list',
      description: 'List active worktrees for the managed repository',
      usage: 'sc git worktree list',
      handler: worktreeListHandler,
    },
  ];
}
