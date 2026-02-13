/**
 * Barrel exports for the Pipeline Learning subsystem.
 *
 * Re-exports all public types and classes from the learning compiler,
 * feedback engine, and library modules. This is the single entry point
 * for consumers of the learning subsystem.
 */

// Types
export type {
  ObservationInput,
  WorkflowPattern,
  CompilationResult,
  CompilerConfig,
  FeedbackRecord,
  LibraryEntry,
} from './types.js';
export { DEFAULT_COMPILER_CONFIG } from './types.js';

// Learning Compiler
export { LearningCompiler } from './compiler.js';

// Feedback Engine
export { FeedbackEngine, DEFAULT_FEEDBACK_CONFIG } from './feedback.js';
export type { FeedbackEngineConfig, RefinementResult } from './feedback.js';

// Library
export { PipelineLibrary, DEFAULT_LIBRARY_CONFIG } from './library.js';
export type { LibraryConfig, MatchResult } from './library.js';
