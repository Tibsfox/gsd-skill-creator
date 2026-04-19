/**
 * MA-1 Eligibility-Trace Layer — reinforcement log replay driver.
 *
 * Reads the canonical reinforcement.jsonl log produced by the MA-6 writer,
 * applies per-channel eligibility decay, and emits `EligibilityTrace[]`
 * snapshots at configurable intervals.
 *
 * The replay driver is PURE given a deterministic input stream: the same log
 * file always produces the same sequence of snapshots.  No wall-clock reads
 * occur inside the driver; timestamps are consumed from the event records.
 *
 * The driver does NOT modify reinforcement events.  It is a read-only consumer
 * of the MA-6 log.
 *
 * Source proposal: .planning/research/living-sensoria-refinement/proposals/MA-1-eligibility-traces.md
 * Primary source: Barto, A. G., Sutton, R. S., & Anderson, C. W. (1983).
 *   "Neuronlike Adaptive Elements That Can Solve Difficult Learning Control
 *   Problems." IEEE Trans. Syst. Man Cybern. SMC-13(5):834–846. Eq. (3) p. 841.
 *
 * @module eligibility/replay
 */

import { promises as fs } from 'node:fs';
import { readReinforcementEvents } from '../reinforcement/writer.js';
import type { ReinforcementEvent } from '../types/reinforcement.js';
import { r as extractR } from '../types/reinforcement.js';
import type { DecayKernelOptions } from './decay-kernels.js';
import type { EligibilityTrace } from './traces.js';
import { EligibilityStore } from './traces.js';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * A snapshot of the full eligibility store emitted at a point in the replay.
 */
export interface EligibilitySnapshot {
  /** Timestamp (ms) of the event that triggered this snapshot. */
  ts: number;
  /** Sequential index within the replay (0-based event index or interval index). */
  index: number;
  /** All live traces at this snapshot point. */
  traces: EligibilityTrace[];
}

/**
 * Options for `replayReinforcementLog`.
 */
export interface ReplayOptions {
  /**
   * Emit a snapshot every N events.  Default: emit only a final snapshot.
   * Set to 1 to emit after every single event.
   */
  snapshotEvery?: number;
  /**
   * Optional skillId extractor — derive the skill being targeted from an event.
   * Default: uses `event.metadata.skillId` if present on explicit_correction,
   * otherwise uses `event.actor`.
   */
  extractSkillId?: (event: ReinforcementEvent) => string;
  /**
   * Per-channel τ overrides passed through to the decay kernels.
   */
  kernelOpts?: DecayKernelOptions;
  /**
   * When true, emit a snapshot at every event index regardless of snapshotEvery.
   * Equivalent to snapshotEvery=1 but more readable at the call site.
   */
  snapshotAll?: boolean;
}

// ─── Default skillId extractor ────────────────────────────────────────────────

/**
 * Default strategy for mapping a ReinforcementEvent to a skillId.
 *
 * Priority order:
 *   1. metadata.skillId (explicit_correction channel carries this when M8 sets it)
 *   2. event.actor (the component that emitted the event — a reasonable proxy)
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

// ─── Core replay function ─────────────────────────────────────────────────────

/**
 * Replay a sequence of ReinforcementEvents through the eligibility store.
 *
 * This is a pure, synchronous function over an in-memory event array.
 * See `replayReinforcementLog` for the async file-reading wrapper.
 *
 * Implements Barto 1983 Eq. 3 (p. 841) across all five channels:
 *   e(t+1) = δ · e(t) + (1 − δ) · r(t)
 * where δ = exp(−Δt / τ_channel).
 *
 * @param events   - Ordered sequence of reinforcement events (ascending ts).
 * @param options  - Replay configuration.
 * @returns        - Array of snapshots emitted during replay, plus a final snapshot.
 */
export function replayEvents(
  events: ReinforcementEvent[],
  options: ReplayOptions = {},
): EligibilitySnapshot[] {
  const {
    snapshotEvery,
    extractSkillId = defaultExtractSkillId,
    kernelOpts = {},
    snapshotAll = false,
  } = options;

  const store = new EligibilityStore(kernelOpts);
  const snapshots: EligibilitySnapshot[] = [];

  const effectiveSnapshotEvery =
    snapshotAll ? 1 : (snapshotEvery ?? null);

  // Sort events by ts to guarantee deterministic replay regardless of
  // insertion order in the log (the JSONL file is append-only but callers
  // may build fixture arrays in any order).
  const sorted = events.slice().sort((a, b) => a.ts - b.ts);

  for (let i = 0; i < sorted.length; i++) {
    const event = sorted[i]!;
    const skillId = extractSkillId(event);
    const magnitude = extractR(event);

    store.apply(skillId, event.channel, magnitude, event.ts);

    const shouldSnapshot =
      effectiveSnapshotEvery !== null &&
      (i + 1) % effectiveSnapshotEvery === 0;

    if (shouldSnapshot) {
      snapshots.push({
        ts: event.ts,
        index: i,
        traces: store.snapshot(),
      });
    }
  }

  // Always emit a final snapshot so callers always receive at least one result.
  const lastEvent = sorted[sorted.length - 1];
  if (lastEvent !== undefined) {
    snapshots.push({
      ts: lastEvent.ts,
      index: sorted.length - 1,
      traces: store.snapshot(),
    });
  }

  return snapshots;
}

/**
 * Read the canonical reinforcement.jsonl log from disk and replay it through
 * the eligibility store.
 *
 * Wraps `replayEvents` with the MA-6 reader so the caller does not need to
 * know the log format.  Returns an empty array (with no snapshots) if the log
 * does not exist.
 *
 * @param logPath  - Path to the reinforcement JSONL log.
 * @param options  - Replay configuration.
 */
export async function replayReinforcementLog(
  logPath: string,
  options: ReplayOptions = {},
): Promise<EligibilitySnapshot[]> {
  let events: ReinforcementEvent[];
  try {
    events = await readReinforcementEvents(logPath);
  } catch {
    // Non-existent log is not an error — the store starts empty.
    events = [];
  }

  if (events.length === 0) return [];

  return replayEvents(events, options);
}

/**
 * Convenience: replay a log file and return only the final snapshot's traces.
 *
 * Returns [] if the log is empty or does not exist.
 */
export async function getFinalTraces(
  logPath: string,
  options: ReplayOptions = {},
): Promise<EligibilityTrace[]> {
  const snapshots = await replayReinforcementLog(logPath, options);
  if (snapshots.length === 0) return [];
  return snapshots[snapshots.length - 1]!.traces;
}

/**
 * Replay an in-memory fixture and return the final traces.
 *
 * Convenience wrapper for tests and MA-2 consumers that already have
 * the event array in memory.
 */
export function getFinalTracesFromEvents(
  events: ReinforcementEvent[],
  options: ReplayOptions = {},
): EligibilityTrace[] {
  const snapshots = replayEvents(events, options);
  if (snapshots.length === 0) return [];
  return snapshots[snapshots.length - 1]!.traces;
}
