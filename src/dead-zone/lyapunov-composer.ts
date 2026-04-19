/**
 * MB-5 Dead-Zone Bounded Learning — Lyapunov composer.
 *
 * Composes MB-1's Lyapunov descent guarantee (V̇ ≤ 0) with the MB-5 dead-zone
 * adaptation scale. Provides a certificate that dead-zone activation maintains
 * V̇ ≤ 0 across a fixture trajectory.
 *
 * Theory (Sastry & Bodson 1989, Theorem 5.7.1, p. 252):
 *
 *   Let V̇_raw be the Lyapunov time-derivative under the unmodified adaptation
 *   law (MB-1). When the dead-zone scale `s ∈ [0, 1]` multiplies the update
 *   magnitude:
 *
 *     V̇_dz = s · V̇_raw   (inside the zone: s = 0, V̇_dz = 0)
 *
 *   Since s ≥ 0 and V̇_raw ≤ 0 by MB-1's certificate:
 *
 *     V̇_dz = s · V̇_raw ≤ 0  (product of non-negative × non-positive)
 *
 *   The descent invariant is preserved.
 *
 * This module provides:
 *   - `composedVdot(Vdot_raw, adaptScale)` — scalar composition.
 *   - `verifyComposedDescent(trajectory)` — trajectory certificate verifier
 *     for LS-33: checks V̇_dz ≤ 0 at every step including zone entry/exit.
 *
 * LS-33 requirement: on a 100-step fixture trajectory that ENTERS, RESIDES IN,
 * and EXITS the dead-zone, the composed V̇ ≤ 0 at every step.
 *
 * Source proposal:
 *   .planning/research/living-sensoria-refinement/proposals/MB-5-dead-zone-bounded-learning.md
 *
 * @module dead-zone/lyapunov-composer
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A single step of a composed trajectory.
 */
export interface ComposedStep {
  /** Step index in the trajectory. */
  step: number;

  /** Raw V̇ from MB-1 (should be ≤ 0 by MB-1 certificate). */
  Vdot_raw: number;

  /** Dead-zone adaptation scale at this step ∈ [0, 1]. */
  adaptScale: number;

  /** Composed V̇ = adaptScale · V̇_raw. Always ≤ 0 when MB-5 composes correctly. */
  Vdot_composed: number;

  /** Whether the step is inside the dead-zone (adaptScale < inside_threshold). */
  insideDeadZone: boolean;
}

/**
 * Certificate for a composed descent trajectory.
 */
export interface ComposedDescentCertificate {
  /** True iff V̇_composed ≤ tolerance at every step. */
  holds: boolean;

  /** Step indices where V̇_composed > tolerance (failures). */
  failures: number[];

  /** Per-step composed trajectory. */
  steps: ComposedStep[];

  /** Number of steps that entered the dead-zone (adaptScale < inside_threshold). */
  deadZoneActivations: number;

  /** Number of zone-entry events (step where inside flipped from false to true). */
  zoneEntries: number;

  /** Number of zone-exit events (step where inside flipped from true to false). */
  zoneExits: number;

  /** Tolerance used for the V̇ ≤ 0 check. */
  tolerance: number;
}

// ---------------------------------------------------------------------------
// composedVdot — scalar composition
// ---------------------------------------------------------------------------

/**
 * Compute the composed Lyapunov time-derivative after dead-zone modification.
 *
 * Per Sastry Theorem 5.7.1: V̇_dz = s · V̇_raw where s ∈ [0, 1].
 * Since s ≥ 0 and V̇_raw ≤ 0, V̇_dz ≤ 0.
 *
 * @param Vdot_raw   - Raw V̇ from MB-1 evaluateLyapunov (should be ≤ 0).
 * @param adaptScale - Adaptation scale from `adaptationScale()` ∈ [0, 1].
 * @returns Composed V̇_dz = adaptScale · Vdot_raw.
 */
export function composedVdot(Vdot_raw: number, adaptScale: number): number {
  const s = Number.isFinite(adaptScale)
    ? Math.max(0, Math.min(1, adaptScale))
    : 0;
  return s * (Number.isFinite(Vdot_raw) ? Vdot_raw : 0);
}

// ---------------------------------------------------------------------------
// verifyComposedDescent — trajectory certificate
// ---------------------------------------------------------------------------

/**
 * Verify the composed descent certificate along a multi-step trajectory.
 *
 * Accepts a sequence of `{ Vdot_raw, adaptScale }` pairs (pre-computed by the
 * caller using `evaluateLyapunov` from MB-1 and `adaptationScale` from
 * `diff-bound-adapter.ts`) and verifies that V̇_composed ≤ 0 at every step.
 *
 * Also counts zone-entry and zone-exit events (adaptScale crossing the
 * `insideThreshold`) to provide the LS-33 "enters, resides in, exits" evidence.
 *
 * @param trajectory      - Sequence of raw V̇ and scale pairs.
 * @param tolerance       - Numerical tolerance for V̇ ≤ 0 check (default 1e-9).
 * @param insideThreshold - adaptScale below this → inside dead-zone (default 0.1).
 * @returns ComposedDescentCertificate.
 */
