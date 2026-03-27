/**
 * Self-Improvement Lifecycle -- observation harvester.
 *
 * Reads skill-creator JSONL session files and extracts patterns, skill
 * suggestions, and promotion candidates. Deduplicates by name and handles
 * missing/malformed files gracefully.
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
 * Summary of observations extracted from JSONL session data.
 */
export interface ObservationSummary {
  /** Patterns detected during sessions */
  new_patterns: string[];

  /** Suggested skills based on repeated patterns */
  skill_suggestions: string[];

  /** Skills ready for promotion to a higher level */
  promotion_candidates: string[];
}

/**
 * Expected shape of a JSONL session entry.
 */
interface SessionEntry {
  type: string;
  name: string;
  [key: string]: unknown;
}

// ============================================================================
// Harvester
// ============================================================================

/**
 * Harvest observations from a JSONL session file.
 *
 * Reads the file, parses each line as JSON, filters by type, and deduplicates
 * by name. Malformed lines are silently skipped. Missing files return an empty
 * summary without crashing.
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

    let entry: SessionEntry;
    try {
      entry = JSON.parse(trimmed) as SessionEntry;
    } catch {
      // Malformed JSON -- skip silently
      continue;
    }

    if (!entry.type || !entry.name) continue;

    switch (entry.type) {
      case 'pattern_detected':
        patterns.add(entry.name);
        break;
      case 'skill_suggested':
        suggestions.add(entry.name);
        break;
      case 'promotion_candidate':
        candidates.add(entry.name);
        break;
      // Unknown types are silently ignored
    }
  }

  return {
    new_patterns: [...patterns],
    skill_suggestions: [...suggestions],
    promotion_candidates: [...candidates],
  };
}
