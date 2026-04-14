/**
 * Migration tests — MG-01..MG-03.
 */

import { describe, expect, it } from 'vitest';
import { migrateLegacyCartridge } from '../migrate.js';
import type { Cartridge as LegacyCartridge } from '../../bundles/cartridge/types.js';

const legacy: LegacyCartridge = {
  id: 'legacy-one',
  name: 'Legacy One',
  version: '1.0.0',
  author: 'someone',
  description: 'A legacy content cartridge.',
  trust: 'community',
  deepMap: {
    concepts: [
      { id: 'c1', name: 'C1', description: 'first', depth: 'read', tags: [] },
    ],
    connections: [],
    entryPoints: ['c1'],
    progressionPaths: [
      { id: 'p1', name: 'Path', description: 'p', steps: ['c1'] },
    ],
  },
  story: {
    title: 'Legacy One',
    narrative: 'narrative',
    chapters: [
      { id: 'ch1', title: 'Chapter', summary: 's', conceptRefs: ['c1'] },
    ],
    throughLine: 'through',
  },
  chipset: {
    vocabulary: ['v'],
    orientation: { angle: 0, magnitude: 1 },
    voice: { tone: 'neutral', style: 'narrative' },
  },
};

describe('migrateLegacyCartridge', () => {
  it('MG-01 produces a unified cartridge with migrate provenance', () => {
    const unified = migrateLegacyCartridge(legacy);
    expect(unified.id).toBe('legacy-one');
    expect(unified.provenance.origin).toBe('migrate');
    expect(unified.chipsets.map((c) => c.kind).sort()).toEqual(['content', 'voice']);
  });

  it('MG-02 preserves id by default and overrides when requested', () => {
    const preserved = migrateLegacyCartridge(legacy);
    expect(preserved.id).toBe('legacy-one');

    const renamed = migrateLegacyCartridge(legacy, {
      preserveId: false,
      newId: 'legacy-one-v2',
    });
    expect(renamed.id).toBe('legacy-one-v2');
  });

  it('MG-03 stamps sourceCommits, buildSession, and author', () => {
    const unified = migrateLegacyCartridge(legacy, {
      author: 'migrator',
      buildSession: 'session-migrate-1',
      sourceCommits: ['abc123'],
    });
    expect(unified.author).toBe('migrator');
    expect(unified.provenance.buildSession).toBe('session-migrate-1');
    expect(unified.provenance.sourceCommits).toEqual(['abc123']);
  });
});
