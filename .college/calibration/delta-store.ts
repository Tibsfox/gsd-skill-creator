/**
 * Delta Store -- persists calibration history for session continuity.
 *
 * Stores CalibrationDeltas so that calibration data from one session
 * is readable in subsequent sessions. Uses JSON files on disk organized
 * by userId and domain.
 *
 * Storage format: one JSON file per userId+domain pair
 * Path: {baseDir}/{userId}/{domain}.json
 * Content: JSON array of serialized CalibrationDelta objects
 * Date serialization: ISO 8601 string, parsed back to Date on read
 *
 * @module calibration/delta-store
 */

import type { CalibrationDelta } from '../rosetta-core/types.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

// ─── Configuration ──────────────────────────────────────────────────────────

/** Configuration for DeltaStore storage location. */
export interface DeltaStoreConfig {
  /** Base directory for all calibration data storage. */
  baseDir: string;
  /** User identifier for scoping stored deltas. */
  userId: string;
  /** Domain identifier for scoping stored deltas (e.g., 'cooking', 'mathematics'). */
  domain: string;
}

// ─── Serialized shape ───────────────────────────────────────────────────────

/** On-disk shape where Date is serialized as ISO string. */
interface SerializedDelta {
  observedResult: string;
  expectedResult: string;
  adjustment: Record<string, number>;
  confidence: number;
  domainModel: string;
  timestamp: string; // ISO 8601
}

// ─── DeltaStore ─────────────────────────────────────────────────────────────

/**
 * Persists CalibrationDelta records as JSON files organized by userId and domain.
 *
 * Each userId+domain pair gets its own file. Deltas are stored as a JSON array
 * in insertion order. Date objects are serialized as ISO 8601 strings and
 * deserialized back to Date objects on read.
 */
export class DeltaStore {
  private readonly config: DeltaStoreConfig;
  private readonly storagePath: string;

  constructor(config: DeltaStoreConfig) {
    this.config = config;
    this.storagePath = path.join(config.baseDir, config.userId, `${config.domain}.json`);
  }

  /**
   * Save a CalibrationDelta to persistent storage.
   * Creates parent directories if they do not exist.
   */
  async save(delta: CalibrationDelta): Promise<void> {
    const existing = await this.readFile();
    const serialized: SerializedDelta = {
      observedResult: delta.observedResult,
      expectedResult: delta.expectedResult,
      adjustment: delta.adjustment,
      confidence: delta.confidence,
      domainModel: delta.domainModel,
      timestamp: delta.timestamp.toISOString(),
    };
    existing.push(serialized);

    const dir = path.dirname(this.storagePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(this.storagePath, JSON.stringify(existing, null, 2), 'utf-8');
  }

  /**
   * Retrieve all stored deltas in insertion order.
   * Returns an empty array if no data has been stored.
   */
  async getHistory(): Promise<CalibrationDelta[]> {
    const records = await this.readFile();
    return records.map((r) => ({
      observedResult: r.observedResult,
      expectedResult: r.expectedResult,
      adjustment: r.adjustment,
      confidence: r.confidence,
      domainModel: r.domainModel,
      timestamp: new Date(r.timestamp),
    }));
  }

  /**
   * Clear all stored deltas (used for test cleanup).
   */
  async clear(): Promise<void> {
    try {
      await fs.rm(this.storagePath, { force: true });
    } catch {
      // File may not exist -- that is fine
    }
  }

  /** Read the raw serialized array from disk, or return empty array if file does not exist. */
  private async readFile(): Promise<SerializedDelta[]> {
    try {
      const content = await fs.readFile(this.storagePath, 'utf-8');
      return JSON.parse(content) as SerializedDelta[];
    } catch {
      return [];
    }
  }
}
