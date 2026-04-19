/**
 * Tests for `src/output-structure/frontmatter.ts`
 *
 * Coverage:
 *   - resolveOutputStructure: default (null/undefined), explicit, shorthand,
 *     invalid (fallback), round-trip validation (LS-25)
 *   - serializeOutputStructure: all kinds, compact mode
 *   - DEFAULT_OUTPUT_STRUCTURE constant
 */

import { describe, it, expect } from 'vitest';
import {
  resolveOutputStructure,
  serializeOutputStructure,
  DEFAULT_OUTPUT_STRUCTURE,
} from '../frontmatter.js';

describe('DEFAULT_OUTPUT_STRUCTURE', () => {
  it('is prose (conservative default per CF-ME5-04)', () => {
    expect(DEFAULT_OUTPUT_STRUCTURE.kind).toBe('prose');
  });

  it('is frozen', () => {
    expect(Object.isFrozen(DEFAULT_OUTPUT_STRUCTURE)).toBe(true);
  });
});

describe('resolveOutputStructure — default (CF-ME5-04)', () => {
  it('returns prose default for null', () => {
    const r = resolveOutputStructure(null);
    expect(r.structure.kind).toBe('prose');
    expect(r.source).toBe('default');
    expect(r.warnings).toEqual([]);
  });

  it('returns prose default for undefined', () => {
    const r = resolveOutputStructure(undefined);
    expect(r.structure.kind).toBe('prose');
    expect(r.source).toBe('default');
  });
});

describe('resolveOutputStructure — explicit valid inputs', () => {
  it('resolves {kind: "prose"} as explicit', () => {
    const r = resolveOutputStructure({ kind: 'prose' });
    expect(r.structure.kind).toBe('prose');
    expect(r.source).toBe('explicit');
    expect(r.warnings).toEqual([]);
  });

  it('resolves json-schema as explicit', () => {
    const r = resolveOutputStructure({ kind: 'json-schema', schema: '{"type":"object"}' });
    expect(r.structure.kind).toBe('json-schema');
    expect(r.source).toBe('explicit');
    if (r.structure.kind === 'json-schema') {
      expect(r.structure.schema).toBe('{"type":"object"}');
    }
  });

  it('resolves markdown-template as explicit', () => {
    const r = resolveOutputStructure({ kind: 'markdown-template', template: '## Section' });
    expect(r.structure.kind).toBe('markdown-template');
    expect(r.source).toBe('explicit');
  });
});

describe('resolveOutputStructure — string shorthand', () => {
  it('resolves string "prose" as shorthand', () => {
    const r = resolveOutputStructure('prose');
    expect(r.structure.kind).toBe('prose');
    expect(r.source).toBe('shorthand');
  });

  it('resolves string "json-schema" as shorthand with warning', () => {
    const r = resolveOutputStructure('json-schema');
    expect(r.structure.kind).toBe('json-schema');
    expect(r.source).toBe('shorthand');
    expect(r.warnings.length).toBeGreaterThan(0);
  });
});

describe('resolveOutputStructure — invalid input (fallback to default)', () => {
  it('falls back to prose default on invalid object', () => {
    const r = resolveOutputStructure({ kind: 'not-a-real-kind' });
    expect(r.structure.kind).toBe('prose');
    expect(r.source).toBe('default');
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it('falls back to prose default on array', () => {
    const r = resolveOutputStructure([1, 2, 3]);
    expect(r.structure.kind).toBe('prose');
    expect(r.source).toBe('default');
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it('falls back to prose default when json-schema missing schema', () => {
    const r = resolveOutputStructure({ kind: 'json-schema' });
    expect(r.structure.kind).toBe('prose');
    expect(r.source).toBe('default');
    expect(r.warnings.some(w => w.includes('schema'))).toBe(true);
  });
});

describe('resolveOutputStructure — round-trip (LS-25)', () => {
  it('json-schema round-trips: resolve → serialize → resolve', () => {
    const original = { kind: 'json-schema', schema: '{"type":"object"}' } as const;
    const resolved = resolveOutputStructure(original);
    const serialized = serializeOutputStructure(resolved.structure);
    const roundTripped = resolveOutputStructure(serialized);
    expect(roundTripped.structure).toEqual(resolved.structure);
  });

  it('markdown-template round-trips', () => {
    const original = { kind: 'markdown-template', template: '## Title\n{{body}}' } as const;
    const resolved = resolveOutputStructure(original);
    const serialized = serializeOutputStructure(resolved.structure);
    const roundTripped = resolveOutputStructure(serialized);
    expect(roundTripped.structure).toEqual(resolved.structure);
  });

  it('prose round-trips', () => {
    const original = { kind: 'prose' } as const;
    const resolved = resolveOutputStructure(original);
    const serialized = serializeOutputStructure(resolved.structure);
    // Non-compact serialize returns an object; re-resolve that
    const roundTripped = resolveOutputStructure(serialized);
    expect(roundTripped.structure.kind).toBe('prose');
  });
});

describe('serializeOutputStructure', () => {
  it('emits {kind: "prose"} for prose', () => {
    const out = serializeOutputStructure({ kind: 'prose' });
    expect(out).toEqual({ kind: 'prose' });
  });

  it('emits kind + schema for json-schema', () => {
    const out = serializeOutputStructure({ kind: 'json-schema', schema: 'foo' });
    expect(out).toEqual({ kind: 'json-schema', schema: 'foo' });
  });

  it('emits kind + template for markdown-template', () => {
    const out = serializeOutputStructure({ kind: 'markdown-template', template: 'bar' });
    expect(out).toEqual({ kind: 'markdown-template', template: 'bar' });
  });

  it('compact mode returns undefined for prose (default)', () => {
    const out = serializeOutputStructure({ kind: 'prose' }, true);
    expect(out).toBeUndefined();
  });

  it('compact mode returns object for json-schema (non-default)', () => {
    const out = serializeOutputStructure({ kind: 'json-schema', schema: 'x' }, true);
    expect(out).not.toBeUndefined();
    expect(out?.kind).toBe('json-schema');
  });
});
