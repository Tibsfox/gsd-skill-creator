/**
 * Integration tests for the Phase 9 Integration Bridge.
 *
 * Verifies the three Phase 9 success criteria working together:
 * 1. Exploration triggers observation events (INTG-01)
 * 2. Loading respects token budgets (INTG-02)
 * 3. Chipset routing works correctly (INTG-03)
 * 4. All three adapters work in an end-to-end flow
 *
 * Imports from the barrel export to verify the clean API surface.
 *
 * @module integration/integration.test
 */

import { describe, it, expect } from 'vitest';
import {
  ObservationBridge,
  TokenBudgetAdapter,
  ChipsetAdapter,
  type EngineResolver,
} from './index.js';
import type { ExplorationResult } from '../college/types.js';
import type { RosettaConcept, DepartmentWing } from '../rosetta-core/types.js';

// ─── Shared Mock Helpers ─────────────────────────────────────────────────────

function makeConcept(overrides: Partial<RosettaConcept> = {}): RosettaConcept {
  return {
    id: 'maillard-reaction',
    name: 'Maillard Reaction',
    domain: 'culinary-arts',
    description: 'Non-enzymatic browning between amino acids and reducing sugars',
    panels: new Map(),
    relationships: [],
    ...overrides,
  };
}

function makeWing(overrides: Partial<DepartmentWing> = {}): DepartmentWing {
  return {
    id: 'food-science',
    name: 'Food Science',
    description: 'Scientific principles behind cooking',
    concepts: ['maillard-reaction'],
    ...overrides,
  };
}

function makeExplorationResult(overrides: Partial<ExplorationResult> = {}): ExplorationResult {
  return {
    path: 'culinary-arts/food-science/maillard-reaction',
    concept: makeConcept(),
    wing: makeWing(),
    departmentId: 'culinary-arts',
    pedagogicalContext: 'Understanding the science behind browning',
    relatedPaths: ['culinary-arts/technique/searing'],
    ...overrides,
  };
}

function makeMockResolver(): EngineResolver {
  const engines: Record<string, { name: string; domain: string; dma: { percentage: number } }> = {
    context: { name: 'context-engine', domain: 'context', dma: { percentage: 60 } },
    output: { name: 'render-engine', domain: 'output', dma: { percentage: 15 } },
    io: { name: 'io-engine', domain: 'io', dma: { percentage: 15 } },
    glue: { name: 'router-engine', domain: 'glue', dma: { percentage: 10 } },
  };
  return { getByDomain: (domain: string) => engines[domain] };
}

function makeMockLoader(tokenCosts: { summary?: number; wing?: number; deep?: number } = {}) {
  const summaryTokenCost = tokenCosts.summary ?? 2000;
  const wingTokenCost = tokenCosts.wing ?? 4000;
  const deepTokenCost = tokenCosts.deep ?? 7000;

  return {
    async loadSummary(departmentId: string) {
      return {
        id: departmentId,
        name: 'Culinary Arts',
        description: 'A'.repeat(summaryTokenCost * 4),
        wings: [{ id: 'food-science', name: 'Food Science', description: 'Science', conceptCount: 2 }],
        entryPoint: 'maillard-reaction',
        trySessions: [],
        tokenCost: summaryTokenCost,
      };
    },
    async loadWing(departmentId: string, wingId: string) {
      return {
        departmentId,
        wing: {
          id: wingId,
          name: 'Food Science',
          description: 'Science of cooking',
          concepts: ['maillard-reaction', 'caramelization'],
        },
        concepts: [
          makeConcept(),
          makeConcept({ id: 'caramelization', name: 'Caramelization', description: 'Sugar browning'.repeat(40) }),
        ],
        tokenCost: wingTokenCost,
      };
    },
    async loadDeep(departmentId: string, topic: string) {
      return {
        departmentId,
        topic,
        content: 'D'.repeat(deepTokenCost * 4),
        relatedConcepts: ['maillard-reaction'],
        tokenCost: deepTokenCost,
      };
    },
  };
}

// ─── Integration Tests ───────────────────────────────────────────────────────

