/**
 * Bounded-learning calibration loop — public API.
 *
 * The loop reads operator acceptance decisions on surfaced suggestions
 * (`.planning/patterns/suggestions.json` managed by `/sc:suggest`), feeds
 * them through an anytime-valid e-process (`src/anytime-valid/`), and
 * emits a `CalibrationRecommendation` proposing a single-step adjustment
 * to a configuration threshold when Ville's bound is crossed.
 *
 * Wired thresholds: `suggestions.min_occurrences` (v1.49.795) and
 * `suggestions.cooldown_days` (v1.49.796). Future ships extend to the
 * remaining members of `CalibratableThreshold`.
 *
 * @module bounded-learning
 */

export type {
  AdjustmentDirection,
  CalibratableThreshold,
  CalibrationLoopConfig,
  CalibrationObservation,
  CalibrationRecommendation,
  SuggestionDecision,
} from './types.js';

export { runCalibrationLoop } from './calibration-loop.js';

export {
  decisionToValue,
  entriesToObservations,
  entryToObservation,
  normalizeDecision,
} from './suggestions-mapper.js';
export type { SuggestionEntry } from './suggestions-mapper.js';

export {
  DEFAULT_CONFIG_PATH,
  applyRecommendation,
  readThresholdValue,
  setThresholdValue,
} from './threshold-writer.js';
export type { ApplyOutcome } from './threshold-writer.js';
