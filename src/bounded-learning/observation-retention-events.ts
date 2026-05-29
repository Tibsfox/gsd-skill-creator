/**
 * Bounded-learning calibration loop — observation retention events source (v1.49.884).
 *
 * Closes the read-side wire for `observation.retention_days`. The threshold
 * has been a registered `CalibratableThreshold` since v798's per-class
 * registry extraction, but `loadObservationsForThreshold` returned `[]`
 * because no observation source existed.
 *
 * v884 wires the read side. The substrate-consumer write side (an
 * observation-retention sweep that auto-emits events when it acts on the
 * threshold) is deferred — same staging pattern as v837 → v845/v846 for
 * `predictive.low_confidence_threshold`. The CLI manual recorder
 * (`bounded-learning --record-event --threshold observation.retention_days
 * --kind too_aggressive|too_lax`) ships alongside this module.
 *
 * ## Polarity
 *
 * - For `observation.retention_days`, `+1` means "lower the threshold so the
 *   sweep drops entries sooner" — the retention is TOO LAX (storage bloats
 *   or queries slow because too much old data is retained).
 * - `-1` means "raise the threshold so the sweep keeps entries longer" — the
 *   retention is TOO AGGRESSIVE (operator wanted dropped entries back).
 *
 * Same shape as token-budget polarity (raising threshold makes the sweep
 * fire LESS often, mirroring how raising `warn_at_percent` makes the warn
 * fire less often). Distinct from predictive's inverted shape.
 *
 * ## Failure contract (Lesson #10427, ESTABLISHED v802)
 *
 * `appendObservationRetentionEvent`: best-effort silent. Forensic surface.
 * Disk-full / permission-denied does NOT propagate to the CLI exit code;
 * the calibration loop's correctness does not depend on whether this event
 * was actually persisted. Mirrors v803's `appendTokenBudgetEvent` contract.
 *
 * `readObservationRetentionEvents`: tolerant of malformed lines (skipped
 * silently); missing file returns empty array.
 *
 * @module bounded-learning/observation-retention-events
 */

import { existsSync } from 'node:fs';
import { appendFile, readFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import type { CalibrationObservation } from './types.js';

/**
 * Default path for the observation-retention events JSONL. Tests override
 * via `path` option.
 */
export const DEFAULT_OBSERVATION_RETENTION_EVENTS_PATH = join(
  process.cwd(),
  '.planning',
  'patterns',
  'observation-retention-events.jsonl',
);

/**
 * Operator (or substrate auto-emit) classification of a retention-sweep
 * outcome.
 *
 * - `too_aggressive` — the sweep dropped entries the operator wanted to
 *   keep (or whose absence later surfaced as a gap). Favors RAISING
 *   `observation.retention_days` so future sweeps keep entries longer.
 *   Value: `-1`.
 * - `too_lax` — the sweep dropped too few entries; storage bloats or
 *   queries slow because old observations accumulate. Favors LOWERING
 *   `observation.retention_days` so future sweeps drop entries sooner.
 *   Value: `+1`.
 */
export type ObservationRetentionEventKind = 'too_aggressive' | 'too_lax';

/**
 * One recorded observation-retention event.
 */
export interface ObservationRetentionEvent {
  /** ISO 8601 timestamp when the event was recorded. */
  timestamp: string;
  /** Classification of the sweep outcome. */
  kind: ObservationRetentionEventKind;
  /** Number of entries the sweep dropped (best-effort). */
  droppedCount?: number;
  /** Number of entries the sweep retained (best-effort). */
  retainedCount?: number;
  /** `observation.retention_days` value in effect at the time (best-effort). */
  retentionDays?: number;
  /** Free-form operator note (e.g. "lost analytics from week-old pattern"). */
  reason?: string;
}

/**
 * Map an `ObservationRetentionEventKind` to the observation value in
 * `[-1, 1]`.
 *
 * - `too_aggressive` → `-1` (favors RAISING the threshold).
 * - `too_lax`        → `+1` (favors LOWERING the threshold).
 *
 * Same polarity shape as `token-budget-events.ts::eventKindToValue`: a
 * higher threshold reduces sweep frequency / event firing. Distinct from
 * predictive, which inverts polarity because raising the predictive
 * threshold INCREASES fallback firing.
 */
export function eventKindToValue(kind: ObservationRetentionEventKind): number {
  switch (kind) {
    case 'too_aggressive': return -1;
    case 'too_lax': return 1;
  }
}

/**
 * Lift a single event into a `CalibrationObservation`. Reuses the event
 * timestamp as the `suggestionId` (every event is its own unit; there is
 * no aggregated id). Same shape as v837's
 * `predictive-low-confidence-events.ts::eventToObservation`.
 *
 * The `decision` field maps onto the underlying `SuggestionDecision` shape
 * that `CalibrationObservation` expects: `too_aggressive` → `dismissed`
 * (value `-1`), `too_lax` → `accepted` (value `+1`). The calibration loop
 * reads only `value` and `decision`'s accepted/dismissed split, so the
 * analog is semantically honest at the loop boundary.
 */
export function eventToObservation(event: ObservationRetentionEvent): CalibrationObservation {
  const value = eventKindToValue(event.kind);
  return {
    suggestionId: event.timestamp,
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
  events: ObservationRetentionEvent[],
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
export async function appendObservationRetentionEvent(
  event: ObservationRetentionEvent,
  options: { path?: string } = {},
): Promise<string> {
  const path = options.path ?? DEFAULT_OBSERVATION_RETENTION_EVENTS_PATH;
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
export async function readObservationRetentionEvents(
  path: string,
): Promise<ObservationRetentionEvent[]> {
  if (!existsSync(path)) return [];
  const raw = await readFile(path, 'utf8');
  const lines = raw.split('\n').filter((l) => l.trim().length > 0);
  const events: ObservationRetentionEvent[] = [];
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line) as unknown;
      if (isObservationRetentionEvent(parsed)) events.push(parsed);
    } catch {
      // Skip malformed lines silently.
    }
  }
  return events;
}

function isObservationRetentionEvent(
  value: unknown,
): value is ObservationRetentionEvent {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.timestamp === 'string' &&
    typeof obj.kind === 'string' &&
    (obj.kind === 'too_aggressive' || obj.kind === 'too_lax')
  );
}
