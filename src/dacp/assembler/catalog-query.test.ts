/**
 * Tests for the DACP CatalogQuery engine.
 *
 * @module dacp/assembler/catalog-query.test
 */

import { describe, it, expect } from 'vitest';
import type { ScriptCatalogEntry, SchemaLibraryEntry } from '../types.js';
import { CatalogQuery } from './catalog-query.js';

// ============================================================================
// Test Data Factories
// ============================================================================

function createScriptEntry(
  overrides: Partial<ScriptCatalogEntry> = {},
): ScriptCatalogEntry {
  return {
    id: 'script-001',
    skill_source: 'test-skill',
    skill_version: '1.0.0',
    script_path: '/scripts/test.sh',
    script_hash: 'abc123',
    function_type: 'parser',
    data_types: ['task-data'],
    input_schema_ref: undefined,
    output_schema_ref: undefined,
    deterministic: true,
    last_used: '2026-02-20T00:00:00Z',
    use_count: 10,
    success_rate: 0.9,
    avg_execution_ms: 50,
    ...overrides,
  };
}

function createSchemaEntry(
  overrides: Partial<SchemaLibraryEntry> = {},
): SchemaLibraryEntry {
  return {
    id: 'schema-001',
    name: 'Test Schema',
    schema_path: '/schemas/test.json',
    data_type: 'task-data',
    source_skill: 'test-skill',
    version: '1.0.0',
    fields: ['name', 'value'],
    last_updated: '2026-02-20T00:00:00Z',
    reference_count: 5,
    ...overrides,
  };
}

// ============================================================================
// findScripts
// ============================================================================

describe('CatalogQuery.findScripts', () => {
  it('returns matching entries by function type and data type', () => {
    const scripts = [
      createScriptEntry({ id: 's1', function_type: 'parser', data_types: ['task-data'] }),
      createScriptEntry({ id: 's2', function_type: 'validator', data_types: ['task-data'] }),
      createScriptEntry({ id: 's3', function_type: 'parser', data_types: ['config-data'] }),
    ];
    const query = new CatalogQuery(scripts, []);

    const results = query.findScripts('parser', ['task-data']);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('s1');
  });

  it('returns entries sorted by success_rate descending', () => {
    const scripts = [
      createScriptEntry({ id: 's1', success_rate: 0.7 }),
      createScriptEntry({ id: 's2', success_rate: 0.95 }),
      createScriptEntry({ id: 's3', success_rate: 0.85 }),
    ];
    const query = new CatalogQuery(scripts, []);

    const results = query.findScripts('parser', ['task-data']);
    expect(results.map((r) => r.id)).toEqual(['s2', 's3', 's1']);
  });

  it('breaks success_rate ties by last_used recency', () => {
    const scripts = [
      createScriptEntry({ id: 's1', success_rate: 0.9, last_used: '2026-02-01T00:00:00Z' }),
      createScriptEntry({ id: 's2', success_rate: 0.9, last_used: '2026-02-15T00:00:00Z' }),
    ];
    const query = new CatalogQuery(scripts, []);

    const results = query.findScripts('parser', ['task-data']);
    expect(results.map((r) => r.id)).toEqual(['s2', 's1']);
  });

  it('returns empty array when no match', () => {
    const scripts = [
      createScriptEntry({ function_type: 'validator', data_types: ['other'] }),
    ];
    const query = new CatalogQuery(scripts, []);

    expect(query.findScripts('parser', ['task-data'])).toEqual([]);
  });

  it('matches when at least one data type overlaps', () => {
    const scripts = [
      createScriptEntry({ data_types: ['config-data', 'task-data', 'report-data'] }),
    ];
    const query = new CatalogQuery(scripts, []);

    const results = query.findScripts('parser', ['task-data']);
    expect(results).toHaveLength(1);
  });

  it('returns empty for empty catalog', () => {
    const query = new CatalogQuery([], []);
    expect(query.findScripts('parser', ['task-data'])).toEqual([]);
  });
});

// ============================================================================
// findSchemas
// ============================================================================

describe('CatalogQuery.findSchemas', () => {
  it('returns matching entries by data type', () => {
    const schemas = [
      createSchemaEntry({ id: 'sch1', data_type: 'task-data' }),
      createSchemaEntry({ id: 'sch2', data_type: 'config-data' }),
    ];
    const query = new CatalogQuery([], schemas);

    const results = query.findSchemas('task-data');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('sch1');
  });

  it('sorts by version descending', () => {
    const schemas = [
      createSchemaEntry({ id: 'sch1', data_type: 'task-data', version: '1.0.0' }),
      createSchemaEntry({ id: 'sch2', data_type: 'task-data', version: '2.1.0' }),
      createSchemaEntry({ id: 'sch3', data_type: 'task-data', version: '1.5.0' }),
    ];
    const query = new CatalogQuery([], schemas);

    const results = query.findSchemas('task-data');
    expect(results.map((r) => r.id)).toEqual(['sch2', 'sch3', 'sch1']);
  });

  it('returns empty array when no match', () => {
    const schemas = [createSchemaEntry({ data_type: 'other' })];
    const query = new CatalogQuery([], schemas);
    expect(query.findSchemas('task-data')).toEqual([]);
  });

  it('returns empty for empty library', () => {
    const query = new CatalogQuery([], []);
    expect(query.findSchemas('task-data')).toEqual([]);
  });
});

// ============================================================================
// countAvailableSkills
// ============================================================================

describe('CatalogQuery.countAvailableSkills', () => {
  it('counts unique skill sources across scripts and schemas', () => {
    const scripts = [
      createScriptEntry({ skill_source: 'skill-a', data_types: ['task-data'] }),
      createScriptEntry({ skill_source: 'skill-b', data_types: ['task-data'] }),
    ];
    const schemas = [
      createSchemaEntry({ source_skill: 'skill-c', data_type: 'task-data' }),
    ];
    const query = new CatalogQuery(scripts, schemas);

    expect(query.countAvailableSkills('task-assignment', ['task-data'])).toBe(3);
  });

  it('deduplicates skills appearing in both scripts and schemas', () => {
    const scripts = [
      createScriptEntry({ skill_source: 'skill-a', data_types: ['task-data'] }),
    ];
    const schemas = [
      createSchemaEntry({ source_skill: 'skill-a', data_type: 'task-data' }),
    ];
    const query = new CatalogQuery(scripts, schemas);

    expect(query.countAvailableSkills('task-assignment', ['task-data'])).toBe(1);
  });

  it('returns 0 for empty catalogs', () => {
    const query = new CatalogQuery([], []);
    expect(query.countAvailableSkills('task-assignment', ['task-data'])).toBe(0);
  });

  it('returns 0 when no data types match', () => {
    const scripts = [
      createScriptEntry({ skill_source: 'skill-a', data_types: ['other-data'] }),
    ];
    const query = new CatalogQuery(scripts, []);
    expect(query.countAvailableSkills('task-assignment', ['task-data'])).toBe(0);
  });
});
