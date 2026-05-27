/**
 * Bounded-learning calibration loop — token-budget events source (v1.49.803).
 *
 * Closes the v798 unwired-stub gap: `token_budget.warn_at_percent` now has
 * a real observation source backed by append-only JSONL at
 * `.planning/patterns/token-budget-events.jsonl`.
 *
 * ## Why this exists
 *
 * v798 introduced `token_budget.warn_at_percent` as the first non-suggestions
 * threshold. The observation-source registry was extracted (per Lesson #10426
 * — extract per-class registry at the second class instance) but the
 * `token_budget.*` source itself was a stub returning `[]` because no real
 * signal was captured anywhere in the codebase.
 *
 * v803 wires the source: operator response to skill-load token-budget warn
 * events is recorded as `responsive` or `ignored` events; these map to
 * calibration observations the same way operator accept/dismiss decisions on
 * surfaced suggestions do (`suggestions-mapper.ts`).
 *
 * ## Event flow
 *
 * The CLI subcommand `bounded-learning --record-event --kind responsive|ignored`
 * (added by this ship) appends one JSON line per event. The /sc:status and
 * /sc:start skill prompts invoke the subcommand whenever they emit a
 * warning line, recording the operator's outcome on the NEXT invocation
 * (i.e. did the usagePercent drop below warn_at_percent? → responsive; or
 * did it stay at/above? → ignored).
 *
 * ## Failure contract (Lesson #10427, newly ESTABLISHED at v802)
 *
 * `appendTokenBudgetEvent`: best-effort silent. Forensic surface. Disk-full /
 * permission-denied does NOT propagate to the CLI exit code; the calibration
 * loop's correctness does not depend on whether this event was actually
 * persisted.
 *
 * `readTokenBudgetEvents`: tolerant of malformed lines (skipped silently);
 * missing file returns empty array.
 *
 * @module bounded-learning/token-budget-events
 */

import { existsSync } from 'node:fs';
import { appendFile, readFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import type { CalibrationObservation } from './types.js';

/**
 * Default path for the token-budget events JSONL. Tests override via
 * `path` option.
 */
export const DEFAULT_TOKEN_BUDGET_EVENTS_PATH = join(
  process.cwd(),
  '.planning',
  'patterns',
  'token-budget-events.jsonl',
);

/**
 * Operator outcome after a skill-load token-budget warn event fires.
 *
 * - `responsive` — operator reduced load (pruned skills, accepted suggestions
 *   to drop a skill, etc.) such that the next usagePercent reading was below
 *   `warn_at_percent`. Positive evidence: the warn was useful, the threshold
 *   is appropriately calibrated (or could be lowered to warn earlier).
 * - `ignored` — operator continued past the warning without reducing load;
 *   the next usagePercent reading was still ≥ `warn_at_percent`. Negative
 *   evidence: the warn was noise, the threshold should be raised so warnings
 *   are less frequent.
 */
export type TokenBudgetEventKind = 'responsive' | 'ignored';

/**
 * One recorded token-budget event.
 */
export interface TokenBudgetEvent {
  /** ISO 8601 timestamp when the operator's outcome was determined. */
  timestamp: string;
  /** Operator outcome after the warn event. */
  kind: TokenBudgetEventKind;
  /** The usagePercent reading that triggered the original warn (best-effort). */
  usagePercent?: number;
  /** The warn_at_percent threshold value at the time of the warn (best-effort). */
  warnAtPercent?: number;
  /** Free-form operator note (e.g. "pruned grove-orchestration"). */
  reason?: string;
}

/**
 * Map a `TokenBudgetEventKind` to the observation value in [-1, 1].
 *
 * - `responsive` → `+1` (favors decreasing the threshold so warnings fire
 *   earlier — operator is responsive, the warn is useful).
 * - `ignored`    → `-1` (favors increasing the threshold so warnings fire
 *   less often — operator is desensitized to the warn).
 *
 * Same shape as `suggestions-mapper.ts::decisionToValue`. Both map a
 * terminal operator outcome to a directional signal in [-1, 1].
 */
export function eventKindToValue(kind: TokenBudgetEventKind): number {
  switch (kind) {
    case 'responsive': return 1;
    case 'ignored': return -1;
  }
}

/**
 * Lift a single token-budget event into a `CalibrationObservation`. The
 * observation's `suggestionId` field reuses the timestamp as a stable
 * identifier (every event is its own unit; there is no aggregated id).
 */
export function eventToObservation(event: TokenBudgetEvent): CalibrationObservation {
  // Map event kind onto the SuggestionDecision shape that
  // CalibrationObservation expects. responsive=accepted-analog (+1),
  // ignored=dismissed-analog (-1). The calibration loop only reads `value`
  // and `decision`'s accepted/dismissed split, so the analog is semantically
  // honest at the loop boundary.
  return {
    suggestionId: event.timestamp,
    decision: event.kind === 'responsive' ? 'accepted' : 'dismissed',
    value: eventKindToValue(event.kind),
    observedAt: event.timestamp,
  };
}

/**
 * Lift an array of token-budget events into `CalibrationObservation`s.
 * Unlike `suggestions-mapper.ts::entriesToObservations`, this does NOT
 * filter — every recorded event is a terminal outcome (no `pending` /
 * `deferred` state for this source).
 */
export function eventsToObservations(events: TokenBudgetEvent[]): CalibrationObservation[] {
  return events.map(eventToObservation);
}

/**
 * Atomically append a single token-budget event to the JSONL file. Creates
 * the parent directory if missing.
 *
 * Best-effort silent — callers SHOULD wrap in try/catch and swallow errors
 * at the caller boundary (the contract per Lesson #10427). The function
 * itself does NOT swallow internally; that's the caller's policy decision
 * (test code may want to assert that a write succeeded).
 */
export async function appendTokenBudgetEvent(
  event: TokenBudgetEvent,
  options: { path?: string } = {},
): Promise<string> {
  const path = options.path ?? DEFAULT_TOKEN_BUDGET_EVENTS_PATH;
  await mkdir(dirname(path), { recursive: true });
  const line = JSON.stringify(event) + '\n';
  await appendFile(path, line, 'utf8');
  return path;
}

/**
 * Read the token-budget events log, returning entries in file order.
 * Tolerant of malformed lines (skipped silently); missing file returns
 * empty array.
 */
export async function readTokenBudgetEvents(path: string): Promise<TokenBudgetEvent[]> {
  if (!existsSync(path)) return [];
  const raw = await readFile(path, 'utf8');
  const lines = raw.split('\n').filter((l) => l.trim().length > 0);
  const events: TokenBudgetEvent[] = [];
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line) as unknown;
      if (isTokenBudgetEvent(parsed)) events.push(parsed);
    } catch {
      // Skip malformed lines silently.
    }
  }
  return events;
}

function isTokenBudgetEvent(value: unknown): value is TokenBudgetEvent {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.timestamp === 'string' &&
    typeof obj.kind === 'string' &&
    (obj.kind === 'responsive' || obj.kind === 'ignored')
  );
}
