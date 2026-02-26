// === Dependency Wirer Tests ===
//
// TDD RED: Tests for local dependency graph wiring between extracted primitives.
// Covers section ordering, cross-references, prerequisite language, applies
// relationships, enables reverse-index, and edge cases.

import { describe, it, expect } from 'vitest';
import { wireDependencies, type WiringResult } from './dependency-wirer.js';
import type { CandidatePrimitive } from './extractor.js';
import type { DomainId, PrimitiveType, DependencyEdge, CompositionRule } from '../types/mfe-types.js';

// --- Test helper: factory for valid CandidatePrimitive ---

let idCounter = 0;

function makeCandidate(overrides: Partial<CandidatePrimitive> = {}): CandidatePrimitive {
  idCounter++;
  return {
    id: `test-candidate-${idCounter}`,
    name: `Candidate ${idCounter}`,
    type: 'definition' as PrimitiveType,
    domain: 'foundations' as DomainId,
    chapter: 1,
    section: `1.${idCounter}`,
    planePosition: { real: 0, imaginary: 0 },
    formalStatement: `Statement for candidate ${idCounter}`,
    computationalForm: `Defines: candidate ${idCounter}`,
    prerequisites: [],
    dependencies: [] as DependencyEdge[],
    enables: [],
    compositionRules: [] as CompositionRule[],
    applicabilityPatterns: [],
    keywords: [],
    tags: ['textbook'],
    buildLabs: [],
    sourceSection: 'Test Section',
    sourceOffset: idCounter * 100,
    extractionConfidence: 0.9,
    ...overrides,
  };
}

// Reset counter before each describe to keep IDs predictable
function resetCounter(): void {
  idCounter = 0;
}

// === 1. Section ordering tests ===

describe('Section ordering', () => {
  it('adds requires edges from sequential section order', () => {
    resetCounter();
    const a = makeCandidate({ id: 'test-alpha', name: 'Alpha', type: 'axiom', sourceOffset: 0 });
    const b = makeCandidate({ id: 'test-beta', name: 'Beta', type: 'definition', sourceOffset: 100 });
    const c = makeCandidate({ id: 'test-gamma', name: 'Gamma', type: 'theorem', sourceOffset: 200 });

    const result = wireDependencies([a, b, c]);

    // B should have a motivates edge to A, C should have a motivates edge to B
    const bDeps = result.wiredPrimitives.find(p => p.id === 'test-beta')!.dependencies;
    const cDeps = result.wiredPrimitives.find(p => p.id === 'test-gamma')!.dependencies;

    expect(bDeps.some(d => d.target === 'test-alpha' && d.type === 'motivates')).toBe(true);
    expect(cDeps.some(d => d.target === 'test-beta' && d.type === 'motivates')).toBe(true);
  });

  it('does not add dependencies to first axiom primitive', () => {
    resetCounter();
    const a = makeCandidate({ id: 'test-first-axiom', name: 'First Axiom', type: 'axiom', sourceOffset: 0 });
    const b = makeCandidate({ id: 'test-second', name: 'Second', type: 'definition', sourceOffset: 100 });

    const result = wireDependencies([a, b]);
    const firstDeps = result.wiredPrimitives.find(p => p.id === 'test-first-axiom')!.dependencies;
    expect(firstDeps).toHaveLength(0);
  });

  it('adds motivates edge for non-axiom without explicit cross-references', () => {
    resetCounter();
    const a = makeCandidate({ id: 'test-prev', name: 'Previous', type: 'definition', sourceOffset: 0 });
    const b = makeCandidate({ id: 'test-next', name: 'Next Topic', type: 'definition', sourceOffset: 100 });

    const result = wireDependencies([a, b]);
    const bDeps = result.wiredPrimitives.find(p => p.id === 'test-next')!.dependencies;
    expect(bDeps.some(d => d.type === 'motivates')).toBe(true);
  });
});

// === 2. Cross-reference detection tests ===

