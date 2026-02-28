import { describe, it, expect } from 'vitest';
import type { MathematicalPrimitive } from '../core/types/mfe-types.js';
import type { ComparisonDetail, SemanticClassification } from './semantic-comparator.js';
import { createMergeEngine } from './merge-engine.js';

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

function makeComparison(
  existingId: string,
  classification: SemanticClassification,
  confidence = 0.8,
): ComparisonDetail {
  return {
    existingId,
    classification,
    confidence,
    formalStatementSimilarity: 0.5,
    computationalFormSimilarity: 0.5,
    keywordOverlap: 0.5,
    rationale: `Test comparison: ${classification}`,
  };
}

describe('merge engine: exact duplicate handling', () => {
  it('skips exact duplicates without modifying registry', () => {
    const engine = createMergeEngine('session-1');
    const candidate = makePrimitive({ id: 'candidate-1' });
    const existing = makePrimitive({ id: 'existing-1' });
    const comparison = makeComparison('existing-1', 'exact-duplicate', 0.95);

    const result = engine.merge(candidate, comparison, existing);

    expect(result.action).toBe('skip');
    expect(result.modifications.length).toBe(0);
  });

  it('records skip in provenance chain', () => {
    const engine = createMergeEngine('session-1');
    const candidate = makePrimitive({ id: 'candidate-1' });
    const existing = makePrimitive({ id: 'existing-1' });
    const comparison = makeComparison('existing-1', 'exact-duplicate', 0.95);

    const result = engine.merge(candidate, comparison, existing);

    expect(result.provenance.sessionId).toBe('session-1');
    expect(typeof result.provenance.timestamp).toBe('string');
    expect(result.provenance.action).toBe('skip');
    expect(result.provenance.candidateId).toBe('candidate-1');
    expect(result.provenance.existingId).toBe('existing-1');
    expect(typeof result.provenance.rationale).toBe('string');
  });
});

describe('merge engine: generalization handling', () => {
  it('updates existing primitive when candidate is generalization', () => {
    const engine = createMergeEngine('session-1');
    const candidate = makePrimitive({
      id: 'candidate-gen',
      formalStatement: 'Broader statement',
      computationalForm: 'general(x) = x^n',
      keywords: ['general', 'broad', 'theory'],
      applicabilityPatterns: ['pattern-a', 'pattern-b', 'pattern-c'],
    });
    const existing = makePrimitive({
      id: 'existing-gen',
      formalStatement: 'Specific statement',
      computationalForm: 'specific(x) = x^2',
      keywords: ['specific', 'narrow'],
      applicabilityPatterns: ['pattern-a'],
    });
    const comparison = makeComparison('existing-gen', 'generalization');

    const result = engine.merge(candidate, comparison, existing);

    expect(result.action).toBe('update');
    expect(result.modifications.length).toBe(1);
  });

  it('update preserves existing primitive ID', () => {
    const engine = createMergeEngine('session-1');
    const candidate = makePrimitive({
      id: 'candidate-gen',
      formalStatement: 'Broader statement',
      computationalForm: 'general(x) = x^n',
      keywords: ['general', 'theory'],
      applicabilityPatterns: ['pattern-a', 'pattern-b'],
    });
    const existing = makePrimitive({
      id: 'existing-gen',
      formalStatement: 'Specific statement',
      computationalForm: 'specific(x) = x^2',
      keywords: ['specific'],
      applicabilityPatterns: ['pattern-a'],
    });
    const comparison = makeComparison('existing-gen', 'generalization');

    const result = engine.merge(candidate, comparison, existing);

    expect(result.modifications[0].primitiveId).toBe('existing-gen');
  });

  it('update records provenance showing what was generalized', () => {
    const engine = createMergeEngine('session-1');
    const candidate = makePrimitive({
      id: 'candidate-gen',
      formalStatement: 'Broader statement',
      computationalForm: 'general(x) = x^n',
    });
    const existing = makePrimitive({
      id: 'existing-gen',
      formalStatement: 'Specific statement',
      computationalForm: 'specific(x) = x^2',
    });
    const comparison = makeComparison('existing-gen', 'generalization');

    const result = engine.merge(candidate, comparison, existing);

    expect(result.provenance.action).toBe('update-generalization');
    expect(result.provenance.originalFormalStatement).toBe('Specific statement');
    expect(result.provenance.newFormalStatement).toBe('Broader statement');
  });
});

describe('merge engine: specialization handling', () => {
  it('adds specialization as new primitive with dependency on existing', () => {
    const engine = createMergeEngine('session-1');
    const candidate = makePrimitive({
      id: 'candidate-spec',
      formalStatement: 'Narrow case',
      dependencies: [],
    });
    const existing = makePrimitive({
      id: 'existing-spec',
      formalStatement: 'General case',
    });
    const comparison = makeComparison('existing-spec', 'specialization');

    const result = engine.merge(candidate, comparison, existing);

    expect(result.action).toBe('add');
    expect(result.modifications.length).toBe(1);
    expect(result.modifications[0].primitive.id).toBe('candidate-spec');

    const deps = result.modifications[0].primitive.dependencies;
    const specEdge = deps.find(d => d.target === 'existing-spec' && d.type === 'specializes');
    expect(specEdge).toBeDefined();
    expect(specEdge!.strength).toBe(1.0);
  });
});

