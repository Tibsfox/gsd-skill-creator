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
