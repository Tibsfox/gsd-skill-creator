/**
 * Barrel index for the Copper coprocessor module.
 *
 * Re-exports all public types, schemas, classes, and functions from
 * the copper sub-modules: types, schema, parser, lifecycle-sync,
 * executor, activation, and compiler.
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

// Activation Dispatch
export { CopperActivationDispatch } from './activation.js';

export type {
  ActivationContext,
  ActivationResult,
} from './activation.js';

// Compiler
export { compileCopperList, saveCopperList, loadCopperLists } from './compiler.js';

export type {
  PlanMetadata,
  CompilerOptions,
} from './compiler.js';
