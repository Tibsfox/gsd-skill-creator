/**
 * Queue management submodule.
 *
 * Public API for the staging queue pipeline. Provides queue state
 * management, audit logging, dependency detection, optimization
 * analysis, and the unified queue manager facade.
 *
 * @module staging/queue
 */

// Types (type-only exports)
export type { QueueState, QueueEntry, QueueAuditEntry } from './types.js';

// Constants
export { QUEUE_STATES, VALID_QUEUE_TRANSITIONS } from './types.js';

// State machine
export { transitionQueueItem } from './state-machine.js';

// Audit logger
export type { AuditLoggerDeps } from './audit-logger.js';
export { appendAuditEntry, readAuditLog } from './audit-logger.js';

// Dependency detector
export type { DependencyEdge, DependencyGraph } from './dependency-detector.js';
export { detectDependencies } from './dependency-detector.js';

// Optimization analyzer
export type { OptimizationSuggestion, OptimizationType } from './optimization-analyzer.js';
export { OPTIMIZATION_TYPES, analyzeOptimizations } from './optimization-analyzer.js';

// Queue manager facade
export type { QueueManagerDeps } from './manager.js';
export { createQueueManager } from './manager.js';

// Pre-wiring engine
export type {
  PreWiringOptions,
  PreWiringResult,
  PreWiredSkill,
  PreWiredTopology,
  PreWiredAgent,
} from './pre-wiring.js';
export { generatePreWiring } from './pre-wiring.js';

// Retroactive audit recommender
export type {
  PatternTrigger,
  RetroactiveAuditOptions,
  RetroactiveAuditRecommendation,
} from './retroactive-audit.js';
export { ELIGIBLE_STATES, SEVERITY_ORDER, recommendRetroactiveAudit } from './retroactive-audit.js';
