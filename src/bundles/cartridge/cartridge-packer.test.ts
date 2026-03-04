import { describe, it, expect } from 'vitest';
import { CartridgePacker } from './cartridge-packer.js';
import { CartridgeUnpacker } from './cartridge-unpacker.js';
import { CartridgeRegistry } from './cartridge-registry.js';
import { validateCartridge } from './cartridge-validator.js';
import type { Cartridge } from './types.js';

function makeValidCartridge(overrides?: Partial<Cartridge>): Cartridge {
  return {
    id: 'test-cartridge',
    name: 'Test Cartridge',
    version: '1.0.0',
    author: 'Test',
    description: 'A test cartridge',
    trust: 'system',
    deepMap: {
      concepts: [
        { id: 'c1', name: 'Concept 1', description: 'First', depth: 'glance', tags: ['a'] },
        { id: 'c2', name: 'Concept 2', description: 'Second', depth: 'scan', tags: ['b'] },
      ],
      connections: [{ from: 'c1', to: 'c2', relationship: 'builds-on', strength: 0.7 }],
      entryPoints: ['c1'],
      progressionPaths: [{ id: 'main', name: 'Main Path', description: 'Walk through', steps: ['c1', 'c2'] }],
    },
    story: {
      title: 'Test Story',
      narrative: 'Once upon a time...',
      chapters: [{ id: 'ch1', title: 'Chapter 1', summary: 'Beginning', conceptRefs: ['c1'] }],
      throughLine: 'Testing is important',
    },
    chipset: {
      vocabulary: ['concept', 'test'],
      orientation: { angle: 0, magnitude: 0.5 },
      voice: { tone: 'neutral', style: 'technical' },
    },
    ...overrides,
  };
}

describe('CartridgeValidator', () => {
  it('validates a correct cartridge', () => {
    const result = validateCartridge(makeValidCartridge());
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects invalid concept references in connections', () => {
    const cartridge = makeValidCartridge();
    cartridge.deepMap.connections.push({ from: 'c1', to: 'nonexistent', relationship: 'x', strength: 0.5 });
    const result = validateCartridge(cartridge);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('nonexistent'))).toBe(true);
  });

  it('rejects invalid entry points', () => {
    const cartridge = makeValidCartridge();
    cartridge.deepMap.entryPoints.push('missing');
    const result = validateCartridge(cartridge);
    expect(result.valid).toBe(false);
  });

  it('rejects invalid progression path steps', () => {
    const cartridge = makeValidCartridge();
    cartridge.deepMap.progressionPaths[0].steps.push('missing');
    const result = validateCartridge(cartridge);
    expect(result.valid).toBe(false);
  });

  it('warns on invalid story chapter conceptRefs', () => {
    const cartridge = makeValidCartridge();
    cartridge.story.chapters[0].conceptRefs.push('unknown');
    const result = validateCartridge(cartridge);
    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('rejects duplicate concept IDs', () => {
    const cartridge = makeValidCartridge();
    cartridge.deepMap.concepts.push({ id: 'c1', name: 'Dup', description: 'Dup', depth: 'read', tags: [] });
    const result = validateCartridge(cartridge);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('duplicate'))).toBe(true);
  });
});

describe('CartridgePacker', () => {
  const packer = new CartridgePacker();

  it('packs a valid cartridge', () => {
    const bundle = packer.pack(makeValidCartridge());
    expect(bundle.format).toBe('cartridge-v1');
    expect(bundle.cartridge.id).toBe('test-cartridge');
    expect(bundle.packedAt).toBeTruthy();
  });

  it('validate returns validation result', () => {
    const result = packer.validate(makeValidCartridge());
    expect(result.valid).toBe(true);
  });

  it('throws on invalid cartridge', () => {
    const cartridge = makeValidCartridge();
    cartridge.deepMap.entryPoints.push('nonexistent');
    expect(() => packer.pack(cartridge)).toThrow('Cannot pack invalid cartridge');
  });
});

describe('CartridgeUnpacker', () => {
  const packer = new CartridgePacker();
  const unpacker = new CartridgeUnpacker();

  it('unpacks a valid bundle', () => {
    const bundle = packer.pack(makeValidCartridge());
    const cartridge = unpacker.unpack(bundle);
    expect(cartridge.id).toBe('test-cartridge');
  });

  it('round-trip pack->unpack produces equivalent cartridge', () => {
    const original = makeValidCartridge();
    const bundle = packer.pack(original);
    const restored = unpacker.unpack(bundle);
    expect(restored.id).toBe(original.id);
    expect(restored.name).toBe(original.name);
    expect(restored.deepMap.concepts.length).toBe(original.deepMap.concepts.length);
    expect(restored.story.chapters.length).toBe(original.story.chapters.length);
    expect(restored.chipset.vocabulary).toEqual(original.chipset.vocabulary);
  });

  it('verify returns validation for valid bundle', () => {
    const bundle = packer.pack(makeValidCartridge());
    const result = unpacker.verify(bundle);
    expect(result.valid).toBe(true);
  });

  it('throws on corrupted bundle', () => {
    expect(() => unpacker.unpack({ format: 'wrong' } as never)).toThrow('Corrupted cartridge bundle');
  });
});

describe('CartridgeRegistry', () => {
  it('registers and retrieves cartridges', () => {
    const registry = new CartridgeRegistry();
    const cartridge = makeValidCartridge();
    registry.register(cartridge);
    expect(registry.get('test-cartridge')).toBe(cartridge);
  });

  it('lists all registered cartridges', () => {
    const registry = new CartridgeRegistry();
    registry.register(makeValidCartridge());
    registry.register(makeValidCartridge({ id: 'second', name: 'Second' }));
    expect(registry.list().length).toBe(2);
  });

  it('search finds by name', () => {
    const registry = new CartridgeRegistry();
    registry.register(makeValidCartridge());
    expect(registry.search('Test').length).toBe(1);
  });

  it('search finds by vocabulary', () => {
    const registry = new CartridgeRegistry();
    registry.register(makeValidCartridge());
    expect(registry.search('concept').length).toBe(1);
  });

  it('search returns empty for empty query', () => {
    const registry = new CartridgeRegistry();
    registry.register(makeValidCartridge());
    expect(registry.search('')).toEqual([]);
  });

  it('get returns undefined for unknown ID', () => {
    const registry = new CartridgeRegistry();
    expect(registry.get('nope')).toBeUndefined();
  });
});
