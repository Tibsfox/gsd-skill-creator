/**
 * Tests for the verbosity controller module.
 *
 * Verifies:
 * - VerbosityLevelSchema validates integers 1-5 with default 3
 * - VERBOSITY_LEVELS provides named constants for all 5 levels
 * - OutputSectionSchema validates tag/content/minLevel with passthrough
 * - filterByVerbosity correctly filters OutputSection[] by VerbosityLevel
 * - Edge cases: empty input, boundary levels, all-same-level sections
 */

import { describe, it, expect } from 'vitest';
import {
  VerbosityLevelSchema,
  OutputSectionSchema,
  VERBOSITY_LEVELS,
} from './types.js';
import type { OutputSection } from './types.js';
import { filterByVerbosity } from './verbosity-controller.js';

// ============================================================================
// Fixtures
// ============================================================================

/** Sections spanning all 5 verbosity levels */
function makeSections(): OutputSection[] {
  return [
    { tag: 'result', content: 'Command output', minLevel: 1 },
    { tag: 'classification', content: 'Matched: plan-phase (0.92)', minLevel: 2 },
    { tag: 'lifecycle', content: 'Suggest: execute-phase next', minLevel: 3 },
    { tag: 'discovery', content: 'Found 42 commands in 2.1ms', minLevel: 4 },
    { tag: 'gate', content: 'All scores: plan-phase=0.92, execute=0.31', minLevel: 5 },
  ];
}

// ============================================================================
// VerbosityLevelSchema
// ============================================================================

describe('VerbosityLevelSchema', () => {
  it('parses valid integer levels 1-5', () => {
    expect(VerbosityLevelSchema.parse(1)).toBe(1);
    expect(VerbosityLevelSchema.parse(2)).toBe(2);
    expect(VerbosityLevelSchema.parse(3)).toBe(3);
    expect(VerbosityLevelSchema.parse(4)).toBe(4);
    expect(VerbosityLevelSchema.parse(5)).toBe(5);
  });

  it('defaults to 3 when undefined', () => {
    expect(VerbosityLevelSchema.parse(undefined)).toBe(3);
  });

  it('rejects 0 (below minimum)', () => {
    expect(() => VerbosityLevelSchema.parse(0)).toThrow();
  });

  it('rejects 6 (above maximum)', () => {
    expect(() => VerbosityLevelSchema.parse(6)).toThrow();
  });

  it('rejects non-integer (2.5)', () => {
    expect(() => VerbosityLevelSchema.parse(2.5)).toThrow();
  });

  it('rejects negative numbers', () => {
    expect(() => VerbosityLevelSchema.parse(-1)).toThrow();
  });

  it('rejects strings', () => {
    expect(() => VerbosityLevelSchema.parse('3')).toThrow();
  });
});

// ============================================================================
// VERBOSITY_LEVELS
// ============================================================================

describe('VERBOSITY_LEVELS', () => {
  it('has SILENT = 1', () => {
    expect(VERBOSITY_LEVELS.SILENT).toBe(1);
  });

  it('has MINIMAL = 2', () => {
    expect(VERBOSITY_LEVELS.MINIMAL).toBe(2);
  });

  it('has STANDARD = 3', () => {
    expect(VERBOSITY_LEVELS.STANDARD).toBe(3);
  });

  it('has DETAILED = 4', () => {
    expect(VERBOSITY_LEVELS.DETAILED).toBe(4);
  });

  it('has TRANSPARENT = 5', () => {
    expect(VERBOSITY_LEVELS.TRANSPARENT).toBe(5);
  });

  it('has exactly 5 entries', () => {
    expect(Object.keys(VERBOSITY_LEVELS)).toHaveLength(5);
  });
});

// ============================================================================
// OutputSectionSchema
// ============================================================================

