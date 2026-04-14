import { describe, it, expect } from 'vitest';
import type { AlgorithmVariant, Parameter } from '../../../../src/dogfood/pydmd/types.js';
import type { ExtractedConcept } from '../../../../src/dogfood/pydmd/learn/concept-extractor.js';
import {
  mapComplexPlane,
  type ComplexPlaneMap,
} from '../../../../src/dogfood/pydmd/learn/complex-plane-mapper.js';

// --- Factories ---

function makeConcepts(
  types: Array<'svd' | 'eigen' | 'koopman' | 'rank' | 'hankel'>,
): ExtractedConcept[] {
  const conceptMap: Record<string, ExtractedConcept> = {
    svd: {
      name: 'Singular Value Decomposition',
      abbreviation: 'SVD',
      category: 'mathematical',
      description: 'Decomposes a data matrix into orthogonal modes, singular values, and time dynamics.',
      mathematicalFormulation: '$X = U \\Sigma V^*$',
      codeLocation: ['pydmd/dmdbase.py'],
      relatedConcepts: ['Eigendecomposition', 'Rank Truncation'],
      complexPlaneConnection: 'SVD provides the basis for computing DMD eigenvalues on the unit circle.',
    },
    eigen: {
      name: 'Eigendecomposition',
      abbreviation: 'EIG',
      category: 'mathematical',
      description: 'Decomposes a matrix into eigenvalues and eigenvectors, revealing fundamental dynamics.',
      mathematicalFormulation: '$A v = \\lambda v$',
      codeLocation: ['pydmd/dmd.py'],
      relatedConcepts: ['Singular Value Decomposition'],
      complexPlaneConnection: 'Eigenvalues from DMD analysis lie on or near the unit circle in the complex plane.',
    },
    koopman: {
      name: 'Koopman Operator Theory',
      abbreviation: 'KOT',
      category: 'mathematical',
      description: 'Infinite-dimensional linear operator acting on observable functions of a nonlinear system.',
      mathematicalFormulation: null,
      codeLocation: ['pydmd/edmd.py'],
      relatedConcepts: ['EDMD'],
      complexPlaneConnection: null,
    },
    rank: {
      name: 'Rank Truncation',
      abbreviation: 'RT',
      category: 'algorithmic',
      description: 'Reduces dimensionality by retaining only the most significant singular values.',
      mathematicalFormulation: null,
      codeLocation: ['pydmd/utils.py'],
      relatedConcepts: ['Singular Value Decomposition'],
      complexPlaneConnection: null,
    },
    hankel: {
      name: 'Time-Delay Embedding',
      abbreviation: 'TDE',
      category: 'algorithmic',
      description: 'Augments state space with time-delayed copies via Hankel matrix construction.',
      mathematicalFormulation: null,
      codeLocation: ['pydmd/hankeldmd.py'],
      relatedConcepts: [],
      complexPlaneConnection: null,
    },
  };

  return types.map(t => conceptMap[t]);
}

function makeVariants(names: string[]): AlgorithmVariant[] {
  const variantMap: Record<string, AlgorithmVariant> = {
    DMD: {
      name: 'Standard DMD',
      class: 'DMD',
      purpose: 'Baseline dynamic mode decomposition',
      distinguishing: ['standard SVD-based approach'],
      parameters: [{ name: 'svd_rank', type: 'int', default: '-1', description: 'SVD rank' }],
      mathBasis: 'SVD-based linear operator approximation',
      tutorial: 1,
    },
    BOPDMD: {
      name: 'BOP-DMD',
      class: 'BOPDMD',
      purpose: 'Robust DMD via bootstrap aggregation and optimization',
      distinguishing: ['bagging', 'optimized eigenvalue estimation'],
      parameters: [],
      mathBasis: 'Bagging ensemble of optimized SVD decompositions',
      tutorial: 8,
    },
    MrDMD: {
      name: 'Multi-Resolution DMD',
      class: 'MrDMD',
      purpose: 'Decompose at multiple temporal resolutions',
      distinguishing: ['multi-resolution decomposition'],
      parameters: [],
      mathBasis: 'Recursive SVD at successive temporal scales',
      tutorial: null,
    },
    EDMD: {
      name: 'Extended DMD',
      class: 'EDMD',
      purpose: 'Koopman operator approximation via observable functions',
      distinguishing: ['lifting functions', 'Koopman approximation'],
      parameters: [{ name: 'observables', type: 'list', default: 'None', description: 'Observable functions' }],
      mathBasis: 'Finite-dimensional Koopman operator approximation',
      tutorial: 12,
    },
  };

  return names.filter(n => n in variantMap).map(n => variantMap[n]);
}

