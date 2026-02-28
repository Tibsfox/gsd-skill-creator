/**
 * Phase 456 verification tests for DACP interpreter.
 * Tests IN-01 through IN-08: bundle detection, loading, validation,
 * provenance enforcement, and no-auto-execute safety.
 *
 * @module test/dacp/interpreter
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { loadBundle } from '../../../src/tools/interpreter/loader.js';
import { buildExecutionContext } from '../../../src/tools/interpreter/context-builder.js';
import { validateProvenance } from '../../../src/tools/interpreter/provenance-guard.js';
import type { BundleManifest } from '../../../src/dacp/types.js';

// ============================================================================
// Factories
// ============================================================================

function makeManifest(overrides: Partial<BundleManifest> = {}): BundleManifest {
  return {
    version: '1.0.0',
    fidelity_level: 2,
    source_agent: 'planner',
    target_agent: 'executor',
    opcode: 'EXEC',
    intent_summary: 'Test intent summary',
    human_origin: {
      vision_doc: 'PROJECT.md',
      planning_phase: '456',
      user_directive: 'Run tests',
    },
    data_manifest: {},
    code_manifest: {},
    assembly_rationale: {
      level_justification: 'Test level 2',
      skills_used: [],
      generated_artifacts: ['intent.md'],
      reused_artifacts: [],
    },
    provenance: {
      assembled_by: 'dacp-assembler',
      assembled_at: new Date().toISOString(),
      skill_versions: {},
    },
    ...overrides,
  };
}

function createBundleDir(
  basePath: string,
  manifest: BundleManifest,
  options: {
    intent?: string;
    dataFiles?: Record<string, string>;
    codeFiles?: Record<string, string>;
    addComplete?: boolean;
  } = {},
): string {
  const bundlePath = join(basePath, 'test.bundle');
  mkdirSync(bundlePath, { recursive: true });
  mkdirSync(join(bundlePath, 'data'), { recursive: true });
  mkdirSync(join(bundlePath, 'code'), { recursive: true });

  writeFileSync(
    join(bundlePath, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
  );
  writeFileSync(
    join(bundlePath, 'intent.md'),
    options.intent ?? '# Test Intent\n\nThis is a test.',
  );

  if (options.dataFiles) {
    for (const [name, content] of Object.entries(options.dataFiles)) {
      writeFileSync(join(bundlePath, 'data', name), content);
    }
  }

  if (options.codeFiles) {
    for (const [name, content] of Object.entries(options.codeFiles)) {
      writeFileSync(join(bundlePath, 'code', name), content);
    }
  }

  if (options.addComplete !== false) {
    writeFileSync(join(bundlePath, '.complete'), '');
  }

  return bundlePath;
}

// ============================================================================
// Setup
// ============================================================================

let testDir: string;

beforeEach(() => {
  testDir = join(tmpdir(), `dacp-interp-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(testDir, { recursive: true });
});

afterEach(() => {
  try {
    rmSync(testDir, { recursive: true, force: true });
  } catch {
    // Best effort cleanup
  }
});

// ============================================================================
// Tests
// ============================================================================

describe('Interpreter (IN-01 to IN-08)', () => {
  // IN-01: Bundle detected with .complete marker
  it('IN-01: bundle with .complete marker loads successfully', () => {
    const manifest = makeManifest();
    const bundlePath = createBundleDir(testDir, manifest);

    const loaded = loadBundle(bundlePath);
    expect(loaded.manifest.version).toBe('1.0.0');
    expect(loaded.fidelityLevel).toBe(2);
  });

  // IN-02: No bundle graceful (missing bundle dir)
  it('IN-02: non-existent bundle path throws descriptive error', () => {
    const fakePath = join(testDir, 'nonexistent.bundle');
    expect(() => loadBundle(fakePath)).toThrow(/not found/i);
  });

  // IN-03: Valid Level 3 bundle loads with all components
  it('IN-03: Level 3 bundle loads with data and code entries', () => {
    const manifest = makeManifest({
      fidelity_level: 3,
      data_manifest: {
        'payload.json': { purpose: 'test data', source: 'test' },
      },
      code_manifest: {
        'validate.sh': {
          purpose: 'validation script',
          language: 'bash',
          source_skill: 'test-skill',
          deterministic: true,
        },
      },
      provenance: {
        assembled_by: 'dacp-assembler',
        assembled_at: new Date().toISOString(),
        skill_versions: { 'test-skill': '1.0.0' },
      },
    });

    const bundlePath = createBundleDir(testDir, manifest, {
      dataFiles: { 'payload.json': '{"key":"value"}' },
      codeFiles: { 'validate.sh': '#!/bin/bash\necho "ok"' },
    });

    const loaded = loadBundle(bundlePath);
    expect(loaded.data['payload.json']).toEqual({ key: 'value' });
    expect(loaded.scripts).toHaveLength(1);
    expect(loaded.scripts[0].name).toBe('validate.sh');
    expect(loaded.scripts[0].sourceSkill).toBe('test-skill');
  });

  // IN-04: Invalid bundle rejected (corrupt manifest)
  it('IN-04: corrupt manifest.json causes load error', () => {
    const bundlePath = join(testDir, 'corrupt.bundle');
    mkdirSync(bundlePath, { recursive: true });
    writeFileSync(join(bundlePath, 'manifest.json'), '{ INVALID JSON }}}');
    writeFileSync(join(bundlePath, 'intent.md'), '# Test');
    writeFileSync(join(bundlePath, '.complete'), '');

    expect(() => loadBundle(bundlePath)).toThrow(/malformed|json|invalid/i);
  });

  // IN-05: Scripts staged with metadata
  it('IN-05: loaded scripts include purpose and sourceSkill from manifest', () => {
    const manifest = makeManifest({
      fidelity_level: 3,
      code_manifest: {
        'parser.sh': {
          purpose: 'Parse JSON config',
          language: 'bash',
          source_skill: 'config-parser',
          deterministic: true,
        },
      },
      provenance: {
        assembled_by: 'test',
        assembled_at: new Date().toISOString(),
        skill_versions: { 'config-parser': '2.0.0' },
      },
    });

    const bundlePath = createBundleDir(testDir, manifest, {
      codeFiles: { 'parser.sh': '#!/bin/bash\njq . $1' },
    });

    const loaded = loadBundle(bundlePath);
    const script = loaded.scripts[0];
    expect(script.purpose).toBe('Parse JSON config');
    expect(script.sourceSkill).toBe('config-parser');
    expect(script.deterministic).toBe(true);
  });

  // IN-06: Execution context built from loaded bundle
  it('IN-06: buildExecutionContext produces frozen context', () => {
    const manifest = makeManifest();
    const bundlePath = createBundleDir(testDir, manifest, {
      intent: '# Important Task\n\nDo the thing.',
    });

    const loaded = loadBundle(bundlePath);
    const ctx = buildExecutionContext(loaded);

    expect(ctx.intentSummary).toBe('Test intent summary');
    expect(ctx.intentMarkdown).toContain('Important Task');
    expect(ctx.fidelityLevel).toBe(2);
    expect(ctx.sourceAgent).toBe('planner');
    expect(Object.isFrozen(ctx)).toBe(true);
  });

  // IN-07: Missing data file referenced in manifest
  it('IN-07: missing data file referenced in manifest does not throw but data is empty', () => {
    const manifest = makeManifest({
      data_manifest: {
        'missing.json': { purpose: 'test', source: 'test' },
      },
    });

    // Create bundle without the referenced data file
    const bundlePath = createBundleDir(testDir, manifest);
    const loaded = loadBundle(bundlePath);
    // The file is referenced but doesn't exist on disk - loader skips it
    expect(loaded.data['missing.json']).toBeUndefined();
  });

  // IN-08: Provenance validation
  it('IN-08: provenance validation detects unregistered skill versions', () => {
    const scripts = [
      {
        name: 'test.sh',
        path: '/test.sh',
        purpose: 'test script',
        language: 'bash',
        sourceSkill: 'unknown-skill',
        deterministic: true,
        content: 'echo test',
        sizeBytes: 9,
      },
    ];

    const provenance = {
      assembled_by: 'test',
      assembled_at: new Date().toISOString(),
      skill_versions: { 'other-skill': '1.0.0' }, // 'unknown-skill' not registered
    };

    const results = validateProvenance(scripts, provenance);
    expect(results).toHaveLength(1);
    expect(results[0].valid).toBe(false);
    expect(results[0].reason).toContain('not found in provenance');
  });
});
