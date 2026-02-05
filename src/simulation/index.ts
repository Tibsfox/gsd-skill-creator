/**
 * Activation simulation module.
 *
 * Provides tools for predicting which skill would activate for a given
 * user prompt using semantic similarity.
 */

// Core simulator
export { ActivationSimulator } from './activation-simulator.js';
export type { SkillInput } from './activation-simulator.js';

// Confidence categorization
export {
  categorizeConfidence,
  formatConfidence,
  getDefaultThresholds,
} from './confidence-categorizer.js';
export type { ConfidenceThresholds } from './confidence-categorizer.js';

// Re-export types for convenience
export type {
  SimulationConfig,
  SimulationResult,
  SimulationTrace,
  SkillPrediction,
  ConfidenceLevel,
} from '../types/simulation.js';
