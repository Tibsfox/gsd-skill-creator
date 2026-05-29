/**
 * Bounded-learning calibration loop — token-budget MAX events source (v1.49.888).
 *
 * Closes the read-side wire for `token_budget.max_percent`. The threshold
 * has been a registered `CalibratableThreshold` since v798 (alongside
 * `warn_at_percent`), but `loadObservationsForThreshold` returned `[]`
 * because no observation source existed.
 *
 * v888 wires the read side. The substrate-consumer write side (an
 * actual skill-loader that auto-emits events when it acts on the hard
 * ceiling) is deferred — same staging pattern as v837 → v845/v846
 * (`predictive.low_confidence_threshold`) and v884 → v891
 * (`observation.retention_days`). The CLI manual recorder
 * (`bounded-learning --record-event --threshold token_budget.max_percent
 * --kind under_budget|blocked`) ships alongside this module.
 *
 * ## Why a separate file from token-budget-events.ts
 *
 * `warn_at_percent` and `max_percent` are sibling thresholds in the
 * `token_budget.*` class but capture distinct operator outcomes:
 *
 *   - `warn_at_percent` fires the soft WARN; the event semantics are
 *     "did the operator respond?" → `responsive` / `ignored`.
 *   - `max_percent` enforces the hard CEILING; the event semantics are
 *     "did the operator stay under, or get blocked?" →
 *     `under_budget` / `blocked`.
 *
 * The two signals are not interchangeable: an `ignored` warn does NOT
 * imply a `blocked` ceiling-hit (the operator may stay between warn and
 * max indefinitely), and `responsive` to a warn is distinct from
 * `under_budget` (the latter means the operator never hit warn either).
 * Separate JSONLs keep the polarities + decision boundaries cleanly
 * partitioned. Mirrors the v884 split between observation-retention and
 * future observation.* thresholds.
 *
 * ## Polarity (mirrors #10451 convention for raise-reduces-fire-frequency)
 *
 * For `token_budget.max_percent`, raising the ceiling REDUCES block-fire
 * frequency (fewer skill-load attempts get blocked). Per #10451 convention,
 * `+1` favors LOWERING the threshold (tighter ceiling).
 *
 * - `under_budget` → `+1` — operator stayed under the ceiling with
 *   headroom. Positive evidence the ceiling could be lowered (didn't need
 *   that much). Mirrors warn-events `responsive` polarity.
 * - `blocked` → `-1` — operator's skill-load was blocked at the ceiling;
 *   they wanted more. Negative evidence the ceiling is too restrictive.
 *   Mirrors warn-events `ignored` polarity.
 *
 * ## Failure contract (Lesson #10427, ESTABLISHED v802)
 *
 * `appendTokenBudgetMaxEvent`: best-effort silent. Forensic surface.
 * Disk-full / permission-denied does NOT propagate to the CLI exit code;
 * the calibration loop's correctness does not depend on whether this event
 * was actually persisted. Mirrors v803/v837/v884.
 *
 * `readTokenBudgetMaxEvents`: tolerant of malformed lines (skipped
 * silently); missing file returns empty array.
 *
 * @module bounded-learning/token-budget-max-events
 */

