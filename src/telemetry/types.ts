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
  maxSizeBytes: number;
}

/** Default maximum event store size: 10 MB. */
export const DEFAULT_MAX_SIZE_BYTES = 10_485_760;
