/**
 * Tests for `src/model-affinity/frontmatter.ts`
 *
 * Coverage:
 *   - resolveModelAffinity: valid, absent, and invalid input shapes
 *   - serializeModelAffinity: round-trip serialization
 *   - CF-ME2-03: absent affinity → null, no warnings
 */

import { describe, it, expect } from 'vitest';
import { resolveModelAffinity, serializeModelAffinity } from '../frontmatter.js';

// ---------------------------------------------------------------------------
// resolveModelAffinity
// ---------------------------------------------------------------------------

describe('resolveModelAffinity', () => {
  // Absent / null → CF-ME2-03
  it('returns null affinity for null (CF-ME2-03)', () => {
    const result = resolveModelAffinity(null);
    expect(result.affinity).toBeNull();
    expect(result.source).toBe('absent');
    expect(result.warnings).toHaveLength(0);
  });

  it('returns null affinity for undefined (CF-ME2-03)', () => {
    const result = resolveModelAffinity(undefined);
    expect(result.affinity).toBeNull();
    expect(result.source).toBe('absent');
    expect(result.warnings).toHaveLength(0);
  });

  // Valid shapes
  it('resolves minimal valid affinity (reliable only)', () => {
    const raw = { reliable: ['sonnet'] };
    const result = resolveModelAffinity(raw);
    expect(result.affinity).not.toBeNull();
    expect(result.affinity!.reliable).toEqual(['sonnet']);
    expect(result.source).toBe('explicit');
    expect(result.warnings).toHaveLength(0);
  });

  it('resolves affinity with reliable + unreliable', () => {
    const raw = { reliable: ['sonnet', 'opus'], unreliable: ['haiku'] };
    const result = resolveModelAffinity(raw);
    expect(result.affinity).not.toBeNull();
    expect(result.affinity!.reliable).toEqual(['sonnet', 'opus']);
    expect(result.affinity!.unreliable).toEqual(['haiku']);
    expect(result.source).toBe('explicit');
  });

  it('resolves all-models reliable', () => {
    const raw = { reliable: ['haiku', 'sonnet', 'opus'] };
    const result = resolveModelAffinity(raw);
    expect(result.affinity!.reliable).toEqual(['haiku', 'sonnet', 'opus']);
  });

  // Invalid shapes → warn + null (non-fatal)
  it('returns null for empty object (invalid)', () => {
    const result = resolveModelAffinity({});
    expect(result.affinity).toBeNull();
    expect(result.source).toBe('absent');
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('returns null for string input (invalid)', () => {
    const result = resolveModelAffinity('sonnet');
    expect(result.affinity).toBeNull();
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('returns null for empty reliable array (invalid)', () => {
    const result = resolveModelAffinity({ reliable: [] });
    expect(result.affinity).toBeNull();
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('returns null for invalid family name in reliable', () => {
    const result = resolveModelAffinity({ reliable: ['gpt-4'] });
    expect(result.affinity).toBeNull();
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('returns null for 42 (number input)', () => {
    const result = resolveModelAffinity(42);
    expect(result.affinity).toBeNull();
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('never throws on any input', () => {
    const inputs = [null, undefined, 'str', 42, [], {}, true, { reliable: null }];
    for (const input of inputs) {
      expect(() => resolveModelAffinity(input)).not.toThrow();
    }
  });
});

// ---------------------------------------------------------------------------
// serializeModelAffinity
// ---------------------------------------------------------------------------

describe('serializeModelAffinity', () => {
  it('returns undefined for null (omit field)', () => {
    expect(serializeModelAffinity(null)).toBeUndefined();
  });

  it('serializes reliable-only affinity', () => {
    const result = serializeModelAffinity({ reliable: ['sonnet'] });
    expect(result).toEqual({ reliable: ['sonnet'] });
  });

  it('serializes reliable + unreliable', () => {
    const result = serializeModelAffinity({
      reliable: ['sonnet', 'opus'],
      unreliable: ['haiku'],
    });
    expect(result).toEqual({ reliable: ['sonnet', 'opus'], unreliable: ['haiku'] });
  });

  it('omits unreliable field when empty', () => {
    const result = serializeModelAffinity({ reliable: ['opus'], unreliable: [] });
    expect(result).not.toHaveProperty('unreliable');
  });

  it('round-trips correctly', () => {
    const original: import('../schema.js').ModelAffinity = { reliable: ['haiku', 'sonnet'], unreliable: ['opus'] };
    const serialized = serializeModelAffinity(original);
    expect(serialized).toEqual(original);
  });
});