describe('merge engine: genuinely-new handling', () => {
  it('adds genuinely-new primitive directly', () => {
    const engine = createMergeEngine('session-1');
    const candidate = makePrimitive({ id: 'candidate-new' });

    const result = engine.merge(candidate, null, null);

    expect(result.action).toBe('add');
    expect(result.modifications.length).toBe(1);
    expect(result.modifications[0].primitive.id).toBe('candidate-new');
  });
});

describe('merge engine: overlapping-distinct conflict resolution', () => {
  it('presents conflict for overlapping-distinct, does NOT auto-merge', () => {
    const engine = createMergeEngine('session-1');
    const candidate = makePrimitive({ id: 'candidate-overlap' });
    const existing = makePrimitive({ id: 'existing-overlap' });
    const comparison = makeComparison('existing-overlap', 'overlapping-distinct');

    const result = engine.merge(candidate, comparison, existing);

    expect(result.action).toBe('conflict');
    expect(result.conflict).toBeDefined();
    expect(result.conflict!.existing.id).toBe('existing-overlap');
    expect(result.conflict!.candidate.id).toBe('candidate-overlap');
    expect(result.conflict!.comparison).toEqual(comparison);
    expect(result.modifications.length).toBe(0);
  });

  it('resolveConflict with keep-existing skips candidate', () => {
    const engine = createMergeEngine('session-1');
    const candidate = makePrimitive({ id: 'candidate-overlap' });
    const existing = makePrimitive({ id: 'existing-overlap' });
    const comparison = makeComparison('existing-overlap', 'overlapping-distinct');

    const mergeResult = engine.merge(candidate, comparison, existing);
    const conflictId = mergeResult.conflict!.conflictId;

    const result = engine.resolveConflict(conflictId, 'keep-existing');

    expect(result.action).toBe('skip');
    expect(result.provenance.userDecision).toBe('keep-existing');
  });

  it('resolveConflict with keep-candidate replaces existing', () => {
    const engine = createMergeEngine('session-1');
    const candidate = makePrimitive({ id: 'candidate-overlap' });
    const existing = makePrimitive({ id: 'existing-overlap' });
    const comparison = makeComparison('existing-overlap', 'overlapping-distinct');

    const mergeResult = engine.merge(candidate, comparison, existing);
    const conflictId = mergeResult.conflict!.conflictId;

    const result = engine.resolveConflict(conflictId, 'keep-candidate');

    expect(result.action).toBe('replace');
    expect(result.modifications.length).toBeGreaterThan(0);
  });

  it('resolveConflict with keep-both adds candidate alongside existing', () => {
    const engine = createMergeEngine('session-1');
    const candidate = makePrimitive({ id: 'candidate-overlap' });
    const existing = makePrimitive({ id: 'existing-overlap' });
    const comparison = makeComparison('existing-overlap', 'overlapping-distinct');

    const mergeResult = engine.merge(candidate, comparison, existing);
    const conflictId = mergeResult.conflict!.conflictId;

    const result = engine.resolveConflict(conflictId, 'keep-both');

    expect(result.action).toBe('add');
  });

  it('resolveConflict records user decision in provenance', () => {
    const engine = createMergeEngine('session-1');
    const candidate = makePrimitive({ id: 'candidate-overlap' });
    const existing = makePrimitive({ id: 'existing-overlap' });
    const comparison = makeComparison('existing-overlap', 'overlapping-distinct');

    const mergeResult = engine.merge(candidate, comparison, existing);
    const conflictId = mergeResult.conflict!.conflictId;

    const result = engine.resolveConflict(conflictId, 'keep-both');

    expect(result.provenance.userDecision).toBe('keep-both');
  });
});

describe('merge engine: provenance chain', () => {
  it('provenance chain is append-only across multiple merges', () => {
    const engine = createMergeEngine('session-1');

    engine.merge(makePrimitive({ id: 'c1' }), null, null);
    engine.merge(makePrimitive({ id: 'c2' }), null, null);
    engine.merge(makePrimitive({ id: 'c3' }), null, null);

    const chain = engine.getProvenanceChain();
    expect(chain.length).toBe(3);
    expect(chain[0].candidateId).toBe('c1');
    expect(chain[1].candidateId).toBe('c2');
    expect(chain[2].candidateId).toBe('c3');
  });

  it('provenance entries include sessionId from engine construction', () => {
    const engine = createMergeEngine('test-session-42');
    engine.merge(makePrimitive({ id: 'c1' }), null, null);

    const chain = engine.getProvenanceChain();
    expect(chain[0].sessionId).toBe('test-session-42');
  });
});
