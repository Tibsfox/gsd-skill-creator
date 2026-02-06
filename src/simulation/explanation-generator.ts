/**
 * Explanation generator for activation simulation.
 *
 * Generates natural language explanations for simulation results,
 * including winner announcements, challenger mentions, and
 * "too close to call" warnings.
 */

import type { SkillPrediction } from '../types/simulation.js';
import { formatConfidence } from './confidence-categorizer.js';
import type { ChallengerResult } from './challenger-detector.js';
import type { DifferentiationHint } from './hint-generator.js';

/**
 * Options for explanation generation.
 */
export interface ExplanationOptions {
  /** Include detailed reasoning for each prediction */
  verbose: boolean;
  /** Include differentiation hints */
  includeHints: boolean;
}

/**
 * Default explanation options.
 */
const DEFAULT_OPTIONS: ExplanationOptions = {
  verbose: false,
  includeHints: false,
};

/**
 * Generate natural language explanation for simulation result.
 *
 * Produces rich explanations including:
 * - Winner announcement with confidence
 * - "Too close to call" warnings when margin < 2%
 * - Challenger listing with their scores
 * - Optional verbose mode with all predictions
 * - Optional differentiation hints
 *
 * @param winner - The winning prediction (or null if no activation)
 * @param challengerResult - Result from detectChallengers
 * @param allPredictions - All predictions sorted by similarity
 * @param hints - Differentiation hints (may be empty)
 * @param options - Explanation options
 * @returns Natural language explanation string
 *
 * @example
 * const explanation = generateExplanation(
 *   winner,
 *   challengerResult,
 *   predictions,
 *   hints,
 *   { verbose: true, includeHints: true }
 * );
 */
export function generateExplanation(
  winner: SkillPrediction | null,
  challengerResult: ChallengerResult,
  allPredictions: SkillPrediction[],
  hints: DifferentiationHint[],
  options: ExplanationOptions = DEFAULT_OPTIONS
): string {
  const parts: string[] = [];

  // Main verdict
  if (!winner) {
    parts.push(generateNoActivationExplanation(allPredictions));
  } else {
    parts.push(generateActivationExplanation(winner, challengerResult));
  }

  // Verbose: include all predictions
  if (options.verbose && allPredictions.length > 0) {
    parts.push('');
    parts.push('All predictions:');
    for (const pred of allPredictions) {
      const status = pred.wouldActivate ? 'WOULD ACTIVATE' : 'would not activate';
      parts.push(`  - ${pred.skillName}: ${formatConfidence(pred.similarity)} (${status})`);
    }
  }

  // Include hints if requested and available
  if (options.includeHints && hints.length > 0) {
    parts.push('');
    parts.push('Suggestions to reduce competition:');
    for (const hint of hints.slice(0, 3)) {
      // Limit to top 3 hints
      parts.push(`  - ${hint.hint}`);
    }
  }

  return parts.join('\n');
}

/**
 * Generate explanation when no skill would activate.
 *
 * Provides context-appropriate messages based on how close
 * the nearest skill was to activating.
 *
 * @param predictions - All predictions (should be sorted by similarity)
 * @returns Explanation string
 */
function generateNoActivationExplanation(predictions: SkillPrediction[]): string {
  if (predictions.length === 0) {
    return 'No skill would activate. No skills provided for comparison.';
  }

  const top = predictions[0];
  const topScore = formatConfidence(top.similarity);

  if (top.similarity < 0.3) {
    return (
      `No skill would activate. The prompt doesn't match any skill well. ` +
      `Closest: "${top.skillName}" at ${topScore}.`
    );
  }

  if (top.similarity < 0.5) {
    return (
      `No skill would activate. Weak match: "${top.skillName}" at ${topScore}, ` +
      `below activation threshold.`
    );
  }

  return (
    `No skill would activate. Closest match: "${top.skillName}" at ${topScore}, ` +
    `just below activation threshold.`
  );
}

/**
 * Generate explanation when a skill would activate.
 *
 * Includes "too close to call" warnings and challenger mentions.
 *
 * @param winner - The winning prediction
 * @param challengerResult - Challenger detection result
 * @returns Explanation string
 */
function generateActivationExplanation(
  winner: SkillPrediction,
  challengerResult: ChallengerResult
): string {
  const { challengers, tooCloseToCall, competitionMargin } = challengerResult;
  let explanation = `"${winner.skillName}" would activate at ${formatConfidence(winner.similarity)}.`;

  // Too close to call warning
  if (tooCloseToCall && challengers.length > 0) {
    explanation +=
      ` Warning: Very close competition with "${challengers[0].skillName}" ` +
      `(only ${Math.round((competitionMargin ?? 0) * 100)}% difference).`;
  } else if (challengers.length > 0) {
    // Normal challenger mention
    const challengerList = challengers
      .slice(0, 3)
      .map((c) => `"${c.skillName}" (${formatConfidence(c.similarity)})`)
      .join(', ');

    if (challengers.length === 1) {
      explanation += ` Close competitor: ${challengerList}.`;
    } else {
      explanation += ` Close competitors: ${challengerList}.`;
    }
  } else {
    explanation += ' No close competitors.';
  }

  return explanation;
}

/**
 * Generate brief explanation for negative predictions (non-verbose mode).
 *
 * Used when a quick summary is needed without full details.
 *
 * @param predictions - All predictions (should be sorted by similarity)
 * @returns Brief explanation string
 *
 * @example
 * const brief = generateBriefNegativeExplanation(predictions);
 * // "No activation. Top: \"git-commit\" at 65% (Low)."
 */
export function generateBriefNegativeExplanation(
  predictions: SkillPrediction[]
): string {
  if (predictions.length === 0) {
    return 'No skills to compare.';
  }

  const top = predictions[0];
  return `No activation. Top: "${top.skillName}" at ${formatConfidence(top.similarity)}.`;
}
