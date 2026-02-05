/**
 * Challenger detection for activation simulation.
 *
 * Extracts and enhances the logic for identifying skills that compete
 * with the winner, with configurable margin and floor thresholds.
 */

import type { SkillPrediction } from '../types/simulation.js';

/**
 * Configuration for challenger detection.
 */
export interface ChallengerConfig {
  /** How close to winner's score to qualify as challenger (default 0.1) */
  margin: number;
  /** Minimum similarity to qualify as challenger (default 0.5) */
  floor: number;
}

/**
 * Result of challenger detection analysis.
 */
export interface ChallengerResult {
  /** Skills that are close competitors to the winner */
  challengers: SkillPrediction[];
  /** Whether competition is "too close to call" (<2% difference) */
  tooCloseToCall: boolean;
  /** Margin between winner and top challenger (null if no challengers) */
  competitionMargin: number | null;
}

/**
 * Default challenger detection configuration.
 */
const DEFAULT_CONFIG: ChallengerConfig = {
  margin: 0.1,
  floor: 0.5,
};

/**
 * Detect challenger skills that compete with the winner.
 *
 * A challenger must satisfy BOTH conditions:
 * 1. Within margin of winner's similarity score
 * 2. Above the floor threshold
 *
 * @param winner - The winning prediction (can be null if no activation)
 * @param predictions - All predictions sorted by similarity descending
 * @param config - Challenger detection configuration
 * @returns ChallengerResult with challengers array and competition analysis
 *
 * @example
 * const result = detectChallengers(winner, predictions, { margin: 0.1, floor: 0.5 });
 * if (result.tooCloseToCall) {
 *   console.warn('Competition too close!');
 * }
 */
export function detectChallengers(
  winner: SkillPrediction | null,
  predictions: SkillPrediction[],
  config: ChallengerConfig = DEFAULT_CONFIG
): ChallengerResult {
  // No winner = no challengers
  if (!winner) {
    return {
      challengers: [],
      tooCloseToCall: false,
      competitionMargin: null,
    };
  }

  const challengers: SkillPrediction[] = [];

  for (const pred of predictions) {
    // Skip the winner itself
    if (pred.skillName === winner.skillName) continue;

    // Check both conditions: within margin AND above floor
    const withinMargin = winner.similarity - pred.similarity <= config.margin;
    const aboveFloor = pred.similarity >= config.floor;

    if (withinMargin && aboveFloor) {
      challengers.push(pred);
    }
  }

  // Determine if competition is too close to call
  // (top challenger within 2% of winner)
  const topChallenger = challengers[0];
  const competitionMargin = topChallenger
    ? winner.similarity - topChallenger.similarity
    : null;
  const tooCloseToCall = competitionMargin !== null && competitionMargin < 0.02;

  return {
    challengers,
    tooCloseToCall,
    competitionMargin,
  };
}

/**
 * Check if winner is a "weak match" (below threshold but highest).
 *
 * Used when winner.wouldActivate is false but winner exists.
 * A weak match is above 40% similarity but below the activation threshold.
 *
 * @param winner - The winning prediction (or null)
 * @param threshold - The activation threshold
 * @returns true if the winner is a weak match
 *
 * @example
 * if (isWeakMatch(winner, 0.75)) {
 *   console.log('Closest skill is a weak match');
 * }
 */
export function isWeakMatch(
  winner: SkillPrediction | null,
  threshold: number
): boolean {
  if (!winner) return false;
  return winner.similarity < threshold && winner.similarity >= 0.4;
}
