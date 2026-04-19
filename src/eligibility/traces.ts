/**
 * MA-1 Eligibility-Trace Layer — core types and EligibilityStore.
 *
 * Implements TD(λ)-style eligibility traces over the MA-6 ReinforcementEvent
 * stream.  Each (skillId, channel) pair carries an independently-decaying
 * activation trace with a channel-specific time constant τ.
 *
 * Decay formula (Barto, Sutton & Anderson 1983, p. 841, Eq. 3):
 *   e(t+1) = δ · e(t) + (1 − δ) · r(t)
 *
 * where r(t) is the reinforcement magnitude of the event, and δ is
 * exp(−Δt / τ) computed from the elapsed wall-clock time since the last
 * event on that (skill, channel) pair.
 *
 * The EligibilityStore is PURE given a deterministic input stream:
 * identical event sequences produce identical trace snapshots.
 *
 * Source proposal: .planning/research/living-sensoria-refinement/proposals/MA-1-eligibility-traces.md
 * Primary source: Barto, A. G., Sutton, R. S., & Anderson, C. W. (1983).
 *   "Neuronlike Adaptive Elements That Can Solve Difficult Learning Control
 *   Problems." IEEE Trans. Syst. Man Cybern. SMC-13(5):834–846.
 *
 * @module eligibility/traces
 */

import type { ReinforcementChannel } from '../types/reinforcement.js';
import { decayForChannel, type DecayKernelOptions } from './decay-kernels.js';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * A single eligibility trace for one (skillId, channel) pair.
 *
 * `activation` is the current decayed value — analogous to eᵢ(t) in
 * Barto 1983 Eq. 3.  `lastUpdatedTs` is the wall-clock timestamp (ms since
 * epoch) of the last reinforcement event that touched this trace.
 *
 * Both fields are numeric so the trace round-trips through JSON without loss.
 */
export interface EligibilityTrace {
  /** Skill identifier (content-addressed name or hash). */
  skillId: string;
  /** One of the five canonical reinforcement channels. */
  channel: ReinforcementChannel;
  /**
   * Current eligibility activation in [−∞, +∞], typically bounded in [−1, 1]
   * by the magnitude clamp in the MA-6 writer.
   *
   * Pruned to zero (entry removed from store) when |activation| < PRUNE_EPSILON.
   */
  activation: number;
  /**
   * Timestamp (ms) of the most-recent reinforcement event that updated this
   * trace.  Used to compute Δt for the next decay step.
   */
  lastUpdatedTs: number;
}

/** Pruning threshold — traces below this magnitude are removed from the store. */
export const PRUNE_EPSILON = 1e-12;

/**
 * Lookup key for the eligibility map — stable string from (skillId, channel).
 * @internal
 */
function traceKey(skillId: string, channel: ReinforcementChannel): string {
  return `${skillId}\x00${channel}`;
}

// ─── EligibilityStore ─────────────────────────────────────────────────────────

/**
 * Maintains the per-(skill, channel) eligibility-trace map.
 *
 * The store is intentionally PURE in its update logic: given the same sequence
 * of `apply()` calls with the same timestamps, the resulting map is identical.
 * No wall-clock reads occur inside the store; callers supply `nowTs` explicitly.
 *
 * Thread-safety: single-threaded only (MA-1 Wave-1 boundary, per proposal §Failure modes §4).
 */
export class EligibilityStore {
  /**
   * Internal map from traceKey → EligibilityTrace.
   * Exposed as a method (not a public field) to prevent external mutation.
   */
  private readonly traces = new Map<string, EligibilityTrace>();

  private readonly kernelOpts: DecayKernelOptions;

  constructor(kernelOpts: DecayKernelOptions = {}) {
    this.kernelOpts = kernelOpts;
  }

  // ─── Core update ────────────────────────────────────────────────────────────

  /**
   * Apply one ReinforcementEvent observation to the store.
   *
   * Implements Barto 1983 Eq. 3 adapted for continuous-time decay:
   *
   *   δ = exp(−Δt / τ_channel)
   *   e(t+1) = δ · e(t) + (1 − δ) · r(t)
   *
   * where Δt = nowTs − lastUpdatedTs and r(t) = magnitude.
   *
   * @param skillId  - Skill the event originated from (or targeted by).
   * @param channel  - ReinforcementChannel discriminator.
   * @param magnitude - Reinforcement signal r(t) ∈ [−1, 1].
   * @param nowTs    - Current timestamp in milliseconds (caller-supplied for purity).
   */
  apply(
    skillId: string,
    channel: ReinforcementChannel,
    magnitude: number,
    nowTs: number,
  ): void {
    const key = traceKey(skillId, channel);
    const existing = this.traces.get(key);

    let newActivation: number;

    if (existing === undefined) {
      // First event: no prior trace to decay.  Initialise from magnitude.
      // δ=0 conceptually (no prior interval) → e = (1−0)·r = r  (first step)
      newActivation = magnitude;
    } else {
      const deltaMs = Math.max(0, nowTs - existing.lastUpdatedTs);
      const delta = decayForChannel(channel, deltaMs, this.kernelOpts);
      const oneMinusDelta = 1 - delta;
      newActivation = delta * existing.activation + oneMinusDelta * magnitude;
    }

    if (Math.abs(newActivation) < PRUNE_EPSILON) {
      this.traces.delete(key);
      return;
    }

    this.traces.set(key, {
      skillId,
      channel,
      activation: newActivation,
      lastUpdatedTs: nowTs,
    });
  }

  /**
   * Decay all traces in the store to a given timestamp WITHOUT adding a new
   * event.  Useful for computing a snapshot at an arbitrary point in time.
   *
   * Entries whose decayed activation falls below PRUNE_EPSILON are removed.
   *
   * @param nowTs - Target timestamp (ms).
   */
  decayAll(nowTs: number): void {
    for (const [key, trace] of this.traces) {
      const deltaMs = Math.max(0, nowTs - trace.lastUpdatedTs);
      const delta = decayForChannel(trace.channel, deltaMs, this.kernelOpts);
      const decayed = delta * trace.activation;
      if (Math.abs(decayed) < PRUNE_EPSILON) {
        this.traces.delete(key);
      } else {
        this.traces.set(key, {
          ...trace,
          activation: decayed,
          lastUpdatedTs: nowTs,
        });
      }
    }
  }

  // ─── Accessors ───────────────────────────────────────────────────────────────

  /**
   * Return the current activation for a specific (skillId, channel) pair,
   * or `null` if no trace exists (never observed or pruned).
   */
  getTrace(skillId: string, channel: ReinforcementChannel): number | null {
    const t = this.traces.get(traceKey(skillId, channel));
    return t === undefined ? null : t.activation;
  }

  /**
   * Return all currently-active traces as an immutable snapshot array.
   * Entries are in insertion order of their most-recent update.
   */
  getAllTraces(): EligibilityTrace[] {
    return Array.from(this.traces.values()).map((t) => ({ ...t }));
  }

  /**
   * Return the number of live (non-pruned) trace entries.
   * Used by CF-MA1-03 to assert bounded memory.
   */
  get size(): number {
    return this.traces.size;
  }

  /**
   * Reset the store to empty — used by replay driver to start from a clean
   * initial state.
   */
  reset(): void {
    this.traces.clear();
  }

  /**
   * Produce a deep-cloned snapshot of the store state.  Used by replay.ts
   * to emit consistent snapshots without referencing internal mutable state.
   */
  snapshot(): EligibilityTrace[] {
    return this.getAllTraces();
  }
}
