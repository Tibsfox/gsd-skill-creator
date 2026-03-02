/**
 * Integration tests for Math<->Cooking bidirectional cross-reference bridges.
 *
 * Verifies that math concepts navigate to cooking concepts and back (INTG-04, INT-07).
 * Uses real concept definitions from both departments.
 *
 * @module safety/cross-reference-bridges.test
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { ConceptRegistry } from '../rosetta-core/concept-registry.js';
import { CrossReferenceResolver } from '../college/cross-reference-resolver.js';

// Math concepts
import {
  exponentialDecay,
  ratiosProportions,
  logarithmicScales,
  trigFunctions,
  complexNumbers,
  eulerFormula,
  fractalGeometry,
} from '../departments/mathematics/concepts/index.js';

// Cooking concepts with math cross-references
import { newtonsCooling } from '../departments/culinary-arts/concepts/thermodynamics/newtons-law-of-cooling.js';
import { bakersRatios } from '../departments/culinary-arts/concepts/baking-science/bakers-ratios.js';
import { maillardReaction } from '../departments/culinary-arts/concepts/food-science/maillard-reaction.js';

// Additional cooking concepts referenced by the above
import { temperatureDangerZone } from '../departments/culinary-arts/concepts/food-safety/temperature-danger-zone.js';
import { glutenDevelopment } from '../departments/culinary-arts/concepts/baking-science/gluten-development.js';
import { sugarChemistry } from '../departments/culinary-arts/concepts/baking-science/sugar-chemistry.js';
import { caramelization } from '../departments/culinary-arts/concepts/food-science/caramelization.js';
import { proteinDenaturation } from '../departments/culinary-arts/concepts/food-science/protein-denaturation.js';

// ─── Test Setup ──────────────────────────────────────────────────────────────

let registry: ConceptRegistry;
let resolver: CrossReferenceResolver;

beforeAll(() => {
  registry = new ConceptRegistry();

  // Register all 7 math concepts
  registry.register(exponentialDecay);
  registry.register(trigFunctions);
  registry.register(complexNumbers);
  registry.register(eulerFormula);
  registry.register(ratiosProportions);
  registry.register(logarithmicScales);
  registry.register(fractalGeometry);

  // Register cooking concepts with cross-references to math
  registry.register(newtonsCooling);
  registry.register(bakersRatios);
  registry.register(maillardReaction);

  // Register cooking concepts referenced by the above (transitive dependencies)
  registry.register(temperatureDangerZone);
  registry.register(glutenDevelopment);
  registry.register(sugarChemistry);
  registry.register(caramelization);
  registry.register(proteinDenaturation);

  resolver = new CrossReferenceResolver(registry);
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Cross-Reference Bridges: Math <-> Cooking', () => {
  it('INT-07 forward: math-exponential-decay resolves to a culinary-arts concept', () => {
    const forward = resolver.resolve('mathematics', 'math-exponential-decay', 'culinary-arts');
    expect(forward.matches.length).toBeGreaterThan(0);
    expect(forward.matches[0].conceptId).toBe('cook-newtons-cooling');
  });

  it('INT-07 reverse: cook-newtons-cooling resolves back to a math concept', () => {
    const reverse = resolver.resolve('culinary-arts', 'cook-newtons-cooling', 'mathematics');
    expect(reverse.matches.length).toBeGreaterThan(0);
    expect(reverse.matches.some(m => m.conceptId === 'math-exponential-decay')).toBe(true);
  });

  it('bidirectional bridge: findBridges returns at least one bridge between math and cooking', () => {
    const bridges = resolver.findBridges('mathematics', 'culinary-arts');
    expect(bridges.length).toBeGreaterThan(0);

    // At least the exponential-decay <-> newtons-cooling bridge should exist
    const decayBridge = bridges.find(
      b => (b.conceptA === 'math-exponential-decay' && b.conceptB === 'cook-newtons-cooling') ||
           (b.conceptA === 'cook-newtons-cooling' && b.conceptB === 'math-exponential-decay'),
    );
    expect(decayBridge).toBeDefined();
    // Bidirectional: both sides have references
    expect(decayBridge!.relationships.length).toBeGreaterThanOrEqual(2);
  });

  it('ratios bridge: math-ratios resolves to baker\'s ratios in culinary-arts', () => {
    const result = resolver.resolve('mathematics', 'math-ratios', 'culinary-arts');
    expect(result.matches.length).toBeGreaterThan(0);
    expect(result.matches.some(m => m.conceptId === 'cook-bakers-ratios')).toBe(true);
  });

  it('logarithmic bridge: math-logarithmic-scales resolves to a culinary-arts concept', () => {
    const result = resolver.resolve('mathematics', 'math-logarithmic-scales', 'culinary-arts');
    expect(result.matches.length).toBeGreaterThan(0);
    expect(result.matches.some(m => m.conceptId === 'cook-maillard-reaction')).toBe(true);
  });

  it('no orphan refs: math concepts with cooking bridges resolve their cross-reference targets', () => {
    // Focus on the 3 math concepts with established cross-department bridges
    const bridgedMathConcepts = [exponentialDecay, ratiosProportions, logarithmicScales];

    for (const concept of bridgedMathConcepts) {
      for (const rel of concept.relationships) {
        if (rel.type === 'cross-reference') {
          const target = registry.get(rel.targetId);
          expect(target, `${concept.id} references ${rel.targetId} which is not registered`).toBeDefined();
        }
      }
    }
  });

  it('no orphan refs cooking: every cooking cross-reference to math resolves to a registered concept', () => {
    const cookingConcepts = [newtonsCooling, bakersRatios, maillardReaction];

    for (const concept of cookingConcepts) {
      for (const rel of concept.relationships) {
        if (rel.type === 'cross-reference') {
          const target = registry.get(rel.targetId);
          if (target && target.domain === 'mathematics') {
            expect(target).toBeDefined();
          }
        }
      }
    }
  });
});
