/**
 * MB-2 — Safety-Aware Projection (SAP) registration.
 *
 * Registers `safety-aware-projection` as a named MB-2 projection operator.
 * The underlying implementation lives in `src/safety/sap-probe.ts` (M7 canonical
 * primary location per `safety-aware-projection.md §Anti-patterns`). This module
 * is purely a registry shim — it exposes the SAP operator under the MB-2 naming
 * convention without moving any logic.
 *
 * Reference: arXiv:2505.16737 (Safety-Aware Probing).
 *
 * ## Composition with Sastry/Bodson stack
 *
 * The (I − P_S) projector is an orthogonal projection; it:
 *   - Cannot increase gradient L2 norm.
 *   - Is composable with MB-1 Lyapunov-stable updates (Vdot invariant preserved).
 *   - Is composable with MB-5 dead-zone bounded learning (dead zone applied before
 *     or after SAP — order is caller's choice, both orderings are safe).
 *
 * @module projection/sap-registration
 */

import { applySafetyProjection, type SapProbe } from '../safety/sap-probe.js';

// ---------------------------------------------------------------------------
// Named MB-2 operator descriptor
// ---------------------------------------------------------------------------

/** Name of the safety-aware projection operator in the MB-2 registry. */
export const SAP_OPERATOR_NAME = 'safety-aware-projection' as const;

/**
 * The registered safety-aware projection operator.
 *
 * Wraps `applySafetyProjection` from `src/safety/sap-probe.ts` with the named
 * operator interface expected by the MB-2 registry pattern.
 */
export interface SapOperator {
  /** Registry name — matches MB-2 naming convention. */
  name: typeof SAP_OPERATOR_NAME;
  /**
   * Apply the (I − P_S) projection to a gradient vector.
   *
   * @param gradient - Input gradient (length must match probe.dim).
   * @param probe    - Fitted SapProbe from `createSapProbe`.
   * @returns Gradient with safety-correlated directions removed.
   */
  apply: (gradient: number[], probe: SapProbe) => number[];
}

/**
 * The safety-aware projection operator registered for MB-2.
 *
 * Usage:
 * ```ts
 * import { sapOperator } from 'src/projection/sap-registration.js';
 * const projected = sapOperator.apply(gradient, probe);
 * ```
 */
export const sapOperator: SapOperator = {
  name: SAP_OPERATOR_NAME,
  apply: applySafetyProjection,
};
