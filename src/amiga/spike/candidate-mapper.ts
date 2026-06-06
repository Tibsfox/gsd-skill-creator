/**
 * Maps AMIGA meta-mission SkillCandidates onto skill-creator's native
 * SuggestionStore SkillCandidate shape, so candidates surfaced by the dormant
 * src/amiga detector can land in `.planning/patterns/suggestions.json` and be
 * reviewed via `sc:suggest` alongside the SC-native pattern detector's output.
 *
 * The two SkillCandidate shapes differ:
 *   AMIGA  (src/amiga/meta-mission/skill-candidate-detector.ts):
 *     { name, description, trigger_pattern, confidence, evidence: string[], detection_method }
 *   SC     (src/types/detection.ts):
 *     { id, type, pattern, occurrences, confidence, suggestedName, suggestedDescription, evidence: PatternEvidence }
 *
 * The id is derived deterministically from the candidate name so that
 * SuggestionStore.addCandidates() (which dedupes by id) is idempotent across
 * repeated runs.
 *
 * Pure: no I/O. The runner owns the SuggestionStore write.
 *
 * @module
 */

import type { SkillCandidate as AmigaSkillCandidate } from '../meta-mission/skill-candidate-detector.js';
import type { SkillCandidate as SuggestionCandidate, PatternEvidence } from '../../types/detection.js';

/** Session-level context the SC PatternEvidence needs but the AMIGA candidate lacks. */
export interface MappingContext {
  /** Real session ids the candidate was derived from (most recent first). */
  sessionIds: string[];
  /** Epoch ms of the earliest supporting event. */
  firstSeen: number;
  /** Epoch ms of the latest supporting event. */
  lastSeen: number;
  /** Tools seen alongside the pattern (for evidence + reviewer context). */
  coOccurringTools: string[];
  /** Files seen alongside the pattern, if tracked. */
  coOccurringFiles?: string[];
}

/** Stable, dedupe-friendly id for an AMIGA candidate. */
export function suggestionId(candidate: AmigaSkillCandidate): string {
  return `amiga-${candidate.name}`;
}

/** Map one AMIGA candidate onto the SC SuggestionStore candidate shape. */
export function toSuggestionCandidate(
  candidate: AmigaSkillCandidate,
  ctx: MappingContext,
): SuggestionCandidate {
  const evidence: PatternEvidence = {
    firstSeen: ctx.firstSeen,
    lastSeen: ctx.lastSeen,
    sessionIds: ctx.sessionIds.slice(0, 10),
    coOccurringFiles: (ctx.coOccurringFiles ?? []).slice(0, 10),
    coOccurringTools: ctx.coOccurringTools.slice(0, 10),
  };

  return {
    id: suggestionId(candidate),
    // All AMIGA candidates are multi-event workflow patterns.
    type: 'workflow',
    pattern: candidate.trigger_pattern,
    occurrences: candidate.evidence.length,
    confidence: candidate.confidence,
    suggestedName: candidate.name,
    // Keep the provenance visible to the reviewer in `sc:suggest`.
    suggestedDescription: `${candidate.description} [source: AMIGA ${candidate.detection_method}]`,
    evidence,
  };
}

/** Map a batch of AMIGA candidates, preserving order. */
export function toSuggestionCandidates(
  candidates: readonly AmigaSkillCandidate[],
  ctx: MappingContext,
): SuggestionCandidate[] {
  return candidates.map((candidate) => toSuggestionCandidate(candidate, ctx));
}
