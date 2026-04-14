/**
 * Fork tests — FK-01..FK-04.
 */

import { describe, expect, it } from 'vitest';
import { forkCartridge } from '../fork.js';
import type { Cartridge } from '../types.js';

const source: Cartridge = {
  id: 'original',
  name: 'Original',
  version: '0.1.0',
  author: 'tibsfox',
  description: 'Source cartridge.',
  trust: 'system',
  provenance: {
    origin: 'tibsfox',
    createdAt: '2026-04-14T00:00:00Z',
  },
  chipsets: [
    {
      kind: 'grove',
      namespace: 'original',
      record_types: [{ name: 'R', description: 'r' }],
    },
  ],
};

describe('forkCartridge', () => {
  it('FK-01 produces a cartridge with a new id and forkOf provenance', () => {
    const forked = forkCartridge(source, { newId: 'forked' });
    expect(forked.id).toBe('forked');
    expect(forked.provenance.forkOf).toBe('original');
    expect(forked.provenance.origin).toBe('fork');
  });

  it('FK-02 does not mutate the source cartridge', () => {
    forkCartridge(source, { newId: 'forked' });
    expect(source.id).toBe('original');
    expect(source.provenance.origin).toBe('tibsfox');
  });

  it('FK-03 applies new trust/author/name when provided', () => {
    const forked = forkCartridge(source, {
      newId: 'forked',
      newName: 'Forked',
      newTrust: 'user',
      author: 'alice',
      buildSession: 'session-xyz',
    });
    expect(forked.name).toBe('Forked');
    expect(forked.trust).toBe('user');
    expect(forked.author).toBe('alice');
    expect(forked.provenance.buildSession).toBe('session-xyz');
  });

  it('FK-04 rejects same-id fork', () => {
    expect(() => forkCartridge(source, { newId: 'original' })).toThrow(/must differ/);
    expect(() => forkCartridge(source, { newId: '' })).toThrow(/required/);
  });
});
