/**
 * MB-2 — Declarative parameter-bounds registry.
 *
 * Central registry of admissible-set bounds for each parameter type in the
 * M6/M7 stack. Replaces magic numbers scattered across modules with a single
 * authoritative source.
 *
 * Parameter types:
 *   - `K_H`            — high-affinity binding constant (M6 Sensoria)
 *   - `K_L`            — low-affinity binding constant (M6 Sensoria)
 *   - `cond_prob_cell`  — single cell in M7 conditional-probability table
 *   - `prior_cell`     — single cell in M7 prior vector
 *
 * Tractability scaling (MB-1 gain table mirrors):
 *   The effective bounds are tightened for coin-flip skills to reduce the
 *   "safe" parameter region — mirroring MB-1's gain table where coin-flip
 *   skills receive 0.3× gain. Tighter bounds provide an additional safety
 *   margin by keeping coin-flip skill parameters closer to their starting
 *   values.
 *
 * Source:
 *   .planning/research/living-sensoria-refinement/proposals/MB-2-projection-operators.md
 *   src/sensoria/frontmatter.ts (DEFAULT_SENSORIA for K_H/K_L defaults)
 *
 * @module projection/parameter-bounds
 */

import type { TractabilityClass } from '../ace/settings.js';

// ---------------------------------------------------------------------------
// Parameter type catalogue
// ---------------------------------------------------------------------------

/**
 * All parameter types known to the projection subsystem.
 */
export type ParameterType =
  | 'K_H'
  | 'K_L'
  | 'cond_prob_cell'
  | 'prior_cell';

/**
 * Admissible-set bounds for a scalar parameter. Both bounds are inclusive.
 * `lower ≤ upper` is guaranteed by the registry; if not, the registry returns
 * the global safe fallback.
 */
export interface ParameterBounds {
  /** Inclusive lower bound. */
  lower: number;
  /** Inclusive upper bound. */
  upper: number;
  /** Penalty-strength for the smooth projection barrier (0 = hard clamp). */
  penaltyStrength: number;
  /** Human-readable description for diagnostic logging. */
  description: string;
}

// ---------------------------------------------------------------------------
// Base bounds table (tractability-agnostic)
// ---------------------------------------------------------------------------

/**
 * Base bounds before tractability scaling. Derived from:
 *   - K_H/K_L: DEFAULT_SENSORIA (frontmatter.ts) + documented M6 parameter ranges.
 *   - cond_prob_cell: probability simplex cell, always in [0, 1].
 *   - prior_cell: probability simplex cell, always in [0, 1].
 *
 * These are the outer limits — tractability scaling narrows the effective range
 * toward these limits for coin-flip skills.
 */
const BASE_BOUNDS: Record<ParameterType, ParameterBounds> = {
  K_H: {
    lower: 0,
    upper: 100,
    penaltyStrength: 0.1,
    description: 'K_H high-affinity binding constant (M6 Sensoria)',
  },
  K_L: {
    lower: 0,
    upper: 10,
    penaltyStrength: 0.1,
    description: 'K_L low-affinity binding constant (M6 Sensoria)',
  },
  cond_prob_cell: {
    lower: 0,
    upper: 1,
    penaltyStrength: 0.05,
    description: 'Conditional-probability table cell p(obs|intent) (M7 Umwelt)',
  },
  prior_cell: {
    lower: 0,
    upper: 1,
    penaltyStrength: 0.05,
    description: 'Prior probability cell p(intent) (M7 Umwelt)',
  },
};

// ---------------------------------------------------------------------------
// Tractability scaling
// ---------------------------------------------------------------------------

/**
 * Tractability-scaled bound-tightening factor. For coin-flip skills the
 * effective upper bound is tightened toward the midpoint by this factor.
 *
 * Mirrors the MB-1 gain table:
 *   tractable  → 1.0 (no tightening — full range)
 *   unknown    → 0.8 (slight tightening)
 *   coin-flip  → 0.5 (substantial tightening — 50% of full range from lower)
 */
const TRACTABILITY_BOUND_SCALE: Record<TractabilityClass, number> = {
  tractable: 1.0,
  unknown: 0.8,
  'coin-flip': 0.5,
};

// ---------------------------------------------------------------------------
// Registry API
// ---------------------------------------------------------------------------

/**
 * Options for `getBounds`.
 */
export interface GetBoundsOptions {
  /**
   * Tractability class for the owning skill. When provided, the effective
   * upper bound is tightened for coin-flip skills per the documented gain
   * table. Default: 'tractable' (no tightening).
   */
  tractability?: TractabilityClass;
  /**
   * Override the lower bound for this specific instance. When provided,
   * `max(override, base.lower)` is used.
   */
  lowerOverride?: number;
  /**
   * Override the upper bound for this specific instance. When provided,
   * `min(override, effectiveUpper)` is used.
   */
  upperOverride?: number;
}

/**
 * Return the admissible-set bounds for a parameter type, optionally scaled by
 * tractability class and/or caller-provided overrides.
 *
 * This is the primary entry point for the projection subsystem. All parameter
 * bounds MUST be sourced from this registry — never hard-code bounds in callers.
 */
export function getBounds(
  type: ParameterType,
  opts: GetBoundsOptions = {},
): ParameterBounds {
  const base = BASE_BOUNDS[type];
  const tractability = opts.tractability ?? 'tractable';
  const scale = TRACTABILITY_BOUND_SCALE[tractability];

  // Tighten upper bound for coin-flip and unknown skills.
  const range = base.upper - base.lower;
  const effectiveUpper = base.lower + range * scale;

  // Apply caller overrides (never exceed the base range).
  const lower = opts.lowerOverride !== undefined
    ? Math.max(base.lower, opts.lowerOverride)
    : base.lower;
  const upper = opts.upperOverride !== undefined
    ? Math.min(effectiveUpper, opts.upperOverride)
    : effectiveUpper;

  return {
    lower: Math.min(lower, upper),
    upper: Math.max(lower, upper),
    penaltyStrength: base.penaltyStrength,
    description: base.description,
  };
}

/**
 * Return all registered parameter types. Useful for coverage checks.
 */
export function allParameterTypes(): ParameterType[] {
  return Object.keys(BASE_BOUNDS) as ParameterType[];
}

/**
 * Validate that a value is within the admissible set for the given parameter
 * type and tractability class. Returns `true` iff `lower ≤ value ≤ upper`.
 */
export function isAdmissible(
  value: number,
  type: ParameterType,
  opts: GetBoundsOptions = {},
): boolean {
  const { lower, upper } = getBounds(type, opts);
  return value >= lower && value <= upper;
}

/**
 * Return the `TRACTABILITY_BOUND_SCALE` table (read-only) for external inspection.
 * Exposed for test fixtures that need to verify the scale factors.
 */
export function getTractabilityBoundScale(): Readonly<Record<TractabilityClass, number>> {
  return TRACTABILITY_BOUND_SCALE;
}
