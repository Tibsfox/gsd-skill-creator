// Plane Navigator Tests — TDD RED phase
//
// Tests the plane navigator that takes a classified plane position and
// identifies relevant domains, nearby primitives, and decomposition strategies.

import { describe, it, expect } from 'vitest';
import { navigatePlane } from './plane-navigator.js';
import type { NavigationResult, NearbyPrimitive, DecompositionStrategy } from './plane-navigator.js';
import type { PlaneClassification, DomainActivation } from './plane-classifier.js';
import type { DomainId, PlanePosition } from '../../core/types/mfe-types.js';

// === Test helpers ===

function makeClassification(
  position: PlanePosition,
  activations: Array<{ domainId: DomainId; score: number }>,
  confidence = 0.5,
): PlaneClassification {
  return {
    position,
    activatedDomains: activations.map(a => ({
      domainId: a.domainId,
      score: a.score,
      matchedPatterns: [`test-pattern-${a.domainId}`],
    })),
    confidence,
    keywords: ['test'],
  };
}

describe('plane-navigator', () => {
  describe('navigatePlane', () => {
    // Test 1: Perception-region position
    it('returns perception as closest domain for a perception-region position', () => {
      const classification = makeClassification(
        { real: -0.2, imaginary: 0.2 },
        [{ domainId: 'perception', score: 0.7 }],
      );

      const result: NavigationResult = navigatePlane(classification);

      // Perception should be the closest domain (its center is -0.2, 0.2)
      expect(result.nearbyDomains[0].domainId).toBe('perception');
      expect(result.nearbyDomains[0].withinRegion).toBe(true);
      // Should have primitives from perception domain
      expect(result.nearbyPrimitives.length).toBeGreaterThan(0);
      expect(result.nearbyPrimitives[0].domain).toBe('perception');
    });

    // Test 2: Reality-region position
    it('returns reality as a close domain for a reality-region position', () => {
      const classification = makeClassification(
        { real: 0.3, imaginary: -0.4 },
        [{ domainId: 'reality', score: 0.7 }],
      );

      const result = navigatePlane(classification);

      // Reality domain should be among the closest
      const realityDomain = result.nearbyDomains.find(d => d.domainId === 'reality');
      expect(realityDomain).toBeDefined();
      expect(realityDomain!.distance).toBeLessThan(0.5);
      // Primitives from reality should be present
      const realityPrimitives = result.nearbyPrimitives.filter(p => p.domain === 'reality');
      expect(realityPrimitives.length).toBeGreaterThan(0);
    });

    // Test 3: Between waves and change
    it('returns primitives from both domains for a waves+change position', () => {
      const classification = makeClassification(
        { real: -0.2, imaginary: -0.1 },
        [
          { domainId: 'waves', score: 0.6 },
          { domainId: 'change', score: 0.5 },
        ],
      );

      const result = navigatePlane(classification);

      // Should have primitives from both domains
      const wavesPrimitives = result.nearbyPrimitives.filter(p => p.domain === 'waves');
      const changePrimitives = result.nearbyPrimitives.filter(p => p.domain === 'change');
      expect(wavesPrimitives.length).toBeGreaterThan(0);
      expect(changePrimitives.length).toBeGreaterThan(0);
      // Should have a cross-domain decomposition strategy
      expect(result.decompositionStrategies.length).toBeGreaterThan(0);
    });

    // Test 4: Strong single-domain activation -> single-domain strategy
    it('generates single-domain strategy for strong single activation', () => {
      const classification = makeClassification(
        { real: -0.6, imaginary: 0.6 },
        [{ domainId: 'foundations', score: 0.8 }],
      );

      const result = navigatePlane(classification);

      // Should have at least one decomposition strategy
      expect(result.decompositionStrategies.length).toBeGreaterThan(0);
      // Primary strategy should be for foundations
      const foundationsStrategy = result.decompositionStrategies.find(
        s => s.primaryDomain === 'foundations'
      );
      expect(foundationsStrategy).toBeDefined();
      expect(foundationsStrategy!.confidence).toBeGreaterThan(0.5);
    });

    // Test 5: Cross-domain compatible (structure + mapping are compatible)
    it('generates cross-domain strategy for compatible domain pairs', () => {
      const classification = makeClassification(
        { real: 0.0, imaginary: 0.3 },
        [
          { domainId: 'structure', score: 0.6 },
          { domainId: 'mapping', score: 0.5 },
        ],
      );

      const result = navigatePlane(classification);

      // Should have a cross-domain strategy since structure and mapping are compatible
      const crossDomainStrategies = result.decompositionStrategies.filter(
        s => s.supportingDomains.length > 0
      );
      expect(crossDomainStrategies.length).toBeGreaterThan(0);
    });

    // Test 6: Cross-domain incompatible (perception + foundations are NOT compatible)
    it('does not generate cross-domain strategy for incompatible domain pairs', () => {
      const classification = makeClassification(
        { real: 0.0, imaginary: 0.0 },
        [
          { domainId: 'perception', score: 0.5 },
          { domainId: 'emergence', score: 0.4 },
        ],
      );

      const result = navigatePlane(classification);

      // Perception and emergence are NOT in each other's compatibleWith
      // Should not produce a cross-domain strategy pairing them
      const crossDomainStrategies = result.decompositionStrategies.filter(
        s => s.primaryDomain === 'perception' && s.supportingDomains.includes('emergence')
      );
      expect(crossDomainStrategies).toHaveLength(0);
    });

    // Test 7: Three+ domains -> synthesis strategy
    it('generates synthesis strategy when 3+ domains are activated', () => {
      const classification = makeClassification(
        { real: 0.0, imaginary: 0.0 },
        [
          { domainId: 'waves', score: 0.5 },
          { domainId: 'change', score: 0.4 },
          { domainId: 'structure', score: 0.3 },
        ],
      );

      const result = navigatePlane(classification);

      // Should have a synthesis strategy
      const synthesisStrategies = result.decompositionStrategies.filter(
        s => s.name.toLowerCase().includes('synthesis') || s.name.toLowerCase().includes('multi')
      );
      expect(synthesisStrategies.length).toBeGreaterThan(0);
    });

    // Test 8: No activations -> empty result
    it('returns empty primitives and strategies for no activations', () => {
      const classification = makeClassification(
        { real: 0.0, imaginary: 0.0 },
        [],
        0.0,
      );

      const result = navigatePlane(classification);

      expect(result.nearbyPrimitives).toHaveLength(0);
      expect(result.decompositionStrategies).toHaveLength(0);
      // Should still list all domains by distance
      expect(result.nearbyDomains.length).toBe(10);
    });

    // Test 9: Primitives ranked by relevance score descending
    it('ranks primitives by relevance score descending', () => {
      const classification = makeClassification(
        { real: -0.2, imaginary: 0.2 },
        [{ domainId: 'perception', score: 0.7 }],
      );

      const result = navigatePlane(classification);

      for (let i = 1; i < result.nearbyPrimitives.length; i++) {
        expect(result.nearbyPrimitives[i - 1].relevanceScore)
          .toBeGreaterThanOrEqual(result.nearbyPrimitives[i].relevanceScore);
      }
    });

    // Test 10: Top-N limit respected (max 20 by default)
    it('returns at most 20 primitives by default', () => {
      const classification = makeClassification(
        { real: -0.2, imaginary: 0.2 },
        [{ domainId: 'perception', score: 0.7 }],
      );

      const result = navigatePlane(classification);

      expect(result.nearbyPrimitives.length).toBeLessThanOrEqual(20);
    });

    // Test 11: totalPrimitivesScanned accurate
    it('reports accurate totalPrimitivesScanned count', () => {
      const classification = makeClassification(
        { real: -0.2, imaginary: 0.2 },
        [{ domainId: 'perception', score: 0.7 }],
      );

      const result = navigatePlane(classification);

      // Should be >= the number of returned primitives (scanned includes all, not just top-N)
      expect(result.totalPrimitivesScanned).toBeGreaterThanOrEqual(result.nearbyPrimitives.length);
      // Perception has 43 primitives
      expect(result.totalPrimitivesScanned).toBeGreaterThanOrEqual(30);
    });
  });

  describe('navigation properties', () => {
    it('echoes back the classified position', () => {
      const pos = { real: 0.15, imaginary: -0.35 };
      const classification = makeClassification(
        pos,
        [{ domainId: 'reality', score: 0.6 }],
      );

      const result = navigatePlane(classification);

      expect(result.classifiedPosition).toEqual(pos);
    });

    it('includes distance for each nearby domain', () => {
      const classification = makeClassification(
        { real: 0.0, imaginary: 0.0 },
        [{ domainId: 'perception', score: 0.5 }],
      );

      const result = navigatePlane(classification);

      for (const dom of result.nearbyDomains) {
        expect(dom.distance).toBeDefined();
        expect(dom.distance).toBeGreaterThanOrEqual(0);
      }
    });

    it('includes all required fields on NearbyPrimitive', () => {
      const classification = makeClassification(
        { real: -0.2, imaginary: 0.2 },
        [{ domainId: 'perception', score: 0.7 }],
      );

      const result = navigatePlane(classification);

      expect(result.nearbyPrimitives.length).toBeGreaterThan(0);
      const p: NearbyPrimitive = result.nearbyPrimitives[0];
      expect(p.id).toBeDefined();
      expect(p.name).toBeDefined();
      expect(p.domain).toBeDefined();
      expect(p.distance).toBeGreaterThanOrEqual(0);
      expect(p.relevanceScore).toBeGreaterThanOrEqual(0);
      expect(p.relevanceScore).toBeLessThanOrEqual(1);
      expect(p.type).toBeDefined();
    });

    it('includes all required fields on DecompositionStrategy', () => {
      const classification = makeClassification(
        { real: -0.6, imaginary: 0.6 },
        [{ domainId: 'foundations', score: 0.8 }],
      );

      const result = navigatePlane(classification);

      expect(result.decompositionStrategies.length).toBeGreaterThan(0);
      const s: DecompositionStrategy = result.decompositionStrategies[0];
      expect(s.name).toBeDefined();
      expect(s.description).toBeDefined();
      expect(s.primaryDomain).toBeDefined();
      expect(s.supportingDomains).toBeDefined();
      expect(s.suggestedPrimitives).toBeDefined();
      expect(s.confidence).toBeGreaterThanOrEqual(0);
      expect(s.confidence).toBeLessThanOrEqual(1);
    });
  });
});
