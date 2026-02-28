/**
 * Grade-level router for knowledge packs.
 *
 * Routes a learner to the appropriate grade-level band within a pack
 * based on their current grade. Handles exact matches, nearest levels,
 * and out-of-range scenarios.
 *
 * Operates on in-memory data -- no filesystem I/O.
 */

import type { GradeLevelEntry, KnowledgePack } from './types.js';

// ============================================================================
// GradeRouteResult
// ============================================================================

/**
 * Result of routing a learner to a grade level within a pack.
 *
 * - `level`: matched grade level label, or null if below range
 * - `estimatedHours`: [min, max] tuple from the matched level, or null
 * - `matchType`: how the match was determined
 * - `suggestion`: human-readable guidance for out-of-range cases
 */
export interface GradeRouteResult {
  level: string | null;
  estimatedHours: [number, number] | null;
  matchType: 'exact' | 'nearest' | 'below_range' | 'above_range';
  suggestion?: string;
}

// ============================================================================
// Internal helpers
// ============================================================================

/**
 * Canonical grade ordering for comparison.
 * PreK < K < 1 < 2 < ... < 16 (college levels).
 */
const GRADE_ORDER: readonly string[] = [
  'PreK', 'K',
  '1', '2', '3', '4', '5', '6', '7', '8',
  '9', '10', '11', '12',
  '13', '14', '15', '16',
];

/** Get the numeric position of a grade in the canonical ordering. */
function gradePosition(grade: string): number {
  const idx = GRADE_ORDER.indexOf(grade);
  return idx >= 0 ? idx : -1;
}

/**
 * Compute the numeric position range for a grade level entry.
 * Returns [minPosition, maxPosition] across all grades in the entry.
 */
function levelRange(entry: GradeLevelEntry): [number, number] {
  let min = Infinity;
  let max = -Infinity;
  for (const g of entry.grades) {
    const pos = gradePosition(g);
    if (pos >= 0) {
      min = Math.min(min, pos);
      max = Math.max(max, pos);
    }
  }
  return [min === Infinity ? -1 : min, max === -Infinity ? -1 : max];
}

/** Extract estimated hours as a [min, max] tuple. */
function extractHours(entry: GradeLevelEntry): [number, number] {
  const h = entry.estimated_hours;
  if (Array.isArray(h) && h.length >= 2) {
    return [h[0], h[1]];
  }
  return [0, 0];
}

// ============================================================================
// routeByGradeLevel
// ============================================================================

/**
 * Route a learner to the appropriate grade level within a knowledge pack.
 *
 * 1. Check each grade_level entry for an exact match (learner grade in grades array).
 * 2. If no exact match, find the nearest level by comparing grade positions.
 * 3. Return below_range if the learner is below all levels, above_range if above.
 *
 * @param learnerGrade - The learner's current grade (e.g., '5', 'K', 'PreK')
 * @param pack - The knowledge pack to route into
 * @returns GradeRouteResult with matched level and match type
 */
export function routeByGradeLevel(
  learnerGrade: string,
  pack: KnowledgePack,
): GradeRouteResult {
  const levels = pack.grade_levels;

  // Edge case: no grade levels defined
  if (!levels || levels.length === 0) {
    return {
      level: null,
      estimatedHours: null,
      matchType: 'below_range',
    };
  }

  // 1. Check for exact match
  for (const entry of levels) {
    if (entry.grades.includes(learnerGrade)) {
      return {
        level: entry.label,
        estimatedHours: extractHours(entry),
        matchType: 'exact',
      };
    }
  }

  // 2. Compute learner position and level ranges
  const learnerPos = gradePosition(learnerGrade);

  // If grade is unknown, treat as below range
  if (learnerPos < 0) {
    return {
      level: null,
      estimatedHours: null,
      matchType: 'below_range',
      suggestion: `Grade "${learnerGrade}" is not recognized`,
    };
  }

  // Build position data for all levels
  const levelData = levels.map((entry) => ({
    entry,
    range: levelRange(entry),
  })).filter(({ range }) => range[0] >= 0);

  if (levelData.length === 0) {
    return {
      level: null,
      estimatedHours: null,
      matchType: 'below_range',
    };
  }

  // Find overall min and max across all levels
  const globalMin = Math.min(...levelData.map(({ range }) => range[0]));
  const globalMax = Math.max(...levelData.map(({ range }) => range[1]));

  // 3. Below range
  if (learnerPos < globalMin) {
    const lowestGrade = GRADE_ORDER[globalMin];
    return {
      level: null,
      estimatedHours: null,
      matchType: 'below_range',
      suggestion: `This pack starts at grade ${lowestGrade}`,
    };
  }

  // 4. Above range
  if (learnerPos > globalMax) {
    // Return the highest level
    const highest = levelData.reduce((best, curr) =>
      curr.range[1] > best.range[1] ? curr : best,
    );
    return {
      level: highest.entry.label,
      estimatedHours: extractHours(highest.entry),
      matchType: 'above_range',
    };
  }

  // 5. Between ranges -- find nearest level
  let nearest = levelData[0];
  let nearestDistance = Infinity;

  for (const ld of levelData) {
    const [lo, hi] = ld.range;
    let distance: number;

    if (learnerPos >= lo && learnerPos <= hi) {
      // Within this range (but not in grades array -- shouldn't happen
      // if grades array is complete, but handle gracefully)
      distance = 0;
    } else if (learnerPos < lo) {
      distance = lo - learnerPos;
    } else {
      distance = learnerPos - hi;
    }

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = ld;
    }
  }

  return {
    level: nearest.entry.label,
    estimatedHours: extractHours(nearest.entry),
    matchType: 'nearest',
  };
}
