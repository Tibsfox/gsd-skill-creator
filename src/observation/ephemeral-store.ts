import { appendFile, readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { SessionObservation } from '../types/observation.js';
import { normalizeObservationTier } from '../types/observation.js';

/** Filename for the ephemeral observation buffer */
export const EPHEMERAL_FILENAME = '.ephemeral.jsonl';

/**
 * File-based store for ephemeral observations awaiting promotion evaluation.
 * Writes pattern envelopes ({timestamp, category, data}) to a JSONL buffer,
 * following the same envelope format as PatternStore.
 */
export class EphemeralStore {
  private patternsDir: string;

  constructor(patternsDir: string) {
    this.patternsDir = patternsDir;
  }

  private get filePath(): string {
    return join(this.patternsDir, EPHEMERAL_FILENAME);
  }

  /**
   * Append an observation to the ephemeral buffer.
   * Wraps in pattern envelope format for consistency with PatternStore.
   */
  async append(observation: SessionObservation): Promise<void> {
    await mkdir(this.patternsDir, { recursive: true });

    const envelope = {
      timestamp: Date.now(),
      category: 'sessions' as const,
      data: observation,
    };

    const line = JSON.stringify(envelope) + '\n';
    await appendFile(this.filePath, line, 'utf-8');
  }

  /**
   * Read all observations from the ephemeral buffer.
   * Applies normalizeObservationTier() so old data without tier defaults to 'persistent'.
   * Returns empty array if file does not exist.
   */
  async readAll(): Promise<SessionObservation[]> {
    let content: string;
    try {
      content = await readFile(this.filePath, 'utf-8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }

    const lines = content.split('\n').filter(line => line.trim() !== '');
    const observations: SessionObservation[] = [];

    for (const line of lines) {
      try {
        const envelope = JSON.parse(line);
        const obs = normalizeObservationTier(envelope.data as SessionObservation);
        observations.push(obs);
      } catch {
        // Skip corrupted lines
      }
    }

    return observations;
  }

  /**
   * Clear the ephemeral buffer by truncating the file.
   * Does not throw if file does not exist.
   */
  async clear(): Promise<void> {
    try {
      await writeFile(this.filePath, '', 'utf-8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return;
      }
      throw error;
    }
  }

  /**
   * Get the number of entries in the ephemeral buffer.
   * Returns 0 if file does not exist.
   */
  async getSize(): Promise<number> {
    let content: string;
    try {
      content = await readFile(this.filePath, 'utf-8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return 0;
      }
      throw error;
    }

    return content.split('\n').filter(line => line.trim() !== '').length;
  }
}
