/**
 * TDD tests for extraction tool validator.
 *
 * Validates that lha and unlzx availability is detected correctly,
 * with platform-specific install guidance when tools are missing.
 * lha is required; unlzx is optional (graceful degradation for LZX).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as os from 'node:os';

// Mock child_process before importing the module under test
vi.mock('node:child_process', () => ({
  execFile: vi.fn(),
}));

import { validateExtractionTools } from './tool-validator.js';
import { execFile } from 'node:child_process';

const mockedExecFile = vi.mocked(execFile);

describe('validateExtractionTools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('returns both tools available when lha and unlzx succeed', async () => {
    mockedExecFile.mockImplementation((cmd, _args, _opts, callback?) => {
      const cb = typeof _opts === 'function' ? _opts : callback;
      if (cmd === 'lha') {
        if (cb) (cb as Function)(null, { stdout: 'Lhasa 0.4.0\n', stderr: '' });
      } else if (cmd === 'unlzx') {
        if (cb) (cb as Function)(null, { stdout: '', stderr: 'Usage: unlzx ...' });
      }
      return {} as any;
    });

    const results = await validateExtractionTools();

    expect(results).toHaveLength(2);
    const lha = results.find(t => t.name === 'lha');
    const unlzx = results.find(t => t.name === 'unlzx');
    expect(lha?.available).toBe(true);
    expect(unlzx?.available).toBe(true);
  });

  it('returns lha unavailable with install guide when lha throws ENOENT', async () => {
    mockedExecFile.mockImplementation((cmd, _args, _opts, callback?) => {
      const cb = typeof _opts === 'function' ? _opts : callback;
      if (cmd === 'lha') {
        const err = new Error('spawn lha ENOENT') as NodeJS.ErrnoException;
        err.code = 'ENOENT';
        if (cb) (cb as Function)(err, { stdout: '', stderr: '' });
      } else if (cmd === 'unlzx') {
        if (cb) (cb as Function)(null, { stdout: '', stderr: '' });
      }
      return {} as any;
    });

    const results = await validateExtractionTools();

    const lha = results.find(t => t.name === 'lha');
    expect(lha?.available).toBe(false);
    expect(lha?.installGuide).toBeTruthy();
    const unlzx = results.find(t => t.name === 'unlzx');
    expect(unlzx?.available).toBe(true);
  });

  it('returns both unavailable with install guides when both throw ENOENT', async () => {
    mockedExecFile.mockImplementation((cmd, _args, _opts, callback?) => {
      const cb = typeof _opts === 'function' ? _opts : callback;
      const err = new Error(`spawn ${cmd} ENOENT`) as NodeJS.ErrnoException;
      err.code = 'ENOENT';
      if (cb) (cb as Function)(err, { stdout: '', stderr: '' });
      return {} as any;
    });

    const results = await validateExtractionTools();

    expect(results).toHaveLength(2);
    expect(results.every(t => t.available === false)).toBe(true);
    expect(results.every(t => t.installGuide.length > 0)).toBe(true);
  });

  it('extracts version string from lha --version output', async () => {
    mockedExecFile.mockImplementation((cmd, _args, _opts, callback?) => {
      const cb = typeof _opts === 'function' ? _opts : callback;
      if (cmd === 'lha') {
        if (cb) (cb as Function)(null, { stdout: 'Lhasa 0.4.0\nCopyright ...\n', stderr: '' });
      } else if (cmd === 'unlzx') {
        if (cb) (cb as Function)(null, { stdout: '', stderr: '' });
      }
      return {} as any;
    });

    const results = await validateExtractionTools();

    const lha = results.find(t => t.name === 'lha');
    expect(lha?.version).toBe('Lhasa 0.4.0');
  });

  it('treats unlzx exit code 2 (usage output) as available', async () => {
    mockedExecFile.mockImplementation((cmd, _args, _opts, callback?) => {
      const cb = typeof _opts === 'function' ? _opts : callback;
      if (cmd === 'lha') {
        if (cb) (cb as Function)(null, { stdout: 'Lhasa 0.4.0\n', stderr: '' });
      } else if (cmd === 'unlzx') {
        // unlzx with no args prints usage and exits 2
        const err = new Error('Command failed with exit code 2') as any;
        err.code = 2;
        err.stderr = 'Usage: unlzx [-v|-x] archive.lzx';
        if (cb) (cb as Function)(err, { stdout: '', stderr: err.stderr });
      }
      return {} as any;
    });

    const results = await validateExtractionTools();

    const unlzx = results.find(t => t.name === 'unlzx');
    expect(unlzx?.available).toBe(true);
  });

  it('marks lha as required and unlzx as not required', async () => {
    mockedExecFile.mockImplementation((cmd, _args, _opts, callback?) => {
      const cb = typeof _opts === 'function' ? _opts : callback;
      if (cb) (cb as Function)(null, { stdout: 'version', stderr: '' });
      return {} as any;
    });

    const results = await validateExtractionTools();

    const lha = results.find(t => t.name === 'lha');
    const unlzx = results.find(t => t.name === 'unlzx');
    expect(lha?.required).toBe(true);
    expect(unlzx?.required).toBe(false);
  });

  it('provides Linux install guidance on linux platform', async () => {
    vi.spyOn(os, 'platform').mockReturnValue('linux');

    mockedExecFile.mockImplementation((cmd, _args, _opts, callback?) => {
      const cb = typeof _opts === 'function' ? _opts : callback;
      const err = new Error(`spawn ${cmd} ENOENT`) as NodeJS.ErrnoException;
      err.code = 'ENOENT';
      if (cb) (cb as Function)(err, { stdout: '', stderr: '' });
      return {} as any;
    });

    const results = await validateExtractionTools();

    const lha = results.find(t => t.name === 'lha');
    expect(lha?.installGuide).toContain('sudo apt install lhasa');
  });

  it('provides macOS install guidance on darwin platform', async () => {
    vi.spyOn(os, 'platform').mockReturnValue('darwin');

    mockedExecFile.mockImplementation((cmd, _args, _opts, callback?) => {
      const cb = typeof _opts === 'function' ? _opts : callback;
      const err = new Error(`spawn ${cmd} ENOENT`) as NodeJS.ErrnoException;
      err.code = 'ENOENT';
      if (cb) (cb as Function)(err, { stdout: '', stderr: '' });
      return {} as any;
    });

    const results = await validateExtractionTools();

    const lha = results.find(t => t.name === 'lha');
    expect(lha?.installGuide).toContain('brew install lhasa');
  });

  it('always includes GitHub URL in unlzx install guide regardless of platform', async () => {
    // Test on Linux
    vi.spyOn(os, 'platform').mockReturnValue('linux');

    mockedExecFile.mockImplementation((cmd, _args, _opts, callback?) => {
      const cb = typeof _opts === 'function' ? _opts : callback;
      const err = new Error(`spawn ${cmd} ENOENT`) as NodeJS.ErrnoException;
      err.code = 'ENOENT';
      if (cb) (cb as Function)(err, { stdout: '', stderr: '' });
      return {} as any;
    });

    let results = await validateExtractionTools();
    let unlzx = results.find(t => t.name === 'unlzx');
    expect(unlzx?.installGuide).toContain('github.com/nhoudelot/unlzx');

    // Test on macOS
    vi.spyOn(os, 'platform').mockReturnValue('darwin');
    results = await validateExtractionTools();
    unlzx = results.find(t => t.name === 'unlzx');
    expect(unlzx?.installGuide).toContain('github.com/nhoudelot/unlzx');
  });
});
