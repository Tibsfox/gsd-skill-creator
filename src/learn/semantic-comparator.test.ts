import { describe, it, expect } from 'vitest';
import type { MathematicalPrimitive } from '../core/types/mfe-types.js';
import type { PrefilterMatch } from './dedup-prefilter.js';
import { compareSemantically } from './semantic-comparator.js';

function makePrimitive(overrides: Partial<MathematicalPrimitive> = {}): MathematicalPrimitive {
  return {
    id: 'test-prim',
    name: 'Test Primitive',
    type: 'definition',
    domain: 'perception',
    chapter: 1,
    section: '1.1',
    planePosition: { real: 0, imaginary: 0 },
    formalStatement: 'Test formal statement',
    computationalForm: 'test(x) = x',
    prerequisites: [],
    dependencies: [],
    enables: [],
    compositionRules: [],
    applicabilityPatterns: [],
    keywords: ['test'],
    tags: [],
    buildLabs: [],
    ...overrides,
  };
}

function makeMatch(existingId: string, distance = 0.05, sharedKeywords: string[] = ['kw1', 'kw2']): PrefilterMatch {
  return { existingId, distance, sharedKeywords };
}

describe('semantic comparator: exact duplicate detection', () => {
  it('detects exact duplicate when formalStatement and computationalForm match', () => {
    const existing = makePrimitive({
      id: 'existing-1',
      formalStatement: 'a^2 + b^2 = c^2',
      computationalForm: 'c = sqrt(a^2 + b^2)',
      keywords: ['pythagorean', 'triangle'],
    });
    const candidate = makePrimitive({
      id: 'candidate-1',
      formalStatement: 'a^2 + b^2 = c^2',
      computationalForm: 'c = sqrt(a^2 + b^2)',
      keywords: ['pythagorean', 'triangle'],
    });
    const matches = [makeMatch('existing-1')];

    const result = compareSemantically(candidate, [existing], matches);

    expect(result.comparisons.length).toBe(1);
    expect(result.comparisons[0].classification).toBe('exact-duplicate');
  });

  it('detects exact duplicate with whitespace/case normalization', () => {
    const existing = makePrimitive({
      id: 'existing-1',
      formalStatement: 'A^2 + B^2 = C^2',
      computationalForm: 'C = sqrt(A^2 + B^2)',
      keywords: ['pythagorean', 'triangle'],
    });
    const candidate = makePrimitive({
      id: 'candidate-1',
      formalStatement: 'a^2 + b^2 = c^2',
      computationalForm: 'c  =  sqrt(a^2  +  b^2)',
      keywords: ['pythagorean', 'triangle'],
    });
    const matches = [makeMatch('existing-1')];

    const result = compareSemantically(candidate, [existing], matches);

    expect(result.comparisons[0].classification).toBe('exact-duplicate');
  });

  it('detects exact duplicate when applicability patterns fully overlap', () => {
    const existing = makePrimitive({
      id: 'existing-1',
      formalStatement: 'sum of angles in triangle = 180',
      computationalForm: 'alpha + beta + gamma = 180',
      applicabilityPatterns: ['triangle angle sum', 'interior angles'],
      keywords: ['triangle', 'angle'],
    });
    const candidate = makePrimitive({
      id: 'candidate-1',
      formalStatement: 'sum of angles in triangle = 180',
      computationalForm: 'alpha + beta + gamma = 180',
      applicabilityPatterns: ['triangle angle sum', 'interior angles'],
      keywords: ['triangle', 'angle'],
    });
    const matches = [makeMatch('existing-1')];

    const result = compareSemantically(candidate, [existing], matches);

    expect(result.comparisons[0].classification).toBe('exact-duplicate');
  });
});