describe('Integration Bridge', () => {
  describe('INTG-01: Exploration triggers observation event', () => {
    it('exploring a concept emits an event convertible to SessionObservation', () => {
      const bridge = new ObservationBridge({ sessionId: 'intg-test-001' });
      const result = makeExplorationResult();

      bridge.onExploration(result);
      const events = bridge.flush();

      expect(events).toHaveLength(1);
      expect(events[0].conceptId).toBe('maillard-reaction');
      expect(events[0].type).toBe('exploration');

      const observation = bridge.toSessionObservation(events);
      expect(observation.topFiles).toContain('culinary-arts/food-science/maillard-reaction');
      expect(observation.activeSkills).toContain('college');
      expect(observation.sessionId).toBe('intg-test-001');
    });
  });

  describe('INTG-02: Budget enforcement across tiers', () => {
    it('summary within budget passes through, over-budget truncates', async () => {
      // Within budget: 3000 < 4000 (2% of 200K)
      const underLoader = makeMockLoader({ summary: 3000 });
      const underAdapter = new TokenBudgetAdapter(underLoader);
      const underResult = await underAdapter.loadSummary('culinary-arts');
      expect(underResult.truncated).toBe(false);

      // Over budget: 6000 > 4000
      const overLoader = makeMockLoader({ summary: 6000 });
      const overAdapter = new TokenBudgetAdapter(overLoader);
      const overResult = await overAdapter.loadSummary('culinary-arts');
      expect(overResult.truncated).toBe(true);
      expect(overResult.tokenCost).toBeLessThanOrEqual(4000);
    });

    it('wing over-budget truncates concepts', async () => {
      // 8000 > 6000 (3% of 200K)
      const loader = makeMockLoader({ wing: 8000 });
      const adapter = new TokenBudgetAdapter(loader);
      const result = await adapter.loadWing('culinary-arts', 'food-science');

      expect(result.truncated).toBe(true);
      expect(result.tokenCost).toBeLessThanOrEqual(6000);
    });

    it('deep over-budget truncates content', async () => {
      // 12000 > 10000 (5% of 200K)
      const loader = makeMockLoader({ deep: 12000 });
      const adapter = new TokenBudgetAdapter(loader);
      const result = await adapter.loadDeep('culinary-arts', 'maillard-science');

      expect(result.truncated).toBe(true);
      expect(result.tokenCost).toBeLessThanOrEqual(10000);
    });
  });

  describe('INTG-03: Chipset routing for panels', () => {
    it('routes panels to correct engine domains', () => {
      const adapter = new ChipsetAdapter({ resolver: makeMockResolver() });

      expect(adapter.routePanelRequest('python').engineDomain).toBe('context');
      expect(adapter.routePanelRequest('lisp').engineDomain).toBe('output');
      expect(adapter.routePanelRequest('unison').engineDomain).toBe('io');
      expect(adapter.routePanelRequest('natural').engineDomain).toBe('glue');
    });
  });

  describe('End-to-end flow', () => {
    it('explores concept -> observes event -> checks budget -> routes panel', async () => {
      // Step 1: Explore a concept and observe the event
      const bridge = new ObservationBridge({ sessionId: 'e2e-test-001' });
      const explorationResult = makeExplorationResult();
      const event = bridge.onExploration(explorationResult);

      expect(event.type).toBe('exploration');
      expect(event.conceptId).toBe('maillard-reaction');

      // Step 2: Load the concept's wing with budget enforcement
      const budgetAdapter = new TokenBudgetAdapter(makeMockLoader({ wing: 4000 }));
      const wingResult = await budgetAdapter.loadWing('culinary-arts', 'food-science');

      expect(wingResult.truncated).toBe(false);
      expect(wingResult.tokenCost).toBeLessThanOrEqual(6000);

      // Step 3: Route the panel through the chipset adapter
      const chipsetAdapter = new ChipsetAdapter({ resolver: makeMockResolver() });
      const routeResult = chipsetAdapter.routePanelRequest('python');

      expect(routeResult.engineName).toBe('context-engine');
      expect(routeResult.engineDomain).toBe('context');
      expect(routeResult.budgetPercentage).toBe(60);

      // Step 4: Convert observation events to SessionObservation
      const events = bridge.flush();
      const observation = bridge.toSessionObservation(events);

      expect(observation.topFiles).toContain('culinary-arts/food-science/maillard-reaction');
      expect(observation.metrics.toolCalls).toBe(1);
      expect(observation.activeSkills).toContain('college');
    });
  });
});
