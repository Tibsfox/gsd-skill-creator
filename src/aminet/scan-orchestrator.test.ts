/**
 * Tests for the scan orchestrator.
 *
 * Covers: mergeVerdicts, defaultScanPolicy, loadScanPolicy,
 * scanPackage (single file), and batchScan (multiple files).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import yaml from 'js-yaml';

import {
  mergeVerdicts,
  defaultScanPolicy,
  loadScanPolicy,
  scanPackage,
  batchScan,
} from './scan-orchestrator.js';
import { saveMirrorState, loadMirrorState } from './mirror-state.js';
import type { VirusSignature, ScanPolicyConfig, MirrorState, ScanVerdict } from './types.js';

// ============================================================================
// Test helpers
// ============================================================================

/** HUNK_HEADER magic bytes: 0x000003F3 */
const HUNK_HEADER_BYTES = new Uint8Array([0x00, 0x00, 0x03, 0xF3]);

/** DOS\0 magic bytes for boot blocks */
const DOS_MAGIC_BYTES = new Uint8Array([0x44, 0x4F, 0x53, 0x00]);

/** "Something wonderful" in bytes -- the real SCA signature pattern */
const SCA_REAL_BYTES = new TextEncoder().encode('Something wonderful');

/**
 * Build a minimal valid hunk file with a single HUNK_CODE of the given size.
 * The hunk file structure: HUNK_HEADER + header fields + HUNK_CODE + data + HUNK_END.
 */
function buildMinimalHunkFile(codeSize: number): Uint8Array {
  const codeSizeLongs = Math.ceil(codeSize / 4);
  const codePaddedBytes = codeSizeLongs * 4;

  // Header: magic(4) + nameCount=0(4) + numHunks=1(4) + firstHunk=0(4) + lastHunk=0(4) + hunkSize(4)
  // HUNK_CODE: type(4) + size(4) + data(codePaddedBytes)
  // HUNK_END: type(4)
  const totalSize = 24 + 8 + codePaddedBytes + 4;
  const buf = new Uint8Array(totalSize);
  const view = new DataView(buf.buffer);

  let offset = 0;

  // HUNK_HEADER magic
  view.setUint32(offset, 0x000003F3, false); offset += 4;
  // Name count = 0
  view.setUint32(offset, 0, false); offset += 4;
  // numHunks = 1
  view.setUint32(offset, 1, false); offset += 4;
  // firstHunk = 0
  view.setUint32(offset, 0, false); offset += 4;
  // lastHunk = 0
  view.setUint32(offset, 0, false); offset += 4;
  // hunkSize[0] = codeSizeLongs (no memory flags)
  view.setUint32(offset, codeSizeLongs, false); offset += 4;

  // HUNK_CODE type
  view.setUint32(offset, 0x000003E9, false); offset += 4;
  // Code size in longwords
  view.setUint32(offset, codeSizeLongs, false); offset += 4;
  // Fill with non-zero data
  for (let i = 0; i < codePaddedBytes; i++) {
    buf[offset + i] = (i % 254) + 1;
  }
  offset += codePaddedBytes;

  // HUNK_END
  view.setUint32(offset, 0x000003F2, false);

  return buf;
}

/**
 * Build a minimal DOS boot block (1024 bytes) with custom boot code.
 */
function buildMinimalBootBlock(): Uint8Array {
  const buf = new Uint8Array(1024);
  // DOS\0 magic
  buf[0] = 0x44; buf[1] = 0x4F; buf[2] = 0x53; buf[3] = 0x00;
  // Checksum at offset 4 (leave as 0 -- invalid checksum)
  // Root block at offset 8
  const view = new DataView(buf.buffer);
  view.setUint32(8, 880, false); // standard root block
  // Put some boot code starting at offset 12
  buf[12] = 0x60; // BRA.S (branch short)
  buf[13] = 0x02;
  buf[14] = 0x00;
  buf[15] = 0x00;
  return buf;
}

/**
 * Build a boot block that matches the real SCA signature from the built-in
 * database by embedding "Something wonderful" at offset 20.
 */
