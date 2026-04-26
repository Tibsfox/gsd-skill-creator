/**
 * SAP Gradient Gate — applies the (I − P_S) safety-aware projection to
 * co-evolution-ledger gradient updates before they are committed.
 *
 * Reference: arXiv:2505.16737 (Safety-Aware Probing).
 * Spec: `.planning/missions/julia-parameter-implementation/03-component-specs/safety-aware-projection.md §JP-025`.
 *
 * ## Contract
 *
 * - An un-projected gradient (one that still carries a non-trivial component
 *   along the safety subspace P_S) is REJECTED — `gateGradient` returns
 *   `{ accepted: false, projected: <the projected vector> }`.
 * - A gradient already orthogonal to P_S (‖P_S · g‖₂ < tolerance) is ACCEPTED
 *   and returned unchanged.
 * - Callers that want to apply the projection and then commit should pass the
 *   returned `projected` vector back in a second call, which will be accepted.
 *
 * The projection itself is delegated entirely to `applySafetyProjection` from
 * `src/safety/sap-probe.ts` — no duplication of the (I − P_S) maths here.
 *
 * @module symbiosis/sap-gradient-gate
 */

import { applySafetyProjection, l2Norm } from '../safety/sap-probe.js';
import type { SapProbe } from '../safety/sap-probe.js';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Result returned by `gateGradient`. */
export interface GateResult {
  /**
   * Whether the incoming gradient was accepted (already projected) or
   * rejected (contained a non-trivial safety-subspace component).
   */
  accepted: boolean;
  /**
   * The (I − P_S)-projected gradient.
   *
   * - If `accepted === true`: identical to the input gradient (up to
   *   floating-point rounding — same reference when the projection is a no-op).
   * - If `accepted === false`: the gradient after applying the SAP projection.
   *   The caller may commit this value on a follow-up call.
   */
  projected: number[];
  /**
   * L2 norm of the safety-subspace component removed.
   * Zero (or below tolerance) implies `accepted === true`.
   */
  safetyComponentNorm: number;
}

// ---------------------------------------------------------------------------
// Gate function
// ---------------------------------------------------------------------------

/**
 * Gate a co-evolution gradient through the (I − P_S) safety projection.
 *
 * @param grad     - Raw gradient vector from the co-evolution ledger update path.
 * @param sapProbe - A fitted SapProbe (from `src/safety/sap-probe.ts`).
 * @param tolerance - L2 norm threshold below which the safety component is
 *                    considered zero and the gradient is accepted.  Default 1e-9.
 * @returns `GateResult` with `accepted` flag, projected vector, and norm of the
 *          removed safety component.
 */
export function gateGradient(
  grad: number[],
  sapProbe: SapProbe,
  tolerance = 1e-9,
): GateResult {
  // Apply (I − P_S) projection.
  const projected = applySafetyProjection(grad, sapProbe);

  // Measure how much was removed: ‖grad − projected‖₂
  const diff = grad.map((v, i) => v - projected[i]!);
  const safetyComponentNorm = l2Norm(diff);

  const accepted = safetyComponentNorm < tolerance;

  return { accepted, projected, safetyComponentNorm };
}
