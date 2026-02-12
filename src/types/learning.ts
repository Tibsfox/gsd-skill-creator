// Learning loop types for feedback capture and skill refinement

// Change type compatible with diff library output
export interface Change {
  value: string;
  count?: number;
  added?: boolean;
  removed?: boolean;
}

// Feedback event types
export type FeedbackType = 'correction' | 'override' | 'rating';

// Core feedback event structure
export interface FeedbackEvent {
  id: string;                  // UUID
  timestamp: string;           // ISO timestamp
  type: FeedbackType;
  skillName: string;
  sessionId: string;

  // For corrections: user edited skill-guided output
  original?: string;
  corrected?: string;
  diff?: Change[];

  // For overrides: user rejected skill suggestion
  rejected?: boolean;
  reason?: string;

  // For ratings: explicit user feedback
  score?: number;              // 1-5
}

// Analysis of a text correction
export interface CorrectionAnalysis {
  originalLength: number;
  finalLength: number;
  addedWords: number;
  removedWords: number;
  keptWords: number;
  similarity: number;          // 0-1 (1 = identical)
  changes: Change[];
  isSignificant: boolean;      // True if change is meaningful
}

// Bounded learning configuration (LEARN-03)
export interface BoundedLearningConfig {
  minCorrectionsForRefinement: number;  // Default 3
  minConfidence: number;                // Default 0.7
  maxRefinementsPerSkill: number;       // Default 1 per cooldown
  cooldownDays: number;                 // Default 7
  maxContentChangePercent: number;      // Default 20
  maxMetadataChanges: number;           // Default 3
  requireUserConfirmation: boolean;     // Always true
  preserveOriginalOnRefinement: boolean; // Always true
}

// Default bounded learning configuration
export const DEFAULT_BOUNDED_CONFIG: BoundedLearningConfig = {
  minCorrectionsForRefinement: 3,
  minConfidence: 0.7,
  maxRefinementsPerSkill: 1,
  cooldownDays: 7,
  maxContentChangePercent: 20,
  maxMetadataChanges: 3,
  requireUserConfirmation: true,
  preserveOriginalOnRefinement: true,
};

// Section of a skill that can be changed
export type SkillSection = 'description' | 'triggers' | 'body';

// A single suggested change to a skill
export interface SuggestedChange {
  section: SkillSection;
  original: string;
  suggested: string;
  reason: string;
}

// Complete refinement suggestion
export interface RefinementSuggestion {
  skillName: string;
  currentVersion: number;
  suggestedChanges: SuggestedChange[];
  confidence: number;          // 0-1
  basedOnCorrections: number;  // How many corrections informed this
  preview: string;             // Preview of refined skill
}

// Skill version from git history
export interface SkillVersion {
  hash: string;
  shortHash: string;
  date: Date;
  message: string;
  version?: number;            // Parsed from message if available
}

// Refinement result
export interface RefinementResult {
  success: boolean;
  skillName: string;
  previousVersion: number;
  newVersion: number;
  changesApplied: SuggestedChange[];
  error?: string;
}

// Eligibility check result
export interface EligibilityResult {
  eligible: boolean;
  reason?: 'cooldown' | 'insufficient_feedback';
  daysRemaining?: number;
  correctionsNeeded?: number;
  correctionCount?: number;
}

// Change validation result
export interface ValidationResult {
  valid: boolean;
  changePercent: number;
  reason?: 'exceeds_bounds';
}

// Apply refinement result
export interface ApplyResult {
  success: boolean;
  newVersion?: number;
  error?: string;
}

// Pattern detected across corrections
export interface CorrectionPattern {
  section: string;
  originalPattern: string;
  correctedPattern: string;
  frequency: number;
}

// Cumulative drift tracking result (LRN-01/LRN-02)
export interface DriftResult {
  originalContent: string;
  currentContent: string;
  cumulativeDriftPercent: number;
  thresholdExceeded: boolean;
  threshold: number;
}

// Default cumulative drift threshold (60%)
export const DEFAULT_DRIFT_THRESHOLD = 60;
