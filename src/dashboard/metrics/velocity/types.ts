/**
 * Shared velocity type system for phase-level metric aggregation.
 *
 * Defines the PhaseStats interface, commit type distribution type,
 * grouping/aggregation functions, and a shared duration formatter.
 * Both the timeline renderer and stats-table renderer depend on these.
 *
 * @module dashboard/metrics/velocity/types
 */

import type { GitCommitMetric } from '../../collectors/types.js';

// ============================================================================
// Types
// ============================================================================

/** Count of commits by conventional commit type. */
export type CommitTypeDistribution = Record<string, number>;

/** Aggregated per-phase metrics computed from git commit data. */
export interface PhaseStats {
  /** Phase number. */
  phase: number;
  /** Wall time in ms (last commit timestamp - first commit timestamp). */
  wallTimeMs: number;
  /** Total number of commits in this phase. */
  commitCount: number;
  /** Total lines added across all commits. */
  insertions: number;
  /** Total lines removed across all commits. */
  deletions: number;
  /** Count of unique files touched across all commits. */
  filesChanged: number;
  /** Count of distinct plan scopes matching /^\d+-\d+$/. */
  plansExecuted: number;
  /** Commit counts grouped by conventional commit type. */
  commitTypes: CommitTypeDistribution;
  /** ISO 8601 timestamp of the earliest commit. */
  firstCommit: string;
  /** ISO 8601 timestamp of the latest commit. */
  lastCommit: string;
}

// ============================================================================
// Grouping
// ============================================================================

/**
 * Group commits by their phase number.
 *
 * Commits with `phase === null` are excluded from the result.
 *
 * @param commits - Array of parsed git commit metrics
 * @returns Map from phase number to commits in that phase
 */
export function groupCommitsByPhase(
  commits: GitCommitMetric[],
): Map<number, GitCommitMetric[]> {
  const map = new Map<number, GitCommitMetric[]>();

  for (const commit of commits) {
    if (commit.phase === null) continue;

    const existing = map.get(commit.phase);
    if (existing) {
      existing.push(commit);
    } else {
      map.set(commit.phase, [commit]);
    }
  }

  return map;
}

// ============================================================================
// Aggregation
// ============================================================================

/**
 * Aggregate a list of commits (already filtered for one phase) into PhaseStats.
 *
 * @param phase   - Phase number for this group
 * @param commits - Commits belonging to this phase
 * @returns Aggregated PhaseStats object
 */
export function computePhaseStats(
  phase: number,
  commits: GitCommitMetric[],
): PhaseStats {
  if (commits.length === 0) {
    return {
      phase,
      wallTimeMs: 0,
      commitCount: 0,
      insertions: 0,
      deletions: 0,
      filesChanged: 0,
      plansExecuted: 0,
      commitTypes: {},
      firstCommit: '',
      lastCommit: '',
    };
  }

  // Sort by timestamp ascending
  const sorted = [...commits].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  const firstTs = new Date(sorted[0].timestamp).getTime();
  const lastTs = new Date(sorted[sorted.length - 1].timestamp).getTime();

  // Unique files across all commits
  const allFiles = new Set<string>();
  for (const c of commits) {
    for (const f of c.files) {
      allFiles.add(f);
    }
  }

  // Distinct plan scopes matching /^\d+-\d+$/
  const planScopes = new Set<string>();
  for (const c of commits) {
    if (c.scope && /^\d+-\d+$/.test(c.scope)) {
      planScopes.add(c.scope);
    }
  }

  // Commit type distribution
  const commitTypes: CommitTypeDistribution = {};
  for (const c of commits) {
    commitTypes[c.type] = (commitTypes[c.type] ?? 0) + 1;
  }

  return {
    phase,
    wallTimeMs: lastTs - firstTs,
    commitCount: commits.length,
    insertions: commits.reduce((sum, c) => sum + c.insertions, 0),
    deletions: commits.reduce((sum, c) => sum + c.deletions, 0),
    filesChanged: allFiles.size,
    plansExecuted: planScopes.size,
    commitTypes,
    firstCommit: sorted[0].timestamp,
    lastCommit: sorted[sorted.length - 1].timestamp,
  };
}

// ============================================================================
// Shared Helpers
// ============================================================================

/**
 * Format a duration in milliseconds as a compact human-readable string.
 *
 * Examples: "1h 2m", "5m", "<1m"
 *
 * @param ms - Duration in milliseconds
 * @returns Formatted duration string
 */
export function formatDuration(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return '<1m';
}
