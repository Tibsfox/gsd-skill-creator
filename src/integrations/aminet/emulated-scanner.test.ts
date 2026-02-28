/**
 * TDD tests for emulated scanner and community checksum lookup.
 *
 * Tests FS-UAE + CheckX wrapper with mocked child_process (never
 * actually invokes FS-UAE) and community checksum cross-reference
 * against known-good hash lists.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// Mock child_process before importing the module under test
vi.mock('node:child_process', () => ({
  execFile: vi.fn(),
}));

// Mock fs.existsSync selectively -- we need real fs for temp files
// but want to control FS-UAE path checks
const mockExistsSync = vi.fn<(path: string) => boolean>();
vi.mock('node:fs', async () => {
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
  return {
    ...actual,
    existsSync: (...args: [string]) => mockExistsSync(...args),
  };
});

import { execFile } from 'node:child_process';
import {
  lookupChecksum,
  loadKnownGoodHashes,
  runEmulatedScan,
} from './emulated-scanner.js';
import type { EmulatedScanConfig } from './emulated-scanner.js';

const mockedExecFile = vi.mocked(execFile);

describe('emulated-scanner', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'emu-scan-test-'));
    vi.clearAllMocks();
    // Default: let real existsSync through for temp files
    mockExistsSync.mockImplementation((path: string) => {
      // Use a simple check -- temp files exist, FS-UAE paths controlled per test
      const { existsSync: realExistsSync } = require('node:fs');
      // We can't call the real one since we mocked the whole module.
      // Instead, check if path starts with tempDir or is a known test path.
      try {
        const fs = require('fs');
        return fs.existsSync(path);
      } catch {
        return false;
      }
    });
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  // ==========================================================================
  // lookupChecksum
  // ==========================================================================

  describe('lookupChecksum', () => {
    it('returns knownGood: true when hash is found in known-good list', () => {
      const hashes = new Map<string, string>([
        ['util/misc/File.lha', 'abc123def456'],
        ['mus/edit/PT.lha', 'deadbeef0000'],
      ]);

      const result = lookupChecksum('deadbeef0000', hashes);
      expect(result).toEqual({
        sha256: 'deadbeef0000',
        knownGood: true,
        source: 'known-good.json',
      });
    });

    it('returns knownGood: false when hash is NOT in known-good list', () => {
      const hashes = new Map<string, string>([
        ['util/misc/File.lha', 'abc123def456'],
      ]);

      const result = lookupChecksum('unknown_hash_999', hashes);
      expect(result).toEqual({
        sha256: 'unknown_hash_999',
        knownGood: false,
        source: 'known-good.json',
      });
    });

    it('returns knownGood: false when hash list is empty', () => {
      const hashes = new Map<string, string>();

      const result = lookupChecksum('anyhash', hashes);
      expect(result).toEqual({
        sha256: 'anyhash',
        knownGood: false,
        source: 'known-good.json',
      });
    });
  });

  // ==========================================================================
  // loadKnownGoodHashes
  // ==========================================================================

  describe('loadKnownGoodHashes', () => {
    it('loads valid JSON file into Map<string, string>', () => {
      const data = {
        version: 1,
        hashes: {
          'util/misc/File.lha': 'abc123def456789',
          'mus/edit/ProTracker.lha': 'deadbeef00112233',
        },
      };
      const filePath = join(tempDir, 'known-good.json');
      writeFileSync(filePath, JSON.stringify(data, null, 2));

      // Make existsSync return true for our temp file
      mockExistsSync.mockImplementation((p: string) => p === filePath);

      const result = loadKnownGoodHashes(filePath);
      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(2);
      expect(result.get('util/misc/File.lha')).toBe('abc123def456789');
      expect(result.get('mus/edit/ProTracker.lha')).toBe('deadbeef00112233');
    });

    it('returns empty Map when file does not exist (graceful degradation)', () => {
      mockExistsSync.mockReturnValue(false);

      const result = loadKnownGoodHashes('/nonexistent/known-good.json');
      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });

    it('throws on invalid JSON', () => {
      const filePath = join(tempDir, 'bad.json');
      writeFileSync(filePath, 'not valid json {{{');
      mockExistsSync.mockImplementation((p: string) => p === filePath);

      expect(() => loadKnownGoodHashes(filePath)).toThrow();
    });
  });

  // ==========================================================================
  // runEmulatedScan
  // ==========================================================================

  describe('runEmulatedScan', () => {
    const baseConfig: EmulatedScanConfig = {
      filePath: '/tmp/test-file.lha',
      fsUaePath: '/usr/bin/fs-uae',
      kickstartPath: '/roms/kick31.rom',
      timeoutMs: 60000,
      workDir: '/tmp/emu-work',
    };

    it('returns unavailable result when FS-UAE is not found', async () => {
      mockExistsSync.mockReturnValue(false);

      const config = { ...baseConfig, fsUaePath: '/nonexistent/fs-uae' };
      const result = await runEmulatedScan(config);

      expect(result.ran).toBe(false);
      expect(result.verdict).toBe('unscanned');
      expect(result.tool).toBe('fs-uae');
      expect(result.output).toContain('/nonexistent/fs-uae');
      expect(result.timedOut).toBe(false);
    });

    it('returns unavailable result when Kickstart ROM is not configured', async () => {
      mockExistsSync.mockReturnValue(true);

      const config = { ...baseConfig, kickstartPath: null };
      const result = await runEmulatedScan(config);

      expect(result.ran).toBe(false);
      expect(result.verdict).toBe('unscanned');
      expect(result.tool).toBe('fs-uae');
      expect(result.output).toMatch(/kickstart.*not configured/i);
      expect(result.timedOut).toBe(false);
    });

    it('returns clean verdict when CheckX reports 0 viruses found', async () => {
      mockExistsSync.mockReturnValue(true);
      mockedExecFile.mockImplementation(
        (_cmd: unknown, _args: unknown, _opts: unknown, cb: unknown) => {
          const callback = cb as (err: Error | null, stdout: string, stderr: string) => void;
          callback(null, '0 viruses found\nScan complete.', '');
          return {} as ReturnType<typeof execFile>;
        },
      );

      const result = await runEmulatedScan(baseConfig);

      expect(result.ran).toBe(true);
      expect(result.verdict).toBe('clean');
      expect(result.tool).toBe('checkx');
      expect(result.output).toContain('0 viruses found');
      expect(result.timedOut).toBe(false);
    });

    it('returns infected verdict when CheckX reports virus found', async () => {
      mockExistsSync.mockReturnValue(true);
      mockedExecFile.mockImplementation(
        (_cmd: unknown, _args: unknown, _opts: unknown, cb: unknown) => {
          const callback = cb as (err: Error | null, stdout: string, stderr: string) => void;
          callback(null, '1 virus found: SCA\nScan complete.', '');
          return {} as ReturnType<typeof execFile>;
        },
      );

      const result = await runEmulatedScan(baseConfig);

      expect(result.ran).toBe(true);
      expect(result.verdict).toBe('infected');
      expect(result.tool).toBe('checkx');
      expect(result.output).toMatch(/SCA/);
      expect(result.timedOut).toBe(false);
    });

    it('returns timed out result when process exceeds timeout', async () => {
      mockExistsSync.mockReturnValue(true);
      mockedExecFile.mockImplementation(
        (_cmd: unknown, _args: unknown, opts: unknown, cb: unknown) => {
          const options = opts as { signal?: AbortSignal };
          const callback = cb as (err: Error | null, stdout: string, stderr: string) => void;
          // Simulate the abort signal triggering
          if (options?.signal) {
            const abortHandler = () => {
              const err = new Error('The operation was aborted');
              (err as NodeJS.ErrnoException).code = 'ABORT_ERR';
              callback(err, '', '');
            };
            if (options.signal.aborted) {
              abortHandler();
            } else {
              options.signal.addEventListener('abort', abortHandler);
            }
          }
          return {} as ReturnType<typeof execFile>;
        },
      );

      const config = { ...baseConfig, timeoutMs: 1 };
      const result = await runEmulatedScan(config);

      expect(result.ran).toBe(true);
      expect(result.verdict).toBe('unscanned');
      expect(result.output).toMatch(/timed out/i);
      expect(result.timedOut).toBe(true);
    });

    it('returns graceful unavailable result on process ENOENT error', async () => {
      mockExistsSync.mockReturnValue(true);
      mockedExecFile.mockImplementation(
        (_cmd: unknown, _args: unknown, _opts: unknown, cb: unknown) => {
          const callback = cb as (err: Error | null, stdout: string, stderr: string) => void;
          const err = new Error('spawn ENOENT');
          (err as NodeJS.ErrnoException).code = 'ENOENT';
          callback(err, '', '');
          return {} as ReturnType<typeof execFile>;
        },
      );

      const result = await runEmulatedScan(baseConfig);

      expect(result.ran).toBe(false);
      expect(result.verdict).toBe('unscanned');
      expect(result.timedOut).toBe(false);
    });
  });
});
