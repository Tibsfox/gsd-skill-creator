import { describe, it, expect } from 'vitest';
import {
  CartridgeSchema,
  CartridgeBundleSchema,
  DeepMapSchema,
  StoryArcSchema,
  CartridgeChipsetSchema,
  ConceptNodeSchema,
  ConceptConnectionSchema,
  ProgressionPathSchema,
  StoryChapterSchema,
  CartridgeTrustSchema,
} from './types.js';

describe('cartridge types', () => {
  const validConcept = {
    id: 'wave-equation',
    name: 'Wave Equation',
    description: 'Mathematical description of wave propagation',
    chapter: 4,
    depth: 'scan' as const,
    tags: ['math', 'physics'],
  };

  const validConnection = {
    from: 'wave-equation',
    to: 'harmonic-series',
    relationship: 'builds-on',
    strength: 0.8,
  };

  const validPath = {
    id: 'audio-thread',
    name: 'The Audio Thread',
    description: 'Follow the sound',
    steps: ['wave-equation', 'harmonic-series'],
  };

  const validDeepMap = {
    concepts: [validConcept],
    connections: [validConnection],
    entryPoints: ['wave-equation'],
    progressionPaths: [validPath],
  };

  const validChapter = {
    id: 'ch-1',
    title: 'The Note Between the Notes',
    summary: 'Prelude to the journey',
    conceptRefs: ['wave-equation'],
  };

  const validStory = {
    title: 'The Space Between',
    narrative: 'A story about resonance',
    chapters: [validChapter],
    throughLine: 'The space you leave for what comes next',
  };

  const validChipset = {
    vocabulary: ['overtone', 'resonance'],
    orientation: { angle: Math.PI / 4, magnitude: 0.8 },
    voice: { tone: 'poetic-technical', style: 'narrative' as const },
    museAffinity: ['foxy', 'sam'],
  };

  const validCartridge = {
    id: 'space-between',
    name: 'The Space Between',
    version: '1.0.0',
    author: 'Maple + Claude',
    description: 'Audio-mesh educational cartridge',
    trust: 'system' as const,
    deepMap: validDeepMap,
    story: validStory,
    chipset: validChipset,
  };

  it('validates a correct ConceptNode', () => {
    expect(ConceptNodeSchema.safeParse(validConcept).success).toBe(true);
  });

  it('rejects ConceptNode with empty id', () => {
    expect(ConceptNodeSchema.safeParse({ ...validConcept, id: '' }).success).toBe(false);
  });

  it('validates a correct ConceptConnection', () => {
    expect(ConceptConnectionSchema.safeParse(validConnection).success).toBe(true);
  });

  it('rejects connection with out-of-range strength', () => {
    expect(ConceptConnectionSchema.safeParse({ ...validConnection, strength: 1.5 }).success).toBe(false);
  });

  it('validates a correct ProgressionPath', () => {
    expect(ProgressionPathSchema.safeParse(validPath).success).toBe(true);
  });

  it('rejects path with no steps', () => {
    expect(ProgressionPathSchema.safeParse({ ...validPath, steps: [] }).success).toBe(false);
  });

  it('validates a correct DeepMap', () => {
    expect(DeepMapSchema.safeParse(validDeepMap).success).toBe(true);
  });

  it('rejects deep map with no concepts', () => {
    expect(DeepMapSchema.safeParse({ ...validDeepMap, concepts: [] }).success).toBe(false);
  });

  it('validates a correct StoryChapter', () => {
    expect(StoryChapterSchema.safeParse(validChapter).success).toBe(true);
  });

  it('validates a correct StoryArc', () => {
    expect(StoryArcSchema.safeParse(validStory).success).toBe(true);
  });

  it('validates a correct CartridgeChipset', () => {
    expect(CartridgeChipsetSchema.safeParse(validChipset).success).toBe(true);
  });

  it('rejects chipset with empty vocabulary', () => {
    expect(CartridgeChipsetSchema.safeParse({ ...validChipset, vocabulary: [] }).success).toBe(false);
  });

  it('validates trust levels', () => {
    expect(CartridgeTrustSchema.safeParse('system').success).toBe(true);
    expect(CartridgeTrustSchema.safeParse('user').success).toBe(true);
    expect(CartridgeTrustSchema.safeParse('community').success).toBe(true);
    expect(CartridgeTrustSchema.safeParse('unknown').success).toBe(false);
  });

  it('validates a complete Cartridge', () => {
    expect(CartridgeSchema.safeParse(validCartridge).success).toBe(true);
  });

  it('validates a CartridgeBundle', () => {
    const bundle = {
      format: 'cartridge-v1',
      cartridge: validCartridge,
      packedAt: new Date().toISOString(),
    };
    expect(CartridgeBundleSchema.safeParse(bundle).success).toBe(true);
  });

  it('passes through unknown fields for forward compatibility', () => {
    const extended = { ...validCartridge, futureField: 'hello' };
    const result = CartridgeSchema.safeParse(extended);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.futureField).toBe('hello');
    }
  });
});
