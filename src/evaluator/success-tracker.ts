/**
 * Tracks post-activation success signals for skills.
 *
 * Records whether skill activations were helpful based on user behavior:
 * corrections (failure), overrides (failure), explicit-positive (success),
 * explicit-negative (failure). Computes per-skill success rates.
 *
 * Storage location: ~/.gsd-skill/evaluator/success-signals.jsonl (global)
 *
 * Uses JSONL format with write queue serialization, consistent with
 * CalibrationStore and FeedbackStore patterns.
 */
import { readFile, writeFile, appendFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { randomUUID } from 'crypto';
import type { SuccessSignal } from '../types/evaluator.js';

export class SuccessTracker {
  private signalsPath: string;
  private writeQueue: Promise<void> = Promise.resolve();

  /**
   * Create a new SuccessTracker instance.
   *
   * @param basePath - Optional override for storage directory (default: ~/.gsd-skill/evaluator)
   */
  constructor(basePath?: string) {
    const baseDir = basePath ?? join(homedir(), '.gsd-skill', 'evaluator');
    this.signalsPath = join(baseDir, 'success-signals.jsonl');
  }

  /**
   * Record a new success signal.
   *
   * Adds id (UUID) and timestamp automatically.
   *
   * @param input - Signal data without id/timestamp
   * @returns The complete signal with id and timestamp
   */
  async record(
    input: Omit<SuccessSignal, 'id' | 'timestamp'>
  ): Promise<SuccessSignal> {
    const signal: SuccessSignal = {
      ...input,
      id: randomUUID(),
      timestamp: new Date().toISOString(),
    };

    await this.appendLine(signal);
    return signal;
  }

  /**
   * Get all success signals for a specific skill.
   *
   * @param skillName - Name of the skill to filter by
   * @returns Array of signals for the given skill
   */
  async getBySkill(skillName: string): Promise<SuccessSignal[]> {
    const all = await this.readAll();
    return all.filter(s => s.skillName === skillName);
  }

  /**
   * Get all success signals.
   *
   * @returns Array of all recorded signals
   */
  async getAll(): Promise<SuccessSignal[]> {
    return this.readAll();
  }

  /**
   * Compute the success rate for a specific skill.
   *
   * Positive signals: explicit-positive
   * Negative signals: correction, override, explicit-negative
   *
   * Rate = positive / total (0 when no signals exist)
   *
   * @param skillName - Name of the skill
   * @returns Object with rate, total, positive, and negative counts
   */
  async getSuccessRate(
    skillName: string
  ): Promise<{ rate: number; total: number; positive: number; negative: number }> {
    const signals = await this.getBySkill(skillName);

    if (signals.length === 0) {
      return { rate: 0, total: 0, positive: 0, negative: 0 };
    }

    let positive = 0;
    let negative = 0;

    for (const signal of signals) {
      if (signal.signalType === 'explicit-positive') {
        positive++;
      } else {
        // correction, override, explicit-negative are all failures
        negative++;
      }
    }

    const total = signals.length;
    const rate = total > 0 ? positive / total : 0;

    return { rate, total, positive, negative };
  }

  /**
   * Clear all success signal data.
   *
   * Primarily for testing purposes.
   */
  async clear(): Promise<void> {
    await this.ensureDir();

    this.writeQueue = this.writeQueue.then(async () => {
      await writeFile(this.signalsPath, '', 'utf-8');
    });

    await this.writeQueue;
  }

  /**
   * Ensure the storage directory exists.
   */
  private async ensureDir(): Promise<void> {
    await mkdir(dirname(this.signalsPath), { recursive: true });
  }

  /**
   * Read all signals from the JSONL file.
   *
   * Handles ENOENT gracefully (returns empty array).
   * Skips corrupted lines with a warning.
   */
  private async readAll(): Promise<SuccessSignal[]> {
    try {
      const content = await readFile(this.signalsPath, 'utf-8');
      const signals: SuccessSignal[] = [];

      for (const line of content.split('\n')) {
        if (!line.trim()) continue;
        try {
          signals.push(JSON.parse(line) as SuccessSignal);
        } catch {
          // Skip corrupted lines but warn
          console.warn('Skipping corrupted line in success-signals.jsonl');
        }
      }

      return signals;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw err;
    }
  }

  /**
   * Append a single signal to the JSONL file with write serialization.
   *
   * Serializes writes to prevent interleaving of JSON objects.
   */
  private async appendLine(signal: SuccessSignal): Promise<void> {
    await this.ensureDir();

    // Serialize writes to prevent interleaving
    this.writeQueue = this.writeQueue.then(async () => {
      const line = JSON.stringify(signal) + '\n';
      await appendFile(this.signalsPath, line, 'utf-8');
    });

    await this.writeQueue;
  }
}
