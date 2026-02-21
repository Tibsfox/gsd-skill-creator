/**
 * Knowledge Pack browser panel — barrel exports.
 *
 * Re-exports all knowledge panel classes, types, and constants
 * from a single entry point. Follows the desktop/src/dashboard/index.ts
 * pattern with categorized sections.
 *
 * @module knowledge
 */

// Types
export type {
  ProgressState,
  PackProgress,
  PackCardView,
  TierGroup,
  SearchScope,
  SearchResult,
  DetailTab,
  PackDetailView,
  PackModuleView,
  PackActivityView,
  SkillTreeNode,
  SkillTreeEdge,
  SkillTreeData,
  ActivitySuggestion,
} from "./types";

export { TIER_LABELS, TIER_ORDER } from "./types";

// Progress tracking
export { ProgressTracker } from "./progress-tracker";
export type { ProgressTrackerOptions } from "./progress-tracker";

// Search
export { PackSearch } from "./pack-search";
export type { PackSearchOptions } from "./pack-search";

// Browser panel
export { KnowledgePanel } from "./knowledge-panel";
export type { KnowledgePanelOptions } from "./knowledge-panel";

// Detail view
export { PackDetail } from "./pack-detail";
export type { PackDetailOptions } from "./pack-detail";

// Skill tree visualization
export { SkillTree } from "./skill-tree";
export type { SkillTreeOptions } from "./skill-tree";

// Activity suggestions
export { ActivitySuggester } from "./activity-suggestions";
export type { ActivitySuggesterOptions, SuggestParams } from "./activity-suggestions";
