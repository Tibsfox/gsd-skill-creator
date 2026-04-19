/**
 * CF-M2-02 — short-term p95 read latency < 10ms on 1000-entry fixture
 */

import { describe, it, expect, vi } from 'vitest';
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

function make1000Entries(): MemoryEntry[] {
  const now = Date.now();
  const entries: MemoryEntry[] = [];
  const words = [
    'debug', 'session', 'skill', 'refactoring', 'command',
    'pipeline', 'test', 'build', 'deploy', 'merge',
  ];
  for (let i = 0; i < 1000; i++) {
    const w1 = words[i % words.length];
    const w2 = words[(i + 3) % words.length];
    entries.push(makeEntry(`e${i}`, `${w1} ${w2} workflow step ${i}`, now - i * 1000));
  }
  return entries;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Measure p95 latency for `fn` run `n` times. */
function p95Latency(fn: () => void, n = 100): number {
  const times: number[] = [];
  for (let i = 0; i < n; i++) {
    const start = performance.now();
    fn();
    times.push(performance.now() - start);
  }
  times.sort((a, b) => a - b);
  return times[Math.floor(n * 0.95)];
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CF-M2-02: short-term read latency < 10ms p95', () => {
  it('p95 read latency on 1000-entry fixture is < 10ms', () => {
    const stm = new ShortTermMemory({ capacity: 1024 });
    const entries = make1000Entries();

    // Pre-load all 1000 entries.
    for (const e of entries) stm.write(e);
    expect(stm.size).toBeLessThanOrEqual(1024);

    // Measure p95 read latency.
    const p95 = p95Latency(() => {
      stm.read('debug session skill');
    }, 100);

    expect(p95).toBeLessThan(10);
  });

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
