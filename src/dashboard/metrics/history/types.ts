/**
 * Shared type definitions for historical trends renderers.
 *
 * Defines data contracts for all four history sub-renderers:
 * milestone comparison table, commit type distribution,
 * velocity trend, and file hotspots.
 *
 * @module dashboard/metrics/history/types
 */

// ============================================================================
// Milestone Table Types
// ============================================================================

/** A single row in the milestone comparison table. */
export interface MilestoneRow {
  /** Milestone version string, e.g., "v1.12". */
  version: string;
  /** Human-readable milestone name, e.g., "GSD Planning Docs Dashboard". */
  name: string;
  /** Number of phases in this milestone. */
  phases: number;
  /** Number of plans in this milestone. */
  plans: number;
  /** Count of git commits whose scope overlaps this milestone's phase range. */
  commits: number;
  /** Net lines of code: sum of (insertions - deletions) across matching commits. */
  loc: number;
  /** Count of commits where type === 'test'. */
  tests: number;
  /** Planning accuracy percentage, e.g., "85%" or "N/A". */
  accuracy: string;
}

// ============================================================================
// Commit Distribution Types
// ============================================================================

/** Commit type distribution entry for the stacked bar chart. */
export interface CommitDistribution {
  /** Conventional commit type: feat, test, fix, refactor, docs, or other. */
  type: string;
  /** Number of commits of this type. */
  count: number;
  /** Percentage of total commits (0-100). */
  percentage: number;
  /** CSS color for the bar segment. */
  color: string;
}

// ============================================================================
// Velocity Trend Types
// ============================================================================

/** A single point on the velocity trend line (plan 02). */
export interface VelocityPoint {
  /** Milestone version or phase number label. */
  label: string;
  /** Average LOC per phase in this milestone. */
  locPerPhase: number;
  /** Number of phases in this milestone. */
  phasesPerMilestone: number;
}

// ============================================================================
// File Hotspot Types
// ============================================================================

/** A file hotspot entry showing frequently modified files (plan 02). */
export interface FileHotspot {
  /** Relative file path. */
  path: string;
  /** Number of commits touching this file. */
  modificationCount: number;
  /** ISO 8601 timestamp of the most recent commit touching this file. */
  lastModified: string;
}

// ============================================================================
// Section Assembly Types
// ============================================================================

/** Assembled historical trends section content (all four sub-sections). */
export interface HistorySection {
  /** Rendered milestone comparison table HTML. */
  milestoneTable: string;
  /** Rendered commit type distribution HTML. */
  commitDistribution: string;
  /** Rendered velocity trend HTML. */
  velocityTrend: string;
  /** Rendered file hotspots HTML. */
  fileHotspots: string;
}
