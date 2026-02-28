/**
 * Tests for collection manager CRUD, bulk path extraction, and atomic writes.
 *
 * TDD RED phase: these tests define the expected behavior for:
 * - createCollection: create YAML manifest in collectionsDir
 * - saveCollection: atomic write-then-rename
 * - loadCollection: parse YAML from disk
 * - listCollections: list .yaml files in directory
 * - addPackage: add entry, prevent duplicates
 * - removePackage: remove entry, no-op for missing
 * - deleteCollection: remove YAML file from disk
 * - getCollectionPaths: extract fullPath strings for bulk download
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync, readFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createCollection,
  saveCollection,
  loadCollection,
  listCollections,
  addPackage,
  removePackage,
  deleteCollection,
  getCollectionPaths,
} from './collection-manager.js';
import type { CollectionManifest, CollectionEntry } from './types.js';

function makeTmpDir(): string {
  return mkdtempSync(join(tmpdir(), 'collection-mgr-'));
}

describe('createCollection', () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTmpDir();
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('creates a YAML file in collectionsDir and returns manifest', () => {
    const manifest = createCollection(dir, 'My Cool Collection', 'A test collection');
    expect(manifest.name).toBe('My Cool Collection');
    expect(manifest.description).toBe('A test collection');
    expect(manifest.version).toBe(1);
    expect(manifest.packages).toEqual([]);
    // File should exist with slugified name
    expect(existsSync(join(dir, 'my-cool-collection.yaml'))).toBe(true);
  });

  it('slugifies name for filename', () => {
    createCollection(dir, 'My Cool Collection', 'test');
    expect(existsSync(join(dir, 'my-cool-collection.yaml'))).toBe(true);
  });

  it('includes ISO timestamps for createdAt and updatedAt', () => {
    const manifest = createCollection(dir, 'Timestamped', 'test');
    // ISO 8601 pattern
    expect(manifest.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(manifest.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('accepts initial packages array', () => {
    const pkgs: CollectionEntry[] = [
      { fullPath: 'util/dir/DOpus550.lha', note: 'File manager' },
      { fullPath: 'mus/edit/ProTracker36.lha' },
    ];
    const manifest = createCollection(dir, 'With Packages', 'has packages', pkgs);
    expect(manifest.packages).toHaveLength(2);
    expect(manifest.packages[0].fullPath).toBe('util/dir/DOpus550.lha');
    expect(manifest.packages[1].fullPath).toBe('mus/edit/ProTracker36.lha');
  });

  it('writes atomically (file exists and content validates)', () => {
    createCollection(dir, 'Atomic Test', 'atomic');
    const content = readFileSync(join(dir, 'atomic-test.yaml'), 'utf-8');
    expect(content).toContain('name: Atomic Test');
    expect(content).toContain('description: atomic');
  });
});

describe('listCollections', () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTmpDir();
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('returns empty array for empty directory', () => {
    expect(listCollections(dir)).toEqual([]);
  });

  it('returns sorted collection names from .yaml files', () => {
    createCollection(dir, 'Bravo', 'b');
    createCollection(dir, 'Alpha', 'a');
    createCollection(dir, 'Charlie', 'c');
    const names = listCollections(dir);
    expect(names).toEqual(['alpha', 'bravo', 'charlie']);
  });
});

describe('addPackage', () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTmpDir();
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('adds a package entry and saves', () => {
    createCollection(dir, 'Add Test', 'test');
    const entry: CollectionEntry = { fullPath: 'util/dir/DOpus550.lha', note: 'DOpus' };
    const updated = addPackage(dir, 'add-test', entry);
    expect(updated.packages).toHaveLength(1);
    expect(updated.packages[0].fullPath).toBe('util/dir/DOpus550.lha');
    // Verify persistence by reloading
    const reloaded = loadCollection(dir, 'add-test');
    expect(reloaded.packages).toHaveLength(1);
  });

  it('does not add duplicate fullPath', () => {
    createCollection(dir, 'Dup Test', 'test');
    const entry: CollectionEntry = { fullPath: 'util/dir/DOpus550.lha' };
    addPackage(dir, 'dup-test', entry);
    const updated = addPackage(dir, 'dup-test', entry);
    expect(updated.packages).toHaveLength(1);
  });
});

describe('removePackage', () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTmpDir();
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('removes a package by fullPath and saves', () => {
    createCollection(dir, 'Remove Test', 'test', [
      { fullPath: 'util/dir/DOpus550.lha' },
      { fullPath: 'mus/edit/ProTracker36.lha' },
    ]);
    const updated = removePackage(dir, 'remove-test', 'util/dir/DOpus550.lha');
    expect(updated.packages).toHaveLength(1);
    expect(updated.packages[0].fullPath).toBe('mus/edit/ProTracker36.lha');
    // Verify persistence
    const reloaded = loadCollection(dir, 'remove-test');
    expect(reloaded.packages).toHaveLength(1);
  });

  it('is a no-op for non-existent fullPath', () => {
    createCollection(dir, 'No Op Test', 'test', [
      { fullPath: 'util/dir/DOpus550.lha' },
    ]);
    const updated = removePackage(dir, 'no-op-test', 'nonexistent/path.lha');
    expect(updated.packages).toHaveLength(1);
  });
});

describe('deleteCollection', () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTmpDir();
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('removes the YAML file from collectionsDir', () => {
    createCollection(dir, 'Delete Me', 'to be deleted');
    expect(existsSync(join(dir, 'delete-me.yaml'))).toBe(true);
    deleteCollection(dir, 'delete-me');
    expect(existsSync(join(dir, 'delete-me.yaml'))).toBe(false);
  });

  it('throws for non-existent collection', () => {
    expect(() => deleteCollection(dir, 'nonexistent')).toThrow();
  });
});

describe('saveCollection', () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTmpDir();
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('writes manifest to collectionsDir atomically', () => {
    const manifest: CollectionManifest = {
      name: 'Save Test',
      description: 'Testing save',
      version: 1,
      createdAt: '2026-02-19T00:00:00Z',
      updatedAt: '2026-02-19T00:00:00Z',
      packages: [{ fullPath: 'util/dir/DOpus550.lha' }],
    };
    saveCollection(dir, 'save-test', manifest);
    expect(existsSync(join(dir, 'save-test.yaml'))).toBe(true);
    const loaded = loadCollection(dir, 'save-test');
    expect(loaded.name).toBe('Save Test');
    expect(loaded.packages).toHaveLength(1);
  });
});

describe('getCollectionPaths', () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTmpDir();
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('returns fullPath strings from collection packages', () => {
    createCollection(dir, 'Paths Test', 'test', [
      { fullPath: 'util/dir/DOpus550.lha' },
      { fullPath: 'mus/edit/ProTracker36.lha' },
      { fullPath: 'game/shoot/Deluxe.lha' },
    ]);
    const paths = getCollectionPaths(dir, 'paths-test');
    expect(paths).toEqual([
      'util/dir/DOpus550.lha',
      'mus/edit/ProTracker36.lha',
      'game/shoot/Deluxe.lha',
    ]);
  });

  it('returns empty array for empty collection', () => {
    createCollection(dir, 'Empty Paths', 'test');
    const paths = getCollectionPaths(dir, 'empty-paths');
    expect(paths).toEqual([]);
  });
});
