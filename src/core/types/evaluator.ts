/**
 * Evaluator and optimizer types for skill quality assessment.
 *
 * These types support A/B testing, success signal tracking,
 * and health scoring across the evaluator-optimizer subsystem.
 */

/**
 * Types of success signals that indicate skill effectiveness.
 */
export type SuccessSignalType = 'correction' | 'override' | 'explicit-positive' | 'explicit-negative';

/**
 * A recorded success signal for a skill activation.
 *
 * Captures whether a skill activation was helpful based on
 * user behavior (corrections, overrides, explicit feedback).
 */
export interface SuccessSignal {
  id: string;
  timestamp: string;
  skillName: string;
  signalType: SuccessSignalType;
  activationScore: number;
  details?: string;
}

/**
 * Result of an A/B comparison between two skill variants.
 *
 * Includes statistical significance testing via t-statistic.
 */
export interface ABResult {
  variantA: { name: string; scores: number[]; meanScore: number; stdDev: number };
  variantB: { name: string; scores: number[]; meanScore: number; stdDev: number };
  tStatistic: number | null;
  significant: boolean;
  winner: 'A' | 'B' | 'insufficient_data' | 'no_significant_difference';
  sampleSize: { a: number; b: number };
  minimumMet: boolean;
}

/**
 * Health score for a skill, combining test precision,
 * success rate, token efficiency, and staleness.
 */
export interface HealthScore {
  skillName: string;
  precision: number | null;    // null when no test data
  successRate: number | null;  // null when no success signals
  tokenEfficiency: number;     // 0-1, higher = more efficient
  staleness: number | null;    // days since last update, null if unknown
  overallScore: number;        // 0-100 weighted composite
  flagged: boolean;
  suggestions: string[];
}

/**
 * Configurable thresholds for health scoring.
 */
export interface HealthThresholds {
  minPrecision: number;      // Default: 0.7
  minSuccessRate: number;    // Default: 0.6
  maxStaleDays: number;      // Default: 90
  flagThreshold: number;     // Default: 50 (overall score)
}

/**
 * Default health thresholds for skill quality assessment.
 */
export const DEFAULT_HEALTH_THRESHOLDS: HealthThresholds = {
  minPrecision: 0.7,
  minSuccessRate: 0.6,
  maxStaleDays: 90,
  flagThreshold: 50,
};
