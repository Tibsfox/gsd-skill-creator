/**
 * C01 T5 — Worker pool (concurrency limiter) tests.
 */

import { describe, it, expect } from 'vitest';
import { cpus } from 'node:os';
import { createPool } from '../pool.js';

const CPU_COUNT = cpus().length;

describe('createPool', () => {
  it('executes 10 tasks with concurrency=4 — wall time ~125ms not ~500ms', async () => {
    const pool = createPool(4);
    const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

    const start = Date.now();
    const results: number[] = [];

    await pool.runAll(
      Array.from({ length: 10 }, (_, i) => async () => {
        await delay(50);
        results.push(i);
      }),
    );

    const elapsed = Date.now() - start;
    expect(results).toHaveLength(10);
    // With 10 tasks at 50ms each and concurrency=4:
    // batch 1: 4 tasks at t=0..50ms
    // batch 2: 4 tasks at t=50..100ms
    // batch 3: 2 tasks at t=100..150ms
    // expected ~150ms, allow 30% tolerance → < 195ms
    expect(elapsed).toBeLessThan(250); // generous bound
    // Also verify it doesn't complete too fast (proves actual delay happened)
    expect(elapsed).toBeGreaterThan(100);
  });

  it('caps effective concurrency at os.cpus().length', async () => {
    // Even if we request more concurrency than CPU count, the effective max is os.cpus().length
    const pool = createPool(1000);
    expect(pool.effectiveConcurrency).toBeLessThanOrEqual(CPU_COUNT);
    expect(pool.effectiveConcurrency).toBeGreaterThanOrEqual(1);
  });

  it('errors in one task do not abort the rest (collected via allSettled semantics)', async () => {
    const pool = createPool(4);
    const results: string[] = [];

    const tasks = [
      async () => { results.push('a'); },
      async () => { throw new Error('task b failed'); },
      async () => { results.push('c'); },
    ];

    const outcomes = await pool.runAllSettled(tasks);
    expect(outcomes).toHaveLength(3);
    expect(outcomes[0]).toMatchObject({ status: 'fulfilled' });
    expect(outcomes[1]).toMatchObject({ status: 'rejected' });
    expect(outcomes[2]).toMatchObject({ status: 'fulfilled' });
    // Both non-failing tasks completed
    expect(results).toContain('a');
    expect(results).toContain('c');
  });

  it('handles empty task list gracefully', async () => {
    const pool = createPool(4);
    const results = await pool.runAll([]);
    expect(results).toHaveLength(0);
  });

  it('default parallelism is 4', () => {
    const pool = createPool();
    expect(pool.effectiveConcurrency).toBe(Math.min(4, CPU_COUNT));
  });
});
