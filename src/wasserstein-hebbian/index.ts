/**
 * Wasserstein-Hebbian adapter-stack audit — T2c primitive (MATH-19, Phase 751).
 *
 * Minimum-viable structural audit of a declared plasticity rule against the
 * Wasserstein-2 geometric framework for Hebbian plasticity per arXiv:2604.16052
 * (Tan 2026, bib key `arxiv260416052`, 75 pp) / M5 §`sec:m5-wasserstein`.
 *
 * Ships:
 *   - a closed-form W₂² distance helper on 1-D Gaussian distributions;
 *   - a bounded-variance check for σ² < threshold;
 *   - a plasticity-rule shape validator (required fields, finite numerics);
 *   - a stable-region range check (learningRate ∈ (0, 1]; regularization ∈ [0, 10]);
 *   - a structured audit-finding emitter with fail-closed serialisation.
 *
 * ## Opt-in mechanism
 *
 * This module is **default-OFF**. Opt in via `.claude/gsd-skill-creator.json`:
 *
 * ```json
 * {
 *   "gsd-skill-creator": {
 *     "mathematical-foundations": {
 *       "wasserstein-hebbian": { "enabled": true }
 *     }
 *   }
 * }
 * ```
 *
 * With the flag absent or false, no subsystem behaviour changes: the module
 * is a bag of pure functions that execute only when callers invoke them.
 * `isWassersteinHebbianEnabled()` returns false in the default state, and
 * importing the module performs no work.
 *
 * ## Explicit non-goals
 *
 * This module **DOES NOT**:
 *   - mutate `src/sensoria/` or any existing plasticity subsystem;
 *   - alter CAPCOM gates, gate-state records, or any orchestration surface;
 *   - emit bypass / override / reorganisation actions;
 *   - compute the exact Wasserstein gradient flow on 𝒫₂(ℝᵈ); uses a 1-D
 *     Gaussian closed-form approximation (documented in
 *     `wasserstein-geometry.ts`);
 *   - perform I/O beyond the settings reader's read-only JSON parse; the
 *     audit is pure in-memory computation over input;
 *   - integrate a gradient-flow simulator; simulation is Phase-753+ work.
 *
 * Audit findings are **advisory-only**: CAPCOM retains final gate authority.
 *
 * @module wasserstein-hebbian
 */

export type {
  GaussianDistribution,
  PlasticityRule,
  WassersteinAuditFinding,
} from './types.js';

export type {
  WassersteinHebbianConfig,
} from './settings.js';

export {
  DEFAULT_WASSERSTEIN_HEBBIAN_CONFIG,
  isWassersteinHebbianEnabled,
  readWassersteinHebbianConfig,
} from './settings.js';

export {
  DEFAULT_VARIANCE_THRESHOLD,
  checkBoundedVariance,
  w2SquaredGaussian,
} from './wasserstein-geometry.js';

export type {
  ValidationResult,
} from './plasticity-rule.js';

export {
  LEARNING_RATE_MAX,
  LEARNING_RATE_MIN,
  REGULARIZATION_MAX,
  REGULARIZATION_MIN,
  collectInconsistencyReasons,
  inStableRegion,
  validatePlasticityRule,
} from './plasticity-rule.js';

export {
  emitFinding,
  parseFinding,
  serializeFinding,
  validateFinding,
} from './audit-finding.js';
