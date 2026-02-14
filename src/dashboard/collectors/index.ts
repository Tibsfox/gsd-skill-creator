/**
 * Dashboard data collectors barrel export.
 *
 * Provides a clean public API for all collectors (git, session,
 * planning, pipeline, determinism, lineage) and their shared type definitions.
 *
 * @module dashboard/collectors
 */

// Functions
export { collectGitMetrics } from './git-collector.js';
export { collectSessionMetrics } from './session-collector.js';
export { collectPlanningMetrics } from './planning-collector.js';

// Pipeline collectors
export { PipelineStatusCollector } from './pipeline-status.js';
export { DeterminismViewCollector } from './determinism-view.js';
export { LineageViewCollector } from './lineage-view.js';

// Types
export type {
  GitCommitMetric,
  GitCollectorResult,
  GitCollectorOptions,
  SessionMetric,
  SessionCollectorResult,
  SessionCollectorOptions,
  PlanningCollectorResult,
  PlanningCollectorOptions,
  CollectorOptions,
} from './types.js';

// Re-export dashboard types for convenience
export type {
  PipelineStageStatus,
  PipelineStatusView,
  DeterminismRow,
  DeterminismViewData,
  DeterminismSortField,
  SortDirection,
  DashboardArtifactType,
  LineageNode,
  LineageGraphEntry,
  LineageViewData,
} from '../../types/dashboard.js';
