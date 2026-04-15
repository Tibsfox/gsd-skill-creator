import { describe, it, expect } from 'vitest';
import {
  MemoryFrontmatterSchema,
  estimateTokenCount,
  tagsMatch,
} from '../tag-types.js';

describe('MemoryFrontmatterSchema', () => {
  it('accepts minimal valid frontmatter', () => {
    const r = MemoryFrontmatterSchema.parse({ name: 'x', type: 'user', tags: [] });
    expect(r.name).toBe('x');
    expect(r.tags).toEqual([]);
  });

  it('defaults tags to empty array', () => {
    const r = MemoryFrontmatterSchema.parse({ name: 'x', type: 'project' });
    expect(r.tags).toEqual([]);
  });

  it('rejects invalid memory type', () => {
    const r = MemoryFrontmatterSchema.safeParse({ name: 'x', type: 'bogus', tags: [] });
    expect(r.success).toBe(false);
  });

  it('accepts full frontmatter with token_count', () => {
    const r = MemoryFrontmatterSchema.parse({
      name: 'x',
      type: 'feedback',
      tags: ['testing', 'migrations'],
      token_count: 420,
      description: 'stuff',
    });
    expect(r.token_count).toBe(420);
  });

  it('rejects negative token_count', () => {
    const r = MemoryFrontmatterSchema.safeParse({
      name: 'x',
      type: 'user',
      tags: [],
      token_count: -1,
    });
    expect(r.success).toBe(false);
  });
});

describe('estimateTokenCount', () => {
  it('returns 0 for empty body', () => {
    expect(estimateTokenCount('')).toBe(0);
  });

  it('is monotonic in word count', () => {
    const short = estimateTokenCount('one two three');
    const longer = estimateTokenCount('one two three four five six seven eight');
    expect(longer).toBeGreaterThan(short);
  });

  it('returns a positive integer for any non-empty input', () => {
    const n = estimateTokenCount('hello world');
    expect(Number.isInteger(n)).toBe(true);
    expect(n).toBeGreaterThan(0);
  });
});

describe('tagsMatch', () => {
  it('returns 0 when either list is empty', () => {
    expect(tagsMatch([], ['foo'])).toBe(0);
    expect(tagsMatch(['foo'], [])).toBe(0);
  });

  it('is case-insensitive', () => {
    expect(tagsMatch(['Testing'], ['testing'])).toBeGreaterThan(0);
  });

  it('scales with hit count', () => {
    const one = tagsMatch(['a', 'b'], ['a', 'x']);
    const two = tagsMatch(['a', 'b'], ['a', 'b']);
    expect(two).toBeGreaterThan(one);
  });
});
