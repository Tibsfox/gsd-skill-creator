/**
 * Tests for the BM25Strategy lexical channel and the RetrievalStrategy
 * contract. Verifies scoring properties, idempotent indexing, removal,
 * tokenisation, and the top-K + tie-breaking surface.
 */

import { describe, it, expect } from 'vitest';
import { BM25Strategy } from './lexical.js';
import type { RetrievalDoc } from './types.js';

function corpus(): RetrievalDoc[] {
  return [
    { id: 'a', text: 'the quick brown fox jumps over the lazy dog' },
    { id: 'b', text: 'a fast fox in the forest' },
    { id: 'c', text: 'algorithms for retrieval and ranking' },
    { id: 'd', text: 'lazy dog sleeps in the sun' },
    { id: 'e', text: 'quick algorithms beat slow ones' },
  ];
}

// ─── Contract: index / remove / size / clear ────────────────────────────────

describe('BM25Strategy: index lifecycle', () => {
  it('reports zero size on a fresh index', () => {
    const bm = new BM25Strategy();
    expect(bm.size()).toBe(0);
  });

  it('indexes documents and reports size', () => {
    const bm = new BM25Strategy();
    bm.indexAll(corpus());
    expect(bm.size()).toBe(5);
  });

  it('replaces a document on re-index (idempotent on id)', () => {
    const bm = new BM25Strategy();
    bm.index({ id: 'x', text: 'first version' });
    bm.index({ id: 'x', text: 'second version' });
    expect(bm.size()).toBe(1);
    const results = bm.search({ text: 'first' });
    expect(results).toEqual([]);
    const second = bm.search({ text: 'second' });
    expect(second).toHaveLength(1);
    expect(second[0].doc.id).toBe('x');
  });

  it('remove deletes a document and is a no-op when absent', () => {
    const bm = new BM25Strategy();
    bm.indexAll(corpus());
    bm.remove('a');
    expect(bm.size()).toBe(4);
    bm.remove('does-not-exist'); // no throw
    expect(bm.size()).toBe(4);
    const r = bm.search({ text: 'fox' });
    expect(r.map((x) => x.doc.id)).not.toContain('a');
  });

  it('clear drops all documents', () => {
    const bm = new BM25Strategy();
    bm.indexAll(corpus());
    bm.clear();
    expect(bm.size()).toBe(0);
    expect(bm.search({ text: 'fox' })).toEqual([]);
  });
});

// ─── Search behaviour ───────────────────────────────────────────────────────

describe('BM25Strategy: search', () => {
  it('returns an empty array on an empty index', () => {
    const bm = new BM25Strategy();
    expect(bm.search({ text: 'anything' })).toEqual([]);
  });

  it('ranks documents containing the query term above those without', () => {
    const bm = new BM25Strategy();
    bm.indexAll(corpus());
    const results = bm.search({ text: 'fox' });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.score > 0)).toBe(true);
    expect(results.map((r) => r.doc.id)).toContain('a');
    expect(results.map((r) => r.doc.id)).toContain('b');
    expect(results.map((r) => r.doc.id)).not.toContain('c');
  });

  it('prefers shorter documents when term frequency is equal (length normalisation)', () => {
    const bm = new BM25Strategy();
    bm.indexAll(corpus());
    const results = bm.search({ text: 'fox' });
    // Both 'a' (9 tokens) and 'b' (6 tokens) contain 'fox' exactly once.
    // BM25 with b=0.75 favours shorter doc; 'b' should beat 'a'.
    const a = results.find((r) => r.doc.id === 'a')!;
    const b = results.find((r) => r.doc.id === 'b')!;
    expect(b.score).toBeGreaterThan(a.score);
  });

  it('aggregates contributions across multiple query terms', () => {
    const bm = new BM25Strategy();
    bm.indexAll(corpus());
    const single = bm.search({ text: 'fox' });
    const both = bm.search({ text: 'fox forest' });
    const bSingle = single.find((r) => r.doc.id === 'b')!;
    const bBoth = both.find((r) => r.doc.id === 'b')!;
    // 'b' contains both 'fox' and 'forest'; multi-term score must
    // dominate single-term score on that doc.
    expect(bBoth.score).toBeGreaterThan(bSingle.score);
  });

  it('returns top-K results when more match than requested', () => {
    const bm = new BM25Strategy();
    bm.indexAll(corpus());
    const results = bm.search({ text: 'the', topK: 2 });
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it('deterministic id tie-breaking when scores are equal', () => {
    const bm = new BM25Strategy();
    bm.index({ id: 'z', text: 'foo' });
    bm.index({ id: 'm', text: 'foo' });
    bm.index({ id: 'a', text: 'foo' });
    const results = bm.search({ text: 'foo' });
    expect(results.map((r) => r.doc.id)).toEqual(['a', 'm', 'z']);
  });

  it('every result carries source = "bm25"', () => {
    const bm = new BM25Strategy();
    bm.indexAll(corpus());
    const results = bm.search({ text: 'algorithms' });
    expect(results.every((r) => r.source === 'bm25')).toBe(true);
  });

  it('returns nothing for queries with no matching terms', () => {
    const bm = new BM25Strategy();
    bm.indexAll(corpus());
    expect(bm.search({ text: 'unicorn' })).toEqual([]);
  });

  it('handles empty query text gracefully', () => {
    const bm = new BM25Strategy();
    bm.indexAll(corpus());
    expect(bm.search({ text: '' })).toEqual([]);
    expect(bm.search({ text: '   ' })).toEqual([]);
  });

  it('respects topK <= 0 as no-results', () => {
    const bm = new BM25Strategy();
    bm.indexAll(corpus());
    expect(bm.search({ text: 'fox', topK: 0 })).toEqual([]);
  });
});