import { existsSync } from 'node:fs';
import { appendFile, readFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import type { CalibrationObservation } from './types.js';

/**
 * Default path for the token-budget MAX events JSONL. Tests override
 * via `path` option.
 */
export const DEFAULT_TOKEN_BUDGET_MAX_EVENTS_PATH = join(
  process.cwd(),
  '.planning',
  'patterns',
  'token-budget-max-events.jsonl',
);

/**
 * Operator outcome relative to the hard token-budget ceiling.
 *
 * - `under_budget` — operator's skill-load completed without hitting
 *   `max_percent`. Headroom remained. Suggests the ceiling could be
 *   lowered (tighter constraint, less risk of runaway cost). Polarity
 *   `+1` favors LOWER threshold.
 * - `blocked` — operator's skill-load was blocked at the ceiling; the
 *   operator wanted to load more than `max_percent` allowed. Suggests
 *   the ceiling should be raised so legitimate operations aren't
 *   blocked. Polarity `-1` favors RAISING threshold.
 */
export type TokenBudgetMaxEventKind = 'under_budget' | 'blocked';

/**
 * One recorded token-budget MAX event.
 */
export interface TokenBudgetMaxEvent {
  /** ISO 8601 timestamp when the event was recorded. */
  timestamp: string;
  /** Classification of the ceiling-hit outcome. */
  kind: TokenBudgetMaxEventKind;
  /** The usagePercent reading at the time (best-effort). */
  usagePercent?: number;
  /** The max_percent threshold value at the time (best-effort). */
  maxPercent?: number;
  /** Free-form operator note (e.g. "blocked while loading sc-dev-team"). */
  reason?: string;
}

/**
 * Map a `TokenBudgetMaxEventKind` to the observation value in `[-1, 1]`.
 *
 * - `under_budget` → `+1` (favors LOWER threshold).
 * - `blocked`      → `-1` (favors RAISING threshold).
 *
 * Same polarity shape as `token-budget-events.ts` (warn variant) and
 * `observation-retention-events.ts`: a higher threshold reduces fire
 * frequency. Distinct from predictive, which inverts polarity because
 * raising the predictive threshold INCREASES fallback firing.
 */
export function eventKindToValue(kind: TokenBudgetMaxEventKind): number {
  switch (kind) {
    case 'under_budget': return 1;
    case 'blocked': return -1;
  }
}

/**
 * Lift a single MAX event into a `CalibrationObservation`. Reuses the
 * event timestamp as the `suggestionId` (every event is its own unit;
 * there is no aggregated id). Same shape as warn-events
 * `eventToObservation`.
 *
 * The `decision` field maps onto the underlying `SuggestionDecision`
 * shape that `CalibrationObservation` expects: `under_budget` →
 * `accepted` (`+1`), `blocked` → `dismissed` (`-1`). The calibration
 * loop reads only `value` and `decision`'s accepted/dismissed split,
 * so the analog is semantically honest at the loop boundary.
 */
export function eventToObservation(event: TokenBudgetMaxEvent): CalibrationObservation {
  const value = eventKindToValue(event.kind);
  return {
    suggestionId: event.timestamp,
    decision: value > 0 ? 'accepted' : 'dismissed',
    value,
    observedAt: event.timestamp,
  };
}

/**
 * Lift an array of MAX events into `CalibrationObservation`s.
 * Unlike `suggestions-mapper.ts::entriesToObservations`, this does NOT
 * filter — every recorded event is a terminal outcome (no `pending` /
 * `deferred` state for this source).
 */
export function eventsToObservations(
  events: TokenBudgetMaxEvent[],
): CalibrationObservation[] {
  return events.map(eventToObservation);
}

/**
 * Atomically append a single MAX event to the JSONL file. Creates the
 * parent directory if missing.
 *
 * Best-effort silent — callers SHOULD wrap in try/catch and swallow
 * errors at the caller boundary (the contract per Lesson #10427). The
 * function itself does NOT swallow internally; that's the caller's
 * policy decision (test code may want to assert that a write succeeded).
 * Mirrors v803/v837/v884.
 */
export async function appendTokenBudgetMaxEvent(
  event: TokenBudgetMaxEvent,
  options: { path?: string } = {},
): Promise<string> {
  const path = options.path ?? DEFAULT_TOKEN_BUDGET_MAX_EVENTS_PATH;
  await mkdir(dirname(path), { recursive: true });
  const line = JSON.stringify(event) + '\n';
  await appendFile(path, line, 'utf8');
  return path;
}

/**
 * Read the MAX events log, returning entries in file order.
 * Tolerant of malformed lines (skipped silently); missing file returns
 * empty array.
 */
export async function readTokenBudgetMaxEvents(
  path: string,
): Promise<TokenBudgetMaxEvent[]> {
  if (!existsSync(path)) return [];
  const raw = await readFile(path, 'utf8');
  const lines = raw.split('\n').filter((l) => l.trim().length > 0);
  const events: TokenBudgetMaxEvent[] = [];
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line) as unknown;
      if (isTokenBudgetMaxEvent(parsed)) events.push(parsed);
    } catch {
      // Skip malformed lines silently.
    }
  }
  return events;
}

function isTokenBudgetMaxEvent(
  value: unknown,
): value is TokenBudgetMaxEvent {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.timestamp === 'string' &&
    typeof obj.kind === 'string' &&
    (obj.kind === 'under_budget' || obj.kind === 'blocked')
  );
}
