/**
 * Tests for BundleTemplateRegistry CRUD, search, and persistence.
 *
 * @module dacp/templates/registry.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { BundleTemplateRegistry } from '../../../src/dacp/templates/registry.js';
import type { BundleTemplate } from '../../../src/dacp/types.js';

// ============================================================================
// Test helpers
// ============================================================================

/** Create a valid BundleTemplate for testing with sensible defaults. */
function makeTemplate(overrides: Partial<BundleTemplate> = {}): BundleTemplate {
  return {
    id: 'test-template-v1',
    name: 'Test Template',
    handoff_type: 'orchestrator->executor:test',
    description: 'A test template for unit testing.',
    default_fidelity: 2,
    data_schema_refs: ['test-schema'],
    code_script_refs: [],
    test_fixture_refs: ['test-fixture'],
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('BundleTemplateRegistry', () => {
  let tmpDir: string;
  let registryPath: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'dacp-templates-'));
    registryPath = join(tmpDir, 'registry.json');
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  // --------------------------------------------------------------------------
  // CRUD Operations
  // --------------------------------------------------------------------------

  describe('CRUD operations', () => {
    it('register() adds a template and get() retrieves it by id', () => {
      const registry = new BundleTemplateRegistry(registryPath);
      const template = makeTemplate({ id: 'tmpl-1' });

      registry.register(template);
      const result = registry.get('tmpl-1');

      expect(result).toEqual(template);
    });

    it('register() with duplicate id throws an error', () => {
      const registry = new BundleTemplateRegistry(registryPath);
      const template = makeTemplate({ id: 'tmpl-dup' });

      registry.register(template);

      expect(() => registry.register(template)).toThrow(/duplicate|already exists/i);
    });

    it('getAll() returns all registered templates', () => {
      const registry = new BundleTemplateRegistry(registryPath);
      const t1 = makeTemplate({ id: 'tmpl-a', name: 'Template A' });
      const t2 = makeTemplate({ id: 'tmpl-b', name: 'Template B' });
      const t3 = makeTemplate({ id: 'tmpl-c', name: 'Template C' });

      registry.register(t1);
      registry.register(t2);
      registry.register(t3);

      const all = registry.getAll();
      expect(all).toHaveLength(3);
      expect(all.map(t => t.id).sort()).toEqual(['tmpl-a', 'tmpl-b', 'tmpl-c']);
    });

    it('update() modifies existing template fields (partial update)', () => {
      const registry = new BundleTemplateRegistry(registryPath);
      const template = makeTemplate({ id: 'tmpl-upd', name: 'Original' });
      registry.register(template);

      registry.update('tmpl-upd', { name: 'Updated', default_fidelity: 3 });

      const result = registry.get('tmpl-upd');
      expect(result?.name).toBe('Updated');
      expect(result?.default_fidelity).toBe(3);
      // Other fields should be preserved
      expect(result?.handoff_type).toBe(template.handoff_type);
    });

    it('update() on non-existent id throws an error', () => {
      const registry = new BundleTemplateRegistry(registryPath);

      expect(() => registry.update('nonexistent', { name: 'Nope' })).toThrow(
        /not found/i,
      );
    });

    it('remove() deletes a template by id', () => {
      const registry = new BundleTemplateRegistry(registryPath);
      const template = makeTemplate({ id: 'tmpl-del' });
      registry.register(template);

      registry.remove('tmpl-del');

      expect(registry.get('tmpl-del')).toBeUndefined();
      expect(registry.getAll()).toHaveLength(0);
    });

    it('remove() on non-existent id throws an error', () => {
      const registry = new BundleTemplateRegistry(registryPath);

      expect(() => registry.remove('nonexistent')).toThrow(/not found/i);
    });
  });

  // --------------------------------------------------------------------------
  // Search Operations
  // --------------------------------------------------------------------------

  describe('search operations', () => {
    it('findByHandoffType() returns matching templates (exact match)', () => {
      const registry = new BundleTemplateRegistry(registryPath);
      const t1 = makeTemplate({
        id: 'tmpl-exec',
        handoff_type: 'orchestrator->executor:skill-handoff',
      });
      const t2 = makeTemplate({
        id: 'tmpl-verify',
        handoff_type: 'executor->verifier:verification-request',
      });
      registry.register(t1);
      registry.register(t2);

      const results = registry.findByHandoffType(
        'orchestrator->executor:skill-handoff',
      );
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('tmpl-exec');
    });

    it('findByHandoffType() returns empty array for no matches', () => {
      const registry = new BundleTemplateRegistry(registryPath);
      registry.register(makeTemplate({ id: 'tmpl-1' }));

      const results = registry.findByHandoffType('nonexistent->type:nothing');
      expect(results).toEqual([]);
    });

    it('findByHandoffType() supports wildcard pattern matching', () => {
      const registry = new BundleTemplateRegistry(registryPath);
      const t1 = makeTemplate({
        id: 'tmpl-skill',
        handoff_type: 'orchestrator->executor:skill-handoff',
      });
      const t2 = makeTemplate({
        id: 'tmpl-phase',
        handoff_type: 'planner->executor:phase-transition',
      });
      const t3 = makeTemplate({
        id: 'tmpl-error',
        handoff_type: 'agent->orchestrator:error-escalation',
      });
      registry.register(t1);
      registry.register(t2);
      registry.register(t3);

      // Wildcard: *->executor:* should match both executor-targeted templates
      const results = registry.findByHandoffType('*->executor:*');
      expect(results).toHaveLength(2);
      expect(results.map(t => t.id).sort()).toEqual(['tmpl-phase', 'tmpl-skill']);
    });
  });

  // --------------------------------------------------------------------------
  // Persistence
  // --------------------------------------------------------------------------

  describe('persistence', () => {
    it('save() writes registry to a JSON file', async () => {
      const registry = new BundleTemplateRegistry(registryPath);
      const template = makeTemplate({ id: 'tmpl-persist' });
      registry.register(template);

      await registry.save();

      const content = await readFile(registryPath, 'utf-8');
      const data = JSON.parse(content);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe('tmpl-persist');
    });

    it('load() reads registry from JSON file and restores state', async () => {
      // First save some templates
      const registry1 = new BundleTemplateRegistry(registryPath);
      registry1.register(makeTemplate({ id: 'tmpl-load-1' }));
      registry1.register(makeTemplate({ id: 'tmpl-load-2' }));
      await registry1.save();

      // Then load into a new instance
      const registry2 = new BundleTemplateRegistry(registryPath);
      await registry2.load();

      expect(registry2.getAll()).toHaveLength(2);
      expect(registry2.get('tmpl-load-1')).toBeDefined();
      expect(registry2.get('tmpl-load-2')).toBeDefined();
    });

    it('load() on missing file starts with empty registry (no throw)', async () => {
      const missingPath = join(tmpDir, 'nonexistent', 'registry.json');
      const registry = new BundleTemplateRegistry(missingPath);

      await expect(registry.load()).resolves.not.toThrow();
      expect(registry.getAll()).toHaveLength(0);
    });

    it('round-trip: register -> save -> new instance -> load -> getAll matches', async () => {
      const t1 = makeTemplate({ id: 'tmpl-rt-1', name: 'Round Trip 1' });
      const t2 = makeTemplate({ id: 'tmpl-rt-2', name: 'Round Trip 2' });
      const t3 = makeTemplate({ id: 'tmpl-rt-3', name: 'Round Trip 3' });

      const registry1 = new BundleTemplateRegistry(registryPath);
      registry1.register(t1);
      registry1.register(t2);
      registry1.register(t3);
      await registry1.save();

      const registry2 = new BundleTemplateRegistry(registryPath);
      await registry2.load();

      const loaded = registry2.getAll();
      expect(loaded).toHaveLength(3);
      expect(loaded).toEqual(expect.arrayContaining([t1, t2, t3]));
    });
  });
});
