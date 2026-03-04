import { describe, it, expect } from 'vitest';
import { spaceBetwenCartridge } from './cartridge.js';
import { CartridgePacker } from '../../../src/bundles/cartridge/cartridge-packer.js';
import { CartridgeUnpacker } from '../../../src/bundles/cartridge/cartridge-unpacker.js';
import { CartridgeRegistry } from '../../../src/bundles/cartridge/cartridge-registry.js';
import { validateCartridge } from '../../../src/bundles/cartridge/cartridge-validator.js';
import { audioEngineeringPack } from '../../../src/audio-engineering/audio-engineering-pack.js';
import { hardwareInfrastructurePack } from '../../../src/hardware-infrastructure/hardware-infrastructure-pack.js';
import { audioVocabularyIndex } from '../../../src/chipset/muse-vocabulary-index.js';

describe('Space Between Cartridge — Integration', () => {
  it('validates without errors', () => {
    const result = validateCartridge(spaceBetwenCartridge);
    expect(result.valid, result.errors.join('; ')).toBe(true);
  });

  it('has at least 30 concepts in deep map', () => {
    expect(spaceBetwenCartridge.deepMap.concepts.length).toBeGreaterThanOrEqual(30);
  });

  it('has 3 progression paths', () => {
    expect(spaceBetwenCartridge.deepMap.progressionPaths.length).toBe(3);
  });

  it('progression paths are navigable (all step IDs exist)', () => {
    const ids = new Set(spaceBetwenCartridge.deepMap.concepts.map((c) => c.id));
    for (const path of spaceBetwenCartridge.deepMap.progressionPaths) {
      for (const step of path.steps) {
        expect(ids.has(step), `path "${path.name}" references missing concept "${step}"`).toBe(true);
      }
    }
  });

  it('story arc has 9 chapters', () => {
    expect(spaceBetwenCartridge.story.chapters.length).toBe(9);
  });

  it('pack and unpack round-trip succeeds', () => {
    const packer = new CartridgePacker();
    const unpacker = new CartridgeUnpacker();
    const bundle = packer.pack(spaceBetwenCartridge);
    const restored = unpacker.unpack(bundle);
    expect(restored.id).toBe('space-between');
    expect(restored.deepMap.concepts.length).toBe(spaceBetwenCartridge.deepMap.concepts.length);
  });

  it('CartridgeRegistry discovers the cartridge', () => {
    const registry = new CartridgeRegistry();
    registry.register(spaceBetwenCartridge);
    expect(registry.get('space-between')).toBeDefined();
    expect(registry.search('audio').length).toBe(1);
  });

  it('chipset vocabulary overlaps with audio pack keywords', () => {
    const cartVocab = new Set(spaceBetwenCartridge.chipset.vocabulary);
    const audioKeywords = new Set(audioEngineeringPack.concepts.flatMap((c) => c.keywords));
    const overlap = [...cartVocab].filter((v) => audioKeywords.has(v));
    expect(overlap.length).toBeGreaterThan(0);
  });

  it('muse vocabulary terms overlap with audio pack concepts', () => {
    const museTerms = new Set(audioVocabularyIndex.entries.map((e) => e.term));
    const audioIds = new Set(audioEngineeringPack.concepts.map((c) => c.id));
    const overlap = [...museTerms].filter((t) => audioIds.has(t));
    expect(overlap.length).toBeGreaterThan(0);
  });

  it('hardware tier profiles match expected mesh roles', () => {
    for (const tier of hardwareInfrastructurePack.tiers) {
      const profile = hardwareInfrastructurePack.getProfile(tier.id);
      expect(profile, `no profile for tier ${tier.id}`).toBeDefined();
      expect(profile!.meshRole).toBe(tier.meshRole);
    }
  });

  it('all barrel exports resolve without error', async () => {
    const audioMod = await import('../../../src/audio-engineering/index.js');
    expect(audioMod.audioEngineeringPack).toBeDefined();
    const hwMod = await import('../../../src/hardware-infrastructure/index.js');
    expect(hwMod.hardwareInfrastructurePack).toBeDefined();
    const cartMod = await import('../../../src/bundles/cartridge/index.js');
    expect(cartMod.CartridgePacker).toBeDefined();
  });
});
