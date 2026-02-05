/**
 * Confidence categorization for activation simulation.
 *
 * Maps raw similarity scores (0-1) to human-readable confidence levels.
 * Thresholds are configurable to support calibration in Phase 18.
 */

import type { ConfidenceLevel } from '../types/simulation.js';

/**
 * Default thresholds for confidence categorization.
 * These can be adjusted based on calibration results.
 */
const DEFAULT_THRESHOLDS = {
  high: 0.85,   // 85%+ = high confidence
  medium: 0.70, // 70-84% = medium confidence
  low: 0.50,    // 50-69% = low confidence
  // Below 50% = none
};

/**
 * Configurable thresholds for confidence categorization.
 * All values are similarity scores (0-1).
 */
export interface ConfidenceThresholds {
  /** Minimum similarity for high confidence */
  high: number;
  /** Minimum similarity for medium confidence */
  medium: number;
  /** Minimum similarity for low confidence */
  low: number;
}

/**
 * Categorize a similarity score into a confidence level.
 *
 * @param similarity - Raw cosine similarity score (0-1)
 * @param thresholds - Optional custom thresholds
 * @returns Confidence level category
 *
 * @example
 * categorizeConfidence(0.92) // 'high'
 * categorizeConfidence(0.75) // 'medium'
 * categorizeConfidence(0.55) // 'low'
 * categorizeConfidence(0.30) // 'none'
 */
export function categorizeConfidence(
  similarity: number,
  thresholds: ConfidenceThresholds = DEFAULT_THRESHOLDS
): ConfidenceLevel {
  if (similarity >= thresholds.high) return 'high';
  if (similarity >= thresholds.medium) return 'medium';
  if (similarity >= thresholds.low) return 'low';
  return 'none';
}

/**
 * Format a similarity score for display as percentage with level.
 *
 * @param similarity - Raw cosine similarity score (0-1)
 * @param thresholds - Optional custom thresholds
 * @returns Formatted string like "87% (High)"
 *
 * @example
 * formatConfidence(0.87) // "87% (High)"
 * formatConfidence(0.72) // "72% (Medium)"
 * formatConfidence(0.45) // "45% (None)"
 */
export function formatConfidence(
  similarity: number,
  thresholds?: ConfidenceThresholds
): string {
  const percentage = Math.round(similarity * 100);
  const level = categorizeConfidence(similarity, thresholds);
  const levelLabel = level.charAt(0).toUpperCase() + level.slice(1);
  return `${percentage}% (${levelLabel})`;
}

/**
 * Get a copy of the default thresholds.
 * Useful for reference or as a starting point for calibration.
 *
 * @returns Copy of default threshold values
 */
export function getDefaultThresholds(): ConfidenceThresholds {
  return { ...DEFAULT_THRESHOLDS };
}
