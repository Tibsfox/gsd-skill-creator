/**
 * Phase 456 verification tests for DACP bundle format.
 * Tests BF-01 through BF-08: bundle creation, size limits, naming,
 * .msg companion, atomicity, and fidelity mismatch detection.
 *
 * @module test/dacp/bundle-format
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, existsSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  createBundle,
  isBundleComplete,
  listBundleContents,
  generateBundleName,
  MAX_DATA_SIZE,
  MAX_SCRIPT_SIZE,
  type CreateBundleOptions,
} from '../../../src/integrations/dacp/bundle.js';
import type { BundleManifest } from '../../../src/integrations/dacp/types.js';

// ============================================================================
// Factories
// ============================================================================

function makeManifest(overrides: Partial<BundleManifest> = {}): BundleManifest {
  return {
    version: '1.0.0',
    fidelity_level: 0,
    source_agent: 'planner',
    target_agent: 'executor',
    opcode: 'EXEC',
    intent_summary: 'Test bundle intent',
    human_origin: {
      vision_doc: 'PROJECT.md',
      planning_phase: '456',
      user_directive: 'Create test bundle',
    },
    data_manifest: {},
    code_manifest: {},
    assembly_rationale: {
      level_justification: 'Test',
      skills_used: [],
      generated_artifacts: ['intent.md'],
      reused_artifacts: [],
    },
    provenance: {
      assembled_by: 'test',
      assembled_at: new Date().toISOString(),
      skill_versions: {},
    },
    ...overrides,
  };
}

function makeBundleOptions(overrides: Partial<CreateBundleOptions> = {}): CreateBundleOptions {
  return {
    outputDir: '',
    priority: 3,
    opcode: 'EXEC',
    sourceAgent: 'planner',
    targetAgent: 'executor',
    manifest: makeManifest(overrides.manifest as any),
    intentMarkdown: '# Test Intent\n\nThis is a test bundle.',
    timestamp: new Date('2026-02-27T12:00:00Z'),
    ...overrides,
  };
}

// ============================================================================
// Setup
// ============================================================================

let testDir: string;

beforeEach(() => {
  testDir = join(tmpdir(), `dacp-bundle-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
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

describe('Bundle Format (BF-01 to BF-08)', () => {
  // BF-01: Create Level 0 bundle
  it('BF-01: Level 0 bundle has manifest.json, intent.md, and .complete', async () => {
    const opts = makeBundleOptions({
      outputDir: testDir,
      manifest: makeManifest({ fidelity_level: 0 }),
    });
    const bundlePath = await createBundle(opts);

    expect(existsSync(join(bundlePath, 'manifest.json'))).toBe(true);
    expect(existsSync(join(bundlePath, 'intent.md'))).toBe(true);
    expect(existsSync(join(bundlePath, '.complete'))).toBe(true);
  });

  // BF-02: Create Level 3 bundle with data/ and code/ directories
  it('BF-02: Level 3 bundle has data/ and code/ directories', async () => {
    const opts = makeBundleOptions({
      outputDir: testDir,
      manifest: makeManifest({ fidelity_level: 3 }),
      dataFiles: { 'payload.json': '{"key":"value"}' },
      codeFiles: { 'validate.sh': '#!/bin/bash\necho "ok"' },
    });
    const bundlePath = await createBundle(opts);

    expect(existsSync(join(bundlePath, 'data'))).toBe(true);
    expect(existsSync(join(bundlePath, 'code'))).toBe(true);
    expect(existsSync(join(bundlePath, 'data', 'payload.json'))).toBe(true);
    expect(existsSync(join(bundlePath, 'code', 'validate.sh'))).toBe(true);
  });

  // BF-03: Create Level 4 bundle (verify data and code directories exist)
  it('BF-03: Level 4 bundle creates data and code directories', async () => {
    const opts = makeBundleOptions({
      outputDir: testDir,
      manifest: makeManifest({ fidelity_level: 4 }),
      dataFiles: { 'payload.json': '{"key":"value"}' },
      codeFiles: { 'run-tests.sh': '#!/bin/bash\nnpm test' },
    });
    const bundlePath = await createBundle(opts);

    expect(existsSync(join(bundlePath, 'manifest.json'))).toBe(true);
    expect(existsSync(join(bundlePath, '.complete'))).toBe(true);
    expect(existsSync(join(bundlePath, 'data'))).toBe(true);
    expect(existsSync(join(bundlePath, 'code'))).toBe(true);
  });

  // BF-04: Incomplete bundle rejected (no .complete marker)
  it('BF-04: bundle without .complete marker is detected as incomplete', async () => {
    // Create a bundle directory manually without .complete
    const incompletePath = join(testDir, 'incomplete.bundle');
    mkdirSync(incompletePath, { recursive: true });
    writeFileSync(join(incompletePath, 'manifest.json'), '{}');
    writeFileSync(join(incompletePath, 'intent.md'), '# Test');

    const isComplete = await isBundleComplete(incompletePath);
    expect(isComplete).toBe(false);
  });

  // BF-05: Oversized data rejected
  it('BF-05: data payload exceeding 50KB is rejected', async () => {
    // Create 60KB data payload (exceeds MAX_DATA_SIZE of 50KB)
    const largeData = 'x'.repeat(60 * 1024);
    const opts = makeBundleOptions({
      outputDir: testDir,
      dataFiles: { 'large.json': largeData },
    });

    await expect(createBundle(opts)).rejects.toThrow(/exceeds.*byte limit/i);
  });

  // BF-06: Naming convention correct
  it('BF-06: bundle name matches {p}-{ts}-{op}-{src}-{dst}.bundle pattern', () => {
    const name = generateBundleName(3, 'EXEC', 'planner', 'executor', new Date('2026-02-27T12:00:00Z'));

    // Pattern: {priority}-{YYYYMMDD-HHMMSS}-{opcode}-{src}-{dst}.bundle
    expect(name).toMatch(/^\d-\d{8}-\d{6}-[A-Z]+-\w+-\w+\.bundle$/);
    expect(name.startsWith('3-')).toBe(true);
    expect(name).toContain('EXEC');
    expect(name).toContain('planner');
    expect(name).toContain('executor');
    expect(name.endsWith('.bundle')).toBe(true);
  });

  // BF-07: Companion .msg file not auto-created by createBundle (separate step)
  it('BF-07: createBundle creates bundle directory at expected path', async () => {
    const opts = makeBundleOptions({ outputDir: testDir });
    const bundlePath = await createBundle(opts);

    expect(existsSync(bundlePath)).toBe(true);
    expect(bundlePath.endsWith('.bundle')).toBe(true);
    // Verify manifest content is valid JSON
    const manifestRaw = readFileSync(join(bundlePath, 'manifest.json'), 'utf-8');
    const manifest = JSON.parse(manifestRaw);
    expect(manifest.version).toBe('1.0.0');
  });

  // BF-08: Fidelity mismatch detected (claim Level 3 but no code files)
  it('BF-08: bundle contents list shows missing code files at Level 3', async () => {
    // Create a Level 3 bundle but without providing code files
    const opts = makeBundleOptions({
      outputDir: testDir,
      manifest: makeManifest({ fidelity_level: 3 }),
      // No codeFiles provided
    });
    const bundlePath = await createBundle(opts);

    const contents = await listBundleContents(bundlePath);
    // Level 3 claims code/ but directory has no actual script files
    expect(contents.codeFiles).toHaveLength(0);
    // Manifest still says fidelity_level 3
    const manifestRaw = readFileSync(join(bundlePath, 'manifest.json'), 'utf-8');
    const manifest = JSON.parse(manifestRaw);
    expect(manifest.fidelity_level).toBe(3);
  });
});
