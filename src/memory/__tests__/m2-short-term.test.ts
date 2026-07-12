/**
 * CF-M2-02 — short-term memory read/eviction behavior.
 *
 * The p95 read-latency wall-clock bench was relocated to the WARN-only
 * intelligence-perf project (item 8):
 * src/intelligence/__tests__/performance/m2-short-term-latency.perf.test.ts.
 * The functional cases below stay in the blocking lane.
 */

import { describe, it, expect } from 'vitest';
import { ShortTermMemory } from '../short-term.js';
import type { MemoryEntry } from '../../types/memory.js';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeEntry(id: string, content: string, ts?: number): MemoryEntry {
  return {
    id,
    content,
    ts:    ts ?? Date.now(),
    alpha: 0.4,
    beta:  0.4,
    gamma: 0.2,
    score: 0,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CF-M2-02: short-term read behavior', () => {
  it('read returns top-k entries in descending score order', () => {
    const stm = new ShortTermMemory({ capacity: 128 });
    const now = Date.now();
    stm.write(makeEntry('a', 'debug session skill activated', now));
    stm.write(makeEntry('b', 'unrelated cooking recipe', now - 1000));
    stm.write(makeEntry('c', 'debug session refactoring', now - 500));

    const results = stm.read('debug session', 3);
    // 'a' and 'c' should score higher than 'b' due to relevance.
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(['a', 'c']).toContain(results[0].id);
  });

  it('read returns ≤ topK results', () => {
    const stm = new ShortTermMemory({ capacity: 256 });
    for (let i = 0; i < 50; i++) {
      stm.write(makeEntry(`e${i}`, `debug step ${i}`));
    }
    const results = stm.read('debug', 5);
    expect(results.length).toBeLessThanOrEqual(5);
  });

  it('all() returns entries in insertion order', () => {
    const stm = new ShortTermMemory({ capacity: 10 });
    for (let i = 0; i < 5; i++) stm.write(makeEntry(`e${i}`, `content ${i}`));
    const all = stm.all();
    expect(all.length).toBe(5);
    expect(all[0].id).toBe('e0');
    expect(all[4].id).toBe('e4');
  });

  it('getById() returns entry by id or null', () => {
    const stm = new ShortTermMemory({ capacity: 10 });
    stm.write(makeEntry('target', 'content'));
    expect(stm.getById('target')).not.toBeNull();
    expect(stm.getById('missing')).toBeNull();
  });
});

describe('ShortTermMemory: capacity + eviction', () => {
  it('evicts oldest entries when capacity exceeded', () => {
    const evicted: MemoryEntry[] = [];
    const stm = new ShortTermMemory({ capacity: 5, reflectAt: 0 });
    stm.onEvict = (batch) => { evicted.push(...batch); };

    for (let i = 0; i < 8; i++) stm.write(makeEntry(`e${i}`, `content ${i}`));

    // size should be capped at capacity
    expect(stm.size).toBeLessThanOrEqual(5);
    // oldest 3 should have been evicted
    expect(evicted.length).toBeGreaterThanOrEqual(1);
  });

  it('fires reflect callback at reflectAt threshold', async () => {
    const reflected: MemoryEntry[][] = [];
    const stm2 = new ShortTermMemory({ capacity: 20, reflectAt: 5 });
    stm2.onReflect = async (snapshot) => { reflected.push([...snapshot]); };

    for (let i = 0; i < 6; i++) await stm2.writeAsync(makeEntry(`e${i}`, `content ${i}`));

    expect(reflected.length).toBeGreaterThanOrEqual(1);
    expect(reflected[0].length).toBe(5);
  });

  it('flush() empties deque and fires onEvict', async () => {
    const evicted: MemoryEntry[] = [];
    const stm = new ShortTermMemory({ capacity: 50, reflectAt: 0 });
    stm.onEvict = async (batch) => { evicted.push(...batch); };

    for (let i = 0; i < 5; i++) stm.write(makeEntry(`e${i}`, `content ${i}`));
    expect(stm.size).toBe(5);

    await stm.flush();
    expect(stm.size).toBe(0);
    expect(evicted.length).toBe(5);
  });

  it('clear() empties without notifying onEvict', () => {
    const evicted: MemoryEntry[] = [];
    const stm = new ShortTermMemory({ capacity: 50, reflectAt: 0 });
    stm.onEvict = (batch) => { evicted.push(...batch); };

    for (let i = 0; i < 5; i++) stm.write(makeEntry(`e${i}`, `content ${i}`));
    stm.clear();

    expect(stm.size).toBe(0);
    expect(evicted.length).toBe(0);
  });
});
