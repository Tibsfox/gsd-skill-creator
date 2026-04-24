/**
 * Koopman-Memory — T2a primitive (MATH-17, Phase 749, CAPCOM HARD-preservation
 * gate G8).
 *
 * Mamba-style state-space with Koopman bilinear update per
 *   - arXiv:2604.17221 (Fujii 2026, `fujii2026mambakoopman`)
 *   - M5 §m5-mamba BNF: `h_{t+1} = A · h_t + h_t^⊤ K u_t`
 *
 * Ships a standalone primitive — operator evaluation, spectral stability
 * flag, honest composition (bilinear class is not closed → principled
 * truncation + warnings), retention invariants, and a **read-only typed
 * boundary** over the existing memory primitive in `src/memory/`.
 *
 * ## Opt-in mechanism
 *
 * This module is **default-OFF**. Opt in via `.claude/gsd-skill-creator.json`:
 *
 * ```json
 * {
 *   "gsd-skill-creator": {
 *     "mathematical-foundations": {
 *       "koopman-memory": { "enabled": true }
 *     }
 *   }
 * }
 * ```
 *
 * With the flag absent or false:
 *   - `isKoopmanMemoryEnabled()` returns `false`;
 *   - the module is side-effect-free at import (`readFileSync` is lazy —
 *     it only fires when a caller explicitly invokes the settings reader);
 *   - no reference to `src/memory/*` runtime code is ever constructed
 *     (the memory-boundary uses `import type` only).
 *
 * ## Explicit non-goals (G8 HARD preservation)
 *
 * This module **DOES NOT**:
 *   - replace or shadow `src/memory/*` — the existing memory primitive is
 *     the source of truth and is untouched by this phase;
 *   - import runtime code from `src/memory/*` (types are taken from
 *     `src/types/memory.ts`; no `MemoryService`, `PgStore`, `ChromaStore`,
 *     `ShortTermMemory`, `LongTermMemory` runtime dependencies);
 *   - alter memory-subsystem behavior for non-opted-in code paths — when
 *     the flag is false the memory subsystem is byte-identical to the
 *     v1.49.571 baseline (485-test pass count preserved);
 *   - bypass CAPCOM handoff — invariant predicates are advisory-only and
 *     cannot emit gate-bypass actions of any kind (forbidden-token grep
 *     enforces this statically);
 *   - mutate the skill library or any persistent state of any kind;
 *   - implement an exact Koopman lift — bilinear composition is
 *     explicitly surfaced as a **truncation** with warnings rather than
 *     pretending closure.
 *
 * @module koopman-memory
 */

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export type {
  BilinearOperator,
  CompositionResult,
  KoopmanInput,
  KoopmanOperator,
  KoopmanState,
  LinearOperator,
  MemoryStateSnapshot,
  OperatorSpectrum,
  RetentionResult,
  ValidationResult,
} from './types.js';

// ----------------------------------------------------------------------------
// Settings
// ----------------------------------------------------------------------------

export type { KoopmanMemoryConfig } from './settings.js';

export {
  DEFAULT_KOOPMAN_MEMORY_CONFIG,
  DEFAULT_STATE_DIM,
  isKoopmanMemoryEnabled,
  readKoopmanMemoryConfig,
} from './settings.js';

// ----------------------------------------------------------------------------
// Operator core
// ----------------------------------------------------------------------------

export { identity, spectralData, step, validate } from './koopman-operator.js';

// ----------------------------------------------------------------------------
// Composition (honest truncation)
// ----------------------------------------------------------------------------

export { compose } from './composition.js';

// ----------------------------------------------------------------------------
// Retention invariants (advisory-only)
// ----------------------------------------------------------------------------

export {
  checkIdentityRetention,
  checkLipschitzBound,
  checkZeroInputRetention,
} from './invariants.js';

// ----------------------------------------------------------------------------
// Memory boundary (READ-ONLY adapter)
// ----------------------------------------------------------------------------

export { memoryEntryToState, stateToMemorySnapshot } from './memory-boundary.js';
