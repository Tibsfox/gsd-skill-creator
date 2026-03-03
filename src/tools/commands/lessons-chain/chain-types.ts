/**
 * @file Lessons-learned chain type definitions
 * @description Types for chain integrity validation, forward reference enforcement,
 *              cumulative catalog building, and recurring pattern detection.
 *              Consumed by Phase 559 (Lessons-Learned Chain) and Phase 560
 *              (Review Milestone Type).
 * @module tools/commands/lessons-chain
 */

/**
 * Overall status of the lessons-learned chain.
 * - `intact`: All chain links verified, prior lessons referenced, forward references present
 * - `broken`: One or more chain links missing or invalid
 * - `incomplete`: Chain exists but has missing elements that don't break it
 */
export type ChainStatus = 'intact' | 'broken' | 'incomplete';

/**
 * Configuration for the lessons-learned chain enforcement.
 * Controls how chain integrity is validated and when patterns
 * should be promoted for codification.
 */
export interface ChainConfig {
  /** Whether the current milestone must reference a prior milestone's lessons-learned. Default true. */
  requiresPriorLessons: boolean;

  /** Whether the next milestone plan must reference this milestone's lessons-learned. Default true. */
  feedForwardEnforced: boolean;

  /** How many times a lesson must recur before being flagged for codification into tooling. Default 3. */
  patternPromotionThreshold: number;

  /** Scope for building the cumulative catalog. Default 'milestone-series'. */
  catalogScope: 'milestone-series' | 'all';
}

/**
 * A single lesson entry in the lessons-learned chain.
 * Tracks an observation, its connection to foundations,
 * and actionable follow-ups.
 */
export interface LessonEntry {
  /** Lesson identifier (e.g., 'L1', 'L2'). */
  id: string;

  /** Brief lesson title. */
  title: string;

  /** What happened (observation from review). */
  observation: string;

  /** Why it matters (connection to foundations). */
  connection: string;

  /** Specific, actionable item for next review. */
  actionItem: string;

  /** How many times this lesson has appeared across the chain. */
  recurrenceCount: number;

  /** Milestone where this lesson was first observed. */
  firstSeenMilestone: string;

  /** Categorization tags for filtering and analysis. */
  tags: string[];
}

/**
 * Result of validating the lessons-learned chain integrity.
 * Reports whether all chain links are intact and where
 * any breaks exist.
 */
export interface ChainIntegrity {
  /** Whether the chain is intact. */
  valid: boolean;

  /** Overall chain status. */
  status: ChainStatus;

  /** Whether the prior milestone's lessons-learned document exists. */
  priorLessonsFound: boolean;

  /** Path to the prior lessons-learned document (empty if not found). */
  priorLessonsPath: string;

  /** Whether the next plan references the prior lessons. */
  forwardReferenceFound: boolean;

  /** Path where the forward reference was found (empty if not found). */
  forwardReferencePath: string;

  /** Human-readable error messages for broken chain links. */
  errors: string[];

  /** Current position in the milestone series (1-based). */
  chainPosition: number;

  /** Total milestones in the series. */
  totalInSeries: number;
}

/**
 * Cumulative catalog of lessons across a milestone series.
 * Aggregates all lessons and identifies patterns that
 * recur frequently enough to warrant codification.
 */
export interface LessonsCatalog {
  /** Range of milestones covered. */
  milestoneRange: { from: string; to: string };

  /** All lessons accumulated. */
  entries: LessonEntry[];

  /** Patterns promoted to codification candidates (recurrence >= threshold). */
  promotedPatterns: string[];

  /** Total number of lessons in the catalog. */
  totalLessons: number;

  /** Number of unique pattern categories. */
  uniquePatterns: number;
}

/**
 * Default chain configuration with enforcement enabled
 * and a threshold of 3 recurrences for pattern promotion.
 */
export const DEFAULT_CHAIN_CONFIG: ChainConfig = {
  requiresPriorLessons: true,
  feedForwardEnforced: true,
  patternPromotionThreshold: 3,
  catalogScope: 'milestone-series',
};
