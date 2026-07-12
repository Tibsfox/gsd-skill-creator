/**
 * In-memory DeltaStore -- a non-persistent CalibrationDelta sink.
 *
 * Satisfies the minimal DeltaStore contract the CalibrationEngine depends on
 * ({ save, getHistory }) without touching disk. Used as the default backing
 * store when a RosettaCore is constructed without an explicit CalibrationEngine,
 * so feedback calibration works out of the box in tests and ephemeral sessions.
 * For cross-session persistence, inject a disk-backed DeltaStore instead.
 *
 * @module calibration/in-memory-delta-store
 */

import type { CalibrationDelta } from '../rosetta-core/types.js';

/** Holds CalibrationDeltas in process memory, in insertion order. */
export class InMemoryDeltaStore {
  private readonly deltas: CalibrationDelta[] = [];

  async save(delta: CalibrationDelta): Promise<void> {
    this.deltas.push(delta);
  }

  async getHistory(): Promise<CalibrationDelta[]> {
    return [...this.deltas];
  }
}
