/**
 * HB-01 — Boundary / edge-case tests.
 *
 * Empty tool set, single tool, circular schema references, non-ASCII names.
 */

import { describe, it, expect } from 'vitest';
import { withFlag } from './_fixtures.js';
import { runToolAttentionPipeline } from '../index.js';
import { computeIsoScore, hashingEmbedding } from '../iso-score.js';
import { applyStateGate } from '../state-gate.js';
import { lazyLoadSchemas } from '../lazy-loader.js';
import type { CompactToolEntry, GateOutput } from '../types.js';

describe('HB-01 edge cases', () => {
  it('handles empty tool set without crashing', () => {
    const env = withFlag(true);
    try {
      const out = runToolAttentionPipeline({
        sidecars: [],
        compactCorpus: [],
        intentEmbedding: hashingEmbedding('hi', 16),
        phase: 'planning',
        resolveFullSchema: () => null,
        contextWindowTokens: 1000,
        settingsPath: env.configPath,
      });
      expect((out.load as { compactPool: unknown[] }).compactPool.length).toBe(0);
      expect((out.load as { fullSchemas: unknown[] }).fullSchemas.length).toBe(0);
      expect((out.load as { totalTokens: number }).totalTokens).toBe(0);
    } finally { env.cleanup(); }
  });

  it('handles single-tool corpus', () => {
    const env = withFlag(true);
    try {
      const compactCorpus: CompactToolEntry[] = [{
        name: 'only', shortDescription: 'sole tool', compactTokens: 5, fullSchemaTokens: 50,
      }];
      const out = runToolAttentionPipeline({
        sidecars: [{ name: 'only', embedding: hashingEmbedding('sole tool', 16) }],
        compactCorpus,
        intentEmbedding: hashingEmbedding('sole', 16),
        phase: 'planning',
        resolveFullSchema: () => ({ x: 1 }),
        contextWindowTokens: 10000,
        settingsPath: env.configPath,
      });
      const load = out.load as { compactPool: unknown[]; fullSchemas: unknown[] };
      expect(load.compactPool.length).toBe(1);
      expect(load.fullSchemas.length).toBe(1);
    } finally { env.cleanup(); }
  });

  it('handles circular references in schemas (resolver returns the cyclic object)', () => {
    const env = withFlag(true);
    try {
      // Create a simple cyclic structure.
      const cyclic: Record<string, unknown> = { name: 'cycle' };
      cyclic.self = cyclic;
      const compactCorpus: CompactToolEntry[] = [{
        name: 'cyclic_tool', shortDescription: 'has self-ref', compactTokens: 5, fullSchemaTokens: 100,
      }];
      const fakeGate: GateOutput = { selected: ['cyclic_tool'], effectiveTopK: 1, pinnedSurvivors: [] };
      const out = lazyLoadSchemas(compactCorpus, fakeGate, () => cyclic, env.configPath);
      if ('disabled' in out) throw new Error('expected enabled');
      // The loader stores the schema by reference; it must not stringify it.
      expect(out.fullSchemas[0]?.schema).toBe(cyclic);
      // Token sum still works.
      expect(out.totalTokens).toBe(5 + 100);
    } finally { env.cleanup(); }
  });

  it('handles non-ASCII tool names', () => {
    const env = withFlag(true);
    try {
      const sidecars = [
        { name: '日本語_tool', embedding: hashingEmbedding('日本語 tool', 16) },
        { name: 'café_action', embedding: hashingEmbedding('café action', 16) },
        { name: 'emoji_🚀_tool', embedding: hashingEmbedding('emoji rocket tool', 16) },
      ];
      const intent = hashingEmbedding('café', 16);
      const iso = computeIsoScore(sidecars, intent, 'planning', env.configPath);
      if ('disabled' in iso) throw new Error('expected enabled');
      expect(iso.ranked.length).toBe(3);
      const names = iso.ranked.map((r) => r.name);
      expect(names).toContain('日本語_tool');
      expect(names).toContain('café_action');
      expect(names).toContain('emoji_🚀_tool');
    } finally { env.cleanup(); }
  });

  it('rejects negative topK by clamping to zero (defense-in-depth)', () => {
    const env = withFlag(true);
    try {
      const iso = {
        ranked: [{ name: 't', score: 1, pinned: false }],
        intentEmbedding: [0],
      };
      const out = applyStateGate(iso, 'planning', { defaultTopK: -5, maxTopK: 24 }, env.configPath);
      if ('disabled' in out) throw new Error('expected enabled');
      expect(out.effectiveTopK).toBe(0);
      expect(out.selected.length).toBe(0);
    } finally { env.cleanup(); }
  });

  it('handles intent embedding of length zero', () => {
    const env = withFlag(true);
    try {
      const sidecars = [{ name: 't1', embedding: [1, 0, 0] }];
      const out = computeIsoScore(sidecars, [], 'planning', env.configPath);
      if ('disabled' in out) throw new Error('expected enabled');
      // All cosines fall to zero; ranking still emits the tool.
      expect(out.ranked.length).toBe(1);
      expect(out.ranked[0]?.score).toBe(0);
    } finally { env.cleanup(); }
  });
});
