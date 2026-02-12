import { appendFile, readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { SessionObservation } from '../types/observation.js';
import { normalizeObservationTier } from '../types/observation.js';
import { createChecksummedEntry, validateJsonlEntry, verifyChecksum } from '../validation/jsonl-safety.js';

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
   * Entries are checksummed for tamper detection (INT-01).
   * Optional sessionId enables cross-session frequency tracking.
   */
  async append(observation: SessionObservation, sessionId?: string): Promise<void> {
    await mkdir(this.patternsDir, { recursive: true });

    const envelope = {
      timestamp: Date.now(),
      category: 'sessions' as const,
      data: observation as unknown as Record<string, unknown>,
      ...(sessionId ? { session_id: sessionId } : {}),
    };

    // Wrap with checksum for tamper-evident storage
    const checksummed = createChecksummedEntry(envelope);

    const line = JSON.stringify(checksummed) + '\n';
    await appendFile(this.filePath, line, 'utf-8');
  }

  /**
   * Read all observations from the ephemeral buffer.
   * Validates schema (INT-02) and verifies checksums (INT-01) on read.
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
      // Schema validation
      const validation = validateJsonlEntry(line);
      if (!validation.valid) {
        continue; // Skip malformed entries
      }

      try {
        const envelope = JSON.parse(line) as Record<string, unknown>;

        // Checksum verification (only if entry has _checksum)
        if (typeof envelope._checksum === 'string') {
          const checksumResult = verifyChecksum(envelope);
          if (!checksumResult.valid) {
            continue; // Skip tampered entries
          }
        }

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
   * Get distinct session counts per observation pattern.
   * Groups observations by a deterministic pattern key (sorted topCommands + topTools)
   * and counts distinct session IDs per group.
   * Returns empty map if file does not exist or no session_ids are recorded.
   */
  async getSessionCounts(): Promise<Map<string, number>> {
    let content: string;
    try {
      content = await readFile(this.filePath, 'utf-8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return new Map();
      }
      throw error;
    }

    const lines = content.split('\n').filter(line => line.trim() !== '');
    const patternSessions = new Map<string, Set<string>>();

    for (const line of lines) {
      // Schema validation
      const validation = validateJsonlEntry(line);
      if (!validation.valid) {
        continue; // Skip malformed entries
      }

      try {
        const envelope = JSON.parse(line) as Record<string, unknown>;

        // Checksum verification (only if entry has _checksum)
        if (typeof envelope._checksum === 'string') {
          const checksumResult = verifyChecksum(envelope);
          if (!checksumResult.valid) {
            continue; // Skip tampered entries
          }
        }

        const sessionId = envelope.session_id as string | undefined;
        if (!sessionId) continue;

        const obs = envelope.data as SessionObservation;
        const key = this.computePatternKey(obs);

        if (!patternSessions.has(key)) {
          patternSessions.set(key, new Set());
        }
        patternSessions.get(key)!.add(sessionId);
      } catch {
        // Skip corrupted lines
      }
    }

    const counts = new Map<string, number>();
    for (const [key, sessions] of patternSessions) {
      counts.set(key, sessions.size);
    }
    return counts;
  }

  /**
   * Compute a deterministic pattern key from an observation's distinguishing features.
   * Used for grouping observations that represent the same workflow pattern.
   */
  private computePatternKey(obs: SessionObservation): string {
    const commands = [...obs.topCommands].sort().join(',');
    const tools = [...obs.topTools].sort().join(',');
    return `${commands}|${tools}`;
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
