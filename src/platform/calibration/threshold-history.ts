/**
 * Threshold history management with rollback support.
 *
 * Stores calibrated thresholds with versioning to enable rollback to
 * previous calibration states. Supports per-skill overrides alongside
 * global threshold.
 *
 * Storage location: ~/.gsd-skill/calibration/thresholds.json
 *
 * Per RESEARCH.md Pattern 5: Threshold History with Rollback
 * Per CONTEXT.md: Global threshold with per-skill overrides, preserve history
 */
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { randomUUID } from 'crypto';

/**
 * A snapshot of threshold configuration at a point in time.
 */
export interface ThresholdSnapshot {
  /** Unique identifier for this snapshot */
  id: string;
  /** ISO timestamp when snapshot was created */
  timestamp: string;
  /** Global activation threshold */
  globalThreshold: number;
  /** Per-skill threshold overrides (skillName -> threshold) */
  skillOverrides: Record<string, number>;
  /** F1 score at time of calibration */
  f1Score: number;
  /** Number of calibration events used */
  dataPointsUsed: number;
  /** Reason for this snapshot */
  reason: 'calibration' | 'manual' | 'rollback';
}

/**
 * Internal storage format for threshold history.
 */
interface ThresholdHistoryData {
  snapshots: ThresholdSnapshot[];
  currentIndex: number;
}

/** Default threshold before any calibration */
const DEFAULT_THRESHOLD = 0.75;

/**
 * Manages threshold history with versioning and rollback support.
 */
export class ThresholdHistory {
  private historyPath: string;

  /**
   * Create a new ThresholdHistory instance.
   *
   * @param basePath - Optional override for storage directory (default: ~/.gsd-skill/calibration)
   */
  constructor(basePath?: string) {
    const baseDir = basePath ?? join(homedir(), '.gsd-skill', 'calibration');
    this.historyPath = join(baseDir, 'thresholds.json');
  }

  /**
   * Save a new threshold snapshot.
   *
   * Automatically assigns id and timestamp.
   * Sets currentIndex to the new snapshot.
   *
   * @param snapshot - Snapshot data without id and timestamp
   * @returns The complete snapshot with id and timestamp
   */
  async save(
    snapshot: Omit<ThresholdSnapshot, 'id' | 'timestamp'>
  ): Promise<ThresholdSnapshot> {
    const data = await this.readData();

    const completeSnapshot: ThresholdSnapshot = {
      ...snapshot,
      id: randomUUID(),
      timestamp: new Date().toISOString(),
    };

    data.snapshots.push(completeSnapshot);
    data.currentIndex = data.snapshots.length - 1;

    await this.writeData(data);
    return completeSnapshot;
  }

  /**
   * Rollback to a previous snapshot.
   *
   * Moves currentIndex back without deleting history.
   *
   * @param steps - Number of steps to go back (default 1)
   * @returns The rolled-back-to snapshot, or null if can't rollback further
   */
  async rollback(steps = 1): Promise<ThresholdSnapshot | null> {
    const data = await this.readData();

    if (data.snapshots.length === 0) {
      return null;
    }

    const targetIndex = data.currentIndex - steps;

    if (targetIndex < 0) {
      return null;
    }

    data.currentIndex = targetIndex;
    await this.writeData(data);

    return data.snapshots[targetIndex];
  }

  /**
   * Get the current active threshold snapshot.
   *
   * @returns Current snapshot or null if no history
   */
  async getCurrent(): Promise<ThresholdSnapshot | null> {
    const data = await this.readData();

    if (data.snapshots.length === 0) {
      return null;
    }

    return data.snapshots[data.currentIndex];
  }

  /**
   * List all threshold snapshots in history.
   *
   * @returns Array of all snapshots
   */
  async listHistory(): Promise<ThresholdSnapshot[]> {
    const data = await this.readData();
    return data.snapshots;
  }

  /**
   * Get the effective threshold for a specific skill.
   *
   * Returns skill override if set, otherwise global threshold.
   * Returns default (0.75) if no history.
   *
   * @param skillName - Name of the skill
   * @returns Effective threshold for the skill
   */
  async getThresholdForSkill(skillName: string): Promise<number> {
    const current = await this.getCurrent();

    if (!current) {
      return DEFAULT_THRESHOLD;
    }

    if (skillName in current.skillOverrides) {
      return current.skillOverrides[skillName];
    }

    return current.globalThreshold;
  }

  /**
   * Clear all history (for testing).
   */
  async clear(): Promise<void> {
    await this.ensureDir();
    await writeFile(this.historyPath, JSON.stringify({ snapshots: [], currentIndex: -1 }), 'utf-8');
  }

  /**
   * Ensure the storage directory exists.
   */
  private async ensureDir(): Promise<void> {
    await mkdir(dirname(this.historyPath), { recursive: true });
  }

  /**
   * Read the history data from disk.
   */
  private async readData(): Promise<ThresholdHistoryData> {
    try {
      const content = await readFile(this.historyPath, 'utf-8');
      return JSON.parse(content) as ThresholdHistoryData;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return { snapshots: [], currentIndex: -1 };
      }
      throw err;
    }
  }

  /**
   * Write the history data to disk.
   */
  private async writeData(data: ThresholdHistoryData): Promise<void> {
    await this.ensureDir();
    await writeFile(this.historyPath, JSON.stringify(data, null, 2), 'utf-8');
  }
}
