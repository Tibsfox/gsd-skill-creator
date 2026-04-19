/**
 * Tests for `src/tractability/selector-api.ts`
 *
 * Coverage:
 *   - getTractabilityClass: all raw input shapes
 *   - isTractable / isCoinFlip convenience predicates
 *   - tractabilityWeight: correct scalar for each class
 *   - batchClassify: correct map over an array
 */

import { describe, it, expect } from 'vitest';
import {
  getTractabilityClass,
  isTractable,
  isCoinFlip,
  tractabilityWeight,
  batchClassify,
} from '../selector-api.js';

// ---------------------------------------------------------------------------
// getTractabilityClass
// ---------------------------------------------------------------------------

describe('getTractabilityClass', () => {
  it('returns tractable for json-schema raw object', () => {
    const raw = { kind: 'json-schema', schema: '{"type":"object"}' };
    expect(getTractabilityClass(raw)).toBe('tractable');
  });

  it('returns tractable for markdown-template raw object', () => {
    const raw = { kind: 'markdown-template', template: '## H' };
    expect(getTractabilityClass(raw)).toBe('tractable');
  });

  it('returns coin-flip for prose raw object', () => {
    const raw = { kind: 'prose' };
    expect(getTractabilityClass(raw)).toBe('coin-flip');
  });

  it('returns unknown for null', () => {
    expect(getTractabilityClass(null)).toBe('unknown');
  });

  it('returns unknown for undefined', () => {
    expect(getTractabilityClass(undefined)).toBe('unknown');
  });

  it('returns unknown for garbage input', () => {
    // Malformed → falls back to default (prose via ME-5) → but resolveOutputStructure
    // returns 'default' source for invalid, which is mapped to unknown in selector-api
    const result = getTractabilityClass({ kind: 'bogus' });
    // bogus kind → ME-5 validation fails → source='default' → unknown
    expect(result).toBe('unknown');
  });

  it('does not throw for any input type', () => {
    expect(() => getTractabilityClass(42)).not.toThrow();
    expect(() => getTractabilityClass([])).not.toThrow();
    expect(() => getTractabilityClass('')).not.toThrow();
    expect(() => getTractabilityClass({})).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// isTractable
// ---------------------------------------------------------------------------

describe('isTractable', () => {
  it('returns true for json-schema', () => {
    expect(isTractable({ kind: 'json-schema', schema: '{}' })).toBe(true);
  });

  it('returns true for markdown-template', () => {
    expect(isTractable({ kind: 'markdown-template', template: '## T' })).toBe(true);
  });

  it('returns false for prose', () => {
    expect(isTractable({ kind: 'prose' })).toBe(false);
  });

  it('returns false for null (unknown)', () => {
    expect(isTractable(null)).toBe(false);
  });

  it('returns false for undefined (unknown)', () => {
    expect(isTractable(undefined)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isCoinFlip
// ---------------------------------------------------------------------------

describe('isCoinFlip', () => {
  it('returns true for prose', () => {
    expect(isCoinFlip({ kind: 'prose' })).toBe(true);
  });

  it('returns false for json-schema', () => {
    expect(isCoinFlip({ kind: 'json-schema', schema: '{}' })).toBe(false);
  });

  it('returns false for markdown-template', () => {
    expect(isCoinFlip({ kind: 'markdown-template', template: '## T' })).toBe(false);
  });

  it('returns false for null (unknown, not coin-flip)', () => {
    expect(isCoinFlip(null)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// tractabilityWeight
// ---------------------------------------------------------------------------

describe('tractabilityWeight', () => {
  it('returns 1.0 for tractable (json-schema)', () => {
    expect(tractabilityWeight({ kind: 'json-schema', schema: '{}' })).toBe(1.0);
  });

  it('returns 1.0 for tractable (markdown-template)', () => {
    expect(tractabilityWeight({ kind: 'markdown-template', template: '## T' })).toBe(1.0);
  });

  it('returns 0.5 for coin-flip (prose)', () => {
    expect(tractabilityWeight({ kind: 'prose' })).toBe(0.5);
  });

  it('returns 0.5 for unknown (null)', () => {
    expect(tractabilityWeight(null)).toBe(0.5);
  });

  it('returns 0.5 for unknown (undefined)', () => {
    expect(tractabilityWeight(undefined)).toBe(0.5);
  });

  it('weight is always in [0, 1]', () => {
    const inputs = [
      { kind: 'json-schema', schema: '{}' },
      { kind: 'markdown-template', template: '## T' },
      { kind: 'prose' },
      null,
      undefined,
    ];
    for (const input of inputs) {
      const w = tractabilityWeight(input);
      expect(w).toBeGreaterThanOrEqual(0);
      expect(w).toBeLessThanOrEqual(1);
    }
  });
});

// ---------------------------------------------------------------------------
// batchClassify
// ---------------------------------------------------------------------------

describe('batchClassify', () => {
  it('returns a Map with correct length', () => {
    const inputs = [
      { kind: 'json-schema', schema: '{}' },
      { kind: 'prose' },
      null,
    ];
    const result = batchClassify(inputs);
    expect(result.size).toBe(3);
  });

  it('correctly classifies each index', () => {
    const inputs = [
      { kind: 'json-schema', schema: '{}' },
      { kind: 'prose' },
      null,
    ];
    const result = batchClassify(inputs);
    expect(result.get(0)).toBe('tractable');
    expect(result.get(1)).toBe('coin-flip');
    expect(result.get(2)).toBe('unknown');
  });

  it('handles empty array', () => {
    const result = batchClassify([]);
    expect(result.size).toBe(0);
  });

  it('handles all-tractable array', () => {
    const inputs = [
      { kind: 'json-schema', schema: '{}' },
      { kind: 'markdown-template', template: '## T' },
    ];
    const result = batchClassify(inputs);
    expect(result.get(0)).toBe('tractable');
    expect(result.get(1)).toBe('tractable');
  });

  it('indices are contiguous from 0', () => {
    const inputs = [null, null, null];
    const result = batchClassify(inputs);
    expect(result.has(0)).toBe(true);
    expect(result.has(1)).toBe(true);
    expect(result.has(2)).toBe(true);
    expect(result.has(3)).toBe(false);
  });
});
