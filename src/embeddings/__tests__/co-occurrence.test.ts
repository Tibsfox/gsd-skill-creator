/**
 * Co-occurrence extractor tests — sliding-window correctness, dedup, and
 * chronological ordering.
 *
 * @module embeddings/__tests__/co-occurrence.test
 */

import { describe, it, expect } from 'vitest';
import {
  extractCoOccurrencePairs,
  projectPairsToIds,
} from '../co-occurrence.js';
import type { DecisionTrace } from '../../types/memory.js';

function mkTrace(id: string, ts: number, entities: string[]): DecisionTrace {
  return {
    id,
    ts,
    actor: 'test',
    intent: 'co-occurrence-fixture',
    reasoning: '',
    constraints: [],
    alternatives: [],
    refs: { entityIds: entities },
  };
}

describe('extractCoOccurrencePairs — vocabulary + minCount', () => {
  it('drops entities below minCount', () => {
    const traces: DecisionTrace[] = [
      mkTrace('t1', 1, ['a', 'b']),
      mkTrace('t2', 2, ['a', 'b']),
      mkTrace('t3', 3, ['a', 'c']), // c only appears once
    ];
    const r = extractCoOccurrencePairs(traces, {
      windowSize: 1,
      minCount: 2,
    });
    expect(r.vocabulary).toEqual(['a', 'b']);
    expect(r.vocabIndex.get('c')).toBeUndefined();
  });

  it('sorts vocabulary ascending for stable indices', () => {
    const traces: DecisionTrace[] = [
      mkTrace('t1', 1, ['zebra', 'alpha', 'mango']),
      mkTrace('t2', 2, ['zebra', 'alpha', 'mango']),
    ];
    const r = extractCoOccurrencePairs(traces, { windowSize: 1, minCount: 2 });
    expect(r.vocabulary).toEqual(['alpha', 'mango', 'zebra']);
    expect(r.vocabIndex.get('alpha')).toBe(0);
    expect(r.vocabIndex.get('mango')).toBe(1);
    expect(r.vocabIndex.get('zebra')).toBe(2);
  });

  it('counts each entity once per trace even when repeated', () => {
    const traces: DecisionTrace[] = [
      mkTrace('t1', 1, ['a', 'a', 'a']),
      mkTrace('t2', 2, ['a']),
    ];
    const r = extractCoOccurrencePairs(traces, { windowSize: 1, minCount: 1 });
    expect(r.counts.get('a')).toBe(2);
  });
});

describe('extractCoOccurrencePairs — intra-trace window=1', () => {
  it('emits all ordered entity pairs within a single trace, excluding self', () => {
    const traces: DecisionTrace[] = [
      mkTrace('t1', 1, ['a', 'b', 'c']),
      mkTrace('t2', 2, ['a', 'b', 'c']),
    ];
    const r = extractCoOccurrencePairs(traces, {
      windowSize: 1,
      minCount: 1,
      deduplicate: true,
    });
    // Each trace contributes 3*2 = 6 ordered pairs; dedup across traces
    // collapses identical pairs → 6 unique.
    expect(r.pairs.length).toBe(6);
    for (const p of r.pairs) {
      expect(p.center).not.toBe(p.context);
    }
    const keys = new Set(r.pairs.map((p) => `${p.center}→${p.context}`));
    expect(keys.has('a→b')).toBe(true);
    expect(keys.has('b→a')).toBe(true);
    expect(keys.has('c→a')).toBe(true);
  });
});

