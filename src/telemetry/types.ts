/**
 * Telemetry types for skill usage event emission.
 *
 * Privacy constraint: NO user content in any event type.
 * Only skill names, scores, token counts, and session IDs are recorded.
 */

/** Emitted when the score stage evaluates a skill against the current query. */
export interface SkillScoredEvent {
  type: 'skill-scored';
  skillName: string;
  score: number;
  matchType: 'intent' | 'file' | 'context';
  sessionId: string;
  timestamp: string; // ISO 8601
}

/** Emitted when the budget stage skips a skill due to token constraints. */
export interface SkillBudgetSkippedEvent {
  type: 'skill-budget-skipped';
  skillName: string;
  reason: 'budget_exceeded' | 'hard_ceiling_reached' | 'lower_priority' | 'model_mismatch';
  estimatedTokens: number;
  sessionId: string;
  timestamp: string; // ISO 8601
}

/** Emitted when the load stage successfully loads a skill into the session. */
export interface SkillLoadedEvent {
  type: 'skill-loaded';
  skillName: string;
  tokenCount: number;
  sessionId: string;
  timestamp: string; // ISO 8601
}

/** Union of all usage event types. Discriminated by the `type` field. */
export type UsageEvent = SkillScoredEvent | SkillBudgetSkippedEvent | SkillLoadedEvent;

/** Configuration for the EventStore. */
export interface EventStoreConfig {
  /** Absolute path to the JSONL event file. */
  filePath: string;
  /**
   * Maximum file size in bytes before rotation trims oldest entries.
   * Default: 10 MB (10_485_760 bytes).
   */
  maxSizeBytes?: number;
}

/** Default maximum event store size: 10 MB. */
export const DEFAULT_MAX_SIZE_BYTES = 10_485_760;

// ---------------------------------------------------------------------------
// Pattern Detection Types
// ---------------------------------------------------------------------------

/**
 * Per-skill statistics derived from accumulated usage events.
 * All rate fields are in the range [0, 1].
 */
export interface SkillPatternEntry {
  skillName: string;
  /** Number of distinct sessions in which this skill was scored. */
  sessionCount: number;
  /** Number of distinct sessions in which this skill was loaded. */
  loadCount: number;
  /** Number of distinct sessions in which this skill was budget-skipped. */
  budgetSkipCount: number;
  /** Mean of all skill-scored scores for this skill (0 if never scored). */
  avgScore: number;
  /** loadCount / totalSessions (0-1). */
  loadRate: number;
  /** budgetSkipCount / sessionCount; 0 if sessionCount is 0. */
  budgetSkipRate: number;
}

/**
 * Full pattern detection report produced when the event store has sufficient sessions.
 */
export interface PatternReport {
  type: 'report';
  /** Total number of distinct sessionIds found across all events. */
  totalSessions: number;
  /** Per-skill statistics for every skill that appears in the event store. */
  analyzedSkills: SkillPatternEntry[];
  /**
   * Skills in the top 10% by loadRate × avgScore.
   * Only included if at least one skill has been loaded at least once.
   */
  highValueSkills: string[];
  /**
   * Skills with zero scored matches across 30+ sessions (deadSkillSessionThreshold).
   * Only skills that appear somewhere in the store (loaded or skipped) but were never
   * scored are included.
   */
  deadSkills: string[];
  /**
   * Skills with a budget-skip rate above threshold (default 50%) that were scored
   * in at least budgetCasualtyMinSessions sessions.
   */
  budgetCasualties: string[];
}

/**
 * Returned when the event store has fewer than the minimum required sessions.
 * No pattern suggestions are generated.
 */
export interface PatternInsufficient {
  type: 'insufficient';
  /** Actual number of distinct sessions found. */
  sessionCount: number;
  /** Minimum required before patterns are generated (default 10). */
  minimumRequired: number;
  /** Human-readable explanation. */
  message: string;
}

/** Discriminated union of all possible pattern detection outcomes. */
export type PatternDetectionResult = PatternReport | PatternInsufficient;

/** Configuration for UsagePatternDetector. All fields optional with documented defaults. */
export interface PatternDetectorConfig {
  /** Minimum distinct sessions before any patterns are surfaced. Default: 10. */
  minimumSessions?: number;
  /**
   * Sessions needed for a zero-match skill to be called dead.
   * Dead detection only fires when totalSessions >= this value. Default: 30.
   */
  deadSkillSessionThreshold?: number;
  /**
   * A skill must be scored in at least this many sessions before it can be a
   * budget casualty. Default: 5.
   */
  budgetCasualtyMinSessions?: number;
  /**
   * Minimum budget-skip rate (budgetSkipCount / sessionCount) to qualify as
   * a budget casualty. Default: 0.5 (50%).
   */
  budgetCasualtySkipRate?: number;
}
