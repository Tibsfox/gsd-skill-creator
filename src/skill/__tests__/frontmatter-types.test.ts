import { describe, it, expect } from 'vitest';
import {
  SkillFrontmatterSchema,
  normalizeSkillFrontmatter,
  isDeprecated,
  isRetired,
  isLoadable,
  SKILL_FORMAT_DATE,
} from '../frontmatter-types.js';

describe('SkillFrontmatterSchema', () => {
  it('accepts minimal frontmatter with just name + description', () => {
    const r = SkillFrontmatterSchema.parse({
      name: 'example',
      description: 'does something useful',
    });
    expect(r.name).toBe('example');
  });

  it('rejects descriptions over 250 chars', () => {
    const long = 'x'.repeat(251);
    const r = SkillFrontmatterSchema.safeParse({ name: 'x', description: long });
    expect(r.success).toBe(false);
  });

  it('rejects invalid status', () => {
    const r = SkillFrontmatterSchema.safeParse({
      name: 'x',
      description: 'y',
      status: 'nope',
    });
    expect(r.success).toBe(false);
  });

  it('rejects malformed updated date', () => {
    const r = SkillFrontmatterSchema.safeParse({
      name: 'x',
      description: 'y',
      updated: 'April 15',
    });
    expect(r.success).toBe(false);
  });

  it('accepts full lifecycle frontmatter', () => {
    const r = SkillFrontmatterSchema.parse({
      name: 'example',
      description: 'does something',
      format: SKILL_FORMAT_DATE,
      version: '1.0.0',
      status: 'active',
      updated: '2026-04-15',
      deprecated_by: null,
    });
    expect(r.version).toBe('1.0.0');
  });

  it('passes through unknown fields', () => {
    const r = SkillFrontmatterSchema.parse({
      name: 'x',
      description: 'y',
      license: 'MIT',
    } as never);
    expect((r as { license?: string }).license).toBe('MIT');
  });
});

describe('normalizeSkillFrontmatter', () => {
  it('defaults status to active and format to current format date', () => {
    const r = normalizeSkillFrontmatter({ name: 'x', description: 'y' });
    expect(r.status).toBe('active');
    expect(r.format).toBe(SKILL_FORMAT_DATE);
  });

  it('preserves explicit values', () => {
    const r = normalizeSkillFrontmatter({
      name: 'x',
      description: 'y',
      status: 'deprecated',
      format: '2024-01-01',
    });
    expect(r.status).toBe('deprecated');
    expect(r.format).toBe('2024-01-01');
  });
});

describe('lifecycle predicates', () => {
  it('isDeprecated / isRetired identify their states', () => {
    expect(isDeprecated({ name: 'x', description: 'y', status: 'deprecated' })).toBe(true);
    expect(isRetired({ name: 'x', description: 'y', status: 'retired' })).toBe(true);
    expect(isDeprecated({ name: 'x', description: 'y', status: 'active' })).toBe(false);
  });

  it('isLoadable returns true for active and deprecated, false for retired', () => {
    expect(isLoadable({ name: 'x', description: 'y', status: 'active' })).toBe(true);
    expect(isLoadable({ name: 'x', description: 'y', status: 'deprecated' })).toBe(true);
    expect(isLoadable({ name: 'x', description: 'y', status: 'retired' })).toBe(false);
    expect(isLoadable({ name: 'x', description: 'y' })).toBe(true);
  });
});
