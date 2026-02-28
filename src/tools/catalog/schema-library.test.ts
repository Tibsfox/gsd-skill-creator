/**
 * TDD tests for SchemaLibrary — schema indexing, search, provenance
 * enforcement, resolution, and persistence.
 *
 * RED phase: all tests import SchemaLibrary which does not exist yet.
 *
 * @module catalog/schema-library.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { SchemaLibrary } from './schema-library.js';
import type { SchemaLibraryEntry } from '../../dacp/types.js';

// ============================================================================
// Test Fixtures
// ============================================================================

function makeSchemaEntry(overrides: Partial<SchemaLibraryEntry> = {}): SchemaLibraryEntry {
  return {
    id: overrides.id ?? 'schema-1',
    name: overrides.name ?? 'event-schema',
    schema_path: overrides.schema_path ?? 'references/event-schema.schema.json',
    data_type: overrides.data_type ?? 'event',
    source_skill: overrides.source_skill ?? 'skill-a',
    version: overrides.version ?? '1.0.0',
    fields: overrides.fields ?? ['name', 'timestamp'],
    last_updated: overrides.last_updated ?? '2026-01-01T00:00:00Z',
    reference_count: overrides.reference_count ?? 0,
  };
}

const sampleSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  properties: {
    name: { type: 'string' },
    timestamp: { type: 'string' },
    severity: { type: 'number' },
  },
  required: ['name', 'timestamp'],
};

// ============================================================================
// Tests
// ============================================================================

describe('SchemaLibrary', () => {
  let tmpDir: string;
  let library: SchemaLibrary;

  beforeEach(async () => {
    tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'sl-test-'));
    library = new SchemaLibrary(path.join(tmpDir, 'schemas.json'));
  });

  afterEach(async () => {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  });

  // --------------------------------------------------------------------------
  // buildIndex
  // --------------------------------------------------------------------------

  describe('buildIndex', () => {
    it('scans skill directories for .schema.json files and populates entries', async () => {
      const skillsRoot = path.join(tmpDir, 'skills');

      // skill-a with a schema in references/
      await fs.promises.mkdir(path.join(skillsRoot, 'skill-a', 'references'), { recursive: true });
      await fs.promises.writeFile(
        path.join(skillsRoot, 'skill-a', 'references', 'event-schema.schema.json'),
        JSON.stringify(sampleSchema),
      );

      // skill-b with a schema in resources/
      await fs.promises.mkdir(path.join(skillsRoot, 'skill-b', 'resources'), { recursive: true });
      await fs.promises.writeFile(
        path.join(skillsRoot, 'skill-b', 'resources', 'config-schema.schema.json'),
        JSON.stringify({ type: 'object', properties: { port: { type: 'number' } } }),
      );

      await library.buildIndex(skillsRoot);

      expect(library.size).toBe(2);
    });
  });

  // --------------------------------------------------------------------------
  // search
  // --------------------------------------------------------------------------

  describe('search', () => {
    beforeEach(() => {
      library.addEntry(makeSchemaEntry({
        id: 's1',
        name: 'event-schema',
        data_type: 'event',
        fields: ['name', 'timestamp', 'severity'],
      }));
      library.addEntry(makeSchemaEntry({
        id: 's2',
        name: 'config-schema',
        data_type: 'config',
        source_skill: 'skill-b',
        schema_path: 'resources/config-schema.schema.json',
        fields: ['port', 'host', 'timeout'],
      }));
      library.addEntry(makeSchemaEntry({
        id: 's3',
        name: 'user-event-schema',
        data_type: 'event',
        source_skill: 'skill-c',
        schema_path: 'references/user-event.schema.json',
        fields: ['user_id', 'action', 'timestamp'],
      }));
    });

    it('by data_type returns matching schemas', () => {
      const results = library.search({ data_type: 'event' });
      expect(results).toHaveLength(2);
      expect(results.every(r => r.data_type === 'event')).toBe(true);
    });

    it('by fields returns schemas that contain those field names', () => {
      const results = library.search({ fields: ['timestamp'] });
      expect(results).toHaveLength(2);
      expect(results.map(r => r.id).sort()).toEqual(['s1', 's3']);
    });

    it('by name_pattern (regex) matches schema names', () => {
      const results = library.search({ name_pattern: 'event' });
      expect(results).toHaveLength(2);
      expect(results.map(r => r.id).sort()).toEqual(['s1', 's3']);
    });

    it('with combined query applies AND logic', () => {
      const results = library.search({
        data_type: 'event',
        fields: ['user_id'],
      });
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('s3');
    });

    it('with no matches returns empty array', () => {
      const results = library.search({ data_type: 'nonexistent' });
      expect(results).toEqual([]);
    });
  });

  // --------------------------------------------------------------------------
  // get
  // --------------------------------------------------------------------------

  describe('get', () => {
    it('by ID returns a specific entry or null', () => {
      library.addEntry(makeSchemaEntry({ id: 's1' }));

      expect(library.get('s1')).not.toBeNull();
      expect(library.get('s1')!.id).toBe('s1');
      expect(library.get('nonexistent')).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // resolve
  // --------------------------------------------------------------------------

  describe('resolve', () => {
    it('returns the parsed JSON schema object from the schema_path', async () => {
      const schemaPath = path.join(tmpDir, 'test-schema.json');
      await fs.promises.writeFile(schemaPath, JSON.stringify(sampleSchema));

      const result = library.resolve(schemaPath);
      expect(result).not.toBeNull();
      expect((result as Record<string, unknown>)['type']).toBe('object');
    });

    it('returns null for non-existent path', () => {
      const result = library.resolve('/nonexistent/path.json');
      expect(result).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // Provenance enforcement
  // --------------------------------------------------------------------------

  describe('provenance enforcement', () => {
    it('rejects entries with empty source_skill', () => {
      const entry = makeSchemaEntry({ source_skill: '' });
      expect(() => library.addEntry(entry)).toThrow(/source_skill/i);
    });
  });

  // --------------------------------------------------------------------------
  // Persistence
  // --------------------------------------------------------------------------

  describe('persistence', () => {
    it('save and load round-trip persistence', async () => {
      library.addEntry(makeSchemaEntry({ id: 's1' }));
      library.addEntry(makeSchemaEntry({
        id: 's2',
        source_skill: 'skill-b',
        schema_path: 'resources/config.schema.json',
        data_type: 'config',
      }));

      await library.save();

      const loaded = new SchemaLibrary(path.join(tmpDir, 'schemas.json'));
      await loaded.load();

      expect(loaded.size).toBe(2);
      const results = loaded.search({});
      expect(results).toHaveLength(2);
      expect(results.map(r => r.id).sort()).toEqual(['s1', 's2']);
    });
  });

  // --------------------------------------------------------------------------
  // removeSkill
  // --------------------------------------------------------------------------

  describe('removeSkill', () => {
    it('removes all entries from a given source skill', () => {
      library.addEntry(makeSchemaEntry({ id: 's1', source_skill: 'skill-a' }));
      library.addEntry(makeSchemaEntry({ id: 's2', source_skill: 'skill-a', schema_path: 'refs/2.json' }));
      library.addEntry(makeSchemaEntry({ id: 's3', source_skill: 'skill-b', schema_path: 'refs/3.json' }));

      library.removeSkill('skill-a');

      expect(library.size).toBe(1);
      const results = library.search({});
      expect(results[0].source_skill).toBe('skill-b');
    });
  });
});
