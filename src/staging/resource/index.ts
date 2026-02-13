/**
 * Resource analysis submodule.
 *
 * Public API for the resource analysis pipeline. Provides vision
 * document analysis, skill matching, topology recommendation,
 * token budget estimation, work decomposition, and unified
 * manifest generation.
 *
 * @module staging/resource
 */

// Types (type-only exports)
export type {
  DomainRequirement,
  ComplexitySignal,
  AmbiguityMarker,
  ExternalDependency,
  VisionAnalysis,
  SkillMatch,
  SkillMatchStatus,
  TopologyRecommendation,
  TopologyType,
  TokenBudgetBreakdown,
  BudgetCategory,
  Subtask,
  ParallelDecomposition,
  ResourceManifest,
  ComplexityLevel,
} from './types.js';

// Constants
export {
  COMPLEXITY_LEVELS,
  TOPOLOGY_TYPES,
  BUDGET_CATEGORIES,
  SKILL_MATCH_STATUSES,
  EXTERNAL_DEP_TYPES,
} from './types.js';

// Vision document analyzer
export { analyzeVision } from './analyzer.js';

// Skill cross-reference matcher
export type { SkillMatcherDeps } from './skill-matcher.js';
export { matchSkills } from './skill-matcher.js';

// Topology recommender
export { recommendTopology } from './topology.js';

// Token budget estimator
export type { BudgetEstimateOptions } from './budget.js';
export { estimateBudget } from './budget.js';

// Work decomposer
export { decomposeWork } from './decomposer.js';

// Resource manifest generator
export type { ManifestDeps } from './manifest.js';
export { generateResourceManifest } from './manifest.js';
