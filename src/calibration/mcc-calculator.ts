/**
 * Matthews Correlation Coefficient (MCC) calculator for binary classification.
 *
 * MCC is the Pearson correlation coefficient for binary classification.
 * It provides a balanced measure that accounts for all four confusion matrix values.
 */

/**
 * Calculate Matthews Correlation Coefficient.
 *
 * MCC is the Pearson correlation coefficient for binary classification.
 * Returns value between -1 (total disagreement) and +1 (perfect prediction).
 *
 * Formula: (TP*TN - FP*FN) / sqrt((TP+FP)(TP+FN)(TN+FP)(TN+FN))
 *
 * @param tp - True positives
 * @param tn - True negatives
 * @param fp - False positives
 * @param fn - False negatives
 * @returns MCC value between -1 and 1, or 0 if denominator is 0
 */
export function calculateMCC(
  tp: number,
  tn: number,
  fp: number,
  fn: number
): number {
  const numerator = tp * tn - fp * fn;
  const denominator = Math.sqrt(
    (tp + fp) * (tp + fn) * (tn + fp) * (tn + fn)
  );

  // Handle edge cases (all predictions same class)
  if (denominator === 0) {
    return 0;
  }

  return numerator / denominator;
}

/**
 * Convert MCC to percentage for display.
 * MCC ranges -1 to +1; we show as percentage.
 *
 * Note: MCC of 0.5 = 50% correlation, MCC of 1.0 = 100%
 * Negative MCC indicates inverse correlation.
 */
export function mccToPercentage(mcc: number): number {
  return Math.round(mcc * 100);
}
