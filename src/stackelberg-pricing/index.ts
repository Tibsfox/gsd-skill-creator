/**
 * Stackelberg Drainability Pricing Reference — public API.
 *
 * Multi-tenant shared-infrastructure pricing reference per the Stackelberg
 * Game with Drainability Guardrails framework:
 *
 *   Yan et al., "Stackelberg Game Framework with Drainability Guardrails
 *   for Pricing and Scaling in Multi-Tenant GPU Cloud Platforms",
 *   arXiv:2604.16802, CDC 2026.
 *
 * ## Overview
 *
 * This module formalises multi-tenant shared-infrastructure pricing as a
 * Stackelberg (leader-follower) bilevel game:
 *
 *   - The **leader** (platform operator) sets a price vector over shared
 *     resources to maximise platform revenue.
 *   - The **followers** (tenants) each independently choose consumption
 *     levels that maximise their utility net of resource cost.
 *   - A **drainability guardrail** constrains the leader: no price vector
 *     is admissible if it would allow tenant demand to collectively drain
 *     any shared resource below a safety floor δ.
 *
 * ## Default-off behaviour
 *
 * With the opt-in flag absent or false (the default):
 *
 *   - `solveStackelberg(game)` returns `{ disabled: true }`.
 *   - `checkDrainability(usages, guardrails)` returns `{ disabled: true }`.
 *   - No compute occurs; no file I/O beyond the settings read.
 *
 * The feature flag is at:
 *   `gsd-skill-creator.upstream-intelligence.stackelberg-pricing.enabled`
 * in `.claude/gsd-skill-creator.json`.
 *
 * ## REFERENCE IMPLEMENTATION ONLY
 *
 * No commercial deployment in this milestone. This module validates the
 * Stackelberg Drainability methodology from arXiv:2604.16802. Downstream
 * commercial work happens separately. Public surfaces use generic
 * "multi-tenant pricing" / "shared infrastructure pricing" language.
 *
 * @module stackelberg-pricing
 */

import { checkDrainability as _checkDrainability } from './drainability-guardrail-checker.js';
import { readStackelbergPricingConfig } from './settings.js';
import { solveStackelberg as _solveStackelberg } from './stackelberg-solver.js';
import type {
  DrainabilityGuardrail,
  GuardrailVerdict,
  PricingSolution,
  StackelbergGame,
  TenantUsage,
} from './types.js';

// ---------------------------------------------------------------------------
// Type re-exports
// ---------------------------------------------------------------------------

export type {
  CESUtilityParams,
  CobbDouglasUtilityParams,
  DrainabilityGuardrail,
  GuardrailDetail,
  GuardrailVerdict,
  PricingSolution,
  QuadraticUtilityParams,
  ResourceId,
  ResourcePool,
  StackelbergGame,
  Tenant,
  TenantId,
  TenantUsage,
  UtilityFunction,
  UtilityKind,
} from './types.js';

// ---------------------------------------------------------------------------
// Settings re-exports
// ---------------------------------------------------------------------------

export type { StackelbergPricingConfig } from './settings.js';
export {
  DEFAULT_STACKELBERG_PRICING_CONFIG,
  isStackelbergPricingEnabled,
  readStackelbergPricingConfig,
} from './settings.js';

// ---------------------------------------------------------------------------
// Utility model re-exports
// ---------------------------------------------------------------------------

export {
  cesBestResponse,
  cobbDouglasBestResponse,
  computeBestResponse,
  computeRevenue,
  evaluateCobbDouglas,
  evaluateCES,
  evaluateQuadratic,
  evaluateUtility,
  quadraticBestResponse,
  quadraticBestResponseMulti,
} from './utility-models.js';

// ---------------------------------------------------------------------------
// Guardrail re-exports
// ---------------------------------------------------------------------------

export {
  checkGuardrailFeasibility,
  computeGuardrailSlack,
} from './drainability-guardrail-checker.js';

// ---------------------------------------------------------------------------
// Solver re-export (named)
// ---------------------------------------------------------------------------

export { solveStackelberg as _solveStackelbergDirect } from './stackelberg-solver.js';

// ---------------------------------------------------------------------------
// Options for the public entry points
// ---------------------------------------------------------------------------

export interface SolveOptions {
  /** Override the settings file path (used by tests). */
  readonly settingsPath?: string;
  /** Force the flag on or off, bypassing the settings file (tests). */
  readonly forceEnabled?: boolean;
}

/**
 * Disabled sentinel returned when the opt-in flag is off.
 */
export interface DisabledResult {
  readonly disabled: true;
}

// ---------------------------------------------------------------------------
// `solveStackelberg()` — headline entry point (feature-flagged)
// ---------------------------------------------------------------------------

/**
 * Solve a Stackelberg game with drainability guardrails.
 *
 * The leader (platform operator) sets prices that maximise platform revenue
 * subject to the drainability constraint that no shared resource is drained
 * below its safety floor by the tenants' best-response demands.
 *
 * When the opt-in flag is OFF (the default), returns `{ disabled: true }`
 * with no computation performed.
 *
 * @param game    Stackelberg game specification.
 * @param options Optional overrides (settingsPath, forceEnabled).
 */
export function solveStackelberg(
  game: StackelbergGame,
  options: SolveOptions = {},
): PricingSolution | DisabledResult {
  const cfg = readStackelbergPricingConfig(options.settingsPath);
  const enabled =
    typeof options.forceEnabled === 'boolean'
      ? options.forceEnabled
      : cfg.enabled === true;

  if (!enabled) {
    return { disabled: true };
  }

  // Apply config overrides to grid steps if provided.
  const resolvedGame: StackelbergGame = {
    ...game,
    gridSteps: game.gridSteps ?? cfg.gridSteps ?? 20,
  };

  return _solveStackelberg(resolvedGame);
}

// ---------------------------------------------------------------------------
// `checkDrainability()` — guardrail check entry point (feature-flagged)
// ---------------------------------------------------------------------------

/**
 * Check whether tenant usage satisfies all drainability guardrails.
 *
 * When the opt-in flag is OFF (the default), returns `{ disabled: true }`
 * with no computation performed.
 *
 * @param usage      Tenants' realised resource consumption.
 * @param guardrails Per-resource drainability guardrail specifications.
 * @param options    Optional overrides (settingsPath, forceEnabled).
 */
export function checkDrainability(
  usage: readonly TenantUsage[],
  guardrails: readonly DrainabilityGuardrail[],
  options: SolveOptions = {},
): GuardrailVerdict | DisabledResult {
  const cfg = readStackelbergPricingConfig(options.settingsPath);
  const enabled =
    typeof options.forceEnabled === 'boolean'
      ? options.forceEnabled
      : cfg.enabled === true;

  if (!enabled) {
    return { disabled: true };
  }

  return _checkDrainability(usage, guardrails);
}
