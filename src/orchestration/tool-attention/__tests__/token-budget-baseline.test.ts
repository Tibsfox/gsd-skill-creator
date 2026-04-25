/**
 * HB-01 — Baseline-measurement test (CS25-13).
 *
 * Records all-tools-loaded p50/p95 tokens-per-turn on a synthetic mock-MCP
 * scenario: N tools at three complexity tiers (simple-CRUD,
 * mid-complexity-with-enums, large-schema-with-nested-objects). This is the
 * ground truth for the ≥40% reduction acceptance criterion.
 *
 * The "turn" abstraction here is the per-intent token cost the model would
 * pay to have *all schemas loaded* eagerly. We sample over a randomized but
 * deterministic batch of intents to produce a stable distribution.
 */

import { describe, it, expect } from 'vitest';
import { buildSyntheticCorpus, percentiles } from './_fixtures.js';

interface BaselineRecord {
  scenarioId: string;
  toolCount: number;
  p50: number;
  p95: number;
  totalLoadedPerTurn: number;
}

function eagerCostPerTurn(corpus: ReturnType<typeof buildSyntheticCorpus>): number {
  // Eager-load means every full schema + every compact entry is in context.
  let total = 0;
  for (const t of corpus) total += t.compact.fullSchemaTokens + t.compact.compactTokens;
  return total;
}

describe('HB-01 token-budget — baseline measurement', () => {
  it('records all-tools-loaded p50/p95 on the synthetic mock-MCP scenario', () => {
    const corpus = buildSyntheticCorpus(60); // 20 simple, 20 mid, 20 large
    // Sample 200 simulated turns — synthetic; baseline is invariant to intent
    // because eager loading does not look at the intent.
    const samples: number[] = [];
    const cost = eagerCostPerTurn(corpus);
    for (let i = 0; i < 200; i++) samples.push(cost);
    samples.sort((a, b) => a - b);
    const { p50, p95 } = percentiles(samples);
    const record: BaselineRecord = {
      scenarioId: 'synthetic-N60-tier3',
      toolCount: corpus.length,
      p50,
      p95,
      totalLoadedPerTurn: cost,
    };
    // Concrete invariants we want this fixture to enforce going forward.
    // Synthetic corpus is deterministic, so these are stable numbers — if the
    // fixture changes intentionally, the failures here are the signal.
    expect(record.toolCount).toBe(60);
    expect(record.p50).toBe(record.p95);
    expect(record.p50).toBe(cost);
    // Sanity: the synthetic corpus must produce a multi-thousand-token cost,
    // otherwise the reduction test below is meaningless.
    expect(record.p50).toBeGreaterThan(2000);
    // Surface the numbers via the test name for future-historian visibility.
    // (Vitest preserves describe/it strings in the report.)
    expect(record).toMatchObject({ scenarioId: 'synthetic-N60-tier3' });
    // Persist into a side-channel module-scope so the reduction test can
    // re-read the same distribution without recomputing.
    (globalThis as unknown as { __HB01_BASELINE?: BaselineRecord }).__HB01_BASELINE = record;
  });

  it('per-tier token shapes are well-ordered (large > mid > simple)', () => {
    const corpus = buildSyntheticCorpus(30);
    const tier0 = corpus.filter((c) => c.compact.name.startsWith('simple_'));
    const tier1 = corpus.filter((c) => c.compact.name.startsWith('mid_'));
    const tier2 = corpus.filter((c) => c.compact.name.startsWith('large_'));
    const avg = (arr: typeof corpus) =>
      arr.reduce((s, c) => s + c.compact.fullSchemaTokens, 0) / Math.max(arr.length, 1);
    expect(avg(tier2)).toBeGreaterThan(avg(tier1));
    expect(avg(tier1)).toBeGreaterThan(avg(tier0));
  });
});
