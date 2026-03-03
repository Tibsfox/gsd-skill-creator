/**
 * Multi-model evaluation type system -- Zod schemas and TypeScript types.
 *
 * Defines the foundational schemas for Phase 51 multi-model evaluation:
 * ModelBenchmarkRun, MultiModelBenchmark, ThresholdsConfig.
 *
 * EVAL-06: The `model` field in ModelBenchmarkRunSchema uses `.default('unknown')`
 * so legacy benchmark results without a model field parse correctly and are
 * attributed to 'unknown' model. This preserves backward compatibility.
 *
 * Follows the project pattern from src/chips/types.ts: Zod schema first,
 * then `z.infer<typeof Schema>` for the TypeScript type.
 * Pure type definitions -- no IO, no side effects.
 */

import { z } from 'zod';

// ============================================================================
// Constants (IMP-03: Threshold registry -- Wave 2 constants)
// ============================================================================

/**
 * Default pass rate threshold used when no chip-specific threshold is configured.
 * A skill benchmark must achieve at least 75% pass rate to be considered passing.
 *
 * IMP-03: Rationale -- 75% represents a conservative but meaningful quality bar.
 * Below 75% indicates the skill has significant correctness issues. Above 75%
 * with no chip override provides a safe baseline for new chip configurations.
 *
 * Defined here (types.ts) and re-exported from thresholds-config.ts for
 * backward compatibility with callers that import from either location.
 */
export const DEFAULT_PASS_RATE_THRESHOLD = 0.75;

// ============================================================================
// RunMetricsSchema
// ============================================================================

/**
 * Zod equivalent of the RunMetrics interface from src/types/test-run.ts.
 *
 * Provides runtime validation for metrics objects parsed from stored benchmark
 * results (JSON files, API responses). All fields are required numbers.
 */
export const RunMetricsSchema = z.object({
  /** Total number of tests executed */
  total: z.number(),
  /** Number of tests that passed */
  passed: z.number(),
  /** Number of tests that failed */
  failed: z.number(),
  /** Accuracy as percentage (0-100): passed / total */
  accuracy: z.number(),
  /** False positive rate as percentage (0-100): FP / (FP + TN) */
  falsePositiveRate: z.number(),
  /** True positives: positive tests that passed */
  truePositives: z.number(),
  /** True negatives: negative tests that passed */
  trueNegatives: z.number(),
  /** False positives: negative tests that failed */
  falsePositives: z.number(),
  /** False negatives: positive tests that failed */
  falseNegatives: z.number(),
  /** Number of edge-case tests (reported separately) */
  edgeCaseCount: z.number(),
  /** Precision: TP / (TP + FP) */
  precision: z.number(),
  /** Recall: TP / (TP + FN) */
  recall: z.number(),
  /** F1 Score: harmonic mean of precision and recall */
  f1Score: z.number(),
});

/** TypeScript type for run metrics */
export type RunMetrics = z.infer<typeof RunMetricsSchema>;

// ============================================================================
// ModelBenchmarkRunSchema
// ============================================================================

/**
 * Schema for a single benchmark run with model context.
 *
 * EVAL-06: The `model` field uses `.default('unknown')` so legacy runs that
 * predate the multi-model feature parse correctly. When no model is specified,
 * the run is attributed to 'unknown' and counted in MultiModelBenchmark.legacyRunCount.
 */
export const ModelBenchmarkRunSchema = z.object({
  /** Name of the skill being benchmarked */
  skillName: z.string(),
  /**
   * Name of the chip/model that produced this run.
   * EVAL-06: Optional -- defaults to 'unknown' for legacy results without a model field.
   */
  model: z.string().default('unknown'),
  /** ISO 8601 timestamp when this run started */
  runAt: z.string(),
  /** Duration of the run in milliseconds */
  duration: z.number().nonnegative(),
  /** Computed metrics for this run */
  metrics: RunMetricsSchema,
  /** Whether this run passed (pass rate >= threshold) */
  passed: z.boolean(),
  /** Improvement hints collected during the run */
  hints: z.array(z.string()),
});