describe('semantic comparator: generalization detection', () => {
  it('detects generalization when candidate prerequisites are a subset of existing', () => {
    const existing = makePrimitive({
      id: 'existing-1',
      formalStatement: 'For right triangles: a^2 + b^2 = c^2',
      computationalForm: 'c = sqrt(a^2 + b^2)',
      prerequisites: ['real numbers', 'right triangle'],
      keywords: ['pythagorean', 'right', 'triangle', 'hypotenuse'],
      applicabilityPatterns: ['right triangle side lengths'],
    });
    const candidate = makePrimitive({
      id: 'candidate-1',
      formalStatement: 'For any triangle: law of cosines generalizes relationship',
      computationalForm: 'c^2 = a^2 + b^2 - 2ab*cos(C)',
      prerequisites: ['numbers'],
      keywords: ['pythagorean', 'right', 'triangle', 'hypotenuse', 'cosine', 'law'],
      applicabilityPatterns: ['right triangle side lengths', 'general triangle side lengths'],
    });
    const matches = [makeMatch('existing-1')];

    const result = compareSemantically(candidate, [existing], matches);

    expect(result.comparisons[0].classification).toBe('generalization');
  });

  it('detects generalization when candidate domain is broader', () => {
    const existing = makePrimitive({
      id: 'existing-1',
      formalStatement: 'Integration of polynomial functions',
      computationalForm: 'int(x^n) = x^(n+1)/(n+1)',
      prerequisites: ['polynomials'],
      keywords: ['integral', 'polynomial'],
      applicabilityPatterns: ['polynomial integration'],
    });
    const candidate = makePrimitive({
      id: 'candidate-1',
      formalStatement: 'Integration of general continuous functions',
      computationalForm: 'int(f(x)) = F(x) + C',
      prerequisites: ['continuity'],
      keywords: ['integral', 'polynomial', 'continuous', 'antiderivative'],
      applicabilityPatterns: ['polynomial integration', 'continuous function integration', 'area under curve'],
    });
    const matches = [makeMatch('existing-1')];

    const result = compareSemantically(candidate, [existing], matches);

    expect(result.comparisons[0].classification).toBe('generalization');
  });
});

describe('semantic comparator: specialization detection', () => {
  it('detects specialization when candidate has more prerequisites', () => {
    const existing = makePrimitive({
      id: 'existing-1',
      formalStatement: 'General inner product on vector space',
      computationalForm: '<u,v> satisfies linearity, symmetry, positive definite',
      prerequisites: ['vector space'],
      keywords: ['inner', 'product', 'vector', 'space', 'linear'],
      applicabilityPatterns: ['inner product computation', 'orthogonality check', 'norm derivation'],
    });
    const candidate = makePrimitive({
      id: 'candidate-1',
      formalStatement: 'Dot product on R^n: sum of component products',
      computationalForm: 'u . v = sum(u_i * v_i)',
      prerequisites: ['vector space', 'real numbers', 'finite dimension'],
      keywords: ['inner', 'product', 'vector'],
      applicabilityPatterns: ['inner product computation'],
    });
    const matches = [makeMatch('existing-1')];

    const result = compareSemantically(candidate, [existing], matches);

    expect(result.comparisons[0].classification).toBe('specialization');
  });

  it('detects specialization when candidate applicability is a strict subset', () => {
    const existing = makePrimitive({
      id: 'existing-1',
      formalStatement: 'Convergence of series with various tests',
      computationalForm: 'sum(a_n) converges iff passes test',
      prerequisites: ['sequences'],
      keywords: ['convergence', 'series', 'test', 'sum'],
      applicabilityPatterns: ['ratio test', 'root test', 'comparison test', 'integral test'],
    });
    const candidate = makePrimitive({
      id: 'candidate-1',
      formalStatement: 'Ratio test for convergence: lim|a_{n+1}/a_n| < 1',
      computationalForm: 'L = lim(|a_{n+1}/a_n|); converges if L < 1',
      prerequisites: ['sequences', 'limits'],
      keywords: ['convergence', 'series', 'test'],
      applicabilityPatterns: ['ratio test'],
    });
    const matches = [makeMatch('existing-1')];

    const result = compareSemantically(candidate, [existing], matches);

    expect(result.comparisons[0].classification).toBe('specialization');
  });
});

describe('semantic comparator: overlapping-distinct detection', () => {
  it('detects overlapping-distinct when partial keyword and statement overlap', () => {
    const existing = makePrimitive({
      id: 'existing-1',
      formalStatement: 'Integration computes area under curve of function',
      computationalForm: 'int_a^b f(x) dx = F(b) - F(a)',
      prerequisites: ['continuity', 'antiderivative'],
      keywords: ['integral', 'calculus', 'area'],
      applicabilityPatterns: ['area under curve', 'accumulation'],
    });
    const candidate = makePrimitive({
      id: 'candidate-1',
      formalStatement: 'Differentiation computes rate of change of function',
      computationalForm: "f'(x) = lim(h->0) (f(x+h) - f(x))/h",
      prerequisites: ['limits', 'continuity'],
      keywords: ['calculus', 'derivative', 'rate'],
      applicabilityPatterns: ['rate of change', 'slope of tangent'],
    });
    const matches = [makeMatch('existing-1')];

    const result = compareSemantically(candidate, [existing], matches);

    expect(result.comparisons[0].classification).toBe('overlapping-distinct');
  });
});

