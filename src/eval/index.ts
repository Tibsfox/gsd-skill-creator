/**
 * Barrel exports for the eval module.
 *
 * Re-exports all public types, schemas, constants, and classes from the
 * multi-model evaluation subsystem (Phase 51).
 *
 * Usage:
 * ```typescript
 * import { ModelBenchmarkRun, ThresholdsConfigLoader, DEFAULT_PASS_RATE_THRESHOLD } from './eval/index.js';
 * import { MultiModelBenchmarkRunner, ModelAwareGrader } from './eval/index.js';
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

// MultiModelBenchmarkRunner and its constants (Plan 51-02)
export {
  MultiModelBenchmarkRunner,
  BENCHMARK_PASS_ACCURACY_THRESHOLD,
} from './multi-model-benchmark.js';

// ModelAwareGrader, ModelCapabilityProfile interface, and its constants (Plan 51-02)
export {
  ModelAwareGrader,
  LOCAL_SMALL_CONTEXT_THRESHOLD,
  CLOUD_CONTEXT_THRESHOLD,
  type ModelCapabilityProfile,
} from './model-aware-grader.js';

// EvalViewer and its constants (Plan 51-03)
export {
  EvalViewer,
  VIEWER_PASS_RATE_GREEN_THRESHOLD,
  VIEWER_PASS_RATE_YELLOW_THRESHOLD,
} from './eval-viewer.js';

// Grading context schemas and calibrated hints (Phase 58)
export {
  CalibrationAdjustmentSchema,
  ModelContextSchema,
  GradingContextSchema,
  CalibratedHintSchema,
} from './model-aware-grader.js';

export type {
  CalibrationAdjustment,
  ModelContext,
  GradingContext,
  CalibratedHint,
} from './model-aware-grader.js';

// Capability classifier (Phase 58, Plan 01)
export { CapabilityClassifier, CapabilityClassSchema } from './capability-classifier.js';
export type { CapabilityClass } from './capability-classifier.js';

// Limitation registry (Phase 58, Plan 01)
export { LimitationRegistry } from './limitation-registry.js';
export type { LimitationMatchResult } from './limitation-registry.js';

// Calibration store (Phase 58, Plan 03)
export { CalibrationStore, CalibrationFileSchema } from './calibration-store.js';
export type { CalibrationFile } from './calibration-store.js';

// Convergence detector (Phase 59, Plan 01)
export { ConvergenceDetector, detectDivergence } from './convergence-detector.js';
export type { DivergenceResult } from './convergence-detector.js';

// Variant generator (Phase 59, Plan 01)
export { VariantGenerator } from './variant-generator.js';

// Optimization driver (Phase 59, Plan 02)
export { OptimizationDriver } from './optimization-driver.js';
export type {
  OptimizationOptions,
  OptimizationResult,
  IterationRecord,
  StopReason,
} from './optimization-driver.js';
