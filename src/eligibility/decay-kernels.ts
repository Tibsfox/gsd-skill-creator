/**
 * MA-1 Eligibility-Trace Layer — per-channel decay kernels.
 *
 * Each of the five MA-6 reinforcement channels has a distinct time constant τ
 * that controls how quickly eligibility decays between events.  The decay
 * factor δ for a time interval Δt is:
 *
 *   δ(Δt) = exp(−Δt / τ)          (continuous-time exponential kernel)
 *
 * This is the standard exponential eligibility-trace kernel as described in
 * Barto, Sutton & Anderson (1983).  The discrete recurrence relation (Eq. 3,
 * p. 841) becomes exact in the limit of uniform time steps; the continuous
 * form generalises to irregular inter-event intervals typical of developer
 * workflow sessions.
 *
 * Barto 1983 equation references:
 *   Eq. (3), p. 841:  eᵢ(t+1) = δ·eᵢ(t) + (1−δ)·y(t)·xᵢ(t)
 *     — the discrete recurrence; δ is our per-channel decay factor.
 *   p. 844 col. 1:    δ = 0.9 (empirical value for ~10 Hz pole-balance loop).
 *     — our τ values are chosen to give similar one-step δ at each channel's
 *       expected inter-event cadence (see per-channel comments below).
 *
 * Primary source: Barto, A. G., Sutton, R. S., & Anderson, C. W. (1983).
 *   "Neuronlike Adaptive Elements That Can Solve Difficult Learning Control
 *   Problems." IEEE Trans. Syst. Man Cybern. SMC-13(5):834–846.
 *
 * @module eligibility/decay-kernels
 */

import type { ReinforcementChannel } from '../types/reinforcement.js';

// ─── Time constant defaults (ms) ─────────────────────────────────────────────

/**
 * τ constants in milliseconds for each of the five reinforcement channels.
 *
 * All values are configurable per call site (see DecayKernelOptions).
 * Defaults are chosen so that:
 *   - One typical inter-event interval yields δ ≈ 0.9, matching Barto 1983
 *     p. 844 col. 1 empirical value for a ~10 Hz loop.
 *   - Channels with longer semantic horizons carry credit further back.
 *
 * Barto 1983 Eq. (3), p. 841 — eᵢ(t+1) = δ·eᵢ(t) + (1−δ)·y(t)·xᵢ(t):
 *   δ is the multiplier applied to the OLD trace value before accumulation.
 *   A larger τ means a slower decay → credit reaches further into the past.
 */

/**
 * explicit_correction: τ = 7 days (604 800 000 ms).
 *
 * Corrections are high-signal, intentional feedback.  Credit should persist
 * across multi-day working sessions so a skill corrected Monday still carries
 * a non-negligible trace through Friday.  Barto 1983 Eq. 3 applied with
 * a week-scale τ: after 7 days of silence δ = exp(−1) ≈ 0.368, meaning ~37%
 * of the correction's eligibility is still live — adequate for weekly review.
 */
export const TAU_EXPLICIT_CORRECTION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * outcome_observed: τ = 1 hour (3 600 000 ms).
 *
 * Outcomes (test pass/fail, build green) are tied to recent actions within the
 * current working session.  After 1 hour of silence δ = exp(−1) ≈ 0.368; the
 * full trace decays to near-zero (<1e-12) after ~28 hours, aligning with the
 * "within-session" semantic.  Barto 1983 Eq. 3 at this scale means a test
 * failure a few minutes ago still assigns meaningful credit.
 */
export const TAU_OUTCOME_OBSERVED_MS = 60 * 60 * 1000; // 1 hour

/**
 * branch_resolved: τ = 24 hours (86 400 000 ms).
 *
 * Branch commits/aborts reflect multi-step decisions that span hours.  A 24 h
 * τ gives δ = exp(−1) ≈ 0.368 at the daily boundary; meaningful credit persists
 * for ~3 days (2.3 × τ gives δ ≈ 0.1, below significant threshold).
 * Barto 1983 Eq. 3: the accumulate term carries the outcome back to the skills
 * that were active during the branch lifetime.
 */
export const TAU_BRANCH_RESOLVED_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * surprise_triggered: τ = 10 minutes (600 000 ms).
 *
 * Surprise events (M7 KL-divergence threshold crossings) are highly local in
 * time — they credit the specific decision that caused the unexpected output.
 * After 10 minutes δ = exp(−1) ≈ 0.368; after ~30 minutes the trace is
 * negligible.  This is the fastest kernel, matching the sub-session cadence
 * of prediction errors.  Barto 1983 p. 841 §VII: eligibility decays to zero
 * when too much time has elapsed since the credited action.
 */
export const TAU_SURPRISE_TRIGGERED_MS = 10 * 60 * 1000; // 10 minutes

