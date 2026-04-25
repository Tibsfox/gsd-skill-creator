/**
 * CRAFT-role × model-tier → activation-space target mapper (Phase 767).
 *
 * Pure inference-time mapping — NO fine-tuning, NO model weights touched.
 * Each (role, tier) pair produces a deterministic target vector in
 * activation space at the requested dimensionality. The vectors are
 * orthogonal-ish basis-aligned signatures: each role activates a distinct
 * "subspace" (offset modulo dim) and each tier scales amplitude.
 *
 * This is a *direction-of-effect* mapper, not a learned probe — it is the
 * minimal stable target generator the controller needs to produce a
 * non-trivial steering delta. The Local-Linearity claim of arXiv:2604.19018
 * is what makes a direction-of-effect mapper sufficient: a small step in
 * any well-chosen direction in the locally-linear regime is approximately
 * additive in the model's output logit space.
 *
 * @module activation-steering/craft-role-mapper
 */

import {
  CRAFT_ROLES,
  MODEL_TIERS,
  type CRAFTRole,
  type ModelTier,
  type SteeringTarget,
} from './types.js';

// ----------------------------------------------------------------------------
// Per-tier amplitude. Smaller models receive a slightly larger steering
// amplitude — they are more affected by the perturbation per the
// local-linearity sensitivity analysis in arXiv:2604.19018 §4.
// ----------------------------------------------------------------------------
const TIER_AMPLITUDE: Readonly<Record<ModelTier, number>> = {
  Opus: 0.6,
  Sonnet: 0.8,
  Haiku: 1.0,
};

// ----------------------------------------------------------------------------
// Per-role basis offset. Each role anchors at a distinct index modulo dim.
// Five roles → five offsets {0, 1, 2, 3, 4}. The controller's K * (t - x)
// form means even a sparse target produces a meaningful delta.
// ----------------------------------------------------------------------------
const ROLE_OFFSET: Readonly<Record<CRAFTRole, number>> = {
  Coordinator: 0,
  Researcher: 1,
  Architect: 2,
  Forger: 3,
  Tactician: 4,
};

/**
 * Per-role secondary harmonic (different scale, same offset family). This
 * lets the target vector carry low-frequency structure beyond a single
 * spike, so the controller produces a smoother delta over the full vector.
 */
const ROLE_HARMONIC_PERIOD: Readonly<Record<CRAFTRole, number>> = {
  Coordinator: 5,
  Researcher: 7,
  Architect: 11,
  Forger: 13,
  Tactician: 17,
};

/**
 * Build the activation-space target for a (role, tier) pair at the given
 * dimensionality. Deterministic — same inputs always produce the same
 * vector.
 *
 * @param role  CRAFT role (one of five)
 * @param tier  Anthropic model tier (Opus/Sonnet/Haiku)
 * @param dim   Activation-space dimensionality (≥1)
 * @returns     Target with vector in `[-1, 1]^dim` and a debug label.
 */
export function buildTarget(
  role: CRAFTRole,
  tier: ModelTier,
  dim: number,
): SteeringTarget {
  if (!Number.isInteger(dim) || dim < 1) {
    throw new Error(`buildTarget: dim must be a positive integer, got ${dim}`);
  }
  const amp = TIER_AMPLITUDE[tier];
  const offset = ROLE_OFFSET[role];
  const period = ROLE_HARMONIC_PERIOD[role];
  const v: number[] = new Array(dim);
  for (let i = 0; i < dim; i++) {
    // Spike at offset modulo dim (always present even when dim > offset).
    const isSpike = i % Math.max(dim, 1) === offset % Math.max(dim, 1);
    const harmonic = Math.sin((2 * Math.PI * (i + offset)) / period);
    const base = isSpike ? 1.0 : 0.25 * harmonic;
    // Clamp to [-1, 1] — amp is in (0, 1] so |amp * base| ≤ 1 always holds.
    let val = amp * base;
    if (val > 1) val = 1;
    if (val < -1) val = -1;
    v[i] = val;
  }
  return {
    role,
    tier,
    vector: v,
    label: `${role.toLowerCase()}@${tier.toLowerCase()}`,
  };
}

/**
 * Enumerate all 5 × 3 = 15 (role, tier) combinations as targets.
 * Used by the test suite to verify every combination is mappable.
 */
export function enumerateAllTargets(dim: number): SteeringTarget[] {
  const targets: SteeringTarget[] = [];
  for (const role of CRAFT_ROLES) {
    for (const tier of MODEL_TIERS) {
      targets.push(buildTarget(role, tier, dim));
    }
  }
  return targets;
}
