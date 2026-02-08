/**
 * Lifecycle coordination module barrel exports.
 *
 * Provides types, artifact scanning, transition rules, and the
 * lifecycle coordinator service for suggesting next GSD actions
 * based on project state and artifact existence.
 */

// Types
export {
  PhaseArtifactsSchema,
  ActionSuggestionSchema,
  NextStepSuggestionSchema,
} from './types.js';

export type {
  PhaseArtifacts,
  ActionSuggestion,
  NextStepSuggestion,
} from './types.js';

// Artifact scanner
export { scanPhaseArtifacts } from './artifact-scanner.js';

// Transition rules
export { deriveNextActions } from './transition-rules.js';

// Coordinator service
export { LifecycleCoordinator } from './lifecycle-coordinator.js';
