/**
 * Bounded-learning calibration loop — suggestions-to-observation mapper.
 *
 * Maps the `state` field on a `.planning/patterns/suggestions.json` entry
 * to a value in [-1, 1] suitable for feeding into an e-process. The mapping
 * intentionally treats `'pending'` and `'deferred'` as the same neutral
 * signal (operator has not produced an acceptance signal yet); only
 * terminal accept/dismiss decisions carry directional weight.
 *
 * @module bounded-learning/suggestions-mapper
 */

import type { CalibrationObservation, SuggestionDecision } from './types.js';

/**
 * Minimal shape needed from a suggestion entry. The real
 * `.planning/patterns/suggestions.json` format may carry additional fields;
 * the mapper only reads what it needs and ignores the rest.
 */
export interface SuggestionEntry {
  id?: string;
  candidate?: { id?: string };
  state?: string;
  decidedAt?: string;
  updatedAt?: string;
  lastSeen?: string;
}

/**
 * Normalize an arbitrary `state` string to a typed `SuggestionDecision`.
 * Unknown states (or absent fields) default to `'pending'` — the most
 * conservative neutral signal.
 */
export function normalizeDecision(raw: unknown): SuggestionDecision {
  if (typeof raw !== 'string') return 'pending';
  const lower = raw.toLowerCase();
  if (lower === 'accepted' || lower === 'accept') return 'accepted';
  if (lower === 'dismissed' || lower === 'dismiss' || lower === 'rejected') return 'dismissed';
  if (lower === 'deferred' || lower === 'defer') return 'deferred';
  return 'pending';
}

/**
 * Map a `SuggestionDecision` to the observation value in [-1, 1].
 *
 * - `accepted`  → `+1` (favors decreasing the threshold so more patterns surface)
 * - `dismissed` → `-1` (favors increasing the threshold so fewer noisy patterns surface)
 * - `deferred`  → `0`  (neutral — operator hasn't decided yet)
 * - `pending`   → `0`  (neutral — operator hasn't seen it yet)
 */
export function decisionToValue(decision: SuggestionDecision): number {
  switch (decision) {
    case 'accepted': return 1;
    case 'dismissed': return -1;
    case 'deferred':
    case 'pending':
      return 0;
  }
}

/**
 * Lift a single suggestion entry into a `CalibrationObservation`. Always
 * succeeds — unknown / malformed entries produce a neutral observation
 * with a `'pending'` decision.
 */
export function entryToObservation(entry: SuggestionEntry): CalibrationObservation {
  const decision = normalizeDecision(entry.state);
  return {
    suggestionId: entry.id ?? entry.candidate?.id ?? 'unknown',
    decision,
    value: decisionToValue(decision),
    observedAt: entry.decidedAt ?? entry.updatedAt ?? entry.lastSeen ?? null,
  };
}

/**
 * Lift an array of suggestion entries into `CalibrationObservation`s,
 * filtering out neutral observations (deferred + pending) — only terminal
 * accept/dismiss decisions feed the e-process. This is a conservative
 * default: neutral observations do not move the e-value but also do not
 * contribute to the observation count, so the e-process sees only
 * acceptance signals.
 *
 * Callers that want to include neutral observations (e.g. for telemetry
 * or audit) should call `entryToObservation` directly.
 */
export function entriesToObservations(
  entries: SuggestionEntry[],
): CalibrationObservation[] {
  return entries
    .map(entryToObservation)
    .filter((obs) => obs.decision === 'accepted' || obs.decision === 'dismissed');
}
