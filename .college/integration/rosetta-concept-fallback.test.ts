/**
 * Tests for RosettaConceptFallback — v1.49.831 (T1.3 Option C implementation).
 *
 * Verifies the cross-rootdir provider structurally satisfies the
 * `ConceptFallbackProvider` contract declared in src/predictive-skill-loader,
 * and exercises the search → analogy-filter → translate pipeline against
 * thin mocks (no real RosettaCore wiring needed thanks to the structural
 * `EngineHandle` / `RegistryHandle` types in the module under test).
 *
 * @module integration/rosetta-concept-fallback.test
 */

import { describe, it, expect, vi } from 'vitest';
import {
  RosettaConceptFallback,
  type ConceptSuggestion,
} from './rosetta-concept-fallback.js';
import type { RosettaConcept } from '../rosetta-core/types.js';

// ─── Mock helpers ───────────────────────────────────────────────────────────

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

function makeRegistry(concepts: RosettaConcept[]) {
  const byId = new Map(concepts.map((c) => [c.id, c]));
  return {
    search: vi.fn((query: string, domain?: string) => {
      const q = query.toLowerCase();
      return concepts.filter(
        (c) =>
          (!domain || c.domain === domain) &&
          (c.name.toLowerCase().includes(q) ||
            c.description.toLowerCase().includes(q)),
      );
    }),
    get: vi.fn((id: string) => byId.get(id)),
  };
}

