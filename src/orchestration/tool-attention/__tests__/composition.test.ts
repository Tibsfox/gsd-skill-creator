import { describe, it, expect } from 'vitest';
import { withFlag, buildSyntheticCorpus } from './_fixtures.js';
import { runToolAttentionPipeline } from '../index.js';
import { hashingEmbedding } from '../iso-score.js';

describe('HB-01 composition — full pipeline ISO → gate → lazy-load → monitor', () => {
  it('composes deterministically end-to-end', () => {
    const env = withFlag(true);
    try {
      const corpus = buildSyntheticCorpus(20);
      const compactCorpus = corpus.map((c) => c.compact);
      const sidecars = corpus.map((c) => c.sidecar);
      const byName = new Map(corpus.map((c) => [c.compact.name, c.schema]));
      const intent = hashingEmbedding('mid action enum priority', 64);
      const a = runToolAttentionPipeline({
        sidecars, compactCorpus, intentEmbedding: intent, phase: 'planning',
        resolveFullSchema: (n) => byName.get(n) ?? null,
        contextWindowTokens: 100000,
        settingsPath: env.configPath,
      });
      const b = runToolAttentionPipeline({
        sidecars, compactCorpus, intentEmbedding: intent, phase: 'planning',
        resolveFullSchema: (n) => byName.get(n) ?? null,
        contextWindowTokens: 100000,
        settingsPath: env.configPath,
      });
      // Strip out non-deterministic resolver references via JSON canonicalize.
      expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    } finally { env.cleanup(); }
  });

  it('full pipeline reduces total tokens vs eager load on the same corpus', () => {
    const env = withFlag(true);
    try {
      const corpus = buildSyntheticCorpus(40);
      const compactCorpus = corpus.map((c) => c.compact);
      const sidecars = corpus.map((c) => c.sidecar);
      const byName = new Map(corpus.map((c) => [c.compact.name, c.schema]));
      const eager = compactCorpus.reduce(
        (s, c) => s + c.fullSchemaTokens + c.compactTokens,
        0,
      );
      const out = runToolAttentionPipeline({
        sidecars, compactCorpus,
        intentEmbedding: hashingEmbedding('large nested workflow', 64),
        phase: 'verifying',
        resolveFullSchema: (n) => byName.get(n) ?? null,
        contextWindowTokens: 100000,
        settingsPath: env.configPath,
      });
      const total = (out.load as { totalTokens: number }).totalTokens;
      expect(total).toBeLessThan(eager);
    } finally { env.cleanup(); }
  });

  it('composer carries pin survivors through to selected', () => {
    const env = withFlag(true);
    try {
      const corpus = buildSyntheticCorpus(30); // fixture pins simple_0 to planning
      const compactCorpus = corpus.map((c) => c.compact);
      const sidecars = corpus.map((c) => c.sidecar);
      const byName = new Map(corpus.map((c) => [c.compact.name, c.schema]));
      const out = runToolAttentionPipeline({
        sidecars, compactCorpus,
        intentEmbedding: hashingEmbedding('something completely different', 64),
        phase: 'planning',
        resolveFullSchema: (n) => byName.get(n) ?? null,
        contextWindowTokens: 100000,
        settingsPath: env.configPath,
      });
      const gate = out.gate as { selected: string[]; pinnedSurvivors: string[] };
      expect(gate.pinnedSurvivors).toContain('simple_0');
      expect(gate.selected).toContain('simple_0');
    } finally { env.cleanup(); }
  });
});
