/**
 * Integration test: CrossReferenceResolver.resolveAll returns culinary-arts for nutrition.
 * Verifies XREF-02 by registering the modified concept files plus stub culinary-arts
 * targets, then checking resolver output uses correct CrossReferenceResult fields.
 */

import { describe, it, expect } from 'vitest';
import { ConceptRegistry } from '../rosetta-core/concept-registry.js';
import { CrossReferenceResolver } from '../college/cross-reference-resolver.js';
import { macronutrients } from '../departments/nutrition/concepts/nutrients-functions/macronutrients.js';
import { digestiveProcess } from '../departments/nutrition/concepts/digestion-body-systems/digestive-process.js';
import type { RosettaConcept } from '../rosetta-core/types.js';

function makeStubConcept(id: string, domain: string): RosettaConcept {
  return {
    id,
    name: id,
    domain,
    description: `Stub concept ${id}`,
    panels: new Map(),
    relationships: [],
    complexPlanePosition: {
      real: 0.5,
      imaginary: 0.5,
      magnitude: Math.sqrt(0.5),
      angle: Math.atan2(0.5, 0.5),
    },
  };
}

describe('CrossReferenceResolver XREF-02 integration', () => {
  it('resolveAll("nutrition") returns results that include toDepartment === "culinary-arts"', () => {
    const registry = new ConceptRegistry();

    // Register the modified nutrition concepts (source side)
    registry.register(macronutrients);
    registry.register(digestiveProcess);

    // Register stub culinary-arts targets so resolveAll() can resolve them
    registry.register(makeStubConcept('cook-macronutrient-roles', 'culinary-arts'));
    registry.register(makeStubConcept('cook-protein-denaturation', 'culinary-arts'));

    const resolver = new CrossReferenceResolver(registry);
    const results = resolver.resolveAll('nutrition');

    // results is CrossReferenceResult[] with fields: fromDepartment, fromConcept, toDepartment, matches
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.toDepartment === 'culinary-arts')).toBe(true);
  });

  it('modified nutrition concept files have cross-references to cook- prefixed targetIds', () => {
    const culinaryRefs = [
      ...macronutrients.relationships,
      ...digestiveProcess.relationships,
    ].filter((rel) => rel.type === 'cross-reference' && rel.targetId.startsWith('cook-'));

    expect(culinaryRefs.length).toBeGreaterThan(0);
    expect(culinaryRefs[0].targetId).toMatch(/^cook-/);
  });
});
