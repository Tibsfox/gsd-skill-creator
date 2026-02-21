/**
 * Tests for prerequisite validator.
 *
 * Checks whether a learner's completed packs satisfy the entry requirements
 * for a target knowledge pack. Distinguishes hard prerequisites (blocking)
 * from recommended prior knowledge (advisory).
 */

import { describe, expect, it } from 'vitest';

import type { KnowledgePack } from '../types.js';
import { validatePrerequisites } from '../prerequisite-validator.js';
import type { PrerequisiteResult } from '../prerequisite-validator.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePack(
  id: string,
  opts: {
    dependencies?: string[];
    prerequisite_packs?: string[];
    recommended_prior_knowledge?: string[];
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
    dependencies: opts.dependencies ?? [],
    prerequisite_packs: opts.prerequisite_packs ?? [],
    recommended_prior_knowledge: opts.recommended_prior_knowledge ?? [],
    enables: [],
    grade_levels: [{ label: 'Elementary', grades: ['3', '4', '5'], estimated_hours: [40, 60] }],
    tags: ['test'],
    related_packs: [],
    gsd_integration: {},
  } as unknown as KnowledgePack;
}

// ---------------------------------------------------------------------------
// validatePrerequisites
// ---------------------------------------------------------------------------

describe('validatePrerequisites', () => {
  it('returns satisfied when all prerequisites are met', () => {
    const target = makePack('PHYS-101', { dependencies: ['MATH-101'] });
    const result: PrerequisiteResult = validatePrerequisites(target, ['MATH-101']);

    expect(result.satisfied).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it('returns missing prerequisite when not completed', () => {
    const target = makePack('PHYS-101', { dependencies: ['MATH-101'] });
    const result = validatePrerequisites(target, []);

    expect(result.satisfied).toBe(false);
    expect(result.missing).toEqual(['MATH-101']);
  });

  it('reports partial completion of multiple prerequisites', () => {
    const target = makePack('LEARN-101', { dependencies: ['MATH-101', 'CODE-101'] });
    const result = validatePrerequisites(target, ['MATH-101']);

    expect(result.satisfied).toBe(false);
    expect(result.missing).toEqual(['CODE-101']);
  });

  it('returns satisfied when pack has no prerequisites', () => {
    const target = makePack('INTRO-101');
    const result = validatePrerequisites(target, []);

    expect(result.satisfied).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it('checks both dependencies and prerequisite_packs', () => {
    const target = makePack('MIXED-101', {
      dependencies: ['A'],
      prerequisite_packs: ['B'],
    });
    const result = validatePrerequisites(target, ['A']);

    expect(result.satisfied).toBe(false);
    expect(result.missing).toEqual(['B']);
  });

  it('recommended prior knowledge is advisory only', () => {
    const target = makePack('ADV-101', {
      recommended_prior_knowledge: ['X'],
    });
    const result = validatePrerequisites(target, []);

    // Satisfied because recommended is not required
    expect(result.satisfied).toBe(true);
    expect(result.missing).toEqual([]);
    expect(result.advisory).toEqual(['X']);
  });

  it('advisory is empty when recommended knowledge is completed', () => {
    const target = makePack('ADV-101', {
      recommended_prior_knowledge: ['X'],
    });
    const result = validatePrerequisites(target, ['X']);

    expect(result.satisfied).toBe(true);
    expect(result.advisory).toEqual([]);
  });

  it('combines missing prerequisites and advisory correctly', () => {
    const target = makePack('FULL-101', {
      dependencies: ['MATH-101'],
      prerequisite_packs: ['CODE-101'],
      recommended_prior_knowledge: ['ART-101'],
    });
    const result = validatePrerequisites(target, []);

    expect(result.satisfied).toBe(false);
    expect(result.missing).toContain('MATH-101');
    expect(result.missing).toContain('CODE-101');
    expect(result.advisory).toEqual(['ART-101']);
  });
});
