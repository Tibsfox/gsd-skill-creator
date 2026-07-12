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

  // Provenance + idempotency key. Set when this correction was promoted from a
  // quarantine candidate (item-7): carries the candidate id so a replayed
  // promotion (crash between the ledger write and the status flip) appends the
  // correction exactly once instead of double-counting toward refinement.
  sourceCandidateId?: string;

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

// ---------------------------------------------------------------------------
// Automatic correction-attribution (item-7). These types describe candidates
// detected from a transcript at session-end. They live in a SEPARATE quarantine
// ledger (.planning/patterns/correction-quarantine.jsonl) and NEVER flow into
// FeedbackStore/RefinementEngine automatically — only a human `feedback
// quarantine accept` promotes one into the live feedback ledger, reusing the
// shipped fail-closed skill-exists + significance gates.
// ---------------------------------------------------------------------------

// Which transcript signal produced a candidate.
//  - 'user-interposed-edit': assistant Edit of a file that a substantive human
//    turn intervened before (redo-after-input) — the workhorse signal.
//  - 'user-modified': the harness flagged the tool result userModified===true
//    (provably ~0 recall in practice; retained for completeness).
export type CorrectionSignal = 'user-interposed-edit' | 'user-modified';

// Review lifecycle of a quarantined candidate.
export type CandidateStatus = 'pending' | 'promoted' | 'dismissed';

// A ranked, provenance-labelled attribution hint for the human reviewer.
// The automatic pipeline NEVER commits to an attribution — it only offers hints.
export interface SkillHint {
  skill: string;
  source:
    | 'attribution-skill-mistake-turn'
    | 'explicit-skill-mistake-turn'
    | 'session-active-skill';
  // Ambient context-guardian skills (e.g. security-hygiene, session-awareness)
  // auto-load in exactly the contexts with the highest correction density, so a
  // hint from them is near-worthless. Flagged + de-ranked so a reviewer never
  // rubber-stamps one.
  ambient: boolean;
}

// What the detector emits — no lifecycle fields yet.
export interface CorrectionCandidateInput {
  // Discriminator: NEVER 'correction' — a candidate can never be mistaken for a
  // FeedbackEvent, and RefinementEngine (which reads type==='correction') is
  // structurally blind to it.
  kind: 'correction-candidate';
  schemaVersion: 1;
  sessionId: string;
  transcriptPath: string;
  signal: CorrectionSignal;
  filePath: string;
  // Producing turn of the ORIGINAL (mistaken) output being corrected.
  mistakeAssistantUuid: string | null;
  // Producing turn of the redo (audit only).
  fixerAssistantUuid: string | null;
  // ALWAYS null in the automatic path (type-pinned). A human supplies the skill
  // at promotion time; the pipeline never guesses.
  skillName: null;
  // Ranked shortlist for the reviewer; ambient hints ranked last.
  skillHints: SkillHint[];
  // The human turn that triggered the redo — reviewer triage context.
  interposingUserText: string;
  original: string;
  corrected: string;
  diff: Change[];
  // Advisory FeedbackDetector similarity at detect time; re-checked at promote.
  preSimilarity: number;
}

// Persisted quarantine record = detector input + review lifecycle.
export interface CorrectionCandidate extends CorrectionCandidateInput {
  id: string; // UUID
  detectedAt: string; // ISO timestamp
  status: CandidateStatus;
  reviewedAt?: string;
  // FeedbackEvent.id written to feedback.jsonl when promoted.
  promotedFeedbackId?: string;
  dismissedReason?: string;
}
