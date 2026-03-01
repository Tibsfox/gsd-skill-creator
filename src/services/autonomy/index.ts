/**
 * Autonomy Foundation Module
 *
 * Shared types, schemas, and interfaces for the autonomous execution engine,
 * artifact verification gates, and context management system.
 *
 * All downstream modules (autonomy engine, gates, context management)
 * import their shared types from this single entry point.
 *
 * @module autonomy
 */

// Schemas (Zod runtime validators)
export {
  ExecutionStatusSchema,
  SubversionPhaseSchema,
  GateTypeSchema,
  GateCheckSchema,
  GateDefinitionSchema,
  GateResultSchema,
  TeachForwardEntrySchema,
  ContextBudgetSchema,
  SubversionRecordSchema,
  StateTransitionSchema,
  ExecutionStateSchema,
} from './types.js';

// Inferred TypeScript types
export type {
  ExecutionStatus,
  SubversionPhase,
  GateType,
  GateCheck,
  GateDefinition,
  GateResult,
  TeachForwardEntry,
  ContextBudget,
  SubversionRecord,
  StateTransition,
  ExecutionState,
} from './types.js';

// Gate configuration schema and type
export { GateConfigSchema } from './schema-validation.js';
export type { GateConfig } from './schema-validation.js';

// Validation utilities
export { validateExecutionState, validateGateConfig } from './schema-validation.js';
export type { ValidationResult } from './schema-validation.js';

// Gate config loader
export { loadGateConfig, validateGateConfigFile } from './gate-loader.js';
export type { GateLoadResult } from './gate-loader.js';

// Gate enforcement
export { enforceGates, checkArtifact } from './gate-enforcer.js';
export type { GateEnforcementResult } from './gate-enforcer.js';

// Simulated work detection
export { detectSimulatedWork } from './simulated-work-detector.js';
export type { SimulatedWorkResult, SimulatedWorkCheck } from './simulated-work-detector.js';

// Gate templates
export { loadGateTemplate, GATE_TEMPLATE_NAMES } from './gate-templates.js';
export type { GateTemplateName } from './gate-templates.js';

// State machine (Phase 498-01)
export {
  VALID_TRANSITIONS,
  isValidTransition,
  createExecutionState,
  transition,
} from './state-machine.js';

// Persistence (Phase 498-01)
export {
  writeExecutionState,
  readExecutionState,
} from './persistence.js';

// Scheduler (Phase 498-02)
export { createScheduler } from './scheduler.js';
export type {
  SubversionCallbacks,
  PhaseResult,
  SchedulerOptions,
} from './scheduler.js';

// Resume (Phase 498-03)
export { resumeExecution, canResume, computeResumePoint } from './resume.js';
export type { ResumeResult } from './resume.js';

// Gates (Phase 498-04)
export {
  GateEvaluator,
  isCheckpointSubversion,
  isHalfTransition,
  isGraduation,
} from './gates.js';
export type { GateEvaluatorOptions } from './gates.js';
