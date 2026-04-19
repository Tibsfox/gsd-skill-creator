/**
 * CF-M5-02: prefix-cache hit ≥60% on KVFlow-analogue fixture.
 *
 * Also covers FIFO eviction correctness and clear semantics.
 *
 * @module cache/__tests__/prefix-index.test
 */

import { describe, it, expect } from 'vitest';
import { PrefixIndex } from '../prefix-index.js';

/**
 * KVFlow-analogue step-graph fixture generator: builds a workload whose
 * transitions concentrate mass in a small set of prefix chains. This mimics
 * the KVFlow paper's observation that agent workflows exhibit heavy-tailed
 * step distributions — a small minority of common prefixes accounts for the
 * majority of cache lookups.
 *
 * Returns (training, query) split suitable for CF-M5-02 measurement.
 */
function buildKvFlowFixture(): {
  training: Array<{ prefix: string[]; next: string[] }>;
  queries: string[][];
} {
  // 5 hot paths: each is a 3-hop chain followed by a next-skill.
  const hotPaths: Array<{ prefix: string[]; next: string[] }> = [
    { prefix: ['read', 'grep', 'edit'], next: ['bash', 'write'] },
    { prefix: ['glob', 'read', 'write'], next: ['edit', 'bash'] },
    { prefix: ['bash', 'read', 'grep'], next: ['edit'] },
    { prefix: ['edit', 'bash', 'grep'], next: ['read'] },
    { prefix: ['write', 'edit', 'bash'], next: ['read', 'grep'] },
  ];
  const coldPaths: Array<{ prefix: string[]; next: string[] }> = [
    { prefix: ['glob', 'write', 'edit'], next: ['bash'] },
    { prefix: ['read', 'edit', 'write'], next: ['bash'] },
    { prefix: ['read', 'bash', 'edit'], next: ['write'] },
  ];

  const queries: string[][] = [];
  // Hot queries dominate: 80% of lookup mass lands on hot paths.
  for (let i = 0; i < 80; i++) {
    queries.push(hotPaths[i % hotPaths.length].prefix);
  }
  for (let i = 0; i < 20; i++) {
    queries.push(coldPaths[i % coldPaths.length].prefix);
  }

  return { training: [...hotPaths, ...coldPaths], queries };
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('PrefixIndex — basic', () => {
  it('records and looks up exact prefixes', () => {
    const idx = new PrefixIndex();
    idx.record(['read', 'grep'], ['edit', 'bash']);
    const hit = idx.lookup(['read', 'grep']);
    expect(hit).not.toBeNull();
    expect(hit!.skillIds.sort()).toEqual(['bash', 'edit']);
  });

  it('returns null for unseen prefixes', () => {
    const idx = new PrefixIndex();
    idx.record(['read'], ['edit']);
    expect(idx.lookup(['bash'])).toBeNull();
  });

  it('merges new skill ids into existing prefix payloads (dedup)', () => {
    const idx = new PrefixIndex();
    idx.record(['read'], ['edit']);
    idx.record(['read'], ['edit', 'bash']);
    const hit = idx.lookup(['read'])!;
    expect(hit.skillIds.sort()).toEqual(['bash', 'edit']);
  });

  it('increments hit counters on each lookup', () => {
    const idx = new PrefixIndex();
    idx.record(['read'], ['edit']);
    idx.lookup(['read']);
    idx.lookup(['read']);
    expect(idx.hitCount).toBe(2);
    expect(idx.lookupCount).toBe(2);
  });
});

describe('PrefixIndex — prefix-length bounds', () => {
  it('truncates prefixes longer than maxPrefixLen', () => {
    const idx = new PrefixIndex({ maxPrefixLen: 2 });
    idx.record(['a', 'b', 'c', 'd'], ['x']);
    // Truncated to last 2 hops: ['c', 'd'].
    const hit = idx.lookup(['c', 'd'])!;
    expect(hit).not.toBeNull();
    expect(hit.skillIds).toEqual(['x']);
    expect(idx.lookup(['a', 'b'])).toBeNull();
  });
});

describe('PrefixIndex — FIFO eviction', () => {
  it('evicts oldest entries past maxEntries', () => {
    const idx = new PrefixIndex({ maxEntries: 2 });
    idx.record(['a'], ['1']);
    idx.record(['b'], ['2']);
    idx.record(['c'], ['3']); // evicts ['a']
    expect(idx.lookup(['a'])).toBeNull();
    expect(idx.lookup(['b'])).not.toBeNull();
    expect(idx.lookup(['c'])).not.toBeNull();
    expect(idx.size()).toBe(2);
  });

  it('size stays bounded under many inserts', () => {
    const idx = new PrefixIndex({ maxEntries: 10 });
    for (let i = 0; i < 100; i++) {
      idx.record([`hop-${i}`], [`skill-${i}`]);
    }
    expect(idx.size()).toBeLessThanOrEqual(10);
  });
});

describe('PrefixIndex — clear', () => {
  it('empties all state', () => {
    const idx = new PrefixIndex();
    idx.record(['a'], ['x']);
    idx.lookup(['a']);
    idx.clear();
    expect(idx.size()).toBe(0);
    expect(idx.lookupCount).toBe(0);
    expect(idx.hitCount).toBe(0);
    expect(idx.lookup(['a'])).toBeNull();
  });
});

describe('CF-M5-02: prefix-cache hit ≥60% on KVFlow-analogue fixture', () => {
  it('achieves ≥60% hit rate on hot-path-dominated workload', () => {
    const { training, queries } = buildKvFlowFixture();
    const idx = new PrefixIndex({ maxEntries: 128, maxPrefixLen: 4 });

    // Train: record hot + cold paths into the cache.
    for (const { prefix, next } of training) {
      idx.record(prefix, next);
    }

    // Measure hit rate on the query workload.
    for (const q of queries) {
      idx.lookup(q);
    }

    expect(idx.hitRate()).toBeGreaterThanOrEqual(0.6);
  });

  it('sustains hit rate across repeated query passes', () => {
    const { training, queries } = buildKvFlowFixture();
    const idx = new PrefixIndex({ maxEntries: 128, maxPrefixLen: 4 });
    for (const { prefix, next } of training) idx.record(prefix, next);

    for (let rep = 0; rep < 3; rep++) {
      for (const q of queries) idx.lookup(q);
    }
    expect(idx.hitRate()).toBeGreaterThanOrEqual(0.6);
  });
});
