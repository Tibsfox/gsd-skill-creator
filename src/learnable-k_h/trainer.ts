/**
 * MD-5 — Trainer for the per-skill learnable K_H head.
 *
 * The trainer performs gradient-descent updates on the linear head while
 * composing with the existing MB-1 Lyapunov adaptation law:
 *
 *   1. **ME-1 hard gate.** Only `tractable` skills may be trained. Coin-flip
 *      and unknown skills produce zero updates (the head remains untouched,
 *      and `resolveKH` falls back to the scalar K_H).
 *   2. **Hand-derived gradient** of the squared tracking error on the head's
 *      K_H output:
 *          L(K_H)   = 0.5 · (K_H − K_H_target)²
 *          dL/dK_H  = (K_H − K_H_target)
 *      With the head gradient `dK_H/dθ` (from `head.ts`), the parameter step
 *      becomes `θ ← θ − lr · (dL/dK_H) · dK_H/dθ`.
 *   3. **Lyapunov gate.** Before committing, the trainer builds the Sastry
 *      Lyapunov candidate (Sastry & Bodson 1989 eq 2.0.40) on a caller-
 *      supplied trajectory fixture and verifies that the proposed parameter
 *      update would not increase `V̇` above zero on any fixture step. If the
 *      gate fails the update is rejected and the head stays at its prior
 *      state (CF-MD5-05 guarantee).
 *
 * The trainer is stateless — each call takes the head (mutated in place on
 * accept) plus the observation and Lyapunov fixture, and returns a report.
 *
 * Pure except for the in-place head mutation on accept. No filesystem I/O.
 *
 * @module learnable-k_h/trainer
 */

import type { TractabilityClass } from '../ace/settings.js';
import { evaluateLyapunov } from '../lyapunov/lyapunov-function.js';
import {
  applyUpdateInPlace,
  cloneHead,
  forward,
  gradient,
  type LearnableKHHead,
} from './head.js';

// ---------------------------------------------------------------------------
// Trainer inputs / outputs
// ---------------------------------------------------------------------------

/**
 * One Lyapunov-fixture sample. Each sample represents a trajectory point
 * against which `V̇ ≤ 0` must hold after the proposed head update. The
 * trainer computes the candidate K_H with the *post-update* head at each
 * fixture point, feeds it into `evaluateLyapunov`, and rejects the update if
 * any `V̇ > tolerance`.
 */
export interface LyapunovFixtureSample {
  taskEmbed: readonly number[];
  observedRate: number;
  teachingDeclaredRate: number;
  targetKH: number;
  regressor: readonly number[];
  gainG: number;
  gainGamma: number;
  tractGain: number;
}

export interface TrainOptions {
  /** ME-1 classification — trainer hard-gates non-tractable skills. */
  tractability: TractabilityClass;
  /** Observed task embedding the trainer computes the update on. */
  taskEmbed: readonly number[];
  /** Target K_H for the current observation (e.g. from MB-1 desired trajectory). */
  targetKH: number;
  /** Learning rate. Default 0.01 (matches MB-1 `DEFAULT_GAIN_G`). */
  learningRate?: number;
  /**
   * Trajectory samples against which V̇ ≤ 0 must hold post-update. Empty
   * array disables the Lyapunov gate — for unit tests of the gradient path.
   */
  lyapunovFixture?: readonly LyapunovFixtureSample[];
  /** V̇ descent tolerance (numerical slack). Default 1e-9. */
  descentTolerance?: number;
}

export type TrainRejectionReason =
  | 'non-tractable'
  | 'lyapunov-violation'
  | 'non-finite-update';

export interface TrainResult {
  /** Whether the update was accepted and applied to the head. */
  accepted: boolean;
  /** Reason code when `accepted === false`. */
  reason?: TrainRejectionReason;
  /** Indices into `lyapunovFixture` where V̇ > tolerance (on rejection). */
  violatingFixtureSteps?: number[];
  /** Max post-update V̇ observed across the fixture (for diagnostics). */
  maxPostUpdateVdot?: number;
  /** Head's K_H before the update (at `taskEmbed`). */
  kHBefore: number;
  /** Head's K_H after the update (at `taskEmbed`); equals `kHBefore` on reject. */
  kHAfter: number;
  /** Number of fixture samples evaluated. */
  fixtureEvaluated: number;
}

// ---------------------------------------------------------------------------
// Core trainer
// ---------------------------------------------------------------------------

const DEFAULT_LR = 0.01;
const DEFAULT_TOL = 1e-9;

