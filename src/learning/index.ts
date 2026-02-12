// Learning module exports

// Feedback capture
export { FeedbackStore } from './feedback-store.js';
export { FeedbackDetector, analyzeCorrection, countWords, isFormattingOnly } from './feedback-detector.js';
export type { DetectorConfig, DetectionResult } from './feedback-detector.js';

// Refinement
export { RefinementEngine } from './refinement-engine.js';

// Drift tracking
export { DriftTracker, DriftThresholdError } from './drift-tracker.js';

// Contradiction detection
export { ContradictionDetector } from './contradiction-detector.js';
export type { Contradiction, ContradictionResult } from './contradiction-detector.js';

// Versioning
export { VersionManager } from './version-manager.js';
export type { RollbackResult } from './version-manager.js';

// Re-export types for convenience
export type {
  FeedbackEvent,
  FeedbackType,
  CorrectionAnalysis,
  BoundedLearningConfig,
  RefinementSuggestion,
  SuggestedChange,
  SkillVersion,
  EligibilityResult,
  ValidationResult,
  ApplyResult,
  DriftResult,
} from '../types/learning.js';

export { DEFAULT_BOUNDED_CONFIG, DEFAULT_DRIFT_THRESHOLD } from '../types/learning.js';
