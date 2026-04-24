/**
 * Semantic Channel DACP formalism — T1c primitive (MATH-15, Phase 747,
 * CAPCOM HARD-preservation gate G7).
 *
 * Formal information-theoretic view of the DACP three-part-bundle
 * (human-intent / structured-data / executable-code) per
 *   - arXiv:2604.16471 (Xu, *Semantic Channel Theory*, `xu2026semantic`)
 *   - arXiv:2604.15698 (Xu, *Rate-Distortion for Deductive Sources*,
 *     `xu2026ratedistortion`)
 * and M5 §`sec:m5-dacp-grammar` BNF grammar:
 *
 *   bundle ::= ⟨ intent, data, code ⟩
 *   φ·     ::= lossless | closure-preserving | rate-distorted
 *
 * Ships a **read-only** adapter over `src/dacp/`, a conservative
 * channel-capacity upper bound per the Xu rate-distortion inequality
 * `R_D(φ) ≥ R(D)`, and an **advisory-only** runtime drift checker.
 * Also: `docs/substrate/semantic-channel.md` — the GAP-6 closure
 * artifact (DACP Not Publicly Documented).
 *
 * ## Opt-in mechanism
 *
 * This module is **default-OFF**. Opt in via `.claude/gsd-skill-creator.json`:
 *
 * ```json
 * {
 *   "gsd-skill-creator": {
 *     "mathematical-foundations": {
 *       "semantic-channel": { "enabled": true }
 *     }
 *   }
 * }
 * ```
 *
 * With the flag absent or false:
 *   - `isSemanticChannelEnabled()` returns `false`;
 *   - `checkSemanticDriftIfEnabled(...)` returns `null`;
 *   - importing this module performs zero I/O beyond resolving its own
 *     source files (the `readFile` / `readdir` APIs used by the adapter
 *     are lazy — they fire only when a caller invokes `readTriad` or
 *     `computeChannelState`).
 *
 * ## Explicit non-goals (HARD preservation)
 *
 * This module **DOES NOT**:
 *   - modify `src/dacp/` — adapter is strictly read-only;
 *   - alter DACP wire format, Zod schemas, `BundleManifestSchema`, or
 *     `DACP_VERSION`;
 *   - bypass CAPCOM handoff — the drift checker is advisory-only and
 *     cannot emit bypass, override, or DACP-migration actions of any
 *     kind (the forbidden-token CAPCOM grep enforces this statically);
 *   - mutate the skill library or any other persistent state;
 *   - implement an exact rate-distortion LP — the capacity bound is a
 *     correct-shape size-based upper bound (Phase 751 Wasserstein-
 *     Hebbian may refine this).
 *
 * @module semantic-channel
 */

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export type {
  ChannelCapacityBound,
  ChannelComponentFidelity,
  ChannelState,
  DriftFinding,
  DriftMagnitudes,
  FidelityTier,
  SemanticChannelTriad,
} from './types.js';

export {
  FIDELITY_TIER_ORDER,
  fidelityLevelToTriad,
  tierCompare,
  tierRank,
} from './types.js';

// ----------------------------------------------------------------------------
// Settings
// ----------------------------------------------------------------------------

export type { SemanticChannelConfig } from './settings.js';

export {
  DEFAULT_DRIFT_THRESHOLD,
  DEFAULT_SEMANTIC_CHANNEL_CONFIG,
  isSemanticChannelEnabled,
  readSemanticChannelConfig,
} from './settings.js';

// ----------------------------------------------------------------------------
// DACP adapter (read-only)
// ----------------------------------------------------------------------------

export { computeChannelState, deriveFidelity, readTriad } from './dacp-adapter.js';

// ----------------------------------------------------------------------------
// Channel-capacity bound
// ----------------------------------------------------------------------------

export { capacityFitsBudget, computeCapacityBound } from './channel-capacity.js';

// ----------------------------------------------------------------------------
// Drift checker (advisory-only)
// ----------------------------------------------------------------------------

export type { DriftCheckOptions } from './drift-checker.js';

export { checkSemanticDrift, checkSemanticDriftIfEnabled } from './drift-checker.js';
