/**
 * Legacy adapter tests — the Space Between cartridge is the acceptance
 * test for lossless round-trip between the v1 content-cartridge schema
 * and the unified cartridge-forge schema.
 *
 * Test IDs covered: SC-03, RT-01 (content), RT-02 (voice), MG-01 (legacy
 * content cartridge → new cartridge).
 */

import { describe, expect, it, beforeAll } from 'vitest';
import type { Cartridge as LegacyCartridge } from '../../bundles/cartridge/types.js';
import {
  legacyToUnified,
  unifiedToLegacy,
  isLegacyAdapted,
} from '../legacy-adapter.js';
import type { Cartridge } from '../index.js';

// Space Between lives under data/ which is outside src/ rootDir. Load it via
// a runtime dynamic import so tsc's rootDir constraint is not tripped.
let spaceBetwenCartridge: LegacyCartridge;

beforeAll(async () => {
  // Path is stashed in a variable so tsc does not resolve it against rootDir.
  // The data/ tree is intentionally outside src/ but is a live part of the
  // project, loaded at runtime by vitest.
  const path = '../../../data/cartridges/space-between/cartridge.js';
  const mod = (await import(path)) as { spaceBetwenCartridge: LegacyCartridge };
  spaceBetwenCartridge = mod.spaceBetwenCartridge;
});

describe('legacy-adapter — Space Between round-trip (SC-03)', () => {
  it('SC-03 Space Between round-trips losslessly through the adapter', () => {
    const unified = legacyToUnified(spaceBetwenCartridge);
    const back = unifiedToLegacy(unified);
    expect(back).toEqual(spaceBetwenCartridge);
  });

  it('produces exactly 2 chipsets (content + voice) for a legacy cartridge', () => {
    const unified = legacyToUnified(spaceBetwenCartridge);
    expect(unified.chipsets).toHaveLength(2);
    expect(unified.chipsets.map((c) => c.kind).sort()).toEqual([
      'content',
      'voice',
    ]);
  });

  it('preserves every top-level identity field', () => {
    const unified = legacyToUnified(spaceBetwenCartridge);
    expect(unified.id).toBe(spaceBetwenCartridge.id);
    expect(unified.name).toBe(spaceBetwenCartridge.name);
    expect(unified.version).toBe(spaceBetwenCartridge.version);
    expect(unified.author).toBe(spaceBetwenCartridge.author);
    expect(unified.description).toBe(spaceBetwenCartridge.description);
    expect(unified.trust).toBe(spaceBetwenCartridge.trust);
  });

  it('stamps a legacy-adapter provenance recognizable by isLegacyAdapted', () => {
    const unified = legacyToUnified(spaceBetwenCartridge);
    expect(isLegacyAdapted(unified)).toBe(true);
    expect(unified.provenance.origin).toBe('legacy-adapter');
  });

  it('preserves every deepMap concept, connection, and entry point', () => {
    const unified = legacyToUnified(spaceBetwenCartridge);
    const content = unified.chipsets.find((c) => c.kind === 'content');
    expect(content).toBeDefined();
    if (content?.kind !== 'content') throw new Error('unreachable');
    expect(content.deepMap.concepts).toHaveLength(
      spaceBetwenCartridge.deepMap.concepts.length,
    );
    expect(content.deepMap.connections).toHaveLength(
      spaceBetwenCartridge.deepMap.connections.length,
    );
    expect(content.deepMap.entryPoints).toEqual(
      spaceBetwenCartridge.deepMap.entryPoints,
    );
  });

  it('preserves all story chapters and through-line', () => {
    const unified = legacyToUnified(spaceBetwenCartridge);
    const content = unified.chipsets.find((c) => c.kind === 'content');
    if (content?.kind !== 'content') throw new Error('unreachable');
    expect(content.story.chapters).toHaveLength(
      spaceBetwenCartridge.story.chapters.length,
    );
    expect(content.story.throughLine).toBe(
      spaceBetwenCartridge.story.throughLine,
    );
  });

  it('preserves the voice chipset vocabulary, orientation, and muse affinity', () => {
    const unified = legacyToUnified(spaceBetwenCartridge);
    const voice = unified.chipsets.find((c) => c.kind === 'voice');
    if (voice?.kind !== 'voice') throw new Error('unreachable');
    expect(voice.vocabulary).toEqual(spaceBetwenCartridge.chipset.vocabulary);
    expect(voice.orientation).toEqual(
      spaceBetwenCartridge.chipset.orientation,
    );
    expect(voice.voice).toEqual(spaceBetwenCartridge.chipset.voice);
    expect(voice.museAffinity).toEqual(
      spaceBetwenCartridge.chipset.museAffinity,
    );
  });
});