describe('semantic comparator: genuinely-new detection', () => {
  it('classifies as genuinely-new when no semantic overlap', () => {
    const existing = makePrimitive({
      id: 'existing-1',
      formalStatement: 'Linear transformation preserves vector addition and scalar multiplication',
      computationalForm: 'T(au + bv) = aT(u) + bT(v)',
      prerequisites: ['vector space'],
      keywords: ['vector', 'matrix', 'linear'],
      applicabilityPatterns: ['matrix multiplication'],
    });
    const candidate = makePrimitive({
      id: 'candidate-1',
      formalStatement: 'A topological space is compact if every open cover has finite subcover',
      computationalForm: 'forall {U_i}, exists finite subcover',
      prerequisites: ['topology', 'set theory'],
      keywords: ['open set', 'compact', 'homeomorphism'],
      applicabilityPatterns: ['compactness check'],
    });
    const matches = [makeMatch('existing-1')];

    const result = compareSemantically(candidate, [existing], matches);

    expect(result.comparisons[0].classification).toBe('genuinely-new');
  });
});

describe('semantic comparator: comparison detail', () => {
  it('returns comparison details with scores and rationale', () => {
    const existing = makePrimitive({
      id: 'existing-1',
      formalStatement: 'a^2 + b^2 = c^2',
      computationalForm: 'c = sqrt(a^2 + b^2)',
      keywords: ['pythagorean', 'triangle'],
    });
    const candidate = makePrimitive({
      id: 'candidate-1',
      formalStatement: 'a^2 + b^2 = c^2',
      computationalForm: 'c = sqrt(a^2 + b^2)',
      keywords: ['pythagorean', 'triangle'],
    });
    const matches = [makeMatch('existing-1')];

    const result = compareSemantically(candidate, [existing], matches);
    const detail = result.comparisons[0];

    expect(detail.classification).toBeDefined();
    expect(typeof detail.confidence).toBe('number');
    expect(detail.confidence).toBeGreaterThanOrEqual(0);
    expect(detail.confidence).toBeLessThanOrEqual(1);
    expect(typeof detail.formalStatementSimilarity).toBe('number');
    expect(detail.formalStatementSimilarity).toBeGreaterThanOrEqual(0);
    expect(detail.formalStatementSimilarity).toBeLessThanOrEqual(1);
    expect(typeof detail.computationalFormSimilarity).toBe('number');
    expect(detail.computationalFormSimilarity).toBeGreaterThanOrEqual(0);
    expect(detail.computationalFormSimilarity).toBeLessThanOrEqual(1);
    expect(typeof detail.keywordOverlap).toBe('number');
    expect(detail.keywordOverlap).toBeGreaterThanOrEqual(0);
    expect(detail.keywordOverlap).toBeLessThanOrEqual(1);
    expect(typeof detail.rationale).toBe('string');
    expect(detail.rationale.length).toBeGreaterThan(0);
  });

  it('compareSemantically handles batch of pre-filter matches', () => {
    const existingA = makePrimitive({
      id: 'existing-a',
      formalStatement: 'statement A about vectors',
      computationalForm: 'form A',
      keywords: ['vector', 'space'],
    });
    const existingB = makePrimitive({
      id: 'existing-b',
      formalStatement: 'statement B about matrices',
      computationalForm: 'form B',
      keywords: ['matrix', 'transform'],
    });
    const existingC = makePrimitive({
      id: 'existing-c',
      formalStatement: 'statement C about topology',
      computationalForm: 'form C',
      keywords: ['topology', 'open'],
    });
    const candidate = makePrimitive({
      id: 'candidate-1',
      formalStatement: 'candidate statement',
      computationalForm: 'candidate form',
      keywords: ['vector', 'topology'],
    });
    const matches = [
      makeMatch('existing-a'),
      makeMatch('existing-b'),
      makeMatch('existing-c'),
    ];

    const result = compareSemantically(candidate, [existingA, existingB, existingC], matches);

    expect(result.comparisons.length).toBe(3);
    expect(result.comparisons[0].existingId).toBe('existing-a');
    expect(result.comparisons[1].existingId).toBe('existing-b');
    expect(result.comparisons[2].existingId).toBe('existing-c');
  });

  it('returns confidence proportional to evidence strength', () => {
    // Exact duplicate -> high confidence
    const exactExisting = makePrimitive({
      id: 'exact-existing',
      formalStatement: 'a^2 + b^2 = c^2',
      computationalForm: 'c = sqrt(a^2 + b^2)',
      keywords: ['pythagorean', 'triangle'],
    });
    const exactCandidate = makePrimitive({
      id: 'exact-candidate',
      formalStatement: 'a^2 + b^2 = c^2',
      computationalForm: 'c = sqrt(a^2 + b^2)',
      keywords: ['pythagorean', 'triangle'],
    });
    const exactResult = compareSemantically(exactCandidate, [exactExisting], [makeMatch('exact-existing')]);
    expect(exactResult.comparisons[0].confidence).toBeGreaterThanOrEqual(0.9);

    // Generalization -> medium-high confidence
    const genExisting = makePrimitive({
      id: 'gen-existing',
      formalStatement: 'For right triangles: a^2 + b^2 = c^2',
      computationalForm: 'c = sqrt(a^2 + b^2)',
      prerequisites: ['real numbers', 'right triangle'],
      keywords: ['pythagorean', 'right', 'triangle', 'hypotenuse'],
      applicabilityPatterns: ['right triangle side lengths'],
    });
    const genCandidate = makePrimitive({
      id: 'gen-candidate',
      formalStatement: 'For any triangle: law of cosines generalizes relationship',
      computationalForm: 'c^2 = a^2 + b^2 - 2ab*cos(C)',
      prerequisites: ['numbers'],
      keywords: ['pythagorean', 'right', 'triangle', 'hypotenuse', 'cosine', 'law'],
      applicabilityPatterns: ['right triangle side lengths', 'general triangle side lengths'],
    });
    const genResult = compareSemantically(genCandidate, [genExisting], [makeMatch('gen-existing')]);
    expect(genResult.comparisons[0].confidence).toBeGreaterThanOrEqual(0.6);

    // Overlapping-distinct -> medium confidence
    const overlapExisting = makePrimitive({
      id: 'overlap-existing',
      formalStatement: 'Integration computes area under curve of function',
      computationalForm: 'int_a^b f(x) dx = F(b) - F(a)',
      keywords: ['integral', 'calculus', 'area'],
      applicabilityPatterns: ['area under curve'],
    });
    const overlapCandidate = makePrimitive({
      id: 'overlap-candidate',
      formalStatement: 'Differentiation computes rate of change of function',
      computationalForm: "f'(x) = lim(h->0) (f(x+h) - f(x))/h",
      keywords: ['calculus', 'derivative', 'rate'],
      applicabilityPatterns: ['rate of change'],
    });
    const overlapResult = compareSemantically(overlapCandidate, [overlapExisting], [makeMatch('overlap-existing')]);
    const overlapConf = overlapResult.comparisons[0].confidence;
    expect(overlapConf).toBeGreaterThanOrEqual(0.3);
    expect(overlapConf).toBeLessThanOrEqual(0.7);

    // Genuinely-new -> low confidence
    const newExisting = makePrimitive({
      id: 'new-existing',
      formalStatement: 'Linear transformation preserves vector addition',
      computationalForm: 'T(au + bv) = aT(u) + bT(v)',
      keywords: ['vector', 'matrix', 'linear'],
    });
    const newCandidate = makePrimitive({
      id: 'new-candidate',
      formalStatement: 'Compact topological space has finite subcover property',
      computationalForm: 'forall open cover exists finite subcover',
      keywords: ['open set', 'compact', 'homeomorphism'],
    });
    const newResult = compareSemantically(newCandidate, [newExisting], [makeMatch('new-existing')]);
    expect(newResult.comparisons[0].confidence).toBeLessThanOrEqual(0.3);
  });
});
