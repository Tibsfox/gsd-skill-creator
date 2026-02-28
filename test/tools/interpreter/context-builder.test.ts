/**
 * Tests for the DACP execution context builder.
 *
 * Covers: structured execution context, script review-only references,
 * no-auto-execute enforcement (SAFE-01), empty bundle handling,
 * and assembly rationale formatting.
 */

import { describe, it, expect } from 'vitest';
import { buildExecutionContext } from '../../../src/interpreter/context-builder.js';
import type { LoadedBundle, BundleScript } from '../../../src/interpreter/types.js';
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
    intent_summary: 'Execute the build pipeline',
    human_origin: {
      vision_doc: '/project/vision.md',
      planning_phase: '449',
      user_directive: 'Build interpreter',
    },
    data_manifest: {
      'payload.json': {
        purpose: 'Test data',
        source: 'test',
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
      level_justification: 'High data complexity requires code support',
      skills_used: ['test-skill', 'validation-skill'],
      generated_artifacts: ['payload.json'],
      reused_artifacts: ['process.sh'],
    },
    provenance: {
      assembled_by: 'test-assembler',
      assembled_at: '2026-02-27T00:00:00Z',
      skill_versions: { 'test-skill': '1.0.0', 'validation-skill': '2.1.0' },
    },
    ...overrides,
  };
}

function makeScript(overrides: Partial<BundleScript> = {}): BundleScript {
  return {
    name: 'process.sh',
    path: '/tmp/bundle/code/process.sh',
    purpose: 'Process test data',
    language: 'bash',
    sourceSkill: 'test-skill',
    deterministic: true,
    content: '#!/bin/bash\necho "hello world"',
    sizeBytes: 30,
    ...overrides,
  };
}

