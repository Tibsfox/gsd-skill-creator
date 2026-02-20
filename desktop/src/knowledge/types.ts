/**
 * Knowledge Pack Browser panel types for GSD-OS desktop.
 *
 * Desktop-specific view types that mirror src/knowledge/types.ts data shapes
 * but are optimized for UI rendering. Follows the same pattern as
 * desktop/src/aminet/aminet-panel.ts: no src/ imports, flat display-ready shapes.
 *
 * @module knowledge/types
 */

// ============================================================================
// Progress State
// ============================================================================

/** Progress state for a single pack */
export type ProgressState = "not-started" | "in-progress" | "completed";

/** Per-pack progress data */
export interface PackProgress {
  packId: string;
  state: ProgressState;
  startedAt: string | null; // ISO date
  completedAt: string | null; // ISO date
  favorited: boolean;
}

// ============================================================================
// Pack Card View (browser listing)
// ============================================================================

/** Simplified pack card for browser listing (no src/knowledge imports) */
export interface PackCardView {
  packId: string;
  packName: string;
  description: string;
  classification: string; // "core_academic" | "applied" | "specialized"
  moduleCount: number;
  prerequisiteCount: number;
  gradeRange: string; // e.g., "PreK - College+"
  tags: string[];
  learningOutcomes: string[];
  moduleNames: string[]; // flattened from pack.modules[].name for search
  progress: ProgressState;
  prerequisitesMet: boolean;
  icon: string; // from gsd_integration.dashboard_display.icon
  color: string; // from gsd_integration.dashboard_display.color
}

// ============================================================================
// Tier Grouping
// ============================================================================

/** Tier grouping for the browser panel */
export interface TierGroup {
  tier: string; // "core_academic" | "applied" | "specialized"
  label: string; // Human-readable label
  packs: PackCardView[];
  expanded: boolean;
}

/** Search scope options */
export type SearchScope = "all" | "tier";

/** Search result with score */
export interface SearchResult {
  pack: PackCardView;
  score: number;
  matchedFields: string[];
}

// ============================================================================
// Detail View
// ============================================================================

/** Tab names for the detail view */
export type DetailTab = "vision" | "modules" | "activities" | "assessment" | "resources";

/** Detail view data for a single pack */
export interface PackDetailView {
  packId: string;
  packName: string;
  description: string;
  classification: string;
  version: string;
  status: string;
  gradeRange: string;
  icon: string;
  color: string;
  progress: ProgressState;
  // Tab content
  visionSummary: string;
  modules: PackModuleView[];
  activities: PackActivityView[];
  assessmentSummary: string;
  resourcesSummary: string;
  // Graph data for prerequisite mini-graph
  prerequisites: string[]; // pack IDs
  dependents: string[]; // pack IDs that this enables
  tags: string[];
}

/** Module summary for detail view */
export interface PackModuleView {
  id: string;
  name: string;
  description: string;
  topicCount: number;
  activityCount: number;
}

/** Activity summary for detail view */
export interface PackActivityView {
  id: string;
  name: string;
  moduleId: string;
  durationMinutes: number;
  gradeRange: string;
  description: string;
}

// ============================================================================
// Skill Tree
// ============================================================================

/** Skill tree node for visualization */
export interface SkillTreeNode {
  packId: string;
  packName: string;
  classification: string;
  progress: ProgressState;
  icon: string;
  color: string;
  ring: "center" | "inner" | "outer"; // radial position
}

/** Skill tree edge for visualization */
export interface SkillTreeEdge {
  from: string;
  to: string;
  type: "prerequisite" | "enables";
}

/** Complete skill tree graph data */
export interface SkillTreeData {
  centerPack: string;
  nodes: SkillTreeNode[];
  edges: SkillTreeEdge[];
}

// ============================================================================
// Activity Suggestion
// ============================================================================

/** Activity suggestion for a learner */
export interface ActivitySuggestion {
  packId: string;
  packName: string;
  activityId: string;
  activityName: string;
  reason: string; // Why this is suggested
  durationMinutes: number;
}

// ============================================================================
// Constants
// ============================================================================

/** Tier label mapping */
export const TIER_LABELS: Record<string, string> = {
  core_academic: "Core Academic",
  applied: "Applied & Practical",
  specialized: "Specialized & Deepening",
};

/** Ordered tier keys for display */
export const TIER_ORDER: readonly string[] = [
  "core_academic",
  "applied",
  "specialized",
] as const;
