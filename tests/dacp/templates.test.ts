/**
 * Phase 456 verification tests for DACP bundle templates.
 * Tests: CRUD operations, list, search by handoff type,
 * 5 starter templates, and defaults validation.
 *
 * @module test/dacp/templates
 */

import { describe, it, expect, beforeEach } from 'vitest';

import { BundleTemplateRegistry } from '../../src/dacp/templates/registry.js';
import { STARTER_TEMPLATES, loadStarterTemplates } from '../../src/dacp/templates/starter-templates.js';
import type { BundleTemplate } from '../../src/dacp/types.js';

// ============================================================================
// Factories
// ============================================================================

function makeTemplate(overrides: Partial<BundleTemplate> = {}): BundleTemplate {
  return {
    id: `tmpl-${Math.random().toString(36).slice(2, 8)}`,
    name: 'Test Template',
    handoff_type: 'test-type',
    description: 'A test template',
    default_fidelity: 2,
    data_schema_refs: ['schema-a'],
    code_script_refs: ['script-b'],
    test_fixture_refs: ['fixture-c'],
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('Template Registry (CRUD)', () => {
  let registry: BundleTemplateRegistry;

  beforeEach(() => {
    registry = new BundleTemplateRegistry('/tmp/test-templates.json');
  });

  it('create and read template', () => {
    const template = makeTemplate({ id: 'tmpl-1' });
    registry.register(template);
    const result = registry.get('tmpl-1');
    expect(result).toBeDefined();
    expect(result!.name).toBe('Test Template');
  });

  it('update changes fields', () => {
    const template = makeTemplate({ id: 'tmpl-2' });
    registry.register(template);
    registry.update('tmpl-2', { description: 'Updated description' });
    const result = registry.get('tmpl-2');
    expect(result!.description).toBe('Updated description');
  });

  it('delete removes template', () => {
    const template = makeTemplate({ id: 'tmpl-3' });
    registry.register(template);
    registry.remove('tmpl-3');
    expect(registry.get('tmpl-3')).toBeUndefined();
  });

  it('list returns all registered templates', () => {
    registry.register(makeTemplate({ id: 'a' }));
    registry.register(makeTemplate({ id: 'b' }));
    registry.register(makeTemplate({ id: 'c' }));
    expect(registry.getAll()).toHaveLength(3);
  });

  it('findByHandoffType returns matching templates', () => {
    registry.register(makeTemplate({ id: 'x', handoff_type: 'task-assignment' }));
    registry.register(makeTemplate({ id: 'y', handoff_type: 'task-assignment' }));
    registry.register(makeTemplate({ id: 'z', handoff_type: 'error-escalation' }));

    const results = registry.findByHandoffType('task-assignment');
    expect(results).toHaveLength(2);
  });
});

describe('Starter Templates', () => {
  it('5 starter templates exist', () => {
    expect(STARTER_TEMPLATES).toHaveLength(5);
  });

  it('starter templates cover expected handoff types', () => {
    const types = STARTER_TEMPLATES.map(t => t.id);
    expect(types).toContain('skill-handoff-v1');
    expect(types).toContain('phase-transition-v1');
    expect(types).toContain('agent-spawn-v1');
    expect(types).toContain('verification-request-v1');
    expect(types).toContain('error-escalation-v1');
  });

  it('each starter template has required defaults populated', () => {
    for (const template of STARTER_TEMPLATES) {
      expect(template.default_fidelity).toBeGreaterThanOrEqual(0);
      expect(template.default_fidelity).toBeLessThanOrEqual(4);
      expect(Array.isArray(template.data_schema_refs)).toBe(true);
      expect(Array.isArray(template.code_script_refs)).toBe(true);
      expect(Array.isArray(template.test_fixture_refs)).toBe(true);
      expect(template.data_schema_refs.length).toBeGreaterThanOrEqual(1);
      expect(template.test_fixture_refs.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('loadStarterTemplates registers all templates into registry', () => {
    const registry = new BundleTemplateRegistry('/tmp/starters.json');
    loadStarterTemplates(registry);
    expect(registry.getAll()).toHaveLength(5);
  });
});
