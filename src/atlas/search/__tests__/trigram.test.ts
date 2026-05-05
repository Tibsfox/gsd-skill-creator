import { describe, it, expect } from 'vitest';
import { TrigramIndex } from '../trigram.js';
import { lcsLength, exactMatchBoost, compositeScore } from '../scorer.js';

interface Item {
  id: string;
  name: string;
}

function mkIndex(items: Item[]): TrigramIndex<Item> {
  const idx = new TrigramIndex<Item>();
  for (const it of items) idx.add(it, it.name);
  return idx;
}

describe('TrigramIndex', () => {
  it('add+search round-trip returns the inserted item', () => {
    const idx = new TrigramIndex<Item>();
    idx.add({ id: '1', name: 'useFoo' }, 'useFoo');
    const results = idx.search('useFoo');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('1');
  });

  it('multi-trigram intersection narrows candidates', () => {
    const idx = mkIndex([
      { id: 'a', name: 'useFooBar' },
      { id: 'b', name: 'helloWorld' },
      { id: 'c', name: 'fooBarBaz' },
      { id: 'd', name: 'fooQuux' },
    ]);
    const results = idx.search('FooBar');
    const ids = results.map((r) => r.id);
    expect(ids).toContain('a');
    expect(ids).toContain('c');
    expect(ids).not.toContain('b');
  });

  it('ranks exact match above substring match', () => {
    const idx = mkIndex([
      { id: 'long', name: 'someUseFooHelper' },
      { id: 'exact', name: 'useFoo' },
      { id: 'other', name: 'useFooBar' },
    ]);
    const results = idx.search('useFoo');
    expect(results[0].id).toBe('exact');
  });

  it('case-insensitive matches by default', () => {
    const idx = mkIndex([{ id: 'x', name: 'UseFooBar' }]);
    const lower = idx.search('usefoo');
    const upper = idx.search('USEFOO');
    expect(lower.length).toBe(1);
    expect(upper.length).toBe(1);
    expect(lower[0].id).toBe('x');
  });

  it('returns empty array for query with no matching trigram', () => {
    const idx = mkIndex([{ id: '1', name: 'hello' }]);
    expect(idx.search('xyzzy')).toEqual([]);
  });

  it('handles short queries (<3 chars) via fallback substring scan', () => {
    const idx = mkIndex([
      { id: '1', name: 'aaXXbb' },
      { id: '2', name: 'cccccc' },
    ]);
    const results = idx.search('XX');
    expect(results.map((r) => r.id)).toContain('1');
    expect(results.map((r) => r.id)).not.toContain('2');
  });

  it('returns at most `limit` results', () => {
    const items: Item[] = [];
    for (let i = 0; i < 20; i++) items.push({ id: String(i), name: `barItem${i}` });
    const idx = mkIndex(items);
    const results = idx.search('barItem', 5);
    expect(results.length).toBeLessThanOrEqual(5);
  });

  it('first-match-bonus prefers earlier positions', () => {
    const idx = mkIndex([
      { id: 'late', name: 'zzzzzzzzzzuseFoo' },
      { id: 'early', name: 'useFoo_module' },
    ]);
    const results = idx.search('useFoo');
    expect(results[0].id).toBe('early');
  });

  it('lcs scorer is monotone in matched-character count', () => {
    expect(lcsLength('abc', 'abc')).toBe(3);
    expect(lcsLength('abc', 'aXbXc')).toBe(3);
    expect(lcsLength('abc', 'aXc')).toBe(2);
    expect(exactMatchBoost('abc', 'abc')).toBe(1);
    expect(exactMatchBoost('abc', 'abcd')).toBe(0);
    expect(compositeScore('abc', 'abc')).toBeGreaterThan(compositeScore('abc', 'abcd'));
  });

  it('size() reflects insertions', () => {
    const idx = new TrigramIndex<Item>();
    expect(idx.size()).toBe(0);
    idx.add({ id: '1', name: 'one' }, 'one');
    idx.add({ id: '2', name: 'two' }, 'two');
    expect(idx.size()).toBe(2);
  });

  it('performance: 50K items, 100 queries total <500ms', () => {
    const idx = new TrigramIndex<Item>();
    // Deterministic random fixture.
    let seed = 0xdeadbeef >>> 0;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0xffffffff;
    };
    const alpha = 'abcdefghijklmnopqrstuvwxyz';
    const fixtures: string[] = [];
    for (let i = 0; i < 50_000; i++) {
      const len = 6 + Math.floor(rand() * 14);
      let s = '';
      for (let j = 0; j < len; j++) {
        s += alpha[Math.floor(rand() * alpha.length)];
      }
      fixtures.push(s);
      idx.add({ id: String(i), name: s }, s);
    }

    // Build 100 queries from random 4-char slices of the fixtures so each is
    // realistic (mix of hits + likely-misses).
    const queries: string[] = [];
    for (let i = 0; i < 100; i++) {
      const src = fixtures[Math.floor(rand() * fixtures.length)];
      const start = Math.floor(rand() * Math.max(1, src.length - 4));
      queries.push(src.slice(start, start + 4));
    }

    const t0 = performance.now();
    for (const q of queries) {
      idx.search(q, 10);
    }
    const elapsed = performance.now() - t0;
    expect(elapsed).toBeLessThan(500);
    // Capture the headline number for the report.
    // eslint-disable-next-line no-console
    console.log(`[trigram-perf] 50K items, 100 queries, total ${elapsed.toFixed(2)}ms, p_avg=${(elapsed / 100).toFixed(2)}ms`);
  });
});
