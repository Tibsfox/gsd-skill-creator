import { describe, it, expect } from 'vitest';
import {
  encodeIdentifierMetadata,
  decodeIdentifierMetadata,
  formatForFrontmatter,
} from './metadata.js';
import type { IdentifierMetadata } from './metadata.js';

describe('encodeIdentifierMetadata', () => {
  it('encodes a valid SkillId', () => {
    const result = encodeIdentifierMetadata('F-1.rcp');
    expect(result).toEqual({
      id: 'F-1.rcp',
      domain: 'frontend',
      prefix: 'F',
    });
  });

  it('encodes a valid AgentId', () => {
    const result = encodeIdentifierMetadata('B-3');
    expect(result).toEqual({
      id: 'B-3',
      domain: 'backend',
      prefix: 'B',
    });
  });

  it('encodes a valid AdapterId', () => {
    const result = encodeIdentifierMetadata('S-2:lora');
    expect(result).toEqual({
      id: 'S-2:lora',
      domain: 'silicon',
      prefix: 'S',
    });
  });

  it('includes legacyName when provided', () => {
    const result = encodeIdentifierMetadata('F-1.rcp', 'my-old-skill');
    expect(result).toEqual({
      id: 'F-1.rcp',
      domain: 'frontend',
      prefix: 'F',
      legacyName: 'my-old-skill',
    });
  });

  it('returns null for invalid identifier', () => {
    expect(encodeIdentifierMetadata('invalid')).toBeNull();
    expect(encodeIdentifierMetadata('')).toBeNull();
    expect(encodeIdentifierMetadata('X-1')).toBeNull();
  });
});

describe('decodeIdentifierMetadata', () => {
  it('extracts essential fields without legacyName', () => {
    const metadata: IdentifierMetadata = {
      id: 'F-1.rcp',
      domain: 'frontend',
      prefix: 'F',
    };
    const result = decodeIdentifierMetadata(metadata);
    expect(result).toEqual({
      id: 'F-1.rcp',
      domain: 'frontend',
    });
    expect(result).not.toHaveProperty('legacyName');
  });

  it('includes legacyName when present', () => {
    const metadata: IdentifierMetadata = {
      id: 'F-1.rcp',
      domain: 'frontend',
      prefix: 'F',
      legacyName: 'my-old-skill',
    };
    const result = decodeIdentifierMetadata(metadata);
    expect(result).toEqual({
      id: 'F-1.rcp',
      domain: 'frontend',
      legacyName: 'my-old-skill',
    });
  });
});

describe('formatForFrontmatter', () => {
  it('produces YAML without legacy name', () => {
    const metadata: IdentifierMetadata = {
      id: 'F-1.rcp',
      domain: 'frontend',
      prefix: 'F',
    };
    const result = formatForFrontmatter(metadata);
    expect(result).toContain('identifier:');
    expect(result).toContain('  id: F-1.rcp');
    expect(result).toContain('  domain: frontend');
    expect(result).toContain('  prefix: F');
    expect(result).not.toContain('legacy_name');
  });

  it('produces YAML with legacy name', () => {
    const metadata: IdentifierMetadata = {
      id: 'F-1.rcp',
      domain: 'frontend',
      prefix: 'F',
      legacyName: 'my-old-skill',
    };
    const result = formatForFrontmatter(metadata);
    expect(result).toContain('identifier:');
    expect(result).toContain('  id: F-1.rcp');
    expect(result).toContain('  domain: frontend');
    expect(result).toContain('  prefix: F');
    expect(result).toContain('  legacy_name: my-old-skill');
  });

  it('uses 2-space indentation', () => {
    const metadata: IdentifierMetadata = {
      id: 'B-3.api',
      domain: 'backend',
      prefix: 'B',
    };
    const result = formatForFrontmatter(metadata);
    const lines = result.split('\n').filter(l => l.trim());
    // First line: 'identifier:' (no indent within the block)
    expect(lines[0]).toBe('identifier:');
    // Subsequent lines: 2-space indent
    for (let i = 1; i < lines.length; i++) {
      expect(lines[i]).toMatch(/^ {2}\w/);
    }
  });

  it('produces multi-line output', () => {
    const metadata: IdentifierMetadata = {
      id: 'T-1.unit',
      domain: 'testing',
      prefix: 'T',
    };
    const result = formatForFrontmatter(metadata);
    const lines = result.split('\n').filter(l => l.trim());
    expect(lines.length).toBeGreaterThanOrEqual(4); // identifier: + id + domain + prefix
  });
});
