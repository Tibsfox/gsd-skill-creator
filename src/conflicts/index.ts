/**
 * Conflict detection module for identifying semantically similar skills.
 *
 * This module provides the ConflictDetector which uses embedding-based
 * similarity analysis to identify potential functionality overlap between skills.
 */

export { ConflictDetector } from './conflict-detector.js';

// Re-export types for convenience
export type {
  ConflictConfig,
  ConflictPair,
  ConflictResult,
} from '../types/conflicts.js';
