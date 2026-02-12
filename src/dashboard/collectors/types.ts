/**
 * Shared type definitions for dashboard data collectors.
 *
 * Defines the typed data contract for all three collectors (git, session,
 * planning). Collectors return structured metric objects — never HTML strings.
 *
 * @module dashboard/collectors/types
 */

// ============================================================================
// Git Collector Types
// ============================================================================

/** Single parsed git commit with conventional commit fields. */
export interface GitCommitMetric {
  /** Short SHA (7 chars). */
  hash: string;
  /** Conventional commit type: feat, fix, test, refactor, docs, chore, etc. */
  type: string;
  /** Parenthesized scope, e.g., "auth" from "feat(auth): ...". */
  scope: string | null;
  /** Phase number extracted from scope (e.g., "93-01" -> 93) or commit message. */
  phase: number | null;
  /** Commit subject line (after type/scope prefix). */
  subject: string;
  /** ISO 8601 timestamp. */
  timestamp: string;
  /** Author name. */
  author: string;
  /** Number of files changed. */
  filesChanged: number;
  /** Lines added. */
  insertions: number;
  /** Lines removed. */
  deletions: number;
  /** List of changed file paths. */
  files: string[];
}

/** Result from git collector. */
export interface GitCollectorResult {
  commits: GitCommitMetric[];
  totalCommits: number;
  timeRange: {
    /** ISO 8601. */
    earliest: string;
    /** ISO 8601. */
    latest: string;
  } | null;
}

// ============================================================================
// Session Collector Types
// ============================================================================

/** Single session summary metric. */
export interface SessionMetric {
  sessionId: string;
  /** Unix epoch ms. */
  startTime: number;
  /** Unix epoch ms. */
  endTime: number;
  durationMinutes: number;
  model: string;
  /** Session source: startup, resume, clear, compact. */
  source: string;
  userMessages: number;
  assistantMessages: number;
  toolCalls: number;
  filesRead: number;
  filesWritten: number;
  commandsRun: number;
  topFiles: string[];
  topCommands: string[];
  activeSkills: string[];
}

/** Result from session collector. */
export interface SessionCollectorResult {
  sessions: SessionMetric[];
  totalSessions: number;
  activeSession: {
    sessionId: string;
    model: string;
    startTime: number;
  } | null;
}

// ============================================================================
// Planning Collector Types
// ============================================================================

/** Result from planning collector — reuses PlanSummaryDiff from monitoring. */
export interface PlanningCollectorResult {
  diffs: import('../../integration/monitoring/types.js').PlanSummaryDiff[];
  totalPlans: number;
  totalWithSummary: number;
}

// ============================================================================
// Collector Options
// ============================================================================

/** Options shared by all collectors. */
export interface CollectorOptions {
  /** Working directory (default: process.cwd()). */
  cwd?: string;
}

/** Git-specific collector options. */
export interface GitCollectorOptions extends CollectorOptions {
  /** Max commits to retrieve (default: 500). */
  maxCommits?: number;
  /** Only commits after this ISO date. */
  since?: string;
  /** Only commits in this phase number. */
  phase?: number;
}

/** Session-specific collector options. */
export interface SessionCollectorOptions extends CollectorOptions {
  /** Path to sessions.jsonl (default: .planning/patterns/sessions.jsonl). */
  sessionsPath?: string;
  /** Path to .session-cache.json (default: .planning/patterns/.session-cache.json). */
  cachePath?: string;
}

/** Planning-specific collector options. */
export interface PlanningCollectorOptions extends CollectorOptions {
  /** Path to phases directory (default: .planning/phases). */
  phasesDir?: string;
}