export function verifyComposedDescent(
  trajectory: ReadonlyArray<{ Vdot_raw: number; adaptScale: number }>,
  tolerance: number = 1e-9,
  insideThreshold: number = 0.1,
): ComposedDescentCertificate {
  const steps: ComposedStep[] = [];
  const failures: number[] = [];
  let deadZoneActivations = 0;
  let zoneEntries = 0;
  let zoneExits = 0;
  let prevInside = false;

  for (let i = 0; i < trajectory.length; i++) {
    const { Vdot_raw, adaptScale } = trajectory[i]!;
    const Vdot_composed = composedVdot(Vdot_raw, adaptScale);
    const s = Number.isFinite(adaptScale) ? Math.max(0, Math.min(1, adaptScale)) : 0;
    const insideDeadZone = s < insideThreshold;

    if (insideDeadZone) {
      deadZoneActivations++;
    }
    if (insideDeadZone && !prevInside) {
      zoneEntries++;
    }
    if (!insideDeadZone && prevInside) {
      zoneExits++;
    }
    prevInside = insideDeadZone;

    if (Vdot_composed > tolerance) {
      failures.push(i);
    }

    steps.push({ step: i, Vdot_raw, adaptScale, Vdot_composed, insideDeadZone });
  }

  return {
    holds: failures.length === 0,
    failures,
    steps,
    deadZoneActivations,
    zoneEntries,
    zoneExits,
    tolerance,
  };
}

// ---------------------------------------------------------------------------
// Convenience: build a fixture trajectory for testing
// ---------------------------------------------------------------------------

/**
 * Build a fixture trajectory that enters, resides in, and exits the dead-zone.
 *
 * Used by CF-MB5-04 and LS-33 tests. The trajectory has three phases:
 *   1. Outside zone: adaptScale = 1.0 (large diff magnitude, allowed zone).
 *   2. Zone entry: adaptScale transitions from 1.0 to ~0 (diff crosses threshold).
 *   3. Inside zone: adaptScale ≈ 0 (diff way above threshold).
 *   4. Zone exit: adaptScale transitions back from ~0 to 1.0.
 *   5. Outside zone: adaptScale = 1.0.
 *
 * V̇_raw is generated as a monotone-decreasing (negative) sequence using a
 * Lyapunov-like decay: V̇_raw[t] = −gainG · e[t]² where e[t] → 0 over time.
 *
 * @param steps         - Total trajectory length (default 100).
 * @param gainG         - Gain parameter matching MB-1 default (default 0.01).
 * @param entryFrac     - Fraction of steps in the "approach" phase (default 0.25).
 * @param insideFrac    - Fraction of steps fully inside the zone (default 0.50).
 * @returns Array suitable for `verifyComposedDescent`.
 */
export function buildFixtureTrajectory(
  steps: number = 100,
  gainG: number = 0.01,
  entryFrac: number = 0.25,
  insideFrac: number = 0.50,
): Array<{ Vdot_raw: number; adaptScale: number }> {
  const trajectory: Array<{ Vdot_raw: number; adaptScale: number }> = [];

  const entryEnd  = Math.floor(steps * entryFrac);
  const insideEnd = Math.floor(steps * (entryFrac + insideFrac));
  // exit phase: insideEnd → steps−entryEnd
  const exitStart = insideEnd;
  const exitEnd   = steps - entryEnd;

  for (let i = 0; i < steps; i++) {
    // Tracking error decays toward 0 over the trajectory
    const e = 1.0 * Math.exp(-gainG * i);
    const Vdot_raw = -gainG * e * e;  // ≤ 0 by construction (MB-1 descent)

    // Adaptation scale: varies by phase
    let adaptScale: number;
    if (i < entryEnd) {
      // Phase 1: outside zone, scale = 1.0
      adaptScale = 1.0;
    } else if (i < exitStart) {
      // Phase 2+3: transition into and inside zone
      const t = (i - entryEnd) / Math.max(1, entryEnd);
      // Sigmoid drop from 1 → 0 during transition, then stays at 0
      const transitionLen = entryEnd;
      const atTransition = i - entryEnd;
      if (atTransition < transitionLen) {
        // Sigmoid: at t=0 → ~1, at t=transitionLen → ~0
        const z = 6 * (atTransition / transitionLen - 0.5);  // -3 to +3
        const sig = 1 / (1 + Math.exp(z));  // decreasing sigmoid
        adaptScale = Math.max(0, Math.min(1, sig));
      } else {
        adaptScale = 0.02;  // Deep inside zone
      }
      void t;  // suppress unused-variable
    } else if (i < exitEnd) {
      // Phase 4: exit transition
      const atExit = i - exitStart;
      const exitLen = exitEnd - exitStart;
      const z = 6 * (atExit / Math.max(1, exitLen) - 0.5);  // -3 to +3
      const sig = 1 / (1 + Math.exp(-z));  // increasing sigmoid
      adaptScale = Math.max(0, Math.min(1, sig));
    } else {
      // Phase 5: back outside zone
      adaptScale = 1.0;
    }

    trajectory.push({ Vdot_raw, adaptScale });
  }

  return trajectory;
}
