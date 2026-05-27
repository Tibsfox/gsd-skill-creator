/**
 * Bounded-learning calibration loop — public API.
 *
 * The loop reads operator acceptance decisions on surfaced suggestions
 * (`.planning/patterns/suggestions.json` managed by `/sc:suggest`), feeds
 * them through an anytime-valid e-process (`src/anytime-valid/`), and
 * emits a `CalibrationRecommendation` proposing a single-step adjustment
 * to a configuration threshold when Ville's bound is crossed.
 *
 * Wired thresholds: `suggestions.min_occurrences` (v1.49.795),
 * `suggestions.cooldown_days` (v1.49.796),
 * `suggestions.auto_dismiss_after_days` (v1.49.797), and
 * `token_budget.warn_at_percent` (v1.49.798). v798 introduces the first
 * non-suggestions threshold class; see `observation-sources.ts` for the
 * per-class source registry.
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

export {
  loadObservationsForThreshold,
  observationSourceFor,
} from './observation-sources.js';
export type {
  ObservationLoaderOptions,
  ObservationSourceInfo,
} from './observation-sources.js';

export {
  DEFAULT_TOKEN_BUDGET_EVENTS_PATH,
  appendTokenBudgetEvent,
  eventKindToValue,
  eventToObservation,
  eventsToObservations,
  readTokenBudgetEvents,
} from './token-budget-events.js';
export type { TokenBudgetEvent, TokenBudgetEventKind } from './token-budget-events.js';

export {
  DEFAULT_AUDIT_LOG_PATH,
  appendAuditLogEntry,
  buildAuditLogEntry,
  readAuditLog,
} from './audit-log.js';
export type { AuditLogEntry } from './audit-log.js';

export { runWatchLoop } from './watch-loop.js';
export type { WatchLoopHandle, WatchLoopOptions } from './watch-loop.js';
