/**
 * MA-1 Eligibility-Trace Layer — read API for MA-2 (phase 655).
 *
 * Provides the public surface that the MA-2 actor-critic update loop consumes
 * to retrieve eligibility traces produced by MA-1.
 *
 * Two access patterns are supported:
 *   1. Point query:  `getTraceFor(skillId, channel)` — O(1) lookup.
 *   2. Bulk query:   `getAllTracesAt(ts)` — full snapshot decayed to `ts`.
 *
 * The API wraps an `EligibilityStore` that has been pre-populated via
 * `replayEvents()` or incremental `store.apply()` calls.  The store is
 * NOT mutated by read operations.
 *
 * Source proposal: .planning/research/living-sensoria-refinement/proposals/MA-1-eligibility-traces.md
 * Primary source: Barto, A. G., Sutton, R. S., & Anderson, C. W. (1983).
 *   "Neuronlike Adaptive Elements That Can Solve Difficult Learning Control
 *   Problems." IEEE Trans. Syst. Man Cybern. SMC-13(5):834–846.
 *
 * @module eligibility/api
 */

import type { ReinforcementChannel } from '../types/reinforcement.js';
import type { DecayKernelOptions } from './decay-kernels.js';
import type { EligibilityTrace } from './traces.js';
import { EligibilityStore } from './traces.js';
import { replayEvents } from './replay.js';
import type { ReplayOptions } from './replay.js';
import type { ReinforcementEvent } from '../types/reinforcement.js';

// ─── EligibilityReader ─────────────────────────────────────────────────────────

/**
 * Read-only facade over an `EligibilityStore`.
 *
 * MA-2 constructs one of these after replaying the reinforcement log, then
 * calls `getTraceFor` / `getAllTracesAt` to retrieve the values it needs to
 * compute TD-error updates.
 *
 * The underlying store is cloned at construction time so external mutation
 * of the source store cannot affect the reader.
 */
export class EligibilityReader {
  private readonly store: EligibilityStore;

  constructor(store: EligibilityStore) {
    // Clone by snapshotting the live traces into a fresh store.
    // The EligibilityStore does not expose a copy constructor, so we
    // re-hydrate from the snapshot array.  This is O(|live traces|).
    this.store = new EligibilityStore(/* preserve defaults */);
    for (const trace of store.getAllTraces()) {
      // Re-insert each trace directly via apply() at its own lastUpdatedTs
      // with a Δt of 0 (no additional decay) — equivalent to a copy.
      // We use a fake "first event" scenario: pass lastUpdatedTs as nowTs so
      // Δt = 0 and the store initialises the entry at exactly `trace.activation`.
      //
      // Because EligibilityStore.apply() treats the first event specially
      // (initialises directly from magnitude), we can seed each entry by
      // calling apply once with Δt=0 — which sets activation = magnitude.
      this.store.apply(
        trace.skillId,
        trace.channel,
        trace.activation,
        trace.lastUpdatedTs,
      );
    }
  }

  /**
   * Return the current eligibility activation for a specific (skillId, channel)
   * pair, or `null` if no trace is live.
   *
   * This is the `eᵢ(t)` value from Barto 1983 Eq. 2 (p. 840):
   *   wᵢ(t+1) = wᵢ(t) + α · r(t) · eᵢ(t)
   *
   * MA-2 uses this directly as the eligibility factor in the weight update.
   *
   * @param skillId  - Skill to query.
   * @param channel  - ReinforcementChannel to query.
   */
  getTraceFor(
    skillId: string,
    channel: ReinforcementChannel,
  ): number | null {
    return this.store.getTrace(skillId, channel);
  }

  /**
   * Return all live traces decayed to the given timestamp.
   *
   * Creates a temporary clone of the internal store, applies decay to `ts`,
   * and returns the resulting snapshot.  The internal store is NOT mutated.
   *
   * @param ts - Target timestamp in milliseconds.
   */
  getAllTracesAt(ts: number): EligibilityTrace[] {
    // Clone again to avoid mutating the internal store.
    const clone = new EligibilityStore();
    for (const trace of this.store.getAllTraces()) {
      clone.apply(trace.skillId, trace.channel, trace.activation, trace.lastUpdatedTs);
    }
    clone.decayAll(ts);
    return clone.snapshot();
  }

  /**
   * Number of live (non-pruned) trace entries.
   */
  get size(): number {
    return this.store.size;
  }
}

// ─── Factory helpers ──────────────────────────────────────────────────────────

/**
 * Build an `EligibilityReader` from a pre-sorted event sequence.
 *
 * Convenience for MA-2 callers that already have the events in memory
 * (e.g. from `readReinforcementEvents`).
 *
 * @param events   - Array of ReinforcementEvents (need not be sorted; replay sorts internally).
 * @param options  - Replay options (kernel τ overrides, snapshotEvery, etc.).
 */
export function buildReaderFromEvents(
  events: ReinforcementEvent[],
  options: ReplayOptions = {},
): EligibilityReader {
  const store = new EligibilityStore(options.kernelOpts);
  // Re-use replayEvents to populate the store via its snapshot mechanism,
  // but we need the store directly.  We populate the store manually to avoid
  // redundant cloning.
  const extractSkillId = options.extractSkillId ?? defaultExtractSkillId;
  const sorted = events.slice().sort((a, b) => a.ts - b.ts);

  for (const event of sorted) {
    const skillId = extractSkillId(event);
    store.apply(skillId, event.channel, event.value.magnitude, event.ts);
  }

  return new EligibilityReader(store);
}

/**
 * Default skillId extractor (mirrors replay.ts — kept local to avoid circular
 * import between api.ts and replay.ts since replay.ts is not imported here).
 * @internal
 */
function defaultExtractSkillId(event: ReinforcementEvent): string {
  if (
    event.channel === 'explicit_correction' &&
    event.metadata &&
    typeof (event.metadata as { skillId?: unknown }).skillId === 'string'
  ) {
    return (event.metadata as { skillId: string }).skillId;
  }
  return event.actor;
}

// ─── Standalone query helpers ─────────────────────────────────────────────────

/**
 * Point query: return the activation for (skillId, channel) from a live store.
 *
 * Thin wrapper for callers that have direct store access rather than a reader.
 *
 * @param store    - Live EligibilityStore.
 * @param skillId  - Skill identifier.
 * @param channel  - Reinforcement channel.
 */
export function getTraceFor(
  store: EligibilityStore,
  skillId: string,
  channel: ReinforcementChannel,
): number | null {
  return store.getTrace(skillId, channel);
}

/**
 * Bulk query: return all traces from a live store decayed to `ts`.
 *
 * The store is NOT mutated — a clone is decayed internally.
 *
 * @param store  - Live EligibilityStore.
 * @param ts     - Target timestamp (ms).
 * @param opts   - Optional kernel overrides for the decay step.
 */
export function getAllTracesAt(
  store: EligibilityStore,
  ts: number,
  opts: DecayKernelOptions = {},
): EligibilityTrace[] {
  const clone = new EligibilityStore(opts);
  for (const trace of store.getAllTraces()) {
    clone.apply(trace.skillId, trace.channel, trace.activation, trace.lastUpdatedTs);
  }
  clone.decayAll(ts);
  return clone.snapshot();
}
