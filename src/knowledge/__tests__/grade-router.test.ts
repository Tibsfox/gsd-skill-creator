/**
 * Tests for grade-level router.
 *
 * Routes a learner to the appropriate grade-level band within a knowledge
 * pack based on their current grade. Handles exact matches, nearest levels,
 * and out-of-range scenarios.
 */

import { describe, expect, it } from 'vitest';

import type { KnowledgePack } from '../types.js';
import { routeByGradeLevel } from '../grade-router.js';
import type { GradeRouteResult } from '../grade-router.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePackWithGrades(
  gradeLevels: Array<{ label: string; grades: string[]; estimated_hours: [number, number] }>,
): KnowledgePack {
  return {
    pack_id: 'TEST-PACK',
    pack_name: 'Test Pack',
    version: '1.0.0',
    status: 'alpha',
    classification: 'core_academic',
    description: 'Test pack for grade routing',
    contributors: [{ name: 'Test', role: 'author' }],
    copyright: 'Test 2026',
    dependencies: [],
    prerequisite_packs: [],
    recommended_prior_knowledge: [],
    enables: [],
    grade_levels: gradeLevels,
    tags: ['test'],
    related_packs: [],
    gsd_integration: {},
  } as KnowledgePack;
}

// ---------------------------------------------------------------------------
// routeByGradeLevel
// ---------------------------------------------------------------------------

describe('routeByGradeLevel', () => {
  const standardPack = makePackWithGrades([
    { label: 'Foundation', grades: ['PreK', 'K', '1', '2'], estimated_hours: [20, 40] },
    { label: 'Elementary', grades: ['3', '4', '5'], estimated_hours: [60, 80] },
    { label: 'Middle School', grades: ['6', '7', '8'], estimated_hours: [80, 120] },
    { label: 'High School', grades: ['9', '10', '11', '12'], estimated_hours: [100, 150] },
  ]);

  it('finds exact match for a grade within a level', () => {
    const result: GradeRouteResult = routeByGradeLevel('5', standardPack);

    expect(result.level).toBe('Elementary');
    expect(result.estimatedHours).toEqual([60, 80]);
    expect(result.matchType).toBe('exact');
  });

  it('finds exact match for K grade', () => {
    const result = routeByGradeLevel('K', standardPack);

    expect(result.level).toBe('Foundation');
    expect(result.matchType).toBe('exact');
  });

  it('finds exact match for PreK', () => {
    const result = routeByGradeLevel('PreK', standardPack);

    expect(result.level).toBe('Foundation');
    expect(result.matchType).toBe('exact');
  });

  it('returns below_range when learner is below all grade levels', () => {
    const limitedPack = makePackWithGrades([
      { label: 'Elementary', grades: ['3', '4', '5'], estimated_hours: [60, 80] },
      { label: 'Middle School', grades: ['6', '7', '8'], estimated_hours: [80, 120] },
    ]);
    const result = routeByGradeLevel('PreK', limitedPack);

    expect(result.level).toBeNull();
    expect(result.matchType).toBe('below_range');
    expect(result.suggestion).toBeDefined();
    expect(result.suggestion).toContain('3');
  });

  it('returns above_range with highest level when learner is above all', () => {
    const limitedPack = makePackWithGrades([
      { label: 'Foundation', grades: ['PreK', 'K', '1', '2'], estimated_hours: [20, 40] },
      { label: 'Elementary', grades: ['3', '4', '5'], estimated_hours: [60, 80] },
    ]);
    const result = routeByGradeLevel('12', limitedPack);

    expect(result.level).toBe('Elementary');
    expect(result.matchType).toBe('above_range');
    expect(result.estimatedHours).toEqual([60, 80]);
  });

  it('returns nearest level for grade between defined ranges', () => {
    // Pack with gap: Foundation (PreK-2) and High School (9-12)
    const gappyPack = makePackWithGrades([
      { label: 'Foundation', grades: ['PreK', 'K', '1', '2'], estimated_hours: [20, 40] },
      { label: 'High School', grades: ['9', '10', '11', '12'], estimated_hours: [100, 150] },
    ]);
    const result = routeByGradeLevel('6', gappyPack);

    // Grade 6 is between ranges; should pick nearest
    expect(result.matchType).toBe('nearest');
    expect(result.level).toBeDefined();
  });

  it('handles single grade-level pack', () => {
    const singlePack = makePackWithGrades([
      { label: 'Elementary', grades: ['3', '4', '5'], estimated_hours: [60, 80] },
    ]);
    const result = routeByGradeLevel('4', singlePack);

    expect(result.level).toBe('Elementary');
    expect(result.matchType).toBe('exact');
    expect(result.estimatedHours).toEqual([60, 80]);
  });

  it('handles empty grade_levels gracefully', () => {
    const emptyPack = makePackWithGrades([]);
    const result = routeByGradeLevel('5', emptyPack);

    expect(result.level).toBeNull();
    expect(result.matchType).toBe('below_range');
  });
});
