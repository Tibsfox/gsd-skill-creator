/**
 * Tests for the DACP bundle validator.
 *
 * Covers: .complete marker check, manifest parsing, fidelity verification,
 * referenced file existence, size limits, schema coverage, data-schema
 * validation, and script provenance enforcement.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { validateBundle } from '../../../src/tools/interpreter/validator.js';
import type { BundleManifest } from '../../../src/integrations/dacp/types.js';

// ============================================================================
// Test Helpers
// ============================================================================

/** Default valid manifest for testing. */
function makeManifest(overrides: Partial<BundleManifest> = {}): BundleManifest {
  return {
    version: '1.0.0',
    fidelity_level: 3,
    source_agent: 'test-assembler',
    target_agent: 'test-executor',
    opcode: 'EXEC',
    intent_summary: 'Test bundle for validation',
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

/**
 * Create a test bundle directory with configurable contents.
 */
function createTestBundle(
  dir: string,
  options: {
    manifest?: BundleManifest | null;
    manifestJson?: string | null;
    intent?: string;
    complete?: boolean;
    dataFiles?: Record<string, string>;
    codeFiles?: Record<string, string>;
    schemaFiles?: Record<string, object>;
  } = {},
): string {
  const bundleDir = join(dir, 'test.bundle');
  mkdirSync(bundleDir, { recursive: true });

  // Write manifest
  if (options.manifestJson !== undefined) {
    if (options.manifestJson !== null) {
      writeFileSync(join(bundleDir, 'manifest.json'), options.manifestJson);
    }
  } else if (options.manifest !== null) {
    const manifest = options.manifest ?? makeManifest();
    writeFileSync(join(bundleDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  }

  // Write intent
  writeFileSync(join(bundleDir, 'intent.md'), options.intent ?? '# Test Intent\n\nThis is a test bundle.');

  // Write .complete marker
  if (options.complete !== false) {
    writeFileSync(join(bundleDir, '.complete'), '');
  }

  // Write data files
  if (options.dataFiles) {
    mkdirSync(join(bundleDir, 'data'), { recursive: true });
    for (const [name, content] of Object.entries(options.dataFiles)) {
      writeFileSync(join(bundleDir, 'data', name), content);
    }
  }

  // Write schema files in data/
  if (options.schemaFiles) {
    mkdirSync(join(bundleDir, 'data'), { recursive: true });
    for (const [name, content] of Object.entries(options.schemaFiles)) {
      writeFileSync(join(bundleDir, 'data', name), JSON.stringify(content, null, 2));
    }
  }

  // Write code files
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

describe('validateBundle', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'dacp-validator-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  // --------------------------------------------------------------------------
  // 1. Complete marker check (INTERP-01)
  // --------------------------------------------------------------------------
  describe('.complete marker check', () => {
    it('should return valid:true for bundle with .complete marker', () => {
      const bundlePath = createTestBundle(tmpDir, {
        dataFiles: { 'payload.json': '{"value": 1}' },
        schemaFiles: { 'schema.json': { type: 'object', properties: { value: { type: 'number' } } } },
        codeFiles: { 'process.sh': '#!/bin/bash\necho hello' },
      });
      const result = validateBundle(bundlePath);
      expect(result.valid).toBe(true);
    });

    it('should return valid:false with fatal error for bundle missing .complete marker', () => {
      const bundlePath = createTestBundle(tmpDir, {
        complete: false,
        dataFiles: { 'payload.json': '{"value": 1}' },
        codeFiles: { 'process.sh': '#!/bin/bash\necho hello' },
      });
      const result = validateBundle(bundlePath);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      const fatalError = result.errors.find(e => e.field === '.complete' && e.severity === 'fatal');
      expect(fatalError).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // 2. Manifest parsing (INTERP-01)
  // --------------------------------------------------------------------------
  describe('manifest parsing', () => {
    it('should validate bundle with valid manifest.json', () => {
      const bundlePath = createTestBundle(tmpDir, {
        dataFiles: { 'payload.json': '{"value": 1}' },
        schemaFiles: { 'schema.json': { type: 'object', properties: { value: { type: 'number' } } } },
        codeFiles: { 'process.sh': '#!/bin/bash\necho hello' },
      });
      const result = validateBundle(bundlePath);
      expect(result.valid).toBe(true);
    });

    it('should return valid:false with fatal error for missing manifest.json', () => {
      const bundlePath = createTestBundle(tmpDir, { manifest: null });
      const result = validateBundle(bundlePath);
      expect(result.valid).toBe(false);
      const fatalError = result.errors.find(e => e.severity === 'fatal' && e.message.toLowerCase().includes('manifest'));
      expect(fatalError).toBeDefined();
    });

    it('should return valid:false with fatal error for malformed JSON in manifest.json', () => {
      const bundlePath = createTestBundle(tmpDir, {
        manifestJson: '{ invalid json !!!',
      });
      const result = validateBundle(bundlePath);
      expect(result.valid).toBe(false);
      const fatalError = result.errors.find(e => e.severity === 'fatal');
      expect(fatalError).toBeDefined();
    });

    it('should return valid:false with error when manifest fails Zod schema validation', () => {
      const bundlePath = createTestBundle(tmpDir, {
        manifestJson: JSON.stringify({
          version: '1.0.0',
          // Missing required fields
        }),
      });
      const result = validateBundle(bundlePath);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  // --------------------------------------------------------------------------
  // 3. Fidelity verification (INTERP-02)
  // --------------------------------------------------------------------------
  describe('fidelity verification', () => {
    it('should verify Level 0 bundle with only intent.md', () => {
      const bundlePath = createTestBundle(tmpDir, {
        manifest: makeManifest({
          fidelity_level: 0,
          data_manifest: {},
          code_manifest: {},
        }),
      });
      const result = validateBundle(bundlePath);
      expect(result.fidelity_verified).toBe(true);
    });

    it('should verify Level 1 bundle with data/ directory', () => {
      const bundlePath = createTestBundle(tmpDir, {
        manifest: makeManifest({
          fidelity_level: 1,
          code_manifest: {},
        }),
        dataFiles: { 'payload.json': '{"value": 1}' },
        schemaFiles: { 'schema.json': { type: 'object', properties: { value: { type: 'number' } } } },
      });
      const result = validateBundle(bundlePath);
      expect(result.fidelity_verified).toBe(true);
    });

    it('should verify Level 2 bundle with data/ and schema', () => {
      const bundlePath = createTestBundle(tmpDir, {
        manifest: makeManifest({
          fidelity_level: 2,
          code_manifest: {},
          data_manifest: {
            'payload.json': {
              purpose: 'Test data',
              source: 'test',
              schema_ref: 'schema.json',
            },
          },
        }),
        dataFiles: { 'payload.json': '{"value": 1}' },
        schemaFiles: { 'schema.json': { type: 'object', properties: { value: { type: 'number' } } } },
      });
      const result = validateBundle(bundlePath);
      expect(result.fidelity_verified).toBe(true);
    });

    it('should verify Level 3 bundle with data/ and code/', () => {
      const bundlePath = createTestBundle(tmpDir, {
        dataFiles: { 'payload.json': '{"value": 1}' },
        schemaFiles: { 'schema.json': { type: 'object', properties: { value: { type: 'number' } } } },
        codeFiles: { 'process.sh': '#!/bin/bash\necho hello' },
      });
      const result = validateBundle(bundlePath);
      expect(result.fidelity_verified).toBe(true);
    });

    it('should fail fidelity_verified for Level 3 bundle missing code/', () => {
      const bundlePath = createTestBundle(tmpDir, {
        manifest: makeManifest({ fidelity_level: 3, code_manifest: {} }),
        dataFiles: { 'payload.json': '{"value": 1}' },
      });
      const result = validateBundle(bundlePath);
      expect(result.fidelity_verified).toBe(false);
      const blockingError = result.errors.find(
        e => e.severity === 'blocking' && e.message.toLowerCase().includes('fidelity'),
      );
      expect(blockingError).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // 4. Referenced file existence (INTERP-01)
  // --------------------------------------------------------------------------
  describe('referenced file existence', () => {
    it('should pass when all referenced data files exist', () => {
      const bundlePath = createTestBundle(tmpDir, {
        dataFiles: { 'payload.json': '{"value": 1}' },
        schemaFiles: { 'schema.json': { type: 'object', properties: { value: { type: 'number' } } } },
        codeFiles: { 'process.sh': '#!/bin/bash\necho hello' },
      });
      const result = validateBundle(bundlePath);
      const missingDataErrors = result.errors.filter(
        e => e.field.includes('data_manifest') && e.message.includes('missing'),
      );
      expect(missingDataErrors).toHaveLength(0);
    });

    it('should return blocking error for data file referenced but missing', () => {
      const manifest = makeManifest({
        data_manifest: {
          'missing.json': {
            purpose: 'Missing file',
            source: 'test',
          },
        },
      });
      const bundlePath = createTestBundle(tmpDir, {
        manifest,
        codeFiles: { 'process.sh': '#!/bin/bash\necho hello' },
      });
      const result = validateBundle(bundlePath);
      const missingError = result.errors.find(
        e => e.message.toLowerCase().includes('missing') && e.message.includes('missing.json'),
      );
      expect(missingError).toBeDefined();
      expect(missingError!.severity).toBe('blocking');
    });

    it('should return blocking error for code file referenced but missing', () => {
      const manifest = makeManifest({
        code_manifest: {
          'missing.sh': {
            purpose: 'Missing script',
            language: 'bash',
            source_skill: 'test-skill',
            deterministic: true,
          },
        },
      });
      const bundlePath = createTestBundle(tmpDir, {
        manifest,
        dataFiles: { 'payload.json': '{"value": 1}' },
        schemaFiles: { 'schema.json': { type: 'object', properties: { value: { type: 'number' } } } },
      });
      const result = validateBundle(bundlePath);
      const missingError = result.errors.find(
        e => e.message.toLowerCase().includes('missing') && e.message.includes('missing.sh'),
      );
      expect(missingError).toBeDefined();
      expect(missingError!.severity).toBe('blocking');
    });
  });

  // --------------------------------------------------------------------------
  // 5. Size limits (INTERP-02)
  // --------------------------------------------------------------------------
  describe('size limits', () => {
    it('should pass bundle within 100KB total', () => {
      const bundlePath = createTestBundle(tmpDir, {
        dataFiles: { 'payload.json': '{"value": 1}' },
        schemaFiles: { 'schema.json': { type: 'object', properties: { value: { type: 'number' } } } },
        codeFiles: { 'process.sh': '#!/bin/bash\necho hello' },
      });
      const result = validateBundle(bundlePath);
      const sizeErrors = result.errors.filter(e => e.message.toLowerCase().includes('size'));
      expect(sizeErrors).toHaveLength(0);
    });

    it('should return blocking error for bundle exceeding total size limit', () => {
      // Create a huge data file to exceed 100KB
      const bigContent = JSON.stringify({ data: 'x'.repeat(110 * 1024) });
      const bundlePath = createTestBundle(tmpDir, {
        manifest: makeManifest({ data_manifest: { 'big.json': { purpose: 'Big data', source: 'test' } }, code_manifest: {} }),
        dataFiles: { 'big.json': bigContent },
      });
      const result = validateBundle(bundlePath);
      const sizeError = result.errors.find(e => e.message.toLowerCase().includes('bundle size'));
      expect(sizeError).toBeDefined();
      expect(sizeError!.severity).toBe('blocking');
    });

    it('should return blocking error for data exceeding 50KB limit', () => {
      const bigData = JSON.stringify({ data: 'x'.repeat(55 * 1024) });
      const bundlePath = createTestBundle(tmpDir, {
        manifest: makeManifest({ data_manifest: { 'big.json': { purpose: 'Big data', source: 'test' } }, code_manifest: {} }),
        dataFiles: { 'big.json': bigData },
      });
      const result = validateBundle(bundlePath);
      const sizeError = result.errors.find(e => e.message.toLowerCase().includes('data size'));
      expect(sizeError).toBeDefined();
      expect(sizeError!.severity).toBe('blocking');
    });

    it('should return blocking error for script exceeding 10KB limit', () => {
      const bigScript = '#!/bin/bash\n' + '#'.repeat(11 * 1024);
      const bundlePath = createTestBundle(tmpDir, {
        dataFiles: { 'payload.json': '{"value": 1}' },
        schemaFiles: { 'schema.json': { type: 'object', properties: { value: { type: 'number' } } } },
        codeFiles: { 'process.sh': bigScript },
      });
      const result = validateBundle(bundlePath);
      const sizeError = result.errors.find(e => e.message.toLowerCase().includes('script size'));
      expect(sizeError).toBeDefined();
      expect(sizeError!.severity).toBe('blocking');
    });
  });

  // --------------------------------------------------------------------------
  // 6. Schema coverage calculation (INTERP-02)
  // --------------------------------------------------------------------------
  describe('schema coverage', () => {
    it('should report schema_coverage 1.0 when all data files have schema_ref', () => {
      const bundlePath = createTestBundle(tmpDir, {
        dataFiles: { 'payload.json': '{"value": 1}' },
        schemaFiles: { 'schema.json': { type: 'object', properties: { value: { type: 'number' } } } },
        codeFiles: { 'process.sh': '#!/bin/bash\necho hello' },
      });
      const result = validateBundle(bundlePath);
      expect(result.schema_coverage).toBe(1.0);
    });

    it('should report schema_coverage 0.5 when half data files have schema_ref', () => {
      const manifest = makeManifest({
        data_manifest: {
          'with-schema.json': {
            purpose: 'Has schema',
            source: 'test',
            schema_ref: 'schema.json',
          },
          'without-schema.json': {
            purpose: 'No schema',
            source: 'test',
          },
        },
      });
      const bundlePath = createTestBundle(tmpDir, {
        manifest,
        dataFiles: {
          'with-schema.json': '{"value": 1}',
          'without-schema.json': '{"other": true}',
        },
        schemaFiles: { 'schema.json': { type: 'object', properties: { value: { type: 'number' } } } },
        codeFiles: { 'process.sh': '#!/bin/bash\necho hello' },
      });
      const result = validateBundle(bundlePath);
      expect(result.schema_coverage).toBe(0.5);
    });

    it('should report schema_coverage 0.0 when no data files have schema_ref', () => {
      const manifest = makeManifest({
        data_manifest: {
          'payload.json': {
            purpose: 'No schema',
            source: 'test',
          },
        },
      });
      const bundlePath = createTestBundle(tmpDir, {
        manifest,
        dataFiles: { 'payload.json': '{"value": 1}' },
        codeFiles: { 'process.sh': '#!/bin/bash\necho hello' },
      });
      const result = validateBundle(bundlePath);
      expect(result.schema_coverage).toBe(0.0);
    });

    it('should report schema_coverage 1.0 when no data files exist (vacuously true)', () => {
      const manifest = makeManifest({
        fidelity_level: 0,
        data_manifest: {},
        code_manifest: {},
      });
      const bundlePath = createTestBundle(tmpDir, { manifest });
      const result = validateBundle(bundlePath);
      expect(result.schema_coverage).toBe(1.0);
    });
  });

  // --------------------------------------------------------------------------
  // 7. Data validation against schemas (INTERP-02)
  // --------------------------------------------------------------------------
  describe('data-schema validation', () => {
    it('should pass when data matches its referenced schema', () => {
      const bundlePath = createTestBundle(tmpDir, {
        dataFiles: { 'payload.json': JSON.stringify({ value: 42 }) },
        schemaFiles: {
          'schema.json': {
            type: 'object',
            properties: { value: { type: 'number' } },
            required: ['value'],
          },
        },
        codeFiles: { 'process.sh': '#!/bin/bash\necho hello' },
      });
      const result = validateBundle(bundlePath);
      const schemaErrors = result.errors.filter(
        e => e.message.toLowerCase().includes('schema validation'),
      );
      expect(schemaErrors).toHaveLength(0);
    });

    it('should return blocking error when data violates its schema', () => {
      const bundlePath = createTestBundle(tmpDir, {
        dataFiles: { 'payload.json': JSON.stringify({ value: 'not-a-number' }) },
        schemaFiles: {
          'schema.json': {
            type: 'object',
            properties: { value: { type: 'number' } },
            required: ['value'],
          },
        },
        codeFiles: { 'process.sh': '#!/bin/bash\necho hello' },
      });
      const result = validateBundle(bundlePath);
      const schemaError = result.errors.find(
        e => e.message.toLowerCase().includes('schema') && e.severity === 'blocking',
      );
      expect(schemaError).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // 8. Script provenance enforcement (SAFE-06)
  // --------------------------------------------------------------------------
  describe('script provenance enforcement', () => {
    it('should pass when script has non-empty source_skill', () => {
      const bundlePath = createTestBundle(tmpDir, {
        dataFiles: { 'payload.json': '{"value": 1}' },
        schemaFiles: { 'schema.json': { type: 'object', properties: { value: { type: 'number' } } } },
        codeFiles: { 'process.sh': '#!/bin/bash\necho hello' },
      });
      const result = validateBundle(bundlePath);
      const provenanceErrors = result.errors.filter(e => e.message.toLowerCase().includes('provenance'));
      expect(provenanceErrors).toHaveLength(0);
    });

    it('should return blocking error for script with empty source_skill', () => {
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
        schemaFiles: { 'schema.json': { type: 'object', properties: { value: { type: 'number' } } } },
        codeFiles: { 'bad.sh': '#!/bin/bash\necho bad' },
      });
      const result = validateBundle(bundlePath);
      const provenanceError = result.errors.find(
        e => e.message.includes('provenance') || e.message.includes('bad.sh'),
      );
      expect(provenanceError).toBeDefined();
      expect(provenanceError!.severity).toBe('blocking');
    });

    it('should return warning for script with source_skill not in provenance.skill_versions', () => {
      const manifest = makeManifest({
        code_manifest: {
          'process.sh': {
            purpose: 'Has provenance',
            language: 'bash',
            source_skill: 'unknown-skill',
            deterministic: true,
          },
        },
        provenance: {
          assembled_by: 'test-assembler',
          assembled_at: '2026-02-27T00:00:00Z',
          skill_versions: { 'other-skill': '1.0.0' },
        },
      });
      const bundlePath = createTestBundle(tmpDir, {
        manifest,
        dataFiles: { 'payload.json': '{"value": 1}' },
        schemaFiles: { 'schema.json': { type: 'object', properties: { value: { type: 'number' } } } },
        codeFiles: { 'process.sh': '#!/bin/bash\necho hello' },
      });
      const result = validateBundle(bundlePath);
      const provenanceWarning = result.warnings.find(
        w => w.message.includes('unknown-skill') || w.message.includes('skill_versions'),
      );
      expect(provenanceWarning).toBeDefined();
    });
  });
});
