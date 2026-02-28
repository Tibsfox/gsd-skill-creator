/**
 * TDD tests for hygiene type constants.
 *
 * Covers HYGIENE_CATEGORIES and HYGIENE_SEVERITIES arrays.
 *
 * @module staging/hygiene/types.test
 */

import { describe, it, expect } from 'vitest';
import { HYGIENE_CATEGORIES, HYGIENE_SEVERITIES } from './types.js';

describe('HYGIENE_CATEGORIES', () => {
  it('contains exactly 3 categories', () => {
    expect(HYGIENE_CATEGORIES).toHaveLength(3);
  });

  it('contains embedded-instructions, hidden-content, config-safety', () => {
    expect(HYGIENE_CATEGORIES).toEqual([
      'embedded-instructions',
      'hidden-content',
      'config-safety',
    ]);
  });
});

describe('HYGIENE_SEVERITIES', () => {
  it('contains exactly 5 severity levels', () => {
    expect(HYGIENE_SEVERITIES).toHaveLength(5);
  });

  it('contains critical, high, medium, low, info', () => {
    expect(HYGIENE_SEVERITIES).toEqual([
      'critical',
      'high',
      'medium',
      'low',
      'info',
    ]);
  });
});
