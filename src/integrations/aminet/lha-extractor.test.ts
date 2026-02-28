/**
 * Tests for LhA archive extraction with path traversal prevention.
 *
 * Mocks node:child_process execFile to avoid requiring lhasa installed.
 * Uses real temp directories for walkDirectory tests.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// Mock child_process before importing the module under test
vi.mock('node:child_process', () => ({
  execFile: vi.fn(),
}));

import { execFile } from 'node:child_process';
import { stripVolumePrefix, sanitizePath, walkDirectory, extractLha } from './lha-extractor.js';

const mockedExecFile = vi.mocked(execFile);

describe('stripVolumePrefix', () => {
  it('strips SYS: prefix', () => {
    expect(stripVolumePrefix('SYS:C/MyCommand')).toBe('C/MyCommand');
  });

  it('strips Work: prefix', () => {
    expect(stripVolumePrefix('Work:Games/Doom')).toBe('Games/Doom');
  });

  it('strips LIBS: prefix with no subpath', () => {
    expect(stripVolumePrefix('LIBS:mylib.library')).toBe('mylib.library');
  });

  it('leaves normal paths unchanged', () => {
    expect(stripVolumePrefix('normal/path/file.txt')).toBe('normal/path/file.txt');
  });

  it('strips single-letter volume prefix (C:)', () => {
    expect(stripVolumePrefix('C:/Windows/path')).toBe('/Windows/path');
  });

  it('returns empty string unchanged', () => {
    expect(stripVolumePrefix('')).toBe('');
  });
});

describe('sanitizePath', () => {
  it('resolves normal path within target directory', () => {
    const result = sanitizePath('Libs/mylib.library', '/tmp/target');
    expect(result).toBe('/tmp/target/Libs/mylib.library');
  });

  it('throws on path traversal with ../', () => {
    expect(() => sanitizePath('../../../etc/passwd', '/tmp/target')).toThrow(
      'Path traversal detected',
    );
  });

  it('throws on volume prefix combined with traversal', () => {
    expect(() => sanitizePath('SYS:../escape', '/tmp/target')).toThrow(
      'Path traversal detected',
    );
  });

  it('resolves clean path correctly', () => {
    const result = sanitizePath('normal/file.txt', '/tmp/target');
    expect(result).toBe('/tmp/target/normal/file.txt');
  });

  it('normalizes dot-slash prefix', () => {
    const result = sanitizePath('./relative/file.txt', '/tmp/target');
    expect(result).toBe('/tmp/target/relative/file.txt');
  });

  it('does not throw when path resolves exactly to targetDir', () => {
    expect(() => sanitizePath('.', '/tmp/target')).not.toThrow();
  });
});

describe('walkDirectory', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'walk-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('returns empty array for empty directory', () => {
    expect(walkDirectory(tempDir, tempDir)).toEqual([]);
  });

  it('returns 3 relative paths for 3 files', () => {
    writeFileSync(join(tempDir, 'a.txt'), 'a');
    writeFileSync(join(tempDir, 'b.txt'), 'b');
    writeFileSync(join(tempDir, 'c.txt'), 'c');
    const result = walkDirectory(tempDir, tempDir);
    expect(result).toEqual(['a.txt', 'b.txt', 'c.txt']);
  });

  it('returns flat list of relative paths for nested structure', () => {
    mkdirSync(join(tempDir, 'sub'), { recursive: true });
    mkdirSync(join(tempDir, 'sub', 'deep'), { recursive: true });
    writeFileSync(join(tempDir, 'root.txt'), 'root');
    writeFileSync(join(tempDir, 'sub', 'mid.txt'), 'mid');
    writeFileSync(join(tempDir, 'sub', 'deep', 'leaf.txt'), 'leaf');
    const result = walkDirectory(tempDir, tempDir);
    expect(result).toEqual([
      'root.txt',
      join('sub', 'deep', 'leaf.txt'),
      join('sub', 'mid.txt'),
    ]);
  });
});

describe('extractLha', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns ExtractionResult on successful extraction', async () => {
    // Mock execFile to succeed and create files in the temp dir
    mockedExecFile.mockImplementation((_cmd: any, _args: any, _opts: any, callback: any) => {
      // The third argument is options, fourth is callback
      const cb = typeof _opts === 'function' ? _opts : callback;
      // Create some files in the extract dir (the -w= dir from args)
      const argsList = _args as string[];
      const wFlag = argsList.find((a: string) => a.startsWith('-efq2w='));
      if (wFlag) {
        const extractDir = wFlag.replace('-efq2w=', '');
        mkdirSync(join(extractDir, 'Libs'), { recursive: true });
        writeFileSync(join(extractDir, 'Libs', 'test.library'), 'lib');
        writeFileSync(join(extractDir, 'README'), 'readme');
      }
      cb(null, '', '');
      return {} as any;
    });

    const result = await extractLha('/path/to/archive.lha');
    expect(result.format).toBe('lha');
    expect(result.files).toContain('README');
    expect(result.files).toContain(join('Libs', 'test.library'));
    expect(result.extractDir).toBeTruthy();

    // Clean up the temp dir
    rmSync(result.extractDir, { recursive: true, force: true });
  });

  it('throws with install guidance on ENOENT (lha not found)', async () => {
    mockedExecFile.mockImplementation((_cmd: any, _args: any, _opts: any, callback: any) => {
      const cb = typeof _opts === 'function' ? _opts : callback;
      const err: any = new Error('spawn lha ENOENT');
      err.code = 'ENOENT';
      cb(err, '', '');
      return {} as any;
    });

    await expect(extractLha('/path/to/archive.lha')).rejects.toThrow('lha command not found');
  });

  it('throws on extraction timeout', async () => {
    mockedExecFile.mockImplementation((_cmd: any, _args: any, _opts: any, callback: any) => {
      const cb = typeof _opts === 'function' ? _opts : callback;
      const err: any = new Error('Command timed out');
      err.killed = true;
      cb(err, '', '');
      return {} as any;
    });

    await expect(extractLha('/path/to/archive.lha')).rejects.toThrow('extraction failed');
  });

  it('throws on non-zero exit code', async () => {
    mockedExecFile.mockImplementation((_cmd: any, _args: any, _opts: any, callback: any) => {
      const cb = typeof _opts === 'function' ? _opts : callback;
      const err: any = new Error('Process exited with code 1');
      err.code = 1;
      cb(err, '', 'some error output');
      return {} as any;
    });

    await expect(extractLha('/path/to/archive.lha')).rejects.toThrow('LhA extraction failed');
  });

  it('uses a temp directory for extraction (not archive parent dir)', async () => {
    mockedExecFile.mockImplementation((_cmd: any, _args: any, _opts: any, callback: any) => {
      const cb = typeof _opts === 'function' ? _opts : callback;
      cb(null, '', '');
      return {} as any;
    });

    const result = await extractLha('/some/path/archive.lha');
    expect(result.extractDir).not.toContain('/some/path');
    expect(result.extractDir).toContain('lha-');

    // Clean up
    rmSync(result.extractDir, { recursive: true, force: true });
  });

  it('sets timeout to 30000ms on the execFile call', async () => {
    mockedExecFile.mockImplementation((_cmd: any, _args: any, opts: any, callback: any) => {
      const cb = typeof opts === 'function' ? opts : callback;
      const options = typeof opts === 'function' ? {} : opts;
      expect(options.timeout).toBe(30000);
      cb(null, '', '');
      return {} as any;
    });

    const result = await extractLha('/path/to/archive.lha');
    rmSync(result.extractDir, { recursive: true, force: true });
  });
});
