/**
 * Adapts discovery-pipeline candidates (RankedCandidate, ClusterCandidate) into
 * the detection SkillCandidate shape the SuggestionStore stages. This bridges the
 * two type worlds so `discover` can route its output through the suggestion store
 * (review → accept) instead of writing SKILL.md straight to ~/.claude/skills.
 *
 * Pure module (no fs / no child_process): ids are DETERMINISTIC (derived from the
 * pattern key / suggested name, never a timestamp) so re-running `discover` de-dups
 * against previously staged suggestions rather than re-staging duplicates.
 */
import type { RankedCandidate } from './pattern-scorer.js';
import type { ClusterCandidate } from './cluster-scorer.js';
import type { SkillCandidate } from '../types/detection.js';

function isoToEpoch(iso: string | undefined): number {
  if (!iso) return 0;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? 0 : t;
}

/** A tool/bash pattern candidate → SkillCandidate. */
export function toSkillCandidate(r: RankedCandidate): SkillCandidate {
  return {
    id: `disc-${r.patternKey}`,
    type: r.type === 'bash-pattern' ? 'command' : 'workflow',
    pattern: r.label,
    occurrences: r.evidence.totalOccurrences,
    confidence: r.score,
    suggestedName: r.suggestedName,
    suggestedDescription: r.suggestedDescription,
    evidence: {
      firstSeen: isoToEpoch(r.evidence.firstSeen),
      lastSeen: isoToEpoch(r.evidence.lastSeen),
      sessionIds: r.evidence.sessions ?? [],
      coOccurringFiles: [],
      coOccurringTools: [],
    },
  };
}

/** A prompt-cluster candidate → SkillCandidate. */
export function clusterToSkillCandidate(c: ClusterCandidate): SkillCandidate {
  const lastSeen = isoToEpoch(c.evidence?.lastSeen);
  return {
    id: `disc-cluster-${c.suggestedName}`,
    type: 'workflow',
    pattern: c.label,
    occurrences: c.clusterSize,
    confidence: c.score,
    suggestedName: c.suggestedName,
    suggestedDescription: c.suggestedDescription,
    evidence: {
      firstSeen: lastSeen,
      lastSeen,
      sessionIds: [],
      coOccurringFiles: [],
      coOccurringTools: [],
    },
  };
}
