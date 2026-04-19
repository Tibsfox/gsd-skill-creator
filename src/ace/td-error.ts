/**
 * MA-2 ACE — TD-error computation.
 *
 * Phase 655 / v1.49.561 Refinement R2. Implements the temporal-difference
 * error δ that wires M7's expected-free-energy reduction (ΔF) to M5's
 * ActivationSelector — the classical Barto/Sutton/Anderson (1983) ASE/ACE
 * loop adapted for our stack.
 *
 * Core identity (Barto 1983 Eq. 5 p. 842, with the sign-correct mapping
 * `p(t) = −F(t)` per Friston 2013 §"Active inference and agency"):
 *
 *     δ(t) = r̄(t) + γ·[−F(t)] − [−F(t−1)]
 *          = r̄(t) + γ·ΔF_curr − ΔF_prev       (storing `−F` directly)
 *
 * where:
 *   - `r̄(t)` is the eligibility-weighted reinforcement averaged across
 *     the five MA-6 channels at this tick.
 *   - `γ ∈ [0, 1]` is the TD discount; default 0.95 (Barto 1983 p. 844).
 *   - `ΔF_curr`, `ΔF_prev` are the negated free-energy values for the current
 *     and previous ticks (callers supply them pre-negated — i.e. `−F(t)`).
 *
 * The final δ is scaled by a **tractability weight** in [0.3, 1] derived from
 * ME-1's `{tractable, coin-flip, unknown}` classification and confidence
 * (LS-29). The weight is applied, not gated — on coin-flip/unknown skills the
 * signal attenuates to 0.3× rather than zeroing (avoids the eternal-silence
 * bug; see `settings.TRACTABILITY_WEIGHT_FLOOR`).
 *
 * Source proposal:
 *   .planning/research/living-sensoria-refinement/proposals/MA-2-ace-reinforcement.md
 * Primary sources:
 *   - Barto, A. G., Sutton, R. S., & Anderson, C. W. (1983). IEEE TSMC SMC-13(5):834-846.
 *   - Friston, K., Schwartenbeck, P., FitzGerald, T., Moutoussis, M.,
 *     Behrens, T., Dolan, R. J. (2013). Frontiers in Human Neuroscience 7:598.
 *
 * @module ace/td-error
 */

import type { ReinforcementChannel } from '../types/reinforcement.js';
import { REINFORCEMENT_CHANNELS } from '../types/reinforcement.js';
import { DEFAULT_GAMMA, tractabilityWeight, type TractabilityClass } from './settings.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Per-channel eligibility reading at the current tick.
 *
 * `value` is the decayed eligibility activation from MA-1
 * (`EligibilityReader.getTraceFor`). `reinforcement` is the MA-6 `r(t)` scalar
 * for the event (if any) that arrived on this channel this tick; `0` when no
 * event fired this tick on that channel.
 */
export interface ChannelReading {
  channel: ReinforcementChannel;
  /** Current eligibility trace value for this (skill, channel). */
  eligibility: number;
  /** Reinforcement scalar r(t) on this channel this tick (0 if no event). */
  reinforcement: number;
}

export interface TDErrorOptions {
  /** TD discount factor γ ∈ [0, 1]. Default `DEFAULT_GAMMA` (0.95). */
  gamma?: number;
  /**
   * Tractability class for the skill whose actor weights we are about to
   * update. Drives the weighting per LS-29.
   */
  tractabilityClass?: TractabilityClass;
  /** ME-1 confidence in `[0, 1]`. Default 1 (backward-compat). */
  tractabilityConfidence?: number;
  /**
   * Direct weight override. When supplied, bypasses
   * `tractabilityWeight(cls, confidence)` and uses this value (clamped to the
   * floor). Useful for tests and for callers that compose their own weight.
   */
  tractabilityWeight?: number;
}

export interface TDErrorResult {
  /** The raw TD error before tractability weighting. */
  rawDelta: number;
  /** The tractability weight actually applied. */
  weight: number;
  /** The final scaled TD error consumed by `actor-update.ts`. */
  delta: number;
  /** The eligibility-weighted reinforcement scalar r̄(t). */
  rBar: number;
  /** Components, for trace / telemetry. */
  components: {
    gamma: number;
    deltaFPrev: number;
    deltaFCurr: number;
  };
}

// ---------------------------------------------------------------------------
// Core computation
// ---------------------------------------------------------------------------

