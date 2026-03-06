import { describe, it, expect } from 'vitest';
import { sqlEscape, screenForInjection } from '../sql-escape.js';

describe('sqlEscape', () => {
  it('doubles single quotes', () => {
    expect(sqlEscape("O'Brien")).toBe("O''Brien");
  });

  it('doubles backslashes', () => {
    expect(sqlEscape('back\\slash')).toBe('back\\\\slash');
  });

  it('strips null bytes', () => {
    expect(sqlEscape('null\x00byte')).toBe('nullbyte');
  });

  it('passes clean strings through unchanged', () => {
    expect(sqlEscape('normal text')).toBe('normal text');
  });

  it('handles empty strings safely', () => {
    expect(sqlEscape('')).toBe('');
  });

  it('handles multiple single quotes', () => {
    expect(sqlEscape("it's a 'test'")).toBe("it''s a ''test''");
  });
});

describe('screenForInjection', () => {
  it('returns safe for a clean SELECT query', () => {
    const result = screenForInjection("SELECT * FROM rigs WHERE handle = 'fox'");
    expect(result.safe).toBe(true);
    expect(result.threats).toEqual([]);
  });

  it('detects DROP, semicolons, and double-dash in a combined injection attempt', () => {
    const result = screenForInjection("'; DROP TABLE rigs; --");
    expect(result.safe).toBe(false);
    expect(result.threats.length).toBeGreaterThan(0);
  });

  it('detects double-dash SQL comment', () => {
    const result = screenForInjection('value -- comment');
    expect(result.safe).toBe(false);
    expect(result.threats).toContain('SQL comment (--)');
  });

  it('detects block comment', () => {
    const result = screenForInjection('value /* block */');
    expect(result.safe).toBe(false);
    expect(result.threats).toContain('block comment (/*)');
  });

  it('detects DELETE statement', () => {
    const result = screenForInjection('DELETE FROM stamps');
    expect(result.safe).toBe(false);
    expect(result.threats).toContain('DELETE statement');
  });

  it('detects UPDATE statement', () => {
    const result = screenForInjection('UPDATE rigs SET trust=99');
    expect(result.safe).toBe(false);
    expect(result.threats).toContain('UPDATE statement');
  });
});
