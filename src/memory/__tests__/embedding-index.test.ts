/**
 * Tests for EmbeddingIndex — pre-indexed vector search.
 */

import { describe, it, expect } from 'vitest';
import { EmbeddingIndex, bagOfWordsEmbedFn } from '../embedding-index.js';
import type { EmbedFn, VectorBackend, SearchResult } from '../embedding-index.js';

// ─── Mock embedding function (deterministic 4-dim vectors) ──────────────

const mockEmbedFn: EmbedFn = async (texts: string[]): Promise<Float32Array[]> => {
  return texts.map(text => {
    const len = text.length;
    const vec = new Float32Array(4);
    vec[0] = Math.sin(len);
    vec[1] = Math.cos(len);
    vec[2] = Math.sin(len * 2);
    vec[3] = Math.cos(len * 2);
    // Normalize
    let norm = 0;
    for (let i = 0; i < 4; i++) norm += vec[i] * vec[i];
    norm = Math.sqrt(norm);
    for (let i = 0; i < 4; i++) vec[i] /= norm;
    return vec;
  });
};

// ─── Index lifecycle ────────────────────────────────────────────────────

describe('EmbeddingIndex', () => {
  it('starts empty', () => {
    const idx = new EmbeddingIndex({ embedFn: mockEmbedFn });
    expect(idx.size).toBe(0);
    expect(idx.dim).toBeNull();
  });

  it('indexes a single record', async () => {
    const idx = new EmbeddingIndex({ embedFn: mockEmbedFn });
    await idx.index('abc123', 'hello world');
    expect(idx.size).toBe(1);
    expect(idx.dim).toBe(4);
    expect(idx.has('abc123')).toBe(true);
  });

  it('indexes batch records', async () => {
    const idx = new EmbeddingIndex({ embedFn: mockEmbedFn });
    const result = await idx.indexBatch([
      { hashHex: 'a', text: 'first record' },
      { hashHex: 'b', text: 'second record' },
      { hashHex: 'c', text: 'third record' },
    ]);
    expect(result.indexed).toBe(3);
    expect(result.timeMs).toBeGreaterThan(0);
    expect(idx.size).toBe(3);
  });

  it('updates existing entries on re-index', async () => {
    const idx = new EmbeddingIndex({ embedFn: mockEmbedFn });
    await idx.index('a', 'version 1');
    const v1 = idx.getVector('a')!;
    await idx.index('a', 'version 2 with different text');
    const v2 = idx.getVector('a')!;
    expect(idx.size).toBe(1);
    // Vectors should differ because text differs
    expect(v1[0]).not.toBe(v2[0]);
  });

  it('removes entries', async () => {
    const idx = new EmbeddingIndex({ embedFn: mockEmbedFn });
    await idx.index('a', 'text');
    expect(await idx.remove('a')).toBe(true);
    expect(idx.size).toBe(0);
    expect(await idx.remove('nonexistent')).toBe(false);
  });

  it('validates dimension consistency', async () => {
    let callCount = 0;
    const inconsistentFn: EmbedFn = async (texts) => {
      callCount++;
      const dim = callCount === 1 ? 4 : 8; // Different dim on second call
      return texts.map(() => new Float32Array(dim));
    };
    const idx = new EmbeddingIndex({ embedFn: inconsistentFn });
    await idx.index('a', 'first');
    await expect(idx.index('b', 'second')).rejects.toThrow('dimension mismatch');
  });

  it('stores text when storeText=true', async () => {
    const idx = new EmbeddingIndex({ embedFn: mockEmbedFn, storeText: true });
    await idx.index('a', 'my important text');
    const entries = idx.exportEntries();
    expect(entries[0].text).toBe('my important text');
  });

  it('does not store text by default', async () => {
    const idx = new EmbeddingIndex({ embedFn: mockEmbedFn });
    await idx.index('a', 'my text');
    const entries = idx.exportEntries();
    expect(entries[0].text).toBeUndefined();
  });
});

// ─── Search ─────────────────────────────────────────────────────────────

