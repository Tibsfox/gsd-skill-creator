/**
 * DACP Retrospective Analyzer module.
 *
 * Provides drift score calculation, JSONL persistence, and pattern
 * analysis for handoff quality monitoring and fidelity adjustment.
 *
 * @module dacp/retrospective
 */

export { calculateDriftScore, determineRecommendation } from './drift.js';
export {
  appendDriftScore,
  readDriftHistory,
  DEFAULT_DRIFT_PATH,
} from './persistence.js';
export type { DriftScoreRecord, PatternAnalysisResult } from './types.js';
export {
  analyzePatterns,
  PROMOTION_THRESHOLD,
  DEMOTION_THRESHOLD,
} from './analyzer.js';
export type { HandoffOutcomeWithType } from './analyzer.js';
