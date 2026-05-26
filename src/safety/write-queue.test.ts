import { describe, it, expect } from 'vitest';
import { serializeWrite, type WriteQueueHolder } from './write-queue.js';

describe('serializeWrite', () => {
  it('runs work serially and returns the work result', async () => {
    const holder: WriteQueueHolder = { writeQueue: Promise.resolve() };
    const order: number[] = [];
    const results = await Promise.all([
      serializeWrite(holder, async () => {
        order.push(1);
        await new Promise((r) => setTimeout(r, 5));
        order.push(2);
        return 'a';
      }),
      serializeWrite(holder, async () => {
        order.push(3);
        return 'b';
      }),
    ]);
    expect(order).toEqual([1, 2, 3]);
    expect(results).toEqual(['a', 'b']);
  });

  it('keeps the queue alive after a work rejection (no self-poisoning)', async () => {
    const holder: WriteQueueHolder = { writeQueue: Promise.resolve() };

    // First write fails
    await expect(
      serializeWrite(holder, async () => {
        throw new Error('disk full');
      }),
    ).rejects.toThrow('disk full');

    // Second write must run and succeed; the queue is not poisoned
    const result = await serializeWrite(holder, async () => 'recovered');
    expect(result).toBe('recovered');
  });

  it('propagates the actual error from each call (not a stale one)', async () => {
    const holder: WriteQueueHolder = { writeQueue: Promise.resolve() };
    await expect(
      serializeWrite(holder, async () => {
        throw new Error('first');
      }),
    ).rejects.toThrow('first');
    await expect(
      serializeWrite(holder, async () => {
        throw new Error('second');
      }),
    ).rejects.toThrow('second');
  });
});
