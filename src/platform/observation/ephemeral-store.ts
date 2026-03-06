/**
 * ephemeral-store.ts — Session Tracking: Low-Signal Observation Buffer
 *
 * WHAT THIS MODULE DOES
 * ---------------------
 * EphemeralStore is a temporary buffer for session observations that did not
 * score high enough for immediate promotion to persistent storage. It holds
 * observations in a separate JSONL file (.ephemeral.jsonl) until they are
 * either collectively promoted or discarded by SessionObserver.
 *
 * WHY TWO TIERS EXIST
 * -------------------
 * Not every session is worth keeping. A 30-second session that checks a file
 * and exits has weak signal. But if that pattern repeats 10 times over a week,
 * it might represent a real workflow habit worth capturing.
 *
 * The ephemeral buffer is where low-signal observations wait to find out
 * if they're part of a pattern. SessionObserver squashes accumulated ephemeral
 * entries after each session end and evaluates the aggregate. If the aggregate
 * scores well, it gets promoted. If not, it gets discarded. Either way, the
 * buffer is cleared.
 *
 * This two-tier design reflects the principle from BATCH-3-RETROSPECTIVE.md,
 * Sam's debrief: "PatternStore is the load-bearing data contract for all
 * observation tools." Ephemeral buffer protects PatternStore from noise.
 *
 * STORAGE FORMAT
 * --------------
 * Entries are written as checksummed pattern envelopes — the same format as
 * PatternStore. This ensures consistency when entries are eventually promoted:
 * the data structure doesn't need transformation.
 *
 * Envelope format:
 *   { timestamp, category: 'sessions', data: SessionObservation, [session_id: string] }
 *
 * The optional session_id field enables cross-session frequency tracking via
 * getSessionCounts(). When present, it maps observations to their origin session
 * so the frequency tracker can count how many distinct sessions produced similar patterns.
 *
 * CHECKSUM VALIDATION
 * -------------------
 * Every entry is checksummed on write (createChecksummedEntry) and verified on
 * read (verifyChecksum). This is INT-01: tamper-evident ephemeral storage.
 *
 * Tampered or corrupted entries are silently skipped on read — the system
 * is resilient to partial corruption without failing hard.
 *
 * Why checksum ephemeral data? Because ephemeral entries accumulate silently
 * over time and are only read at the next session end. Without checksums,
 * disk corruption or concurrent writes could silently corrupt the buffer
 * without any visible indicator. Checksums surface this at read time.
 *
 * PATTERN KEY FOR CROSS-SESSION COUNTING
 * ----------------------------------------
 * computePatternKey() creates a deterministic fingerprint of a session's
 * distinguishing features: sorted topCommands + sorted topTools.
 *
 * This key enables: "how many distinct sessions had this command+tool pattern?"
 * If the same pattern key appears across 3+ sessions, it's likely a real habit,
 * not random variation. getSessionCounts() returns this count per pattern key.
 *
 * The key uses topCommands and topTools, not raw commands — frequency-ranked
 * features are more stable fingerprints than exhaustive lists.
 *
 * CLEAR ON PROMOTION
 * ------------------
 * clear() truncates the ephemeral file to empty. This is called by SessionObserver
 * after every promotion evaluation, regardless of outcome. The decision is:
 * "evaluated and promoted" OR "evaluated and discarded" — either way, start fresh.
 *
 * This prevents unbounded buffer growth. Without clear(), the ephemeral file
 * would grow indefinitely with each session.
 *
 * NORMALIZATION
 * -------------
 * readAll() applies normalizeObservationTier() to all entries. This handles
 * old entries written before the 'tier' field existed — they default to 'persistent'
 * for backward compatibility. New entries always have explicit tier values.
 *
 * @see SessionObserver (session-observer.ts) — orchestrates writes, reads, and clears
 * @see ObservationSquasher (observation-squasher.ts) — aggregates entries before eval
 * @see PromotionEvaluator (promotion-evaluator.ts) — scores the squashed aggregate
 * @see core/validation/jsonl-safety.ts — checksum creation and verification
 */

