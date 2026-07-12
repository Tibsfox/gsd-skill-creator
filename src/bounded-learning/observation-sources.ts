/**
 * Bounded-learning calibration loop — per-threshold-class observation source registry.
 *
 * Different calibratable thresholds draw observations from different data
 * sources. This module dispatches `loadObservationsForThreshold` by
 * threshold class, returning the appropriate `CalibrationObservation[]`
 * for each.
 *
 * ## Why a registry (v1.49.798)
 *
 * v1.49.795-797 wired three thresholds in the `suggestions.*` class, all
 * reading from `.planning/patterns/suggestions.json`. v798 introduced the
 * first threshold in a NEW class (`token_budget.*`), forcing the question:
 * is `entriesToObservations(suggestionsPath)` the right signal source for
 * token-budget calibration? Answer: no — operator accept/dismiss decisions
 * on surfaced suggestions tell us nothing about whether the token-budget
 * warn threshold is appropriately set.
 *
 * The right signal for token-budget is operator response to a warn event
 * ("did the operator reduce skill load when warned, or ignore the warning?").
 * v798 wired the threshold with an EMPTY observation source for
 * `token_budget.*` and documented the gap; v803 closes it by adding
 * `token-budget-events.ts` (append-only JSONL log of operator responses
 * to skill-load token-budget warn events).
 *
 * The architectural decision — per-class observation source — was the
 * second-instance abstraction extraction. v795-797 had one class and one
 * source (no abstraction needed); v798 had two classes and two sources
 * (abstraction warranted). Per Lesson #10426 (ESTABLISHED at v802),
 * extract at the second instance, not earlier.
 *
 * @module bounded-learning/observation-sources
 */

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

import { entriesToObservations } from './suggestions-mapper.js';
import {
  DEFAULT_TOKEN_BUDGET_EVENTS_PATH,
  eventsToObservations as tokenBudgetEventsToObservations,
  readTokenBudgetEvents,
} from './token-budget-events.js';
import {
  DEFAULT_TOKEN_BUDGET_MAX_EVENTS_PATH,
  eventsToObservations as tokenBudgetMaxEventsToObservations,
  readTokenBudgetMaxEvents,
} from './token-budget-max-events.js';
import {
  DEFAULT_PREDICTIVE_LOW_CONFIDENCE_EVENTS_PATH,
  eventsToObservations as predictiveEventsToObservations,
  readPredictiveLowConfidenceEvents,
} from './predictive-low-confidence-events.js';
import {
  DEFAULT_OBSERVATION_RETENTION_EVENTS_PATH,
  eventsToObservations as observationRetentionEventsToObservations,
  readObservationRetentionEvents,
} from './observation-retention-events.js';
import {
  DEFAULT_REFINEMENT_EVENTS_PATH,
  eventsToObservations as refinementEventsToObservations,
  readRefinementEvents,
} from './refinement-events.js';
import type { CalibrationObservation, CalibratableThreshold } from './types.js';
import type { SuggestionEntry } from './suggestions-mapper.js';

/**
 * Options consumed by per-class loaders. Loaders ignore options that don't
 * apply to their class (e.g. token-budget loaders ignore `suggestionsPath`).
 */
export interface ObservationLoaderOptions {
  /** Path to suggestions.json (consumed by suggestions.* threshold class). */
  suggestionsPath?: string;
  /** Path to token-budget-events.jsonl (consumed by token_budget.warn_at_percent; v803). */
  tokenBudgetEventsPath?: string;
  /**
   * Path to token-budget-max-events.jsonl (consumed by
   * `token_budget.max_percent`; v888 read-side wire).
   */
  tokenBudgetMaxEventsPath?: string;
  /**
   * Path to predictive-low-confidence-events.jsonl (consumed by
   * predictive.* threshold class; v837).
   */
  predictiveLowConfidenceEventsPath?: string;
  /**
   * Path to observation-retention-events.jsonl (consumed by
   * `observation.retention_days`; v884 read-side wire).
   */
  observationRetentionEventsPath?: string;
  /**
   * Path to suggestions.json used as the evidence source for
   * `amiga.min_sequence_count` (consumed by amiga.* threshold class; v1027).
   * When absent the default `suggestionsPath` is used as a fallback, so
   * callers that already pass `suggestionsPath` do not need to duplicate it.
   */
  amigaSuggestionsPath?: string;
  /**
   * Path to refinement-events.jsonl (consumed by the `refinement.*` threshold
   * class — `min_confidence`, `min_corrections`, `cooldown_days`; v1054 wire).
   */
  refinementEventsPath?: string;
}

