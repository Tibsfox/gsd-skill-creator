/**
 * Type definitions for activation likelihood scoring.
 *
 * These types support the ActivationScorer which predicts how reliably
 * a skill description will trigger Claude's auto-activation feature.
 */

/**
 * Configuration for activation scorer.
 */
export interface ActivationConfig {
  /**
   * Custom weights for scoring factors.
   * Each weight should be 0-1, totaling ~1.0.
   */
  weights?: Partial<ScoringWeights>;
}

/**
 * Weights for each scoring factor.
 * Default weights based on research:
 * - specificityWeight: 0.35 (most important)
 * - activationPatternWeight: 0.25
 * - lengthWeight: 0.20
 * - imperativeVerbWeight: 0.10
 * - genericPenaltyWeight: 0.10
 */
export interface ScoringWeights {
  specificityWeight: number;
  activationPatternWeight: number;
  lengthWeight: number;
  imperativeVerbWeight: number;
  genericPenaltyWeight: number;
}

/**
 * Individual factor scores (0-1 each).
 */
export interface ScoringFactors {
  /** Unique/rare term density (0-1) - specific terminology boost */
  specificityScore: number;
  /** Explicit activation patterns found (0-1) - "when user asks", etc. */
  activationPatternScore: number;
  /** Description length factor (0-1) - penalizes too short or too long */
  lengthScore: number;
  /** Imperative verb presence (0-1) - "Generate", "Create", etc. */
  imperativeVerbScore: number;
  /** Generic term penalty (0-1) - 1 = no generic terms, 0 = all generic */
  genericPenalty: number;
}

/**
 * Activation likelihood labels.
 */
export type ActivationLabel = 'Reliable' | 'Likely' | 'Uncertain' | 'Unlikely';

/**
 * Result of scoring a single skill.
 */
export interface ActivationScore {
  /** Name of the skill scored */
  skillName: string;
  /** Final score (0-100) */
  score: number;
  /** Descriptive label based on score */
  label: ActivationLabel;
  /** Individual factor scores */
  factors: ScoringFactors;
  /** Original description (for reference) */
  description: string;
}
