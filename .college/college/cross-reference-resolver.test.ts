/**
 * Tests for CrossReferenceResolver -- linking concepts across departments
 * via analogy and cross-reference relationships.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { CrossReferenceResolver, ConceptNotFoundError } from './cross-reference-resolver.js';
import { ConceptRegistry } from '../rosetta-core/concept-registry.js';
import type { RosettaConcept, PanelId, PanelExpression } from '../rosetta-core/types.js';

// ─── Test Setup ──────────────────────────────────────────────────────────────

let registry: ConceptRegistry;
let resolver: CrossReferenceResolver;

function makeConcept(overrides: Partial<RosettaConcept> = {}): RosettaConcept {
  return {
    id: 'default',
    name: 'Default',
    domain: 'mathematics',
    description: 'A default concept',
    panels: new Map<PanelId, PanelExpression>(),
    relationships: [],
    ...overrides,
  };
}

beforeAll(() => {
  registry = new ConceptRegistry();

  // Math concepts
  registry.register(makeConcept({
    id: 'math-exponential-decay',
    name: 'Exponential Decay',
    domain: 'mathematics',
    description: 'Quantities decreasing proportionally to their current value.',
    relationships: [
      {
        type: 'analogy',
        targetId: 'culinary-cooling-curve',
        description: 'Exponential decay models cooling curves in cooking',
      },
    ],
  }));

  registry.register(makeConcept({
    id: 'math-ratios',
    name: 'Ratios',
    domain: 'mathematics',
    description: 'Comparing quantities as fractions.',
    relationships: [
      {
        type: 'analogy',
        targetId: 'culinary-bakers-percentages',
        description: 'Ratios in math are bakers percentages in baking',
      },
    ],
  }));

  registry.register(makeConcept({
    id: 'math-limits',
    name: 'Limits',
    domain: 'mathematics',
    description: 'The value a function approaches.',
    relationships: [], // No cross-references
  }));

  // Culinary concepts
  registry.register(makeConcept({
    id: 'culinary-cooling-curve',
    name: 'Cooling Curve',
    domain: 'culinary-arts',
    description: 'How food temperature changes over time.',
    relationships: [
      {
        type: 'cross-reference',
        targetId: 'math-exponential-decay',
        description: 'Cooling curves follow exponential decay',
      },
    ],
  }));

  registry.register(makeConcept({
    id: 'culinary-bakers-percentages',
    name: "Baker's Percentages",
    domain: 'culinary-arts',
    description: 'Ingredient ratios relative to flour weight.',
    relationships: [
      {
        type: 'cross-reference',
        targetId: 'math-ratios',
        description: "Baker's percentages are ratio calculations",
      },
    ],
  }));

  resolver = new CrossReferenceResolver(registry);
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('CrossReferenceResolver', () => {
  it('resolve() returns CrossReferenceResult with cooling-curve analogy match', () => {
    const result = resolver.resolve('mathematics', 'math-exponential-decay', 'culinary-arts');

    expect(result.fromDepartment).toBe('mathematics');
    expect(result.fromConcept).toBe('math-exponential-decay');
    expect(result.toDepartment).toBe('culinary-arts');
    expect(result.matches.length).toBeGreaterThan(0);
    expect(result.matches[0].conceptId).toBe('culinary-cooling-curve');
    expect(result.matches[0].relationshipType).toBe('analogy');
  });

  it('resolve() returns empty matches when no cross-references to target department', () => {
    const result = resolver.resolve('mathematics', 'math-limits', 'culinary-arts');

    expect(result.matches).toHaveLength(0);
  });

  it('resolve() throws ConceptNotFoundError for non-existent source concept', () => {
    expect(() =>
      resolver.resolve('mathematics', 'nonexistent-concept', 'culinary-arts'),
    ).toThrow(ConceptNotFoundError);
  });

  it('resolve() finds both analogy and cross-reference relationship types', () => {
    // culinary-cooling-curve has cross-reference to math-exponential-decay
    const result = resolver.resolve('culinary-arts', 'culinary-cooling-curve', 'mathematics');

    expect(result.matches.length).toBeGreaterThan(0);
    expect(result.matches.some((m) => m.relationshipType === 'cross-reference')).toBe(true);
  });

  it('resolveAll() returns all cross-references from math to any department', () => {
    const results = resolver.resolveAll('mathematics');

    expect(results.length).toBeGreaterThan(0);
    // Should include references to culinary-arts from both exponential-decay and ratios
    const culinaryRefs = results.filter((r) => r.toDepartment === 'culinary-arts');
    expect(culinaryRefs.length).toBeGreaterThan(0);
  });

  it('findBridges() returns bidirectional concept pairs between departments', () => {
    const bridges = resolver.findBridges('mathematics', 'culinary-arts');

    expect(bridges.length).toBeGreaterThan(0);
    // math-exponential-decay <-> culinary-cooling-curve is a bridge
    const decayBridge = bridges.find(
      (b) =>
        (b.conceptA === 'math-exponential-decay' && b.conceptB === 'culinary-cooling-curve') ||
        (b.conceptA === 'culinary-cooling-curve' && b.conceptB === 'math-exponential-decay'),
    );
    expect(decayBridge).toBeDefined();
    expect(decayBridge!.relationships.length).toBeGreaterThan(0);
  });
});
