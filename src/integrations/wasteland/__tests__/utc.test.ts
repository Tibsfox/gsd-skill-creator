/**
 * UTC Timestamp Enforcement Tests
 */

import { describe, it, expect } from 'vitest';
import { isUTC, assertUTC, toUTCString, parseUTC, normalizeToUTC } from '../utc.js';

describe('isUTC', () => {
  it('accepts Z-suffix timestamps', () => {
    expect(isUTC('2026-03-09T14:30:00Z')).toBe(true);
    expect(isUTC('2026-03-09T14:30:00.000Z')).toBe(true);
    expect(isUTC('2026-03-09T14:30:00.123456Z')).toBe(true);
  });

  it('rejects offset timestamps', () => {
    expect(isUTC('2026-03-09T14:30:00+00:00')).toBe(false);
    expect(isUTC('2026-03-09T14:30:00-07:00')).toBe(false);
  });

  it('rejects zone-less timestamps', () => {
    expect(isUTC('2026-03-09T14:30:00')).toBe(false);
    expect(isUTC('2026-03-09')).toBe(false);
  });

  it('rejects garbage', () => {
    expect(isUTC('')).toBe(false);
    expect(isUTC('not a date')).toBe(false);
  });
});

describe('assertUTC', () => {
  it('passes for valid UTC', () => {
    expect(() => assertUTC('2026-03-09T14:30:00Z')).not.toThrow();
  });

  it('throws for non-UTC with context', () => {
    expect(() => assertUTC('2026-03-09T14:30:00+00:00', 'rigs.registered_at'))
      .toThrow('rigs.registered_at: Timestamp must be UTC with Z suffix');
  });

  it('throws for non-UTC without context', () => {
    expect(() => assertUTC('2026-03-09'))
      .toThrow('Timestamp must be UTC with Z suffix');
  });
});

describe('toUTCString', () => {
  it('produces Z-suffix from Date', () => {
    const date = new Date('2026-03-09T14:30:00Z');
    const result = toUTCString(date);
    expect(result).toBe('2026-03-09T14:30:00.000Z');
    expect(isUTC(result)).toBe(true);
  });
});

describe('parseUTC', () => {
  it('parses valid UTC timestamps', () => {
    const date = parseUTC('2026-03-09T14:30:00Z');
    expect(date.getTime()).toBe(new Date('2026-03-09T14:30:00Z').getTime());
  });

  it('rejects non-UTC timestamps', () => {
    expect(() => parseUTC('2026-03-09T14:30:00+00:00', 'test'))
      .toThrow('test: Timestamp must be UTC with Z suffix');
  });
});

describe('normalizeToUTC', () => {
  it('passes through Z-suffix timestamps unchanged', () => {
    expect(normalizeToUTC('2026-03-09T14:30:00Z')).toBe('2026-03-09T14:30:00Z');
    expect(normalizeToUTC('2026-03-09T14:30:00.000Z')).toBe('2026-03-09T14:30:00.000Z');
  });

  it('converts +00:00 to Z', () => {
    expect(normalizeToUTC('2026-03-09T14:30:00+00:00')).toBe('2026-03-09T14:30:00Z');
  });

  it('rejects non-UTC offsets', () => {
    expect(() => normalizeToUTC('2026-03-09T14:30:00-07:00', 'test'))
      .toThrow('test: Cannot normalize non-UTC timestamp');
  });

  it('rejects zone-less timestamps', () => {
    expect(() => normalizeToUTC('2026-03-09T14:30:00'))
      .toThrow('Cannot normalize non-UTC timestamp');
  });
});
