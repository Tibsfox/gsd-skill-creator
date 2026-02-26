/**
 * Shared TypeScript interfaces for the sc-git module.
 *
 * Every subsequent phase (395-397) imports from this file.
 * These types define the cross-component contract for the
 * deterministic git workflow management system.
 */

/**
 * The six possible states of a git repository.
 * Used by the state machine to gate operations.
 */
export type GitState = 'CLEAN' | 'DIRTY' | 'MERGING' | 'REBASING' | 'DETACHED' | 'CONFLICT';

/**
 * Runtime-accessible array of all valid GitState values.
 * Useful for exhaustiveness checks and UI rendering.
 */
export const GIT_STATES: readonly GitState[] = [
  'CLEAN',
  'DIRTY',
  'MERGING',
  'REBASING',
  'DETACHED',
  'CONFLICT',
] as const;

/**
 * Information about a git remote (origin, upstream, etc.).
 */
export interface RemoteInfo {
  /** Remote name (e.g. 'origin', 'upstream') */
  name: string;
  /** Remote URL (HTTPS or SSH) */
  url: string;
  /** Fetch refspec (e.g. '+refs/heads/*:refs/remotes/origin/*') */
  fetch: string;
}

/**
 * Complete snapshot of repository state at a point in time.
 * Produced by git-state-check.sh and consumed by all workflows.
 */
export interface GitStateReport {
  /** Current repository state */
  state: GitState;
  /** Current branch name, or null if detached HEAD */
  branch: string | null;
  /** Configured remotes */
  remotes: RemoteInfo[];
  /** Commits ahead of tracking branch */
  ahead: number;
  /** Commits behind tracking branch */
  behind: number;
  /** Files staged for commit */
  staged: string[];
  /** Modified but unstaged files */
  unstaged: string[];
  /** Untracked files */
  untracked: string[];
}

/**
 * Configuration for a skill-creator managed git repository.
 * Stored as .sc-git.json in the repo root.
 */
export interface ScGitConfig {
  /** Repository name (directory name) */
  repo: string;
  /** Upstream remote URL (the project's canonical repo) */
  upstream: string;
  /** Origin remote URL (user's fork) */
  origin: string;
  /** Development branch name (default: 'dev') */
  devBranch: string;
  /** Main/production branch name (default: 'main') */
  mainBranch: string;
  /** HITL gate configuration */
  gates: {
    /** Require human approval for dev->main merge */
    mergeToMain: boolean;
    /** Require human approval for main->upstream PR */
    prToUpstream: boolean;
  };
  /** Absolute path to worktree root */
  worktreeRoot: string;
  /** ISO 8601 timestamp of initial sc install */
  installedAt: string;
  /** ISO 8601 timestamp of last sync, or null if never synced */
  lastSync: string | null;
}

/**
 * Record of a human-in-the-loop gate decision.
 * Stored in the JSONL operation log.
 */
export interface GateDecision {
  /** Which gate was evaluated */
  gate: 'merge-to-main' | 'pr-to-upstream';
  /** Whether the human approved the operation */
  approved: boolean;
  /** ISO 8601 timestamp of the decision */
  timestamp: string;
  /** Diff summary presented to the human */
  summary: DiffSummary;
  /** Optional human-provided notes */
  humanNotes?: string;
}

/**
 * Summary of changes between two git states.
 * Used in gate presentations and PR descriptions.
 */
export interface DiffSummary {
  /** Total number of files changed */
  filesChanged: number;
  /** Total lines inserted */
  insertions: number;
  /** Total lines deleted */
  deletions: number;
  /** Per-file diff details */
  files: FileDiff[];
}

/**
 * Diff information for a single file.
 */
export interface FileDiff {
  /** File path relative to repo root */
  path: string;
  /** Change type */
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  /** Lines inserted in this file */
  insertions: number;
  /** Lines deleted in this file */
  deletions: number;
}

/**
 * Complete log entry for a git operation.
 * Appended to the JSONL log for auditability.
 */
export interface GitOperationLog {
  /** ISO 8601 timestamp of the operation */
  timestamp: string;
  /** Operation name (e.g. 'sync', 'merge', 'install') */
  operation: string;
  /** Git commands executed during this operation */
  commands: string[];
  /** Repository state before the operation */
  stateBefore: GitStateReport;
  /** Repository state after the operation */
  stateAfter: GitStateReport;
  /** Whether the operation completed successfully */
  success: boolean;
  /** Error message if operation failed */
  error?: string;
}