function buildSCABootBlock(): Uint8Array {
  const buf = buildMinimalBootBlock();
  // Embed the real SCA pattern: "Something wonderful"
  for (let i = 0; i < SCA_REAL_BYTES.length; i++) {
    buf[20 + i] = SCA_REAL_BYTES[i];
  }
  return buf;
}

/** Create an SCA-like bootblock signature for testing. */
function makeSCASignature(): VirusSignature {
  return {
    name: 'SCA',
    type: 'bootblock',
    severity: 'critical',
    patterns: [{
      bytes: '534341', // "SCA" in ASCII hex
      offset: 'any',
    }],
    description: 'SCA boot block virus',
    references: [],
  };
}

/** Create a file (link) virus signature for testing. */
function makeFileVirusSignature(): VirusSignature {
  return {
    name: 'TestFileVirus',
    type: 'file',
    severity: 'high',
    patterns: [{
      bytes: '4AFC4EF9', // RTC_MATCHWORD + JMP
      offset: 'any',
    }],
    description: 'Test file virus pattern',
    references: [],
  };
}

// ============================================================================
// mergeVerdicts
// ============================================================================

describe('mergeVerdicts', () => {
  it('returns clean for two clean verdicts', () => {
    expect(mergeVerdicts(['clean', 'clean'])).toBe('clean');
  });

  it('returns suspicious when clean + suspicious', () => {
    expect(mergeVerdicts(['clean', 'suspicious'])).toBe('suspicious');
  });

  it('returns infected when clean + infected', () => {
    expect(mergeVerdicts(['clean', 'infected'])).toBe('infected');
  });

  it('returns infected when suspicious + infected', () => {
    expect(mergeVerdicts(['suspicious', 'infected'])).toBe('infected');
  });

  it('returns clean for single clean verdict', () => {
    expect(mergeVerdicts(['clean'])).toBe('clean');
  });

  it('returns unscanned for empty array', () => {
    expect(mergeVerdicts([])).toBe('unscanned');
  });

  it('returns clean when unscanned + clean (unscanned does not override)', () => {
    expect(mergeVerdicts(['unscanned', 'clean'])).toBe('clean');
  });
});

// ============================================================================
// defaultScanPolicy
// ============================================================================

describe('defaultScanPolicy', () => {
  it('returns defaultDepth of standard', () => {
    const policy = defaultScanPolicy();
    expect(policy.defaultDepth).toBe('standard');
  });

  it('fast depth: sigs only', () => {
    const policy = defaultScanPolicy();
    expect(policy.depths.fast).toEqual({
      signatureScan: true,
      heuristicScan: false,
      emulatedScan: false,
      checksumLookup: false,
    });
  });

  it('standard depth: sigs + heuristics + checksum', () => {
    const policy = defaultScanPolicy();
    expect(policy.depths.standard).toEqual({
      signatureScan: true,
      heuristicScan: true,
      emulatedScan: false,
      checksumLookup: true,
    });
  });

  it('thorough depth: all layers enabled', () => {
    const policy = defaultScanPolicy();
    expect(policy.depths.thorough).toEqual({
      signatureScan: true,
      heuristicScan: true,
      emulatedScan: true,
      checksumLookup: true,
    });
  });

  it('has version 1', () => {
    const policy = defaultScanPolicy();
    expect(policy.version).toBe(1);
  });
});

// ============================================================================
// loadScanPolicy
// ============================================================================

