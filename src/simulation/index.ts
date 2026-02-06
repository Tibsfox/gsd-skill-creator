/**
 * Activation simulation module.
 *
 * Provides tools for predicting which skill would activate for a given
 * user prompt using semantic similarity.
 */

// Core simulator
export { ActivationSimulator } from './activation-simulator.js';
export type { SkillInput } from './activation-simulator.js';

// Batch simulator
export { BatchSimulator } from './batch-simulator.js';
export type { BatchConfig, BatchProgress, BatchResult, BatchStats } from './batch-simulator.js';

// Confidence categorization
export {
  categorizeConfidence,
  formatConfidence,
  getDefaultThresholds,
} from './confidence-categorizer.js';
export type { ConfidenceThresholds } from './confidence-categorizer.js';

// Challenger detection
export { detectChallengers, isWeakMatch } from './challenger-detector.js';
export type { ChallengerConfig, ChallengerResult } from './challenger-detector.js';

// Hint generation
export { generateDifferentiationHints, formatHints } from './hint-generator.js';
export type { DifferentiationHint } from './hint-generator.js';

// Explanation generation
export {
  generateExplanation,
  generateBriefNegativeExplanation,
} from './explanation-generator.js';
export type { ExplanationOptions } from './explanation-generator.js';

// Re-export types for convenience
export type {
  SimulationConfig,
  SimulationResult,
  SimulationTrace,
  SkillPrediction,
  ConfidenceLevel,
} from '../types/simulation.js';