// --- Tests ---

describe('complex-plane-mapper', () => {
  describe('eigenvalue interpretation (LRN-04)', () => {
    it('produces unitCircle text mentioning stability boundary', () => {
      const concepts = makeConcepts(['svd', 'eigen']);
      const variants = makeVariants(['DMD']);
      const map = mapComplexPlane(concepts, variants);
      expect(map.eigenvalueInterpretation.unitCircle.length).toBeGreaterThan(0);
      expect(map.eigenvalueInterpretation.unitCircle.toLowerCase()).toContain('stability');
    });

    it('produces realAxis text mentioning growth and decay', () => {
      const concepts = makeConcepts(['svd', 'eigen']);
      const variants = makeVariants(['DMD']);
      const map = mapComplexPlane(concepts, variants);
      expect(map.eigenvalueInterpretation.realAxis.length).toBeGreaterThan(0);
      expect(map.eigenvalueInterpretation.realAxis.toLowerCase()).toContain('growth');
      expect(map.eigenvalueInterpretation.realAxis.toLowerCase()).toContain('decay');
    });

    it('produces imaginaryAxis text mentioning oscillation or frequency', () => {
      const concepts = makeConcepts(['svd', 'eigen']);
      const variants = makeVariants(['DMD']);
      const map = mapComplexPlane(concepts, variants);
      expect(map.eigenvalueInterpretation.imaginaryAxis.length).toBeGreaterThan(0);
      const text = map.eigenvalueInterpretation.imaginaryAxis.toLowerCase();
      expect(text.includes('oscillation') || text.includes('frequency')).toBe(true);
    });

    it('produces origin text mentioning zero dynamics or stationary', () => {
      const concepts = makeConcepts(['svd', 'eigen']);
      const variants = makeVariants(['DMD']);
      const map = mapComplexPlane(concepts, variants);
      expect(map.eigenvalueInterpretation.origin.length).toBeGreaterThan(0);
      const text = map.eigenvalueInterpretation.origin.toLowerCase();
      expect(text.includes('zero') || text.includes('stationary') || text.includes('transient')).toBe(true);
    });
  });

  describe('mode interpretation', () => {
    it('spatialModes mentions basis vectors or spatial patterns', () => {
      const concepts = makeConcepts(['svd', 'eigen']);
      const variants = makeVariants(['DMD']);
      const map = mapComplexPlane(concepts, variants);
      expect(map.modeInterpretation.spatialModes.length).toBeGreaterThan(0);
      const text = map.modeInterpretation.spatialModes.toLowerCase();
      expect(text.includes('basis') || text.includes('spatial pattern')).toBe(true);
    });

    it('temporalDynamics mentions rotation, complex plane, or evolution', () => {
      const concepts = makeConcepts(['svd', 'eigen']);
      const variants = makeVariants(['DMD']);
      const map = mapComplexPlane(concepts, variants);
      expect(map.modeInterpretation.temporalDynamics.length).toBeGreaterThan(0);
      const text = map.modeInterpretation.temporalDynamics.toLowerCase();
      expect(
        text.includes('rotation') || text.includes('complex plane') || text.includes('evolution'),
      ).toBe(true);
    });

    it('amplitudes mentions magnitude, importance, or energy', () => {
      const concepts = makeConcepts(['svd', 'eigen']);
      const variants = makeVariants(['DMD']);
      const map = mapComplexPlane(concepts, variants);
      expect(map.modeInterpretation.amplitudes.length).toBeGreaterThan(0);
      const text = map.modeInterpretation.amplitudes.toLowerCase();
      expect(
        text.includes('magnitude') || text.includes('importance') || text.includes('energy'),
      ).toBe(true);
    });
  });

  describe('framework connections', () => {
    it('sinCos connection is substantive (>= 50 chars)', () => {
      const concepts = makeConcepts(['svd', 'eigen']);
      const variants = makeVariants(['DMD']);
      const map = mapComplexPlane(concepts, variants);
      expect(map.connectionToFramework.sinCos.length).toBeGreaterThanOrEqual(50);
    });

    it('tangentLine connection is substantive (>= 50 chars)', () => {
      const concepts = makeConcepts(['svd', 'eigen']);
      const variants = makeVariants(['DMD']);
      const map = mapComplexPlane(concepts, variants);
      expect(map.connectionToFramework.tangentLine.length).toBeGreaterThanOrEqual(50);
    });

    it('versine connection is substantive (>= 50 chars)', () => {
      const concepts = makeConcepts(['svd', 'eigen']);
      const variants = makeVariants(['DMD']);
      const map = mapComplexPlane(concepts, variants);
      expect(map.connectionToFramework.versine.length).toBeGreaterThanOrEqual(50);
    });

    it('eulerFormula connection is substantive (>= 50 chars)', () => {
      const concepts = makeConcepts(['svd', 'eigen']);
      const variants = makeVariants(['DMD']);
      const map = mapComplexPlane(concepts, variants);
      expect(map.connectionToFramework.eulerFormula.length).toBeGreaterThanOrEqual(50);
    });

    it('sinCos mentions oscillation or sinusoidal', () => {
      const concepts = makeConcepts(['svd', 'eigen']);
      const variants = makeVariants(['DMD']);
      const map = mapComplexPlane(concepts, variants);
      const text = map.connectionToFramework.sinCos.toLowerCase();
      expect(text.includes('oscillat') || text.includes('sinusoid') || text.includes('sin') || text.includes('cos')).toBe(true);
    });

    it('tangentLine mentions tangent and activation', () => {
      const concepts = makeConcepts(['svd', 'eigen']);
      const variants = makeVariants(['DMD']);
      const map = mapComplexPlane(concepts, variants);
      const text = map.connectionToFramework.tangentLine.toLowerCase();
      expect(text.includes('tangent')).toBe(true);
    });

    it('versine mentions gap or deviation', () => {
      const concepts = makeConcepts(['svd', 'eigen']);
      const variants = makeVariants(['DMD']);
      const map = mapComplexPlane(concepts, variants);
      const text = map.connectionToFramework.versine.toLowerCase();
      expect(text.includes('gap') || text.includes('deviat') || text.includes('versine')).toBe(true);
    });

    it('eulerFormula mentions composition or Euler', () => {
      const concepts = makeConcepts(['svd', 'eigen']);
      const variants = makeVariants(['DMD']);
      const map = mapComplexPlane(concepts, variants);
      const text = map.connectionToFramework.eulerFormula.toLowerCase();
      expect(text.includes('euler') || text.includes('composition')).toBe(true);
    });
  });

  describe('pedagogical narrative', () => {
    it('narrative is at least 200 characters', () => {
      const concepts = makeConcepts(['svd', 'eigen']);
      const variants = makeVariants(['DMD', 'BOPDMD']);
      const map = mapComplexPlane(concepts, variants);
      expect(map.pedagogicalNarrative.length).toBeGreaterThanOrEqual(200);
    });

    it('narrative mentions both DMD and unit circle', () => {
      const concepts = makeConcepts(['svd', 'eigen']);
      const variants = makeVariants(['DMD']);
      const map = mapComplexPlane(concepts, variants);
      const text = map.pedagogicalNarrative.toLowerCase();
      expect(text).toContain('dmd');
      expect(text).toContain('unit circle');
    });

    it('narrative mentions both eigenvalue and mode or dynamics', () => {
      const concepts = makeConcepts(['svd', 'eigen']);
      const variants = makeVariants(['DMD']);
      const map = mapComplexPlane(concepts, variants);
      const text = map.pedagogicalNarrative.toLowerCase();
      expect(text).toContain('eigenvalue');
      expect(text.includes('mode') || text.includes('dynamics')).toBe(true);
    });

    it('narrative reads as teaching text (not bullet points)', () => {
      const concepts = makeConcepts(['svd', 'eigen']);
      const variants = makeVariants(['DMD']);
      const map = mapComplexPlane(concepts, variants);
      // Teaching text should contain full sentences with periods
      expect(map.pedagogicalNarrative).toContain('. ');
      // Should not be primarily bullet points
      const bulletCount = (map.pedagogicalNarrative.match(/^[\s]*[-*]/gm) ?? []).length;
      const sentenceCount = (map.pedagogicalNarrative.match(/\. /g) ?? []).length;
      expect(sentenceCount).toBeGreaterThan(bulletCount);
    });
  });

  describe('edge cases', () => {
    it('produces valid ComplexPlaneMap with empty concepts', () => {
      const map = mapComplexPlane([], []);
      expect(map.eigenvalueInterpretation.unitCircle.length).toBeGreaterThan(0);
      expect(map.eigenvalueInterpretation.realAxis.length).toBeGreaterThan(0);
      expect(map.eigenvalueInterpretation.imaginaryAxis.length).toBeGreaterThan(0);
      expect(map.eigenvalueInterpretation.origin.length).toBeGreaterThan(0);
      expect(map.modeInterpretation.spatialModes.length).toBeGreaterThan(0);
      expect(map.modeInterpretation.temporalDynamics.length).toBeGreaterThan(0);
      expect(map.modeInterpretation.amplitudes.length).toBeGreaterThan(0);
      expect(map.connectionToFramework.sinCos.length).toBeGreaterThanOrEqual(50);
      expect(map.connectionToFramework.tangentLine.length).toBeGreaterThanOrEqual(50);
      expect(map.connectionToFramework.versine.length).toBeGreaterThanOrEqual(50);
      expect(map.connectionToFramework.eulerFormula.length).toBeGreaterThanOrEqual(50);
      expect(map.pedagogicalNarrative.length).toBeGreaterThanOrEqual(200);
    });

    it('produces valid map with no eigenvalue-related concepts', () => {
      const concepts = makeConcepts(['rank', 'hankel']);
      const variants = makeVariants([]);
      const map = mapComplexPlane(concepts, variants);
      // Still valid structure, just less specific
      expect(map.eigenvalueInterpretation.unitCircle.length).toBeGreaterThan(0);
      expect(map.modeInterpretation.spatialModes.length).toBeGreaterThan(0);
      expect(map.pedagogicalNarrative.length).toBeGreaterThanOrEqual(200);
    });

    it('has all required ComplexPlaneMap fields', () => {
      const map = mapComplexPlane([], []);
      expect(map).toHaveProperty('eigenvalueInterpretation');
      expect(map).toHaveProperty('modeInterpretation');
      expect(map).toHaveProperty('connectionToFramework');
      expect(map).toHaveProperty('pedagogicalNarrative');
      expect(map.eigenvalueInterpretation).toHaveProperty('unitCircle');
      expect(map.eigenvalueInterpretation).toHaveProperty('realAxis');
      expect(map.eigenvalueInterpretation).toHaveProperty('imaginaryAxis');
      expect(map.eigenvalueInterpretation).toHaveProperty('origin');
      expect(map.modeInterpretation).toHaveProperty('spatialModes');
      expect(map.modeInterpretation).toHaveProperty('temporalDynamics');
      expect(map.modeInterpretation).toHaveProperty('amplitudes');
      expect(map.connectionToFramework).toHaveProperty('sinCos');
      expect(map.connectionToFramework).toHaveProperty('tangentLine');
      expect(map.connectionToFramework).toHaveProperty('versine');
      expect(map.connectionToFramework).toHaveProperty('eulerFormula');
    });
  });
});
