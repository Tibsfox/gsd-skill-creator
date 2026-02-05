/**
 * Conflict detection module for identifying semantically similar skills.
 *
 * This module provides:
 * - ConflictDetector: Uses embedding-based similarity analysis to identify
 *   potential functionality overlap between skills
 * - ConflictFormatter: Formats detection results for CLI output
 * - RewriteSuggester: Generates suggestions for resolving skill conflicts
 */

export { ConflictDetector } from './conflict-detector.js';
export { ConflictFormatter } from './conflict-formatter.js';
export { RewriteSuggester } from './rewrite-suggester.js';

// Re-export types for convenience
export type {
  ConflictConfig,
  ConflictPair,
  ConflictResult,
} from '../types/conflicts.js';

export type { RewriteSuggestion } from './rewrite-suggester.js';
