// Learning module exports

// Feedback capture
export { FeedbackStore } from './feedback-store.js';
export { FeedbackDetector, analyzeCorrection, countWords, isFormattingOnly } from './feedback-detector.js';
export type { DetectorConfig, DetectionResult } from './feedback-detector.js';

// Refinement
export { RefinementEngine } from './refinement-engine.js';

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
} from '../types/learning.js';

export { DEFAULT_BOUNDED_CONFIG } from '../types/learning.js';
