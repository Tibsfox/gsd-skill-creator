/**
 * Offload module barrel exports.
 *
 * Re-exports the complete public API for the offload engine:
 * types/schemas, promoter, executor, and signal system.
 */

// Types and schemas
export {
  OffloadOperationSchema,
  PromotionDeclarationSchema,
  PromotionConditionsSchema,
  OffloadResultSchema,
  CompletionSignalSchema,
} from './types.js';
export type {
  OffloadOperation,
  PromotionDeclaration,
  OffloadResult,
  CompletionSignal,
  OffloadStatus,
} from './types.js';

// Promoter
export { detectPromotable, extractOffloadOps } from './promoter.js';

// Executor
export { executeOffloadOp, OffloadExecutor } from './executor.js';

// Signals
export { createCompletionSignal, SignalBus } from './signals.js';
