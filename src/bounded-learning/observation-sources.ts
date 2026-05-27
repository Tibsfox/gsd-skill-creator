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
  eventsToObservations,
  readTokenBudgetEvents,
} from './token-budget-events.js';
import type { CalibrationObservation, CalibratableThreshold } from './types.js';
import type { SuggestionEntry } from './suggestions-mapper.js';

/**
 * Options consumed by per-class loaders. Loaders ignore options that don't
 * apply to their class (e.g. token-budget loaders ignore `suggestionsPath`).
 */
export interface ObservationLoaderOptions {
  /** Path to suggestions.json (consumed by suggestions.* threshold class). */
  suggestionsPath?: string;
  /** Path to token-budget-events.jsonl (consumed by token_budget.* threshold class; v803). */
  tokenBudgetEventsPath?: string;
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
  if (threshold.startsWith('token_budget.')) {
    return {
      sourceId: 'token-budget-events',
      description: 'Operator response to skill-load token-budget warn events (NOT YET CAPTURED for this threshold)',
      wired: false,
    };
  }
  if (threshold.startsWith('observation.')) {
    return {
      sourceId: 'observation-retention-events',
      description: 'Observation-retention compaction / drop events (NOT YET CAPTURED)',
      wired: false,
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
 * Dispatch to the per-class loader and return the resulting observations.
 *
 * Wired classes:
 *   - `suggestions.*`              — reads `suggestions.json`.
 *   - `token_budget.warn_at_percent` — reads `token-budget-events.jsonl` (v803).
 *
 * Unwired classes (`token_budget.max_percent`, `observation.*`) return an
 * empty array — the calibration loop then returns `direction: 'hold'` with
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
    return eventsToObservations(events);
  }
  // Unwired classes return empty; honest "no data captured" baseline.
  return [];
}
