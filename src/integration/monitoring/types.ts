/**
 * Type definitions for passive monitoring.
 *
 * These interfaces define the data contract for:
 * - Scan observations written to sessions.jsonl (MON-04)
 * - Plan-vs-summary diffs (MON-01)
 * - STATE.md transition detection (MON-02)
 * - ROADMAP.md structural diffs (MON-05)
 *
 * @module integration/monitoring/types
 */

// ============================================================================
// MON-04: Scan Observation (sessions.jsonl entry)
// ============================================================================

/**
 * A sessions.jsonl entry produced by passive monitoring scans.
 *
 * Distinguished from hook-produced entries by `type: "scan"` and
 * `source: "scan"`. The `scan_type` discriminant determines which
 * detail payload is attached.
 */
export interface ScanObservation {
  /** Entry type — always "scan" for monitoring-produced entries. */
  type: 'scan';
  /** ISO 8601 UTC timestamp of when the scan ran. */
  timestamp: string;
  /** Provenance — always "scan" (vs "hook" for post-commit entries). */
  source: 'scan';
  /** Current phase number, or null if not determinable. */
  phase: number | null;
  /** Which monitor produced this observation. */
  scan_type: 'plan_summary_diff' | 'state_transition' | 'roadmap_diff';
  /** Monitor-specific detail payload. */
  details: PlanSummaryDiff | StateTransition | RoadmapDiff;
}

// ============================================================================
// MON-01: Plan-vs-Summary Diff
// ============================================================================

/**
 * Structural diff between a PLAN.md and its corresponding SUMMARY.md.
 *
 * Captures scope changes by comparing what was planned (files, artifacts,
 * truths) against what was actually built (files, accomplishments,
 * deviations).
 */
export interface PlanSummaryDiff {
  /** Phase number from the plan. */
  phase: number;
  /** Plan number within the phase. */
  plan: number;
  /** Files listed in PLAN.md frontmatter files_modified. */
  planned_files: string[];
  /** Files actually created/modified per SUMMARY.md. */
  actual_files: string[];
  /** Must-have artifact paths from PLAN.md frontmatter. */
  planned_artifacts: string[];
  /** Accomplishment bullet points from SUMMARY.md. */
  actual_accomplishments: string[];
  /** Items in SUMMARY not predicted by PLAN (emergent work). */
  emergent_work: string[];
  /** Items in PLAN not found in SUMMARY (dropped requirements). */
  dropped_items: string[];
  /** Explicit deviations noted in SUMMARY.md. */
  deviations: string[];
  /** Overall scope change classification. */
  scope_change: 'expanded' | 'contracted' | 'shifted' | 'on_track';
}

// ============================================================================
// MON-02: STATE.md Transition
// ============================================================================

/**
 * A detected field-level transition in STATE.md.
 *
 * Produced by comparing a cached snapshot of STATE.md key-value pairs
 * against the current file contents.
 */
export interface StateTransition {
  /** Which STATE.md field changed (e.g., "phase", "status", "blocker"). */
  field: string;
  /** Previous value of the field, or null if newly added. */
  previous_value: string | null;
  /** Current value of the field. */
  current_value: string;
  /** Classification of the transition. */
  transition_type:
    | 'phase_complete'
    | 'phase_started'
    | 'blocker_added'
    | 'blocker_resolved'
    | 'status_change';
}

// ============================================================================
// MON-05: ROADMAP.md Structural Diff
// ============================================================================

/**
 * Structural diff of ROADMAP.md phase entries.
 *
 * Detects phases added, removed, reordered, and status transitions
 * by comparing cached roadmap structure against current contents.
 */
export interface RoadmapDiff {
  /** Phases added since last scan. */
  phases_added: Array<{ number: number; name: string }>;
  /** Phases removed since last scan. */
  phases_removed: Array<{ number: number; name: string }>;
  /** Whether phase ordering changed. */
  phases_reordered: boolean;
  /** Phase status transitions. */
  status_changes: Array<{ phase: number; from: string; to: string }>;
}

// ============================================================================
// Internal: Parsed PLAN.md
// ============================================================================

/**
 * Parsed representation of a PLAN.md file's key fields.
 *
 * Extracted from YAML frontmatter by `parsePlanContent()`.
 */
export interface ParsedPlan {
  /** Phase identifier string (e.g., "86-wrapper-commands"). */
  phase: string;
  /** Plan number within the phase. */
  plan: number;
  /** Files listed in frontmatter files_modified array. */
  files_modified: string[];
  /** Artifact paths from must_haves.artifacts[].path. */
  must_have_artifacts: string[];
  /** Truth strings from must_haves.truths[]. */
  must_have_truths: string[];
}

// ============================================================================
// Internal: Parsed SUMMARY.md
// ============================================================================

/**
 * Parsed representation of a SUMMARY.md file's key sections.
 *
 * Extracted by `parseSummaryContent()` from markdown headings and
 * bullet lists.
 */
export interface ParsedSummary {
  /** Phase identifier string. */
  phase: string;
  /** Plan number within the phase. */
  plan: number;
  /** Files listed under created entries. */
  files_created: string[];
  /** Files listed under modified entries. */
  files_modified: string[];
  /** Accomplishment bullet points. */
  accomplishments: string[];
  /** Deviation descriptions (empty if "None"). */
  deviations: string[];
}

// ============================================================================
// Scan State (persisted for transition detection)
// ============================================================================

/**
 * Persisted state from the last monitoring scan.
 *
 * Used by MON-02 (state transitions) and MON-05 (roadmap diffs) to
 * detect changes since the previous scan.
 */
export interface ScanState {
  /** ISO 8601 timestamp of the last completed scan. */
  last_scan_timestamp: string;
  /** Key-value snapshot of STATE.md fields at last scan. */
  state_md_snapshot: Record<string, string>;
  /** Phase entries from ROADMAP.md at last scan. */
  roadmap_phases: Array<{ number: number; name: string; status: string }>;
}
