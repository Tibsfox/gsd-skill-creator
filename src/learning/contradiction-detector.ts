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
    throw new Error('Not implemented');
  }
}
