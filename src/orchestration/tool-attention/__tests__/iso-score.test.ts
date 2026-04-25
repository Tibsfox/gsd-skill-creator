import { describe, it, expect } from 'vitest';
import { withFlag, buildSyntheticCorpus } from './_fixtures.js';
import {
  computeIsoScore,
  cosineSimilarity,
  hashingEmbedding,
} from '../iso-score.js';

describe('HB-01 iso-score — determinism + correctness', () => {
  it('is byte-identically disabled with flag off', () => {
    const env = withFlag(false);
    try {
      const out = computeIsoScore([], [0.1, 0.2], 'planning', env.configPath);
      expect(out).toEqual({ ranked: [], intentEmbedding: [], disabled: true });
    } finally { env.cleanup(); }
  });

  it('returns identical output for identical inputs (deterministic)', () => {
    const env = withFlag(true);
    try {
      const corpus = buildSyntheticCorpus(20);
      const sidecars = corpus.map((c) => c.sidecar);
      const intent = hashingEmbedding('simple crud record', 64);
      const a = computeIsoScore(sidecars, intent, 'planning', env.configPath);
      const b = computeIsoScore(sidecars, intent, 'planning', env.configPath);
      expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    } finally { env.cleanup(); }
  });

  it('puts pinned tools first regardless of cosine score', () => {
    const env = withFlag(true);
    try {
      const corpus = buildSyntheticCorpus(20);
      const sidecars = corpus.map((c) => c.sidecar);
      // Intent unrelated to the pinned tool ("simple_0").
      const intent = hashingEmbedding('completely-other-topic-zzz', 64);
      const out = computeIsoScore(sidecars, intent, 'planning', env.configPath);
      if ('disabled' in out) throw new Error('expected enabled output');
      expect(out.ranked[0]?.name).toBe('simple_0');
      expect(out.ranked[0]?.pinned).toBe(true);
    } finally { env.cleanup(); }
  });

  it('cosine similarity returns 0 on length mismatch and zero vectors', () => {
    expect(cosineSimilarity([1, 0], [1, 0, 0])).toBe(0);
    expect(cosineSimilarity([0, 0, 0], [1, 1, 1])).toBe(0);
    expect(cosineSimilarity([], [])).toBe(0);
  });

  it('hashing embedding is deterministic and L2-normalized', () => {
    const a = hashingEmbedding('hello world', 32);
    const b = hashingEmbedding('hello world', 32);
    expect(a).toEqual(b);
    const norm = Math.sqrt(a.reduce((s, x) => s + x * x, 0));
    expect(Math.abs(norm - 1)).toBeLessThan(1e-9);
  });

  it('handles empty corpus without throwing', () => {
    const env = withFlag(true);
    try {
      const out = computeIsoScore([], hashingEmbedding('x', 16), 'planning', env.configPath);
      if ('disabled' in out) throw new Error('expected enabled output');
      expect(out.ranked).toEqual([]);
    } finally { env.cleanup(); }
  });

  it('preserves original input order on ties', () => {
    const env = withFlag(true);
    try {
      // Identical embeddings → cosine equal → tie-break should be input order.
      const same = hashingEmbedding('identical', 32);
      const sidecars = [
        { name: 'a', embedding: same },
        { name: 'b', embedding: same },
        { name: 'c', embedding: same },
      ];
      const out = computeIsoScore(sidecars, same, 'planning', env.configPath);
      if ('disabled' in out) throw new Error('expected enabled output');
      expect(out.ranked.map((r) => r.name)).toEqual(['a', 'b', 'c']);
    } finally { env.cleanup(); }
  });
});
