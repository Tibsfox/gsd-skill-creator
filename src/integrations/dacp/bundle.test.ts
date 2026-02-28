/**
 * Tests for DACP bundle filesystem layout and creation utilities.
 *
 * @module dacp/bundle.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  generateBundleName,
  createBundle,
  isBundleComplete,
  listBundleContents,
  BUNDLE_LAYOUT,
  MAX_DATA_SIZE,
  MAX_SCRIPT_SIZE,
  MAX_MANIFEST_SIZE,
  MAX_INTENT_SIZE,
  MAX_BUNDLE_SIZE,
} from './bundle.js';
import type { CreateBundleOptions } from './bundle.js';
import type { BundleManifest } from './types.js';

// ============================================================================
// Test helpers
// ============================================================================

/** Create a valid BundleManifest for testing. */
function makeManifest(overrides: Partial<BundleManifest> = {}): BundleManifest {
  return {
    version: '1.0.0',
    fidelity_level: 1,
    source_agent: 'planner',
    target_agent: 'executor',
    opcode: 'EXEC',
    intent_summary: 'Execute the test plan',
    human_origin: {
      vision_doc: '.planning/PROJECT.md',
      planning_phase: '447',
      user_directive: 'Build bundle format',
    },
    data_manifest: {},
    code_manifest: {},
    assembly_rationale: {
      level_justification: 'Simple data handoff',
      skills_used: [],
      generated_artifacts: [],
      reused_artifacts: [],
    },
    provenance: {
      assembled_by: 'dacp-assembler',
      assembled_at: '2026-02-27T12:00:00Z',
      skill_versions: {},
    },
    ...overrides,
  };
}

