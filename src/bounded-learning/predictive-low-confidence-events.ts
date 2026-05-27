/**
 * Bounded-learning calibration loop — predictive low-confidence events source (v1.49.837).
 *
 * Closes the v835 unwired-stub gap: `predictive.low_confidence_threshold` now
 * has a real observation source backed by append-only JSONL at
 * `.planning/patterns/predictive-low-confidence-events.jsonl`.
 *
 * ## Why this exists
 *
 * v835 registered `predictive.low_confidence_threshold` as the 7th member of
 * the `CalibratableThreshold` union, with `wired: false` and
 * `loadObservationsForThreshold` returning empty. The framework knew about
 * the threshold but no observation source flowed.
 *
 * v837 wires the source. The polarity of the signal differs from v803's
 * token-budget events:
 *
 * - For `token_budget.warn_at_percent`, +1 means "lower the threshold so the
 *   warn fires earlier" — the operator was responsive so the warn was useful.
 * - For `predictive.low_confidence_threshold`, +1 means "lower the threshold
 *   so the fallback fires LESS often" — the fallback fired but was not useful
 *   (`not_useful` event). -1 favors raising the threshold (fire MORE often)
 *   because the operator found the fallback useful (`useful` event).
 *
 * The condition that triggers the fallback is `maxScore < lowConfidenceThreshold`,
 * so a HIGHER threshold means the fallback fires on more scores, and a LOWER
 * threshold means it only fires on truly low scores. The calibration polarity
 * is the inverse of token-budget's because the threshold semantics are inverted.
 *
 * ## Event flow
 *
 * The CLI subcommand `bounded-learning --record-event
 * --threshold predictive.low_confidence_threshold --kind useful|not_useful`
 * appends one JSON line per event. The substrate consumers
 * (`src/chipset/copper/activation.ts` and `src/orchestration/selector.ts`)
 * may also auto-emit events from inside the fallback dispatch when a
 * `fallbackProvider` is wired; that auto-emit landed alongside this module
 * so the JSONL grows automatically when any caller exercises the fallback
 * path (including the integration tests at
 * `tests/integration/copper-rosetta-fallback-wire.integration.test.ts`).
 *
 * Production callers of `ActivationSelector` and copper `Activation` are
 * currently absent — the wire is structurally complete but exercised only
 * by tests at v837 ship time. A future ship that constructs production
 * instances of either class with a wired `fallbackProvider` will start
 * accumulating real observations in the JSONL.
 *
 * ## Failure contract (Lesson #10427, ESTABLISHED v802)
 *
 * `appendPredictiveLowConfidenceEvent`: best-effort silent. Forensic surface.
 * Disk-full / permission-denied does NOT propagate to the CLI exit code; the
 * calibration loop's correctness does not depend on whether this event was
 * actually persisted. Mirrors v803's `appendTokenBudgetEvent` contract.
 *
 * `readPredictiveLowConfidenceEvents`: tolerant of malformed lines (skipped
 * silently); missing file returns empty array. Mirrors v803.
 *
 * @module bounded-learning/predictive-low-confidence-events
 */

