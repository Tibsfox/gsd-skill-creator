/**
 * Drift score calculation for the DACP retrospective analyzer.
 *
 * This module provides the retrospective-specific drift calculation that
 * uses weights tuned for the retrospective analyzer context:
 * - intent_miss:          40%
 * - rework_penalty:       30%
 * - verification_penalty: 20%
 * - modification_penalty: 10%
 *
 * The core types.ts has a general-purpose calculateDriftScore; this module
 * provides the retrospective-tuned version with tighter thresholds for
 * promotion (>0.3) and demotion (<0.05).
 *
 * @module dacp/retrospective/drift
 */

import type { HandoffOutcome, DriftScore, FidelityLevel } from '../types.js';

/**
 * Calculate a composite drift score from a handoff outcome using
 * retrospective-tuned weights.
 *
 * @param outcome - The handoff outcome to score
 * @returns Drift score with component breakdown and recommendation
 */
export function calculateDriftScore(_outcome: HandoffOutcome): DriftScore {
  throw new Error('Not implemented');
}

/**
 * Determine fidelity recommendation based on drift score and current level.
 *
 * @param score - Composite drift score (0.0-1.0)
 * @param currentLevel - Current fidelity level
 * @returns Recommendation: promote, demote, or maintain
 */
export function determineRecommendation(
  _score: number,
  _currentLevel: FidelityLevel,
): 'promote' | 'demote' | 'maintain' {
  throw new Error('Not implemented');
}
