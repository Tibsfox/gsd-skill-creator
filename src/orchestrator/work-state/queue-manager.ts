/**
 * Manages the queued_tasks array within a persistent work state file.
 *
 * Provides CRUD operations (add, list, remove) for queued tasks,
 * persisting changes through WorkStateWriter and reading via WorkStateReader.
 *
 * Constructor takes a filePath for dependency injection (testable without
 * touching real filesystem paths).
 */

import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { WorkStateReader } from './work-state-reader.js';
import { WorkStateWriter } from './work-state-writer.js';
import type { WorkState, QueuedTask } from './types.js';

/**
 * Options for adding a new task to the queue.
 */
export interface AddTaskOptions {
  description: string;
  skills_needed?: string[];
  priority?: 'high' | 'medium' | 'low';
  source?: string;
}

/**
 * Per-path in-process serialization of read-modify-write mutations.
 *
 * `add()`/`remove()` each read the whole state, mutate the queued_tasks array,
 * and write it back. Without serialization, two concurrent mutations both read
 * the same starting state and the second write clobbers the first (a lost
 * update). Chaining mutations per resolved file path — shared across every
 * QueueManager instance in the process — makes them run one at a time.
 *
 * Note: this guards only same-process concurrency. The atomic writer prevents
 * file corruption from a concurrent external writer, but a cross-process
 * mutation could still be overwritten (a lockfile would be required for that).
 */
const pathMutex = new Map<string, Promise<unknown>>();

function withPathLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = pathMutex.get(key) ?? Promise.resolve();
  // Run fn after the previous mutation settles (success or failure).
  const result = prev.then(fn, fn);
  // Keep the chain alive but swallow the outcome so one failed mutation does
  // not reject every queued follow-up.
  pathMutex.set(
    key,
    result.then(
      () => undefined,
      () => undefined,
    ),
  );
  return result;
}

export class QueueManager {
  private reader: WorkStateReader;
  private writer: WorkStateWriter;
  private lockKey: string;

  constructor(private filePath: string) {
    this.reader = new WorkStateReader(filePath);
    this.writer = new WorkStateWriter(filePath);
    // Normalize so different spellings of the same path share one mutex.
    this.lockKey = resolve(filePath);
  }

  /**
   * Add a new task to the queue.
   *
   * Generates a UUID for the task, sets defaults for missing fields,
   * appends to the queued_tasks array, and persists the updated state.
   *
   * @returns The created QueuedTask with all fields populated.
   */
  async add(options: AddTaskOptions): Promise<QueuedTask> {
    return withPathLock(this.lockKey, async () => {
      const state = await this.getOrCreateState();
      const task: QueuedTask = {
        id: randomUUID(),
        description: options.description,
        skills_needed: options.skills_needed ?? [],
        priority: options.priority ?? 'medium',
        created_at: new Date().toISOString(),
        ...(options.source !== undefined ? { source: options.source } : {}),
      };
      state.queued_tasks.push(task);
      await this.writer.save(state);
      return task;
    });
  }

  /**
   * List all queued tasks from the work state file.
   *
   * Read-only and intentionally NOT serialized against add()/remove(): it reads
   * the atomically-written file, so it always observes a complete state, but it
   * may return results that predate an in-flight, not-yet-awaited mutation.
   *
   * @returns Array of QueuedTask objects, or empty array if no file exists.
   */
  async list(): Promise<QueuedTask[]> {
    const state = await this.reader.read();
    return state?.queued_tasks ?? [];
  }

  /**
   * Remove a task from the queue by its id.
   *
   * @returns true if the task was found and removed, false if not found.
   */
  async remove(id: string): Promise<boolean> {
    return withPathLock(this.lockKey, async () => {
      const state = await this.getOrCreateState();
      const index = state.queued_tasks.findIndex(t => t.id === id);
      if (index === -1) return false;
      state.queued_tasks.splice(index, 1);
      await this.writer.save(state);
      return true;
    });
  }

  /**
   * Read existing state or create a fresh empty state.
   *
   * Used by add() and remove() which need to modify and re-save.
   */
  private async getOrCreateState(): Promise<WorkState> {
    const existing = await this.reader.read();
    if (existing) return existing;
    return {
      version: 1,
      session_id: null,
      saved_at: new Date().toISOString(),
      active_task: null,
      checkpoint: null,
      loaded_skills: [],
      queued_tasks: [],
      workflow: null,
    };
  }
}