/**
 * Compute r̄(t): the eligibility-weighted average reinforcement across the
 * five MA-6 channels.
 *
 * Semantics:
 *   r̄ = Σ_c (|e_c| · r_c) / Σ_c |e_c|
 *
 * Using `|e_c|` (not `e_c` itself) preserves magnitude contribution regardless
 * of the sign of the eligibility trace — a negatively-signed correction trace
 * still counts its magnitude toward the weighting denominator. The numerator
 * uses signed `e_c · r_c` so the reinforcement direction is preserved.
 *
 * Falls back to the arithmetic mean when every eligibility is exactly zero
 * (no live traces this tick), preserving directional information from any
 * reinforcement events that may still be arriving.
 *
 * @internal — exposed for tests.
 */
export function averageReinforcementAcrossChannels(
  readings: readonly ChannelReading[],
): number {
  if (readings.length === 0) return 0;
  let num = 0;
  let denom = 0;
  for (const rd of readings) {
    const w = Math.abs(rd.eligibility);
    num += rd.eligibility * rd.reinforcement;
    denom += w;
  }
  if (denom > 0) {
    return num / denom;
  }
  // No live traces — unweighted mean across reinforcement events this tick.
  let sum = 0;
  for (const rd of readings) sum += rd.reinforcement;
  return sum / readings.length;
}

/**
 * Resolve the tractability weight from the options object, falling back
 * through: explicit override → `(class, confidence)` mapping → floor.
 */
function resolveWeight(opts: TDErrorOptions): number {
  if (opts.tractabilityWeight !== undefined && Number.isFinite(opts.tractabilityWeight)) {
    // Clamp: honour the floor to prevent eternal-silence bug.
    return Math.max(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      0.3,
      Math.min(1, opts.tractabilityWeight!),
    );
  }
  const cls = opts.tractabilityClass ?? 'unknown';
  const conf = opts.tractabilityConfidence ?? 1;
  return tractabilityWeight(cls, conf);
}

/**
 * Compute the TD error for one tick of the actor-critic loop.
 *
 * Signature:
 *   δ = weight · ( r̄ + γ · ΔF_curr − ΔF_prev )
 *
 * Caller responsibilities:
 *   - `readings` must contain one entry per channel the caller tracks. It is
 *     not required to cover all five channels — missing channels are treated
 *     as zero-eligibility, zero-reinforcement.
 *   - `deltaFPrev` / `deltaFCurr` are the **negated** free-energy values
 *     (`−F(t−1)` and `−F(t)`). This lets M7 consumers store "value-like"
 *     quantities directly and makes the positive-direction intuition explicit.
 *     Callers with raw `F` values should pass `-F` explicitly.
 *   - `options.tractabilityWeight`, when supplied, overrides the class/conf
 *     mapping — callers already holding a confidence-scaled weight should use
 *     this path.
 *
 * Flag-off note: this function never reads settings.json directly; the ACE
 * loop in `loop.ts` consults `readAceEnabledFlag()` and short-circuits before
 * calling here when the flag is off.
 */
export function computeTDError(
  readings: readonly ChannelReading[],
  deltaFPrev: number,
  deltaFCurr: number,
  options: TDErrorOptions = {},
): TDErrorResult {
  const gamma = options.gamma ?? DEFAULT_GAMMA;
  const rBar = averageReinforcementAcrossChannels(readings);
  const rawDelta = rBar + gamma * deltaFCurr - deltaFPrev;
  const weight = resolveWeight(options);
  const delta = weight * rawDelta;
  return {
    rawDelta,
    weight,
    delta,
    rBar,
    components: {
      gamma,
      deltaFPrev,
      deltaFCurr,
    },
  };
}

/**
 * Convenience: canonicalise a sparse set of `(channel → reading)` pairs into
 * the full five-channel readings array, padding missing channels with zeros.
 *
 * Callers that prefer a map-shaped input can feed this helper rather than
 * constructing the array by hand.
 */
export function readingsFromMap(
  byChannel: Partial<Record<ReinforcementChannel, Omit<ChannelReading, 'channel'>>>,
): ChannelReading[] {
  const out: ChannelReading[] = [];
  for (const ch of REINFORCEMENT_CHANNELS) {
    const entry = byChannel[ch];
    if (entry !== undefined) {
      out.push({ channel: ch, eligibility: entry.eligibility, reinforcement: entry.reinforcement });
    } else {
      out.push({ channel: ch, eligibility: 0, reinforcement: 0 });
    }
  }
  return out;
}
