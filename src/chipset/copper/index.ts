/**
 * Copper List module -- YAML-based workflow instruction programs.
 *
 * Copper Lists define sequences of WAIT/MOVE/SKIP instructions that
 * synchronize skill activation to GSD lifecycle events. This module
 * provides types, schemas, and parsing for the Copper List format.
 */

// Types
export type {
  GsdLifecycleEvent,
  ActivationMode,
  MoveTargetType,
  SkipOperator,
  WaitInstruction,
  MoveInstruction,
  SkipInstruction,
  SkipCondition,
  CopperInstruction,
  CopperMetadata,
  CopperList,
} from './types.js';

export {
  GSD_LIFECYCLE_EVENTS,
  ACTIVATION_MODES,
  MOVE_TARGET_TYPES,
  SKIP_OPERATORS,
} from './types.js';

// Schemas
export {
  WaitInstructionSchema,
  MoveInstructionSchema,
  SkipInstructionSchema,
  CopperInstructionSchema,
  CopperMetadataSchema,
  CopperListSchema,
} from './schema.js';

// Parser
export {
  parseCopperList,
  serializeCopperList,
} from './parser.js';

export type {
  CopperParseResult,
  CopperParseError,
} from './parser.js';

// Lifecycle Sync
export { LifecycleSync } from './lifecycle-sync.js';

export type { LifecycleEvent } from './lifecycle-sync.js';

// Executor
export { CopperExecutor } from './executor.js';

export type {
  CopperExecutorConfig,
  CopperExecutionResult,
} from './executor.js';