/**
 * Attempt one SGD step on the head using the squared tracking-error loss
 * `L = 0.5 · (K_H − targetKH)²`, then verify via the caller-supplied
 * Lyapunov fixture that the update preserves `V̇ ≤ 0`. On accept the head is
 * mutated in place; on reject the head is untouched.
 *
 * ME-1 gate: non-tractable skills return immediately with `reason =
 * 'non-tractable'` and no mutation.
 *
 * @param head — learnable-K_H head (mutated on accept)
 * @param opts — training configuration and Lyapunov fixture
 */
export function train(head: LearnableKHHead, opts: TrainOptions): TrainResult {
  const before = forward(head, opts.taskEmbed);

  // ME-1 hard gate — only tractable skills enter the learning path.
  if (opts.tractability !== 'tractable') {
    return {
      accepted: false,
      reason: 'non-tractable',
      kHBefore: before.kH,
      kHAfter: before.kH,
      fixtureEvaluated: 0,
    };
  }

  const lr = opts.learningRate !== undefined && Number.isFinite(opts.learningRate)
    ? opts.learningRate
    : DEFAULT_LR;
  const tolerance = opts.descentTolerance !== undefined && Number.isFinite(opts.descentTolerance)
    ? opts.descentTolerance
    : DEFAULT_TOL;

  // Squared-error loss gradient wrt K_H.
  const dLossdKH = before.kH - opts.targetKH;
  const headGrad = gradient(head, opts.taskEmbed, before);

  // Propose the update on a CLONE — trial apply, then gate.
  const proposal = cloneHead(head);
  // scaledGradient = lr · dLoss/dK_H ; applyUpdateInPlace does θ ← θ − scaledGradient · dK_H/dθ
  const scaledGradient = lr * dLossdKH;
  if (!Number.isFinite(scaledGradient)) {
    return {
      accepted: false,
      reason: 'non-finite-update',
      kHBefore: before.kH,
      kHAfter: before.kH,
      fixtureEvaluated: 0,
    };
  }
  applyUpdateInPlace(proposal, headGrad, scaledGradient);

  // Post-update sanity: head parameters must stay finite.
  if (!Number.isFinite(proposal.bias)) {
    return {
      accepted: false,
      reason: 'non-finite-update',
      kHBefore: before.kH,
      kHAfter: before.kH,
      fixtureEvaluated: 0,
    };
  }
  for (let i = 0; i < proposal.dim; i += 1) {
    if (!Number.isFinite(proposal.weights[i]!)) {
      return {
        accepted: false,
        reason: 'non-finite-update',
        kHBefore: before.kH,
        kHAfter: before.kH,
        fixtureEvaluated: 0,
      };
    }
  }

  // Lyapunov gate — verify V̇ ≤ 0 post-update at every fixture sample.
  const fixture = opts.lyapunovFixture ?? [];
  const violatingSteps: number[] = [];
  let maxVdot = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < fixture.length; i += 1) {
    const sample = fixture[i]!;
    const postKH = forward(proposal, sample.taskEmbed).kH;
    const c = evaluateLyapunov({
      observedRate: sample.observedRate,
      teachingDeclaredRate: sample.teachingDeclaredRate,
      effectiveK_H: postKH,
      targetK_H: sample.targetKH,
      regressor: sample.regressor.slice(),
      gainG: sample.gainG,
      gainGamma: sample.gainGamma,
      tractGain: sample.tractGain,
    });
    if (c.Vdot > maxVdot) maxVdot = c.Vdot;
    if (c.Vdot > tolerance) violatingSteps.push(i);
  }

  if (violatingSteps.length > 0) {
    return {
      accepted: false,
      reason: 'lyapunov-violation',
      violatingFixtureSteps: violatingSteps,
      maxPostUpdateVdot: maxVdot,
      kHBefore: before.kH,
      kHAfter: before.kH, // head untouched
      fixtureEvaluated: fixture.length,
    };
  }

  // Accept: commit the proposal onto the head.
  for (let i = 0; i < head.dim; i += 1) {
    head.weights[i] = proposal.weights[i]!;
  }
  head.bias = proposal.bias;
  head.updateCount = proposal.updateCount;

  const after = forward(head, opts.taskEmbed).kH;
  return {
    accepted: true,
    maxPostUpdateVdot: fixture.length > 0 ? maxVdot : undefined,
    kHBefore: before.kH,
    kHAfter: after,
    fixtureEvaluated: fixture.length,
  };
}