function makeEngine() {
  return {
    translate: vi.fn(async (conceptId: string) => ({
      id: `translation-${conceptId}`,
      primary: {
        panelId: 'natural' as const,
        explanation: `Rendered explanation for ${conceptId}`,
      },
      concept: {
        id: conceptId,
        name: conceptId,
        domain: 'mock',
        description: 'mock description',
        panels: new Map(),
        relationships: [],
      } as RosettaConcept,
      panels: { primary: 'natural' as const, rationale: 'mock' },
      dependenciesLoaded: [],
    })),
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('RosettaConceptFallback', () => {
  it('returns null when registry.search yields no matches', async () => {
    const registry = makeRegistry([]);
    const engine = makeEngine();
    const fallback = new RosettaConceptFallback({ registry, engine });

    const result = await fallback.onLowConfidence('unknown-skill', 0);

    expect(result).toBeNull();
    expect(registry.search).toHaveBeenCalledWith('unknown-skill');
    expect(engine.translate).not.toHaveBeenCalled();
  });

  it('returns null when matches have no analogy relationships', async () => {
    const skill = makeConcept({
      id: 'cooking-skill',
      name: 'cooking-skill',
      relationships: [],
    });
    const registry = makeRegistry([skill]);
    const engine = makeEngine();
    const fallback = new RosettaConceptFallback({ registry, engine });

    const result = await fallback.onLowConfidence('cooking-skill', 0);

    expect(result).toBeNull();
    expect(engine.translate).not.toHaveBeenCalled();
  });

  it('returns null when analogies are all in the same domain (no cross-domain analogy)', async () => {
    const sibling = makeConcept({
      id: 'searing',
      name: 'searing',
      domain: 'culinary-arts',
    });
    const main = makeConcept({
      id: 'cooking-skill',
      name: 'cooking-skill',
      domain: 'culinary-arts',
      relationships: [
        { type: 'analogy', targetId: 'searing', description: 'related' },
      ],
    });
    const registry = makeRegistry([main, sibling]);
    const engine = makeEngine();
    const fallback = new RosettaConceptFallback({ registry, engine });

    const result = await fallback.onLowConfidence('cooking-skill', 0);

    expect(result).toBeNull();
    expect(engine.translate).not.toHaveBeenCalled();
  });

  it('returns suggestions for cross-domain analogies when render succeeds', async () => {
    const mathAnalogue = makeConcept({
      id: 'phase-transition',
      name: 'phase-transition',
      domain: 'mathematics',
    });
    const cookingSkill = makeConcept({
      id: 'cooking-skill',
      name: 'cooking-skill',
      domain: 'culinary-arts',
      relationships: [
        {
          type: 'analogy',
          targetId: 'phase-transition',
          description: 'cross-domain analogy',
        },
      ],
    });
    const registry = makeRegistry([cookingSkill, mathAnalogue]);
    const engine = makeEngine();
    const fallback = new RosettaConceptFallback({ registry, engine });

    const result = await fallback.onLowConfidence('cooking-skill', 0.12);

    expect(result).not.toBeNull();
    expect(result).toHaveLength(1);
    const suggestion = result![0];
    expect(suggestion.conceptId).toBe('phase-transition');
    expect(suggestion.domain).toBe('mathematics');
    expect(suggestion.via).toBe('rosetta-analogy');
    expect(suggestion.rendered).toContain('phase-transition');
    expect(engine.translate).toHaveBeenCalledTimes(1);
  });

  it('passes the suggestion source domain as currentDomain in the translation context', async () => {
    const physicsAnalogue = makeConcept({
      id: 'thermal-equilibrium',
      name: 'thermal-equilibrium',
      domain: 'physics',
    });
    const cookingSkill = makeConcept({
      id: 'cooking-skill',
      name: 'cooking-skill',
      domain: 'culinary-arts',
      relationships: [
        {
          type: 'analogy',
          targetId: 'thermal-equilibrium',
          description: 'cross-domain analogy',
        },
      ],
    });
    const registry = makeRegistry([cookingSkill, physicsAnalogue]);
    const engine = makeEngine();
    const fallback = new RosettaConceptFallback({
      registry,
      engine,
      defaultContext: { userExpertise: 'expert' },
    });

    await fallback.onLowConfidence('cooking-skill', 0);

    expect(engine.translate).toHaveBeenCalledTimes(1);
    const [, ctx] = engine.translate.mock.calls[0];
    expect(ctx.currentDomain).toBe('physics');
    expect(ctx.userExpertise).toBe('expert');
    expect(ctx.taskType).toBe('explore');
  });

  it('returns null when every render throws (fail-soft contract)', async () => {
    const analogue = makeConcept({
      id: 'phase-transition',
      name: 'phase-transition',
      domain: 'mathematics',
    });
    const cookingSkill = makeConcept({
      id: 'cooking-skill',
      name: 'cooking-skill',
      domain: 'culinary-arts',
      relationships: [
        {
          type: 'analogy',
          targetId: 'phase-transition',
          description: 'cross-domain analogy',
        },
      ],
    });
    const registry = makeRegistry([cookingSkill, analogue]);
    const engine = {
      translate: vi.fn(async () => {
        throw new Error('engine broken');
      }),
    };
    const fallback = new RosettaConceptFallback({ registry, engine });

    const result = await fallback.onLowConfidence('cooking-skill', 0);

    expect(result).toBeNull();
  });

  it('respects maxSuggestions cap', async () => {
    const analogies = ['a1', 'a2', 'a3', 'a4', 'a5'].map((id) =>
      makeConcept({ id, name: id, domain: 'other-domain' }),
    );
    const cookingSkill = makeConcept({
      id: 'cooking-skill',
      name: 'cooking-skill',
      domain: 'culinary-arts',
      relationships: analogies.map((a) => ({
        type: 'analogy' as const,
        targetId: a.id,
        description: 'cross',
      })),
    });
    const registry = makeRegistry([cookingSkill, ...analogies]);
    const engine = makeEngine();
    const fallback = new RosettaConceptFallback({
      registry,
      engine,
      maxSuggestions: 2,
    });

    const result = await fallback.onLowConfidence('cooking-skill', 0);

    expect(result).toHaveLength(2);
    expect(engine.translate).toHaveBeenCalledTimes(2);
  });

  it('returns null when registry.search itself throws (fail-soft)', async () => {
    const registry = {
      search: vi.fn(() => {
        throw new Error('registry broken');
      }),
      get: vi.fn(),
    };
    const engine = makeEngine();
    const fallback = new RosettaConceptFallback({ registry, engine });

    const result = await fallback.onLowConfidence('anything', 0);

    expect(result).toBeNull();
    expect(engine.translate).not.toHaveBeenCalled();
  });

  it('structurally implements onLowConfidence(currentSkill, maxScore) returning Promise<ConceptSuggestion[] | null>', () => {
    const registry = makeRegistry([]);
    const engine = makeEngine();
    const fallback = new RosettaConceptFallback({ registry, engine });

    // Compile-time check: the method shape matches the cross-rootdir
    // ConceptFallbackProvider contract declared in src/.
    const provider: {
      onLowConfidence(
        skill: string,
        score: number,
      ): Promise<ConceptSuggestion[] | null>;
    } = fallback;
    expect(typeof provider.onLowConfidence).toBe('function');
  });
});
