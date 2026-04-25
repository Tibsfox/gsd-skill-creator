/**
 * HB-01 — Token-budget reduction test (CS25-13).
 *
 * With flag enabled and the lazy loader engaged, the per-turn token cost
 * should drop ≥40% at p50 vs the eager-load baseline. If the spec's 40% is
 * unreachable we explicitly document the floor as baseline×0.6, but for
 * synthetic-N60 the geometry comfortably exceeds 40%.
 */

import { describe, it, expect } from 'vitest';
import { withFlag, buildSyntheticCorpus, percentiles } from './_fixtures.js';
import { runToolAttentionPipeline } from '../index.js';
import { hashingEmbedding } from '../iso-score.js';

describe('HB-01 token-budget — reduction acceptance', () => {
  it('flag-on lazy load achieves ≥40% p50 reduction vs eager baseline', () => {
    const env = withFlag(true);
    try {
      const corpus = buildSyntheticCorpus(60);
      const compactCorpus = corpus.map((c) => c.compact);
      const sidecars = corpus.map((c) => c.sidecar);
      const byName = new Map(corpus.map((c) => [c.compact.name, c.schema]));

      const eagerCost =
        compactCorpus.reduce((s, c) => s + c.fullSchemaTokens + c.compactTokens, 0);

      // Sample 60 distinct intents — varied phrases over the tier vocabularies.
      const intents = [
        'simple crud record store flat',
        'simple lookup get value by id',
        'mid complexity action enum priority',
        'mid update workflow validate timestamp',
        'large nested workflow steps shell http',
        'large multi-step branch retry policies',
        'archive restore record value',
        'sandbox isolation network restricted',
        'identity tenant permissions subject',
        'crud delete by identifier',
      ];
      const phases = ['planning', 'executing', 'verifying'] as const;

      const samples: number[] = [];
      for (let i = 0; i < 60; i++) {
        const intent = hashingEmbedding(intents[i % intents.length] ?? 'x', 64);
        const phase = phases[i % phases.length] ?? 'planning';
        const out = runToolAttentionPipeline({
          sidecars,
          compactCorpus,
          intentEmbedding: intent,
          phase,
          resolveFullSchema: (n) => byName.get(n) ?? null,
          settingsPath: env.configPath,
        });
        const totalTokens = (out.load as { totalTokens?: number }).totalTokens ?? 0;
        samples.push(totalTokens);
      }
      samples.sort((a, b) => a - b);
      const { p50, p95 } = percentiles(samples);

      const reductionRatio = 1 - p50 / eagerCost;
      // Acceptance: ≥40% p50 reduction. If unreachable we re-scope to 0.4
      // (i.e. baseline×0.6) per spec §6 / impact.md §4 #1; both forms are
      // checked here so the test is self-documenting.
      expect(reductionRatio).toBeGreaterThanOrEqual(0.40);
      expect(p50).toBeLessThanOrEqual(eagerCost * 0.6);
      // Sanity: p95 should still be below the eager baseline.
      expect(p95).toBeLessThan(eagerCost);
    } finally { env.cleanup(); }
  });

  it('reduction is monotonically larger as corpus grows (more rejected tail)', () => {
    const env = withFlag(true);
    try {
      const measure = (n: number): number => {
        const corpus = buildSyntheticCorpus(n);
        const compactCorpus = corpus.map((c) => c.compact);
        const sidecars = corpus.map((c) => c.sidecar);
        const byName = new Map(corpus.map((c) => [c.compact.name, c.schema]));
        const eager = compactCorpus.reduce(
          (s, c) => s + c.fullSchemaTokens + c.compactTokens,
          0,
        );
        const intent = hashingEmbedding('mid complexity action enum', 64);
        const out = runToolAttentionPipeline({
          sidecars,
          compactCorpus,
          intentEmbedding: intent,
          phase: 'executing',
          resolveFullSchema: (n) => byName.get(n) ?? null,
          settingsPath: env.configPath,
        });
        const totalTokens = (out.load as { totalTokens?: number }).totalTokens ?? 0;
        return 1 - totalTokens / eager;
      };
      const r30 = measure(30);
      const r60 = measure(60);
      const r120 = measure(120);
      // Larger corpora should yield equal or greater reduction (more
      // rejected tail). Allow tiny epsilon for floor effects.
      expect(r60).toBeGreaterThanOrEqual(r30 - 0.05);
      expect(r120).toBeGreaterThanOrEqual(r60 - 0.05);
    } finally { env.cleanup(); }
  });
});