describe('Cross-reference detection', () => {
  it('adds requires edge when formalStatement references another primitive by name', () => {
    resetCounter();
    const vecSpace = makeCandidate({ id: 'test-vector-space', name: 'Vector Space', type: 'definition', sourceOffset: 0 });
    const basis = makeCandidate({
      id: 'test-basis',
      name: 'Basis',
      type: 'definition',
      formalStatement: 'A basis of a Vector Space is a linearly independent spanning set.',
      sourceOffset: 100,
    });

    const result = wireDependencies([vecSpace, basis]);
    const basisDeps = result.wiredPrimitives.find(p => p.id === 'test-basis')!.dependencies;
    expect(basisDeps.some(d => d.target === 'test-vector-space' && d.type === 'requires')).toBe(true);
  });

  it('detects generalizes relationship from keyword', () => {
    resetCounter();
    const group = makeCandidate({ id: 'test-group', name: 'Group', type: 'definition', sourceOffset: 0 });
    const ring = makeCandidate({
      id: 'test-ring',
      name: 'Ring',
      type: 'definition',
      formalStatement: 'A ring generalizes Group by adding a second operation.',
      sourceOffset: 100,
    });

    const result = wireDependencies([group, ring]);
    const ringDeps = result.wiredPrimitives.find(p => p.id === 'test-ring')!.dependencies;
    expect(ringDeps.some(d => d.target === 'test-group' && d.type === 'generalizes')).toBe(true);
  });

  it('detects specializes relationship from keyword', () => {
    resetCounter();
    const topology = makeCandidate({ id: 'test-topology', name: 'Topology', type: 'definition', sourceOffset: 0 });
    const metric = makeCandidate({
      id: 'test-metric',
      name: 'Metric Space',
      type: 'definition',
      formalStatement: 'A metric space is a special case of Topology with a distance function.',
      sourceOffset: 100,
    });

    const result = wireDependencies([topology, metric]);
    const metricDeps = result.wiredPrimitives.find(p => p.id === 'test-metric')!.dependencies;
    expect(metricDeps.some(d => d.target === 'test-topology' && d.type === 'specializes')).toBe(true);
  });
});

// === 3. Prerequisite language detection tests ===

describe('Prerequisite language detection', () => {
  it('adds prerequisite from "requires understanding of" language', () => {
    resetCounter();
    const limits = makeCandidate({ id: 'test-limits', name: 'Limits', type: 'definition', sourceOffset: 0 });
    const deriv = makeCandidate({
      id: 'test-derivative',
      name: 'Derivative',
      type: 'definition',
      formalStatement: 'The derivative requires understanding of Limits to be well-defined.',
      sourceOffset: 100,
    });

    const result = wireDependencies([limits, deriv]);
    const derivPrim = result.wiredPrimitives.find(p => p.id === 'test-derivative')!;
    expect(derivPrim.prerequisites.some(p => p.toLowerCase().includes('limits'))).toBe(true);
  });

  it('adds requires edge from "builds on" language', () => {
    resetCounter();
    const addition = makeCandidate({ id: 'test-addition', name: 'Addition', type: 'axiom', sourceOffset: 0 });
    const mult = makeCandidate({
      id: 'test-multiplication',
      name: 'Multiplication',
      type: 'definition',
      formalStatement: 'Multiplication builds on Addition as repeated summation.',
      sourceOffset: 100,
    });

    const result = wireDependencies([addition, mult]);
    const multDeps = result.wiredPrimitives.find(p => p.id === 'test-multiplication')!.dependencies;
    expect(multDeps.some(d => d.target === 'test-addition' && d.type === 'requires')).toBe(true);
  });
});

// === 4. Applies relationship tests ===

