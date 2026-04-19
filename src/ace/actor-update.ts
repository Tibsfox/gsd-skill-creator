/**
 * MA-2 ACE — Actor Update Signal.
 *
 * Phase 655 / v1.49.561 Refinement R2. Translates a tractability-weighted TD
 * error into a typed `ActorSignal` that M5's `ActivationSelector` consumes.
 *
 * This module is the **signal-provision layer** — it produces the payload the
 * selector uses as a score nudge, but it does NOT take a policy-gradient step
 * on the selector's internal weights. A full policy-gradient update on K_H /
 * selector weights is MA-5's territory (later wave); Wave 1 ships the wire
 * (actor receives signal, incorporates into scoring) and defers the gradient.
 *
 * Markov-blanket compliance (Kirchhoff et al. 2018 §2–3):
 *   r(t) arrives at SENSORY states (MA-6 emitters).
 *   F(t) trajectory is INTERNAL (M7 minimiser).
 *   δ is an INTERNAL scalar (this module's input).
 *   The ActorSignal → selector delivery is an ACTIVE-state action.
 * No cross-blanket leak (resolves SUMMARY §4 Tension 5 / T-5).
 *
 * Source proposal:
 *   .planning/research/living-sensoria-refinement/proposals/MA-2-ace-reinforcement.md
 *
 * @module ace/actor-update
 */

import type { ReinforcementChannel } from '../types/reinforcement.js';
import type { ChannelReading } from './td-error.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * The payload M5's `ActivationSelector.select()` consumes via the optional
 * `aceSignal` parameter on the decision context.
 *
 * Semantics:
 *   - `delta` is the tractability-weighted TD error (post-weighting).
 *   - `weight` is the tractability weight that was applied — exposed so the
 *     selector can log it in the M3 trace.
 *   - `perChannelEligibility` is the per-channel eligibility snapshot at the
 *     tick when `delta` was computed; the selector uses it to spread the
 *     signal across the five canonical channels with sign-preserving
 *     proportionality.
 *   - `tick` is the monotone tick counter from the ACE loop, for traceability.
 *
 * The selector's scoring logic, when `actor_critic.ace.enabled = true`, adds
 * `delta * propensity(candidate)` to the composite score. Flag off → ignored.
 */
export interface ActorSignal {
  /** Tractability-weighted TD error. */
  delta: number;
  /** Tractability weight that was applied. */
  weight: number;
  /** Per-channel eligibility snapshot at the tick when δ was computed. */
  perChannelEligibility: Partial<Record<ReinforcementChannel, number>>;
  /** Monotone tick counter from the ACE loop. */
  tick: number;
}

export interface ActorUpdateOptions {
  /**
   * Upper bound on `|delta|` in the emitted signal. Acts as a soft clamp so a
   * runaway free-energy transient cannot swamp the selector's scoring. Set
   * to `Infinity` to disable. Default 1.0 (matches MA-6 magnitude clamp).
   */
  maxAbsDelta?: number;
}

// ---------------------------------------------------------------------------
// Build actor signal
// ---------------------------------------------------------------------------

/**
 * Project the readings list onto the per-channel eligibility map the actor
 * signal carries. Only channels that were present in the readings array are
 * included (missing channels are simply absent from the partial record).
 */
function eligibilityMap(
  readings: readonly ChannelReading[],
): Partial<Record<ReinforcementChannel, number>> {
  const out: Partial<Record<ReinforcementChannel, number>> = {};
  for (const r of readings) {
    out[r.channel] = r.eligibility;
  }
  return out;
}

/**
 * Construct an `ActorSignal` from a computed TD-error and the readings used
 * to compute it. Applies the `maxAbsDelta` clamp if configured.
 *
 * @param delta           The tractability-weighted TD error (output of
 *                        `computeTDError(...).delta`).
 * @param weight          The tractability weight that was applied.
 * @param readings        The per-channel readings the TD error was computed
 *                        from; used to populate `perChannelEligibility`.
 * @param tick            Monotone tick counter from the ACE loop.
 * @param options         Soft clamp configuration.
 */
export function buildActorSignal(
  delta: number,
  weight: number,
  readings: readonly ChannelReading[],
  tick: number,
  options: ActorUpdateOptions = {},
): ActorSignal {
  const maxAbs = options.maxAbsDelta ?? 1.0;
  let clamped = delta;
  if (Number.isFinite(maxAbs) && maxAbs >= 0) {
    if (clamped > maxAbs) clamped = maxAbs;
    else if (clamped < -maxAbs) clamped = -maxAbs;
  }
  if (!Number.isFinite(clamped)) clamped = 0;
  return {
    delta: clamped,
    weight,
    perChannelEligibility: eligibilityMap(readings),
    tick,
  };
}

/**
 * Apply an `ActorSignal` to a candidate's composite score.
 *
 * The per-candidate "propensity" is the sum of eligibility magnitudes across
 * all channels present in the signal — i.e. how "alive" this candidate is in
 * the eligibility memory this tick. Candidates with no eligibility trace
 * receive zero nudge (signal does not pollute scoring for unrelated skills).
 *
 * This is the **consumer-side helper** the selector calls when
 * `actor_critic.ace.enabled = true`. When the flag is off, the selector does
 * not invoke this at all — the flag-off path is byte-identical (SC-MA2-01).
 *
 * @param baseScore      The pre-ACE composite score from M1+M2+(M6).
 * @param signal         The ActorSignal from the ACE loop.
 * @param candidateProp  A pre-computed per-candidate propensity in `[0, 1]`
 *                       (e.g. sum of |e_c| for this candidate's traces,
 *                       normalised). Zero → no effect.
 * @returns              `baseScore + signal.delta * candidateProp`.
 */
export function applyActorSignalToScore(
  baseScore: number,
  signal: ActorSignal,
  candidateProp: number,
): number {
  if (!Number.isFinite(candidateProp) || candidateProp === 0) return baseScore;
  const prop = Math.max(0, Math.min(1, candidateProp));
  return baseScore + signal.delta * prop;
}
