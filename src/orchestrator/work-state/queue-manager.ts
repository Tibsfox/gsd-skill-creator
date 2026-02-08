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

export class QueueManager {
  private reader: WorkStateReader;
  private writer: WorkStateWriter;

  constructor(private filePath: string) {
    this.reader = new WorkStateReader(filePath);
    this.writer = new WorkStateWriter(filePath);
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
  }

  /**
   * List all queued tasks from the work state file.
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
    const state = await this.getOrCreateState();
    const index = state.queued_tasks.findIndex(t => t.id === id);
    if (index === -1) return false;
    state.queued_tasks.splice(index, 1);
    await this.writer.save(state);
    return true;
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
