/**
 * Complex Plane Learning Framework -- barrel export.
 *
 * Re-exports all types, schemas, enums, constants, classes, and functions
 * for the complex plane skill positioning model.
 *
 * Note: Both chords.ts and promotion.ts export an interface named
 * PositionStorePort. The barrel re-exports the promotion version by
 * default and aliases the chords version as ChordPositionStorePort.
 */

// Core types, schemas, enums, constants
export * from './types.js';

// Pure mathematical functions
export * from './arithmetic.js';

// Tangent activation engine
export * from './activation.js';

// Observer signal classification
export * from './signal-classification.js';

// Position persistence store
export { PositionStore } from './position-store.js';

// Observer angular bridge and pattern groups
export { ObserverAngularBridge } from './observer-bridge.js';
export type { PatternGroup } from './observer-bridge.js';

// Chord detection and persistence (selective re-export to avoid
// PositionStorePort collision with promotion.ts)
export {
  ChordDetector,
  ChordStore,
  assessCompositionQuality,
  determineAction,
  DEFAULT_CHORD_OPTIONS,
} from './chords.js';
export type {
  PositionStorePort as ChordPositionStorePort,
  ChordDetectionOptions,
  ChordEvaluation,
} from './chords.js';

// Euler composition engine
export * from './composition.js';

// Angular promotion evaluator (exports PositionStorePort)
export * from './promotion.js';

// Angular refinement wrapper
export * from './refinement-wrapper.js';

// Plane metrics computation
export * from './metrics.js';

// Dashboard rendering
export * from './dashboard.js';

// Migration system
export * from './migration.js';
