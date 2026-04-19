/**
 * Read-API tests — lookup, cosine bounds, nearest-neighbour, access cache.
 *
 * @module embeddings/__tests__/api.test
 */

import { describe, it, expect } from 'vitest';
import {
  buildStore,
  getEmbedding,
  cosineSimilarity,
  cosineByIndex,
  nearestNeighbours,
  EmbeddingAccessCache,
} from '../api.js';
import type { SkipGramModel } from '../skip-gram.js';

function fixedStore() {
  // 4 entities, dim=3, hand-chosen values.
  const vocabulary = ['alpha', 'beta', 'gamma', 'delta'];
  const vocabIndex = new Map(vocabulary.map((v, i) => [v, i]));
  // alpha: [1, 0, 0], beta: [0.8, 0.2, 0], gamma: [0, 1, 0], delta: [0, 0, 1]
  const matrix = new Float64Array([
    1, 0, 0,
    0.8, 0.2, 0,
    0, 1, 0,
    0, 0, 1,
  ]);
  const model: SkipGramModel = {
    vocabSize: vocabulary.length,
    dim: 3,
    inputEmbeddings: matrix,
    outputEmbeddings: new Float64Array(matrix.length),
  };
  const store = buildStore(model, vocabulary, vocabIndex);
  return { store, vocabulary };
}

describe('buildStore', () => {
  it('validates vocabulary/model agreement', () => {
    const model: SkipGramModel = {
      vocabSize: 2,
      dim: 1,
      inputEmbeddings: new Float64Array([1, 2]),
      outputEmbeddings: new Float64Array(2),
    };
    expect(() => buildStore(model, ['a'], new Map([['a', 0]]))).toThrow();
  });
});

describe('getEmbedding', () => {
  it('returns a copy for known entities', () => {
    const { store } = fixedStore();
    const e = getEmbedding(store, 'alpha');
    expect(e).toEqual([1, 0, 0]);
    if (e) e[0] = 999;
    // Underlying matrix unchanged.
    expect(store.matrix[0]).toBe(1);
  });

  it('returns null for unknown entities', () => {
    const { store } = fixedStore();
    expect(getEmbedding(store, 'nonexistent')).toBeNull();
  });
});

describe('cosineSimilarity', () => {
  it('returns 1 for identical entity (self-similarity)', () => {
    const { store } = fixedStore();
    expect(cosineSimilarity(store, 'alpha', 'alpha')).toBeCloseTo(1, 10);
  });

  it('returns 0 for orthogonal vectors', () => {
    const { store } = fixedStore();
    expect(cosineSimilarity(store, 'alpha', 'gamma')).toBeCloseTo(0, 10);
    expect(cosineSimilarity(store, 'alpha', 'delta')).toBeCloseTo(0, 10);
  });

  it('bounds output in [-1, 1]', () => {
    const { store, vocabulary } = fixedStore();
    for (const a of vocabulary) {
      for (const b of vocabulary) {
        const c = cosineSimilarity(store, a, b);
        expect(c).toBeGreaterThanOrEqual(-1);
        expect(c).toBeLessThanOrEqual(1);
      }
    }
  });

  it('matches the hand-computed cosine for known vectors', () => {
    const { store } = fixedStore();
    // alpha=[1,0,0], beta=[0.8,0.2,0]
    // dot = 0.8; |alpha|=1; |beta|=sqrt(0.68)
    const expected = 0.8 / Math.sqrt(0.68);
    expect(cosineSimilarity(store, 'alpha', 'beta')).toBeCloseTo(expected, 10);
  });

  it('returns 0 for unknown entities', () => {
    const { store } = fixedStore();
    expect(cosineSimilarity(store, 'alpha', 'zzz')).toBe(0);
    expect(cosineSimilarity(store, 'zzz', 'alpha')).toBe(0);
  });

  it('returns 0 for zero-norm vectors', () => {
    const model: SkipGramModel = {
      vocabSize: 2,
      dim: 2,
      inputEmbeddings: new Float64Array([0, 0, 1, 1]),
      outputEmbeddings: new Float64Array(4),
    };
    const store = buildStore(
      model,
      ['zero', 'ones'],
      new Map([
        ['zero', 0],
        ['ones', 1],
      ]),
    );
    expect(cosineSimilarity(store, 'zero', 'ones')).toBe(0);
  });

  it('handles handedly negative cosine', () => {
    const model: SkipGramModel = {
      vocabSize: 2,
      dim: 2,
      inputEmbeddings: new Float64Array([1, 0, -1, 0]),
      outputEmbeddings: new Float64Array(4),
    };
    const store = buildStore(
      model,
      ['a', 'b'],
      new Map([
        ['a', 0],
        ['b', 1],
      ]),
    );
    expect(cosineSimilarity(store, 'a', 'b')).toBeCloseTo(-1, 10);
  });
});