describe('legacy-adapter — synthetic legacy cartridges', () => {
  const minimalLegacy: LegacyCartridge = {
    id: 'test-legacy',
    name: 'Test Legacy',
    version: '1.0.0',
    author: 'tester',
    description: 'minimal legacy cartridge',
    trust: 'user',
    deepMap: {
      concepts: [
        {
          id: 'c1',
          name: 'Concept One',
          description: 'first concept',
          depth: 'glance',
          tags: ['test'],
        },
      ],
      connections: [],
      entryPoints: ['c1'],
      progressionPaths: [
        {
          id: 'p1',
          name: 'Path',
          description: 'a path',
          steps: ['c1'],
        },
      ],
    },
    story: {
      title: 'Test Story',
      narrative: 'A short tale.',
      chapters: [
        {
          id: 'ch1',
          title: 'Opening',
          summary: 'it begins',
          conceptRefs: ['c1'],
        },
      ],
      throughLine: 'Everything is a test.',
    },
    chipset: {
      vocabulary: ['alpha', 'beta'],
      orientation: { angle: 0.5, magnitude: 0.5 },
      voice: { tone: 'neutral', style: 'technical' },
    },
  };

  it('round-trips a minimal legacy cartridge without museAffinity', () => {
    const unified = legacyToUnified(minimalLegacy);
    const back = unifiedToLegacy(unified);
    expect(back).toEqual(minimalLegacy);
  });

  it('round-trips a legacy cartridge with dependencies and metadata', () => {
    const withExtras: LegacyCartridge = {
      ...minimalLegacy,
      dependencies: ['another-cart'],
      metadata: { foo: 'bar', nested: { n: 1 } },
    };
    const unified = legacyToUnified(withExtras);
    expect(unified.dependencies).toEqual(['another-cart']);
    expect(unified.metadata?.foo).toBe('bar');
    const back = unifiedToLegacy(unified);
    expect(back).toEqual(withExtras);
  });

  it('preserves museAffinity on voice chipset when present', () => {
    const withMuse: LegacyCartridge = {
      ...minimalLegacy,
      chipset: { ...minimalLegacy.chipset, museAffinity: ['foxy', 'maple'] },
    };
    const unified = legacyToUnified(withMuse);
    const voice = unified.chipsets.find((c) => c.kind === 'voice');
    if (voice?.kind !== 'voice') throw new Error('unreachable');
    expect(voice.museAffinity).toEqual(['foxy', 'maple']);
  });
});

describe('legacy-adapter — reverse direction errors', () => {
  const goodUnified: Cartridge = legacyToUnified({
    id: 'test',
    name: 'Test',
    version: '1.0.0',
    author: 'tester',
    description: 'test',
    trust: 'system',
    deepMap: {
      concepts: [
        { id: 'c', name: 'C', description: 'd', depth: 'glance', tags: [] },
      ],
      connections: [],
      entryPoints: ['c'],
      progressionPaths: [
        { id: 'p', name: 'P', description: 'd', steps: ['c'] },
      ],
    },
    story: {
      title: 'T',
      narrative: 'N',
      chapters: [{ id: 'ch', title: 'T', summary: 'S', conceptRefs: ['c'] }],
      throughLine: 'T',
    },
    chipset: {
      vocabulary: ['a'],
      orientation: { angle: 0, magnitude: 0 },
      voice: { tone: 't', style: 'technical' },
    },
  });

  it('rejects unified cartridges missing a content chipset', () => {
    const broken: Cartridge = {
      ...goodUnified,
      chipsets: goodUnified.chipsets.filter((c) => c.kind !== 'content'),
    };
    expect(() => unifiedToLegacy(broken)).toThrow(/content chipset/);
  });

  it('rejects unified cartridges missing a voice chipset', () => {
    const broken: Cartridge = {
      ...goodUnified,
      chipsets: goodUnified.chipsets.filter((c) => c.kind !== 'voice'),
    };
    expect(() => unifiedToLegacy(broken)).toThrow(/voice chipset/);
  });

  it('rejects unified cartridges containing non-legacy chipset kinds', () => {
    const broken: Cartridge = {
      ...goodUnified,
      chipsets: [
        ...goodUnified.chipsets,
        {
          kind: 'grove',
          namespace: 'extra',
          record_types: [{ name: 'X', description: 'extra record' }],
        },
      ],
    };
    expect(() => unifiedToLegacy(broken)).toThrow(/non-content\/voice/);
  });
});
