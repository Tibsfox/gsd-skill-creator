/**
 * Dashboard data collectors barrel export.
 *
 * Provides a clean public API for all three collectors (git, session,
 * planning) and their shared type definitions.
 *
 * @module dashboard/collectors
 */

// Functions
export { collectGitMetrics } from './git-collector.js';
export { collectSessionMetrics } from './session-collector.js';
export { collectPlanningMetrics } from './planning-collector.js';

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
