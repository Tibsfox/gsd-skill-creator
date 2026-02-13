/**
 * Barrel index for the Pipeline coprocessor module.
 *
 * Re-exports all public types, schemas, classes, and functions from
 * the pipeline sub-modules: types, schema, parser, lifecycle-sync,
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
  PipelineInstruction,
  PipelineMetadata,
  Pipeline,
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
  PipelineInstructionSchema,
  PipelineMetadataSchema,
  PipelineSchema,
} from './schema.js';

// Parser
export {
  parsePipeline,
  serializePipeline,
} from './parser.js';

export type {
  PipelineParseResult,
  PipelineParseError,
} from './parser.js';

// Lifecycle Sync
export { LifecycleSync } from './lifecycle-sync.js';

export type { LifecycleEvent } from './lifecycle-sync.js';

// Executor
export { PipelineExecutor } from './executor.js';

export type {
  PipelineExecutorConfig,
  PipelineExecutionResult,
} from './executor.js';

// Activation Dispatch
export { PipelineActivationDispatch } from './activation.js';

export type {
  ActivationContext,
  ActivationResult,
} from './activation.js';

// Compiler
export { compilePipeline, savePipeline, loadPipelines } from './compiler.js';

export type {
  PlanMetadata,
  CompilerOptions,
} from './compiler.js';
