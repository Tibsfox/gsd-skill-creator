/**
 * MA-3 + MD-2 — Selector Bridge.
 *
 * Wraps M5's `ActivationSelector.select()` output with softmax-weighted
 * stochastic re-ranking when the feature flag is on AND execution is inside
 * an M4 branch context.
 *
 * Flag-off contract (SC-MA3-01 / LS-34):
 *   When `stochasticEnabled === false`, this bridge returns the input decisions
 *   list byte-identical to what M5 produced. No sorting, no mutation.
 *
 * Branch-context gating (CF-MA3-03):
 *   When `inBranchContext === false`, the bridge returns the deterministic
 *   M5 decisions unchanged, even if the flag is on and temperature > 0.
 *   Live-session stochasticity requires ME-3 validation first.
 *
 * T=0 safety valve (CF-MA3-01 / CF-MD2-01):
 *   When effective temperature ≤ 1e-9, the bridge returns the M5 decisions
 *   unchanged (argmax == top-k in a sorted list).
 *
 * Usage:
 *   ```ts
 *   import { applyStochasticBridge } from './selector-bridge.js';
 *
 *   const m5Decisions = await selector.select(query, candidates, context);
 *   const final = applyStochasticBridge(m5Decisions, {
 *     stochasticEnabled: readStochasticEnabledFlag(),
 *     inBranchContext: isInsideBranchContext(),
 *     baseTemperature: 1.0,
 *     tractabilityClass: getTractabilityClass(skill.output_structure),
 *     rng: mulberry32(branchSeed),
 *   });
 *   ```
 *
 * @module stochastic/selector-bridge
 */

import type { SelectorDecision } from '../orchestration/selector.js';
import type { TractabilityClass } from '../tractability/selector-api.js';
import { sampleByScore, mulberry32 } from './sampler.js';
import { resolveTemperature } from './temperature-resolver.js';
import { TEMPERATURE_EPSILON } from './softmax.js';

export type { TractabilityClass };

/** Options controlling bridge behaviour. */
export interface BridgeOptions {
  /**
   * Master feature flag. When false, returns decisions unchanged (SC-MA3-01).
   * Read from `gsd-skill-creator.orchestration.stochastic.enabled`.
   */
  stochasticEnabled: boolean;

  /**
   * Whether the current execution is inside an M4 branch context (CF-MA3-03).
   * When false, returns decisions unchanged (live-session deterministic path).
   */
  inBranchContext: boolean;

  /**
   * Base Boltzmann temperature before tractability scaling.
   * Must be ≥ 0. At 0 → deterministic (CF-MA3-01).
   */
  baseTemperature: number;

  /**
   * ME-1 tractability class for the active skill/context.
   * Controls the tractability scale factor applied to baseTemperature.
   */
  tractabilityClass: TractabilityClass;

  /**
   * Optional RNG function returning values in [0, 1).
   * Defaults to `Math.random`. Supply a seeded Mulberry32 for reproducibility.
   */
  rng?: () => number;
}

/**
 * Apply stochastic re-ordering to M5 selector decisions.
 *
 * The bridge does NOT mutate `decisions`. It returns either the original array
 * reference (flag-off or branch-context-off paths) or a new array with the
 * stochastically-promoted candidate moved to position 0.
 *
 * Only the top-selected candidate changes; the rest of the list is preserved
 * in their original M5 sort order. This is sufficient for the single-selection
 * use case in M5 (topK=1 or "activate highest-ranked").
 *
 * @param decisions        Sorted decisions from M5 `select()`. Position 0 = top-ranked.
 * @param opts             Bridge configuration.
 * @returns                Final decisions list. Position 0 = stochastically selected winner.
 */
export function applyStochasticBridge(
  decisions: SelectorDecision[],
  opts: BridgeOptions,
): SelectorDecision[] {
  // ── Flag-off short-circuit (SC-MA3-01) ─────────────────────────────────────
  if (!opts.stochasticEnabled) return decisions;

  // ── Branch-context gating (CF-MA3-03) ──────────────────────────────────────
  if (!opts.inBranchContext) return decisions;

  // ── Nothing to sample from ─────────────────────────────────────────────────
  if (decisions.length === 0) return decisions;

  // ── Resolve effective temperature ──────────────────────────────────────────
  const effectiveTemp = resolveTemperature(
    opts.baseTemperature,
    opts.tractabilityClass,
  );

  // ── T=0 safety valve (CF-MA3-01) ───────────────────────────────────────────
  if (effectiveTemp <= TEMPERATURE_EPSILON) return decisions;

  // ── Stochastic sampling ────────────────────────────────────────────────────
  const scores = decisions.map(d => d.score);
  const rng = opts.rng ?? Math.random;
  const result = sampleByScore(scores, effectiveTemp, rng);

  // If the sampled index is already the top candidate, return unchanged.
  if (result.index === 0) return decisions;

  // Promote the sampled candidate to position 0, preserving the rest of
  // the order (the M5 sort is still informative for tie-breaking).
  const reordered = [...decisions];
  const [chosen] = reordered.splice(result.index, 1);
  reordered.unshift(chosen);
  return reordered;
}

/**
 * Convenience re-export of the seeded PRNG so callers don't need to import
 * from sampler directly.
 */
export { mulberry32 };
