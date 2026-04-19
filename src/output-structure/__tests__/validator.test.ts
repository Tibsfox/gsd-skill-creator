/**
 * Tests for `src/output-structure/validator.ts`
 *
 * Coverage:
 *   - validateOutputStructure: valid inputs (all 3 kinds), invalid inputs,
 *     string shorthand, unknown extra fields, empty required fields
 *   - parseOutputStructure: convenience wrapper
 */

import { describe, it, expect } from 'vitest';
import { validateOutputStructure, parseOutputStructure } from '../validator.js';

describe('validateOutputStructure — valid inputs', () => {
  it('accepts {kind: "prose"}', () => {
    const r = validateOutputStructure({ kind: 'prose' });
    expect(r.valid).toBe(true);
    expect(r.value).toEqual({ kind: 'prose' });
    expect(r.errors).toEqual([]);
  });

  it('accepts {kind: "json-schema", schema: "..."}', () => {
    const r = validateOutputStructure({ kind: 'json-schema', schema: '{"type":"object"}' });
    expect(r.valid).toBe(true);
    expect(r.value).toEqual({ kind: 'json-schema', schema: '{"type":"object"}' });
    expect(r.errors).toEqual([]);
  });

  it('accepts {kind: "markdown-template", template: "..."}', () => {
    const r = validateOutputStructure({ kind: 'markdown-template', template: '## H2\n{{body}}' });
    expect(r.valid).toBe(true);
    expect(r.value?.kind).toBe('markdown-template');
    expect(r.errors).toEqual([]);
  });

  it('accepts string shorthand "prose"', () => {
    const r = validateOutputStructure('prose');
    expect(r.valid).toBe(true);
    expect(r.value).toEqual({ kind: 'prose' });
    expect(r.errors).toEqual([]);
  });

  it('accepts string shorthand "json-schema" with warning', () => {
    const r = validateOutputStructure('json-schema');
    expect(r.valid).toBe(true);
    expect(r.warnings.length).toBeGreaterThan(0);
    expect(r.value?.kind).toBe('json-schema');
  });

  it('accepts string shorthand "markdown-template" with warning', () => {
    const r = validateOutputStructure('markdown-template');
    expect(r.valid).toBe(true);
    expect(r.warnings.length).toBeGreaterThan(0);
    expect(r.value?.kind).toBe('markdown-template');
  });

  it('warns on empty schema string for json-schema', () => {
    const r = validateOutputStructure({ kind: 'json-schema', schema: '' });
    expect(r.valid).toBe(true);
    expect(r.warnings.some(w => w.includes('empty'))).toBe(true);
  });

  it('warns on empty template string for markdown-template', () => {
    const r = validateOutputStructure({ kind: 'markdown-template', template: '' });
    expect(r.valid).toBe(true);
    expect(r.warnings.some(w => w.includes('empty'))).toBe(true);
  });

  it('warns on unknown extra fields', () => {
    const r = validateOutputStructure({ kind: 'prose', unexpectedField: 'foo' });
    expect(r.valid).toBe(true);
    expect(r.warnings.some(w => w.includes('unexpectedField'))).toBe(true);
  });
});

describe('validateOutputStructure — invalid inputs', () => {
  it('rejects null', () => {
    const r = validateOutputStructure(null);
    expect(r.valid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it('rejects array', () => {
    const r = validateOutputStructure([1, 2, 3]);
    expect(r.valid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it('rejects number', () => {
    const r = validateOutputStructure(42);
    expect(r.valid).toBe(false);
  });

  it('rejects object without kind field', () => {
    const r = validateOutputStructure({ schema: 'something' });
    expect(r.valid).toBe(false);
    expect(r.errors.some(e => e.includes('"kind"'))).toBe(true);
  });

  it('rejects invalid kind value', () => {
    const r = validateOutputStructure({ kind: 'xml-schema' });
    expect(r.valid).toBe(false);
    expect(r.errors.some(e => e.includes('xml-schema'))).toBe(true);
  });

  it('rejects unknown string shorthand', () => {
    const r = validateOutputStructure('free-text');
    expect(r.valid).toBe(false);
    expect(r.errors.some(e => e.includes('free-text'))).toBe(true);
  });

  it('rejects json-schema without schema field', () => {
    const r = validateOutputStructure({ kind: 'json-schema' });
    expect(r.valid).toBe(false);
    expect(r.errors.some(e => e.includes('"schema"'))).toBe(true);
  });

  it('rejects json-schema with non-string schema', () => {
    const r = validateOutputStructure({ kind: 'json-schema', schema: 42 });
    expect(r.valid).toBe(false);
  });

  it('rejects markdown-template without template field', () => {
    const r = validateOutputStructure({ kind: 'markdown-template' });
    expect(r.valid).toBe(false);
    expect(r.errors.some(e => e.includes('"template"'))).toBe(true);
  });

  it('rejects markdown-template with non-string template', () => {
    const r = validateOutputStructure({ kind: 'markdown-template', template: false });
    expect(r.valid).toBe(false);
  });
});

describe('parseOutputStructure', () => {
  it('returns typed value on valid input', () => {
    const v = parseOutputStructure({ kind: 'prose' });
    expect(v).toEqual({ kind: 'prose' });
  });

  it('returns undefined on invalid input', () => {
    const v = parseOutputStructure({ kind: 'bogus' });
    expect(v).toBeUndefined();
  });

  it('returns undefined for null', () => {
    expect(parseOutputStructure(null)).toBeUndefined();
  });
});