import { appendFile, readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { SessionObservation } from '../../core/types/observation.js';
import { normalizeObservationTier } from '../../core/types/observation.js';
import { createChecksummedEntry, validateJsonlEntry, verifyChecksum } from '../../core/validation/jsonl-safety.js';

/**
 * Filename for the ephemeral observation buffer.
 * Stored in the same patterns directory as PatternStore files.
 * The leading dot makes it conventionally "hidden" — this file is internal.
 */
export const EPHEMERAL_FILENAME = '.ephemeral.jsonl';

/**
 * File-based store for ephemeral observations awaiting promotion evaluation.
 * Writes pattern envelopes ({timestamp, category, data}) to a JSONL buffer,
 * following the same envelope format as PatternStore.
 *
 * Not safe for concurrent writes from multiple processes — designed for
 * single-process, sequential session-end handling in SessionObserver.
 */
export class EphemeralStore {
  private patternsDir: string;

  constructor(patternsDir: string) {
    this.patternsDir = patternsDir;
  }

  /** Computed file path for the ephemeral buffer. */
  private get filePath(): string {
    return join(this.patternsDir, EPHEMERAL_FILENAME);
  }

  /**
   * Append an observation to the ephemeral buffer.
   * Wraps in pattern envelope format for consistency with PatternStore.
   * Entries are checksummed for tamper detection (INT-01).
   *
   * Optional sessionId enables cross-session frequency tracking via getSessionCounts().
   * Include sessionId when you want to count "how many distinct sessions produced
   * this command+tool pattern?"
   *
   * mkdir is called with recursive: true — safe on existing directories.
   */
  async append(observation: SessionObservation, sessionId?: string): Promise<void> {
    await mkdir(this.patternsDir, { recursive: true });

    const envelope = {
      timestamp: Date.now(),
      category: 'sessions' as const,
      data: observation as unknown as Record<string, unknown>,
      ...(sessionId ? { session_id: sessionId } : {}),
    };

    // Wrap with checksum for tamper-evident storage (INT-01)
    const checksummed = createChecksummedEntry(envelope);

    const line = JSON.stringify(checksummed) + '\n';
    await appendFile(this.filePath, line, 'utf-8');
  }

  /**
   * Read all observations from the ephemeral buffer.
   * Validates schema (INT-02) and verifies checksums (INT-01) on read.
   * Applies normalizeObservationTier() so old data without tier defaults to 'persistent'.
   * Returns empty array if file does not exist (new setup, or cleared).
   *
   * Silently skips:
   * - Lines failing schema validation (malformed JSON or wrong structure)
   * - Lines with invalid checksums (corrupted or tampered)
   * - Lines that throw on JSON.parse (should not happen after schema validation)
   *
   * This resilient read ensures partial buffer corruption does not prevent
   * the evaluation of the remaining valid entries.
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
      // Schema validation — verifies expected fields exist
      const validation = validateJsonlEntry(line);
      if (!validation.valid) {
        continue; // Skip malformed entries
      }

      try {
        const envelope = JSON.parse(line) as Record<string, unknown>;

        // Checksum verification — only if entry has _checksum field
        if (typeof envelope._checksum === 'string') {
          const checksumResult = verifyChecksum(envelope);
          if (!checksumResult.valid) {
            continue; // Skip tampered entries
          }
        }

        // Normalize tier for backward compatibility with old entries
        const obs = normalizeObservationTier(envelope.data as SessionObservation);
        observations.push(obs);
      } catch {
        // Skip corrupted lines
      }
    }

    return observations;
  }

  /**
   * Clear the ephemeral buffer by truncating the file to empty.
   * Called by SessionObserver after every promotion evaluation,
   * regardless of whether promotion occurred.
   *
   * Does not throw if file does not exist — safe to call on fresh setup.
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
   *
   * Groups observations by their pattern key (sorted topCommands + sorted topTools)
   * and counts distinct session IDs per group. This answers:
   * "How many distinct sessions exhibited this command+tool combination?"
   *
   * A count >= 2 is used as the cross-session bonus in PromotionEvaluator:
   * patterns seen in multiple sessions are more likely to be real habits.
   *
   * Returns empty map if file does not exist or no session_ids are recorded.
   * session_id is only present in entries written with an explicit sessionId arg.
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
      const validation = validateJsonlEntry(line);
      if (!validation.valid) {
        continue; // Skip malformed entries
      }

      try {
        const envelope = JSON.parse(line) as Record<string, unknown>;

        if (typeof envelope._checksum === 'string') {
          const checksumResult = verifyChecksum(envelope);
          if (!checksumResult.valid) {
            continue; // Skip tampered entries
          }
        }

        const sessionId = envelope.session_id as string | undefined;
        if (!sessionId) continue; // Only entries with session_id contribute to counts

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

    // Convert Set<sessionId> to count
    const counts = new Map<string, number>();
    for (const [key, sessions] of patternSessions) {
      counts.set(key, sessions.size);
    }
    return counts;
  }

  /**
   * Compute a deterministic pattern key from an observation's distinguishing features.
   *
   * Key = sorted topCommands joined + '|' + sorted topTools joined.
   * Sorting ensures the key is stable regardless of frequency ranking order.
   *
   * This key groups observations that represent the same workflow pattern:
   * "git + npm sessions" vs "git + vitest sessions" get different keys.
   * Used by getSessionCounts() to detect repeated cross-session patterns.
   */
  private computePatternKey(obs: SessionObservation): string {
    const commands = [...obs.topCommands].sort().join(',');
    const tools = [...obs.topTools].sort().join(',');
    return `${commands}|${tools}`;
  }

  /**
   * Get the number of entries in the ephemeral buffer.
   * Useful for monitoring buffer growth and debugging.
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
