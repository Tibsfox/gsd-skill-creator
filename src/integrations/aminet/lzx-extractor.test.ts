/**
 * TDD tests for LZX archive extraction via unlzx with cwd workaround.
 *
 * unlzx has no output directory flag, so extraction must use the cwd
 * option on execFile. The archive path must be resolved to absolute
 * since cwd changes the working directory.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

// Mock child_process before importing the module under test
vi.mock('node:child_process', () => ({
  execFile: vi.fn(),
}));

import { extractLzx } from './lzx-extractor.js';
import { execFile } from 'node:child_process';

const mockedExecFile = vi.mocked(execFile);

describe('extractLzx', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'lzx-test-'));
    vi.clearAllMocks();
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('returns ExtractionResult with format lzx and file list on success', async () => {
    // Mock execFile to succeed and create files in the cwd (extraction dir)
    mockedExecFile.mockImplementation((_cmd, _args, opts, callback?) => {
      const cb = typeof opts === 'function' ? opts : callback;
      const options = typeof opts === 'object' ? opts : {};
      const cwd = (options as { cwd?: string }).cwd;
      if (cwd) {
        // Simulate unlzx extracting files to the cwd
        writeFileSync(join(cwd, 'readme.txt'), 'LZX archive readme');
        mkdirSync(join(cwd, 'libs'), { recursive: true });
        writeFileSync(join(cwd, 'libs', 'mylib.library'), 'library data');
      }
      if (cb) (cb as Function)(null, { stdout: '', stderr: '' });
      return {} as any;
    });

    const archivePath = join(tempDir, 'test.lzx');
    writeFileSync(archivePath, 'fake lzx data');

    const result = await extractLzx(archivePath);

    expect(result.format).toBe('lzx');
    expect(result.files).toHaveLength(2);
    expect(result.files).toContain('readme.txt');
    expect(result.files).toContain(join('libs', 'mylib.library'));
    expect(result.extractDir).toContain('aminet-lzx-');
    // Clean up the extraction dir
    rmSync(result.extractDir, { recursive: true, force: true });
  });

  it('resolves archive path to absolute before calling unlzx', async () => {
    mockedExecFile.mockImplementation((_cmd, _args, _opts, callback?) => {
      const cb = typeof _opts === 'function' ? _opts : callback;
      if (cb) (cb as Function)(null, { stdout: '', stderr: '' });
      return {} as any;
    });

    const relativePath = 'relative/test.lzx';
    const expectedAbsolute = resolve(relativePath);

    try {
      await extractLzx(relativePath);
    } catch {
      // May fail due to no files extracted -- that's fine for this test
    }

    // Verify execFile was called with absolute path
    expect(mockedExecFile).toHaveBeenCalledWith(
      'unlzx',
      ['-x', expectedAbsolute],
      expect.objectContaining({ cwd: expect.any(String) }),
      expect.any(Function),
    );
  });

  it('calls execFile with cwd option set to extraction directory', async () => {
    mockedExecFile.mockImplementation((_cmd, _args, _opts, callback?) => {
      const cb = typeof _opts === 'function' ? _opts : callback;
      if (cb) (cb as Function)(null, { stdout: '', stderr: '' });
      return {} as any;
    });

    const archivePath = join(tempDir, 'test.lzx');
    writeFileSync(archivePath, 'fake lzx data');

    const result = await extractLzx(archivePath);

    expect(mockedExecFile).toHaveBeenCalledWith(
      'unlzx',
      expect.any(Array),
      expect.objectContaining({
        cwd: expect.stringContaining('aminet-lzx-'),
      }),
      expect.any(Function),
    );
    rmSync(result.extractDir, { recursive: true, force: true });
  });

  it('throws with install guidance when unlzx is not found (ENOENT)', async () => {
    mockedExecFile.mockImplementation((_cmd, _args, _opts, callback?) => {
      const cb = typeof _opts === 'function' ? _opts : callback;
      const err = new Error('spawn unlzx ENOENT') as NodeJS.ErrnoException;
      err.code = 'ENOENT';
      if (cb) (cb as Function)(err, { stdout: '', stderr: '' });
      return {} as any;
    });

    const archivePath = join(tempDir, 'test.lzx');
    writeFileSync(archivePath, 'fake lzx data');

    await expect(extractLzx(archivePath)).rejects.toThrow('unlzx command not found');
    await expect(extractLzx(archivePath)).rejects.toThrow(
      /github\.com\/nhoudelot\/unlzx/,
    );
  });

  it('throws on extraction timeout', async () => {
    mockedExecFile.mockImplementation((_cmd, _args, _opts, callback?) => {
      const cb = typeof _opts === 'function' ? _opts : callback;
      const err = new Error('Command timed out');
      (err as any).killed = true;
      if (cb) (cb as Function)(err, { stdout: '', stderr: '' });
      return {} as any;
    });

    const archivePath = join(tempDir, 'test.lzx');
    writeFileSync(archivePath, 'fake lzx data');

    await expect(extractLzx(archivePath)).rejects.toThrow(/extraction failed|timed out/i);
  });

  it('throws on non-zero exit code', async () => {
    mockedExecFile.mockImplementation((_cmd, _args, _opts, callback?) => {
      const cb = typeof _opts === 'function' ? _opts : callback;
      const err = new Error('Command failed with exit code 1');
      (err as any).code = 1;
      if (cb) (cb as Function)(err, { stdout: '', stderr: 'corrupt archive' });
      return {} as any;
    });

    const archivePath = join(tempDir, 'test.lzx');
    writeFileSync(archivePath, 'fake lzx data');

    await expect(extractLzx(archivePath)).rejects.toThrow(/LZX extraction failed/);
  });

  it('uses temp directory with aminet-lzx- prefix', async () => {
    mockedExecFile.mockImplementation((_cmd, _args, _opts, callback?) => {
      const cb = typeof _opts === 'function' ? _opts : callback;
      if (cb) (cb as Function)(null, { stdout: '', stderr: '' });
      return {} as any;
    });

    const archivePath = join(tempDir, 'test.lzx');
    writeFileSync(archivePath, 'fake lzx data');

    const result = await extractLzx(archivePath);

    expect(result.extractDir).toContain('aminet-lzx-');
    rmSync(result.extractDir, { recursive: true, force: true });
  });

  it('sets timeout to 30000ms on execFile call', async () => {
    mockedExecFile.mockImplementation((_cmd, _args, _opts, callback?) => {
      const cb = typeof _opts === 'function' ? _opts : callback;
      if (cb) (cb as Function)(null, { stdout: '', stderr: '' });
      return {} as any;
    });

    const archivePath = join(tempDir, 'test.lzx');
    writeFileSync(archivePath, 'fake lzx data');

    const result = await extractLzx(archivePath);

    expect(mockedExecFile).toHaveBeenCalledWith(
      'unlzx',
      expect.any(Array),
      expect.objectContaining({ timeout: 30000 }),
      expect.any(Function),
    );
    rmSync(result.extractDir, { recursive: true, force: true });
  });
});
