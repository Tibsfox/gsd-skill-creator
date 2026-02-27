/**
 * Tests for five starter bundle templates: structure, fidelity defaults,
 * refs, and registry integration.
 *
 * @module dacp/templates/starter-templates.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  STARTER_TEMPLATES,
  loadStarterTemplates,
} from '../../../src/dacp/templates/starter-templates.js';
import { BundleTemplateRegistry } from '../../../src/dacp/templates/registry.js';
import type { BundleTemplate } from '../../../src/dacp/types.js';

// ============================================================================
// Tests
// ============================================================================

describe('Starter Templates', () => {
  // --------------------------------------------------------------------------
  // Structure and existence
  // --------------------------------------------------------------------------

  describe('template existence and structure', () => {
    it('STARTER_TEMPLATES is an array of exactly 5 BundleTemplate objects', () => {
      expect(Array.isArray(STARTER_TEMPLATES)).toBe(true);
      expect(STARTER_TEMPLATES).toHaveLength(5);
    });

    it('each template has a unique non-empty id', () => {
      const ids = STARTER_TEMPLATES.map(t => t.id);
      expect(ids.every(id => typeof id === 'string' && id.length > 0)).toBe(true);
      expect(new Set(ids).size).toBe(5);
    });

    it('each template has non-empty name, handoff_type, and description', () => {
      for (const tmpl of STARTER_TEMPLATES) {
        expect(tmpl.name.length).toBeGreaterThan(0);
        expect(tmpl.handoff_type.length).toBeGreaterThan(0);
        expect(tmpl.description.length).toBeGreaterThan(0);
      }
    });

    it('no two templates share the same handoff_type', () => {
      const types = STARTER_TEMPLATES.map(t => t.handoff_type);
      expect(new Set(types).size).toBe(5);
    });
  });

  // --------------------------------------------------------------------------
  // Specific template coverage
  // --------------------------------------------------------------------------

  describe('skill-handoff template', () => {
    let tmpl: BundleTemplate;

    beforeEach(() => {
      tmpl = STARTER_TEMPLATES.find(t => t.id === 'skill-handoff-v1')!;
    });

    it('exists with correct id', () => {
      expect(tmpl).toBeDefined();
    });

    it('has correct handoff_type', () => {
      expect(tmpl.handoff_type).toBe('orchestrator->executor:skill-handoff');
    });

    it('has default_fidelity of 2', () => {
      expect(tmpl.default_fidelity).toBe(2);
    });

    it('has skill-context-schema in data_schema_refs', () => {
      expect(tmpl.data_schema_refs).toContain('skill-context-schema');
    });

    it('has empty code_script_refs', () => {
      expect(tmpl.code_script_refs).toEqual([]);
    });

    it('has skill-handoff-fixture in test_fixture_refs', () => {
      expect(tmpl.test_fixture_refs).toContain('skill-handoff-fixture');
    });
  });

  describe('phase-transition template', () => {
    let tmpl: BundleTemplate;

    beforeEach(() => {
      tmpl = STARTER_TEMPLATES.find(t => t.id === 'phase-transition-v1')!;
    });

    it('exists with correct id', () => {
      expect(tmpl).toBeDefined();
    });

    it('has correct handoff_type', () => {
      expect(tmpl.handoff_type).toBe('planner->executor:phase-transition');
    });

    it('has default_fidelity of 2', () => {
      expect(tmpl.default_fidelity).toBe(2);
    });

    it('has phase-context-schema in data_schema_refs', () => {
      expect(tmpl.data_schema_refs).toContain('phase-context-schema');
    });

    it('has empty code_script_refs', () => {
      expect(tmpl.code_script_refs).toEqual([]);
    });

    it('has phase-transition-fixture in test_fixture_refs', () => {
      expect(tmpl.test_fixture_refs).toContain('phase-transition-fixture');
    });
  });

  describe('agent-spawn template', () => {
    let tmpl: BundleTemplate;

    beforeEach(() => {
      tmpl = STARTER_TEMPLATES.find(t => t.id === 'agent-spawn-v1')!;
    });

    it('exists with correct id', () => {
      expect(tmpl).toBeDefined();
    });

    it('has correct handoff_type', () => {
      expect(tmpl.handoff_type).toBe('orchestrator->agent:agent-spawn');
    });

    it('has default_fidelity of 3', () => {
      expect(tmpl.default_fidelity).toBe(3);
    });

    it('has agent-config-schema in data_schema_refs', () => {
      expect(tmpl.data_schema_refs).toContain('agent-config-schema');
    });

    it('has validate-agent-config in code_script_refs', () => {
      expect(tmpl.code_script_refs).toContain('validate-agent-config');
    });

    it('has agent-spawn-fixture in test_fixture_refs', () => {
      expect(tmpl.test_fixture_refs).toContain('agent-spawn-fixture');
    });
  });

  describe('verification-request template', () => {
    let tmpl: BundleTemplate;

    beforeEach(() => {
      tmpl = STARTER_TEMPLATES.find(t => t.id === 'verification-request-v1')!;
    });

    it('exists with correct id', () => {
      expect(tmpl).toBeDefined();
    });

    it('has correct handoff_type', () => {
      expect(tmpl.handoff_type).toBe('executor->verifier:verification-request');
    });

    it('has default_fidelity of 3', () => {
      expect(tmpl.default_fidelity).toBe(3);
    });

    it('has verification-context-schema in data_schema_refs', () => {
      expect(tmpl.data_schema_refs).toContain('verification-context-schema');
    });

    it('has run-tests and type-check in code_script_refs', () => {
      expect(tmpl.code_script_refs).toContain('run-tests');
      expect(tmpl.code_script_refs).toContain('type-check');
    });

    it('has verification-request-fixture in test_fixture_refs', () => {
      expect(tmpl.test_fixture_refs).toContain('verification-request-fixture');
    });
  });

  describe('error-escalation template', () => {
    let tmpl: BundleTemplate;

    beforeEach(() => {
      tmpl = STARTER_TEMPLATES.find(t => t.id === 'error-escalation-v1')!;
    });

    it('exists with correct id', () => {
      expect(tmpl).toBeDefined();
    });

    it('has correct handoff_type', () => {
      expect(tmpl.handoff_type).toBe('agent->orchestrator:error-escalation');
    });

    it('has default_fidelity of 1', () => {
      expect(tmpl.default_fidelity).toBe(1);
    });

    it('has error-context-schema in data_schema_refs', () => {
      expect(tmpl.data_schema_refs).toContain('error-context-schema');
    });

    it('has empty code_script_refs', () => {
      expect(tmpl.code_script_refs).toEqual([]);
    });

    it('has error-escalation-fixture in test_fixture_refs', () => {
      expect(tmpl.test_fixture_refs).toContain('error-escalation-fixture');
    });
  });

  // --------------------------------------------------------------------------
  // Registry integration
  // --------------------------------------------------------------------------

  describe('registry integration', () => {
    let tmpDir: string;
    let registryPath: string;
    let registry: BundleTemplateRegistry;

    beforeEach(async () => {
      tmpDir = await mkdtemp(join(tmpdir(), 'dacp-starter-'));
      registryPath = join(tmpDir, 'registry.json');
      registry = new BundleTemplateRegistry(registryPath);
    });

    afterEach(async () => {
      await rm(tmpDir, { recursive: true, force: true });
    });

    it('loadStarterTemplates() registers all 5 templates into a registry', () => {
      loadStarterTemplates(registry);
      expect(registry.getAll()).toHaveLength(5);
    });

    it('after loading, findByHandoffType returns verification template', () => {
      loadStarterTemplates(registry);
      const results = registry.findByHandoffType(
        'executor->verifier:verification-request',
      );
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('verification-request-v1');
    });

    it('calling loadStarterTemplates twice throws (duplicate id)', () => {
      loadStarterTemplates(registry);
      expect(() => loadStarterTemplates(registry)).toThrow(/already exists/i);
    });
  });
});
