/**
 * Bounded-learning calibration loop — refinement-gate events source (v1.49.1054).
 *
 * Brings the live-learning `RefinementEngine` tuning knobs
 * (`refinement.min_confidence`, `refinement.min_corrections`,
 * `refinement.cooldown_days`) under the same anytime-valid two-gate
 * e-process that already self-tunes `suggestions.*`, `token_budget.*`, and
 * `observation.retention_days`.
 *
 * ## Why this exists
 *
 * `RefinementEngine` (src/learning/refinement-engine.ts) gates every skill
 * refinement behind three thresholds from `BoundedLearningConfig`:
 *   - `minConfidence`               — the confidence floor a suggestion must clear.
 *   - `minCorrectionsForRefinement` — how many corrections must accrue first.
 *   - `cooldownDays`                — how long to wait between refinements.
 *
 * Those thresholds were static. The operator's terminal decision on a
 * surfaced refinement / quarantine candidate is the natural miscalibration
 * signal: an ACCEPT means the gates were appropriately permissive (the
 * candidate was worth surfacing — the bar could be held or lowered), a
 * DISMISS means the gates let noise through (the bar should rise). All three
 * refinement knobs share this one signal, exactly as the three `suggestions.*`
 * thresholds share `suggestions.json`.
 *
 * ## Event flow
 *
 * The two operator chokepoints that produce refinement-gate outcomes both
 * append one JSONL line here:
 *   - `/sc:suggest` accept/dismiss on a RefinementEngine-surfaced suggestion.
 *   - `feedback quarantine accept/dismiss` on a correction-quarantine candidate
 *     (the same fail-closed human-attribution gate).
 *
 * ## Polarity
 *
 * - `accepted` → `+1` (accept-skew ⇒ e-process recommends DECREASE: the gate
 *   was appropriately permissive, it could loosen to surface candidates sooner).
 * - `dismissed` → `-1` (dismiss-skew ⇒ e-process recommends INCREASE: the gate
 *   let noise through, it should tighten).
 *
 * Same shape as `token-budget-events.ts` and `suggestions-mapper.ts`: a
 * terminal operator outcome mapped to a directional signal in [-1, 1].
 *
 * ## Failure contract (Lesson #10427)
 *
 * `appendRefinementEvent`: forensic surface; callers wrap in try/catch and
 * swallow at the boundary (the calibration loop's correctness does not depend
 * on whether the event was persisted). `readRefinementEvents`: tolerant of
 * malformed lines (skipped silently); missing file returns an empty array.
 *
 * @module bounded-learning/refinement-events
 */

import { existsSync } from 'node:fs';
import { appendFile, readFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import type { CalibrationObservation } from './types.js';

/**
 * Default path for the refinement-gate events JSONL. Tests override via the
 * `path` option.
 */
export const DEFAULT_REFINEMENT_EVENTS_PATH = join(
  process.cwd(),
  '.planning',
  'patterns',
  'refinement-events.jsonl',
);

/**
 * Operator outcome on a surfaced refinement / quarantine candidate.
 *
 * - `accepted` — operator accepted the refinement suggestion (or the
 *   quarantined correction). Positive evidence: the refinement gates were
 *   appropriately permissive.
 * - `dismissed` — operator dismissed it as noise. Negative evidence: the gates
 *   should tighten.
 */
export type RefinementEventKind = 'accepted' | 'dismissed';

/**
 * The chokepoint that produced a refinement event. Informational only — both
 * sources map to the same directional value by `kind`.
 */
export type RefinementEventSource = 'suggest' | 'quarantine';

/**
 * One recorded refinement-gate event.
 */
export interface RefinementEvent {
  /** ISO 8601 timestamp of the operator's decision. */
  timestamp: string;
  /** Operator outcome on the surfaced candidate. */
  kind: RefinementEventKind;
  /** Which chokepoint produced the decision (best-effort). */
  source?: RefinementEventSource;
  /** The skill the candidate targeted (best-effort). */
  skillName?: string;
  /** Free-form operator note. */
  reason?: string;
}

/**
 * Map a `RefinementEventKind` to the observation value in [-1, 1].
 *
 * - `accepted`  → `+1` (favors DECREASE — the gate could loosen).
 * - `dismissed` → `-1` (favors INCREASE — the gate should tighten).
 *
 * Same polarity as `suggestions-mapper.ts::decisionToValue` and
 * `token-budget-events.ts::eventKindToValue` (accept/responsive = +1).
 */
export function eventKindToValue(kind: RefinementEventKind): number {
  switch (kind) {
    case 'accepted': return 1;
    case 'dismissed': return -1;
  }
}

/**
 * Lift a single refinement event into a `CalibrationObservation`. The
 * observation's `suggestionId` reuses the timestamp as a stable identifier.
 */
export function eventToObservation(event: RefinementEvent): CalibrationObservation {
  return {
    suggestionId: event.timestamp,
    decision: event.kind === 'accepted' ? 'accepted' : 'dismissed',
    value: eventKindToValue(event.kind),
    observedAt: event.timestamp,
  };
}

/**
 * Lift an array of refinement events into `CalibrationObservation`s. Does NOT
 * filter — every recorded event is a terminal accept/dismiss outcome (no
 * `pending` / `deferred` state for this source).
 */
export function eventsToObservations(events: RefinementEvent[]): CalibrationObservation[] {
  return events.map(eventToObservation);
}

/**
 * Atomically append a single refinement event to the JSONL file. Creates the
 * parent directory if missing.
 *
 * Best-effort silent — callers SHOULD wrap in try/catch at the caller boundary
 * (the contract per Lesson #10427). The function itself does NOT swallow
 * internally so test code may assert a write succeeded.
 */
export async function appendRefinementEvent(
  event: RefinementEvent,
  options: { path?: string } = {},
): Promise<string> {
  const path = options.path ?? DEFAULT_REFINEMENT_EVENTS_PATH;
  await mkdir(dirname(path), { recursive: true });
  const line = JSON.stringify(event) + '\n';
  await appendFile(path, line, 'utf8');
  return path;
}

/**
 * Read the refinement events log, returning entries in file order. Tolerant of
 * malformed lines (skipped silently); missing file returns an empty array.
 */
export async function readRefinementEvents(path: string): Promise<RefinementEvent[]> {
  if (!existsSync(path)) return [];
  const raw = await readFile(path, 'utf8');
  const lines = raw.split('\n').filter((l) => l.trim().length > 0);
  const events: RefinementEvent[] = [];
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line) as unknown;
      if (isRefinementEvent(parsed)) events.push(parsed);
    } catch {
      // Skip malformed lines silently.
    }
  }
  return events;
}

function isRefinementEvent(value: unknown): value is RefinementEvent {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.timestamp === 'string' &&
    typeof obj.kind === 'string' &&
    (obj.kind === 'accepted' || obj.kind === 'dismissed')
  );
}
