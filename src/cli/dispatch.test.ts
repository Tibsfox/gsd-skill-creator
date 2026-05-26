import { describe, it, expect } from 'vitest';
import { lookup, REGISTRY } from './dispatch.js';

describe('cli/dispatch', () => {
  it('returns undefined when command is undefined or empty', () => {
    expect(lookup(undefined)).toBeUndefined();
    expect(lookup('')).toBeUndefined();
  });

  it('returns undefined for an unregistered command', () => {
    expect(lookup('definitely-not-a-real-command-9c2f')).toBeUndefined();
  });

  it('rejects alias collisions across registry entries', () => {
    const seen = new Set<string>();
    for (const entry of REGISTRY) {
      for (const alias of entry.aliases) {
        expect(seen.has(alias), `duplicate alias "${alias}"`).toBe(false);
        seen.add(alias);
      }
    }
  });

  it('every registered handler is callable (function-typed)', () => {
    for (const entry of REGISTRY) {
      expect(typeof entry.handler).toBe('function');
      expect(entry.aliases.length, `entry has empty aliases array`).toBeGreaterThan(0);
    }
  });
});