// ─── Hyperparameters + tokenisation ─────────────────────────────────────────

describe('BM25Strategy: hyperparameters and tokeniser', () => {
  it('rejects k1 < 0 and b outside [0, 1]', () => {
    expect(() => new BM25Strategy({ k1: -0.1 })).toThrow(/k1/);
    expect(() => new BM25Strategy({ b: -0.1 })).toThrow(/b must be in/);
    expect(() => new BM25Strategy({ b: 1.5 })).toThrow(/b must be in/);
  });

  it('b=0 disables length normalisation (longer doc with same TF wins or ties on raw TF)', () => {
    const bm = new BM25Strategy({ b: 0 });
    bm.index({ id: 'short', text: 'fox' });
    bm.index({ id: 'long', text: 'fox fox fox in the deep forest somewhere' });
    const r = bm.search({ text: 'fox' });
    const longResult = r.find((x) => x.doc.id === 'long')!;
    const shortResult = r.find((x) => x.doc.id === 'short')!;
    // With b=0, BM25 ignores length and TF=3 beats TF=1.
    expect(longResult.score).toBeGreaterThan(shortResult.score);
  });

  it('supports a custom tokeniser', () => {
    const bm = new BM25Strategy({
      tokenize: (text) => text.split(/\s+/).filter(Boolean),
    });
    bm.index({ id: 'x', text: 'Fox-Trot ABCDEF' });
    // Default tokeniser would lowercase + split on non-word, producing
    // ['fox', 'trot', 'abcdef']. Custom tokeniser keeps 'Fox-Trot' whole.
    expect(bm.search({ text: 'Fox-Trot' })).toHaveLength(1);
    expect(bm.search({ text: 'fox' })).toHaveLength(0);
  });
});

// ─── Strategy interface contract ────────────────────────────────────────────

describe('BM25Strategy: RetrievalStrategy contract', () => {
  it('exposes a stable name', () => {
    expect(new BM25Strategy().name).toBe('bm25');
  });

  it('every search result has a positive score with the default tokeniser', () => {
    const bm = new BM25Strategy();
    bm.indexAll(corpus());
    const results = bm.search({ text: 'the lazy dog' });
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.score).toBeGreaterThan(0);
    }
  });

  it('preserves document metadata across the index/search roundtrip', () => {
    const bm = new BM25Strategy();
    bm.index({ id: 'm', text: 'metadata-bearing document', metadata: { tag: 'x' } });
    const r = bm.search({ text: 'metadata' });
    expect(r[0].doc.metadata).toEqual({ tag: 'x' });
  });
});
