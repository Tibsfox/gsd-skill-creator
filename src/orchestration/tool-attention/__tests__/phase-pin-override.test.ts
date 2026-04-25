import { describe, it, expect } from 'vitest';
import { withFlag } from './_fixtures.js';
import { computeIsoScore, hashingEmbedding } from '../iso-score.js';
import { applyStateGate } from '../state-gate.js';

describe('HB-01 phase-pin override — pinned tools always survive low ISO rank', () => {
  it('pinned tool ranks first regardless of cosine score', () => {
    const env = withFlag(true);
    try {
      const sidecars = [
        { name: 'irrelevant_pin', embedding: hashingEmbedding('apple banana', 32), phasePins: ['planning' as const] },
        { name: 'on_topic', embedding: hashingEmbedding('xyz pdq qux', 32) },
      ];
      const intent = hashingEmbedding('xyz pdq qux', 32);
      const iso = computeIsoScore(sidecars, intent, 'planning', env.configPath);
      if ('disabled' in iso) throw new Error('expected enabled');
      expect(iso.ranked[0]?.name).toBe('irrelevant_pin');
      expect(iso.ranked[0]?.pinned).toBe(true);
    } finally { env.cleanup(); }
  });

  it('pin only fires for the matching phase', () => {
    const env = withFlag(true);
    try {
      const sidecars = [
        { name: 'planning_only', embedding: hashingEmbedding('abc', 32), phasePins: ['planning' as const] },
        { name: 'always_on', embedding: hashingEmbedding('abc', 32) },
      ];
      const intent = hashingEmbedding('abc', 32);
      const isoExec = computeIsoScore(sidecars, intent, 'executing', env.configPath);
      if ('disabled' in isoExec) throw new Error('expected enabled');
      // Same cosine; tie-break by input order (planning_only first by index 0).
      // But pinned flag should be false because phase != planning.
      expect(isoExec.ranked.find((r) => r.name === 'planning_only')?.pinned).toBe(false);
    } finally { env.cleanup(); }
  });

  it('gate emits pin even if topK budget would otherwise exclude it', () => {
    const env = withFlag(true);
    try {
      const sidecars = [
        { name: 'top1', embedding: hashingEmbedding('xyz', 16) },
        { name: 'top2', embedding: hashingEmbedding('xyz', 16) },
        { name: 'pinned_low', embedding: hashingEmbedding('totally_unrelated_words', 16), phasePins: ['planning' as const] },
      ];
      const intent = hashingEmbedding('xyz', 16);
      const iso = computeIsoScore(sidecars, intent, 'planning', env.configPath);
      const gate = applyStateGate(iso, 'planning', { defaultTopK: 1, maxTopK: 24 }, env.configPath);
      if ('disabled' in gate) throw new Error('expected enabled');
      expect(gate.pinnedSurvivors).toContain('pinned_low');
      expect(gate.selected).toContain('pinned_low');
    } finally { env.cleanup(); }
  });
});
