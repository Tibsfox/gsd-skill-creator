/**
 * Staging pipeline module -- document intake and state management.
 *
 * Public API for the staging layer. Documents are submitted through
 * intake and progress through filesystem states.
 *
 * @module staging
 */

// Types
export type { StagingState, StagingMetadata } from './types.js';

// Constants
export { STAGING_STATES, STAGING_DIRS, ALL_STAGING_DIRS } from './types.js';

// Schema
export { StagingMetadataSchema } from './schema.js';

// Directory management
export { ensureStagingDirectory } from './directory.js';

// Document intake
export type { StageDocumentResult } from './intake.js';
export { stageDocument } from './intake.js';

// State machine
export type { MoveDocumentResult } from './state-machine.js';
export { moveDocument, VALID_TRANSITIONS } from './state-machine.js';

// Intake flow -- clarity assessment
export type { ClarityRoute, ClarityAssessment, GapDetail } from './intake-flow/index.js';
export { CLARITY_ROUTES } from './intake-flow/index.js';
export { assessClarity } from './intake-flow/index.js';

// Intake flow -- step tracking
export type { IntakeFlowStep, IntakeFlowState } from './intake-flow/index.js';
export { INTAKE_FLOW_STEPS } from './intake-flow/index.js';
export { recordStep, getResumePoint, readFlowState } from './intake-flow/index.js';

// Intake flow -- orchestrator
export type { IntakeFlowResult } from './intake-flow/index.js';
export { runIntakeFlow, confirmIntake, resumeIntakeFlow } from './intake-flow/index.js';

// Resource analysis -- types
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
} from './resource/index.js';

// Resource analysis -- constants
export {
  COMPLEXITY_LEVELS,
  TOPOLOGY_TYPES,
  BUDGET_CATEGORIES,
  SKILL_MATCH_STATUSES,
  EXTERNAL_DEP_TYPES,
} from './resource/index.js';

// Resource analysis -- functions
export {
  analyzeVision,
  matchSkills,
  recommendTopology,
  estimateBudget,
  decomposeWork,
  generateResourceManifest,
} from './resource/index.js';

// Resource analysis -- intake bridge
export type { ConfirmResourceResult } from './resource/intake-bridge.js';
export { confirmWithResources } from './resource/intake-bridge.js';

// Queue management -- types
export type { QueueState, QueueEntry, QueueAuditEntry } from './queue/index.js';
export type { DependencyEdge, DependencyGraph } from './queue/index.js';
export type { OptimizationSuggestion, OptimizationType } from './queue/index.js';
export type { QueueManagerDeps } from './queue/index.js';

// Queue management -- constants
export { QUEUE_STATES, VALID_QUEUE_TRANSITIONS } from './queue/index.js';
export { OPTIMIZATION_TYPES } from './queue/index.js';

// Queue management -- functions
export { transitionQueueItem } from './queue/index.js';
export { appendAuditEntry, readAuditLog } from './queue/index.js';
export { detectDependencies } from './queue/index.js';
export { analyzeOptimizations } from './queue/index.js';
export { createQueueManager } from './queue/index.js';

// Queue pre-wiring -- types
export type {
  PreWiringOptions,
  PreWiringResult,
  PreWiredSkill,
  PreWiredTopology,
  PreWiredAgent,
} from './queue/index.js';

// Queue pre-wiring -- functions
export { generatePreWiring } from './queue/index.js';

// Queue retroactive audit -- types
export type {
  RetroactiveAuditOptions,
  RetroactiveAuditRecommendation,
  PatternTrigger,
} from './queue/index.js';

// Queue retroactive audit -- constants and functions
export { ELIGIBLE_STATES, SEVERITY_ORDER, recommendRetroactiveAudit } from './queue/index.js';
