/**
 * Coherent Functors — T1a primitive (MATH-13, Phase 745, CAPCOM hard preservation Gate G6).
 *
 * A category-theoretic NN-presentation-via-coherent-functors primitive per
 * arXiv:2604.15100 (Pugh, Grundy, Cirstea, Harris 2026). Ships the coherent
 * functor object, composition closed in F, the four coherence-condition
 * invariants (naturality / identity / composition / direct-sum), and a typed
 * Silicon-Layer boundary. Forms a direct Rosetta-Core ↔ Silicon-Layer bridge.
 *
 * ## Opt-in mechanism
 *
 * This module is **default-OFF**. Opt in via `.claude/gsd-skill-creator.json`:
 *
 * ```json
 * {
 *   "gsd-skill-creator": {
 *     "mathematical-foundations": {
 *       "coherent-functors": { "enabled": true }
 *     }
 *   }
 * }
 * ```
 *
 * With the flag absent or false, no subsystem behavior changes: the module is
 * a bag of pure functions that only execute when callers invoke them.
 * `isCoherentFunctorsEnabled()` returns false in the default state.
 *
 * ## Explicit non-goals
 *
 * This module **DOES NOT**:
 *   - modify the skill-graph DAG topology (SC3-forbidden token name intentionally avoided);
 *   - alter CAPCOM-gate authority surface or gate-state records;
 *   - emit bypass/override/reorganization actions on the gate surface;
 *   - implement a full Silicon Layer (only a typed boundary);
 *   - touch any existing `src/*` module.
 *
 * Composition and the four coherence checks operate over coherent-functor
 * values only. The Silicon-Layer boundary is serialization + shape-check; it
 * has no I/O side effects.
 *
 * @module coherent-functors
 */

export type {
  Architecture,
  Category,
  CoherenceReport,
  CoherenceWitness,
  CoherentFunctor,
  LayerSpec,
  Morphism,
  PredicateResult,
  TypeSignature,
  ValidationResult,
} from './types.js';

export type { CoherentFunctorsConfig } from './settings.js';

export {
  DEFAULT_COHERENT_FUNCTORS_CONFIG,
  isCoherentFunctorsEnabled,
  readCoherentFunctorsConfig,
} from './settings.js';

export {
  identityFunctor,
  presentNetwork,
  validateArchitecture,
} from './factory.js';

export { compose } from './composition.js';

export {
  checkCoherence,
  checkComposition,
  checkDirectSum,
  checkIdentity,
  checkNaturality,
} from './invariants.js';

export type { SiliconRepr } from './silicon-layer-boundary.js';

export {
  fromSiliconLayer,
  isSiliconRepr,
  toSiliconLayer,
  translate,
} from './silicon-layer-boundary.js';
