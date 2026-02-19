/**
 * Tests for scan gate enforcement and install orchestrator.
 *
 * Covers:
 * - checkScanGate: all PackageStatus values, scanVerdict handling
 * - installPackage: happy path, gate blocking, override flow, format detection
 *
 * @module
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { rmSync } from 'node:fs';
import type { MirrorState, ScanVerdict, InstallConfig } from './types.js';
import { checkScanGate, installPackage } from './scan-gate.js';

// Mock extraction modules -- we don't want to invoke actual shell tools
// BUT we need real implementations for sanitizePath, stripVolumePrefix, walkDirectory
// since filesystem-mapper.ts imports them from lha-extractor.js
vi.mock('./lha-extractor.js', () => {
  const { resolve, normalize, join, relative } = require('node:path');
  const { readdirSync } = require('node:fs');

  function walkDir(dir: string, root: string): string[] {
    const results: string[] = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...walkDir(fullPath, root));
      } else {
        results.push(relative(root, fullPath));
      }
    }
    return results.sort();
  }

  return {
    extractLha: vi.fn(),
    sanitizePath: vi.fn((rawPath: string, targetDir: string) => {
      const stripped = rawPath.replace(/^[^/\\]+:/, '');
      const normalized = normalize(stripped);
      const resolved = resolve(targetDir, normalized);
      if (!resolved.startsWith(resolve(targetDir))) {
        throw new Error(`Path traversal detected`);
      }
      return resolved;
    }),
    stripVolumePrefix: vi.fn((p: string) => p.replace(/^[^/\\]+:/, '')),
    walkDirectory: vi.fn((dir: string, root: string) => walkDir(dir, root)),
  };
});

vi.mock('./lzx-extractor.js', () => ({
  extractLzx: vi.fn(),
}));

// Helper: create a minimal mirror state
function makeMirrorState(entries: Record<string, { status: string; sizeKb?: number; scanVerdict?: string }>): MirrorState {
  const result: MirrorState = {
    entries: {},
    lastUpdated: new Date().toISOString(),
    version: 1,
  };
  for (const [fullPath, data] of Object.entries(entries)) {
    result.entries[fullPath] = {
      fullPath,
      status: data.status as MirrorState['entries'][string]['status'],
      sizeKb: data.sizeKb ?? 100,
      sha256: null,
      localPath: null,
      downloadedAt: null,
      lastChecked: null,
    };
  }
  return result;
}

// ---------------------------------------------------------------------------
// checkScanGate
// ---------------------------------------------------------------------------

describe('checkScanGate', () => {
  it('allows clean status with no scanVerdict', () => {
    const state = makeMirrorState({ 'util/misc/Foo.lha': { status: 'clean' } });
    const result = checkScanGate('util/misc/Foo.lha', state);
    expect(result.allowed).toBe(true);
    expect(result.reason).toMatch(/clean/i);
    expect(result.requiresOverride).toBe(false);
  });

  it('blocks clean status with suspicious scanVerdict (requires override)', () => {
    const state = makeMirrorState({ 'util/misc/Foo.lha': { status: 'clean' } });
    const result = checkScanGate('util/misc/Foo.lha', state, 'suspicious');
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/suspicious/i);
    expect(result.requiresOverride).toBe(true);
  });

  it('allows clean status with clean scanVerdict', () => {
    const state = makeMirrorState({ 'util/misc/Foo.lha': { status: 'clean' } });
    const result = checkScanGate('util/misc/Foo.lha', state, 'clean');
    expect(result.allowed).toBe(true);
    expect(result.reason).toMatch(/clean/i);
    expect(result.requiresOverride).toBe(false);
  });

  it('blocks infected status with no override possible (INS-08)', () => {
    const state = makeMirrorState({ 'util/misc/Foo.lha': { status: 'infected' } });
    const result = checkScanGate('util/misc/Foo.lha', state);
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/infected/i);
    expect(result.requiresOverride).toBe(false);
  });

  it('blocks mirrored status (not scanned, INS-07)', () => {
    const state = makeMirrorState({ 'util/misc/Foo.lha': { status: 'mirrored' } });
    const result = checkScanGate('util/misc/Foo.lha', state);
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/not been scanned/i);
    expect(result.requiresOverride).toBe(false);
  });

  it('blocks scan-pending status (not scanned, INS-07)', () => {
    const state = makeMirrorState({ 'util/misc/Foo.lha': { status: 'scan-pending' } });
    const result = checkScanGate('util/misc/Foo.lha', state);
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/not been scanned/i);
    expect(result.requiresOverride).toBe(false);
  });

  it('blocks not-mirrored status (not downloaded)', () => {
    const state = makeMirrorState({ 'util/misc/Foo.lha': { status: 'not-mirrored' } });
    const result = checkScanGate('util/misc/Foo.lha', state);
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/not been downloaded/i);
    expect(result.requiresOverride).toBe(false);
  });

  it('blocks downloading status (not downloaded)', () => {
    const state = makeMirrorState({ 'util/misc/Foo.lha': { status: 'downloading' } });
    const result = checkScanGate('util/misc/Foo.lha', state);
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/not been downloaded/i);
    expect(result.requiresOverride).toBe(false);
  });

  it('allows installed status (re-installation)', () => {
    const state = makeMirrorState({ 'util/misc/Foo.lha': { status: 'installed' } });
    const result = checkScanGate('util/misc/Foo.lha', state);
    expect(result.allowed).toBe(true);
    expect(result.reason).toMatch(/already installed/i);
    expect(result.requiresOverride).toBe(false);
  });

  it('blocks when package not found in mirror state', () => {
    const state = makeMirrorState({});
    const result = checkScanGate('util/misc/Missing.lha', state);
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/not found/i);
    expect(result.requiresOverride).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// installPackage
// ---------------------------------------------------------------------------

describe('installPackage', () => {
  let sysRoot: string;
  let manifestDir: string;
  let stateDir: string;

  beforeEach(() => {
    sysRoot = mkdtempSync(join(tmpdir(), 'scan-gate-sys-'));
    manifestDir = mkdtempSync(join(tmpdir(), 'scan-gate-manifest-'));
    stateDir = mkdtempSync(join(tmpdir(), 'scan-gate-state-'));
  });

  afterEach(() => {
    rmSync(sysRoot, { recursive: true, force: true });
    rmSync(manifestDir, { recursive: true, force: true });
    rmSync(stateDir, { recursive: true, force: true });
  });

  it('installs a clean .lha package (happy path)', async () => {
    const { extractLha } = await import('./lha-extractor.js');
    const mockedExtractLha = vi.mocked(extractLha);

    // Set up extraction mock: create a real temp dir with files
    const fakeExtractDir = mkdtempSync(join(tmpdir(), 'fake-extract-'));
    mkdirSync(join(fakeExtractDir, 'data'), { recursive: true });
    writeFileSync(join(fakeExtractDir, 'readme.txt'), 'Hello Amiga');
    writeFileSync(join(fakeExtractDir, 'data', 'main.exe'), 'EXEC');

    mockedExtractLha.mockResolvedValueOnce({
      files: ['readme.txt', 'data/main.exe'],
      extractDir: fakeExtractDir,
      format: 'lha',
    });

    const state = makeMirrorState({
      'game/shoot/Doom.lha': { status: 'clean' },
    });

    const statePath = join(stateDir, 'state');
    const config: InstallConfig = { sysRoot };

    const result = await installPackage({
      fullPath: 'game/shoot/Doom.lha',
      archivePath: '/tmp/Doom.lha',
      state,
      config,
      manifestDir,
      statePath,
    });

    // Manifest should have the two files
    expect(result.manifest.fullPath).toBe('game/shoot/Doom.lha');
    expect(result.manifest.files.length).toBe(2);

    // Mirror state should be updated to 'installed'
    expect(result.updatedState.entries['game/shoot/Doom.lha'].status).toBe('installed');

    // extractLha was called with the archive path
    expect(mockedExtractLha).toHaveBeenCalledWith('/tmp/Doom.lha');
  });

  it('throws when scan gate blocks unscanned package', async () => {
    const state = makeMirrorState({
      'util/misc/Foo.lha': { status: 'mirrored' },
    });

    const config: InstallConfig = { sysRoot };
    const statePath = join(stateDir, 'state');

    await expect(installPackage({
      fullPath: 'util/misc/Foo.lha',
      archivePath: '/tmp/Foo.lha',
      state,
      config,
      manifestDir,
      statePath,
    })).rejects.toThrow(/not been scanned/i);
  });

  it('throws when scan gate blocks infected package', async () => {
    const state = makeMirrorState({
      'util/misc/Virus.lha': { status: 'infected' },
    });

    const config: InstallConfig = { sysRoot };
    const statePath = join(stateDir, 'state');

    await expect(installPackage({
      fullPath: 'util/misc/Virus.lha',
      archivePath: '/tmp/Virus.lha',
      state,
      config,
      manifestDir,
      statePath,
    })).rejects.toThrow(/infected/i);
  });

  it('installs suspicious package when override is approved', async () => {
    const { extractLha } = await import('./lha-extractor.js');
    const mockedExtractLha = vi.mocked(extractLha);

    const fakeExtractDir = mkdtempSync(join(tmpdir(), 'fake-extract-'));
    writeFileSync(join(fakeExtractDir, 'app.exe'), 'CODE');

    mockedExtractLha.mockResolvedValueOnce({
      files: ['app.exe'],
      extractDir: fakeExtractDir,
      format: 'lha',
    });

    const state = makeMirrorState({
      'util/misc/Sketchy.lha': { status: 'clean' },
    });

    const config: InstallConfig = { sysRoot };
    const statePath = join(stateDir, 'state');
    const confirmFn = vi.fn().mockResolvedValue(true);

    const result = await installPackage({
      fullPath: 'util/misc/Sketchy.lha',
      archivePath: '/tmp/Sketchy.lha',
      state,
      config,
      manifestDir,
      statePath,
      scanVerdict: 'suspicious',
      confirmFn,
    });

    expect(confirmFn).toHaveBeenCalled();
    expect(result.manifest.fullPath).toBe('util/misc/Sketchy.lha');
    expect(result.updatedState.entries['util/misc/Sketchy.lha'].status).toBe('installed');
  });

  it('throws when suspicious override is denied by user', async () => {
    const state = makeMirrorState({
      'util/misc/Sketchy.lha': { status: 'clean' },
    });

    const config: InstallConfig = { sysRoot };
    const statePath = join(stateDir, 'state');
    const confirmFn = vi.fn().mockResolvedValue(false);

    await expect(installPackage({
      fullPath: 'util/misc/Sketchy.lha',
      archivePath: '/tmp/Sketchy.lha',
      state,
      config,
      manifestDir,
      statePath,
      scanVerdict: 'suspicious',
      confirmFn,
    })).rejects.toThrow(/declined/i);
  });

  it('uses extractLzx for .lzx archives', async () => {
    const { extractLzx } = await import('./lzx-extractor.js');
    const mockedExtractLzx = vi.mocked(extractLzx);

    const fakeExtractDir = mkdtempSync(join(tmpdir(), 'fake-lzx-'));
    writeFileSync(join(fakeExtractDir, 'file.txt'), 'LZX content');

    mockedExtractLzx.mockResolvedValueOnce({
      files: ['file.txt'],
      extractDir: fakeExtractDir,
      format: 'lzx',
    });

    const state = makeMirrorState({
      'misc/doc/Archive.lzx': { status: 'clean' },
    });

    const config: InstallConfig = { sysRoot };
    const statePath = join(stateDir, 'state');

    const result = await installPackage({
      fullPath: 'misc/doc/Archive.lzx',
      archivePath: '/tmp/Archive.lzx',
      state,
      config,
      manifestDir,
      statePath,
    });

    expect(mockedExtractLzx).toHaveBeenCalledWith('/tmp/Archive.lzx');
    expect(result.manifest.files.length).toBe(1);
  });

  it('throws on unsupported archive format', async () => {
    const state = makeMirrorState({
      'util/misc/Foo.zip': { status: 'clean' },
    });

    const config: InstallConfig = { sysRoot };
    const statePath = join(stateDir, 'state');

    await expect(installPackage({
      fullPath: 'util/misc/Foo.zip',
      archivePath: '/tmp/Foo.zip',
      state,
      config,
      manifestDir,
      statePath,
    })).rejects.toThrow(/unsupported archive format/i);
  });

  it('updates mirror state to installed after success', async () => {
    const { extractLha } = await import('./lha-extractor.js');
    const mockedExtractLha = vi.mocked(extractLha);

    const fakeExtractDir = mkdtempSync(join(tmpdir(), 'fake-extract-'));
    writeFileSync(join(fakeExtractDir, 'test.txt'), 'test');

    mockedExtractLha.mockResolvedValueOnce({
      files: ['test.txt'],
      extractDir: fakeExtractDir,
      format: 'lha',
    });

    const state = makeMirrorState({
      'dev/c/MyTool.lha': { status: 'clean' },
    });

    const config: InstallConfig = { sysRoot };
    const statePath = join(stateDir, 'state');

    const result = await installPackage({
      fullPath: 'dev/c/MyTool.lha',
      archivePath: '/tmp/MyTool.lha',
      state,
      config,
      manifestDir,
      statePath,
    });

    expect(result.updatedState.entries['dev/c/MyTool.lha'].status).toBe('installed');
  });

  it('includes dependency detection results in manifest', async () => {
    const { extractLha } = await import('./lha-extractor.js');
    const mockedExtractLha = vi.mocked(extractLha);

    const fakeExtractDir = mkdtempSync(join(tmpdir(), 'fake-extract-'));
    writeFileSync(join(fakeExtractDir, 'prog'), 'binary');

    mockedExtractLha.mockResolvedValueOnce({
      files: ['prog'],
      extractDir: fakeExtractDir,
      format: 'lha',
    });

    const state = makeMirrorState({
      'util/misc/WithDeps.lha': { status: 'clean' },
    });

    const config: InstallConfig = { sysRoot };
    const statePath = join(stateDir, 'state');

    const result = await installPackage({
      fullPath: 'util/misc/WithDeps.lha',
      archivePath: '/tmp/WithDeps.lha',
      state,
      config,
      manifestDir,
      statePath,
      requires: ['OS 3.0+', '68020+', 'muimaster.library'],
    });

    expect(result.manifest.dependencies.length).toBe(3);
    expect(result.manifest.dependencies[0].type).toBe('os_version');
    expect(result.manifest.dependencies[1].type).toBe('hardware');
    expect(result.manifest.dependencies[2].type).toBe('library');
  });
});
