/**
 * @file Pacing gate type definitions
 * @description Types for session budget enforcement, context depth checking,
 *              and artifact timing analysis. Consumed by Phase 557 (Pacing Gate)
 *              and Phase 560 (Review Milestone Type).
 * @module core/validation/pacing-gate
 */

/**
 * Overall status of a pacing check.
 * - `pass`: All pacing criteria met
 * - `warn`: One or more criteria exceeded advisory thresholds
 * - `fail`: Critical pacing violation detected
 */
export type PacingStatus = 'pass' | 'warn' | 'fail';

/**
 * Configuration for the pacing gate that controls session budget
 * and context depth expectations.
 */
export interface PacingConfig {
  /** Maximum subversions allowed per session (e.g., 5). Exceeding triggers advisory warning. */
  maxSubversionsPerSession: number;

  /** Minimum context windows per subversion (e.g., 2). Fewer triggers depth warning. */
  minContextWindowsPerSubversion: number;

  /** Whether milestone requires a retrospective document before closing. */
  mandatoryRetrospective: boolean;

  /** Whether milestone requires a lessons-learned document before closing. */
  mandatoryLessonsLearned: boolean;

  /** Whether to enforce sequential execution (disable wave parallelism). */
  sequentialOnly: boolean;
}

/**
 * Result of a pacing check against configured limits.
 * Contains the overall status, session metrics, and advisory messages.
 */
export interface PacingResult {
  /** Overall pass/warn/fail status. */
  status: PacingStatus;

  /** Session being checked. */
  sessionId: string;

  /** How many subversions were completed this session. */
  subversionsCompleted: number;

  /** The configured maximum (from PacingConfig). */
  budgetMax: number;

  /** How many context windows were used for the current subversion. */
  contextWindowsUsed: number;

  /** The configured minimum depth (from PacingConfig). */
  depthMinimum: number;

  /** Human-readable advisory messages. */
  advisories: string[];

  /** ISO timestamp of the check. */
  timestamp: string;
}

/**
 * Timestamp information for a single artifact, used for
 * timing analysis and batch detection.
 */
export interface ArtifactTimestamp {
  /** File path of the artifact. */
  path: string;

  /** ISO timestamp when artifact was created. */
  createdAt: string;

  /** Session ID during which the artifact was created. */
  sessionId: string;

  /** Subversion ID the artifact belongs to. */
  subversionId: string;
}

/**
 * Default pacing configuration with conservative limits
 * appropriate for review-type milestones.
 */
export const DEFAULT_PACING_CONFIG: PacingConfig = {
  maxSubversionsPerSession: 5,
  minContextWindowsPerSubversion: 2,
  mandatoryRetrospective: true,
  mandatoryLessonsLearned: true,
  sequentialOnly: true,
};
