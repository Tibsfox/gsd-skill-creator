/**
 * Tests for DepChainValidator -- XREF-05: max depth 4, cycle detection.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DepChainValidator, DepChainValidationError } from './dep-chain-validator.js';
import { ConceptRegistry } from '../rosetta-core/concept-registry.js';
import type { RosettaConcept } from '../rosetta-core/types.js';

function makeConcept(id: string, domain: string, deps: string[] = []): RosettaConcept {
  return {
    id,
    name: id,
    domain,
    description: `Test concept ${id}`,
    panels: new Map(),
    relationships: deps.map((targetId) => ({
      type: 'dependency' as const,
      targetId,
      description: `${id} depends on ${targetId}`,
    })),
  };
}

let validator: DepChainValidator;

beforeEach(() => {
  validator = new DepChainValidator();
});

describe('DepChainValidator', () => {
  it('XREF-05: valid chain of depth 4 passes validation', () => {
    const registry = new ConceptRegistry();
    registry.register(makeConcept('a', 'test', ['b']));
    registry.register(makeConcept('b', 'test', ['c']));
    registry.register(makeConcept('c', 'test', ['d']));
    registry.register(makeConcept('d', 'test', []));

    const result = validator.validate(registry);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('XREF-05: chain of depth 5 triggers max-depth violation', () => {
    const registry = new ConceptRegistry();
    registry.register(makeConcept('a', 'test', ['b']));
    registry.register(makeConcept('b', 'test', ['c']));
    registry.register(makeConcept('c', 'test', ['d']));
    registry.register(makeConcept('d', 'test', ['e']));
    registry.register(makeConcept('e', 'test', []));

    const result = validator.validate(registry);
    expect(result.valid).toBe(false);
    const depthErrors = result.errors.filter((e) => e.type === 'max-depth');
    expect(depthErrors.length).toBeGreaterThan(0);
    expect(depthErrors[0].depth).toBeGreaterThan(4);
  });

  it('XREF-05: direct cycle (A->B->A) is detected as a cycle error', () => {
    const registry = new ConceptRegistry();
    registry.register(makeConcept('x', 'test', ['y']));
    registry.register(makeConcept('y', 'test', ['x']));

    const result = validator.validate(registry);
    expect(result.valid).toBe(false);
    const cycleErrors = result.errors.filter((e) => e.type === 'cycle');
    expect(cycleErrors.length).toBeGreaterThan(0);
  });

  it('XREF-05: self-cycle (A->A) is detected', () => {
    const registry = new ConceptRegistry();
    registry.register(makeConcept('self', 'test', ['self']));

    const result = validator.validate(registry);
    expect(result.valid).toBe(false);
    const cycleErrors = result.errors.filter((e) => e.type === 'cycle');
    expect(cycleErrors.length).toBeGreaterThan(0);
  });

  it('XREF-05: cross-reference and analogy relationships are NOT validated for depth/cycles', () => {
    const registry = new ConceptRegistry();
    // Simulate a "cycle" via cross-reference -- should NOT trigger cycle error
    registry.register({
      id: 'xref-a',
      name: 'XRef A',
      domain: 'test',
      description: 'Has cross-reference that looks like a cycle',
      panels: new Map(),
      relationships: [
        { type: 'cross-reference', targetId: 'xref-b', description: 'cross-ref' },
      ],
    });
    registry.register({
      id: 'xref-b',
      name: 'XRef B',
      domain: 'test',
      description: 'Points back to A via cross-reference',
      panels: new Map(),
      relationships: [
        { type: 'cross-reference', targetId: 'xref-a', description: 'cross-ref back' },
      ],
    });

    const result = validator.validate(registry);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('XREF-05: validateOrThrow() throws DepChainValidationError when violations exist', () => {
    const registry = new ConceptRegistry();
    registry.register(makeConcept('p', 'test', ['q']));
    registry.register(makeConcept('q', 'test', ['p']));  // cycle

    expect(() => validator.validateOrThrow(registry)).toThrow(DepChainValidationError);
  });

  it('XREF-05: validateOrThrow() does not throw when no violations exist', () => {
    const registry = new ConceptRegistry();
    registry.register(makeConcept('clean-a', 'test', ['clean-b']));
    registry.register(makeConcept('clean-b', 'test', []));

    expect(() => validator.validateOrThrow(registry)).not.toThrow();
  });

  it('empty registry passes validation', () => {
    const registry = new ConceptRegistry();
    const result = validator.validate(registry);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
