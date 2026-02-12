import { FeedbackStore } from './feedback-store.js';
import { FeedbackEvent } from '../types/learning.js';

/**
 * Represents a detected contradiction between two feedback corrections.
 */
export interface Contradiction {
  correction1: FeedbackEvent;
  correction2: FeedbackEvent;
  field: string;
  description: string;
  severity: 'warning' | 'conflict';
}

/**
 * Result of contradiction detection analysis.
 */
export interface ContradictionResult {
  contradictions: Contradiction[];
  hasConflicts: boolean;
  summary: string;
}

/**
 * Normalize a string for comparison: trim and lowercase.
 */
function normalize(s: string | undefined): string {
  return (s ?? '').trim().toLowerCase();
}

/**
 * ContradictionDetector analyzes feedback corrections for contradictory patterns.
 * Implements LRN-03: flag contradictory feedback rather than silently averaging.
 */
export class ContradictionDetector {
  private feedbackStore: FeedbackStore;

  constructor(feedbackStore: FeedbackStore) {
    this.feedbackStore = feedbackStore;
  }

  /**
   * Detect contradictions in feedback corrections for a skill.
   */
  async detect(skillName: string): Promise<ContradictionResult> {
    const corrections = await this.feedbackStore.getCorrections(skillName);

    if (corrections.length <= 1) {
      return {
        contradictions: [],
        hasConflicts: false,
        summary: 'No contradictions detected',
      };
    }

    const contradictions: Contradiction[] = [];

    // Compare each pair of corrections
    for (let i = 0; i < corrections.length; i++) {
      for (let j = i + 1; j < corrections.length; j++) {
        const c1 = corrections[i];
        const c2 = corrections[j];

        const c1Original = normalize(c1.original);
        const c1Corrected = normalize(c1.corrected);
        const c2Original = normalize(c2.original);
        const c2Corrected = normalize(c2.corrected);

        // Skip if either correction is missing original/corrected
        if (!c1Original || !c1Corrected || !c2Original || !c2Corrected) {
          continue;
        }

        // Reversal check: c2 reverses c1 (c2.corrected matches c1.original AND c2.original matches c1.corrected)
        if (c2Corrected === c1Original && c2Original === c1Corrected) {
          contradictions.push({
            correction1: c1,
            correction2: c2,
            field: 'body',
            description: `Correction reversal: changed '${c1.original}' to '${c1.corrected}' then back to '${c2.corrected}'`,
            severity: 'conflict',
          });
          continue;
        }

        // Partial reversal check: c2.corrected contains c1.original as significant substring
        const shorter = Math.min(c1Original.length, c2Corrected.length);
        if (shorter > 10 || shorter > c1Original.length * 0.5) {
          if (c2Corrected.includes(c1Original) && c1Corrected.includes(c2Original)) {
            contradictions.push({
              correction1: c1,
              correction2: c2,
              field: 'body',
              description: `Partial reversal: corrections overlap in opposing directions`,
              severity: 'warning',
            });
          }
        }
      }
    }

    const conflicts = contradictions.filter(c => c.severity === 'conflict').length;
    const warnings = contradictions.filter(c => c.severity === 'warning').length;
    const hasConflicts = conflicts > 0;

    const summary = contradictions.length === 0
      ? 'No contradictions detected'
      : `Found ${contradictions.length} contradiction(s): ${conflicts} conflict(s), ${warnings} warning(s)`;

    return {
      contradictions,
      hasConflicts,
      summary,
    };
  }
}
