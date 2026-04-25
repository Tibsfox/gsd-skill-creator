import { describe, it, expect } from 'vitest';
import { withFlag, buildSyntheticCorpus } from './_fixtures.js';
import { runToolAttentionPipeline } from '../index.js';
import { hashingEmbedding } from '../iso-score.js';

describe('HB-01 fracture-alert — telemetry surfaces offending occupancy ratio', () => {
  it('emits fractureAlert=true with the ratio that triggered it', () => {
    const env = withFlag(true);
    try {
      const corpus = buildSyntheticCorpus(40);
      const compactCorpus = corpus.map((c) => c.compact);
      const sidecars = corpus.map((c) => c.sidecar);
      const byName = new Map(corpus.map((c) => [c.compact.name, c.schema]));
      // Tiny context window forces fracture.
      const out = runToolAttentionPipeline({
        sidecars,
        compactCorpus,
        intentEmbedding: hashingEmbedding('mid action enum', 64),
        phase: 'planning',
        resolveFullSchema: (n) => byName.get(n) ?? null,
        contextWindowTokens: 100,
        settingsPath: env.configPath,
      });
      const budget = out.budget as { fractureAlert: boolean; occupancyRatio: number };
      expect(budget.fractureAlert).toBe(true);
      expect(budget.occupancyRatio).toBeGreaterThanOrEqual(0.70);
    } finally { env.cleanup(); }
  });

  it('emits fractureAlert=false when window is huge', () => {
    const env = withFlag(true);
    try {
      const corpus = buildSyntheticCorpus(20);
      const compactCorpus = corpus.map((c) => c.compact);
      const sidecars = corpus.map((c) => c.sidecar);
      const byName = new Map(corpus.map((c) => [c.compact.name, c.schema]));
      const out = runToolAttentionPipeline({
        sidecars,
        compactCorpus,
        intentEmbedding: hashingEmbedding('simple', 64),
        phase: 'executing',
        resolveFullSchema: (n) => byName.get(n) ?? null,
        contextWindowTokens: 1_000_000,
        settingsPath: env.configPath,
      });
      const budget = out.budget as { fractureAlert: boolean; occupancyRatio: number };
      expect(budget.fractureAlert).toBe(false);
      expect(budget.occupancyRatio).toBeLessThan(0.70);
    } finally { env.cleanup(); }
  });
});
