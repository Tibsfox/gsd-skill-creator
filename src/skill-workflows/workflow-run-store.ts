/**
 * JSONL append-log store for workflow run entries.
 *
 * Tracks step-level execution events (started, completed, failed, skipped)
 * in pattern envelope format ({timestamp, category, data}) for consistency
 * with PatternStore and EphemeralStore.
 *
 * Writes are serialized through a write queue to prevent race conditions.
 * Reads are corruption-tolerant (invalid lines are skipped).
 * Each entry is validated via Zod safeParse on read.
 */

import { appendFile, readFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { WorkflowRunEntrySchema } from './types.js';
import type { WorkflowRunEntry } from './types.js';

/** Filename for the workflow run log */
const WORKFLOW_RUNS_FILENAME = 'workflow-runs.jsonl';

export class WorkflowRunStore {
  private patternsDir: string;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(patternsDir: string) {
    this.patternsDir = patternsDir;
  }

  private get filePath(): string {
    return join(this.patternsDir, WORKFLOW_RUNS_FILENAME);
  }

  /**
   * Append a workflow run entry to the JSONL log.
   * Wraps in pattern envelope format for consistency with PatternStore.
   * Serializes writes through a queue to prevent race conditions.
   */
  async append(entry: WorkflowRunEntry): Promise<void> {
    const envelope = {
      timestamp: Date.now(),
      category: 'workflow-runs' as const,
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
   * Read all workflow run entries from the JSONL log.
   * Returns empty array if file does not exist.
   * Skips corrupted or invalid lines gracefully.
   */
  async readAll(): Promise<WorkflowRunEntry[]> {
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
    const entries: WorkflowRunEntry[] = [];

    for (const line of lines) {
      try {
        const envelope = JSON.parse(line);
        const result = WorkflowRunEntrySchema.safeParse(envelope.data);
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
   * Get all entries for a specific run_id.
   */
  async getRunEntries(runId: string): Promise<WorkflowRunEntry[]> {
    const all = await this.readAll();
    return all.filter(e => e.run_id === runId);
  }

  /**
   * Find the most recent run for a given workflow name.
   * Returns the run_id and all entries for that run, or null if no runs exist.
   *
   * "Most recent" is determined by the last appearance of a run_id
   * for the given workflow name in the log (append order = temporal order).
   */
  async getLatestRun(
    workflowName: string,
  ): Promise<{ runId: string; entries: WorkflowRunEntry[] } | null> {
    const all = await this.readAll();
    const forWorkflow = all.filter(e => e.workflow_name === workflowName);

    if (forWorkflow.length === 0) return null;

    // Find the last unique run_id (most recent by append order)
    let latestRunId: string | null = null;
    for (const entry of forWorkflow) {
      latestRunId = entry.run_id;
    }

    if (!latestRunId) return null;

    const entries = all.filter(e => e.run_id === latestRunId);
    return { runId: latestRunId, entries };
  }

  /**
   * Get step_ids that have status 'completed' for a given run_id.
   * Returns unique step_ids (deduplicated).
   */
  async getCompletedSteps(runId: string): Promise<string[]> {
    const entries = await this.getRunEntries(runId);
    const completed = new Set<string>();

    for (const entry of entries) {
      if (entry.status === 'completed') {
        completed.add(entry.step_id);
      }
    }

    return [...completed];
  }
}