import { existsSync } from 'node:fs';
import { appendFile, readFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import type { CalibrationObservation } from './types.js';

/**
 * Default path for the predictive-low-confidence events JSONL. Tests
 * override via `path` option.
 */
export const DEFAULT_PREDICTIVE_LOW_CONFIDENCE_EVENTS_PATH = join(
  process.cwd(),
  '.planning',
  'patterns',
  'predictive-low-confidence-events.jsonl',
);

/**
 * Operator outcome after a low-confidence fallback dispatch.
 *
 * - `useful` — the fallback returned cross-domain suggestions the operator
 *   found relevant (or, in auto-emit mode, simply returned a non-null
 *   `ConceptSuggestion[]`). Favors RAISING the threshold so the fallback
 *   fires more often. Value: `-1` (favors increase).
 * - `not_useful` — the fallback returned `null` (no analogies found) OR the
 *   operator marked the suggestions as noise. Favors LOWERING the threshold
 *   so the fallback fires less often. Value: `+1` (favors decrease).
 */
export type PredictiveLowConfidenceEventKind = 'useful' | 'not_useful';

/**
 * One recorded predictive-low-confidence event.
 */
export interface PredictiveLowConfidenceEvent {
  /** ISO 8601 timestamp when the event was recorded. */
  timestamp: string;
  /** Operator outcome (or auto-emit classification) after the fallback dispatch. */
  kind: PredictiveLowConfidenceEventKind;
  /** Skill that triggered the low-confidence dispatch (best-effort). */
  currentSkill?: string;
  /** Max prediction score that triggered the fallback (best-effort). */
  maxScore?: number;
  /** `lowConfidenceThreshold` value in effect at the time (best-effort). */
  thresholdValue?: number;
  /** Free-form operator note (e.g. "matched analogy was off-topic"). */
  reason?: string;
}

/**
 * Map a `PredictiveLowConfidenceEventKind` to the observation value in [-1, 1].
 *
 * - `useful`     → `-1` (favors RAISING the threshold so the fallback fires
 *                  more often — operator found the suggestions useful).
 * - `not_useful` → `+1` (favors LOWERING the threshold so the fallback fires
 *                  less often — operator found the suggestions noisy or
 *                  no analogies were returned).
 *
 * Polarity is inverted relative to `token-budget-events.ts::eventKindToValue`
 * because the threshold semantics are inverted (raising
 * `low_confidence_threshold` makes the fallback fire MORE often, whereas
 * raising `warn_at_percent` makes the warn fire LESS often).
 */
export function eventKindToValue(kind: PredictiveLowConfidenceEventKind): number {
  switch (kind) {
    case 'useful': return -1;
    case 'not_useful': return 1;
  }
}

/**
 * Lift a single event into a `CalibrationObservation`. Reuses the event
 * timestamp as the `suggestionId` (every event is its own unit; there is no
 * aggregated id). Same shape as v803's `token-budget-events.ts::eventToObservation`.
 *
 * The `decision` field maps onto the underlying `SuggestionDecision` shape
 * that `CalibrationObservation` expects: `useful` → `accepted-analog` (value
 * `-1`), `not_useful` → `dismissed-analog` (value `+1`). The calibration loop
 * reads only `value` and `decision`'s accepted/dismissed split, so the analog
 * is semantically honest at the loop boundary. **Note:** the value-to-decision
 * mapping is INVERTED relative to v803 because of the polarity flip.
 */
export function eventToObservation(event: PredictiveLowConfidenceEvent): CalibrationObservation {
  const value = eventKindToValue(event.kind);
  return {
    suggestionId: event.timestamp,
    // value -1 (useful) maps to "favor increase" → 'dismissed' in the underlying schema
    // value +1 (not_useful) maps to "favor decrease" → 'accepted' in the underlying schema
    // (the polarity is inverted relative to token-budget; the calibration
    // loop reads `value` directly, but the `decision` string preserves
    // schema-compat with the SuggestionDecision union.)
    decision: value > 0 ? 'accepted' : 'dismissed',
    value,
    observedAt: event.timestamp,
  };
}

/**
 * Lift an array of events into `CalibrationObservation`s.
 * Unlike `suggestions-mapper.ts::entriesToObservations`, this does NOT
 * filter — every recorded event is a terminal outcome (no `pending` /
 * `deferred` state for this source).
 */
export function eventsToObservations(
  events: PredictiveLowConfidenceEvent[],
): CalibrationObservation[] {
  return events.map(eventToObservation);
}

/**
 * Atomically append a single event to the JSONL file. Creates the parent
 * directory if missing.
 *
 * Best-effort silent — callers SHOULD wrap in try/catch and swallow errors
 * at the caller boundary (the contract per Lesson #10427). The function
 * itself does NOT swallow internally; that's the caller's policy decision
 * (test code may want to assert that a write succeeded). Mirrors v803.
 */
export async function appendPredictiveLowConfidenceEvent(
  event: PredictiveLowConfidenceEvent,
  options: { path?: string } = {},
): Promise<string> {
  const path = options.path ?? DEFAULT_PREDICTIVE_LOW_CONFIDENCE_EVENTS_PATH;
  await mkdir(dirname(path), { recursive: true });
  const line = JSON.stringify(event) + '\n';
  await appendFile(path, line, 'utf8');
  return path;
}

/**
 * Read the events log, returning entries in file order.
 * Tolerant of malformed lines (skipped silently); missing file returns
 * empty array.
 */
export async function readPredictiveLowConfidenceEvents(
  path: string,
): Promise<PredictiveLowConfidenceEvent[]> {
  if (!existsSync(path)) return [];
  const raw = await readFile(path, 'utf8');
  const lines = raw.split('\n').filter((l) => l.trim().length > 0);
  const events: PredictiveLowConfidenceEvent[] = [];
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line) as unknown;
      if (isPredictiveLowConfidenceEvent(parsed)) events.push(parsed);
    } catch {
      // Skip malformed lines silently.
    }
  }
  return events;
}

function isPredictiveLowConfidenceEvent(
  value: unknown,
): value is PredictiveLowConfidenceEvent {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.timestamp === 'string' &&
    typeof obj.kind === 'string' &&
    (obj.kind === 'useful' || obj.kind === 'not_useful')
  );
}
