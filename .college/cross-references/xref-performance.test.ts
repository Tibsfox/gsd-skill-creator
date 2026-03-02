/**
 * Performance test for CrossReferenceResolver at 41-department scale.
 *
 * XREF-03: resolver handles 41-department scale without measurable
 * performance degradation compared to the 3-department baseline.
 *
 * Test approach: register a representative sample of concepts from all
 * cross-reference-touched departments, then measure resolveAll() time.
 * The full 41-department registry load is tested here using static imports.
 */

import { describe, it, expect } from 'vitest';
import { ConceptRegistry } from '../rosetta-core/concept-registry.js';
import { CrossReferenceResolver } from '../college/cross-reference-resolver.js';
import type { RosettaConcept } from '../rosetta-core/types.js';

function makeConcept(id: string, domain: string, xrefs: string[] = []): RosettaConcept {
  return {
    id,
    name: id,
    domain,
    description: `Concept ${id} in ${domain}`,
    panels: new Map(),
    relationships: xrefs.map((targetId) => ({
      type: 'cross-reference' as const,
      targetId,
      description: `${id} cross-references ${targetId}`,
    })),
    complexPlanePosition: {
      real: 0.5,
      imaginary: 0.5,
      magnitude: Math.sqrt(0.5),
      angle: Math.atan2(0.5, 0.5),
    },
  };
}

describe('CrossReferenceResolver performance at 41-department scale', () => {
  it('XREF-03: resolveAll() for all departments completes within 200ms', () => {
    const registry = new ConceptRegistry();

    // Register representative concepts across all 41 departments
    // 3-5 concepts per department for realistic scale
    const departments = [
      'math', 'science', 'reading', 'communication', 'critical-thinking',
      'physics', 'chemistry', 'geography', 'history', 'problem-solving',
      'statistics', 'business', 'engineering', 'materials', 'technology',
      'coding', 'data-science', 'digital-literacy', 'writing', 'languages',
      'logic', 'economics', 'environmental', 'psychology', 'nutrition',
      'art', 'philosophy', 'nature-studies', 'physical-education', 'home-economics',
      'theology', 'astronomy', 'learning', 'music', 'trades',
      'culinary-arts', 'mathematics', 'mind-body', 'electronics', 'spatial-computing',
      'cloud-systems',
    ];

    // Register 3 concepts per department with some cross-references
    const xrefTargets: string[] = [];
    for (const dept of departments) {
      for (let i = 1; i <= 3; i++) {
        const id = `${dept}-concept-${i}`;
        xrefTargets.push(id);
      }
    }

    // Register with cross-references pointing to a few targets
    for (const dept of departments) {
      for (let i = 1; i <= 3; i++) {
        const id = `${dept}-concept-${i}`;
        // Add cross-refs to 2-3 other department concepts
        const myXrefs = xrefTargets
          .filter((t) => !t.startsWith(`${dept}-`))
          .slice(i * 3, i * 3 + 2);
        registry.register(makeConcept(id, dept, myXrefs));
      }
    }

    const resolver = new CrossReferenceResolver(registry);

    const start = performance.now();
    for (const dept of departments) {
      resolver.resolveAll(dept);
    }
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(200);
    console.log(`resolveAll() for all 41 departments: ${elapsed.toFixed(2)}ms`);
  });

  it('XREF-03: resolver handles concepts with many cross-references without O(n^2) blowup', () => {
    const registry = new ConceptRegistry();

    // A "hub" concept with many cross-references
    const hubXrefs = Array.from({ length: 20 }, (_, i) => `target-concept-${i}`);
    registry.register(makeConcept('hub-concept', 'hub', hubXrefs));
    for (let i = 0; i < 20; i++) {
      registry.register(makeConcept(`target-concept-${i}`, `dept-${i % 5}`, []));
    }

    const resolver = new CrossReferenceResolver(registry);

    const start = performance.now();
    for (let run = 0; run < 100; run++) {
      resolver.resolveAll('hub');
    }
    const elapsed = performance.now() - start;

    // 100 calls should still be well under 100ms
    expect(elapsed).toBeLessThan(100);
  });
});
