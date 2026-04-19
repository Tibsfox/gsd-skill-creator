/**
 * ME-3 Skill A/B Harness — barrel export.
 *
 * Exposes the public surface of the ab-harness module.
 * Internal implementation details (stats primitives, M4 wiring) are not
 * re-exported here to keep the public API surface minimal.
 *
 * Phase 671, Wave R8 (ME-3).
 *
 * @module ab-harness/index
 */

// Core types
export type { ABOutcome, ABVerdict, ABRunOutcome, RunABOptions } from './coordinator.js';
export type { ABDecision, SignificanceResult } from './stats.js';
export type { TractabilityClass } from '../tractability/selector-api.js';

// Settings
export { isABHarnessEnabled, disabledMessage, ENV_FLAG } from './settings.js';
export type { ABHarnessSettings } from './settings.js';

// Main coordinator
export { runAB } from './coordinator.js';

// Statistics
export { runSignificanceTest, mean, twoSidedBinomialP } from './stats.js';

// Sample size
export { requiredSampleSize, sampleSizeTable, ABSOLUTE_MIN_SAMPLES } from './sample-size.js';

// Read API
export {
  getExperimentStatus,
  listExperiments,
  writeExperimentState,
  AB_STATE_FILENAME,
} from './api.js';
export type { ABExperimentState, ExperimentStatusResult } from './api.js';

// CLI
export { abCommand } from './cli.js';