/**
 * Threshold-class metadata: the source identifier (for operator-facing
 * messages) plus a flag indicating whether observations are currently
 * captured.
 */
export interface ObservationSourceInfo {
  /** Short identifier of the observation source. */
  sourceId: string;
  /** Human-readable description of the source. */
  description: string;
  /** Whether this class has a wired observation source today. */
  wired: boolean;
}

/**
 * Return metadata about which observation source a threshold draws from.
 */
export function observationSourceFor(threshold: CalibratableThreshold): ObservationSourceInfo {
  if (threshold.startsWith('suggestions.')) {
    return {
      sourceId: 'suggestions.json',
      description: 'Operator accept/dismiss decisions on surfaced suggestions',
      wired: true,
    };
  }
  if (threshold === 'token_budget.warn_at_percent') {
    return {
      sourceId: 'token-budget-events',
      description: 'Operator response to skill-load token-budget warn events',
      wired: true,
    };
  }
  if (threshold === 'token_budget.max_percent') {
    return {
      sourceId: 'token-budget-max-events',
      description:
        'Operator outcome at the hard token-budget ceiling — under_budget ' +
        '/ blocked (v1.49.888 read-side wire — append-only JSONL at ' +
        '.planning/patterns/token-budget-max-events.jsonl). Substrate ' +
        'auto-emit deferred per #10439 staging (mirrors v837 → v845/v846 ' +
        'and v884 → v891).',
      wired: true,
    };
  }
  if (threshold.startsWith('token_budget.')) {
    return {
      sourceId: 'token-budget-events',
      description: 'Operator response to skill-load token-budget events (NOT YET CAPTURED for this threshold)',
      wired: false,
    };
  }
  if (threshold === 'observation.retention_days') {
    return {
      sourceId: 'observation-retention-events',
      description:
        'Operator (or substrate auto-emit) classification of retention-sweep ' +
        'outcomes (v1.49.884 read-side wire — append-only JSONL at ' +
        '.planning/patterns/observation-retention-events.jsonl). Substrate ' +
        'auto-emit deferred per #10439 staging (mirrors v837 → v845/v846).',
      wired: true,
    };
  }
  if (threshold.startsWith('observation.')) {
    return {
      sourceId: 'observation-retention-events',
      description: 'Observation-retention compaction / drop events (NOT YET CAPTURED for this threshold)',
      wired: false,
    };
  }
  if (threshold === 'predictive.low_confidence_threshold') {
    return {
      sourceId: 'predictive-low-confidence-events',
      description:
        'Operator response to predictive-skill-loader low-confidence ' +
        'fallback events (v1.49.837 wire — append-only JSONL at ' +
        '.planning/patterns/predictive-low-confidence-events.jsonl)',
      wired: true,
    };
  }
  if (threshold === 'amiga.min_sequence_count') {
    return {
      sourceId: 'suggestions.json (amiga.sequence_repetition)',
      description:
        'Operator accept/dismiss decisions on AMIGA sequence_repetition ' +
        'candidates in suggestions.json — accept = sequence bar was appropriately ' +
        'low (favor decrease), dismiss = sequences were noisy (favor increase). ' +
        'Wire: v1.49.1027.',
      wired: true,
    };
  }
  if (threshold.startsWith('refinement.')) {
    return {
      sourceId: 'refinement-events',
      description:
        'Operator accept/dismiss decisions on RefinementEngine-surfaced ' +
        'suggestions (/sc:suggest) and correction-quarantine candidates ' +
        '(feedback quarantine accept/dismiss) — accept = the refinement gate ' +
        'was appropriately permissive (favor decrease), dismiss = the gate let ' +
        'noise through (favor increase). All three refinement knobs ' +
        '(min_confidence, min_corrections, cooldown_days) share this source ' +
        '(v1.49.1054 wire — append-only JSONL at ' +
        '.planning/patterns/refinement-events.jsonl).',
      wired: true,
    };
  }
  // Defensive fallback for future threshold classes.
  return {
    sourceId: 'unknown',
    description: `No observation source registered for threshold class '${threshold}'`,
    wired: false,
  };
}

async function loadSuggestionsFromFile(path: string): Promise<SuggestionEntry[]> {
  if (!existsSync(path)) return [];
  const raw = await readFile(path, 'utf8');
  const trimmed = raw.trim();
  if (trimmed.length === 0) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed as SuggestionEntry[];
}

