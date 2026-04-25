/**
 * HB-05 Five-Principle Structural-Completeness Linter — barrel export.
 *
 * v1.49.575 cs25-26-sweep Half B. Source: arXiv:2604.21090.
 * Default-off via `cs25-26-sweep.structural-completeness-lint.enabled`.
 *
 * Coordinates with HB-06 (Four-Type Ambiguity Linter, parallel) at the
 * config-block level only — both linters share the
 * `cs25-26-sweep` block in `.claude/gsd-skill-creator.json` but do not
 * depend on each other at the code level.
 *
 * @module cartridge/linter
 */

// Settings.
export type { StructuralCompletenessConfig } from './settings.js';
export {
  DEFAULT_STRUCTURAL_COMPLETENESS_CONFIG,
  isStructuralCompletenessEnabled,
  readStructuralCompletenessConfig,
} from './settings.js';

// Core checker.
export type {
  FivePrincipleCheckResult,
  Principle,
  PrincipleResult,
  StructuralCompletenessOptions,
} from './structural-completeness.js';
export {
  PRINCIPLES,
  checkStructuralCompleteness,
} from './structural-completeness.js';

// Promotion-gate shim.
export type {
  PromotionGateOptions,
  PromotionGateResult,
} from './promotion-gate.js';
export { runPromotionGate } from './promotion-gate.js';
