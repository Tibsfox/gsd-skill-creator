/**
 * Integration tests exercising cross-module pipeline paths.
 *
 * These tests verify that Aminet modules work together correctly:
 * - Mirror state lifecycle (not-mirrored -> mirrored -> clean -> installed)
 * - Scan gate enforcement across pipeline stages
 * - Pipeline stage orchestration
 * - Signature scanning with real builtin signatures
 * - End-to-end state flow with persistence
 *
 * All external tools (lhasa, unlzx, fs-uae) are mocked. Tests use temp
 * directories with proper setup/teardown following the batchScan pattern.
 *
 * @module integration-test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  loadMirrorState,
  saveMirrorState,
  updateEntry,
  scanPackage,
  loadScanPolicy,
  defaultScanPolicy,
  checkScanGate,
  loadSignatureDatabase,
  getBuiltinSignaturesDir,
  searchPackages,
} from './index.js';

import { executePipelineStage } from './pipeline.js';
import type { PipelineStageResult } from './pipeline.js';
import type {
  MirrorState,
  AminetPackage,
  VirusSignature,
  ScanPolicyConfig,
} from './types.js';

// ============================================================================
// Test helpers
// ============================================================================

/** Create a unique temp directory name */
function makeTmpDir(): string {
  const name = `aminet-integ-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const dir = join(tmpdir(), name);
  mkdirSync(dir, { recursive: true });
  return dir;
}

/** Build an empty default mirror state */
function emptyMirrorState(): MirrorState {
  return {
    entries: {},
    lastUpdated: new Date().toISOString(),
    version: 1,
  };
}

/** Build a minimal AminetPackage for testing */
function makeTestPackage(overrides?: Partial<AminetPackage>): AminetPackage {
  return {
    filename: 'TestPkg.lha',
    directory: 'util/misc',
    category: 'util',
    subcategory: 'misc',
    sizeKb: 42,
    ageDays: 10,
    description: 'A test package for integration testing',
    fullPath: 'util/misc/TestPkg.lha',
    ...overrides,
  };
}

/** "Something wonderful" in bytes -- the real SCA signature pattern */
const SCA_SIGNATURE_TEXT = 'Something wonderful';
const SCA_BYTES = new TextEncoder().encode(SCA_SIGNATURE_TEXT);

/** DOS\0 magic bytes for boot blocks */
const DOS_MAGIC = new Uint8Array([0x44, 0x4F, 0x53, 0x00]);

/**
 * Build a 1024-byte boot block with DOS\0 magic and optional payload.
 * The payload is placed at the given offset (default 12, start of boot code area).
 */
function buildBootBlock(payload?: Uint8Array, payloadOffset = 12): Uint8Array {
  const block = new Uint8Array(1024);
  // DOS\0 magic at offset 0
  block.set(DOS_MAGIC, 0);
  // Zero checksum at offset 4 and rootBlock at offset 8 (leave as 0)
  if (payload) {
    block.set(payload, payloadOffset);
  }
  return block;
}

// ============================================================================
// Shared state
// ============================================================================

let tmpDir: string;
let mirrorDir: string;
let quarantineDir: string;
let manifestDir: string;
let amigaRoot: string;

// ============================================================================
// Setup / teardown
// ============================================================================

beforeEach(() => {
  tmpDir = makeTmpDir();
  mirrorDir = join(tmpDir, 'mirror');
  quarantineDir = join(tmpDir, 'quarantine');
  manifestDir = join(tmpDir, 'manifests');
  amigaRoot = join(tmpDir, 'amiga-root');

  mkdirSync(mirrorDir, { recursive: true });
  mkdirSync(quarantineDir, { recursive: true });
  mkdirSync(manifestDir, { recursive: true });
  mkdirSync(amigaRoot, { recursive: true });
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

// ============================================================================
// Test group 1: Mirror state + scan integration
// ============================================================================

describe('Mirror state + scan integration', () => {
  it('mirror state tracks status through scan lifecycle', () => {
    const fullPath = 'mus/edit/ProTracker36.lha';

    // 1. Create empty mirror state and save
    let state = emptyMirrorState();
    saveMirrorState(state, mirrorDir);

    // 2. Update entry to 'mirrored' status with a mock file path
    state = updateEntry(state, fullPath, {
      fullPath,
      status: 'mirrored',
      sizeKb: 100,
      localPath: 'mus/edit/ProTracker36.lha',
      downloadedAt: new Date().toISOString(),
    });
    saveMirrorState(state, mirrorDir);

    // 3. Reload state and verify entry status is 'mirrored'
    const reloaded = loadMirrorState(mirrorDir);
    expect(reloaded.entries[fullPath]).toBeDefined();
    expect(reloaded.entries[fullPath].status).toBe('mirrored');

    // 4. Write a clean test file (just zeros, no virus patterns)
    const cleanData = new Uint8Array(512).fill(0);

    // 5. Load scan policy and signature database
    const policy = defaultScanPolicy();
    const signatures = loadSignatureDatabase();
    expect(signatures.length).toBeGreaterThan(0);

    // 6. Scan the file
    const report = scanPackage(fullPath, cleanData, signatures, policy);

    // 7. Verify scan report verdict is 'clean'
    expect(report.verdict).toBe('clean');
    expect(report.signatureMatches).toHaveLength(0);

    // 8. Update mirror entry to 'clean' status
    state = updateEntry(state, fullPath, { status: 'clean' });
    saveMirrorState(state, mirrorDir);

    // 9. Reload state and verify final status is 'clean'
    const finalState = loadMirrorState(mirrorDir);
    expect(finalState.entries[fullPath].status).toBe('clean');
  });
});

// ============================================================================
// Test group 2: Scan gate integration
// ============================================================================

describe('Scan gate integration', () => {
  it('scan gate allows clean packages', () => {
    let state = emptyMirrorState();
    const fullPath = 'util/misc/CleanPkg.lha';

    state = updateEntry(state, fullPath, {
      fullPath,
      status: 'clean',
      sizeKb: 50,
    });

    const result = checkScanGate(fullPath, state);
    expect(result.allowed).toBe(true);
    expect(result.reason).toContain('clean');
  });

  it('scan gate blocks infected packages', () => {
    let state = emptyMirrorState();
    const fullPath = 'game/action/InfectedGame.lha';

    state = updateEntry(state, fullPath, {
      fullPath,
      status: 'infected',
      sizeKb: 200,
    });

    const result = checkScanGate(fullPath, state);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('infected');
  });

  it('scan gate blocks unscanned packages', () => {
    let state = emptyMirrorState();
    const fullPath = 'dev/c/UnscannedLib.lha';

    state = updateEntry(state, fullPath, {
      fullPath,
      status: 'mirrored',
      sizeKb: 30,
    });

    const result = checkScanGate(fullPath, state);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('not been scanned');
  });
});

// ============================================================================
// Test group 3: Pipeline stage execution
// ============================================================================

describe('Pipeline stage execution', () => {
  it('discover stage delegates to search', async () => {
    const testPackages: AminetPackage[] = [
      makeTestPackage({
        filename: 'ProTracker36.lha',
        directory: 'mus/edit',
        category: 'mus',
        subcategory: 'edit',
        description: 'The ultimate Amiga tracker',
        fullPath: 'mus/edit/ProTracker36.lha',
      }),
    ];

    const result = await executePipelineStage({
      stage: 'discover',
      query: 'ProTracker',
      indexPackages: testPackages,
      readmeIndex: new Map(),
    });

    expect(result.success).toBe(true);
    expect(result.stage).toBe('discover');
    expect(Array.isArray(result.data)).toBe(true);
    const data = result.data as Array<{ package: AminetPackage }>;
    expect(data.length).toBe(1);
    expect(data[0].package.filename).toBe('ProTracker36.lha');
  });

  it('install stage blocked by scan gate', async () => {
    // Create a state with an infected package
    let state = emptyMirrorState();
    const fullPath = 'game/action/BadGame.lha';
    state = updateEntry(state, fullPath, {
      fullPath,
      status: 'infected',
      sizeKb: 300,
    });

    const result = await executePipelineStage({
      stage: 'install',
      installOptions: {
        fullPath,
        archivePath: '/tmp/fake/BadGame.lha',
        state,
        config: { sysRoot: amigaRoot },
        manifestDir,
        statePath: mirrorDir,
      },
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error!.code).toBe('SCAN_GATE_BLOCKED');
    expect(result.error!.message).toContain('blocked');
  });

  it('pipeline handles stage errors gracefully', async () => {
    // Trigger an error by passing an unknown stage
    const result = await executePipelineStage({
      stage: 'nonexistent' as any,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error!.code).toBe('UNKNOWN_STAGE');
    expect(result.error!.message).toContain('nonexistent');
  });

  it('discover stage returns empty for no matches', async () => {
    const result = await executePipelineStage({
      stage: 'discover',
      query: 'NoSuchPackageXYZ123',
      indexPackages: [makeTestPackage()],
      readmeIndex: new Map(),
    });

    expect(result.success).toBe(true);
    expect(result.stage).toBe('discover');
    expect(Array.isArray(result.data)).toBe(true);
    expect((result.data as unknown[]).length).toBe(0);
  });

  it('launch stage passes config through', async () => {
    const config = { profileId: 'a500', kickstartFile: '/roms/kick13.rom' };

    const result = await executePipelineStage({
      stage: 'launch',
      launchConfig: config,
    });

    expect(result.success).toBe(true);
    expect(result.stage).toBe('launch');
    expect(result.data).toEqual(config);
  });
});

// ============================================================================
// Test group 4: Signature scan + quarantine path
// ============================================================================

describe('Signature scan + quarantine path', () => {
  it('infected file triggers quarantine-eligible verdict', () => {
    // 1. Create a boot block with SCA virus signature bytes
    const bootBlock = buildBootBlock(SCA_BYTES, 64);

    // 2. Load built-in signature database
    const signatures = loadSignatureDatabase();
    expect(signatures.length).toBeGreaterThan(0);

    // Verify the SCA signature is in the database
    const scaSig = signatures.find((s) => s.name === 'SCA');
    expect(scaSig).toBeDefined();

    // 3. Scan the file
    const policy = defaultScanPolicy();
    const report = scanPackage(
      'game/shoot/infected.adf',
      bootBlock,
      signatures,
      policy,
      'fast', // fast = signature scan only
    );

    // 4. Verify scan report contains at least one match
    expect(report.signatureMatches.length).toBeGreaterThan(0);
    expect(report.signatureMatches[0].signatureName).toBe('SCA');

    // 5. Verify verdict is 'infected'
    expect(report.verdict).toBe('infected');
  });

  it('clean boot block passes scan', () => {
    // A boot block with just DOS magic and zeros (no virus patterns)
    const cleanBlock = buildBootBlock();

    const signatures = loadSignatureDatabase();
    const policy = defaultScanPolicy();
    const report = scanPackage(
      'disk/misc/clean.adf',
      cleanBlock,
      signatures,
      policy,
      'fast',
    );

    expect(report.signatureMatches).toHaveLength(0);
    expect(report.verdict).toBe('clean');
  });
});

// ============================================================================
// Test group 5: End-to-end state flow
// ============================================================================

describe('End-to-end state flow', () => {
  it('full state lifecycle: not-mirrored -> mirrored -> clean -> installed', () => {
    const fullPath = 'mus/edit/OctaMED.lha';

    // 1. Create initial mirror state with entry at 'not-mirrored'
    let state = emptyMirrorState();
    state = updateEntry(state, fullPath, {
      fullPath,
      status: 'not-mirrored',
      sizeKb: 150,
    });
    saveMirrorState(state, mirrorDir);
    let loaded = loadMirrorState(mirrorDir);
    expect(loaded.entries[fullPath].status).toBe('not-mirrored');

    // 2. Update to 'mirrored' (simulating download)
    state = updateEntry(state, fullPath, {
      status: 'mirrored',
      localPath: 'mus/edit/OctaMED.lha',
      downloadedAt: new Date().toISOString(),
    });
    saveMirrorState(state, mirrorDir);
    loaded = loadMirrorState(mirrorDir);
    expect(loaded.entries[fullPath].status).toBe('mirrored');

    // 3. Update to 'clean' (simulating successful scan)
    state = updateEntry(state, fullPath, {
      status: 'clean',
      lastChecked: new Date().toISOString(),
    });
    saveMirrorState(state, mirrorDir);
    loaded = loadMirrorState(mirrorDir);
    expect(loaded.entries[fullPath].status).toBe('clean');

    // 4. Update to 'installed' (simulating installation)
    state = updateEntry(state, fullPath, {
      status: 'installed',
    });
    saveMirrorState(state, mirrorDir);
    loaded = loadMirrorState(mirrorDir);
    expect(loaded.entries[fullPath].status).toBe('installed');

    // 5. Verify the entry retains accumulated metadata
    const finalEntry = loaded.entries[fullPath];
    expect(finalEntry.fullPath).toBe(fullPath);
    expect(finalEntry.sizeKb).toBe(150);
    expect(finalEntry.localPath).toBe('mus/edit/OctaMED.lha');
    expect(finalEntry.downloadedAt).toBeDefined();
    expect(finalEntry.lastChecked).toBeDefined();
  });

  it('multiple packages tracked independently in state', () => {
    const pkg1 = 'mus/edit/ProTracker36.lha';
    const pkg2 = 'game/shoot/Doom.lha';

    let state = emptyMirrorState();

    // Add two packages at different lifecycle stages
    state = updateEntry(state, pkg1, { fullPath: pkg1, status: 'clean', sizeKb: 100 });
    state = updateEntry(state, pkg2, { fullPath: pkg2, status: 'mirrored', sizeKb: 500 });
    saveMirrorState(state, mirrorDir);

    // Reload and verify independence
    const loaded = loadMirrorState(mirrorDir);
    expect(loaded.entries[pkg1].status).toBe('clean');
    expect(loaded.entries[pkg2].status).toBe('mirrored');

    // Verify scan gate respects individual statuses
    const gate1 = checkScanGate(pkg1, loaded);
    const gate2 = checkScanGate(pkg2, loaded);
    expect(gate1.allowed).toBe(true);  // clean -> allowed
    expect(gate2.allowed).toBe(false); // mirrored -> not scanned yet
  });
});

// ============================================================================
// Test group 6: Cross-module search + scan gate pipeline
// ============================================================================

describe('Cross-module search + scan gate pipeline', () => {
  it('search results feed into scan gate checks', () => {
    // Build a package index
    const packages: AminetPackage[] = [
      makeTestPackage({
        filename: 'ProTracker36.lha',
        fullPath: 'mus/edit/ProTracker36.lha',
        description: 'The ultimate tracker',
      }),
      makeTestPackage({
        filename: 'OctaMED.lha',
        fullPath: 'mus/edit/OctaMED.lha',
        description: 'Music editor',
      }),
    ];

    // Build mirror state with mixed statuses
    let state = emptyMirrorState();
    state = updateEntry(state, 'mus/edit/ProTracker36.lha', {
      fullPath: 'mus/edit/ProTracker36.lha',
      status: 'clean',
      sizeKb: 100,
    });
    state = updateEntry(state, 'mus/edit/OctaMED.lha', {
      fullPath: 'mus/edit/OctaMED.lha',
      status: 'infected',
      sizeKb: 200,
    });

    // Search for tracker-related packages
    const results = searchPackages(packages, new Map(), { query: 'tracker' });
    expect(results.length).toBe(1);

    // Check if the found package can be installed
    const found = results[0].package;
    const gate = checkScanGate(found.fullPath, state);
    expect(gate.allowed).toBe(true);

    // Search for all music editors
    const allMusic = searchPackages(packages, new Map(), { query: 'mus' });

    // Check scan gates for all results
    const gateResults = allMusic.map((r) => ({
      fullPath: r.package.fullPath,
      gate: checkScanGate(r.package.fullPath, state),
    }));

    // At least one should be blocked (OctaMED is infected)
    const blocked = gateResults.filter((g) => !g.gate.allowed);
    expect(blocked.length).toBeGreaterThan(0);
  });
});