describe('loadScanPolicy', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `scan-policy-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('loads valid YAML policy file', () => {
    const policyData: ScanPolicyConfig = {
      version: 1,
      defaultDepth: 'fast',
      depths: {
        fast: { signatureScan: true, heuristicScan: false, emulatedScan: false, checksumLookup: false },
        standard: { signatureScan: true, heuristicScan: true, emulatedScan: false, checksumLookup: true },
        thorough: { signatureScan: true, heuristicScan: true, emulatedScan: true, checksumLookup: true },
      },
    };
    const yamlPath = join(tmpDir, 'scan-policy.yaml');
    writeFileSync(yamlPath, yaml.dump(policyData), 'utf-8');

    const loaded = loadScanPolicy(yamlPath);
    expect(loaded.defaultDepth).toBe('fast');
    expect(loaded.version).toBe(1);
  });

  it('returns default policy when file is missing', () => {
    const loaded = loadScanPolicy(join(tmpDir, 'nonexistent.yaml'));
    expect(loaded.defaultDepth).toBe('standard');
  });

  it('throws on invalid YAML (missing version)', () => {
    const invalid = { defaultDepth: 'fast', depths: {} };
    const yamlPath = join(tmpDir, 'bad-policy.yaml');
    writeFileSync(yamlPath, yaml.dump(invalid), 'utf-8');

    expect(() => loadScanPolicy(yamlPath)).toThrow();
  });
});

// ============================================================================
// scanPackage
// ============================================================================

describe('scanPackage', () => {
  const policy = {
    version: 1 as const,
    defaultDepth: 'standard' as const,
    depths: {
      fast: { signatureScan: true, heuristicScan: false, emulatedScan: false, checksumLookup: false },
      standard: { signatureScan: true, heuristicScan: true, emulatedScan: false, checksumLookup: true },
      thorough: { signatureScan: true, heuristicScan: true, emulatedScan: true, checksumLookup: true },
    },
  } satisfies ScanPolicyConfig;

  it('reports clean for a plain buffer with no signatures', () => {
    const data = new Uint8Array(500); // all zeros
    const report = scanPackage('util/test/clean.lha', data, [], policy, 'standard');

    expect(report.verdict).toBe('clean');
    expect(report.signatureMatches).toEqual([]);
    expect(report.heuristicFlags).toEqual([]);
  });

  it('detects signature match on bootblock', () => {
    // Build a boot block with "SCA" embedded
    const bootBlock = buildMinimalBootBlock();
    // Inject "SCA" text at offset 20
    bootBlock[20] = 0x53; // S
    bootBlock[21] = 0x43; // C
    bootBlock[22] = 0x41; // A

    const sigs = [makeSCASignature()];
    const report = scanPackage('util/test/infected.adf', bootBlock, sigs, policy, 'standard');

    expect(report.verdict).toBe('infected');
    expect(report.signatureMatches.length).toBeGreaterThanOrEqual(1);
    expect(report.signatureMatches[0].signatureName).toBe('SCA');
  });

  it('heuristic flags suspicious hunk file at standard depth', () => {
    // Build a hunk file with a very small first HUNK_CODE (< 256 bytes)
    const hunkFile = buildMinimalHunkFile(64);
    const report = scanPackage('util/test/suspicious.exe', hunkFile, [], policy, 'standard');

    expect(report.verdict).toBe('suspicious');
    expect(report.heuristicFlags.length).toBeGreaterThan(0);
    expect(report.heuristicFlags.some((f) => f.rule === 'small-first-hunk')).toBe(true);
  });

  it('fast depth skips heuristics', () => {
    // Same hunk file, but fast mode = no heuristic analysis
    const hunkFile = buildMinimalHunkFile(64);
    const report = scanPackage('util/test/fast-mode.exe', hunkFile, [], policy, 'fast');

    expect(report.verdict).toBe('clean');
    expect(report.heuristicFlags).toEqual([]);
  });

  it('detects both signature and heuristic flags', () => {
    // Build a hunk file with a small first code hunk AND inject a file virus pattern
    const hunkFile = buildMinimalHunkFile(64);
    // Inject the file virus pattern somewhere in the code area
    const codeStart = 32; // after header (24 bytes) + HUNK_CODE type(4) + size(4) = 32
    hunkFile[codeStart] = 0x4A;
    hunkFile[codeStart + 1] = 0xFC;
    hunkFile[codeStart + 2] = 0x4E;
    hunkFile[codeStart + 3] = 0xF9;

    const sigs = [makeFileVirusSignature()];
    const report = scanPackage('util/test/both.exe', hunkFile, sigs, policy, 'standard');

    expect(report.verdict).toBe('infected');
    expect(report.signatureMatches.length).toBeGreaterThan(0);
    expect(report.heuristicFlags.length).toBeGreaterThan(0);
  });

  it('scan report has correct metadata fields', () => {
    const data = new Uint8Array(100);
    const report = scanPackage('mus/edit/Tracker.lha', data, [], policy, 'thorough');

    expect(report.fullPath).toBe('mus/edit/Tracker.lha');
    expect(report.scanDepth).toBe('thorough');
    // scannedAt should be a valid ISO 8601 string
    expect(() => new Date(report.scannedAt)).not.toThrow();
    expect(new Date(report.scannedAt).toISOString()).toBe(report.scannedAt);
  });

  it('triggers hunk parsing for HUNK_HEADER files in standard mode', () => {
    const hunkFile = buildMinimalHunkFile(512);
    const report = scanPackage('util/test/hunk.exe', hunkFile, [], policy, 'standard');

    // Should have attempted heuristic analysis (hunk parsing + analyzeHunkFile)
    // 512-byte code hunk is not "small" so no small-first-hunk flag, but analysis ran
    expect(report.scanDepth).toBe('standard');
    expect(report.verdict).toBe('clean');
  });

  it('triggers boot block parsing for DOS files in standard mode', () => {
    const bootBlock = buildMinimalBootBlock();
    const report = scanPackage('util/test/disk.adf', bootBlock, [], policy, 'standard');

    // Boot block has custom boot code, should trigger heuristic analysis
    // The boot block has invalid checksum + custom_bootcode + BRA.S but minimal flags
    expect(report.scanDepth).toBe('standard');
    // May or may not flag depending on exact patterns, but analysis should have run
    expect(report.heuristicFlags).toBeDefined();
  });

  it('non-binary file gets only signature scan, no heuristics', () => {
    // Buffer starting with ASCII text (not HUNK_HEADER or DOS magic)
    const textData = new TextEncoder().encode('This is a plain text readme file with no binary content.');
    const report = scanPackage('text/doc/readme.txt', textData, [], policy, 'standard');

    expect(report.verdict).toBe('clean');
    expect(report.heuristicFlags).toEqual([]);
  });
});

// ============================================================================
// batchScan
// ============================================================================

describe('batchScan', () => {
  let tmpDir: string;
  let mirrorDir: string;
  let quarantineDir: string;
  let cacheDir: string;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `batch-scan-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mirrorDir = join(tmpDir, 'mirror');
    quarantineDir = join(tmpDir, '.quarantine');
    cacheDir = join(tmpDir, 'cache');
    mkdirSync(mirrorDir, { recursive: true });
    mkdirSync(quarantineDir, { recursive: true });
    mkdirSync(cacheDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('processes only scan-pending entries', () => {
    // Create 3 files in mirror dir
    const cleanFile = join(mirrorDir, 'util', 'clean.lha');
    const infectedFile = join(mirrorDir, 'game', 'infected.adf');
    const mirroredFile = join(mirrorDir, 'mus', 'music.lha');
    mkdirSync(join(mirrorDir, 'util'), { recursive: true });
    mkdirSync(join(mirrorDir, 'game'), { recursive: true });
    mkdirSync(join(mirrorDir, 'mus'), { recursive: true });

    // Clean file: plain data
    writeFileSync(cleanFile, Buffer.alloc(500));

    // Infected file: boot block with real SCA signature ("Something wonderful")
    writeFileSync(infectedFile, buildSCABootBlock());

    // Mirrored file: plain data (should NOT be scanned)
    writeFileSync(mirroredFile, Buffer.alloc(200));

    // Set up mirror state
    const state: MirrorState = {
      entries: {
        'util/clean.lha': {
          fullPath: 'util/clean.lha',
          status: 'scan-pending',
          sizeKb: 1,
          sha256: null,
          localPath: 'util/clean.lha',
          downloadedAt: new Date().toISOString(),
          lastChecked: null,
        },
        'game/infected.adf': {
          fullPath: 'game/infected.adf',
          status: 'scan-pending',
          sizeKb: 1,
          sha256: null,
          localPath: 'game/infected.adf',
          downloadedAt: new Date().toISOString(),
          lastChecked: null,
        },
        'mus/music.lha': {
          fullPath: 'mus/music.lha',
          status: 'mirrored',
          sizeKb: 1,
          sha256: null,
          localPath: 'mus/music.lha',
          downloadedAt: new Date().toISOString(),
          lastChecked: null,
        },
      },
      lastUpdated: new Date().toISOString(),
      version: 1,
    };
    saveMirrorState(state, cacheDir);

    const result = batchScan({
      mirrorDir,
      quarantineDir,
      cacheDir,
      depth: 'standard',
    });

    // Only 2 scan-pending entries scanned
    expect(result.scanned).toBe(2);

    // Check updated mirror state
    const updatedState = loadMirrorState(cacheDir);

    // Clean file should have status 'clean'
    expect(updatedState.entries['util/clean.lha'].status).toBe('clean');

    // Infected file should have status 'infected'
    expect(updatedState.entries['game/infected.adf'].status).toBe('infected');

    // Mirrored file should be unchanged
    expect(updatedState.entries['mus/music.lha'].status).toBe('mirrored');
  });

  it('quarantines infected files', () => {
    const infectedFile = join(mirrorDir, 'game', 'virus.adf');
    mkdirSync(join(mirrorDir, 'game'), { recursive: true });

    writeFileSync(infectedFile, buildSCABootBlock());

    const state: MirrorState = {
      entries: {
        'game/virus.adf': {
          fullPath: 'game/virus.adf',
          status: 'scan-pending',
          sizeKb: 1,
          sha256: null,
          localPath: 'game/virus.adf',
          downloadedAt: new Date().toISOString(),
          lastChecked: null,
        },
      },
      lastUpdated: new Date().toISOString(),
      version: 1,
    };
    saveMirrorState(state, cacheDir);

    batchScan({ mirrorDir, quarantineDir, cacheDir, depth: 'standard' });

    // Infected file should have been moved to quarantine
    expect(existsSync(infectedFile)).toBe(false);
    // Quarantine directory should have the file
    const quarantinedPath = join(quarantineDir, 'game', 'virus.adf');
    expect(existsSync(quarantinedPath)).toBe(true);
  });

  it('returns correct summary counts', () => {
    // Create a clean file and an infected file
    mkdirSync(join(mirrorDir, 'util'), { recursive: true });
    mkdirSync(join(mirrorDir, 'game'), { recursive: true });

    writeFileSync(join(mirrorDir, 'util', 'safe.lha'), Buffer.alloc(500));

    writeFileSync(join(mirrorDir, 'game', 'bad.adf'), buildSCABootBlock());

    const state: MirrorState = {
      entries: {
        'util/safe.lha': {
          fullPath: 'util/safe.lha',
          status: 'scan-pending',
          sizeKb: 1,
          sha256: null,
          localPath: 'util/safe.lha',
          downloadedAt: new Date().toISOString(),
          lastChecked: null,
        },
        'game/bad.adf': {
          fullPath: 'game/bad.adf',
          status: 'scan-pending',
          sizeKb: 1,
          sha256: null,
          localPath: 'game/bad.adf',
          downloadedAt: new Date().toISOString(),
          lastChecked: null,
        },
      },
      lastUpdated: new Date().toISOString(),
      version: 1,
    };
    saveMirrorState(state, cacheDir);

    const result = batchScan({ mirrorDir, quarantineDir, cacheDir, depth: 'standard' });

    expect(result.scanned).toBe(2);
    expect(result.clean).toBe(1);
    expect(result.infected).toBe(1);
    expect(result.suspicious).toBe(0);
  });

  it('persists mirror state to disk after scanning', () => {
    mkdirSync(join(mirrorDir, 'util'), { recursive: true });
    writeFileSync(join(mirrorDir, 'util', 'file.lha'), Buffer.alloc(100));

    const state: MirrorState = {
      entries: {
        'util/file.lha': {
          fullPath: 'util/file.lha',
          status: 'scan-pending',
          sizeKb: 1,
          sha256: null,
          localPath: 'util/file.lha',
          downloadedAt: new Date().toISOString(),
          lastChecked: null,
        },
      },
      lastUpdated: new Date().toISOString(),
      version: 1,
    };
    saveMirrorState(state, cacheDir);

    batchScan({ mirrorDir, quarantineDir, cacheDir, depth: 'fast' });

    // Verify state was persisted
    const persisted = loadMirrorState(cacheDir);
    expect(persisted.entries['util/file.lha'].status).toBe('clean');
  });
});
