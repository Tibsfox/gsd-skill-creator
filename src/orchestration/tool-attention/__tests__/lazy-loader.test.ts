import { describe, it, expect } from 'vitest';
import { withFlag, buildSyntheticCorpus } from './_fixtures.js';
import { lazyLoadSchemas, truncateDescription } from '../lazy-loader.js';
import type { GateOutput } from '../types.js';

function fakeGate(selected: string[]): GateOutput {
  return { selected, effectiveTopK: selected.length, pinnedSurvivors: [] };
}

describe('HB-01 lazy-loader — compact pool + selective full schemas', () => {
  it('is byte-identically disabled with flag off', () => {
    const env = withFlag(false);
    try {
      const out = lazyLoadSchemas([], fakeGate([]), () => null, env.configPath);
      expect(out).toEqual({ compactPool: [], fullSchemas: [], totalTokens: 0, disabled: true });
    } finally { env.cleanup(); }
  });

  it('compact pool exposes name + 1-line desc; full schemas only for top-k', () => {
    const env = withFlag(true);
    try {
      const corpus = buildSyntheticCorpus(20);
      const compactCorpus = corpus.map((c) => c.compact);
      const byName = new Map(corpus.map((c) => [c.compact.name, c.schema]));
      const gate = fakeGate(['simple_0', 'mid_1', 'large_2']);
      const out = lazyLoadSchemas(compactCorpus, gate, (n) => byName.get(n) ?? null, env.configPath);
      if ('disabled' in out) throw new Error('expected enabled');
      expect(out.compactPool.length).toBe(20);
      expect(out.fullSchemas.length).toBe(3);
      // Compact pool must NOT contain a `schema` field.
      for (const c of out.compactPool) {
        expect((c as unknown as Record<string, unknown>).schema).toBeUndefined();
        expect(c.shortDescription.length).toBeLessThanOrEqual(80);
      }
      // Full schemas hold actual JSON schema objects.
      for (const f of out.fullSchemas) expect(typeof f.schema).toBe('object');
    } finally { env.cleanup(); }
  });

  it('drops gated tools whose schema resolver returns null', () => {
    const env = withFlag(true);
    try {
      const corpus = buildSyntheticCorpus(6);
      const compactCorpus = corpus.map((c) => c.compact);
      const gate = fakeGate(['simple_0', 'mid_1']);
      const out = lazyLoadSchemas(compactCorpus, gate, () => null, env.configPath);
      if ('disabled' in out) throw new Error('expected enabled');
      expect(out.fullSchemas.length).toBe(0);
      // But compact pool is still present.
      expect(out.compactPool.length).toBe(6);
    } finally { env.cleanup(); }
  });

  it('truncates over-long descriptions to ≤80 chars with ellipsis', () => {
    const long = 'x'.repeat(200);
    const t = truncateDescription(long);
    expect(t.length).toBe(80);
    expect(t.endsWith('…')).toBe(true);
  });

  it('total tokens sum compact + full schema tokens', () => {
    const env = withFlag(true);
    try {
      const corpus = buildSyntheticCorpus(10);
      const compactCorpus = corpus.map((c) => c.compact);
      const byName = new Map(corpus.map((c) => [c.compact.name, c.schema]));
      const gate = fakeGate(['simple_0', 'mid_1']);
      const out = lazyLoadSchemas(compactCorpus, gate, (n) => byName.get(n) ?? null, env.configPath);
      if ('disabled' in out) throw new Error('expected enabled');
      const expected =
        compactCorpus.reduce((s, c) => s + c.compactTokens, 0) +
        out.fullSchemas.reduce((s, f) => s + f.fullSchemaTokens, 0);
      expect(out.totalTokens).toBe(expected);
    } finally { env.cleanup(); }
  });

  it('ignores duplicate selected names', () => {
    const env = withFlag(true);
    try {
      const corpus = buildSyntheticCorpus(6);
      const compactCorpus = corpus.map((c) => c.compact);
      const byName = new Map(corpus.map((c) => [c.compact.name, c.schema]));
      const gate = fakeGate(['simple_0', 'simple_0', 'mid_1']);
      const out = lazyLoadSchemas(compactCorpus, gate, (n) => byName.get(n) ?? null, env.configPath);
      if ('disabled' in out) throw new Error('expected enabled');
      expect(out.fullSchemas.length).toBe(2);
    } finally { env.cleanup(); }
  });
});
