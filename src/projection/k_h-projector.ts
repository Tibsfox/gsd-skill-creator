/**
 * MB-2 — K_H projector adapter for M6 Sensoria.
 *
 * Wraps MB-1's `adaptKH` (or any K_H candidate value) with a smooth projection
 * onto the admissible interval `[K_L · floorRatio, K_H_max]`. This replaces
 * the hard `Math.max(floor, Math.min(ceiling, unclamped))` in `adaptKH` with
 * the smooth `smoothProject` primitive from `./smooth-projection.ts`.
 *
 * ## Lyapunov composability
 *
 * Per Sastry Theorem 2.4.3 (p. 65): projecting the candidate K_H onto the
 * admissible set preserves `V̇ ≤ 0` — specifically `V̇_Pr ≤ V̇ ≤ 0`. The
 * smooth projection here is applied AFTER MB-1's adaptation law produces the
 * unclamped `K_H_next`. By the theorem, the Lyapunov descent certificate from
 * MB-1 is automatically preserved through the projection.
 *
 * ## Default OFF
 *
 * When `projection.enabled = false` (the default), `projectKH` returns the
 * raw candidate unchanged — byte-identical to MB-1's hard-clamp behaviour at
 * the caller site (SC-MB2-01). The smooth projection activates only when
 * `projection.enabled = true`.
 *
 * Note: MB-1's internal `adaptKH` still applies a hard clamp internally.
 * MB-2's projector is the OUTER wrapper that the desensitisation-bridge (or
 * a future caller) would use instead of re-clamping. The two layers are
 * additive: MB-2 projection simply smooths what MB-1 would clamp.
 *
 * Source:
 *   .planning/research/living-sensoria-refinement/proposals/MB-2-projection-operators.md
 *
 * @module projection/k_h-projector
 */

import {
  adaptKH,
  type AdaptKHOptions,
  type AdaptKHResult,
} from '../lyapunov/k_h-adaptation.js';
import { smoothProject, type SmoothProjectionResult } from './smooth-projection.js';
import { getBounds, type GetBoundsOptions } from './parameter-bounds.js';
import { readProjectionEnabledFlag } from './settings.js';

// ---------------------------------------------------------------------------
// K_H projector options and result
// ---------------------------------------------------------------------------

export interface KHProjectorOptions extends AdaptKHOptions {
  /**
   * Override the projection-enabled flag. When provided, bypasses
   * `readProjectionEnabledFlag()`. Used primarily by tests.
   */
  projectionEnabled?: boolean;
  /**
   * Path to settings.json; passed through to `readProjectionEnabledFlag` when
   * `projectionEnabled` is not explicitly overridden.
   */
  settingsPath?: string;
  /**
   * Penalty strength for the smooth projection barrier (0 = hard clamp,
   * 0.1 = default). Forwarded to `smoothProject`.
   */
  penaltyStrength?: number;
  /**
   * Options forwarded to the parameter-bounds registry (e.g., tractability).
   */
  boundsOpts?: GetBoundsOptions;
}

export interface KHProjectorResult {
  /**
   * The MB-1 adaptation result (from `adaptKH`). Its `newKH` field contains
   * MB-1's internally-clamped value. When projection is enabled, `projectedKH`
   * supersedes `adaptation.newKH` as the authoritative new K_H.
   */
  adaptation: AdaptKHResult;
  /**
   * The smooth-projected K_H. When projection is disabled, this equals
   * `adaptation.newKH` (byte-identical fallback, SC-MB2-01).
   */
  projectedKH: number;
  /**
   * Smooth-projection result (penalty + derivative). Undefined when projection
   * is disabled.
   */
  projectionResult?: SmoothProjectionResult;
  /** Whether the smooth projection was actually applied. */
  projectionApplied: boolean;
}

// ---------------------------------------------------------------------------
// Core projector
// ---------------------------------------------------------------------------

/**
 * Apply MB-1's K_H adaptation law and then smooth-project the result onto
 * the admissible interval.
 *
 * Flag-off: calls `adaptKH` and returns its `newKH` unchanged (SC-MB2-01).
 * Flag-on: calls `adaptKH`, takes its unclamped `deltaKHRaw`, computes the
 * truly unclamped K_H_next, and smooth-projects onto `[floor, ceiling]`.
 *
 * The reason we work with the unclamped intermediate rather than projecting
 * `adaptation.newKH` is that `adaptKH` already applies a hard clamp
 * internally. Projecting the already-clamped value would have no effect.
 * Instead we reconstruct the unclamped candidate and apply smooth projection
 * before committing.
 *
 * Pure function (no side effects). The `projectionEnabled` override (or the
 * settings-file read) is the only I/O path.
 */
export function projectKH(opts: KHProjectorOptions): KHProjectorResult {
  const enabled = opts.projectionEnabled ?? readProjectionEnabledFlag(opts.settingsPath);

  // Always run the MB-1 adaptation law — provides the baseline result.
  const adaptation = adaptKH(opts);

  if (!enabled) {
    // Flag-off: return MB-1's internally-clamped result unchanged (SC-MB2-01).
    return {
      adaptation,
      projectedKH: adaptation.newKH,
      projectionResult: undefined,
      projectionApplied: false,
    };
  }

  // Flag-on: smooth-project the unclamped candidate.
  // Reconstruct the unclamped K_H_next = currentKH + deltaKHRaw.
  const unclamped = opts.currentKH + adaptation.deltaKHRaw;

  // Determine admissible interval from the caller's floor/ceiling (same as
  // adaptKH uses internally) — we mirror the bounds exactly.
  const ceiling = opts.ceiling !== undefined ? opts.ceiling : opts.targetKH;
  const floor = opts.floor !== undefined ? opts.floor : -Infinity;

  // If floor is -Infinity (no floor), get from registry.
  let effectiveLower: number;
  let effectiveUpper: number;

  if (Number.isFinite(floor) && Number.isFinite(ceiling)) {
    effectiveLower = floor;
    effectiveUpper = ceiling;
  } else {
    // Fall back to registry bounds for K_H.
    const regBounds = getBounds('K_H', opts.boundsOpts);
    effectiveLower = Number.isFinite(floor) ? floor : regBounds.lower;
    effectiveUpper = Number.isFinite(ceiling) ? ceiling : regBounds.upper;
  }

  const penaltyStrength = opts.penaltyStrength ?? 0.1;
  const projectionResult = smoothProject(unclamped, effectiveLower, effectiveUpper, penaltyStrength);

  return {
    adaptation,
    projectedKH: projectionResult.projected,
    projectionResult,
    projectionApplied: true,
  };
}

/**
 * Convenience wrapper: given a pre-computed `deltaKHRaw` (from a prior
 * `adaptKH` call), smooth-project the resulting K_H candidate onto
 * `[lower, upper]` without re-running the adaptation law.
 *
 * Used when the caller already holds `adaptKH`'s result and only wants to
 * apply the smooth projection as an additive post-processing step.
 */
export function projectKHCandidate(
  currentKH: number,
  deltaKHRaw: number,
  lower: number,
  upper: number,
  penaltyStrength: number = 0.1,
  enabled: boolean = true,
): SmoothProjectionResult {
  if (!enabled) {
    // Return hard-clamp result in the SmoothProjectionResult shape.
    const clamped = Math.max(lower, Math.min(upper, currentKH + deltaKHRaw));
    return { projected: clamped, penalty: 0, derivative: 1 };
  }
  const unclamped = currentKH + deltaKHRaw;
  return smoothProject(unclamped, lower, upper, penaltyStrength);
}
