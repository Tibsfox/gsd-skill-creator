/**
 * TDD tests for the hygiene pattern registry.
 *
 * Covers built-in patterns, filtering, add/reset API,
 * uniqueness constraints, and pattern structure validation.
 *
 * @module staging/hygiene/patterns.test
 */

import { describe, it, expect, afterEach } from 'vitest';
import type { HygieneCategory } from './types.js';
import { HYGIENE_CATEGORIES } from './types.js';
import {
  getAllPatterns,
  getPatterns,
  addPattern,
  resetPatterns,
  BUILTIN_PATTERN_COUNT,
} from './patterns.js';

afterEach(() => {
  resetPatterns();
});

describe('getAllPatterns', () => {
  it('returns all built-in patterns', () => {
    const patterns = getAllPatterns();
    expect(patterns).toHaveLength(BUILTIN_PATTERN_COUNT);
  });

  it('each pattern has required fields', () => {
    const patterns = getAllPatterns();
    for (const p of patterns) {
      expect(typeof p.id).toBe('string');
      expect(HYGIENE_CATEGORIES).toContain(p.category);
      expect(typeof p.name).toBe('string');
      expect(typeof p.description).toBe('string');
      expect(typeof p.severity).toBe('string');
      // At least one of detect or regex must be defined
      const hasDetect = typeof p.detect === 'function';
      const hasRegex = p.regex instanceof RegExp;
      expect(hasDetect || hasRegex).toBe(true);
    }
  });
});

describe('getPatterns', () => {
  it('filters by embedded-instructions category', () => {
    const patterns = getPatterns('embedded-instructions');
    expect(patterns.length).toBeGreaterThan(0);
    for (const p of patterns) {
      expect(p.category).toBe('embedded-instructions');
    }
  });

  it('filters by hidden-content category', () => {
    const patterns = getPatterns('hidden-content');
    expect(patterns.length).toBeGreaterThan(0);
    for (const p of patterns) {
      expect(p.category).toBe('hidden-content');
    }
  });

  it('filters by config-safety category', () => {
    const patterns = getPatterns('config-safety');
    expect(patterns.length).toBeGreaterThan(0);
    for (const p of patterns) {
      expect(p.category).toBe('config-safety');
    }
  });
});

describe('pattern uniqueness', () => {
  it('every built-in pattern has a unique id', () => {
    const patterns = getAllPatterns();
    const ids = patterns.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('addPattern', () => {
  it('adds a custom pattern to the registry', () => {
    const custom = {
      id: 'custom-test-pattern',
      category: 'hidden-content' as HygieneCategory,
      name: 'Custom Test',
      description: 'A test pattern',
      severity: 'low' as const,
      regex: /custom-test/i,
    };

    addPattern(custom);

    const all = getAllPatterns();
    expect(all).toHaveLength(BUILTIN_PATTERN_COUNT + 1);

    const found = all.find((p) => p.id === 'custom-test-pattern');
    expect(found).toBeDefined();

    const filtered = getPatterns('hidden-content');
    expect(filtered.find((p) => p.id === 'custom-test-pattern')).toBeDefined();
  });

  it('rejects duplicate id', () => {
    const custom = {
      id: 'dup-pattern',
      category: 'config-safety' as HygieneCategory,
      name: 'Dup Test',
      description: 'A duplicate test',
      severity: 'info' as const,
      regex: /dup/i,
    };

    addPattern(custom);
    expect(() => addPattern(custom)).toThrow('dup-pattern');
  });
});

describe('resetPatterns', () => {
  it('restores to built-in only after adding custom patterns', () => {
    const custom = {
      id: 'will-be-removed',
      category: 'embedded-instructions' as HygieneCategory,
      name: 'Temp Pattern',
      description: 'Will be removed on reset',
      severity: 'low' as const,
      regex: /temp/i,
    };

    addPattern(custom);
    expect(getAllPatterns()).toHaveLength(BUILTIN_PATTERN_COUNT + 1);

    resetPatterns();
    expect(getAllPatterns()).toHaveLength(BUILTIN_PATTERN_COUNT);
    expect(getAllPatterns().find((p) => p.id === 'will-be-removed')).toBeUndefined();
  });
});

describe('built-in pattern coverage', () => {
  it('covers all three categories', () => {
    for (const category of HYGIENE_CATEGORIES) {
      const patterns = getPatterns(category);
      expect(patterns.length).toBeGreaterThan(0);
    }
  });
});

describe('pattern detect/regex validation', () => {
  it('every pattern has either a detect function or a regex', () => {
    const patterns = getAllPatterns();
    for (const p of patterns) {
      const hasDetect = typeof p.detect === 'function';
      const hasRegex = p.regex instanceof RegExp;
      expect(
        hasDetect || hasRegex,
        `Pattern "${p.id}" must have detect or regex`,
      ).toBe(true);
    }
  });
});
