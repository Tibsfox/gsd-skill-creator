/**
 * Tests for dependency resolver: topological sort and cycle detection.
 *
 * The dependency resolver computes valid learning orders for knowledge packs
 * using Kahn's algorithm. It detects cycles, missing dependencies, and
 * builds a graph supporting prerequisite/dependent queries.
 */

import { describe, expect, it } from 'vitest';

import type { KnowledgePack } from '../types.js';
import {
  DependencyError,
  DependencyGraph,
  resolveDependencies,
} from '../dependency-resolver.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a minimal KnowledgePack for testing dependency resolution. */
function makePack(
  id: string,
  deps: string[] = [],
  opts: {
    enables?: string[];
    prerequisite_packs?: string[];
    recommended_prior_knowledge?: string[];
    related_packs?: Array<{ id: string; relationship: string }>;
  } = {},
): KnowledgePack {
  return {
    pack_id: id,
    pack_name: `Pack ${id}`,
    version: '1.0.0',
    status: 'alpha',
    classification: 'core_academic',
    description: `Test pack ${id}`,
    contributors: [{ name: 'Test', role: 'author' }],
    copyright: 'Test 2026',
    dependencies: deps,
    prerequisite_packs: opts.prerequisite_packs ?? [],
    recommended_prior_knowledge: opts.recommended_prior_knowledge ?? [],
    enables: opts.enables ?? [],
    grade_levels: [{ label: 'Elementary', grades: ['3', '4', '5'], estimated_hours: [40, 60] }],
    tags: ['test'],
    related_packs: opts.related_packs ?? [],
    gsd_integration: {},
  } as unknown as KnowledgePack;
}

// ---------------------------------------------------------------------------
// resolveDependencies
// ---------------------------------------------------------------------------

describe('resolveDependencies', () => {
  it('handles packs with no dependencies', () => {
    const packs = [makePack('A'), makePack('B'), makePack('C')];
    const graph = resolveDependencies(packs);
    const order = graph.getOrderedList();

    expect(order).toHaveLength(3);
    expect(new Set(order)).toEqual(new Set(['A', 'B', 'C']));
  });

  it('resolves a linear dependency chain in correct order', () => {
    const packs = [
      makePack('MATH-101'),
      makePack('PHYS-101', ['MATH-101']),
      makePack('ASTRO-101', ['PHYS-101']),
    ];
    const graph = resolveDependencies(packs);
    const order = graph.getOrderedList();

    expect(order).toEqual(['MATH-101', 'PHYS-101', 'ASTRO-101']);
  });

  it('resolves a diamond dependency', () => {
    const packs = [
      makePack('MATH-101'),
      makePack('CODE-101', ['MATH-101']),
      makePack('DATA-101', ['MATH-101']),
      makePack('LEARN-101', ['CODE-101', 'DATA-101']),
    ];
    const graph = resolveDependencies(packs);
    const order = graph.getOrderedList();

    // MATH-101 must be first
    expect(order[0]).toBe('MATH-101');
    // LEARN-101 must be last
    expect(order[3]).toBe('LEARN-101');
    // CODE-101 and DATA-101 in the middle (either order)
    expect(new Set(order.slice(1, 3))).toEqual(new Set(['CODE-101', 'DATA-101']));
  });

  it('detects a cycle and throws DependencyError', () => {
    const packs = [
      makePack('A', ['C']),
      makePack('B', ['A']),
      makePack('C', ['B']),
    ];

    expect(() => resolveDependencies(packs)).toThrow(DependencyError);

    try {
      resolveDependencies(packs);
    } catch (err) {
      expect(err).toBeInstanceOf(DependencyError);
      const depErr = err as DependencyError;
      // Error message must name all cycle participants
      expect(depErr.message).toContain('A');
      expect(depErr.message).toContain('B');
      expect(depErr.message).toContain('C');
      expect(depErr.cycle).toBeDefined();
      expect(depErr.cycle).toEqual(expect.arrayContaining(['A', 'B', 'C']));
    }
  });

  it('detects a self-reference cycle', () => {
    const packs = [makePack('A', ['A'])];

    expect(() => resolveDependencies(packs)).toThrow(DependencyError);

    try {
      resolveDependencies(packs);
    } catch (err) {
      const depErr = err as DependencyError;
      expect(depErr.message).toContain('A');
      expect(depErr.cycle).toBeDefined();
    }
  });

  it('detects missing dependencies', () => {
    const packs = [makePack('B', ['C'])];

    expect(() => resolveDependencies(packs)).toThrow(DependencyError);

    try {
      resolveDependencies(packs);
    } catch (err) {
      const depErr = err as DependencyError;
      expect(depErr.missing).toBeDefined();
      expect(depErr.missing).toContain('C');
    }
  });

  it('treats prerequisite_packs the same as dependencies', () => {
    const packs = [
      makePack('MATH-101'),
      makePack('PHYS-101', [], { prerequisite_packs: ['MATH-101'] }),
    ];
    const graph = resolveDependencies(packs);
    const order = graph.getOrderedList();

    expect(order).toEqual(['MATH-101', 'PHYS-101']);
  });

  it('merges dependencies and prerequisite_packs without duplicates', () => {
    const packs = [
      makePack('MATH-101'),
      makePack('PHYS-101', ['MATH-101'], { prerequisite_packs: ['MATH-101'] }),
    ];
    const graph = resolveDependencies(packs);
    const order = graph.getOrderedList();

    expect(order).toEqual(['MATH-101', 'PHYS-101']);
    // Only one prerequisite entry despite duplication
    expect(graph.getPrerequisites('PHYS-101')).toEqual(['MATH-101']);
  });
});

// ---------------------------------------------------------------------------
// DependencyGraph
// ---------------------------------------------------------------------------

describe('DependencyGraph', () => {
  it('getPrerequisites returns direct prerequisites', () => {
    const packs = [
      makePack('A'),
      makePack('B', ['A']),
      makePack('C', ['A', 'B']),
    ];
    const graph = resolveDependencies(packs);

    expect(graph.getPrerequisites('A')).toEqual([]);
    expect(graph.getPrerequisites('B')).toEqual(['A']);
    expect(new Set(graph.getPrerequisites('C'))).toEqual(new Set(['A', 'B']));
  });

  it('getDependents returns packs that depend on this one', () => {
    const packs = [
      makePack('A'),
      makePack('B', ['A']),
      makePack('C', ['A']),
    ];
    const graph = resolveDependencies(packs);

    expect(new Set(graph.getDependents('A'))).toEqual(new Set(['B', 'C']));
    expect(graph.getDependents('B')).toEqual([]);
    expect(graph.getDependents('C')).toEqual([]);
  });

  it('getOrderedList returns full topological order', () => {
    const packs = [
      makePack('X'),
      makePack('Y', ['X']),
      makePack('Z', ['Y']),
    ];
    const graph = resolveDependencies(packs);

    expect(graph.getOrderedList()).toEqual(['X', 'Y', 'Z']);
  });
});
