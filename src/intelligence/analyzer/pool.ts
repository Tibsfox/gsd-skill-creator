/**
 * C01 — Concurrency limiter (worker pool).
 *
 * Lightweight in-process pool using Promise chaining to maintain N concurrent tasks (D-22-10).
 * Default parallelism: 4. Capped at os.cpus().length.
 */

import { cpus } from 'node:os';

const DEFAULT_PARALLELISM = 4;

export interface Pool {
  /** Effective concurrency (after CPU cap). */
  readonly effectiveConcurrency: number;

  /**
   * Run all tasks with at most `effectiveConcurrency` concurrent, collecting results.
   * Rejects if any task rejects (use runAllSettled for error-tolerant execution).
   */
  runAll<T>(tasks: Array<() => Promise<T>>): Promise<T[]>;

  /**
   * Run all tasks with at most `effectiveConcurrency` concurrent.
   * Collects PromiseSettledResult for each — does NOT reject if individual tasks fail.
   */
  runAllSettled<T>(tasks: Array<() => Promise<T>>): Promise<PromiseSettledResult<T>[]>;
}

/**
 * Create a concurrency-limited pool.
 *
 * @param parallelism - Requested concurrency level. Capped at os.cpus().length. Default 4.
 */
export function createPool(parallelism?: number): Pool {
  const requested = parallelism ?? DEFAULT_PARALLELISM;
  const cpuCount = cpus().length;
  const effectiveConcurrency = Math.max(1, Math.min(requested, cpuCount));

  return {
    effectiveConcurrency,

    async runAll<T>(tasks: Array<() => Promise<T>>): Promise<T[]> {
      if (tasks.length === 0) return [];
      const results = new Array<T>(tasks.length);
      await runWithConcurrency(tasks, effectiveConcurrency, async (task, idx) => {
        results[idx] = await task();
      });
      return results;
    },

    async runAllSettled<T>(tasks: Array<() => Promise<T>>): Promise<PromiseSettledResult<T>[]> {
      if (tasks.length === 0) return [];
      const results = new Array<PromiseSettledResult<T>>(tasks.length);
      await runWithConcurrency(tasks, effectiveConcurrency, async (task, idx) => {
        try {
          const value = await task();
          results[idx] = { status: 'fulfilled', value };
        } catch (reason) {
          results[idx] = { status: 'rejected', reason };
        }
      });
      return results;
    },
  };
}

/**
 * Run tasks with at most `concurrency` active at a time.
 * Executes `handler(task, originalIndex)` for each task.
 */
async function runWithConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  concurrency: number,
  handler: (task: () => Promise<T>, idx: number) => Promise<void>,
): Promise<void> {
  const queue = tasks.map((task, idx) => ({ task, idx }));
  let activeCount = 0;
  let queueIdx = 0;

  return new Promise((resolve, reject) => {
    function startNext(): void {
      while (activeCount < concurrency && queueIdx < queue.length) {
        const item = queue[queueIdx++]!;
        activeCount++;

        handler(item.task, item.idx)
          .then(() => {
            activeCount--;
            if (queueIdx < queue.length) {
              startNext();
            } else if (activeCount === 0) {
              resolve();
            }
          })
          .catch(err => {
            // For runAll: errors bubble up; for runAllSettled: handler catches them internally
            activeCount--;
            reject(err);
          });
      }

      // Handle case where all tasks started and activeCount reaches 0 before any finish
      if (queueIdx >= queue.length && activeCount === 0 && queue.length === 0) {
        resolve();
      }
    }

    startNext();
  });
}
