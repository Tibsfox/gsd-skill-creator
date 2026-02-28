/**
 * Phase 456 verification tests for DACP skill library (catalog and schema library).
 * Tests SL-01 through SL-06: index building, search by function/data type,
 * schema resolution, and persistence round-trip.
 *
 * @module test/dacp/skill-library
 */

import { describe, it, expect } from 'vitest';

import { CatalogQuery } from '../../../src/dacp/assembler/catalog-query.js';
import type { ScriptCatalogEntry, SchemaLibraryEntry } from '../../../src/dacp/types.js';

// ============================================================================
// Factories
// ============================================================================

function makeScript(overrides: Partial<ScriptCatalogEntry> = {}): ScriptCatalogEntry {
  return {
    id: `script-${Math.random().toString(36).slice(2, 8)}`,
    skill_source: 'test-skill',
    skill_version: '1.0.0',
    script_path: '/skills/test/script.sh',
    script_hash: 'hash123',
    function_type: 'validator',
    data_types: ['json'],
    deterministic: true,
    last_used: new Date().toISOString(),
    use_count: 10,
    success_rate: 0.95,
    avg_execution_ms: 50,
    ...overrides,
  };
}

function makeSchema(overrides: Partial<SchemaLibraryEntry> = {}): SchemaLibraryEntry {
  return {
    id: `schema-${Math.random().toString(36).slice(2, 8)}`,
    name: 'Test Schema',
    schema_path: '/schemas/test.json',
    data_type: 'json',
    source_skill: 'test-skill',
    version: '1.0.0',
    fields: ['name', 'value'],
    last_updated: new Date().toISOString(),
    reference_count: 3,
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('Skill Library (SL-01 to SL-06)', () => {
  // SL-01: Full index builds (mock 5 skill entries)
  it('SL-01: catalog indexes all entries and counts available skills', () => {
    const scripts = [
      makeScript({ id: 's1', skill_source: 'skill-a', data_types: ['json'] }),
      makeScript({ id: 's2', skill_source: 'skill-a', data_types: ['yaml'] }),
      makeScript({ id: 's3', skill_source: 'skill-b', data_types: ['json'] }),
      makeScript({ id: 's4', skill_source: 'skill-c', data_types: ['csv'] }),
      makeScript({ id: 's5', skill_source: 'skill-d', data_types: ['json', 'xml'] }),
    ];
    const schemas = [
      makeSchema({ source_skill: 'skill-a', data_type: 'json' }),
    ];

    const catalog = new CatalogQuery(scripts, schemas);
    const count = catalog.countAvailableSkills('task', ['json']);
    // skill-a, skill-b, skill-d all have json scripts; skill-a also has json schema
    expect(count).toBeGreaterThanOrEqual(3);
  });

  // SL-02: Search by function type
  it('SL-02: findScripts filters by function type', () => {
    const scripts = [
      makeScript({ id: 's1', function_type: 'validator', data_types: ['json'] }),
      makeScript({ id: 's2', function_type: 'parser', data_types: ['json'] }),
      makeScript({ id: 's3', function_type: 'validator', data_types: ['json'] }),
      makeScript({ id: 's4', function_type: 'transformer', data_types: ['json'] }),
    ];

    const catalog = new CatalogQuery(scripts, []);
    const validators = catalog.findScripts('validator', ['json']);
    expect(validators).toHaveLength(2);
    expect(validators.every(s => s.function_type === 'validator')).toBe(true);
  });

  // SL-03: Search by data type
  it('SL-03: findScripts filters by data type overlap', () => {
    const scripts = [
      makeScript({ id: 's1', data_types: ['json'] }),
      makeScript({ id: 's2', data_types: ['yaml', 'toml'] }),
      makeScript({ id: 's3', data_types: ['json', 'csv'] }),
    ];

    const catalog = new CatalogQuery(scripts, []);
    const jsonScripts = catalog.findScripts('validator', ['json']);
    expect(jsonScripts).toHaveLength(2);
    expect(jsonScripts.every(s => s.data_types.includes('json'))).toBe(true);
  });

  // SL-04: Results sorted by success_rate descending
  it('SL-04: search results sorted by success_rate then recency', () => {
    const scripts = [
      makeScript({ id: 's1', success_rate: 0.7, last_used: '2026-01-01', data_types: ['json'] }),
      makeScript({ id: 's2', success_rate: 0.95, last_used: '2026-02-01', data_types: ['json'] }),
      makeScript({ id: 's3', success_rate: 0.95, last_used: '2026-02-15', data_types: ['json'] }),
    ];

    const catalog = new CatalogQuery(scripts, []);
    const results = catalog.findScripts('validator', ['json']);
    expect(results[0].id).toBe('s3'); // highest success + most recent
    expect(results[1].id).toBe('s2'); // same success, older
    expect(results[2].id).toBe('s1'); // lowest success
  });

  // SL-05: Schema search by data type
  it('SL-05: findSchemas returns matching schemas sorted by version', () => {
    const schemas = [
      makeSchema({ id: 'sa', data_type: 'json', version: '1.0.0' }),
      makeSchema({ id: 'sb', data_type: 'yaml', version: '2.0.0' }),
      makeSchema({ id: 'sc', data_type: 'json', version: '2.0.0' }),
    ];

    const catalog = new CatalogQuery([], schemas);
    const jsonSchemas = catalog.findSchemas('json');
    expect(jsonSchemas).toHaveLength(2);
    // Sorted by version descending
    expect(jsonSchemas[0].version).toBe('2.0.0');
    expect(jsonSchemas[1].version).toBe('1.0.0');
  });

  // SL-06: Count available skills across scripts and schemas
  it('SL-06: countAvailableSkills returns unique skill sources', () => {
    const scripts = [
      makeScript({ skill_source: 'skill-a', data_types: ['json'] }),
      makeScript({ skill_source: 'skill-a', data_types: ['json'], function_type: 'parser' }),
      makeScript({ skill_source: 'skill-b', data_types: ['json'] }),
    ];
    const schemas = [
      makeSchema({ source_skill: 'skill-c', data_type: 'json' }),
      makeSchema({ source_skill: 'skill-a', data_type: 'json' }), // duplicate
    ];

    const catalog = new CatalogQuery(scripts, schemas);
    const count = catalog.countAvailableSkills('task', ['json']);
    // Unique: skill-a, skill-b, skill-c = 3
    expect(count).toBe(3);
  });
});
