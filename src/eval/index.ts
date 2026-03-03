/**
 * Barrel exports for the eval module.
 *
 * Re-exports all public types, schemas, constants, and classes from the
 * multi-model evaluation subsystem (Phase 51).
 *
 * Usage:
 * ```typescript
 * import { ModelBenchmarkRun, ThresholdsConfigLoader, DEFAULT_PASS_RATE_THRESHOLD } from './eval/index.js';
 * ```
 */

// Types and Zod schemas
export {
  // Schemas
  RunMetricsSchema,
  ModelBenchmarkRunSchema,
  ModelSummarySchema,
  MultiModelBenchmarkSchema,
  ThresholdsConfigSchema,
  // Types (inferred from schemas)
  type RunMetrics,
  type ModelBenchmarkRun,
  type ModelSummary,
  type MultiModelBenchmark,
  type ThresholdsConfig,
  // Constants
  DEFAULT_PASS_RATE_THRESHOLD,
} from './types.js';

// ThresholdsConfigLoader and its constants
export {
  ThresholdsConfigLoader,
  THRESHOLD_EQUALITY_TOLERANCE,
  // DEFAULT_PASS_RATE_THRESHOLD re-exported from thresholds-config.ts as well
  // (types.ts is canonical source; thresholds-config.ts re-exports it)
} from './thresholds-config.js';
