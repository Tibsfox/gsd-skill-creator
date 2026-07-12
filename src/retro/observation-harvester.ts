/**
 * Self-Improvement Lifecycle -- observation harvester.
 *
 * Reads a session observation log produced by `tools/session-retro/observe.mjs`
 * and folds its events into an ObservationSummary. The log is JSONL, one event
 * per line, in the shape observe.mjs actually writes:
 *
 *   { "t": "<iso>", "kind": "gap", "label": "batch-rewrite tool", "payload"?: {…} }
 *
 * (An earlier revision expected a phantom `{ type, name }` shape that observe.mjs
 * never emits, so it always harvested nothing. This reads the real `kind`/`label`
 * fields.)
 *
 * Kind → summary mapping (unlisted kinds — tool-use, checkpoint, tokens,
 * correction — are informational and ignored here):
 *
 *   gap                       → skill_suggestions   (a missing skill/agent/chipset)
 *   promotion                 → promotion_candidates (ready to promote)
 *   friction | win | decision → new_patterns        (recurring signal worth naming)
 *
 * Deduplicates by label. Malformed lines and missing files degrade to empty.
 *
 * One controlled side effect: file read via fs.readFileSync.
 *
 * @module retro/observation-harvester
 */

import { readFileSync } from 'fs';

// ============================================================================
// Types
// ============================================================================

/**
 * Summary of observations extracted from a session observation log.
 */
export interface ObservationSummary {
  /** Patterns detected during sessions */
  new_patterns: string[];

  /** Suggested skills based on gaps observed */
  skill_suggestions: string[];

  /** Skills ready for promotion to a higher level */
  promotion_candidates: string[];
}

/**
 * Real shape of an observe.mjs event line. `label` is the human summary; the
 * optional `payload` carries structured extras we do not need here.
 */
interface ObserveEvent {
  kind: string;
  label: string;
  payload?: unknown;
  [key: string]: unknown;
}

/** observe.mjs kinds that name a recurring session pattern. */
const PATTERN_KINDS = new Set(['friction', 'win', 'decision']);

// ============================================================================
// Harvester
// ============================================================================

/**
 * Harvest observations from an observe.mjs session log.
 *
 * Reads the file, parses each line as JSON, folds recognised kinds into the
 * summary, and deduplicates by label. Malformed lines are silently skipped.
 * Missing files return an empty summary without crashing.
 */
export function harvestObservations(sessionsJsonlPath: string): ObservationSummary {
  const patterns = new Set<string>();
  const suggestions = new Set<string>();
  const candidates = new Set<string>();

  let content: string;
  try {
    content = readFileSync(sessionsJsonlPath, 'utf-8');
  } catch {
    // File doesn't exist or isn't readable -- return empty summary
    return {
      new_patterns: [],
      skill_suggestions: [],
      promotion_candidates: [],
    };
  }

  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let event: ObserveEvent;
    try {
      event = JSON.parse(trimmed) as ObserveEvent;
    } catch {
      // Malformed JSON -- skip silently
      continue;
    }

    const kind = typeof event.kind === 'string' ? event.kind : '';
    const label = typeof event.label === 'string' ? event.label.trim() : '';
    if (!kind || !label) continue;

    if (kind === 'gap') {
      suggestions.add(label);
    } else if (kind === 'promotion') {
      candidates.add(label);
    } else if (PATTERN_KINDS.has(kind)) {
      patterns.add(label);
    }
    // Unknown / informational kinds are silently ignored.
  }

  return {
    new_patterns: [...patterns],
    skill_suggestions: [...suggestions],
    promotion_candidates: [...candidates],
  };
}