/** TypeScript type for a single model benchmark run */
export type ModelBenchmarkRun = z.infer<typeof ModelBenchmarkRunSchema>;

// ============================================================================
// ModelSummarySchema
// ============================================================================

/**
 * Schema for per-model aggregate statistics across all runs.
 *
 * Aggregates pass rate, accuracy, and F1 by model for comparison dashboards
 * and threshold status reporting.
 */
export const ModelSummarySchema = z.object({
  /** Chip/model name this summary aggregates */
  model: z.string(),
  /** Number of benchmark runs included in this summary */
  runCount: z.number().int().nonnegative(),
  /** Pass rate: fraction of runs that passed (0-1) */
  passRate: z.number().min(0).max(1),
  /** Average accuracy across runs (0-100) */
  avgAccuracy: z.number().min(0).max(100),
  /** Average F1 score across runs (0-1) */
  avgF1: z.number().min(0).max(1),
  /** Whether this model's pass rate is above, below, or at the configured threshold */
  thresholdStatus: z.enum(['above', 'below', 'at']),
});

/** TypeScript type for per-model aggregate summary */
export type ModelSummary = z.infer<typeof ModelSummarySchema>;

// ============================================================================
// MultiModelBenchmarkSchema
// ============================================================================

/**
 * Schema for a complete multi-model benchmark result.
 *
 * Top-level container produced by running a skill benchmark across multiple
 * chip configurations. Contains both the per-model summaries and the raw runs.
 */
export const MultiModelBenchmarkSchema = z.object({
  /** Name of the skill this benchmark covers */
  skillName: z.string(),
  /** ISO 8601 timestamp when this benchmark was executed */
  benchmarkedAt: z.string(),
  /** Per-model aggregate summaries */
  models: z.array(ModelSummarySchema),
  /** Individual benchmark runs across all models */
  runs: z.array(ModelBenchmarkRunSchema),
  /**
   * Count of runs where model was defaulted to 'unknown' (EVAL-06 legacy runs).
   * Callers should compute this when building MultiModelBenchmark from raw runs:
   * `runs.filter(r => r.model === 'unknown').length`
   */
  legacyRunCount: z.number().int().nonnegative(),
});

/** TypeScript type for a complete multi-model benchmark */
export type MultiModelBenchmark = z.infer<typeof MultiModelBenchmarkSchema>;

// ============================================================================
// ThresholdsConfigSchema
// ============================================================================

/**
 * Schema for thresholds.json -- the per-chip pass rate configuration file.
 *
 * EVAL-04: thresholds.json defines per-chip pass rate thresholds with a
 * configurable default. The `chips` map allows per-chip overrides; any chip
 * not listed falls back to `defaultPassRate`.
 *
 * Example thresholds.json:
 * ```json
 * {
 *   "version": 1,
 *   "defaultPassRate": 0.75,
 *   "chips": {
 *     "ollama": { "passRate": 0.70 },
 *     "anthropic": { "passRate": 0.85 }
 *   }
 * }
 * ```
 */
export const ThresholdsConfigSchema = z.object({
  /**
   * Schema version -- must be 1.
   * Breaking changes to thresholds.json format increment this literal.
   */
  version: z.literal(1),
  /** Default pass rate threshold for chips not listed in `chips` (0-1) */
  defaultPassRate: z.number().min(0).max(1),
  /**
   * Per-chip pass rate overrides.
   * Key is the chip name (matches ChipConfig.name); value provides passRate override.
   */
  chips: z.record(z.string(), z.object({
    /** Pass rate threshold for this specific chip (0-1) */
    passRate: z.number().min(0).max(1),
  })),
});

/** TypeScript type for thresholds.json configuration */
export type ThresholdsConfig = z.infer<typeof ThresholdsConfigSchema>;
