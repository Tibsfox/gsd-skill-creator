import { describe, it, expect } from 'vitest';
import { checkConsistency } from '../../../src/dogfood/verification/consistency-checker.js';
import type { LearnedConceptRef, EcosystemClaim } from '../../../src/dogfood/verification/types.js';
import { GAP_TYPES, GAP_SEVERITIES } from '../../../src/dogfood/verification/types.js';

// --- Helpers ---

function makeConcept(overrides: Partial<LearnedConceptRef> = {}): LearnedConceptRef {
  return {
    id: 'concept-1',
    name: 'test concept',
    definition: 'a test concept definition',
    sourceChapter: 1,
    sourcePart: 1,
    keywords: ['test', 'concept'],
    confidence: 0.8,
    radius: 0.5,
    ...overrides,
  };
}

function makeClaim(overrides: Partial<EcosystemClaim> = {}): EcosystemClaim {
  return {
    document: 'test-doc.md',
    section: 'section-1',
    claim: 'a test claim',
    keywords: ['test', 'claim'],
    mathDomain: 'general',
    ...overrides,
  };
}

// --- Tests ---

describe('consistency-checker', () => {
  describe('checkConsistency', () => {
    it('detects inconsistency when ecosystem says continuous but textbook says discrete', () => {
      const concepts = [
        makeConcept({
          name: 'signal processing',
          definition: 'Processing of discrete signals through digital methods',
          keywords: ['signal', 'discrete', 'digital', 'processing'],
        }),
      ];
      const claims = [
        makeClaim({
          claim: 'Continuous signal processing using analog filters',
          keywords: ['signal', 'continuous', 'analog', 'processing'],
          mathDomain: 'signal processing',
        }),
      ];

      const result = checkConsistency(concepts, claims);

      expect(result.gaps).toHaveLength(1);
      expect(result.gaps[0].type).toBe('inconsistent');
    });

    it('validates consistent claims as verified', () => {
      const concepts = [
        makeConcept({
          name: 'Fourier decomposition',
          definition: 'Fourier decomposition of functions into frequency components',
          keywords: ['fourier', 'decomposition', 'frequency', 'function', 'components'],
        }),
      ];
      const claims = [
        makeClaim({
          claim: 'Fourier decomposition of functions into frequency components',
          keywords: ['fourier', 'decomposition', 'frequency', 'function', 'components'],
          mathDomain: 'analysis',
        }),
      ];

      const result = checkConsistency(concepts, claims);

      expect(result.gaps).toHaveLength(1);
      expect(result.gaps[0].type).toBe('verified');
    });

    it('detects incomplete ecosystem treatment', () => {
      const concepts = [
        makeConcept({
          name: 'calculus',
          definition:
            'The mathematical study of continuous change encompassing differential calculus which studies rates of change and slopes of curves and integral calculus which studies accumulation of quantities and areas under curves using limits infinite series and convergence criteria',
          keywords: ['calculus', 'derivative', 'integral'],
        }),
      ];
      const claims = [
        makeClaim({
          claim: 'Calculus is used for change',
          keywords: ['calculus'],
          mathDomain: 'calculus',
        }),
      ];

      const result = checkConsistency(concepts, claims);

      expect(result.gaps).toHaveLength(1);
      expect(result.gaps[0].type).toBe('incomplete');
    });

    it('detects outdated ecosystem claim', () => {
      const concepts = [
        makeConcept({
          name: 'unit circle activation',
          definition: 'Refined activation model using tangent-line intersection with dampened angular velocity and bounded radius growth on the complex plane',
          keywords: ['activation', 'tangent', 'angular'],
        }),
      ];
      const claims = [
        makeClaim({
          claim: 'Simple activation on unit circle via angle lookup',
          keywords: ['activation', 'unit circle'],
          mathDomain: 'geometry',
        }),
      ];

      const result = checkConsistency(concepts, claims);

      expect(result.gaps).toHaveLength(1);
      // The textbook has refined what the ecosystem describes simply
      expect(['outdated', 'incomplete']).toContain(result.gaps[0].type);
    });

    it('cross-validates claims across multiple ecosystem documents', () => {
      const concepts = [
        makeConcept({
          name: 'set theory',
          definition: 'Study of sets, membership, unions, intersections, and boundaries',
          keywords: ['set theory', 'membership', 'union', 'intersection'],
        }),
      ];
      const claims = [
        makeClaim({
          document: 'gsd-mathematical-foundations-conversation.md',
          claim: 'Set theory provides boundary definitions for skill domains',
          keywords: ['set theory', 'boundary', 'domain'],
          mathDomain: 'set theory',
        }),
        makeClaim({
          document: 'gsd-chipset-architecture-vision.md',
          claim: 'Set operations define chipset instruction groups',
          keywords: ['set', 'operations', 'instruction'],
          mathDomain: 'set theory',
        }),
      ];

      const result = checkConsistency(concepts, claims);

      expect(result.gaps).toHaveLength(2);
      expect(result.claimsChecked).toBe(2);
    });

    it('produces GapRecord for every checked claim', () => {
      const concepts = [
        makeConcept({ name: 'alpha', keywords: ['alpha'] }),
        makeConcept({ id: 'c2', name: 'beta', keywords: ['beta'] }),
      ];
      const claims = [
        makeClaim({ keywords: ['alpha'], claim: 'Alpha claim' }),
        makeClaim({ keywords: ['beta'], claim: 'Beta claim' }),
        makeClaim({ keywords: ['gamma'], claim: 'Gamma claim' }),
        makeClaim({ keywords: ['delta'], claim: 'Delta claim' }),
        makeClaim({ keywords: ['epsilon'], claim: 'Epsilon claim' }),
      ];

      const result = checkConsistency(concepts, claims);

      expect(result.gaps).toHaveLength(5);
      expect(result.claimsChecked).toBe(5);
    });

    it('uses classifyGap from gap-classifier for consistent classification', () => {
      const concepts = [makeConcept({ keywords: ['test'] })];
      const claims = [makeClaim({ keywords: ['test'] })];

      const result = checkConsistency(concepts, claims);

      // Every gap type must be a valid GapType
      for (const gap of result.gaps) {
        expect(GAP_TYPES).toContain(gap.type);
      }
    });

    it('assigns severity to each produced gap', () => {
      const concepts = [makeConcept({ keywords: ['math'] })];
      const claims = [
        makeClaim({ keywords: ['math'], claim: 'Math is fundamental' }),
        makeClaim({ keywords: ['physics'], claim: 'Physics applies math' }),
      ];

      const result = checkConsistency(concepts, claims);

      for (const gap of result.gaps) {
        expect(GAP_SEVERITIES).toContain(gap.severity);
        expect(gap.severity).not.toBeNull();
        expect(gap.severity).not.toBeUndefined();
      }
    });

    it('handles claim with no matching concept in database', () => {
      const concepts = [
        makeConcept({ name: 'algebra', keywords: ['algebra', 'equation'] }),
      ];
      const claims = [
        makeClaim({
          claim: 'Quantum entanglement enables faster-than-light information transfer',
          keywords: ['quantum', 'entanglement', 'information'],
          mathDomain: 'quantum physics',
        }),
      ];

      const result = checkConsistency(concepts, claims);

      expect(result.gaps).toHaveLength(1);
      expect(result.gaps[0].type).toBe('missing-in-textbook');
    });
  });
});
