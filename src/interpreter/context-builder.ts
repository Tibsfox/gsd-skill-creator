/**
 * DACP execution context builder.
 *
 * Transforms a LoadedBundle into a structured ExecutionContext with typed
 * data, script references (review-only), and intent summary.
 *
 * @module interpreter/context-builder
 */

import type { LoadedBundle, ExecutionContext } from './types.js';

/**
 * Build a structured execution context from a loaded bundle.
 *
 * @param bundle - The loaded bundle to transform
 * @returns Frozen ExecutionContext with typed data and review-only script references
 */
export function buildExecutionContext(_bundle: LoadedBundle): ExecutionContext {
  // Stub -- will be implemented in GREEN phase
  throw new Error('Not implemented');
}
