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
 * ## Default auto-emit kind
 *
 * Default kind: `too_aggressive` (-1, favors RAISING `retention_days`).
 * Rationale: each sweep is a substrate action operating on the threshold; the
 * operator has not explicitly endorsed the dropped entries. The conservative
 * bias is "keep more by default" — operators who want tighter retention can
 * manually emit `too_lax` via the CLI manual recorder (`bounded-learning
 * --record-event --threshold observation.retention_days --kind too_lax`).
 *
 * This mirrors v846's predictive auto-emit defaulting to `not_useful` (the
 * conservative bias against the fallback firing more).
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
import { appendObservationRetentionEvent } from '../bounded-learning/observation-retention-events.js';

/**
 * Minimal shape of the skill-creator config consumed here. Avoids importing
 * the full `SkillCreatorConfig` type to keep this module's surface narrow.
 */
export interface ObservationRetentionConfig {
  observation: {
    retention_days: number;
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
   * Override the auto-emit kind. Defaults to `'too_aggressive'`. Production
   * callers SHOULD prefer the default — operators flip via the CLI.
   */
  defaultKind?: 'too_aggressive' | 'too_lax';
}

export interface RetentionSweepResult {
  prunedCount: number;
  retentionDays: number;
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
  const manager = new RetentionManager({ maxAgeDays: retentionDays });
  const prunedCount = await manager.prune(filePath);

  if (options.autoEmit !== false) {
    const kind = options.defaultKind ?? 'too_aggressive';
    const appendOptions = options.eventsPath !== undefined
      ? { path: options.eventsPath }
      : {};
    // Fire-and-forget per #10437. Failure MUST NOT break the substrate.
    appendObservationRetentionEvent(
      {
        timestamp: new Date().toISOString(),
        kind,
        droppedCount: prunedCount,
        retentionDays,
      },
      appendOptions,
    ).catch(() => {
      /* auto-emit is observability-only; never break the sweep */
    });
  }

  return { prunedCount, retentionDays };
}
