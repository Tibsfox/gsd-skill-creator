/**
 * Type definitions for the cloud-ops deployment observation pipeline.
 *
 * Covers INTEG-04: observation pipeline capturing deployment patterns and
 * identifying promotion candidates from repeated successful sequences.
 *
 * These types are modeled after the existing observation types in
 * `src/types/observation.ts` but scoped to kolla-ansible deployment actions.
 *
 * @module cloud-ops/observation/types
 */

// ---------------------------------------------------------------------------
// Deployment Actions
// ---------------------------------------------------------------------------

/**
 * kolla-ansible action types tracked by the deployment observer.
 *
 * Corresponds to kolla-ansible subcommands used in the deployment crew:
 * - bootstrap: Initial bootstrapping of target nodes
 * - prechecks: Pre-deployment validation checks
 * - deploy: Full service deployment
 * - reconfigure: Apply configuration changes to running services
 * - upgrade: Upgrade OpenStack services to a new version
 * - rollback: Revert a failed upgrade or deployment
 * - verify: Post-deployment verification checks
 */
export type DeploymentAction =
  | 'bootstrap'
  | 'prechecks'
  | 'deploy'
  | 'reconfigure'
  | 'upgrade'
  | 'rollback'
  | 'verify';

// ---------------------------------------------------------------------------
// Deployment Events
// ---------------------------------------------------------------------------

/**
 * A single deployment event captured by the observation loop.
 *
 * Events are fed into the DeploymentObserver by the deployment crew's
 * observation loop. Each event represents one kolla-ansible action run
 * against one or more OpenStack services.
 */
export interface DeploymentEvent {
  /** The kolla-ansible action that was executed. */
  action: DeploymentAction;
  /** The OpenStack service targeted (e.g., 'keystone', 'nova', 'all'). */
  service: string;
  /** ISO 8601 timestamp of when the action was recorded. */
  timestamp: string;
  /** Duration of the action in milliseconds. */
  durationMs: number;
  /** Whether the action completed successfully. */
  success: boolean;
  /** Error message if the action failed. */
  errorMessage?: string;
}

// ---------------------------------------------------------------------------
// Patterns
// ---------------------------------------------------------------------------

/**
 * A detected deployment pattern representing a recurring sequence of actions.
 *
 * Patterns are derived from the event log by grouping consecutive events
 * per service and identifying repeated action sequences.
 */
export interface DeploymentPattern {
  /** Ordered sequence of actions that make up this pattern. */
  sequence: DeploymentAction[];
  /** Services involved in this pattern (deduplicated). */
  services: string[];
  /** Number of times this sequence has been observed. */
  occurrences: number;
  /** Average total duration of this sequence across all occurrences (ms). */
  avgDurationMs: number;
  /** Success rate across all observed occurrences (0.0 to 1.0). */
  successRate: number;
  /** ISO 8601 timestamp of the first observation of this pattern. */
  firstSeen: string;
  /** ISO 8601 timestamp of the most recent observation of this pattern. */
  lastSeen: string;
}

// ---------------------------------------------------------------------------
// Promotion Candidates
// ---------------------------------------------------------------------------

/**
 * A deployment pattern candidate for promotion to a skill.
 *
 * Promotion candidates are patterns that meet configurable thresholds for
 * occurrence count, success rate, and confidence score. They represent
 * deployment sequences that are well-understood and reliable enough to be
 * codified as reusable skills.
 */
export interface PromotionCandidate {
  /** The underlying deployment pattern. */
  pattern: DeploymentPattern;
  /** Confidence score (0.0 to 1.0) -- computed from occurrences and success rate. */
  confidence: number;
  /** Human-readable explanation of why this pattern is a promotion candidate. */
  reason: string;
  /** Suggested skill name derived from the services in the pattern. */
  suggestedSkillName?: string;
}

// ---------------------------------------------------------------------------
// Observer Configuration
// ---------------------------------------------------------------------------

/**
 * Configuration for the DeploymentObserver's pattern detection thresholds.
 *
 * All thresholds are inclusive (>= for numeric comparisons).
 */
export interface DeploymentObserverConfig {
  /**
   * Minimum number of times a sequence must be observed to qualify as a pattern.
   * Sequences with fewer occurrences are filtered from detectPatterns() output.
   */
  minOccurrences: number;

  /**
   * Minimum success rate (0.0 to 1.0) for a pattern to be considered for promotion.
   * Patterns below this threshold are filtered by identifyPromotionCandidates().
   */
  minSuccessRate: number;

  /**
   * Minimum confidence score (0.0 to 1.0) for a pattern to be returned as a
   * promotion candidate. Confidence is computed as: min((occurrences / 10) * successRate, 1.0)
   */
  promotionThreshold: number;
}

/**
 * Default configuration for DeploymentObserver.
 *
 * - minOccurrences: 3  (must be seen 3+ times to be a pattern)
 * - minSuccessRate: 0.9 (90%+ success rate required for promotion)
 * - promotionThreshold: 0.8 (confidence score of 0.8+ for candidates)
 */
export const DEFAULT_DEPLOYMENT_OBSERVER_CONFIG: DeploymentObserverConfig = {
  minOccurrences: 3,
  minSuccessRate: 0.9,
  promotionThreshold: 0.8,
};
