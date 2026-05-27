import { describe, it, expect } from 'vitest';
import { getFlagValue, type FlagLookup } from './flag-lookup.js';

describe('getFlagValue / FlagLookup', () => {
  it('returns { present: false } when flag is absent', () => {
    const result = getFlagValue(['--bar', 'baz'], '--foo');
    expect(result).toEqual({ present: false } satisfies FlagLookup);
  });

  it('returns { present: true, value } when flag is followed by a value', () => {
    const result = getFlagValue(['--foo', 'bar'], '--foo');
    expect(result).toEqual({ present: true, value: 'bar' } satisfies FlagLookup);
  });

  it('returns { present: true, value: null } when flag is trailing (no value)', () => {
    const result = getFlagValue(['--bar', '--foo'], '--foo');
    expect(result).toEqual({ present: true, value: null } satisfies FlagLookup);
  });

  it('returns { present: true, value: "" } when the value is the empty string', () => {
    const result = getFlagValue(['--foo', ''], '--foo');
    expect(result).toEqual({ present: true, value: '' } satisfies FlagLookup);
  });

  it('returns the FIRST occurrence when the flag appears multiple times', () => {
    const result = getFlagValue(['--foo', 'first', '--foo', 'second'], '--foo');
    expect(result).toEqual({ present: true, value: 'first' } satisfies FlagLookup);
  });

  it('handles flag immediately preceded by another flag', () => {
    const result = getFlagValue(['--bar', '--foo', 'val'], '--foo');
    expect(result).toEqual({ present: true, value: 'val' } satisfies FlagLookup);
  });

  it('treats the empty arg list as flag-absent', () => {
    const result = getFlagValue([], '--foo');
    expect(result).toEqual({ present: false } satisfies FlagLookup);
  });
});
