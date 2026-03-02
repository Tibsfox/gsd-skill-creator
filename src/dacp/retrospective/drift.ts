/**
 * Drift score calculation for the DACP retrospective analyzer.
 *
 * This module provides the retrospective-specific drift calculation that
 * uses weights tuned for the retrospective analyzer context:
 * - intent_miss:          40%  (1 - intent_alignment)
 * - rework_penalty:       30%  (0.3 if rework required, else 0)
 * - verification_penalty: 20%  (0.2 if verification failed, else 0)
 * - modification_penalty: 10%  (modifications / 10, capped at 0.1)
 *
 * The core types.ts has a general-purpose calculateDriftScore; this module
 * provides the retrospective-tuned version with tighter thresholds for
 * promotion (>0.3) and demotion (<0.05).
 *
 * @module dacp/retrospective/drift
 */

import type { HandoffOutcome, DriftScore, FidelityLevel } from '../types.js';

/**
 * Retrospective-tuned DriftScore calculation.
 *
 * @justification Type: Accepted heuristic (intentionally different from ../types.ts)
 * Weight set: 40/30/20/10 -- tuned for post-hoc analysis where intent
 * alignment is the dominant signal. Compared to the assembler (35/25/25/15):
 * - intent_miss gets 40% because retrospective analysis has complete
 *   outcome data making intent alignment the most reliable signal
 * - Rework penalty (30%) outweighs verification (20%) because rework
 *   is a stronger retrospective indicator of drift than test results
 * - modification_penalty is downweighted (10%) because post-hoc modification
 *   counts are noisy (refactoring vs behavioral change indistinguishable)
 *
 * Components are pre-multiplied (weight applied when building the components
 * object), unlike the types.ts variant which applies weights in the final sum.
 *
 * Thresholds: promote > 0.3, demote < 0.05 (tighter band because
 * retrospective data is higher confidence -- smaller movements are meaningful)
 *
 * @see src/dacp/types.ts for the assembler-context variant
 *
 * @param outcome - The handoff outcome to score
 * @returns Drift score with component breakdown and recommendation
 */
export function calculateDriftScore(outcome: HandoffOutcome): DriftScore {
  const components = {
    intent_miss: (1 - outcome.intent_alignment) * 0.4,
    rework_penalty: outcome.rework_required ? 0.3 : 0,
    verification_penalty: !outcome.verification_pass ? 0.2 : 0,
    modification_penalty: Math.min(outcome.code_modifications / 10, 1.0) * 0.1,
  };

  const rawSum =
    components.intent_miss +
    components.rework_penalty +
    components.verification_penalty +
    components.modification_penalty;

  // Round to 10 decimal places to avoid floating point accumulation artifacts
  // (e.g., 0.4 + 0.3 + 0.2 + 0.1 = 0.9999999999999999 instead of 1.0)
  const score = Math.min(Math.round(rawSum * 1e10) / 1e10, 1.0);

  const recommendation = determineRecommendation(score, outcome.fidelity_level);

  let recommended_level: FidelityLevel | undefined;
  if (recommendation === 'promote') {
    recommended_level = Math.min(outcome.fidelity_level + 1, 4) as FidelityLevel;
  } else if (recommendation === 'demote') {
    recommended_level = Math.max(outcome.fidelity_level - 1, 0) as FidelityLevel;
  }

  return {
    score,
    components,
    recommendation,
    ...(recommended_level !== undefined ? { recommended_level } : {}),
  };
}

/**
 * Determine fidelity recommendation based on drift score and current level.
 *
 * Thresholds:
 * - score > 0.3 => 'promote' (increase fidelity to capture more intent)
 * - score < 0.05 AND currentLevel > 0 => 'demote' (over-engineered)
 * - otherwise => 'maintain'
 *
 * @param score - Composite drift score (0.0-1.0)
 * @param currentLevel - Current fidelity level
 * @returns Recommendation: promote, demote, or maintain
 */
export function determineRecommendation(
  score: number,
  currentLevel: FidelityLevel,
): 'promote' | 'demote' | 'maintain' {
  if (score > 0.3) return 'promote';
  if (score < 0.05 && currentLevel > 0) return 'demote';
  return 'maintain';
}