/**
 * quintessence_updated: τ = 3 days (259 200 000 ms).
 *
 * Quintessence axis recomputations reflect rolling-axis credit — how the
 * system's overall self-assessment shifted.  A 3-day τ gives δ = exp(−1)
 * ≈ 0.368 at the 3-day mark; meaningful credit extends ~10 days (within a
 * two-week sprint cycle).  Barto 1983 Eq. 3 at this scale aligns with the
 * "episodic" nature of axis reviews (daily or every few days).
 */
export const TAU_QUINTESSENCE_UPDATED_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

// ─── Configurable options ─────────────────────────────────────────────────────

/**
 * Per-channel τ overrides.  Omitting a key uses the channel's default τ.
 *
 * Barto 1983 p. 844 col. 1: δ = 0.9 was empirically tuned for a ~10 Hz loop.
 * For developer-workflow cadences (seconds to minutes between events),
 * time-constant-based decay is the principled substitute.  These overrides
 * expose the knob for A/B testing under the ME-3 harness (Wave 3).
 */
export interface DecayKernelOptions {
  tauExplicitCorrectionMs?: number;
  tauOutcomeObservedMs?: number;
  tauBranchResolvedMs?: number;
  tauSurpriseTriggeredMs?: number;
  tauQuintessenceUpdatedMs?: number;
}

// ─── Kernel implementation ────────────────────────────────────────────────────

/**
 * Return the time-constant (τ in ms) for a given channel, applying any
 * override from the options object.
 */
export function tauForChannel(
  channel: ReinforcementChannel,
  opts: DecayKernelOptions = {},
): number {
  switch (channel) {
    case 'explicit_correction':
      return opts.tauExplicitCorrectionMs ?? TAU_EXPLICIT_CORRECTION_MS;
    case 'outcome_observed':
      return opts.tauOutcomeObservedMs ?? TAU_OUTCOME_OBSERVED_MS;
    case 'branch_resolved':
      return opts.tauBranchResolvedMs ?? TAU_BRANCH_RESOLVED_MS;
    case 'surprise_triggered':
      return opts.tauSurpriseTriggeredMs ?? TAU_SURPRISE_TRIGGERED_MS;
    case 'quintessence_updated':
      return opts.tauQuintessenceUpdatedMs ?? TAU_QUINTESSENCE_UPDATED_MS;
  }
}

/**
 * Compute the exponential decay factor δ for a given channel over an elapsed
 * interval Δt (milliseconds).
 *
 * Formula (continuous-time extension of Barto 1983 Eq. 3, p. 841):
 *
 *   δ(Δt) = exp(−Δt / τ_channel)
 *
 * Properties:
 *   - δ(0) = 1.0  (no time elapsed → no decay)
 *   - δ(τ) ≈ 0.368  (one time-constant elapsed)
 *   - δ → 0 as Δt → ∞  (trace fully decays)
 *   - δ is always in [0, 1] for Δt ≥ 0
 *
 * Barto 1983 Eq. (3), p. 841:
 *   eᵢ(t+1) = δ·eᵢ(t) + (1−δ)·y(t)·xᵢ(t)
 *   — this function returns the δ coefficient.
 *
 * @param channel  - One of the five canonical reinforcement channels.
 * @param deltaMs  - Elapsed time in milliseconds since the last event.
 * @param opts     - Optional τ overrides.
 */
export function decayForChannel(
  channel: ReinforcementChannel,
  deltaMs: number,
  opts: DecayKernelOptions = {},
): number {
  if (deltaMs <= 0) return 1.0;
  const tau = tauForChannel(channel, opts);
  return Math.exp(-deltaMs / tau);
}

/**
 * Compute the decay factor directly from a (τ_ms, Δt_ms) pair — useful for
 * testing and for the TD(λ) reference implementation.
 *
 * Same formula as `decayForChannel` but without the channel lookup.
 *
 * Barto 1983 Eq. (3), p. 841 — the δ in the accumulating-trace recurrence.
 */
export function decayFromTau(tauMs: number, deltaMs: number): number {
  if (deltaMs <= 0) return 1.0;
  if (tauMs <= 0) return 0.0;
  return Math.exp(-deltaMs / tauMs);
}

/**
 * Return the number of milliseconds after which a trace decays below the
 * pruning threshold (1e-12) from an initial activation of 1.0.
 *
 * Solves: exp(−t / τ) < 1e-12  →  t > τ · ln(1e12) ≈ τ · 27.63
 *
 * Useful for tests and for validating that τ choices produce sensible lifetimes.
 */
export function pruneHorizonMs(
  channel: ReinforcementChannel,
  opts: DecayKernelOptions = {},
): number {
  const tau = tauForChannel(channel, opts);
  return tau * Math.log(1e12); // ln(1/1e-12) = ln(1e12)
}
