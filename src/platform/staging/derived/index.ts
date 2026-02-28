/**
 * Derived knowledge checking module.
 *
 * Public API for checking provenance integrity, pattern fidelity,
 * scope drift, training coherence, and copying signals in
 * derived artifacts.
 *
 * @module staging/derived
 */

// Types (type-only exports)
export type {
  FamiliarityTier,
  ProvenanceNode,
  ProvenanceChain,
  DerivedCheckResult,
  DerivedCheckSeverity,
  PhantomFinding,
  ScopeDriftFinding,
  CoherenceFinding,
  CopyingFinding,
} from './types.js';

// Constants
export { FAMILIARITY_TIERS, DERIVED_CHECK_SEVERITIES } from './types.js';

// Provenance chain builder
export { buildProvenanceChain, getInheritedTier } from './provenance.js';

// Pattern fidelity checker
export type { ObservationEvidence } from './pattern-fidelity.js';
export { checkPatternFidelity } from './pattern-fidelity.js';

// Scope drift detector
export type { SessionScopeData } from './scope-drift.js';
export { detectScopeDrift, extractSkillScope, extractObservedScope } from './scope-drift.js';

// Training coherence checker
export type { TrainingPair } from './training-coherence.js';
export { checkTrainingCoherence } from './training-coherence.js';

// Copying signal detector
export { detectCopyingSignals } from './copying-detector.js';

// Unified derived checker
export type { DerivedCheckInput } from './checker.js';
export { checkDerived } from './checker.js';
