import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import type { Checkpoint } from './types.js';

/**
 * Manages checkpoint persistence for multi-session resume of the
 * v1.40 ingestion pipeline. Uses atomic writes (temp + rename) and
 * SHA-256 integrity hashes to prevent corruption and data loss.
 *
 * Satisfies: HARNESS-01 (atomic checkpoint writes at chapter boundaries),
 * HARNESS-02 (resume skips completed work), HARNESS-05 (integrity hash).
 */
export class CheckpointManager {
  private readonly checkpointDir: string;

  constructor(checkpointDir: string) {
    this.checkpointDir = checkpointDir;
    fs.mkdirSync(checkpointDir, { recursive: true });
  }

  /**
   * Write a checkpoint atomically. Computes the SHA-256 integrity hash,
   * writes to a temp file, then renames to the final path.
   */
  async write(checkpoint: Checkpoint): Promise<void> {
    const hash = this.computeHash(checkpoint);
    const withHash: Checkpoint = { ...checkpoint, stateHash: hash };
    const json = JSON.stringify(withHash, null, 2);

    const finalPath = this.filePath(checkpoint.componentId);
    const tmpPath = finalPath.replace('.json', '.tmp');

    fs.writeFileSync(tmpPath, json, 'utf-8');
    fs.renameSync(tmpPath, finalPath);
  }

  /**
   * Read a checkpoint and validate its integrity hash. Returns null if
   * no checkpoint exists for the given componentId. Throws if the stored
   * hash does not match a recomputed hash (corruption/tamper detection).
   */
  async read(componentId: string): Promise<Checkpoint | null> {
    const filePath = this.filePath(componentId);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const raw = fs.readFileSync(filePath, 'utf-8');
    const data: Checkpoint = JSON.parse(raw);

    const expectedHash = this.computeHash(data);
    if (data.stateHash !== expectedHash) {
      throw new Error(
        `Checkpoint integrity check failed: hash mismatch for ${componentId}`,
      );
    }

    return data;
  }

  /**
   * Get the resume point (lastCompletedItem) for a component, or null
   * if no checkpoint exists.
   */
  async getResumePoint(componentId: string): Promise<string | null> {
    const checkpoint = await this.read(componentId);
    return checkpoint ? checkpoint.lastCompletedItem : null;
  }

  /**
   * Compute a deterministic SHA-256 hash of the checkpoint payload,
   * excluding the stateHash field itself.
   */
  private computeHash(checkpoint: Checkpoint): string {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { stateHash, ...rest } = checkpoint;
    const sortedKeys = Object.keys(rest).sort();
    const json = JSON.stringify(rest, sortedKeys);
    return crypto.createHash('sha256').update(json).digest('hex');
  }

  private filePath(componentId: string): string {
    return path.join(this.checkpointDir, `${componentId}-checkpoint.json`);
  }
}
