/**
 * TDD tests for derived knowledge type constants.
 *
 * Covers FAMILIARITY_TIERS ordering and DERIVED_CHECK_SEVERITIES.
 *
 * @module staging/derived/types.test
 */

import { describe, it, expect } from 'vitest';
import {
  FAMILIARITY_TIERS,
  DERIVED_CHECK_SEVERITIES,
} from './types.js';

describe('FAMILIARITY_TIERS', () => {
  it('contains exactly 4 tiers', () => {
    expect(FAMILIARITY_TIERS).toHaveLength(4);
  });

  it('is ordered from most to least familiar: home, neighborhood, town, stranger', () => {
    expect(FAMILIARITY_TIERS).toEqual([
      'home',
      'neighborhood',
      'town',
      'stranger',
    ]);
  });
});

describe('DERIVED_CHECK_SEVERITIES', () => {
  it('contains exactly 3 severities', () => {
    expect(DERIVED_CHECK_SEVERITIES).toHaveLength(3);
  });

  it('contains critical, warning, info in order', () => {
    expect(DERIVED_CHECK_SEVERITIES).toEqual([
      'critical',
      'warning',
      'info',
    ]);
  });
});
