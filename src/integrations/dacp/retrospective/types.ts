/**
 * Retrospective-specific types extending core DACP types.
 *
 * These types support the retrospective analyzer's drift score persistence
 * and pattern analysis reporting.
 *
 * @module dacp/retrospective/types
 */

import type { FidelityLevel, HandoffPattern } from '../types.js';

/**
 * A drift score record for JSONL persistence.
 * Extends the core DriftScore components with context fields
 * (bundle_id, handoff_type, fidelity_level, timestamp) so each
 * record is self-contained when read back from the JSONL file.
 */
export interface DriftScoreRecord {
  /** Composite drift score (0.0-1.0) */
  score: number;

  /** Breakdown by drift source */
  components: {
    intent_miss: number;
    rework_penalty: number;
    verification_penalty: number;
    modification_penalty: number;
  };

  /** Fidelity adjustment recommendation */
  recommendation: 'promote' | 'demote' | 'maintain';

  /** Recommended fidelity level (only present when promoting or demoting) */
  recommended_level?: FidelityLevel;

  /** Bundle that was analyzed */
  bundle_id: string;

  /** Handoff type classification (e.g., "planner->executor:task-assignment") */
  handoff_type: string;

  /** Fidelity level of the analyzed bundle */
  fidelity_level: FidelityLevel;

  /** ISO 8601 timestamp of when the record was created */
  timestamp: string;
}

/**
 * Result of running the pattern analyzer across a set of handoff outcomes.
 * Summarizes which patterns were created/updated and what fidelity changes
 * are recommended.
 */
export interface PatternAnalysisResult {
  /** Number of existing patterns that were updated with new data */
  patterns_updated: number;

  /** Number of new patterns created from previously unseen handoff types */
  patterns_created: number;

  /** Patterns where promotion (fidelity increase) is recommended */
  promotions_recommended: HandoffPattern[];

  /** Patterns where demotion (fidelity decrease) is recommended */
  demotions_recommended: HandoffPattern[];

  /** Aggregate summary statistics */
  summary: {
    total_handoffs_analyzed: number;
    avg_drift_score: number;
    highest_drift_pattern: string;
    lowest_drift_pattern: string;
  };
}
