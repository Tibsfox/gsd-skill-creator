/**
 * focus-state.ts — codec tests (minimum 6).
 */

import { describe, it, expect } from 'vitest';
import { parseHash, serializeHash } from '../focus-state.js';
import type { Focus } from '../focus-state.js';

describe('parseHash', () => {
  it('parses a file hash', () => {
    const f = parseHash('#atlas/file/src/foo.ts');
    expect(f).toEqual({ kind: 'file', id: 'src/foo.ts' });
  });

  it('parses a symbol hash with encoded characters', () => {
    const encoded = '#atlas/symbol/ts%3Asrc%2Ffoo.ts%3AMyClass';
    const f = parseHash(encoded);
    expect(f).toEqual({ kind: 'symbol', id: 'ts:src/foo.ts:MyClass' });
  });

  it('parses a folder hash', () => {
    const f = parseHash('#atlas/folder/src/utils');
    expect(f).toEqual({ kind: 'folder', id: 'src/utils' });
  });

  it('parses a mission hash', () => {
    const f = parseHash('#atlas/mission/v1.49.606');
    expect(f).toEqual({ kind: 'mission', id: 'v1.49.606' });
  });

  it('returns null for malformed hash', () => {
    expect(parseHash('#notAtlas/file/foo')).toBeNull();
    expect(parseHash('#atlas/badkind/foo')).toBeNull();
    expect(parseHash('#atlas/file/')).toBeNull();
    expect(parseHash('')).toBeNull();
  });

  it('returns null for empty hash', () => {
    expect(parseHash('#')).toBeNull();
  });

  it('accepts hash without leading #', () => {
    const f = parseHash('atlas/folder/desktop');
    expect(f).toEqual({ kind: 'folder', id: 'desktop' });
  });
});

describe('serializeHash', () => {
  it('round-trips a file focus', () => {
    const focus: Focus = { kind: 'file', id: 'src/foo.ts' };
    const hash = serializeHash(focus);
    expect(parseHash(hash)).toEqual(focus);
  });

  it('round-trips a symbol focus with special chars', () => {
    const focus: Focus = { kind: 'symbol', id: 'ts:src/foo.ts:MyClass' };
    const hash = serializeHash(focus);
    expect(parseHash(hash)).toEqual(focus);
  });

  it('produces expected hash format', () => {
    const hash = serializeHash({ kind: 'mission', id: 'v1.49.606' });
    expect(hash).toBe('#atlas/mission/v1.49.606');
  });
});