describe('Applies relationship', () => {
  it('adds applies edge from algorithm to referenced definition', () => {
    resetCounter();
    const matrix = makeCandidate({ id: 'test-matrix', name: 'Matrix', type: 'definition', sourceOffset: 0 });
    const gauss = makeCandidate({
      id: 'test-gaussian-elimination',
      name: 'Gaussian Elimination',
      type: 'algorithm',
      formalStatement: 'Gaussian elimination reduces a Matrix to row echelon form.',
      sourceOffset: 100,
    });

    const result = wireDependencies([matrix, gauss]);
    const gaussDeps = result.wiredPrimitives.find(p => p.id === 'test-gaussian-elimination')!.dependencies;
    expect(gaussDeps.some(d => d.target === 'test-matrix' && d.type === 'applies')).toBe(true);
  });

  it('applies edges have strength 0.6', () => {
    resetCounter();
    const thm = makeCandidate({ id: 'test-ftc', name: 'Fundamental Theorem', type: 'theorem', sourceOffset: 0 });
    const tech = makeCandidate({
      id: 'test-integration-technique',
      name: 'Integration Technique',
      type: 'technique',
      formalStatement: 'This technique applies the Fundamental Theorem to compute definite integrals.',
      sourceOffset: 100,
    });

    const result = wireDependencies([thm, tech]);
    const techDeps = result.wiredPrimitives.find(p => p.id === 'test-integration-technique')!.dependencies;
    const appliesEdge = techDeps.find(d => d.type === 'applies');
    expect(appliesEdge).toBeDefined();
    expect(appliesEdge!.strength).toBe(0.6);
  });
});

// === 5. Enables array population tests ===

describe('Enables reverse-index', () => {
  it('populates enables array as reverse of dependencies', () => {
    resetCounter();
    const a = makeCandidate({ id: 'test-base', name: 'Base Concept', type: 'definition', sourceOffset: 0 });
    const b = makeCandidate({
      id: 'test-derived',
      name: 'Derived',
      type: 'theorem',
      formalStatement: 'This theorem requires Base Concept as its foundation.',
      sourceOffset: 100,
    });

    const result = wireDependencies([a, b]);
    const basePrim = result.wiredPrimitives.find(p => p.id === 'test-base')!;
    expect(basePrim.enables).toContain('test-derived');
  });

  it('enables is the correct reverse index of all dependency edges', () => {
    resetCounter();
    const x = makeCandidate({ id: 'test-x', name: 'Concept X', type: 'axiom', sourceOffset: 0 });
    const y = makeCandidate({
      id: 'test-y',
      name: 'Concept Y',
      type: 'definition',
      formalStatement: 'Y builds on Concept X fundamentally.',
      sourceOffset: 100,
    });
    const z = makeCandidate({
      id: 'test-z',
      name: 'Concept Z',
      type: 'theorem',
      formalStatement: 'Z requires Concept X and references Concept Y.',
      sourceOffset: 200,
    });

    const result = wireDependencies([x, y, z]);
    const xPrim = result.wiredPrimitives.find(p => p.id === 'test-x')!;
    const yPrim = result.wiredPrimitives.find(p => p.id === 'test-y')!;

    // X enables Y and Z
    expect(xPrim.enables).toContain('test-y');
    expect(xPrim.enables).toContain('test-z');
    // Y enables Z
    expect(yPrim.enables).toContain('test-z');
  });
});

// === 6. Edge case tests ===

describe('Edge cases', () => {
  it('returns empty result for empty candidate array', () => {
    const result = wireDependencies([]);
    expect(result.wiredPrimitives).toHaveLength(0);
    expect(result.edgesAdded).toBe(0);
    expect(result.enablesAdded).toBe(0);
    expect(result.prerequisitesAdded).toBe(0);
  });

  it('returns single candidate unchanged (no relationships possible)', () => {
    resetCounter();
    const solo = makeCandidate({ id: 'test-solo', name: 'Solo', type: 'axiom', sourceOffset: 0 });

    const result = wireDependencies([solo]);
    expect(result.wiredPrimitives).toHaveLength(1);
    expect(result.wiredPrimitives[0].dependencies).toHaveLength(0);
    expect(result.wiredPrimitives[0].enables).toHaveLength(0);
  });
});