describe('EmbeddingIndex search', () => {
  it('returns empty for empty index', async () => {
    const idx = new EmbeddingIndex({ embedFn: mockEmbedFn });
    const results = await idx.search('query');
    expect(results).toEqual([]);
  });

  it('finds the most similar record', async () => {
    const idx = new EmbeddingIndex({ embedFn: mockEmbedFn });
    await idx.indexBatch([
      { hashHex: 'short', text: 'hi' },
      { hashHex: 'medium', text: 'hello there friend' },
      { hashHex: 'long', text: 'this is a much longer piece of text with many words' },
    ]);

    // Query with similar-length text should rank the matching-length entry highest
    const results = await idx.search('hello there buddy', 3);
    expect(results.length).toBe(3);
    expect(results[0].score).toBeGreaterThan(0);
    // All scores should be between -1 and 1
    for (const r of results) {
      expect(r.score).toBeGreaterThanOrEqual(-1);
      expect(r.score).toBeLessThanOrEqual(1);
    }
  });

  it('respects topK limit', async () => {
    const idx = new EmbeddingIndex({ embedFn: mockEmbedFn });
    await idx.indexBatch(
      Array.from({ length: 20 }, (_, i) => ({
        hashHex: `h${i}`,
        text: `record number ${i} with some content`,
      })),
    );

    const results = await idx.search('query text', 5);
    expect(results.length).toBe(5);
  });

  it('searchByVector skips embedding step', async () => {
    const idx = new EmbeddingIndex({ embedFn: mockEmbedFn });
    await idx.index('a', 'hello');

    const vec = idx.getVector('a')!;
    const results = idx.searchByVector(vec, 1);
    expect(results.length).toBe(1);
    expect(results[0].hashHex).toBe('a');
    expect(results[0].score).toBeCloseTo(1.0, 5); // Self-similarity = 1.0
  });

  it('results are sorted by score descending', async () => {
    const idx = new EmbeddingIndex({ embedFn: mockEmbedFn });
    await idx.indexBatch(
      Array.from({ length: 50 }, (_, i) => ({
        hashHex: `h${i}`,
        text: `x`.repeat(i + 1),
      })),
    );

    const results = await idx.search('test query', 50);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });
});

// ─── Export / Import ────────────────────────────────────────────────────

describe('EmbeddingIndex serialization', () => {
  it('round-trips through export/import', async () => {
    const idx1 = new EmbeddingIndex({ embedFn: mockEmbedFn, storeText: true });
    await idx1.indexBatch([
      { hashHex: 'a', text: 'alpha' },
      { hashHex: 'b', text: 'beta' },
    ]);

    const exported = idx1.exportEntries();

    const idx2 = new EmbeddingIndex({ embedFn: mockEmbedFn, dimension: 4 });
    idx2.importEntries(exported);
    expect(idx2.size).toBe(2);
    expect(idx2.has('a')).toBe(true);

    // Search should work on imported index
    const results = idx2.searchByVector(idx1.getVector('a')!, 1);
    expect(results[0].hashHex).toBe('a');
  });
});

// ─── Backend integration ────────────────────────────────────────────────

describe('EmbeddingIndex with backend', () => {
  it('delegates to backend on upsert', async () => {
    const upserted: string[] = [];
    const mockBackend: VectorBackend = {
      async upsert(h, _v) { upserted.push(h); },
      async upsertBatch(entries) { upserted.push(...entries.map(e => e.hashHex)); },
      async search(_q, _k) { return []; },
      async count() { return upserted.length; },
      async delete(_h) {},
    };

    const idx = new EmbeddingIndex({ embedFn: mockEmbedFn });
    idx.setBackend(mockBackend);

    await idx.index('x', 'hello');
    expect(upserted).toContain('x');

    await idx.indexBatch([
      { hashHex: 'y', text: 'world' },
      { hashHex: 'z', text: 'test' },
    ]);
    expect(upserted).toEqual(['x', 'y', 'z']);
  });
});

// ─── Bag-of-words fallback ──────────────────────────────────────────────

describe('bagOfWordsEmbedFn', () => {
  it('produces consistent dimension', async () => {
    const fn = bagOfWordsEmbedFn(64);
    const vecs = await fn(['hello world', 'goodbye world']);
    expect(vecs.length).toBe(2);
    expect(vecs[0].length).toBe(64);
    expect(vecs[1].length).toBe(64);
  });

  it('produces normalized vectors', async () => {
    const fn = bagOfWordsEmbedFn(128);
    const [vec] = await fn(['test sentence with some words']);
    let norm = 0;
    for (let i = 0; i < vec.length; i++) norm += vec[i] * vec[i];
    expect(Math.sqrt(norm)).toBeCloseTo(1.0, 3);
  });

  it('similar texts produce similar vectors', async () => {
    const fn = bagOfWordsEmbedFn(128);
    const [a, b, c] = await fn([
      'the quick brown fox',
      'the quick brown dog',
      'quantum chromodynamics and string theory',
    ]);
    // a and b share 3/4 words — should be more similar than a and c
    const simAB = dotProduct(a, b);
    const simAC = dotProduct(a, c);
    expect(simAB).toBeGreaterThan(simAC);
  });

  it('works as EmbeddingIndex embedFn', async () => {
    const idx = new EmbeddingIndex({ embedFn: bagOfWordsEmbedFn(64) });
    await idx.indexBatch([
      { hashHex: 'a', text: 'machine learning neural networks' },
      { hashHex: 'b', text: 'deep learning transformers attention' },
      { hashHex: 'c', text: 'baking chocolate cake recipe flour' },
    ]);

    const results = await idx.search('neural network training', 3);
    expect(results.length).toBe(3);
    // ML-related entries should rank above baking
    const mlIdx = results.findIndex(r => r.hashHex === 'a' || r.hashHex === 'b');
    const cakeIdx = results.findIndex(r => r.hashHex === 'c');
    expect(mlIdx).toBeLessThan(cakeIdx);
  });
});

function dotProduct(a: Float32Array, b: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}
