import { describe, it, expect } from 'vitest';
import { classifyGap, assignSeverity } from '../../../../src/dogfood/verification/gap-classifier.js';
import type { LearnedConceptRef, EcosystemClaim, GapRecord } from '../../../../src/dogfood/verification/types.js';
import { GAP_TYPES, GAP_SEVERITIES } from '../../../../src/dogfood/verification/types.js';

// --- Helpers ---

function makeConcept(overrides: Partial<LearnedConceptRef> = {}): LearnedConceptRef {
  return {
    id: 'concept-1',
    name: 'test concept',
    definition: 'a test concept definition with several words for length',
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

describe('gap-classifier', () => {
  describe('classifyGap', () => {
    it('classifies unmatched concept as missing-in-ecosystem', () => {
      const concept = makeConcept({ name: 'topology', definition: 'Study of topological spaces' });
      const gap = classifyGap({ concept });

      expect(gap.type).toBe('missing-in-ecosystem');
      expect(gap.concept).toBe('topology');
    });

    it('classifies unmatched claim as missing-in-textbook', () => {
      const claim = makeClaim({
        document: 'gsd-silicon-layer-spec.md',
        claim: 'FPGA routing optimizes gate placement',
      });
      const gap = classifyGap({ claim });

      expect(gap.type).toBe('missing-in-textbook');
      expect(gap.ecosystemSource).toBe('gsd-silicon-layer-spec.md');
    });

    it('classifies high-similarity match as verified', () => {
      const concept = makeConcept({ name: 'Fourier transform' });
      const claim = makeClaim({ claim: 'Fourier transform decomposes signals' });
      const gap = classifyGap({ concept, claim, similarity: 0.9 });

      expect(gap.type).toBe('verified');
    });

    it('classifies medium-similarity match as differently-expressed', () => {
      const concept = makeConcept({
        name: 'spectral analysis',
        definition: 'Frequency domain examination of signals',
      });
      const claim = makeClaim({
        claim: 'Signal frequency study through spectral methods',
        keywords: ['spectral', 'frequency'],
      });
      const gap = classifyGap({ concept, claim, similarity: 0.6 });

      expect(gap.type).toBe('differently-expressed');
    });

    it('classifies contradicting claims as inconsistent', () => {
      const concept = makeConcept({
        name: 'signal processing',
        definition: 'Processing of discrete signals through digital filters',
        keywords: ['signal', 'discrete', 'digital'],
      });
      const claim = makeClaim({
        claim: 'Continuous signal processing using analog filters',
        keywords: ['signal', 'continuous', 'analog'],
      });
      const gap = classifyGap({ concept, claim, similarity: 0.4 });

      expect(gap.type).toBe('inconsistent');
    });

    it('classifies ecosystem claim with broader textbook treatment as incomplete', () => {
      const concept = makeConcept({
        name: 'calculus',
        definition:
          'The mathematical study of continuous change encompassing differential calculus which studies rates of change and slopes of curves and integral calculus which studies accumulation of quantities and areas under curves and between curves using limits and infinite series',
      });
      const claim = makeClaim({
        claim: 'Calculus is used for rates of change',
        keywords: ['calculus'],
      });
      // similarity in the medium range, textbook definition is much longer
      const gap = classifyGap({ concept, claim, similarity: 0.35 });

      expect(gap.type).toBe('incomplete');
    });

    it('classifies as new-connection when textbook links two concepts ecosystem does not', () => {
      const concept = makeConcept({
        name: 'topology',
        definition: 'Study of topological spaces and continuous mappings',
      });
      const claim = makeClaim({
        claim: 'Topology classifies shapes',
        keywords: ['topology', 'shape'],
      });
      const gap = classifyGap({
        concept,
        claim,
        similarity: 0.5,
        conceptKeyRelationships: ['category theory', 'algebraic structures'],
      });

      expect(gap.type).toBe('new-connection');
    });

    it('assigns critical severity when gap affects skill activation geometry', () => {
      const concept = makeConcept({
        name: 'unit circle positioning',
        definition: 'Theta and radius determine skill activation on the unit circle',
        keywords: ['unit circle', 'theta', 'radius', 'activation'],
      });
      const gap = classifyGap({ concept });

      expect(gap.severity).toBe('critical');
    });

    it('assigns significant severity for material knowledge gap', () => {
      const concept = makeConcept({
        name: 'linear algebra fundamentals',
        definition: 'Matrix operations and vector space theory for computational mathematics',
        keywords: ['linear algebra', 'matrix', 'vector space'],
        confidence: 0.85,
        radius: 0.6,
      });
      const gap = classifyGap({ concept });

      expect(gap.severity).toBe('significant');
    });

    it('assigns minor severity for notation differences', () => {
      const concept = makeConcept({
        name: 'notation convention',
        definition: 'LaTeX notation for mathematical symbols',
        keywords: ['notation', 'latex', 'symbol'],
        confidence: 0.5,
        radius: 0.1,
      });
      const claim = makeClaim({
        claim: 'Mathematical notation uses different symbols',
        keywords: ['notation', 'symbol'],
      });
      const gap = classifyGap({ concept, claim, similarity: 0.4 });

      expect(gap.severity).toBe('minor');
    });

    it('assigns informational severity for verified gaps', () => {
      const concept = makeConcept({ name: 'Fourier series' });
      const claim = makeClaim({ claim: 'Fourier series expansion' });
      const gap = classifyGap({ concept, claim, similarity: 0.9 });

      expect(gap.severity).toBe('informational');
    });

    it('always populates analysis field with non-empty justification', () => {
      // Test across multiple classification scenarios
      const gapA = classifyGap({ concept: makeConcept() });
      const gapB = classifyGap({ claim: makeClaim() });
      const gapC = classifyGap({ concept: makeConcept(), claim: makeClaim(), similarity: 0.9 });

      expect(gapA.analysis.length).toBeGreaterThan(0);
      expect(gapB.analysis.length).toBeGreaterThan(0);
      expect(gapC.analysis.length).toBeGreaterThan(0);
    });

    it('populates suggestedResolution for non-verified gaps', () => {
      const gapMissing = classifyGap({ concept: makeConcept() });
      const gapVerified = classifyGap({
        concept: makeConcept(),
        claim: makeClaim(),
        similarity: 0.9,
      });

      expect(gapMissing.suggestedResolution.length).toBeGreaterThan(0);
      expect(gapVerified.suggestedResolution.length).toBeGreaterThan(0);
      // Verified gaps have a specific resolution message
      expect(gapVerified.suggestedResolution).toContain('No action needed');
    });
  });

  describe('assignSeverity', () => {
    it('returns a valid GapSeverity value', () => {
      const severity = assignSeverity({
        type: 'missing-in-ecosystem',
        concept: 'test',
        textbookClaim: 'some claim',
      });

      expect(GAP_SEVERITIES).toContain(severity);
    });

    it('assigns critical for inconsistent gap type', () => {
      const severity = assignSeverity({ type: 'inconsistent', concept: 'signal processing' });

      expect(severity).toBe('critical');
    });
  });
});