/**
 * Filter a raw suggestions.json array to only entries whose
 * `candidate.suggestedDescription` contains the given source tag.
 * Entries missing the field are excluded (conservative).
 */
function filterBySourceTag(entries: SuggestionEntry[], sourceTag: string): SuggestionEntry[] {
  return entries.filter((e) => {
    const candidate = (e as Record<string, unknown>).candidate;
    if (typeof candidate !== 'object' || candidate === null) return false;
    const desc = (candidate as Record<string, unknown>).suggestedDescription;
    return typeof desc === 'string' && desc.includes(sourceTag);
  });
}

/**
 * Dispatch to the per-class loader and return the resulting observations.
 *
 * Wired classes:
 *   - `suggestions.*`                — reads `suggestions.json`.
 *   - `token_budget.warn_at_percent` — reads `token-budget-events.jsonl` (v803).
 *   - `token_budget.max_percent`     — reads `token-budget-max-events.jsonl` (v888).
 *   - `predictive.low_confidence_threshold` — reads
 *     `predictive-low-confidence-events.jsonl` (v837).
 *   - `observation.retention_days`   — reads `observation-retention-events.jsonl` (v884).
 *   - `amiga.min_sequence_count`     — reads `suggestions.json`, filtered to
 *     entries tagged `[source: AMIGA sequence_repetition]` (v1027).
 *
 * Unwired classes (none remaining as of v1027) return an empty array —
 * the calibration loop then returns `direction: 'hold'` with
 * `observations: 0`, the honest outcome for "wire exists, source not yet
 * captured."
 */
export async function loadObservationsForThreshold(
  threshold: CalibratableThreshold,
  options: ObservationLoaderOptions = {},
): Promise<CalibrationObservation[]> {
  if (threshold.startsWith('suggestions.')) {
    if (options.suggestionsPath === undefined) return [];
    const entries = await loadSuggestionsFromFile(options.suggestionsPath);
    return entriesToObservations(entries);
  }
  if (threshold === 'token_budget.warn_at_percent') {
    const path = options.tokenBudgetEventsPath ?? DEFAULT_TOKEN_BUDGET_EVENTS_PATH;
    const events = await readTokenBudgetEvents(path);
    return tokenBudgetEventsToObservations(events);
  }
  if (threshold === 'token_budget.max_percent') {
    const path =
      options.tokenBudgetMaxEventsPath ?? DEFAULT_TOKEN_BUDGET_MAX_EVENTS_PATH;
    const events = await readTokenBudgetMaxEvents(path);
    return tokenBudgetMaxEventsToObservations(events);
  }
  if (threshold === 'predictive.low_confidence_threshold') {
    const path =
      options.predictiveLowConfidenceEventsPath
      ?? DEFAULT_PREDICTIVE_LOW_CONFIDENCE_EVENTS_PATH;
    const events = await readPredictiveLowConfidenceEvents(path);
    return predictiveEventsToObservations(events);
  }
  if (threshold === 'observation.retention_days') {
    const path =
      options.observationRetentionEventsPath
      ?? DEFAULT_OBSERVATION_RETENTION_EVENTS_PATH;
    const events = await readObservationRetentionEvents(path);
    return observationRetentionEventsToObservations(events);
  }
  if (threshold === 'amiga.min_sequence_count') {
    // Evidence: suggestions.json entries tagged [source: AMIGA sequence_repetition].
    // Polarity matches suggestions.*: accept = +1 (bar OK, may decrease),
    // dismiss = -1 (noisy, favor increase).
    const path =
      options.amigaSuggestionsPath
      ?? options.suggestionsPath
      ?? undefined;
    if (path === undefined) return [];
    const entries = await loadSuggestionsFromFile(path);
    const filtered = filterBySourceTag(entries, '[source: AMIGA sequence_repetition]');
    return entriesToObservations(filtered);
  }
  if (threshold.startsWith('refinement.')) {
    // All three refinement.* knobs share one accept/dismiss signal, exactly as
    // the suggestions.* knobs share suggestions.json.
    const path = options.refinementEventsPath ?? DEFAULT_REFINEMENT_EVENTS_PATH;
    const events = await readRefinementEvents(path);
    return refinementEventsToObservations(events);
  }
  // No unwired classes remain as of v1054.
  return [];
}
