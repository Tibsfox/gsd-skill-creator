/**
 * Tests for quarantine system -- isolate infected files with metadata sidecars.
 *
 * Uses temp directories for full filesystem isolation. Each test creates its
 * own unique tmpDir to avoid cross-test contamination.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';

import { quarantineFile, listQuarantined, restoreFile } from './quarantine.js';
import type { ScanReport, QuarantineEntry } from './types.js';

/** Create a valid ScanReport with sensible defaults, overridable. */
function makeScanReport(overrides: Partial<ScanReport> = {}): ScanReport {
  return {
    fullPath: 'mus/edit/Infected.lha',
    verdict: 'infected',
    scannedAt: new Date().toISOString(),
    scanDepth: 'standard',
    signatureMatches: [
      {
        signatureName: 'SCA',
        signatureType: 'bootblock',
        severity: 'critical',
        matchOffset: 0,
        patternIndex: 0,
      },
    ],
    heuristicFlags: [],
    ...overrides,
  };
}

/** Compute SHA-256 hex digest of a buffer or string. */
function sha256(data: Buffer | string): string {
  return createHash('sha256').update(data).digest('hex');
}

describe('quarantineFile', () => {
  let tmpDir: string;
  let mirrorDir: string;
  let quarantineDir: string;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `quarantine-test-${randomUUID()}`);
    mirrorDir = join(tmpDir, 'mirror');
    quarantineDir = join(tmpDir, '.quarantine');
    mkdirSync(mirrorDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('moves file to quarantine with directory structure preserved', () => {
    const fileDir = join(mirrorDir, 'mus', 'edit');
    mkdirSync(fileDir, { recursive: true });
    const filePath = join(fileDir, 'Infected.lha');
    writeFileSync(filePath, 'infected-content');

    const report = makeScanReport();
    const entry = quarantineFile(filePath, report, quarantineDir);

    // File moved to quarantine
    expect(existsSync(join(quarantineDir, 'mus', 'edit', 'Infected.lha'))).toBe(true);
    // Original file removed
    expect(existsSync(filePath)).toBe(false);
    // Entry has correct originalPath
    expect(entry.originalPath).toBe(filePath);
    // Entry has quarantinedAt as ISO string
    expect(entry.quarantinedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('creates metadata sidecar with full scan report', () => {
    const fileDir = join(mirrorDir, 'mus', 'edit');
    mkdirSync(fileDir, { recursive: true });
    const filePath = join(fileDir, 'Infected.lha');
    writeFileSync(filePath, 'infected-content');

    const report = makeScanReport();
    quarantineFile(filePath, report, quarantineDir);

    const metaPath = join(quarantineDir, 'mus', 'edit', 'Infected.lha.meta.json');
    expect(existsSync(metaPath)).toBe(true);

    const meta = JSON.parse(readFileSync(metaPath, 'utf-8')) as QuarantineEntry;
    expect(meta.scanReport.signatureMatches).toHaveLength(1);
    expect(meta.scanReport.signatureMatches[0].signatureName).toBe('SCA');
    expect(meta.scanReport.verdict).toBe('infected');
  });

  it('creates quarantine directory and subdirectories if they do not exist', () => {
    const fileDir = join(mirrorDir, 'dev', 'c', 'deep');
    mkdirSync(fileDir, { recursive: true });
    const filePath = join(fileDir, 'Trojan.lha');
    writeFileSync(filePath, 'trojan-content');

    quarantineFile(filePath, makeScanReport(), quarantineDir);

    expect(existsSync(join(quarantineDir, 'dev', 'c', 'deep', 'Trojan.lha'))).toBe(true);
  });

  it('rejects path traversal with ../ in file path', () => {
    // Use string concatenation to preserve ".." in the path (join resolves it away)
    const filePath = `${mirrorDir}/mus/../etc/passwd`;

    expect(() => quarantineFile(filePath, makeScanReport(), quarantineDir)).toThrow(/traversal/i);
  });

  it('rejects path that resolves outside quarantine directory', () => {
    // Use a path with ".." that would escape the expected directory structure
    const filePath = `${mirrorDir}/../../../etc/passwd`;

    expect(() => quarantineFile(filePath, makeScanReport(), quarantineDir)).toThrow(/traversal/i);
  });

  it('throws error for nonexistent source file', () => {
    const filePath = join(mirrorDir, 'nonexistent.lha');

    expect(() => quarantineFile(filePath, makeScanReport(), quarantineDir)).toThrow();
  });

  it('returns SHA-256 matching the original file content', () => {
    const fileDir = join(mirrorDir, 'util');
    mkdirSync(fileDir, { recursive: true });
    const filePath = join(fileDir, 'Virus.lha');
    const content = 'virus-file-content-for-hash-check';
    writeFileSync(filePath, content);

    const expectedHash = sha256(content);
    const entry = quarantineFile(filePath, makeScanReport(), quarantineDir);

    expect(entry.sha256).toBe(expectedHash);
  });

  it('no partial .meta.json exists on success (atomic write)', () => {
    const fileDir = join(mirrorDir, 'game');
    mkdirSync(fileDir, { recursive: true });
    const filePath = join(fileDir, 'Bad.lha');
    writeFileSync(filePath, 'bad-game-content');

    quarantineFile(filePath, makeScanReport(), quarantineDir);

    // No .tmp file should remain after successful quarantine
    const metaTmpPath = join(quarantineDir, 'game', 'Bad.lha.meta.json.tmp');
    expect(existsSync(metaTmpPath)).toBe(false);
    // But the real meta file should exist
    expect(existsSync(join(quarantineDir, 'game', 'Bad.lha.meta.json'))).toBe(true);
  });
});

describe('listQuarantined', () => {
  let tmpDir: string;
  let mirrorDir: string;
  let quarantineDir: string;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `quarantine-list-test-${randomUUID()}`);
    mirrorDir = join(tmpDir, 'mirror');
    quarantineDir = join(tmpDir, '.quarantine');
    mkdirSync(mirrorDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns empty array for empty quarantine directory', () => {
    mkdirSync(quarantineDir, { recursive: true });

    const entries = listQuarantined(quarantineDir);

    expect(entries).toEqual([]);
  });

  it('returns entries after quarantining multiple files', () => {
    // Create and quarantine two files
    const dir1 = join(mirrorDir, 'mus', 'edit');
    const dir2 = join(mirrorDir, 'dev', 'c');
    mkdirSync(dir1, { recursive: true });
    mkdirSync(dir2, { recursive: true });
    writeFileSync(join(dir1, 'A.lha'), 'content-a');
    writeFileSync(join(dir2, 'B.lha'), 'content-b');

    quarantineFile(join(dir1, 'A.lha'), makeScanReport(), quarantineDir);
    quarantineFile(join(dir2, 'B.lha'), makeScanReport(), quarantineDir);

    const entries = listQuarantined(quarantineDir);

    expect(entries).toHaveLength(2);
    for (const entry of entries) {
      expect(entry.originalPath).toBeDefined();
      expect(entry.quarantinedAt).toBeDefined();
      expect(entry.scanReport).toBeDefined();
      expect(entry.sha256).toBeDefined();
    }
  });

  it('returns empty array for nonexistent quarantine directory', () => {
    const nonExistentDir = join(tmpDir, 'no-such-dir');

    const entries = listQuarantined(nonExistentDir);

    expect(entries).toEqual([]);
  });
});

describe('restoreFile', () => {
  let tmpDir: string;
  let mirrorDir: string;
  let quarantineDir: string;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `quarantine-restore-test-${randomUUID()}`);
    mirrorDir = join(tmpDir, 'mirror');
    quarantineDir = join(tmpDir, '.quarantine');
    mkdirSync(mirrorDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('restores quarantined file to original path', () => {
    const fileDir = join(mirrorDir, 'mus', 'edit');
    mkdirSync(fileDir, { recursive: true });
    const filePath = join(fileDir, 'Restored.lha');
    const content = 'restorable-content';
    writeFileSync(filePath, content);

    quarantineFile(filePath, makeScanReport(), quarantineDir);
    expect(existsSync(filePath)).toBe(false);

    restoreFile(quarantineDir, filePath);

    // File is back at original location
    expect(existsSync(filePath)).toBe(true);
    expect(readFileSync(filePath, 'utf-8')).toBe(content);

    // Quarantine copy and sidecar are removed
    const quarantinedPath = join(quarantineDir, 'mus', 'edit', 'Restored.lha');
    expect(existsSync(quarantinedPath)).toBe(false);
    expect(existsSync(`${quarantinedPath}.meta.json`)).toBe(false);
  });

  it('creates parent directories at original path if they were deleted', () => {
    const fileDir = join(mirrorDir, 'util', 'deep', 'nest');
    mkdirSync(fileDir, { recursive: true });
    const filePath = join(fileDir, 'Deep.lha');
    writeFileSync(filePath, 'deep-content');

    quarantineFile(filePath, makeScanReport(), quarantineDir);

    // Delete original parent directories
    rmSync(join(mirrorDir, 'util'), { recursive: true, force: true });
    expect(existsSync(fileDir)).toBe(false);

    restoreFile(quarantineDir, filePath);

    expect(existsSync(filePath)).toBe(true);
  });

  it('throws error for nonexistent quarantine entry', () => {
    mkdirSync(quarantineDir, { recursive: true });

    expect(() => restoreFile(quarantineDir, '/nonexistent/path.lha')).toThrow();
  });

  it('entry no longer appears in listQuarantined after restore', () => {
    const fileDir = join(mirrorDir, 'game');
    mkdirSync(fileDir, { recursive: true });
    const filePath = join(fileDir, 'Game.lha');
    writeFileSync(filePath, 'game-content');

    quarantineFile(filePath, makeScanReport(), quarantineDir);
    expect(listQuarantined(quarantineDir)).toHaveLength(1);

    restoreFile(quarantineDir, filePath);
    expect(listQuarantined(quarantineDir)).toHaveLength(0);
  });
});
