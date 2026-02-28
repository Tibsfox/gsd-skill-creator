/**
 * Shared scoring utilities for skill validation.
 * Phase 406 Plan 03 -- weighted overall score and replay score computation.
 */

import type { AccuracyReport, ReplayResult } from './types.js';

/**
 * Compute the overall accuracy score as a weighted average of four dimensions.
 *
 * Weights: API accuracy 30%, algorithm accuracy 25%, decision tree 25%, coverage 20%.
 * Each dimension is normalized to 0-100 before weighting.
 */
export function computeOverallScore(
  apiAccuracy: AccuracyReport['apiAccuracy'],
  algorithmAccuracy: AccuracyReport['algorithmAccuracy'],
  decisionTreeAccuracy: AccuracyReport['decisionTreeAccuracy'],
  coverageMetrics: AccuracyReport['coverageMetrics'],
): number {
  const apiScore = apiAccuracy.methodsClaimed > 0
    ? (apiAccuracy.methodsVerified / apiAccuracy.methodsClaimed) * 100
    : 0;

  const algorithmScore = algorithmAccuracy.variantsClaimed > 0
    ? (algorithmAccuracy.variantsVerified / algorithmAccuracy.variantsClaimed) * 100
    : 0;

  const decisionTreeScore = decisionTreeAccuracy.totalPaths > 0
    ? (decisionTreeAccuracy.pathsValidated / decisionTreeAccuracy.totalPaths) * 100
    : 0;

  const coverageScore = (
    coverageMetrics.apiCoverage +
    coverageMetrics.variantCoverage +
    coverageMetrics.tutorialCoverage
  ) / 3;

  const weighted =
    apiScore * 0.30 +
    algorithmScore * 0.25 +
    decisionTreeScore * 0.25 +
    coverageScore * 0.20;

  return Math.round(weighted);
}

/**
 * Compute the replay score for a single tutorial result.
 * Sums the 5 boolean criteria: correctVariant, correctWorkflow,
 * correctParameters, producesResults, qualitativeMatch.
 *
 * @returns Score from 0 to 5.
 */
export function computeReplayScore(
  result: Omit<ReplayResult, 'score'>,
): number {
  return (
    (result.correctVariant ? 1 : 0) +
    (result.correctWorkflow ? 1 : 0) +
    (result.correctParameters ? 1 : 0) +
    (result.producesResults ? 1 : 0) +
    (result.qualitativeMatch ? 1 : 0)
  );
}
