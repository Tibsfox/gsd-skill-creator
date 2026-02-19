/**
 * Tests for collection manifest schema, import/export, and starter loading.
 *
 * TDD RED phase: these tests define the expected behavior for:
 * - importCollection: parse YAML string into CollectionManifest
 * - exportCollection: serialize CollectionManifest to YAML string
 * - Round-trip: export then import produces identical data
 * - listStarterCollections: returns 5 starter names
 * - loadStarterCollection: loads YAML from collections/ directory
 */

import { describe, it, expect } from 'vitest';
import {
  importCollection,
  exportCollection,
  loadStarterCollection,
  listStarterCollections,
} from './collection.js';
import type { CollectionManifest } from './types.js';

const VALID_YAML = `
name: Test Collection
description: A test collection for unit tests
version: 1
createdAt: '2026-02-19T00:00:00Z'
updatedAt: '2026-02-19T00:00:00Z'
packages:
  - fullPath: util/dir/DOpus550.lha
    note: Directory Opus file manager
  - fullPath: mus/edit/ProTracker36.lha
`;

describe('importCollection', () => {
  it('parses valid YAML into CollectionManifest', () => {
    const manifest = importCollection(VALID_YAML);
    expect(manifest.name).toBe('Test Collection');
    expect(manifest.description).toBe('A test collection for unit tests');
    expect(manifest.version).toBe(1);
    expect(manifest.createdAt).toBe('2026-02-19T00:00:00Z');
    expect(manifest.updatedAt).toBe('2026-02-19T00:00:00Z');
    expect(manifest.packages).toHaveLength(2);
    expect(manifest.packages[0].fullPath).toBe('util/dir/DOpus550.lha');
    expect(manifest.packages[0].note).toBe('Directory Opus file manager');
    expect(manifest.packages[1].fullPath).toBe('mus/edit/ProTracker36.lha');
    expect(manifest.packages[1].note).toBeUndefined();
  });

  it('rejects YAML missing required name field', () => {
    const invalid = `
description: Missing name
version: 1
createdAt: '2026-02-19T00:00:00Z'
updatedAt: '2026-02-19T00:00:00Z'
packages: []
`;
    expect(() => importCollection(invalid)).toThrow();
  });

  it('strips unknown extra fields with strict schema', () => {
    const withExtra = `
name: Strict Test
description: Has extra fields
version: 1
createdAt: '2026-02-19T00:00:00Z'
updatedAt: '2026-02-19T00:00:00Z'
packages: []
unknownField: should-be-stripped
`;
    // strict() would throw on unknown fields
    expect(() => importCollection(withExtra)).toThrow();
  });

  it('accepts empty packages array', () => {
    const emptyPkgs = `
name: Empty Collection
description: No packages yet
version: 1
createdAt: '2026-02-19T00:00:00Z'
updatedAt: '2026-02-19T00:00:00Z'
packages: []
`;
    const manifest = importCollection(emptyPkgs);
    expect(manifest.packages).toEqual([]);
  });
});

describe('exportCollection', () => {
  it('serializes CollectionManifest to YAML string', () => {
    const manifest: CollectionManifest = {
      name: 'Export Test',
      description: 'Testing export',
      version: 1,
      createdAt: '2026-02-19T00:00:00Z',
      updatedAt: '2026-02-19T00:00:00Z',
      packages: [{ fullPath: 'util/dir/DOpus550.lha', note: 'DOpus' }],
    };
    const yaml = exportCollection(manifest);
    expect(yaml).toContain('name: Export Test');
    expect(yaml).toContain('description: Testing export');
    expect(yaml).toContain('fullPath: util/dir/DOpus550.lha');
  });
});

describe('round-trip', () => {
  it('export then import produces identical manifest', () => {
    const original: CollectionManifest = {
      name: 'Round Trip',
      description: 'Testing round-trip fidelity',
      version: 1,
      createdAt: '2026-02-19T00:00:00Z',
      updatedAt: '2026-02-19T00:00:00Z',
      author: 'Test Author',
      tags: ['test', 'roundtrip'],
      packages: [
        { fullPath: 'util/dir/DOpus550.lha', note: 'DOpus' },
        { fullPath: 'mus/edit/ProTracker36.lha' },
      ],
    };
    const yaml = exportCollection(original);
    const reimported = importCollection(yaml);
    expect(reimported).toEqual(original);
  });
});

describe('CollectionEntry', () => {
  it('entry has fullPath and optional note', () => {
    const manifest = importCollection(VALID_YAML);
    expect(manifest.packages[0]).toHaveProperty('fullPath');
    expect(manifest.packages[0]).toHaveProperty('note');
    // Second entry has no note
    expect(manifest.packages[1].fullPath).toBe('mus/edit/ProTracker36.lha');
    expect(manifest.packages[1].note).toBeUndefined();
  });
});

describe('listStarterCollections', () => {
  it('returns array of 5 starter names', () => {
    const names = listStarterCollections();
    expect(names).toHaveLength(5);
    expect(names).toEqual([
      'essential-utils',
      'classic-games',
      'demo-scene',
      'music-mods',
      'dev-tools',
    ]);
  });
});

describe('loadStarterCollection', () => {
  it('loads essential-utils with >= 5 packages', () => {
    const manifest = loadStarterCollection('essential-utils');
    expect(manifest.name).toBe('Essential Utilities');
    expect(manifest.packages.length).toBeGreaterThanOrEqual(5);
    expect(manifest.version).toBe(1);
  });

  it('throws for unknown collection name', () => {
    expect(() => loadStarterCollection('nonexistent')).toThrow();
  });

  it('loads all 5 starter collections successfully', () => {
    const names = listStarterCollections();
    for (const name of names) {
      const manifest = loadStarterCollection(name);
      expect(manifest.name).toBeTruthy();
      expect(manifest.packages.length).toBeGreaterThanOrEqual(5);
      expect(manifest.version).toBe(1);
    }
  });
});
