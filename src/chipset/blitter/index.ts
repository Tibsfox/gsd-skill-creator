/**
 * Blitter module barrel exports.
 *
 * Re-exports the complete public API for the blitter engine:
 * types/schemas, promoter, executor, and signal system.
 */

// Types and schemas
export {
  BlitterOperationSchema,
  PromotionDeclarationSchema,
  PromotionConditionsSchema,
  BlitterResultSchema,
  CompletionSignalSchema,
} from './types.js';
export type {
  BlitterOperation,
  PromotionDeclaration,
  BlitterResult,
  CompletionSignal,
  BlitterStatus,
} from './types.js';

// Promoter
export { detectPromotable, extractBlitterOps } from './promoter.js';

// Executor
export { executeBlitterOp, BlitterExecutor } from './executor.js';

// Signals
export { createCompletionSignal, BlitterSignalBus } from './signals.js';
