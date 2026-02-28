/**
 * TDD tests for ScriptCatalog — script indexing, search, provenance
 * enforcement, success tracking, and persistence.
 *
 * RED phase: all tests import ScriptCatalog which does not exist yet.
 *
 * @module catalog/script-catalog.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { ScriptCatalog } from './script-catalog.js';
import type { ScriptCatalogEntry } from '../../dacp/types.js';

// ============================================================================
// Test Fixtures
// ============================================================================

function makeEntry(overrides: Partial<ScriptCatalogEntry> = {}): ScriptCatalogEntry {
  return {
    id: overrides.id ?? 'entry-1',
    skill_source: overrides.skill_source ?? 'skill-a',
    skill_version: overrides.skill_version ?? '1.0.0',
    script_path: overrides.script_path ?? 'scripts/validate-json.sh',
    script_hash: overrides.script_hash ?? 'abc123',
    function_type: overrides.function_type ?? 'validator',
    data_types: overrides.data_types ?? ['json'],
    deterministic: overrides.deterministic ?? true,
    last_used: overrides.last_used ?? '2026-01-01T00:00:00Z',
    use_count: overrides.use_count ?? 0,
    success_rate: overrides.success_rate ?? 1.0,
    avg_execution_ms: overrides.avg_execution_ms ?? 0,
    input_schema_ref: overrides.input_schema_ref,
    output_schema_ref: overrides.output_schema_ref,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('ScriptCatalog', () => {
  let tmpDir: string;
  let catalog: ScriptCatalog;

  beforeEach(async () => {
    tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'sc-test-'));
    catalog = new ScriptCatalog(path.join(tmpDir, 'scripts.json'));
  });

  afterEach(async () => {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  });

  // --------------------------------------------------------------------------
  // buildIndex
  // --------------------------------------------------------------------------

  describe('buildIndex', () => {
    it('scans a skill directory structure and populates entries', async () => {
      // Create fixture skill directories
      const skillsRoot = path.join(tmpDir, 'skills');
      await fs.promises.mkdir(path.join(skillsRoot, 'skill-a', 'scripts'), { recursive: true });
      await fs.promises.writeFile(
        path.join(skillsRoot, 'skill-a', 'scripts', 'validate-json.sh'),
        '#!/bin/bash\necho valid',
      );
      await fs.promises.mkdir(path.join(skillsRoot, 'skill-b', 'scripts'), { recursive: true });
      await fs.promises.writeFile(
        path.join(skillsRoot, 'skill-b', 'scripts', 'parse-yaml.sh'),
        '#!/bin/bash\necho parsed',
      );
      await fs.promises.writeFile(
        path.join(skillsRoot, 'skill-b', 'scripts', 'transform-data.sh'),
        '#!/bin/bash\necho transformed',
      );

      const result = await catalog.buildIndex(skillsRoot);

      expect(result.scripts_indexed).toBe(3);
      expect(result.skills_scanned).toBe(2);
      expect(result.errors).toHaveLength(0);
      expect(result.duration_ms).toBeGreaterThanOrEqual(0);
      expect(catalog.size).toBe(3);
    });
  });

  // --------------------------------------------------------------------------
  // search
  // --------------------------------------------------------------------------

  describe('search', () => {
    beforeEach(() => {
      catalog.addEntry(makeEntry({ id: 'e1', function_type: 'validator', data_types: ['json'], deterministic: true, success_rate: 0.9 }));
      catalog.addEntry(makeEntry({ id: 'e2', function_type: 'parser', data_types: ['yaml', 'json'], deterministic: false, success_rate: 0.5, skill_source: 'skill-b', script_path: 'scripts/parse.sh' }));
      catalog.addEntry(makeEntry({ id: 'e3', function_type: 'transformer', data_types: ['csv'], deterministic: true, success_rate: 1.0, skill_source: 'skill-c', script_path: 'scripts/transform.sh' }));
      catalog.addEntry(makeEntry({ id: 'e4', function_type: 'validator', data_types: ['xml'], deterministic: false, success_rate: 0.3, skill_source: 'skill-d', script_path: 'scripts/validate-xml.sh' }));
    });

    it('by function_type returns only matching scripts', () => {
      const results = catalog.search({ function_type: 'validator' });
      expect(results).toHaveLength(2);
      expect(results.every(r => r.function_type === 'validator')).toBe(true);
    });

    it('by data_types returns scripts supporting those data types', () => {
      const results = catalog.search({ data_types: ['json'] });
      expect(results).toHaveLength(2);
      expect(results.map(r => r.id).sort()).toEqual(['e1', 'e2']);
    });

    it('with deterministic_only=true filters non-deterministic scripts', () => {
      const results = catalog.search({ deterministic_only: true });
      expect(results).toHaveLength(2);
      expect(results.every(r => r.deterministic === true)).toBe(true);
    });

    it('with min_success_rate filters low-success scripts', () => {
      const results = catalog.search({ min_success_rate: 0.8 });
      expect(results).toHaveLength(2);
      expect(results.every(r => r.success_rate >= 0.8)).toBe(true);
    });

    it('with combined query fields applies AND logic', () => {
      const results = catalog.search({
        function_type: 'validator',
        deterministic_only: true,
        min_success_rate: 0.5,
      });
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('e1');
    });

    it('with no matches returns empty array (not error)', () => {
      const results = catalog.search({ function_type: 'formatter' });
      expect(results).toEqual([]);
    });
  });

  // --------------------------------------------------------------------------
  // Provenance enforcement
  // --------------------------------------------------------------------------

  describe('provenance enforcement', () => {
    it('rejects entries where skill_source is empty string', () => {
      const entry = makeEntry({ skill_source: '' });
      expect(() => catalog.addEntry(entry)).toThrow(/skill_source/i);
    });

    it('rejects entries where script_path is empty', () => {
      const entry = makeEntry({ script_path: '' });
      expect(() => catalog.addEntry(entry)).toThrow(/script_path/i);
    });
  });

  // --------------------------------------------------------------------------
  // updateSuccessRate
  // --------------------------------------------------------------------------

  describe('updateSuccessRate', () => {
    it('updates entry success_rate and last_used timestamp', () => {
      catalog.addEntry(makeEntry({ id: 'e1', success_rate: 1.0, last_used: '2026-01-01T00:00:00Z' }));

      const before = catalog.search({ function_type: 'validator' })[0];
      expect(before.success_rate).toBe(1.0);

      catalog.updateSuccessRate('e1', false);

      const after = catalog.search({ function_type: 'validator' })[0];
      // EMA: 0.7 * 1.0 + 0.3 * 0.0 = 0.7
      expect(after.success_rate).toBeCloseTo(0.7, 2);
      expect(after.last_used).not.toBe('2026-01-01T00:00:00Z');
    });
  });

  // --------------------------------------------------------------------------
  // Persistence
  // --------------------------------------------------------------------------

  describe('persistence', () => {
    it('save and load round-trip: data persists correctly to JSON file', async () => {
      catalog.addEntry(makeEntry({ id: 'e1' }));
      catalog.addEntry(makeEntry({ id: 'e2', skill_source: 'skill-b', script_path: 'scripts/parse.sh', function_type: 'parser' }));

      await catalog.save();

      const loaded = new ScriptCatalog(path.join(tmpDir, 'scripts.json'));
      await loaded.load();

      expect(loaded.size).toBe(2);
      const results = loaded.search({});
      expect(results).toHaveLength(2);
      expect(results.map(r => r.id).sort()).toEqual(['e1', 'e2']);
    });
  });

  // --------------------------------------------------------------------------
  // removeSkill
  // --------------------------------------------------------------------------

  describe('removeSkill', () => {
    it('removes all entries from a given skill source', () => {
      catalog.addEntry(makeEntry({ id: 'e1', skill_source: 'skill-a', script_path: 'a/1.sh' }));
      catalog.addEntry(makeEntry({ id: 'e2', skill_source: 'skill-a', script_path: 'a/2.sh' }));
      catalog.addEntry(makeEntry({ id: 'e3', skill_source: 'skill-b', script_path: 'b/1.sh' }));

      catalog.removeSkill('skill-a');

      expect(catalog.size).toBe(1);
      const results = catalog.search({});
      expect(results[0].skill_source).toBe('skill-b');
    });
  });
});
