/**
 * TDD tests for resource analysis type constants.
 *
 * Covers all const arrays: COMPLEXITY_LEVELS, TOPOLOGY_TYPES,
 * BUDGET_CATEGORIES, SKILL_MATCH_STATUSES, EXTERNAL_DEP_TYPES.
 *
 * @module staging/resource/types.test
 */

import { describe, it, expect } from 'vitest';
import {
  COMPLEXITY_LEVELS,
  TOPOLOGY_TYPES,
  BUDGET_CATEGORIES,
  SKILL_MATCH_STATUSES,
  EXTERNAL_DEP_TYPES,
} from './types.js';

describe('COMPLEXITY_LEVELS', () => {
  it('contains exactly 4 entries', () => {
    expect(COMPLEXITY_LEVELS).toHaveLength(4);
  });

  it('contains low, medium, high, critical in order', () => {
    expect(COMPLEXITY_LEVELS).toEqual(['low', 'medium', 'high', 'critical']);
  });
});

describe('TOPOLOGY_TYPES', () => {
  it('contains exactly 5 entries', () => {
    expect(TOPOLOGY_TYPES).toHaveLength(5);
  });

  it('contains single, pipeline, map-reduce, router, hybrid', () => {
    expect(TOPOLOGY_TYPES).toEqual([
      'single',
      'pipeline',
      'map-reduce',
      'router',
      'hybrid',
    ]);
  });
});

describe('BUDGET_CATEGORIES', () => {
  it('contains exactly 7 entries', () => {
    expect(BUDGET_CATEGORIES).toHaveLength(7);
  });

  it('contains all budget category values', () => {
    expect(BUDGET_CATEGORIES).toEqual([
      'skill-loading',
      'planning',
      'execution',
      'research',
      'verification',
      'hitl',
      'safety-margin',
    ]);
  });
});

describe('SKILL_MATCH_STATUSES', () => {
  it('contains exactly 4 entries', () => {
    expect(SKILL_MATCH_STATUSES).toHaveLength(4);
  });

  it('contains ready, flagged, missing, recommended', () => {
    expect(SKILL_MATCH_STATUSES).toEqual([
      'ready',
      'flagged',
      'missing',
      'recommended',
    ]);
  });
});

describe('EXTERNAL_DEP_TYPES', () => {
  it('contains exactly 5 entries', () => {
    expect(EXTERNAL_DEP_TYPES).toHaveLength(5);
  });

  it('contains api, library, service, database, tool', () => {
    expect(EXTERNAL_DEP_TYPES).toEqual([
      'api',
      'library',
      'service',
      'database',
      'tool',
    ]);
  });
});
