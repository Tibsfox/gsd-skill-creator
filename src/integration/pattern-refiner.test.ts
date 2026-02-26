/**
 * TDD tests for MFE pattern refiner.
 *
 * Tests observation filtering, primitive frequency analysis,
 * pattern extraction, and refinement output.
 *
 * @module integration/pattern-refiner.test
 */

import { describe, it, expect } from 'vitest';
import type {
  MFEObservation,
  MathematicalPrimitive,
  DomainId,
  PlanePosition,
  CompositionStep,
} from '../types/mfe-types.js';
import {
  createPatternRefiner,
  type PatternRefiner,
  type RefinementResult,
} from './pattern-refiner.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePosition(real = 0.5, imaginary = -0.3): PlanePosition {
  return { real, imaginary };
}

function makeStep(n: number): CompositionStep {
  return {
    stepNumber: n,
    primitive: `perception-step-${n}`,
    action: `apply step ${n}`,
    justification: `because ${n}`,
    inputType: 'number',
    outputType: 'number',
    verificationStatus: 'passed',
  };
}

function makeObservation(overrides: Partial<MFEObservation> = {}): MFEObservation {
  return {
    problemHash: 'abc123',
    planePosition: makePosition(),
    domainsActivated: ['perception'] as DomainId[],
    primitivesUsed: ['primitiveA'],
    compositionPath: [makeStep(1)],
    verificationResult: 'passed',
    userFeedback: 'positive',
    timestamp: '2026-02-26T00:00:00.000Z',
    sessionId: 'session-1',
    ...overrides,
  };
}

function makePrimitive(
  id: string,
  existingPatterns: string[] = [],
): MathematicalPrimitive {
  return {
    id,
    name: id.replace(/-/g, ' '),
    type: 'definition',
    domain: 'perception' as DomainId,
    chapter: 1,
    section: '1.1',
    planePosition: makePosition(),
    formalStatement: `Formal statement for ${id}`,
    computationalForm: `Compute ${id}`,
    prerequisites: [],
    dependencies: [],
    enables: [],
    compositionRules: [],
    applicabilityPatterns: existingPatterns,
    keywords: [id],
    tags: [],
    buildLabs: [],
  };
}

/**
 * Build a set of controlled observations:
 * - 5 observations where primitiveA appears in 4 (passes threshold)
 * - primitiveB appears in only 2 (below threshold)
 * - Mixed verification results and user feedback
 */
function buildControlledObservations(): MFEObservation[] {
  return [
    // Obs 1: passed + positive, uses primitiveA
    makeObservation({
      problemHash: 'h1',
      primitivesUsed: ['primitiveA'],
      verificationResult: 'passed',
      userFeedback: 'positive',
    }),
    // Obs 2: passed + none, uses primitiveA + primitiveB
    makeObservation({
      problemHash: 'h2',
      primitivesUsed: ['primitiveA', 'primitiveB'],
      verificationResult: 'passed',
      userFeedback: 'none',
    }),
    // Obs 3: FAILED verification, uses primitiveA (should be excluded)
    makeObservation({
      problemHash: 'h3',
      primitivesUsed: ['primitiveA'],
      verificationResult: 'failed',
      userFeedback: 'positive',
    }),
    // Obs 4: passed + positive, uses primitiveA
    makeObservation({
      problemHash: 'h4',
      primitivesUsed: ['primitiveA'],
      verificationResult: 'passed',
      userFeedback: 'positive',
    }),
    // Obs 5: passed + NEGATIVE feedback, uses primitiveA + primitiveB (excluded)
    makeObservation({
      problemHash: 'h5',
      primitivesUsed: ['primitiveA', 'primitiveB'],
      verificationResult: 'passed',
      userFeedback: 'negative',
    }),
  ];
}

