/**
 * Validation framework for generated skills.
 * Phase 406: accuracy-checker, tutorial-replay, scoring
 */

// Plan 03: Accuracy checker, tutorial replay, scoring
export { checkAccuracy } from './accuracy-checker.js';
export { replayTutorials } from './tutorial-replay.js';
export { computeOverallScore, computeReplayScore } from './scoring.js';

// Types
export type {
  AccuracyReport,
  ReplayResult,
  ReplayReport,
  ValidationConfig,
  DMDScenario,
} from './types.js';
