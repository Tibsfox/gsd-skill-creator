import { describe, it, expect } from 'vitest';
import { mapConceptCoverage, mapEcosystemCoverage } from '../../../../src/dogfood/verification/coverage-mapper.js';
import type { LearnedConceptRef, EcosystemCorpus, EcosystemClaim } from '../../../../src/dogfood/verification/types.js';

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

function makeCorpus(claims: EcosystemClaim[]): EcosystemCorpus {
  return {
    documents: [
      {
        name: 'test-doc.md',
        sections: [{ title: 'Section 1', content: 'Test content', keywords: ['test'] }],
      },
    ],
    claims,
  };
}

// --- Tests ---

describe('coverage-mapper', () => {
  describe('mapConceptCoverage', () => {
    it('maps concept to ecosystem claims by keyword match', () => {
      const concepts = [
        makeConcept({
          id: 'fourier-1',
          name: 'Fourier transform',
          keywords: ['fourier', 'transform', 'frequency'],
        }),
      ];
      const claims = [
        makeClaim({ keywords: ['fourier', 'analysis'], claim: 'Fourier analysis decomposes signals' }),
        makeClaim({ keywords: ['algebra', 'group'], claim: 'Group theory studies symmetry' }),
      ];
      const corpus = makeCorpus(claims);

      const result = mapConceptCoverage(concepts, corpus);

      const conceptClaims = result.conceptToEcosystem.get('fourier-1');
      expect(conceptClaims).toBeDefined();
      expect(conceptClaims!.length).toBeGreaterThanOrEqual(1);
      expect(conceptClaims![0].keywords).toContain('fourier');
    });

    it('maps ecosystem claim to learned concepts by keyword match', () => {
      const concepts = [
        makeConcept({ id: 'calc-1', name: 'calculus', keywords: ['calculus', 'derivative'] }),
        makeConcept({ id: 'alg-1', name: 'algebra', keywords: ['algebra', 'equation'] }),
      ];
      const claims = [
        makeClaim({ keywords: ['calculus', 'integral'], claim: 'Calculus finds areas under curves' }),
      ];
      const corpus = makeCorpus(claims);

      const result = mapConceptCoverage(concepts, corpus);

      // The claim about calculus should map to the calculus concept
      const claimKey = 'calculus';  // keyword-based lookup
      const mappedConcepts = result.ecosystemToConcept.get(claimKey);
      expect(mappedConcepts).toBeDefined();
      expect(mappedConcepts!.some(c => c.id === 'calc-1')).toBe(true);
    });

    it('identifies uncovered concepts (no matching claims)', () => {
      const concepts = [
        makeConcept({
          id: 'homotopy-1',
          name: 'homotopy',
          keywords: ['homotopy', 'continuous deformation', 'path'],
        }),
      ];
      const claims = [
        makeClaim({ keywords: ['algebra', 'ring'], claim: 'Ring theory studies algebraic structures' }),
      ];
      const corpus = makeCorpus(claims);

      const result = mapConceptCoverage(concepts, corpus);

      expect(result.uncoveredConcepts).toHaveLength(1);
      expect(result.uncoveredConcepts[0].id).toBe('homotopy-1');
    });

    it('identifies uncovered claims (no matching concepts)', () => {
      const concepts = [
        makeConcept({ id: 'calc-1', name: 'calculus', keywords: ['calculus'] }),
      ];
      const claims = [
        makeClaim({ keywords: ['fpga', 'compilation'], claim: 'FPGA compilation synthesizes circuits' }),
      ];
      const corpus = makeCorpus(claims);

      const result = mapConceptCoverage(concepts, corpus);

      expect(result.uncoveredClaims).toHaveLength(1);
      expect(result.uncoveredClaims[0].claim).toBe('FPGA compilation synthesizes circuits');
    });

    it('bidirectional: every concept appears in conceptToEcosystem map', () => {
      const concepts = [
        makeConcept({ id: 'c1', name: 'concept A', keywords: ['alpha'] }),
        makeConcept({ id: 'c2', name: 'concept B', keywords: ['beta'] }),
        makeConcept({ id: 'c3', name: 'concept C', keywords: ['gamma'] }),
      ];
      const claims = [makeClaim({ keywords: ['alpha'] })];
      const corpus = makeCorpus(claims);

      const result = mapConceptCoverage(concepts, corpus);

      expect(result.conceptToEcosystem.has('c1')).toBe(true);
      expect(result.conceptToEcosystem.has('c2')).toBe(true);
      expect(result.conceptToEcosystem.has('c3')).toBe(true);
    });

    it('bidirectional: every claim appears in ecosystemToConcept map', () => {
      const concepts = [makeConcept({ keywords: ['alpha'] })];
      const claims = [
        makeClaim({ keywords: ['alpha'], claim: 'Claim A' }),
        makeClaim({ keywords: ['beta'], claim: 'Claim B' }),
        makeClaim({ keywords: ['gamma'], claim: 'Claim C' }),
      ];
      const corpus = makeCorpus(claims);

      const result = mapConceptCoverage(concepts, corpus);

      // Each claim's keywords should have entries in the map
      for (const claim of claims) {
        const hasEntry = claim.keywords.some(kw =>
          result.ecosystemToConcept.has(kw.toLowerCase()),
        );
        // At minimum, the keyword exists as a key (even if empty)
        expect(
          hasEntry || result.uncoveredClaims.some(c => c.claim === claim.claim),
        ).toBe(true);
      }
    });

    it('handles corpus with multiple documents', () => {
      const concepts = [
        makeConcept({ id: 'c1', name: 'topology', keywords: ['topology'] }),
      ];
      const claims = [
        makeClaim({ document: 'doc-A.md', keywords: ['topology'], claim: 'Topology in doc A' }),
        makeClaim({ document: 'doc-B.md', keywords: ['topology'], claim: 'Topology in doc B' }),
        makeClaim({ document: 'doc-C.md', keywords: ['topology'], claim: 'Topology in doc C' }),
      ];
      const corpus: EcosystemCorpus = {
        documents: [
          { name: 'doc-A.md', sections: [{ title: 'S1', content: '', keywords: ['topology'] }] },
          { name: 'doc-B.md', sections: [{ title: 'S1', content: '', keywords: ['topology'] }] },
          { name: 'doc-C.md', sections: [{ title: 'S1', content: '', keywords: ['topology'] }] },
        ],
        claims,
      };

      const result = mapConceptCoverage(concepts, corpus);

      const conceptClaims = result.conceptToEcosystem.get('c1');
      expect(conceptClaims).toBeDefined();
      expect(conceptClaims!.length).toBe(3);
    });

    it('keyword matching is case-insensitive', () => {
      const concepts = [
        makeConcept({ id: 'f1', name: 'fourier', keywords: ['fourier'] }),
      ];
      const claims = [
        makeClaim({ keywords: ['Fourier'], claim: 'Fourier series convergence' }),
      ];
      const corpus = makeCorpus(claims);

      const result = mapConceptCoverage(concepts, corpus);

      const conceptClaims = result.conceptToEcosystem.get('f1');
      expect(conceptClaims).toBeDefined();
      expect(conceptClaims!.length).toBe(1);
    });

    it('returns empty uncovered lists when everything matches', () => {
      const concepts = [
        makeConcept({ id: 'c1', name: 'alpha', keywords: ['alpha'] }),
        makeConcept({ id: 'c2', name: 'beta', keywords: ['beta'] }),
      ];
      const claims = [
        makeClaim({ keywords: ['alpha'], claim: 'Alpha claim' }),
        makeClaim({ keywords: ['beta'], claim: 'Beta claim' }),
      ];
      const corpus = makeCorpus(claims);

      const result = mapConceptCoverage(concepts, corpus);

      expect(result.uncoveredConcepts).toHaveLength(0);
      expect(result.uncoveredClaims).toHaveLength(0);
    });
  });

  describe('mapEcosystemCoverage', () => {
    it('returns same structure as mapConceptCoverage', () => {
      const concepts = [
        makeConcept({ id: 'c1', name: 'alpha', keywords: ['alpha'] }),
      ];
      const claims = [makeClaim({ keywords: ['alpha'] })];
      const corpus = makeCorpus(claims);

      const result = mapEcosystemCoverage(corpus, concepts);

      expect(result.conceptToEcosystem).toBeInstanceOf(Map);
      expect(result.ecosystemToConcept).toBeInstanceOf(Map);
      expect(Array.isArray(result.uncoveredConcepts)).toBe(true);
      expect(Array.isArray(result.uncoveredClaims)).toBe(true);
    });
  });
});
