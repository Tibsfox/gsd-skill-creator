/**
 * Tests for install-tracker.ts
 *
 * Covers recordInstall (manifest persistence), loadInstallManifest
 * (round-trip loading), listInstalled (directory enumeration),
 * and uninstallPackage (file removal with cleanup).
 *
 * Uses real temp directories for all tests.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

import { describe, expect, it, beforeEach, afterEach } from 'vitest';

import {
  recordInstall,
  loadInstallManifest,
  listInstalled,
  uninstallPackage,
} from './install-tracker.js';
import type { InstalledFile, Dependency } from './types.js';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

let tmpDir: string;
let manifestDir: string;
let sysRoot: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'install-tracker-'));
  manifestDir = join(tmpDir, 'manifests');
  sysRoot = join(tmpDir, 'sys');
  mkdirSync(sysRoot, { recursive: true });
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

const sampleFiles: InstalledFile[] = [
  { sourcePath: 'ProTracker', destPath: '/tmp/test/sys/Games/ProTracker', sha256: 'abc123' },
  { sourcePath: 'ProTracker.info', destPath: '/tmp/test/sys/Games/ProTracker.info', sha256: 'def456' },
  { sourcePath: 'Docs/README', destPath: '/tmp/test/sys/Games/Docs/README', sha256: 'ghi789' },
];

const sampleDeps: Dependency[] = [
  { raw: 'OS 3.0+', type: 'os_version', fullPath: null, satisfied: true },
  { raw: '68020+', type: 'hardware', fullPath: null, satisfied: true },
];

// ---------------------------------------------------------------------------
// recordInstall
// ---------------------------------------------------------------------------

describe('recordInstall', () => {
  it('writes manifest JSON to slugified filename', () => {
    const manifest = recordInstall(
      'mus/edit/ProTracker36.lha',
      sampleFiles,
      sampleDeps,
      '/tmp/test/sys/Games',
      manifestDir,
    );

    const expectedPath = join(manifestDir, 'mus_edit_ProTracker36.json');
    expect(existsSync(expectedPath)).toBe(true);

    expect(manifest.fullPath).toBe('mus/edit/ProTracker36.lha');
    expect(manifest.files).toEqual(sampleFiles);
    expect(manifest.dependencies).toEqual(sampleDeps);
    expect(manifest.installPath).toBe('/tmp/test/sys/Games');
    // installedAt should be a valid ISO 8601 string
    expect(new Date(manifest.installedAt).toISOString()).toBe(manifest.installedAt);
  });

  it('creates manifestDir recursively if it does not exist', () => {
    const nestedDir = join(tmpDir, 'deep', 'nested', 'manifests');
    expect(existsSync(nestedDir)).toBe(false);

    recordInstall('util/dir/DOpus.lha', [], [], '/tmp/sys', nestedDir);

    expect(existsSync(nestedDir)).toBe(true);
    expect(existsSync(join(nestedDir, 'util_dir_DOpus.json'))).toBe(true);
  });

  it('slugifies path correctly: / -> _, strips .lha, appends .json', () => {
    recordInstall('game/shoot/Doom.lha', [], [], '/tmp/sys', manifestDir);
    expect(existsSync(join(manifestDir, 'game_shoot_Doom.json'))).toBe(true);
  });

  it('manifest file is valid JSON that round-trips', () => {
    recordInstall('mus/edit/ProTracker36.lha', sampleFiles, sampleDeps, '/tmp/sys', manifestDir);
    const raw = readFileSync(join(manifestDir, 'mus_edit_ProTracker36.json'), 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed.fullPath).toBe('mus/edit/ProTracker36.lha');
    expect(parsed.files).toHaveLength(3);
    expect(parsed.dependencies).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// loadInstallManifest
// ---------------------------------------------------------------------------

describe('loadInstallManifest', () => {
  it('returns parsed manifest for existing package', () => {
    recordInstall('mus/edit/ProTracker36.lha', sampleFiles, sampleDeps, '/tmp/sys', manifestDir);

    const loaded = loadInstallManifest('mus/edit/ProTracker36.lha', manifestDir);
    expect(loaded).not.toBeNull();
    expect(loaded!.fullPath).toBe('mus/edit/ProTracker36.lha');
    expect(loaded!.files).toHaveLength(3);
    expect(loaded!.dependencies).toHaveLength(2);
  });

  it('returns null for non-existent package', () => {
    const loaded = loadInstallManifest('no/such/package.lha', manifestDir);
    expect(loaded).toBeNull();
  });

  it('throws meaningful error for corrupt JSON', () => {
    mkdirSync(manifestDir, { recursive: true });
    writeFileSync(join(manifestDir, 'bad_file_corrupt.json'), '{not valid json!!!');

    expect(() => loadInstallManifest('bad/file/corrupt.lha', manifestDir)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// listInstalled
// ---------------------------------------------------------------------------

describe('listInstalled', () => {
  it('returns all manifests from directory', () => {
    recordInstall('mus/edit/ProTracker36.lha', sampleFiles, sampleDeps, '/tmp/sys', manifestDir);
    recordInstall('util/dir/DOpus.lha', [], [], '/tmp/sys', manifestDir);
    recordInstall('game/shoot/Doom.lha', [], [], '/tmp/sys', manifestDir);

    const installed = listInstalled(manifestDir);
    expect(installed).toHaveLength(3);
    const paths = installed.map((m) => m.fullPath).sort();
    expect(paths).toEqual([
      'game/shoot/Doom.lha',
      'mus/edit/ProTracker36.lha',
      'util/dir/DOpus.lha',
    ]);
  });

  it('returns empty array for empty directory', () => {
    mkdirSync(manifestDir, { recursive: true });
    expect(listInstalled(manifestDir)).toEqual([]);
  });

  it('returns empty array for non-existent directory', () => {
    expect(listInstalled(join(tmpDir, 'nonexistent'))).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// uninstallPackage
// ---------------------------------------------------------------------------

describe('uninstallPackage', () => {
  it('removes all tracked files and deletes manifest', () => {
    // Create real files at dest paths
    const file1 = join(sysRoot, 'Games', 'ProTracker');
    const file2 = join(sysRoot, 'Games', 'ProTracker.info');
    const file3 = join(sysRoot, 'Games', 'Docs', 'README');
    mkdirSync(join(sysRoot, 'Games', 'Docs'), { recursive: true });
    writeFileSync(file1, 'binary');
    writeFileSync(file2, 'info');
    writeFileSync(file3, 'readme');

    const realFiles: InstalledFile[] = [
      { sourcePath: 'ProTracker', destPath: file1, sha256: 'abc' },
      { sourcePath: 'ProTracker.info', destPath: file2, sha256: 'def' },
      { sourcePath: 'Docs/README', destPath: file3, sha256: 'ghi' },
    ];

    recordInstall('mus/edit/ProTracker36.lha', realFiles, [], sysRoot, manifestDir);

    const removed = uninstallPackage('mus/edit/ProTracker36.lha', manifestDir);
    expect(removed).toBe(3);

    // Files should be gone
    expect(existsSync(file1)).toBe(false);
    expect(existsSync(file2)).toBe(false);
    expect(existsSync(file3)).toBe(false);

    // Manifest should be gone
    expect(existsSync(join(manifestDir, 'mus_edit_ProTracker36.json'))).toBe(false);
  });

  it('handles already-missing files gracefully', () => {
    // Create only 2 of 3 files
    const file1 = join(sysRoot, 'Games', 'ProTracker');
    const file2 = join(sysRoot, 'Games', 'ProTracker.info');
    const file3 = join(sysRoot, 'Games', 'Docs', 'README'); // not created
    mkdirSync(join(sysRoot, 'Games'), { recursive: true });
    writeFileSync(file1, 'binary');
    writeFileSync(file2, 'info');

    const realFiles: InstalledFile[] = [
      { sourcePath: 'ProTracker', destPath: file1, sha256: 'abc' },
      { sourcePath: 'ProTracker.info', destPath: file2, sha256: 'def' },
      { sourcePath: 'Docs/README', destPath: file3, sha256: 'ghi' },
    ];

    recordInstall('mus/edit/ProTracker36.lha', realFiles, [], sysRoot, manifestDir);

    const removed = uninstallPackage('mus/edit/ProTracker36.lha', manifestDir);
    expect(removed).toBe(2); // only 2 files actually existed

    expect(existsSync(file1)).toBe(false);
    expect(existsSync(file2)).toBe(false);
  });

  it('cleans up empty parent directories', () => {
    const deepFile = join(sysRoot, 'Games', 'Deep', 'Nested', 'file.txt');
    mkdirSync(join(sysRoot, 'Games', 'Deep', 'Nested'), { recursive: true });
    writeFileSync(deepFile, 'data');

    const realFiles: InstalledFile[] = [
      { sourcePath: 'file.txt', destPath: deepFile, sha256: 'abc' },
    ];

    recordInstall('test/deep/pkg.lha', realFiles, [], sysRoot, manifestDir);

    uninstallPackage('test/deep/pkg.lha', manifestDir);

    // The empty parent dirs should be cleaned up
    expect(existsSync(join(sysRoot, 'Games', 'Deep', 'Nested'))).toBe(false);
    expect(existsSync(join(sysRoot, 'Games', 'Deep'))).toBe(false);
    // sysRoot/Games might be cleaned up too since it's empty
    expect(existsSync(join(sysRoot, 'Games'))).toBe(false);
  });

  it('returns 0 for non-existent manifest', () => {
    const removed = uninstallPackage('no/such/package.lha', manifestDir);
    expect(removed).toBe(0);
  });
});
