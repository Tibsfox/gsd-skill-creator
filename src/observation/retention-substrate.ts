/**
 * Production substrate consumer for the `observation.retention_days`
 * calibratable threshold (v1.49.891 — closes the v884 deferred half).
 *
 * v884 wired the READ side (calibration loop can load observation-retention
 * events). v891 wires the WRITE side: a production code path that reads
 * `observation.retention_days` from the skill-creator config, applies it to
 * the `RetentionManager` for JSONL pruning, AND auto-emits an
 * `ObservationRetentionEvent` per sweep so the calibration loop has
 * traffic-attributed observations to draw on.
 *
 * Mirrors v837 → v846 (predictive-low-confidence wire → substrate auto-emit)
 * and v884 → v888 (observation-retention read-side → ... and now substrate).
 *
 * ## Outcome-driven auto-emit kind (v1.49.982 — F4 debt fix)
 *
 * The emitted `kind` is DERIVED from the real sweep outcome via an
 * age-pressure band, not a hardcoded constant. Let
 * `R = oldestRetainedAgeDays / retention_days` (how deep into the retention
 * window the surviving data reaches), measured after the sweep:
 *
 * - `retainedCount === 0 && prunedCount > 0` → `too_aggressive` (-1): the
 *   window dropped the entire corpus; raise it.
 * - `retainedCount > 0 && prunedCount > 0 && R >= band.high` → `too_aggressive`:
 *   entries are being dropped at a packed edge; there is demand for a longer
 *   window.
 * - `retainedCount > 0 && R < band.low` → `too_lax` (+1): the surviving data
 *   is far younger than the window, so `retention_days` is set looser than the
 *   data lifespan warrants (tightening an over-generous policy — NOT a
 *   storage-bloat detector). Lower it.
 * - otherwise (in-band, or an empty corpus) → NEUTRAL: no event is emitted.
 *
 * Before v982 this was a hardcoded `too_aggressive` on every sweep, which made
 * the on-disk signal one-directional and the calibration loop a false
 * vindication. See `docs/retention-substrate-outcome-driven-debt.md`.
 *
 * An explicit `defaultKind` option still overrides the derivation (the CLI
 * manual recorder path: `bounded-learning --record-event --threshold
 * observation.retention_days --kind too_lax`). The band edges are an exported
 * default (`DEFAULT_AGE_PRESSURE_BAND`) overridable per call.
 *
 * ## Failure contract (Lesson #10427 + #10437)
 *
 * `appendObservationRetentionEvent` is invoked fire-and-forget. Disk-full
 * or permission-denied during the auto-emit MUST NOT break the sweep —
 * forensic surface per #10427, subscriber-gated observability-only pattern
 * per #10437.
 *
 * @module observation/retention-substrate
 */

import { RetentionManager } from './retention-manager.js';
import type { PruneStats } from './retention-manager.js';
import { appendObservationRetentionEvent } from '../bounded-learning/observation-retention-events.js';
import type { ObservationRetentionEventKind } from '../bounded-learning/observation-retention-events.js';

/**
 * Age-pressure band: the `[low, high]` edges (as fractions of
 * `retention_days`) that classify a sweep outcome. See module docstring.
 */
export interface AgePressureBand {
  /** Below this `R` fraction → `too_lax` (window over-generous). */
  low: number;
  /** At/above this `R` fraction with drops → `too_aggressive` (window tight). */
  high: number;
}

/**
 * Default age-pressure band (v1.49.982). Conservative edges: a sweep emits a
 * directional signal only when the surviving corpus is younger than half the
 * window (`too_lax`) or packed within 10% of it while still dropping
 * (`too_aggressive`); the middle [0.5, 0.9) is treated as in-band (no emit).
 *
 * These are an operator-tunable default per
 * `docs/retention-substrate-outcome-driven-debt.md`. Not yet promoted to
 * schema config (a clean follow-up); override per call via
 * `RetentionSweepOptions.agePressureBand`.
 */
export const DEFAULT_AGE_PRESSURE_BAND: AgePressureBand = { low: 0.5, high: 0.9 };

/**
 * Derive the retention-sweep outcome `kind` from the prune stats and the
 * age-pressure band, or `null` for an in-band / no-basis sweep (no emit).
 */