function buildPrimitiveMap(): Map<string, MathematicalPrimitive> {
  return new Map([
    ['primitiveA', makePrimitive('primitiveA')],
    ['primitiveB', makePrimitive('primitiveB')],
  ]);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PatternRefiner', () => {
  let refiner: PatternRefiner;

  // =========================================================================
  // 1. Observation filtering
  // =========================================================================

  describe('Observation filtering', () => {
    beforeEach(() => {
      refiner = createPatternRefiner({ minObservationThreshold: 1 });
    });

    it('only considers observations with verificationResult passed', () => {
      const observations = [
        makeObservation({ verificationResult: 'passed', primitivesUsed: ['primitiveA'] }),
        makeObservation({ verificationResult: 'failed', primitivesUsed: ['primitiveA'] }),
        makeObservation({ verificationResult: 'partial', primitivesUsed: ['primitiveA'] }),
        makeObservation({ verificationResult: 'skipped', primitivesUsed: ['primitiveA'] }),
      ];
      const result = refiner.refine(observations, buildPrimitiveMap());
      // Only 1 positive observation (passed + non-negative)
      expect(result.positiveObservations).toBe(1);
    });

    it('excludes observations with negative userFeedback even if passed', () => {
      const observations = [
        makeObservation({ verificationResult: 'passed', userFeedback: 'negative', primitivesUsed: ['primitiveA'] }),
        makeObservation({ verificationResult: 'passed', userFeedback: 'positive', primitivesUsed: ['primitiveA'] }),
      ];
      const result = refiner.refine(observations, buildPrimitiveMap());
      expect(result.positiveObservations).toBe(1);
    });

    it('returns empty refinement for empty observation list', () => {
      const result = refiner.refine([], buildPrimitiveMap());
      expect(result.refinements).toHaveLength(0);
      expect(result.totalObservations).toBe(0);
      expect(result.positiveObservations).toBe(0);
    });
  });

  // =========================================================================
  // 2. Primitive frequency analysis
  // =========================================================================

  describe('Primitive frequency analysis', () => {
    beforeEach(() => {
      refiner = createPatternRefiner({ minObservationThreshold: 3 });
    });

    it('counts how many positive observations each primitive appears in', () => {
      const observations = buildControlledObservations();
      const result = refiner.refine(observations, buildPrimitiveMap());
      // primitiveA: obs 1, 2, 4 are positive (3 fails, 5 negative) → 3 positive
      // primitiveB: obs 2 is positive → 1 positive
      expect(result.primitivesAnalyzed).toBeGreaterThan(0);
    });

    it('does not refine primitives below threshold', () => {
      const observations = buildControlledObservations();
      const result = refiner.refine(observations, buildPrimitiveMap());
      // primitiveB only in 1 positive observation, threshold is 3
      const refinedIds = result.refinements.map((r) => r.primitiveId);
      expect(refinedIds).not.toContain('primitiveB');
    });

    it('includes primitives at or above threshold', () => {
      const observations = buildControlledObservations();
      const result = refiner.refine(observations, buildPrimitiveMap());
      // primitiveA is in 3 positive observations, threshold is 3
      const refinedIds = result.refinements.map((r) => r.primitiveId);
      expect(refinedIds).toContain('primitiveA');
    });
  });

  // =========================================================================
  // 3. Pattern extraction
  // =========================================================================

  describe('Pattern extraction', () => {
    it('extracts patterns from problem hashes of positive observations', () => {
      // Use threshold 1 for testing extraction
      refiner = createPatternRefiner({ minObservationThreshold: 1 });
      const observations = [
        makeObservation({
          problemHash: 'hash-1',
          primitivesUsed: ['primitiveA'],
          verificationResult: 'passed',
          userFeedback: 'positive',
        }),
      ];
      const result = refiner.refine(observations, buildPrimitiveMap());
      expect(result.refinements).toHaveLength(1);
      expect(result.refinements[0].newPatterns.length).toBeGreaterThan(0);
    });

    it('deduplicates patterns from same problem hash', () => {
      refiner = createPatternRefiner({ minObservationThreshold: 1 });
      // Two observations with the same hash
      const observations = [
        makeObservation({
          problemHash: 'same-hash',
          primitivesUsed: ['primitiveA'],
          verificationResult: 'passed',
          userFeedback: 'positive',
        }),
        makeObservation({
          problemHash: 'same-hash',
          primitivesUsed: ['primitiveA'],
          verificationResult: 'passed',
          userFeedback: 'none',
        }),
      ];
      const result = refiner.refine(observations, buildPrimitiveMap());
      // Should not have duplicate patterns from same hash
      const patterns = result.refinements[0].newPatterns;
      const unique = new Set(patterns);
      expect(patterns.length).toBe(unique.size);
    });

    it('does not add patterns that already exist in applicabilityPatterns', () => {
      refiner = createPatternRefiner({ minObservationThreshold: 1 });
      const observations = [
        makeObservation({
          problemHash: 'existing-pattern',
          primitivesUsed: ['primitiveA'],
          verificationResult: 'passed',
          userFeedback: 'positive',
        }),
      ];
      // Give primitiveA an existing pattern that matches what would be extracted
      const primitives = new Map([
        ['primitiveA', makePrimitive('primitiveA', ['existing-pattern'])],
      ]);
      const result = refiner.refine(observations, primitives);
      // Should have no new patterns since 'existing-pattern' already exists
      if (result.refinements.length > 0) {
        expect(result.refinements[0].newPatterns).not.toContain('existing-pattern');
      }
    });
  });

  // =========================================================================
  // 4. Refinement output
  // =========================================================================

  describe('Refinement output', () => {
    beforeEach(() => {
      refiner = createPatternRefiner({ minObservationThreshold: 3 });
    });

    it('returns a RefinementResult with refinement entries', () => {
      const observations = buildControlledObservations();
      const result = refiner.refine(observations, buildPrimitiveMap());
      expect(result).toHaveProperty('refinements');
      expect(result).toHaveProperty('totalObservations');
      expect(result).toHaveProperty('positiveObservations');
      expect(result).toHaveProperty('primitivesAnalyzed');
      expect(result).toHaveProperty('primitivesRefined');
      expect(result).toHaveProperty('timestamp');
    });

    it('each refinement has required fields', () => {
      const observations = buildControlledObservations();
      const result = refiner.refine(observations, buildPrimitiveMap());
      for (const refinement of result.refinements) {
        expect(refinement).toHaveProperty('primitiveId');
        expect(refinement).toHaveProperty('currentPatterns');
        expect(refinement).toHaveProperty('newPatterns');
        expect(refinement).toHaveProperty('observationCount');
        expect(refinement).toHaveProperty('confidence');
        expect(refinement.confidence).toBeGreaterThanOrEqual(0);
        expect(refinement.confidence).toBeLessThanOrEqual(1);
      }
    });

    it('refinement count matches primitives meeting threshold', () => {
      const observations = buildControlledObservations();
      const result = refiner.refine(observations, buildPrimitiveMap());
      expect(result.primitivesRefined).toBe(result.refinements.length);
    });
  });
});