describe('OutputSectionSchema', () => {
  it('parses valid section', () => {
    const result = OutputSectionSchema.parse({
      tag: 'result',
      content: 'Hello',
      minLevel: 1,
    });
    expect(result.tag).toBe('result');
    expect(result.content).toBe('Hello');
    expect(result.minLevel).toBe(1);
  });

  it('rejects missing tag', () => {
    expect(() => OutputSectionSchema.parse({
      content: 'Hello',
      minLevel: 1,
    })).toThrow();
  });

  it('rejects missing content', () => {
    expect(() => OutputSectionSchema.parse({
      tag: 'result',
      minLevel: 1,
    })).toThrow();
  });

  it('defaults minLevel to 3 when missing', () => {
    const result = OutputSectionSchema.parse({
      tag: 'result',
      content: 'Hello',
    });
    expect(result.minLevel).toBe(3);
  });

  it('passes through extra fields', () => {
    const result = OutputSectionSchema.parse({
      tag: 'result',
      content: 'Hello',
      minLevel: 1,
      customField: 'preserved',
    });
    expect((result as Record<string, unknown>).customField).toBe('preserved');
  });

  it('uses VerbosityLevelSchema default for minLevel when undefined', () => {
    const result = OutputSectionSchema.parse({
      tag: 'result',
      content: 'Hello',
      minLevel: undefined,
    });
    expect(result.minLevel).toBe(3);
  });
});

// ============================================================================
// filterByVerbosity
// ============================================================================

describe('filterByVerbosity', () => {
  describe('level filtering', () => {
    it('level 1 (Silent) returns only minLevel 1 sections', () => {
      const sections = makeSections();
      const result = filterByVerbosity(sections, 1);
      expect(result).toHaveLength(1);
      expect(result[0].tag).toBe('result');
    });

    it('level 2 (Minimal) returns minLevel 1 and 2 sections', () => {
      const sections = makeSections();
      const result = filterByVerbosity(sections, 2);
      expect(result).toHaveLength(2);
      expect(result.map(s => s.tag)).toEqual(['result', 'classification']);
    });

    it('level 3 (Standard) returns minLevel 1, 2, and 3 sections', () => {
      const sections = makeSections();
      const result = filterByVerbosity(sections, 3);
      expect(result).toHaveLength(3);
      expect(result.map(s => s.tag)).toEqual(['result', 'classification', 'lifecycle']);
    });

    it('level 4 (Detailed) returns minLevel 1-4 sections', () => {
      const sections = makeSections();
      const result = filterByVerbosity(sections, 4);
      expect(result).toHaveLength(4);
      expect(result.map(s => s.tag)).toEqual(['result', 'classification', 'lifecycle', 'discovery']);
    });

    it('level 5 (Transparent) returns all sections', () => {
      const sections = makeSections();
      const result = filterByVerbosity(sections, 5);
      expect(result).toHaveLength(5);
    });
  });

  describe('edge cases', () => {
    it('empty array returns empty array', () => {
      const result = filterByVerbosity([], 3);
      expect(result).toEqual([]);
    });

    it('all sections same level - all pass when level matches', () => {
      const sections: OutputSection[] = [
        { tag: 'a', content: 'A', minLevel: 2 },
        { tag: 'b', content: 'B', minLevel: 2 },
        { tag: 'c', content: 'C', minLevel: 2 },
      ];
      const result = filterByVerbosity(sections, 2);
      expect(result).toHaveLength(3);
    });

    it('all sections same level - none pass when level too low', () => {
      const sections: OutputSection[] = [
        { tag: 'a', content: 'A', minLevel: 3 },
        { tag: 'b', content: 'B', minLevel: 3 },
      ];
      const result = filterByVerbosity(sections, 2);
      expect(result).toHaveLength(0);
    });

    it('section minLevel exactly at level passes (inclusive)', () => {
      const sections: OutputSection[] = [
        { tag: 'exact', content: 'Boundary', minLevel: 4 },
      ];
      const result = filterByVerbosity(sections, 4);
      expect(result).toHaveLength(1);
      expect(result[0].tag).toBe('exact');
    });

    it('preserves section order', () => {
      const sections: OutputSection[] = [
        { tag: 'c', content: 'Third', minLevel: 3 },
        { tag: 'a', content: 'First', minLevel: 1 },
        { tag: 'b', content: 'Second', minLevel: 2 },
      ];
      const result = filterByVerbosity(sections, 3);
      expect(result.map(s => s.tag)).toEqual(['c', 'a', 'b']);
    });

    it('does not mutate original array', () => {
      const sections = makeSections();
      const original = [...sections];
      filterByVerbosity(sections, 2);
      expect(sections).toEqual(original);
    });
  });
});