function makeLoadedBundle(overrides: Partial<LoadedBundle> = {}): LoadedBundle {
  return {
    bundlePath: '/tmp/bundle',
    manifest: makeManifest(),
    intent: '# Build Pipeline\n\nExecute the build steps in order.',
    data: { 'payload.json': { value: 42, nested: { key: 'val' } } },
    schemas: { 'schema.json': { type: 'object', properties: { value: { type: 'number' } } } },
    scripts: [makeScript()],
    fidelityLevel: 3,
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('buildExecutionContext', () => {
  // --------------------------------------------------------------------------
  // 1. Structured execution context (INTERP-03)
  // --------------------------------------------------------------------------
  describe('structured execution context', () => {
    it('should return ExecutionContext with all fields populated', () => {
      const bundle = makeLoadedBundle();
      const ctx = buildExecutionContext(bundle);
      expect(ctx.intentSummary).toBeDefined();
      expect(ctx.intentMarkdown).toBeDefined();
      expect(ctx.typedData).toBeDefined();
      expect(ctx.scriptReferences).toBeDefined();
      expect(ctx.fidelityLevel).toBeDefined();
      expect(ctx.sourceAgent).toBeDefined();
      expect(ctx.targetAgent).toBeDefined();
      expect(ctx.assemblyRationale).toBeDefined();
    });

    it('should set intentSummary from manifest.intent_summary', () => {
      const bundle = makeLoadedBundle();
      const ctx = buildExecutionContext(bundle);
      expect(ctx.intentSummary).toBe('Execute the build pipeline');
    });

    it('should set intentMarkdown from LoadedBundle.intent', () => {
      const bundle = makeLoadedBundle();
      const ctx = buildExecutionContext(bundle);
      expect(ctx.intentMarkdown).toBe('# Build Pipeline\n\nExecute the build steps in order.');
    });

    it('should include all data entries in typedData', () => {
      const bundle = makeLoadedBundle();
      const ctx = buildExecutionContext(bundle);
      expect(ctx.typedData['payload.json']).toEqual({ value: 42, nested: { key: 'val' } });
    });

    it('should set fidelityLevel from LoadedBundle.fidelityLevel', () => {
      const bundle = makeLoadedBundle();
      const ctx = buildExecutionContext(bundle);
      expect(ctx.fidelityLevel).toBe(3);
    });

    it('should set sourceAgent from manifest.source_agent', () => {
      const bundle = makeLoadedBundle();
      const ctx = buildExecutionContext(bundle);
      expect(ctx.sourceAgent).toBe('test-assembler');
    });

    it('should set targetAgent from manifest.target_agent', () => {
      const bundle = makeLoadedBundle();
      const ctx = buildExecutionContext(bundle);
      expect(ctx.targetAgent).toBe('test-executor');
    });

    it('should set assemblyRationale as human-readable string', () => {
      const bundle = makeLoadedBundle();
      const ctx = buildExecutionContext(bundle);
      expect(typeof ctx.assemblyRationale).toBe('string');
      expect(ctx.assemblyRationale).not.toBe('');
      // Should not be raw JSON
      expect(ctx.assemblyRationale).not.toContain('{');
    });
  });

  // --------------------------------------------------------------------------
  // 2. Script references are review-only (INTERP-05, SAFE-01)
  // --------------------------------------------------------------------------
  describe('script references are review-only', () => {
    it('should include scriptReferences for each script', () => {
      const bundle = makeLoadedBundle();
      const ctx = buildExecutionContext(bundle);
      expect(ctx.scriptReferences).toHaveLength(1);
    });

    it('should include name, purpose, deterministic, sourceSkill, and content in each reference', () => {
      const bundle = makeLoadedBundle();
      const ctx = buildExecutionContext(bundle);
      const ref = ctx.scriptReferences[0];
      expect(ref.name).toBe('process.sh');
      expect(ref.purpose).toBe('Process test data');
      expect(ref.deterministic).toBe(true);
      expect(ref.sourceSkill).toBe('test-skill');
      expect(ref.content).toBe('#!/bin/bash\necho "hello world"');
    });

    it('should NOT contain an execute() method on script references', () => {
      const bundle = makeLoadedBundle();
      const ctx = buildExecutionContext(bundle);
      const ref = ctx.scriptReferences[0] as Record<string, unknown>;
      expect(ref.execute).toBeUndefined();
    });

    it('should NOT contain a run() method on script references', () => {
      const bundle = makeLoadedBundle();
      const ctx = buildExecutionContext(bundle);
      const ref = ctx.scriptReferences[0] as Record<string, unknown>;
      expect(ref.run).toBeUndefined();
    });

    it('should have script content as raw text string for reading', () => {
      const bundle = makeLoadedBundle();
      const ctx = buildExecutionContext(bundle);
      expect(typeof ctx.scriptReferences[0].content).toBe('string');
    });
  });

  // --------------------------------------------------------------------------
  // 3. No-auto-execute enforcement (SAFE-01)
  // --------------------------------------------------------------------------
  describe('no-auto-execute enforcement', () => {
    it('should return a plain data object with no callable methods', () => {
      const bundle = makeLoadedBundle();
      const ctx = buildExecutionContext(bundle);
      // Check no methods on the context itself
      for (const [key, value] of Object.entries(ctx)) {
        if (key !== 'scriptReferences' && key !== 'typedData') {
          expect(typeof value).not.toBe('function');
        }
      }
    });

    it('should have only string or boolean values in scriptReferences entries', () => {
      const bundle = makeLoadedBundle();
      const ctx = buildExecutionContext(bundle);
      for (const ref of ctx.scriptReferences) {
        for (const value of Object.values(ref)) {
          expect(['string', 'boolean']).toContain(typeof value);
        }
      }
    });

    it('should not contain class instances in scriptReferences', () => {
      const bundle = makeLoadedBundle();
      const ctx = buildExecutionContext(bundle);
      for (const ref of ctx.scriptReferences) {
        // Plain object check: constructor is Object (not a class)
        expect(Object.getPrototypeOf(ref)).toBe(Object.prototype);
      }
    });
  });

  // --------------------------------------------------------------------------
  // 4. Empty bundle handling
  // --------------------------------------------------------------------------
  describe('empty bundle handling', () => {
    it('should handle Level 0 bundle with empty typedData and scriptReferences', () => {
      const bundle = makeLoadedBundle({
        data: {},
        schemas: {},
        scripts: [],
        fidelityLevel: 0,
        manifest: makeManifest({
          fidelity_level: 0,
          data_manifest: {},
          code_manifest: {},
        }),
      });
      const ctx = buildExecutionContext(bundle);
      expect(Object.keys(ctx.typedData)).toHaveLength(0);
      expect(ctx.scriptReferences).toHaveLength(0);
    });

    it('should handle Level 1 bundle with data but no scripts', () => {
      const bundle = makeLoadedBundle({
        scripts: [],
        fidelityLevel: 1,
        manifest: makeManifest({
          fidelity_level: 1,
          code_manifest: {},
        }),
      });
      const ctx = buildExecutionContext(bundle);
      expect(Object.keys(ctx.typedData).length).toBeGreaterThan(0);
      expect(ctx.scriptReferences).toHaveLength(0);
    });
  });

  // --------------------------------------------------------------------------
  // 5. Assembly rationale formatting
  // --------------------------------------------------------------------------
  describe('assembly rationale formatting', () => {
    it('should include level justification in rationale string', () => {
      const bundle = makeLoadedBundle();
      const ctx = buildExecutionContext(bundle);
      expect(ctx.assemblyRationale).toContain('High data complexity requires code support');
    });

    it('should include skills used in rationale string', () => {
      const bundle = makeLoadedBundle();
      const ctx = buildExecutionContext(bundle);
      expect(ctx.assemblyRationale).toContain('test-skill');
      expect(ctx.assemblyRationale).toContain('validation-skill');
    });

    it('should include generated artifacts in rationale string', () => {
      const bundle = makeLoadedBundle();
      const ctx = buildExecutionContext(bundle);
      expect(ctx.assemblyRationale).toContain('payload.json');
    });

    it('should include reused artifacts in rationale string', () => {
      const bundle = makeLoadedBundle();
      const ctx = buildExecutionContext(bundle);
      expect(ctx.assemblyRationale).toContain('process.sh');
    });

    it('should format as readable text with level prefix', () => {
      const bundle = makeLoadedBundle();
      const ctx = buildExecutionContext(bundle);
      expect(ctx.assemblyRationale).toMatch(/^Level 3 assigned:/);
    });
  });
});
