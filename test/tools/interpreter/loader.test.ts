/**
 * Tests for the DACP bundle loader.
 *
 * Covers: manifest loading, intent loading, data loading, schema loading,
 * script loading with provenance enforcement, and error handling.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { loadBundle } from '../../../src/interpreter/loader.js';
import type { BundleManifest } from '../../../src/dacp/types.js';

// ============================================================================
// Test Helpers
// ============================================================================

function makeManifest(overrides: Partial<BundleManifest> = {}): BundleManifest {
  return {
    version: '1.0.0',
    fidelity_level: 3,
    source_agent: 'test-assembler',
    target_agent: 'test-executor',
    opcode: 'EXEC',
    intent_summary: 'Test bundle for loading',
    human_origin: {
      vision_doc: '/project/vision.md',
      planning_phase: '449',
      user_directive: 'Build interpreter tests',
    },
    data_manifest: {
      'payload.json': {
        purpose: 'Test data payload',
        source: 'test-fixture',
        schema_ref: 'schema.json',
      },
    },
    code_manifest: {
      'process.sh': {
        purpose: 'Process test data',
        language: 'bash',
        source_skill: 'test-skill',
        deterministic: true,
      },
    },
    assembly_rationale: {
      level_justification: 'Testing requires full bundle',
      skills_used: ['test-skill'],
      generated_artifacts: ['payload.json'],
      reused_artifacts: ['process.sh'],
    },
    provenance: {
      assembled_by: 'test-assembler',
      assembled_at: '2026-02-27T00:00:00Z',
      skill_versions: { 'test-skill': '1.0.0' },
    },
    ...overrides,
  };
}

function createTestBundle(
  dir: string,
  options: {
    manifest?: BundleManifest;
    intent?: string;
    complete?: boolean;
    dataFiles?: Record<string, string>;
    codeFiles?: Record<string, string>;
    schemaFiles?: Record<string, object>;
  } = {},
): string {
  const bundleDir = join(dir, 'test.bundle');
  mkdirSync(bundleDir, { recursive: true });

  const manifest = options.manifest ?? makeManifest();
  writeFileSync(join(bundleDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  writeFileSync(
    join(bundleDir, 'intent.md'),
    options.intent ?? '# Test Intent\n\nThis is a test bundle.\n\n- List item\n- Another item\n\n```bash\necho hello\n```',
  );

  if (options.complete !== false) {
    writeFileSync(join(bundleDir, '.complete'), '');
  }

  if (options.dataFiles) {
    mkdirSync(join(bundleDir, 'data'), { recursive: true });
    for (const [name, content] of Object.entries(options.dataFiles)) {
      writeFileSync(join(bundleDir, 'data', name), content);
    }
  }

  if (options.schemaFiles) {
    mkdirSync(join(bundleDir, 'data'), { recursive: true });
    for (const [name, content] of Object.entries(options.schemaFiles)) {
      writeFileSync(join(bundleDir, 'data', name), JSON.stringify(content, null, 2));
    }
  }

  if (options.codeFiles) {
    mkdirSync(join(bundleDir, 'code'), { recursive: true });
    for (const [name, content] of Object.entries(options.codeFiles)) {
      writeFileSync(join(bundleDir, 'code', name), content);
    }
  }

  return bundleDir;
}

// ============================================================================
// Tests
// ============================================================================

describe('loadBundle', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'dacp-loader-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  // --------------------------------------------------------------------------
  // 1. Manifest loading (INTERP-01)
  // --------------------------------------------------------------------------
  describe('manifest loading', () => {
    it('should load manifest matching written data', () => {
      const manifest = makeManifest();
      const bundlePath = createTestBundle(tmpDir, {
        manifest,
        dataFiles: { 'payload.json': '{"value": 1}' },
        schemaFiles: { 'schema.json': { type: 'object' } },
        codeFiles: { 'process.sh': '#!/bin/bash\necho hello' },
      });
      const loaded = loadBundle(bundlePath);
      expect(loaded.manifest.version).toBe(manifest.version);
      expect(loaded.manifest.source_agent).toBe(manifest.source_agent);
      expect(loaded.manifest.target_agent).toBe(manifest.target_agent);
      expect(loaded.manifest.opcode).toBe(manifest.opcode);
      expect(loaded.manifest.intent_summary).toBe(manifest.intent_summary);
    });

    it('should set fidelityLevel from manifest.fidelity_level', () => {
      const manifest = makeManifest({ fidelity_level: 2 });
      const bundlePath = createTestBundle(tmpDir, {
        manifest,
        dataFiles: { 'payload.json': '{"value": 1}' },
        schemaFiles: { 'schema.json': { type: 'object' } },
      });
      const loaded = loadBundle(bundlePath);
      expect(loaded.fidelityLevel).toBe(2);
    });
  });

  // --------------------------------------------------------------------------
  // 2. Intent loading
  // --------------------------------------------------------------------------
  describe('intent loading', () => {
    it('should load intent.md as raw string', () => {
      const intentContent = '# My Intent\n\nDetailed description here.';
      const bundlePath = createTestBundle(tmpDir, {
        manifest: makeManifest({ fidelity_level: 0, data_manifest: {}, code_manifest: {} }),
        intent: intentContent,
      });
      const loaded = loadBundle(bundlePath);
      expect(loaded.intent).toBe(intentContent);
    });

    it('should preserve markdown formatting', () => {
      const intentContent = '# Header\n\n- List item\n- Another\n\n```bash\necho hello\n```';
      const bundlePath = createTestBundle(tmpDir, {
        manifest: makeManifest({ fidelity_level: 0, data_manifest: {}, code_manifest: {} }),
        intent: intentContent,
      });
      const loaded = loadBundle(bundlePath);
      expect(loaded.intent).toContain('# Header');
      expect(loaded.intent).toContain('- List item');
      expect(loaded.intent).toContain('```bash');
    });
  });

  // --------------------------------------------------------------------------
  // 3. Data loading (INTERP-01)
  // --------------------------------------------------------------------------
  describe('data loading', () => {
    it('should load data files as parsed JSON keyed by filename', () => {
      const payload = { value: 42, nested: { key: 'val' } };
      const bundlePath = createTestBundle(tmpDir, {
        dataFiles: { 'payload.json': JSON.stringify(payload) },
        schemaFiles: { 'schema.json': { type: 'object' } },
        codeFiles: { 'process.sh': '#!/bin/bash\necho hello' },
      });
      const loaded = loadBundle(bundlePath);
      expect(loaded.data['payload.json']).toEqual(payload);
    });

    it('should load multiple data files', () => {
      const manifest = makeManifest({
        data_manifest: {
          'first.json': { purpose: 'First', source: 'test' },
          'second.json': { purpose: 'Second', source: 'test' },
        },
      });
      const bundlePath = createTestBundle(tmpDir, {
        manifest,
        dataFiles: {
          'first.json': '{"a": 1}',
          'second.json': '{"b": 2}',
        },
        codeFiles: { 'process.sh': '#!/bin/bash\necho hello' },
      });
      const loaded = loadBundle(bundlePath);
      expect(loaded.data['first.json']).toEqual({ a: 1 });
      expect(loaded.data['second.json']).toEqual({ b: 2 });
    });

    it('should return empty data for Level 0 bundle', () => {
      const bundlePath = createTestBundle(tmpDir, {
        manifest: makeManifest({ fidelity_level: 0, data_manifest: {}, code_manifest: {} }),
      });
      const loaded = loadBundle(bundlePath);
      expect(Object.keys(loaded.data)).toHaveLength(0);
    });
  });

  // --------------------------------------------------------------------------
  // 4. Schema loading
  // --------------------------------------------------------------------------
  describe('schema loading', () => {
    it('should load schema files as parsed JSON', () => {
      const schema = { type: 'object', properties: { value: { type: 'number' } } };
      const bundlePath = createTestBundle(tmpDir, {
        dataFiles: { 'payload.json': '{"value": 1}' },
        schemaFiles: { 'schema.json': schema },
        codeFiles: { 'process.sh': '#!/bin/bash\necho hello' },
      });
      const loaded = loadBundle(bundlePath);
      expect(loaded.schemas['schema.json']).toEqual(schema);
    });

    it('should load multiple schema files', () => {
      const schema1 = { type: 'object', properties: { a: { type: 'number' } } };
      const schema2 = { type: 'object', properties: { b: { type: 'string' } } };
      const manifest = makeManifest({
        data_manifest: {
          'data1.json': { purpose: 'First', source: 'test', schema_ref: 'schema1.json' },
          'data2.json': { purpose: 'Second', source: 'test', schema_ref: 'schema2.json' },
        },
      });
      const bundlePath = createTestBundle(tmpDir, {
        manifest,
        dataFiles: {
          'data1.json': '{"a": 1}',
          'data2.json': '{"b": "hello"}',
        },
        schemaFiles: {
          'schema1.json': schema1,
          'schema2.json': schema2,
        },
        codeFiles: { 'process.sh': '#!/bin/bash\necho hello' },
      });
      const loaded = loadBundle(bundlePath);
      expect(loaded.schemas['schema1.json']).toEqual(schema1);
      expect(loaded.schemas['schema2.json']).toEqual(schema2);
    });
  });

  // --------------------------------------------------------------------------
  // 5. Script loading (SAFE-06)
  // --------------------------------------------------------------------------
  describe('script loading', () => {
    it('should load scripts with metadata from code_manifest', () => {
      const bundlePath = createTestBundle(tmpDir, {
        dataFiles: { 'payload.json': '{"value": 1}' },
        schemaFiles: { 'schema.json': { type: 'object' } },
        codeFiles: { 'process.sh': '#!/bin/bash\necho hello' },
      });
      const loaded = loadBundle(bundlePath);
      expect(loaded.scripts).toHaveLength(1);
      const script = loaded.scripts[0];
      expect(script.name).toBe('process.sh');
      expect(script.purpose).toBe('Process test data');
      expect(script.language).toBe('bash');
      expect(script.sourceSkill).toBe('test-skill');
      expect(script.deterministic).toBe(true);
    });

    it('should load script content as string for review', () => {
      const scriptContent = '#!/bin/bash\necho "hello world"\nexit 0';
      const bundlePath = createTestBundle(tmpDir, {
        dataFiles: { 'payload.json': '{"value": 1}' },
        schemaFiles: { 'schema.json': { type: 'object' } },
        codeFiles: { 'process.sh': scriptContent },
      });
      const loaded = loadBundle(bundlePath);
      expect(loaded.scripts[0].content).toBe(scriptContent);
    });

    it('should include absolute path in script metadata', () => {
      const bundlePath = createTestBundle(tmpDir, {
        dataFiles: { 'payload.json': '{"value": 1}' },
        schemaFiles: { 'schema.json': { type: 'object' } },
        codeFiles: { 'process.sh': '#!/bin/bash\necho hello' },
      });
      const loaded = loadBundle(bundlePath);
      expect(loaded.scripts[0].path).toBe(resolve(join(bundlePath, 'code', 'process.sh')));
    });

    it('should include sizeBytes in script metadata', () => {
      const scriptContent = '#!/bin/bash\necho hello';
      const bundlePath = createTestBundle(tmpDir, {
        dataFiles: { 'payload.json': '{"value": 1}' },
        schemaFiles: { 'schema.json': { type: 'object' } },
        codeFiles: { 'process.sh': scriptContent },
      });
      const loaded = loadBundle(bundlePath);
      expect(loaded.scripts[0].sizeBytes).toBe(Buffer.byteLength(scriptContent, 'utf8'));
    });

    it('should throw for script without provenance when requireProvenance is true', () => {
      const manifest = makeManifest({
        code_manifest: {
          'bad.sh': {
            purpose: 'No provenance',
            language: 'bash',
            source_skill: '',
            deterministic: true,
          },
        },
      });
      const bundlePath = createTestBundle(tmpDir, {
        manifest,
        dataFiles: { 'payload.json': '{"value": 1}' },
        codeFiles: { 'bad.sh': '#!/bin/bash\necho bad' },
      });
      expect(() => loadBundle(bundlePath)).toThrow(/provenance/i);
    });
  });

  // --------------------------------------------------------------------------
  // 6. Error handling
  // --------------------------------------------------------------------------
  describe('error handling', () => {
    it('should throw for nonexistent path', () => {
      expect(() => loadBundle('/nonexistent/path/bundle')).toThrow();
    });

    it('should throw for bundle without .complete marker', () => {
      const bundlePath = createTestBundle(tmpDir, { complete: false });
      expect(() => loadBundle(bundlePath)).toThrow(/incomplete/i);
    });
  });

  // --------------------------------------------------------------------------
  // 7. Bundle path resolution
  // --------------------------------------------------------------------------
  describe('bundle path resolution', () => {
    it('should resolve bundlePath to absolute path', () => {
      const bundlePath = createTestBundle(tmpDir, {
        manifest: makeManifest({ fidelity_level: 0, data_manifest: {}, code_manifest: {} }),
      });
      const loaded = loadBundle(bundlePath);
      expect(loaded.bundlePath).toBe(resolve(bundlePath));
    });
  });
});
