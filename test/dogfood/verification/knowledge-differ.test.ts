import { describe, it, expect } from 'vitest';
import { diffKnowledge } from '../../../src/dogfood/verification/knowledge-differ.js';
import type { LearnedConceptRef, EcosystemClaim } from '../../../src/dogfood/verification/types.js';

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

describe('knowledge-differ', () => {
  describe('diffKnowledge', () => {
    it('identifies concept present in textbook but missing from ecosystem', () => {
      const concepts = [
        makeConcept({ id: 'topology-1', name: 'topology', keywords: ['topology', 'homeomorphism', 'open set'] }),
      ];
      const claims = [
        makeClaim({ keywords: ['algebra', 'group'], claim: 'Groups form algebraic structures' }),
      ];

      const result = diffKnowledge(concepts, claims);

      expect(result.unmatchedConcepts).toHaveLength(1);
      expect(result.unmatchedConcepts[0].id).toBe('topology-1');
    });

    it('identifies ecosystem claim with no matching concept', () => {
      const concepts = [
        makeConcept({ name: 'calculus', keywords: ['calculus', 'derivative'] }),
      ];
      const claims = [
        makeClaim({ keywords: ['fpga', 'routing', 'compilation'], claim: 'FPGA routing optimizes gate placement' }),
      ];

      const result = diffKnowledge(concepts, claims);

      expect(result.unmatchedClaims).toHaveLength(1);
      expect(result.unmatchedClaims[0].claim).toBe('FPGA routing optimizes gate placement');
    });

    it('matches concept to claim when names overlap', () => {
      const concepts = [
        makeConcept({ name: 'Fourier transform', keywords: ['fourier', 'transform', 'frequency'] }),
      ];
      const claims = [
        makeClaim({ keywords: ['fourier', 'analysis', 'frequency'], claim: 'Fourier analysis decomposes signals' }),
      ];

      const result = diffKnowledge(concepts, claims);

      expect(result.matched).toHaveLength(1);
      expect(result.matched[0].similarity).toBeGreaterThan(0);
    });

    it('matches concept to claim when definitions share significant keywords', () => {
      const concepts = [
        makeConcept({
          name: 'spectral decomposition',
          definition: 'eigenvalue decomposition of a matrix into orthogonal components',
          keywords: ['eigenvalue', 'decomposition', 'matrix', 'spectral'],
        }),
      ];
      const claims = [
        makeClaim({
          keywords: ['eigenvalue', 'matrix', 'decomposition'],
          claim: 'Eigenvalues determine the principal axes of transformation',
        }),
      ];

      const result = diffKnowledge(concepts, claims);

      expect(result.matched).toHaveLength(1);
      expect(result.matched[0].concept.name).toBe('spectral decomposition');
    });

    it('returns similarity score between 0 and 1 for matched pairs', () => {
      const concepts = [
        makeConcept({ name: 'calculus', keywords: ['calculus', 'derivative', 'integral'] }),
      ];
      const claims = [
        makeClaim({ keywords: ['calculus', 'derivative', 'limit'], claim: 'Calculus studies change' }),
      ];

      const result = diffKnowledge(concepts, claims);

      expect(result.matched.length).toBeGreaterThan(0);
      for (const match of result.matched) {
        expect(match.similarity).toBeGreaterThanOrEqual(0);
        expect(match.similarity).toBeLessThanOrEqual(1);
      }
    });

    it('handles empty concept list', () => {
      const claims = [
        makeClaim({ keywords: ['algebra'] }),
        makeClaim({ keywords: ['geometry'] }),
      ];

      const result = diffKnowledge([], claims);

      expect(result.matched).toHaveLength(0);
      expect(result.unmatchedConcepts).toHaveLength(0);
      expect(result.unmatchedClaims).toEqual(claims);
    });

    it('handles empty claims list', () => {
      const concepts = [
        makeConcept({ name: 'topology' }),
        makeConcept({ id: 'c2', name: 'algebra' }),
      ];

      const result = diffKnowledge(concepts, []);

      expect(result.matched).toHaveLength(0);
      expect(result.unmatchedConcepts).toEqual(concepts);
      expect(result.unmatchedClaims).toHaveLength(0);
    });

    it('does not double-match: each concept matches at most one claim per document', () => {
      const concepts = [
        makeConcept({ name: 'calculus', keywords: ['calculus', 'derivative', 'integral'] }),
      ];
      const claims = [
        makeClaim({ document: 'doc-A.md', keywords: ['calculus', 'derivative'], claim: 'Derivatives measure rates' }),
        makeClaim({ document: 'doc-A.md', keywords: ['calculus', 'integral'], claim: 'Integrals measure area' }),
      ];

      const result = diffKnowledge(concepts, claims);

      // Concept should match at most once per document
      const docAMatches = result.matched.filter(m => m.claim.document === 'doc-A.md');
      expect(docAMatches).toHaveLength(1);
    });

    it('prioritizes higher similarity matches when concept could match multiple claims', () => {
      const concepts = [
        makeConcept({
          name: 'Fourier transform',
          keywords: ['fourier', 'transform', 'frequency', 'decomposition'],
        }),
      ];
      const claims = [
        makeClaim({
          document: 'doc-A.md',
          keywords: ['fourier'],
          claim: 'Fourier is mentioned briefly',
        }),
        makeClaim({
          document: 'doc-B.md',
          keywords: ['fourier', 'transform', 'frequency', 'decomposition', 'spectrum'],
          claim: 'Fourier transform decomposes signals into frequency components',
        }),
      ];

      const result = diffKnowledge(concepts, claims);

      // The higher similarity match (doc-B) should be included
      const docBMatch = result.matched.find(m => m.claim.document === 'doc-B.md');
      const docAMatch = result.matched.find(m => m.claim.document === 'doc-A.md');

      // doc-B has more keyword overlap, so higher similarity
      if (docAMatch && docBMatch) {
        expect(docBMatch.similarity).toBeGreaterThanOrEqual(docAMatch.similarity);
      }
      // At minimum, the best match should be present
      expect(docBMatch).toBeDefined();
    });
  });
});