export function deriveAgePressureKind(
  stats: PruneStats,
  retentionDays: number,
  band: AgePressureBand = DEFAULT_AGE_PRESSURE_BAND,
): ObservationRetentionEventKind | null {
  // Dropped the entire corpus → window is brutally short.
  if (stats.retainedCount === 0) {
    return stats.prunedCount > 0 ? 'too_aggressive' : null;
  }
  // No usable window denominator → cannot judge.
  if (retentionDays <= 0 || stats.oldestRetainedAgeDays === null) return null;

  const ratio = stats.oldestRetainedAgeDays / retentionDays;
  // Dropping at a packed edge → demand for a longer window.
  if (stats.prunedCount > 0 && ratio >= band.high) return 'too_aggressive';
  // Surviving data far younger than the window → window over-generous.
  if (ratio < band.low) return 'too_lax';
  // In-band: healthy steady state.
  return null;
}

/**
 * Minimal shape of the skill-creator config consumed here. Avoids importing
 * the full `SkillCreatorConfig` type to keep this module's surface narrow.
 */
export interface ObservationRetentionConfig {
  observation: {
    retention_days: number;
    /**
     * Optional count cap (`observation.max_entries`, config default 1000).
     * When provided, the sweep keeps at most this many newest entries in
     * addition to the age prune. When omitted, the `RetentionManager` default
     * (100) applies — preserving the pre-v1.49.946 behavior for callers that
     * thread only `retention_days`.
     */
    max_entries?: number;
  };
}

export interface RetentionSweepOptions {
  /**
   * When false, disables the auto-emit. Default true. Operators who want a
   * pure prune without observability emit pass `{ autoEmit: false }`.
   */
  autoEmit?: boolean;
  /**
   * Override the path the auto-emit writes to. Defaults to the events
   * module's default JSONL location.
   */
  eventsPath?: string;
  /**
   * Force the auto-emit kind, bypassing the age-pressure derivation. Used by
   * the CLI manual recorder. When omitted (the production default), `kind` is
   * derived from the real sweep outcome and an in-band sweep emits nothing.
   */
  defaultKind?: 'too_aggressive' | 'too_lax';
  /**
   * Override the age-pressure band edges used to derive `kind`. Defaults to
   * {@link DEFAULT_AGE_PRESSURE_BAND}.
   */
  agePressureBand?: AgePressureBand;
}

export interface RetentionSweepResult {
  prunedCount: number;
  /** Entries that survived the sweep (v1.49.982). */
  retainedCount: number;
  retentionDays: number;
  /**
   * The effective count cap applied (the threaded `max_entries`, or the
   * `RetentionManager` default of 100 when none was threaded).
   */
  maxEntries: number;
  /**
   * The derived (or forced) outcome kind that was emitted, or `null` when the
   * sweep was in-band / no-basis and no event was emitted (v1.49.982).
   */
  emittedKind: ObservationRetentionEventKind | null;
}

/**
 * Run a retention sweep using `observation.retention_days` from the config,
 * then auto-emit an observation-retention event for the calibration loop.
 *
 * First production caller of `observation.retention_days` (v1.49.891).
 */
export async function runObservationRetentionSweep(
  config: ObservationRetentionConfig,
  filePath: string,
  options: RetentionSweepOptions = {},
): Promise<RetentionSweepResult> {
  const retentionDays = config.observation.retention_days;
  const maxEntries = config.observation.max_entries;
  const manager = new RetentionManager(
    maxEntries !== undefined
      ? { maxAgeDays: retentionDays, maxEntries }
      : { maxAgeDays: retentionDays },
  );
  const effectiveMaxEntries = manager.getConfig().maxEntries;
  const stats = await manager.pruneWithStats(filePath);
  const prunedCount = stats.prunedCount;

  // Outcome-driven kind (v982): derive from the age-pressure band, unless the
  // caller forces a kind (the manual-recorder path). `null` ⇒ in-band /
  // no-basis ⇒ NO event is emitted.
  const kind: ObservationRetentionEventKind | null =
    options.defaultKind ?? deriveAgePressureKind(stats, retentionDays, options.agePressureBand);

  if (options.autoEmit !== false && kind !== null) {
    const appendOptions = options.eventsPath !== undefined
      ? { path: options.eventsPath }
      : {};
    // Fire-and-forget per #10437. Failure MUST NOT break the substrate.
    appendObservationRetentionEvent(
      {
        timestamp: new Date().toISOString(),
        kind,
        droppedCount: prunedCount,
        retainedCount: stats.retainedCount,
        retentionDays,
      },
      appendOptions,
    ).catch(() => {
      /* auto-emit is observability-only; never break the sweep */
    });
  }

  return {
    prunedCount,
    retainedCount: stats.retainedCount,
    retentionDays,
    maxEntries: effectiveMaxEntries,
    emittedKind: options.autoEmit !== false ? kind : null,
  };
}
