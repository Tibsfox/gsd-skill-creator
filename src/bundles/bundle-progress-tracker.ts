/**
 * Bundle progress tracking from session observations.
 *
 * Tracks skill status within bundles using a three-tier heuristic:
 * - pending: skill never appeared in any session's activeSkills
 * - loaded: skill appeared in at least one session's activeSkills
 * - applied: loaded AND session had toolCalls > 0 AND durationMinutes >= 2
 *
 * Progress entries are stored in JSONL with pattern envelope format
 * ({timestamp, category: 'bundle-progress', data}) for consistency
 * with PatternStore and EphemeralStore.
 *
 * Writes are serialized through a write queue to prevent race conditions.
 * Reads are corruption-tolerant (invalid lines are skipped).
 * Each entry is validated via Zod safeParse on read.
 */

import { z } from 'zod';
import { appendFile, readFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { SessionObservation } from '../types/observation.js';

// ============================================================================
// Schema
// ============================================================================

/**
 * Schema for a bundle progress entry.
 *
 * Tracks a single skill's status observation within a bundle session.
 * Uses .passthrough() for forward compatibility with new fields.
 */
export const BundleProgressEntrySchema = z.object({
  bundle_name: z.string(),
  session_id: z.string(),
  skill_name: z.string(),
  status: z.enum(['loaded', 'applied']),
  timestamp: z.string(),
  evidence: z.object({
    tool_calls: z.number().optional(),
    files_modified: z.number().optional(),
  }).passthrough().optional(),
}).passthrough();

export type BundleProgressEntry = z.infer<typeof BundleProgressEntrySchema>;

// ============================================================================
// computeSkillStatus
// ============================================================================

/**
 * Compute a skill's status from session observations.
 *
 * Uses a three-tier heuristic:
 * - pending: skill never appeared in any session's activeSkills
 * - loaded: skill appeared in at least one session's activeSkills
 * - applied: loaded AND session had toolCalls > 0 AND durationMinutes >= 2
 *
 * Returns the highest status achieved across all sessions.
 */
export function computeSkillStatus(
  skillName: string,
  sessions: SessionObservation[],
): 'pending' | 'loaded' | 'applied' {
  let bestStatus: 'pending' | 'loaded' | 'applied' = 'pending';

  for (const session of sessions) {
    if (!session.activeSkills.includes(skillName)) continue;
    bestStatus = 'loaded';

    if (session.metrics.toolCalls > 0 && session.durationMinutes >= 2) {
      return 'applied';
    }
  }

  return bestStatus;
}

// ============================================================================
// BundleProgressStore
// ============================================================================

/** Filename for the bundle progress log */
const BUNDLE_PROGRESS_FILENAME = 'bundle-progress.jsonl';

/**
 * JSONL append-log store for bundle progress entries.
 *
 * Follows the same pattern as WorkflowRunStore:
 * - Writes in pattern envelope format ({timestamp, category, data})
 * - Serialized writes through a queue to prevent race conditions
 * - Corruption-tolerant reads (invalid lines are skipped)
 * - Zod safeParse validation on read
 */
export class BundleProgressStore {
  private patternsDir: string;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(patternsDir: string) {
    this.patternsDir = patternsDir;
  }

  private get filePath(): string {
    return join(this.patternsDir, BUNDLE_PROGRESS_FILENAME);
  }

  /**
   * Append a bundle progress entry to the JSONL log.
   * Wraps in pattern envelope format for consistency with PatternStore.
   * Serializes writes through a queue to prevent race conditions.
   */
  async append(entry: BundleProgressEntry): Promise<void> {
    const envelope = {
      timestamp: Date.now(),
      category: 'bundle-progress' as const,
      data: entry,
    };

    this.writeQueue = this.writeQueue.then(async () => {
      await mkdir(this.patternsDir, { recursive: true });
      const line = JSON.stringify(envelope) + '\n';
      await appendFile(this.filePath, line, 'utf-8');
    });

    return this.writeQueue;
  }

  /**
   * Read all bundle progress entries from the JSONL log.
   * Returns empty array if file does not exist.
   * Skips corrupted or invalid lines gracefully.
   */
  async readAll(): Promise<BundleProgressEntry[]> {
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
    const entries: BundleProgressEntry[] = [];

    for (const line of lines) {
      try {
        const envelope = JSON.parse(line);
        const result = BundleProgressEntrySchema.safeParse(envelope.data);
        if (result.success) {
          entries.push(result.data);
        }
      } catch {
        // Skip corrupted lines
      }
    }

    return entries;
  }

  /**
   * Get all progress entries for a specific bundle.
   */
  async getProgressForBundle(bundleName: string): Promise<BundleProgressEntry[]> {
    const all = await this.readAll();
    return all.filter(e => e.bundle_name === bundleName);
  }
}
