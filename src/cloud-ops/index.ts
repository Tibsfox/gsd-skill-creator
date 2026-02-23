/**
 * Top-level barrel exports for the entire cloud-ops module.
 *
 * Re-exports all public functions and types from dashboard, staging,
 * observation, git, and knowledge submodules for single-import access.
 *
 * @module cloud-ops
 */

// Dashboard
export * from './dashboard/index.js';

// Staging
export * from './staging/index.js';

// Observation
export * from './observation/index.js';

// Git
export {
  formatDeploymentCommit,
  parseDeploymentCommit,
  isDeploymentCommit,
} from './git/commit-rationale.js';
export type {
  DeploymentCommitInfo,
  ParsedDeploymentCommit,
  DeploymentChangeType,
} from './git/types.js';

// Knowledge
export {
  KnowledgeTierLoader,
  loadSummaryTier,
  loadActiveTier,
  loadReferenceTier,
} from './knowledge/tier-loader.js';
export type {
  KnowledgeTier,
  TierConfig,
  TierContent,
  TierLoadResult,
} from './knowledge/types.js';
export { TIER_DEFAULTS } from './knowledge/types.js';
