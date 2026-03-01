/**
 * Tests for TokenBudgetAdapter -- enforces 2-5% context window ceilings
 * on CollegeLoader progressive disclosure tiers.
 *
 * @module integration/token-budget-adapter.test
 */

import { describe, it, expect } from 'vitest';
import {
  TokenBudgetAdapter,
  type ContextWindowConfig,
} from './token-budget-adapter.js';
import type { DepartmentSummary, WingContent, DeepReference } from '../college/types.js';

// ─── Mock CollegeLoader ──────────────────────────────────────────────────────

function makeMockLoader(overrides: {
  summaryTokenCost?: number;
  wingTokenCost?: number;
  deepTokenCost?: number;
  wingConcepts?: Array<{ id: string; name: string; domain: string; description: string; panels: Map<never, never>; relationships: never[] }>;
} = {}) {
  const summaryTokenCost = overrides.summaryTokenCost ?? 2000;
  const wingTokenCost = overrides.wingTokenCost ?? 5000;
  const deepTokenCost = overrides.deepTokenCost ?? 8000;

  const wingConcepts = overrides.wingConcepts ?? [
    {
      id: 'maillard-reaction',
      name: 'Maillard Reaction',
      domain: 'culinary-arts',
      description: 'Non-enzymatic browning'.repeat(50), // substantial content
      panels: new Map(),
      relationships: [],
    },
    {
      id: 'caramelization',
      name: 'Caramelization',
      domain: 'culinary-arts',
      description: 'Sugar decomposition and browning'.repeat(50),
      panels: new Map(),
      relationships: [],
    },
    {
      id: 'denaturation',
      name: 'Denaturation',
      domain: 'culinary-arts',
      description: 'Protein structure changes under heat'.repeat(50),
      panels: new Map(),
      relationships: [],
    },
  ];

  return {
    async loadSummary(_departmentId: string): Promise<DepartmentSummary> {
      return {
        id: _departmentId,
        name: 'Culinary Arts',
        description: 'A'.repeat(summaryTokenCost * 4), // 4 chars per token
        wings: [{ id: 'food-science', name: 'Food Science', description: 'Science of cooking', conceptCount: 3 }],
        entryPoint: 'maillard-reaction',
        trySessions: [],
        tokenCost: summaryTokenCost,
      };
    },

    async loadWing(_departmentId: string, _wingId: string): Promise<WingContent> {
      return {
        departmentId: _departmentId,
        wing: {
          id: _wingId,
          name: 'Food Science',
          description: 'Scientific principles',
          concepts: wingConcepts.map((c) => c.id),
        },
        concepts: wingConcepts,
        tokenCost: wingTokenCost,
      };
    },

    async loadDeep(_departmentId: string, _topic: string): Promise<DeepReference> {
      return {
        departmentId: _departmentId,
        topic: _topic,
        content: 'D'.repeat(deepTokenCost * 4), // 4 chars per token
        relatedConcepts: ['maillard-reaction'],
        tokenCost: deepTokenCost,
      };
    },
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('TokenBudgetAdapter', () => {
  it('calculates correct ceilings for 200K context window', () => {
    const config: ContextWindowConfig = {
      totalTokens: 200_000,
      summaryCeilingPercent: 2,
      activeCeilingPercent: 3,
      deepCeilingPercent: 5,
    };
    const adapter = new TokenBudgetAdapter(makeMockLoader(), config);
    const ceilings = adapter.getCeilings();

    expect(ceilings.summary).toBe(4000);  // 2% of 200K
    expect(ceilings.active).toBe(6000);   // 3% of 200K
    expect(ceilings.deep).toBe(10000);    // 5% of 200K
  });

  it('loadSummary() passes through when tokenCost is under ceiling', async () => {
    const loader = makeMockLoader({ summaryTokenCost: 3000 }); // Under 4000 (2% of 200K)
    const adapter = new TokenBudgetAdapter(loader);

    const result = await adapter.loadSummary('culinary-arts');

    expect(result.truncated).toBe(false);
    expect(result.tokenCost).toBe(3000);
    expect(result.data.id).toBe('culinary-arts');
    expect(result.ceilingPercent).toBe(2);
  });

  it('loadSummary() truncates when tokenCost exceeds ceiling', async () => {
    const loader = makeMockLoader({ summaryTokenCost: 6000 }); // Over 4000 (2% of 200K)
    const adapter = new TokenBudgetAdapter(loader);

    const result = await adapter.loadSummary('culinary-arts');

    expect(result.truncated).toBe(true);
    expect(result.tokenCost).toBeLessThanOrEqual(4000);
    expect(result.budgetLimit).toBe(4000);
  });

  it('loadWing() passes through when tokenCost is under ceiling', async () => {
    const loader = makeMockLoader({ wingTokenCost: 5000 }); // Under 6000 (3% of 200K)
    const adapter = new TokenBudgetAdapter(loader);

    const result = await adapter.loadWing('culinary-arts', 'food-science');

    expect(result.truncated).toBe(false);
    expect(result.tokenCost).toBe(5000);
    expect(result.data.wing.id).toBe('food-science');
  });

  it('loadWing() truncates concepts when content exceeds active ceiling', async () => {
    const loader = makeMockLoader({ wingTokenCost: 8000 }); // Over 6000 (3% of 200K)
    const adapter = new TokenBudgetAdapter(loader);

    const result = await adapter.loadWing('culinary-arts', 'food-science');

    expect(result.truncated).toBe(true);
    expect(result.tokenCost).toBeLessThanOrEqual(6000);
    expect(result.budgetLimit).toBe(6000);
  });

  it('loadDeep() passes through when tokenCost is under ceiling', async () => {
    const loader = makeMockLoader({ deepTokenCost: 8000 }); // Under 10000 (5% of 200K)
    const adapter = new TokenBudgetAdapter(loader);

    const result = await adapter.loadDeep('culinary-arts', 'maillard-science');

    expect(result.truncated).toBe(false);
    expect(result.tokenCost).toBe(8000);
    expect(result.data.topic).toBe('maillard-science');
  });

  it('loadDeep() truncates content when exceeding deep ceiling', async () => {
    const loader = makeMockLoader({ deepTokenCost: 15000 }); // Over 10000 (5% of 200K)
    const adapter = new TokenBudgetAdapter(loader);

    const result = await adapter.loadDeep('culinary-arts', 'maillard-science');

    expect(result.truncated).toBe(true);
    expect(result.tokenCost).toBeLessThanOrEqual(10000);
    expect(result.budgetLimit).toBe(10000);
  });

  it('cumulative tracking reports total budget consumed', async () => {
    const loader = makeMockLoader({ summaryTokenCost: 2000, wingTokenCost: 4000 });
    const adapter = new TokenBudgetAdapter(loader);

    await adapter.loadSummary('culinary-arts');
    await adapter.loadWing('culinary-arts', 'food-science');

    expect(adapter.getCumulativeTokens()).toBe(6000);
  });

  it('default context window size is 200000 tokens', () => {
    const adapter = new TokenBudgetAdapter(makeMockLoader());
    const ceilings = adapter.getCeilings();

    // Default 200K * 2% = 4000
    expect(ceilings.summary).toBe(4000);
  });

  it('custom ceilings override defaults', () => {
    const config: ContextWindowConfig = {
      totalTokens: 100_000,
      summaryCeilingPercent: 1,
      activeCeilingPercent: 2,
      deepCeilingPercent: 4,
    };
    const adapter = new TokenBudgetAdapter(makeMockLoader(), config);
    const ceilings = adapter.getCeilings();

    expect(ceilings.summary).toBe(1000);  // 1% of 100K
    expect(ceilings.active).toBe(2000);   // 2% of 100K
    expect(ceilings.deep).toBe(4000);     // 4% of 100K
  });

  it('resetCumulativeTokens() clears the cumulative counter', async () => {
    const loader = makeMockLoader({ summaryTokenCost: 2000 });
    const adapter = new TokenBudgetAdapter(loader);

    await adapter.loadSummary('culinary-arts');
    expect(adapter.getCumulativeTokens()).toBe(2000);

    adapter.resetCumulativeTokens();
    expect(adapter.getCumulativeTokens()).toBe(0);
  });

  it('getRemainingBudget() returns correct remaining tokens', async () => {
    const loader = makeMockLoader({ summaryTokenCost: 1000 });
    const adapter = new TokenBudgetAdapter(loader);

    // Before any loads: full budget available
    expect(adapter.getRemainingBudget('summary')).toBe(4000);
    expect(adapter.getRemainingBudget('active')).toBe(6000);
    expect(adapter.getRemainingBudget('deep')).toBe(10000);

    // After loading summary (1000 tokens)
    await adapter.loadSummary('culinary-arts');
    expect(adapter.getRemainingBudget('summary')).toBe(3000);
    expect(adapter.getRemainingBudget('active')).toBe(5000);
    expect(adapter.getRemainingBudget('deep')).toBe(9000);
  });
});
