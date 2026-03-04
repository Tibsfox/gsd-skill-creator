import { describe, it, expect } from 'vitest';
import { CartridgePackager } from './cartridge-packager.js';
import type { CartridgeManifest, CartridgeBundle, DeepMap, DeepMapNode, DeepMapEdge } from './cartridge-types.js';
import type { MuseId } from './muse-schema-validator.js';

function makeManifest(overrides: Partial<CartridgeManifest> = {}): CartridgeManifest {
  return {
    name: 'test-cartridge',
    version: '1.0.0',
    author: 'test',
    description: 'A test cartridge',
    trust: 'quarantine',
    muses: ['foxy'] as MuseId[],
    deepMap: 'deep-map.json',
    story: 'story.md',
    chipset: 'chipset.yaml',
    dependencies: [],
    tags: ['test'],
    ...overrides,
  };
}

function makeDeepMap(nodes: DeepMapNode[] = [], edges: DeepMapEdge[] = [], entryPoints: string[] = []): DeepMap {
  return { nodes, edges, entryPoints };
}

function makeNode(id: string, label?: string): DeepMapNode {
  return { id, label: label || id, domain: 'test', depth: 0, content: `Content for ${id}` };
}

function makeBundle(overrides: Partial<CartridgeBundle> = {}): CartridgeBundle {
  const nodes = [makeNode('a', 'Node A'), makeNode('b', 'Node B')];
  const edges: DeepMapEdge[] = [{ source: 'a', target: 'b', relationship: 'relates' }];
  return {
    manifest: makeManifest(),
    deepMap: makeDeepMap(nodes, edges, ['a']),
    story: '# Test Story\n\nNarrative content here.',
    chipset: { name: 'test', version: '1.0.0' },
    ...overrides,
  };
}

describe('CartridgePackager', () => {
  describe('validateManifest', () => {
    it('validates a complete manifest', () => {
      const packager = new CartridgePackager();
      const result = packager.validateManifest(makeManifest());
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects manifest with missing name', () => {
      const packager = new CartridgePackager();
      const result = packager.validateManifest(makeManifest({ name: '' }));
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('rejects manifest with missing version', () => {
      const packager = new CartridgePackager();
      const result = packager.validateManifest(makeManifest({ version: '' }));
      expect(result.valid).toBe(false);
    });
  });

  describe('validateDeepMap', () => {
    it('validates a connected map', () => {
      const packager = new CartridgePackager();
      const nodes = [makeNode('a'), makeNode('b')];
      const edges: DeepMapEdge[] = [{ source: 'a', target: 'b', relationship: 'relates' }];
      const result = packager.validateDeepMap(makeDeepMap(nodes, edges, ['a']));
      expect(result.valid).toBe(true);
    });

    it('detects orphan nodes (no edges)', () => {
      const packager = new CartridgePackager();
      const nodes = [makeNode('a'), makeNode('b'), makeNode('orphan')];
      const edges: DeepMapEdge[] = [{ source: 'a', target: 'b', relationship: 'relates' }];
      const result = packager.validateDeepMap(makeDeepMap(nodes, edges, ['a']));
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('orphan'))).toBe(true);
    });

    it('validates empty map as valid', () => {
      const packager = new CartridgePackager();
      const result = packager.validateDeepMap(makeDeepMap([], [], []));
      expect(result.valid).toBe(true);
    });
  });

  describe('getEntryPoints', () => {
    it('returns entry point nodes', () => {
      const packager = new CartridgePackager();
      const bundle = makeBundle();
      const entries = packager.getEntryPoints(bundle);
      expect(entries).toHaveLength(1);
      expect(entries[0].id).toBe('a');
    });
  });

  describe('getNeighbors', () => {
    it('returns connected nodes', () => {
      const packager = new CartridgePackager();
      const bundle = makeBundle();
      const neighbors = packager.getNeighbors(bundle.deepMap, 'a');
      expect(neighbors).toHaveLength(1);
      expect(neighbors[0].id).toBe('b');
    });

    it('returns empty for unknown node', () => {
      const packager = new CartridgePackager();
      const bundle = makeBundle();
      expect(packager.getNeighbors(bundle.deepMap, 'unknown')).toHaveLength(0);
    });
  });

  describe('compose', () => {
    it('merges nodes from both cartridges', () => {
      const packager = new CartridgePackager();
      const a = makeBundle();
      const b = makeBundle({
        manifest: makeManifest({ name: 'b-cart', trust: 'provisional' }),
        deepMap: makeDeepMap(
          [makeNode('c', 'Node C'), makeNode('d', 'Node D')],
          [{ source: 'c', target: 'd', relationship: 'extends' }],
          ['c']
        ),
        story: '# Story B\n\nAnother narrative.',
      });
      const composed = packager.compose(a, b);
      expect(composed.deepMap.nodes.length).toBe(4);
      expect(composed.deepMap.entryPoints).toContain('a');
      expect(composed.deepMap.entryPoints).toContain('c');
    });

    it('takes lower trust on compose', () => {
      const packager = new CartridgePackager();
      const a = makeBundle({ manifest: makeManifest({ trust: 'trusted' }) });
      const b = makeBundle({ manifest: makeManifest({ name: 'b', trust: 'quarantine' }) });
      const composed = packager.compose(a, b);
      expect(composed.manifest.trust).toBe('quarantine');
    });

    it('keeps A version on node ID conflict', () => {
      const packager = new CartridgePackager();
      const nodeA = makeNode('shared', 'A version');
      const nodeB = makeNode('shared', 'B version');
      const a = makeBundle({ deepMap: makeDeepMap([nodeA], [], ['shared']) });
      const b = makeBundle({ deepMap: makeDeepMap([nodeB], [], ['shared']) });
      const composed = packager.compose(a, b);
      const shared = composed.deepMap.nodes.find(n => n.id === 'shared');
      expect(shared!.label).toBe('A version');
    });
  });
});
