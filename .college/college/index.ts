/**
 * College Structure -- public API barrel export.
 *
 * Provides a clean import path for downstream consumers:
 *   import { CollegeLoader, DepartmentExplorer } from '.college/college/index.js';
 *
 * @module college
 */

// Core loader
export { CollegeLoader, DepartmentNotFoundError, WingNotFoundError } from './college-loader.js';

// Explorer
export { DepartmentExplorer, ExplorationError } from './explorer.js';

// Cross-reference resolver
export { CrossReferenceResolver } from './cross-reference-resolver.js';

// Try-session runner
export { TrySessionRunner } from './try-session-runner.js';

// Token counter
export { countTokens, truncateToTokenBudget } from './token-counter.js';

// Types
export type {
  DepartmentSummary,
  WingContent,
  DeepReference,
  ExplorationResult,
  CrossReferenceResult,
  LearningPath,
} from './types.js';

export type {
  TrySessionDefinition,
  TryStep,
  TrySessionState,
} from './try-session-runner.js';

// Dynamic Mapping Layer types
export type { VirtualDepartment, MappingFile, EducationalTrack, TrackFile } from './types.js';
