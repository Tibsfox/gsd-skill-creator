import { describe, it, expect } from 'vitest';
import {
  isLegacyName,
  resolveIdentifier,
  suggestMigration,
} from './compat.js';

describe('isLegacyName', () => {
  it('returns true for old-style kebab-case names', () => {
    expect(isLegacyName('beautiful-commits')).toBe(true);
  });

  it('returns true for simple words', () => {
    expect(isLegacyName('myskill')).toBe(true);
  });

  it('returns true for empty string', () => {
    expect(isLegacyName('')).toBe(true);
  });

  it('returns false for valid AgentId', () => {
    expect(isLegacyName('F-1')).toBe(false);
  });

  it('returns false for valid SkillId', () => {
    expect(isLegacyName('F-1.rcp')).toBe(false);
  });

  it('returns false for valid AdapterId', () => {
    expect(isLegacyName('F-1:rcp')).toBe(false);
  });

  it('returns true for invalid prefix with number', () => {
    expect(isLegacyName('X-1')).toBe(true);
  });
});

describe('resolveIdentifier', () => {
  it('resolves valid AgentId', () => {
    const result = resolveIdentifier('F-1');
    expect(result).toEqual({
      resolved: true,
      type: 'agent',
      parsed: { domain: 'frontend', prefix: 'F', number: 1 },
    });
  });

  it('resolves valid SkillId', () => {
    const result = resolveIdentifier('F-1.rcp');
    expect(result).toEqual({
      resolved: true,
      type: 'skill',
      parsed: { agentId: 'F-1', abbreviation: 'rcp' },
    });
  });

  it('resolves valid AdapterId', () => {
    const result = resolveIdentifier('F-1:rcp');
    expect(result).toEqual({
      resolved: true,
      type: 'adapter',
      parsed: { agentId: 'F-1', abbreviation: 'rcp' },
    });
  });

  it('returns legacy resolution for old-style names', () => {
    const result = resolveIdentifier('beautiful-commits');
    expect(result).toEqual({
      resolved: false,
      legacy: true,
      name: 'beautiful-commits',
    });
  });

  it('returns legacy resolution for empty string', () => {
    const result = resolveIdentifier('');
    expect(result).toEqual({
      resolved: false,
      legacy: true,
      name: '',
    });
  });

  it('resolves all domain prefixes', () => {
    for (const prefix of ['F', 'B', 'T', 'I', 'O', 'S']) {
      const result = resolveIdentifier(`${prefix}-1`);
      expect(result.resolved).toBe(true);
      if (result.resolved) {
        expect(result.type).toBe('agent');
      }
    }
  });
});

describe('suggestMigration', () => {
  it('suggests migration for infrastructure skill', () => {
    const result = suggestMigration('beautiful-commits', 'Git commit message formatting');
    expect(result.legacyName).toBe('beautiful-commits');
    expect(result.domain).toBe('infrastructure');
    expect(result.suggestedId).toMatch(/^I-0\./);
    expect(result.confidence).toBeGreaterThanOrEqual(0.1);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('suggests migration for frontend skill', () => {
    const result = suggestMigration('react-patterns', 'React component patterns and best practices');
    expect(result.legacyName).toBe('react-patterns');
    expect(result.domain).toBe('frontend');
    expect(result.suggestedId).toMatch(/^F-0\./);
    expect(result.confidence).toBeGreaterThanOrEqual(0.1);
  });

  it('generates abbreviation from first word of legacy name', () => {
    const result = suggestMigration('beautiful-commits', 'Git commit formatting');
    // abbreviation derived from 'beautiful' -> first 3-4 consonants or chars
    expect(result.suggestedId).toMatch(/^[A-Z]-0\.[a-z0-9]+$/);
  });

  it('uses fallback abbreviation for empty name', () => {
    const result = suggestMigration('', 'some description');
    expect(result.suggestedId).toMatch(/^[A-Z]-0\.skl$/);
  });

  it('has minimum confidence of 0.1', () => {
    const result = suggestMigration('xyz', 'unknown thing with no keywords');
    expect(result.confidence).toBeGreaterThanOrEqual(0.1);
  });

  it('has higher confidence with more keyword hits', () => {
    const lowConfidence = suggestMigration('xyz', 'unknown thing');
    const highConfidence = suggestMigration('react-ui', 'React component UI layout render browser DOM');
    expect(highConfidence.confidence).toBeGreaterThan(lowConfidence.confidence);
  });
});
