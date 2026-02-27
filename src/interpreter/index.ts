/**
 * DACP Interpreter public API.
 *
 * Re-exports the complete interpreter pipeline:
 * - validateBundle: Check bundle integrity
 * - loadBundle: Parse bundle into typed structure
 * - buildExecutionContext: Transform loaded bundle into execution context
 * - validateProvenance: Deep provenance chain-of-custody validation
 *
 * @module interpreter
 */

export { validateBundle } from './validator.js';
export { loadBundle } from './loader.js';
export { buildExecutionContext } from './context-builder.js';
export { validateProvenance } from './provenance-guard.js';
export type { ProvenanceResult } from './provenance-guard.js';
export type {
  LoadedBundle,
  BundleScript,
  ExecutionContext,
  InterpreterConfig,
} from './types.js';
export { DEFAULT_INTERPRETER_CONFIG } from './types.js';