describe('extractCoOccurrencePairs — sliding window', () => {
  it('window=2 reaches adjacent traces', () => {
    const traces: DecisionTrace[] = [
      mkTrace('t1', 1, ['a']),
      mkTrace('t2', 2, ['b']),
      mkTrace('t3', 3, ['c']),
    ];
    const r = extractCoOccurrencePairs(traces, {
      windowSize: 2,
      minCount: 1,
      deduplicate: true,
    });
    // Pairs emitted (a,b), (b,a), (b,c), (c,b), (a,a-excluded), (c,c-excluded).
    // With window=2 and 3 singleton-entity traces:
    //   center at t1 (a) sees traces 1..2 → contexts {a,b} → (a,b)
    //   center at t2 (b) sees traces 1..3 → contexts {a,b,c} → (b,a),(b,c)
    //   center at t3 (c) sees traces 2..3 → contexts {b,c} → (c,b)
    const keys = new Set(r.pairs.map((p) => `${p.center}→${p.context}`));
    expect(keys.has('a→b')).toBe(true);
    expect(keys.has('b→a')).toBe(true);
    expect(keys.has('b→c')).toBe(true);
    expect(keys.has('c→b')).toBe(true);
    // Non-adjacent pair must NOT appear.
    expect(keys.has('a→c')).toBe(false);
    expect(keys.has('c→a')).toBe(false);
  });

  it('window=3 spans two hops', () => {
    const traces: DecisionTrace[] = [
      mkTrace('t1', 1, ['a']),
      mkTrace('t2', 2, ['b']),
      mkTrace('t3', 3, ['c']),
    ];
    const r = extractCoOccurrencePairs(traces, {
      windowSize: 3,
      minCount: 1,
      deduplicate: true,
    });
    const keys = new Set(r.pairs.map((p) => `${p.center}→${p.context}`));
    expect(keys.has('a→c')).toBe(true);
    expect(keys.has('c→a')).toBe(true);
  });

  it('rejects windowSize < 1', () => {
    expect(() =>
      extractCoOccurrencePairs([], { windowSize: 0, minCount: 1 }),
    ).toThrow();
  });
});

describe('extractCoOccurrencePairs — chronological order', () => {
  it('sorts traces by (ts, id) even when input is scrambled', () => {
    const traces: DecisionTrace[] = [
      mkTrace('t3', 3, ['c']),
      mkTrace('t1', 1, ['a']),
      mkTrace('t2', 2, ['b']),
    ];
    const r = extractCoOccurrencePairs(traces, {
      windowSize: 2,
      minCount: 1,
      deduplicate: true,
    });
    const keys = new Set(r.pairs.map((p) => `${p.center}→${p.context}`));
    // (a,b) must appear (adjacent after sort); (a,c) must NOT (non-adjacent).
    expect(keys.has('a→b')).toBe(true);
    expect(keys.has('a→c')).toBe(false);
  });

  it('ties on ts are broken by id ascending', () => {
    const traces: DecisionTrace[] = [
      mkTrace('tB', 5, ['b']),
      mkTrace('tA', 5, ['a']),
      mkTrace('tC', 5, ['c']),
    ];
    const r = extractCoOccurrencePairs(traces, {
      windowSize: 2,
      minCount: 1,
      deduplicate: true,
    });
    // Sorted by id: tA, tB, tC → a, b, c with adjacency window=2.
    const keys = new Set(r.pairs.map((p) => `${p.center}→${p.context}`));
    expect(keys.has('a→b')).toBe(true);
    expect(keys.has('a→c')).toBe(false);
    expect(keys.has('b→c')).toBe(true);
  });
});

describe('extractCoOccurrencePairs — deduplicate flag', () => {
  it('deduplicate=false emits repeated pairs', () => {
    const traces: DecisionTrace[] = [
      mkTrace('t1', 1, ['a', 'b']),
      mkTrace('t2', 2, ['a', 'b']),
    ];
    const noDedup = extractCoOccurrencePairs(traces, {
      windowSize: 1,
      minCount: 1,
      deduplicate: false,
    });
    const dedup = extractCoOccurrencePairs(traces, {
      windowSize: 1,
      minCount: 1,
      deduplicate: true,
    });
    expect(noDedup.pairs.length).toBeGreaterThan(dedup.pairs.length);
  });
});

describe('projectPairsToIds', () => {
  it('drops pairs whose entities are missing from the vocab index', () => {
    const vocabIndex = new Map([
      ['a', 0],
      ['b', 1],
    ]);
    const projected = projectPairsToIds(
      [
        { center: 'a', context: 'b' },
        { center: 'a', context: 'z' }, // z missing → drop
        { center: 'b', context: 'a' },
      ],
      vocabIndex,
    );
    expect(projected).toEqual([
      { center: 0, context: 1 },
      { center: 1, context: 0 },
    ]);
  });
});
