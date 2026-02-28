/**
 * Calibration module for collecting and storing calibration events.
 *
 * Calibration events record skill activation decisions and user outcomes
 * to enable threshold calibration and accuracy benchmarking.
 */

// Types
export type {
  CalibrationOutcome,
  SkillScore,
  CalibrationEvent,
  CalibrationEventInput,
} from './calibration-types.js';

export {
  CalibrationOutcomeSchema,
  SkillScoreSchema,
  CalibrationEventSchema,
  CalibrationEventInputSchema,
} from './calibration-types.js';

// Store
export { CalibrationStore } from './calibration-store.js';

// Optimizer
export type {
  ThresholdCandidate,
  OptimizationResult,
} from './threshold-optimizer.js';
export { ThresholdOptimizer } from './threshold-optimizer.js';

// History
export type { ThresholdSnapshot } from './threshold-history.js';
export { ThresholdHistory } from './threshold-history.js';

// MCC Calculator
export { calculateMCC, mccToPercentage } from './mcc-calculator.js';

// Benchmark Reporter
export type { BenchmarkReport, SkillMetrics } from './benchmark-reporter.js';
export { BenchmarkReporter } from './benchmark-reporter.js';