/** Create standard CreateBundleOptions for testing. */
function makeOptions(tmpDir: string, overrides: Partial<CreateBundleOptions> = {}): CreateBundleOptions {
  return {
    outputDir: tmpDir,
    priority: 4,
    opcode: 'EXEC',
    sourceAgent: 'planner',
    targetAgent: 'executor',
    manifest: makeManifest(),
    intentMarkdown: '# Test Intent\n\nExecute the test plan.',
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('DACP Bundle', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'dacp-bundle-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  // --------------------------------------------------------------------------
  // Layout constants
  // --------------------------------------------------------------------------

  describe('BUNDLE_LAYOUT', () => {
    it('defines required files including .complete marker', () => {
      expect(BUNDLE_LAYOUT.required.files).toContain('manifest.json');
      expect(BUNDLE_LAYOUT.required.files).toContain('intent.md');
      expect(BUNDLE_LAYOUT.required.files).toContain('.complete');
    });

    it('defines required subdirectories', () => {
      expect(BUNDLE_LAYOUT.required.dirs).toContain('data');
      expect(BUNDLE_LAYOUT.required.dirs).toContain('code');
    });

    it('defines optional subdirectories', () => {
      expect(BUNDLE_LAYOUT.optional.dirs).toContain('data/fixtures');
      expect(BUNDLE_LAYOUT.optional.dirs).toContain('code/helpers');
      expect(BUNDLE_LAYOUT.optional.dirs).toContain('tests');
    });
  });

  // --------------------------------------------------------------------------
  // Size limit constants
  // --------------------------------------------------------------------------

  describe('size limits', () => {
    it('has correct size limit values', () => {
      expect(MAX_DATA_SIZE).toBe(50 * 1024);
      expect(MAX_SCRIPT_SIZE).toBe(10 * 1024);
      expect(MAX_MANIFEST_SIZE).toBe(10 * 1024);
      expect(MAX_INTENT_SIZE).toBe(20 * 1024);
      expect(MAX_BUNDLE_SIZE).toBe(100 * 1024);
    });
  });

  // --------------------------------------------------------------------------
  // Bundle naming
  // --------------------------------------------------------------------------

  describe('generateBundleName', () => {
    it('follows {priority}-{YYYYMMDD-HHMMSS}-{opcode}-{src}-{dst}.bundle format', () => {
      const ts = new Date(Date.UTC(2026, 1, 27, 14, 30, 45)); // 2026-02-27 14:30:45
      const name = generateBundleName(4, 'EXEC', 'planner', 'executor', ts);
      expect(name).toBe('4-20260227-143045-EXEC-planner-executor.bundle');
    });

    it('uses current time when no timestamp provided', () => {
      const name = generateBundleName(2, 'VERIFY', 'executor', 'verifier');
      expect(name).toMatch(/^2-\d{8}-\d{6}-VERIFY-executor-verifier\.bundle$/);
    });

    it('supports all priority levels 0-7', () => {
      for (let p = 0; p <= 7; p++) {
        const name = generateBundleName(p, 'NOP', 'a', 'b', new Date(0));
        expect(name).toMatch(new RegExp(`^${p}-`));
      }
    });
  });

  // --------------------------------------------------------------------------
  // Bundle creation
  // --------------------------------------------------------------------------

  describe('createBundle', () => {
    it('produces a directory with manifest.json, intent.md, and .complete', async () => {
      const bundlePath = await createBundle(makeOptions(tmpDir));

      const entries = await readdir(bundlePath);
      expect(entries).toContain('manifest.json');
      expect(entries).toContain('intent.md');
      expect(entries).toContain('.complete');
    });

    it('creates data/ subdirectory', async () => {
      const bundlePath = await createBundle(makeOptions(tmpDir));
      const entries = await readdir(bundlePath);
      expect(entries).toContain('data');
    });

    it('creates code/ subdirectory', async () => {
      const bundlePath = await createBundle(makeOptions(tmpDir));
      const entries = await readdir(bundlePath);
      expect(entries).toContain('code');
    });

    it('writes data files to data/ subdirectory', async () => {
      const dataFiles = {
        'config.json': JSON.stringify({ key: 'value' }),
        'state.json': JSON.stringify({ phase: 447 }),
      };
      const bundlePath = await createBundle(makeOptions(tmpDir, { dataFiles }));

      const dataEntries = await readdir(join(bundlePath, 'data'));
      expect(dataEntries).toContain('config.json');
      expect(dataEntries).toContain('state.json');

      const content = await readFile(join(bundlePath, 'data', 'config.json'), 'utf8');
      expect(JSON.parse(content)).toEqual({ key: 'value' });
    });

    it('writes code files to code/ subdirectory', async () => {
      const codeFiles = {
        'transform.sh': '#!/bin/bash\necho "transform"',
        'validate.sh': '#!/bin/bash\necho "validate"',
      };
      const bundlePath = await createBundle(makeOptions(tmpDir, { codeFiles }));

      const codeEntries = await readdir(join(bundlePath, 'code'));
      expect(codeEntries).toContain('transform.sh');
      expect(codeEntries).toContain('validate.sh');

      const content = await readFile(join(bundlePath, 'code', 'transform.sh'), 'utf8');
      expect(content).toContain('echo "transform"');
    });

    it('manifest.json content matches provided BundleManifest', async () => {
      const manifest = makeManifest({
        intent_summary: 'Custom intent for this test',
        fidelity_level: 2,
      });
      const bundlePath = await createBundle(makeOptions(tmpDir, { manifest }));

      const content = await readFile(join(bundlePath, 'manifest.json'), 'utf8');
      const parsed = JSON.parse(content);
      expect(parsed.intent_summary).toBe('Custom intent for this test');
      expect(parsed.fidelity_level).toBe(2);
      expect(parsed.version).toBe('1.0.0');
      expect(parsed.source_agent).toBe('planner');
    });

    it('rejects invalid manifest via Zod validation', async () => {
      const badManifest = { version: '1.0.0' } as unknown as BundleManifest;
      await expect(
        createBundle(makeOptions(tmpDir, { manifest: badManifest })),
      ).rejects.toThrow();
    });

    it('rejects data exceeding MAX_DATA_SIZE', async () => {
      const largeData = 'x'.repeat(MAX_DATA_SIZE + 1);
      const dataFiles = { 'big.json': largeData };
      await expect(
        createBundle(makeOptions(tmpDir, { dataFiles })),
      ).rejects.toThrow(/data files total.*exceeds/i);
    });

    it('rejects individual script exceeding MAX_SCRIPT_SIZE', async () => {
      const largeScript = '#'.repeat(MAX_SCRIPT_SIZE + 1);
      const codeFiles = { 'big.sh': largeScript };
      await expect(
        createBundle(makeOptions(tmpDir, { codeFiles })),
      ).rejects.toThrow(/script.*exceeds/i);
    });

    it('returns the full bundle directory path', async () => {
      const ts = new Date(Date.UTC(2026, 1, 27, 10, 0, 0));
      const bundlePath = await createBundle(makeOptions(tmpDir, { timestamp: ts }));
      expect(bundlePath).toContain(tmpDir);
      expect(bundlePath).toMatch(/\.bundle$/);
    });
  });

  // --------------------------------------------------------------------------
  // Bundle completeness
  // --------------------------------------------------------------------------

  describe('isBundleComplete', () => {
    it('returns true for bundles with .complete marker', async () => {
      const bundlePath = await createBundle(makeOptions(tmpDir));
      expect(await isBundleComplete(bundlePath)).toBe(true);
    });

    it('returns false for directories missing .complete', async () => {
      // Just a plain empty directory
      const dirPath = join(tmpDir, 'not-a-bundle');
      const { mkdir } = await import('node:fs/promises');
      await mkdir(dirPath, { recursive: true });
      expect(await isBundleComplete(dirPath)).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Bundle listing
  // --------------------------------------------------------------------------

  describe('listBundleContents', () => {
    it('returns correct structure for a complete bundle', async () => {
      const dataFiles = { 'info.json': '{}' };
      const codeFiles = { 'run.sh': '#!/bin/bash\nexit 0' };
      const bundlePath = await createBundle(
        makeOptions(tmpDir, { dataFiles, codeFiles }),
      );

      const contents = await listBundleContents(bundlePath);

      expect(contents.complete).toBe(true);
      expect(contents.hasManifest).toBe(true);
      expect(contents.hasIntent).toBe(true);
      expect(contents.dataFiles).toContain('info.json');
      expect(contents.codeFiles).toContain('run.sh');
      expect(contents.rootFiles).toContain('manifest.json');
      expect(contents.rootFiles).toContain('intent.md');
      expect(contents.rootFiles).toContain('.complete');
    });

    it('returns empty arrays for bundle without data or code files', async () => {
      const bundlePath = await createBundle(makeOptions(tmpDir));
      const contents = await listBundleContents(bundlePath);

      expect(contents.dataFiles).toEqual([]);
      expect(contents.codeFiles).toEqual([]);
    });
  });
});
