/**
 * Type definitions for skill activation simulation.
 *
 * These types support simulating which skill would activate for a given
 * user prompt, including confidence scoring and challenger detection.
 */

/**
 * Confidence level categories for activation predictions.
 *
 * - high: Strong match, very likely to activate correctly (85%+)
 * - medium: Good match, likely correct but some ambiguity (70-84%)
 * - low: Weak match, may activate but uncertain (50-69%)
 * - none: Below confidence threshold, would not activate (<50%)
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'none';

/**
 * Prediction result for a single skill against a prompt.
 *
 * Contains both the raw similarity score and derived confidence metrics.
 */
export interface SkillPrediction {
  /** Name of the skill being evaluated */
  skillName: string;
  /** Raw cosine similarity score (0-1) between prompt and skill description */
  similarity: number;
  /** Confidence as percentage (0-100), derived from similarity */
  confidence: number;
  /** Categorized confidence level for display/decisions */
  confidenceLevel: ConfidenceLevel;
  /** Whether this skill would actually activate (above threshold) */
  wouldActivate: boolean;
}

/**
 * Complete simulation result for a prompt against a skill set.
 *
 * Provides the winning skill (if any), close competitors, and
 * a natural language explanation of the prediction.
 */
export interface SimulationResult {
  /** The user prompt that was simulated */
  prompt: string;
  /** Top skill if above activation threshold, null if no skill would activate */
  winner: SkillPrediction | null;
  /** Skills that are close competitors (within margin AND above floor) */
  challengers: SkillPrediction[];
  /** All skills ranked by similarity for verbose/debugging output */
  allPredictions: SkillPrediction[];
  /** Human-readable explanation of the prediction decision */
  explanation: string;
  /** Embedding method used: 'model' for transformer, 'heuristic' for TF-IDF fallback */
  method: 'model' | 'heuristic';
  /** Optional detailed trace for debugging/verbose mode */
  trace?: SimulationTrace;
}

/**
 * Detailed trace information for debugging and verbose output.
 *
 * Captures timing, configuration, and comparison metadata.
 */
export interface SimulationTrace {
  /** Time spent generating embeddings (milliseconds) */
  embeddingTime: number;
  /** Number of skills compared against the prompt */
  comparisonCount: number;
  /** Activation threshold used (skill must exceed to win) */
  threshold: number;
  /** Margin for challenger detection (distance from winner) */
  challengerMargin: number;
  /** Minimum confidence for a skill to be considered a challenger */
  challengerFloor: number;
}

/**
 * Configuration options for the activation simulator.
 *
 * All options have sensible defaults; provide only what needs customization.
 */
export interface SimulationConfig {
  /**
   * Activation threshold - skill similarity must exceed this to win.
   * Default: 0.75 (conservative before calibration)
   */
  threshold?: number;
  /**
   * Margin from winner for challenger detection.
   * Skills within this distance of winner are flagged as challengers.
   * Default: 0.1 (10%)
   */
  challengerMargin?: number;
  /**
   * Minimum confidence for challenger consideration.
   * Skills below this floor are not reported as challengers.
   * Default: 0.5 (50%)
   */
  challengerFloor?: number;
  /**
   * Include detailed trace in results for debugging.
   * Default: false
   */
  includeTrace?: boolean;
}