describe('cosineByIndex', () => {
  it('matches cosineSimilarity by entity id', () => {
    const { store, vocabulary } = fixedStore();
    for (let i = 0; i < vocabulary.length; i++) {
      for (let j = 0; j < vocabulary.length; j++) {
        const byIdx = cosineByIndex(store, i, j);
        const byId = cosineSimilarity(store, vocabulary[i], vocabulary[j]);
        expect(byIdx).toBeCloseTo(byId, 12);
      }
    }
  });
});

describe('nearestNeighbours', () => {
  it('returns top-k excluding the query entity, sorted by similarity desc', () => {
    const { store } = fixedStore();
    const nn = nearestNeighbours(store, 'alpha', 3);
    expect(nn.length).toBe(3);
    expect(nn[0].entityId).toBe('beta'); // highest cosine
    for (let i = 1; i < nn.length; i++) {
      expect(nn[i - 1].similarity).toBeGreaterThanOrEqual(nn[i].similarity);
    }
    expect(nn.some((n) => n.entityId === 'alpha')).toBe(false);
  });

  it('returns [] for unknown entity', () => {
    const { store } = fixedStore();
    expect(nearestNeighbours(store, 'nope', 3)).toEqual([]);
  });

  it('breaks ties deterministically by entityId ascending', () => {
    // Construct a store where alpha has equal cosine to both beta and gamma.
    const model: SkipGramModel = {
      vocabSize: 3,
      dim: 2,
      // alpha=[1,0], beta=[1,0] (cos=1), gamma=[1,0] (cos=1)
      inputEmbeddings: new Float64Array([1, 0, 1, 0, 1, 0]),
      outputEmbeddings: new Float64Array(6),
    };
    const store = buildStore(
      model,
      ['alpha', 'beta', 'gamma'],
      new Map([
        ['alpha', 0],
        ['beta', 1],
        ['gamma', 2],
      ]),
    );
    const nn = nearestNeighbours(store, 'alpha', 2);
    expect(nn[0].entityId).toBe('beta');
    expect(nn[1].entityId).toBe('gamma');
  });

  it('k=0 returns empty list', () => {
    const { store } = fixedStore();
    expect(nearestNeighbours(store, 'alpha', 0)).toEqual([]);
  });
});

describe('EmbeddingAccessCache', () => {
  it('memoises hits and misses', () => {
    const { store } = fixedStore();
    const cache = new EmbeddingAccessCache(store);
    expect(cache.size()).toBe(0);
    cache.get('alpha');
    expect(cache.size()).toBe(1);
    cache.get('alpha'); // hit
    expect(cache.size()).toBe(1);
    cache.get('missing');
    expect(cache.size()).toBe(2);
    // Returned value for missing is null, but still memoised.
    expect(cache.get('missing')).toBeNull();
  });

  it('cosine passes through to cosineSimilarity', () => {
    const { store } = fixedStore();
    const cache = new EmbeddingAccessCache(store);
    expect(cache.cosine('alpha', 'alpha')).toBeCloseTo(1, 10);
  });

  it('clear() empties the memo', () => {
    const { store } = fixedStore();
    const cache = new EmbeddingAccessCache(store);
    cache.get('alpha');
    cache.clear();
    expect(cache.size()).toBe(0);
  });
});
