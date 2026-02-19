/**
 * Tests for profile auto-selection and emulator launch orchestrator.
 *
 * Covers selectProfileFromReadme (priority-based hardware profile matching),
 * writeFsUaeConfig (config file writing), and launchEmulator (FS-UAE process
 * spawning with structured error handling).
 *
 * Uses vi.mock for node:child_process to intercept execFile calls in ESM.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { LaunchConfig } from './types.js';

// Mock node:child_process at module level for ESM compatibility
vi.mock('node:child_process', () => ({
  execFile: vi.fn(),
}));

// Import after mock declaration
import { execFile } from 'node:child_process';
import { selectProfileFromReadme, writeFsUaeConfig, launchEmulator } from './emulator-launch.js';

const mockExecFile = vi.mocked(execFile);

// ---------------------------------------------------------------------------
// selectProfileFromReadme
// ---------------------------------------------------------------------------

describe('selectProfileFromReadme', () => {
  // WHDLoad requirements
  it('selects whdload for requires: ["whdload"]', () => {
    expect(selectProfileFromReadme(['whdload'], [])).toBe('whdload');
  });

  it('selects whdload case-insensitively for requires: ["WHDLoad"]', () => {
    expect(selectProfileFromReadme(['WHDLoad'], [])).toBe('whdload');
  });

  // AGA requirements
  it('selects a1200 for requires: ["AGA"]', () => {
    expect(selectProfileFromReadme(['AGA'], [])).toBe('a1200');
  });

  it('selects a1200 for requires: ["aga chipset"] (substring match)', () => {
    expect(selectProfileFromReadme(['aga chipset'], [])).toBe('a1200');
  });

  // 68030 requirements
  it('selects a1200-030 for requires: ["68030"]', () => {
    expect(selectProfileFromReadme(['68030'], [])).toBe('a1200-030');
  });

  it('selects a1200-030 for requires: ["68030+"]', () => {
    expect(selectProfileFromReadme(['68030+'], [])).toBe('a1200-030');
  });

  it('selects a1200-030 for requires: ["030"] (abbreviated form)', () => {
    expect(selectProfileFromReadme(['030'], [])).toBe('a1200-030');
  });

  // 68040 requirements
  it('selects a4000 for requires: ["68040"]', () => {
    expect(selectProfileFromReadme(['68040'], [])).toBe('a4000');
  });

  it('selects a4000 for requires: ["68040+"]', () => {
    expect(selectProfileFromReadme(['68040+'], [])).toBe('a4000');
  });

  it('selects a4000 for requires: ["040"] (abbreviated form)', () => {
    expect(selectProfileFromReadme(['040'], [])).toBe('a4000');
  });

  // 68020 requirements
  it('selects a1200 for requires: ["68020"]', () => {
    expect(selectProfileFromReadme(['68020'], [])).toBe('a1200');
  });

  it('selects a1200 for requires: ["68020+"]', () => {
    expect(selectProfileFromReadme(['68020+'], [])).toBe('a1200');
  });

  // OS version requirements
  it('selects a1200 for requires: ["OS 3.0+"]', () => {
    expect(selectProfileFromReadme(['OS 3.0+'], [])).toBe('a1200');
  });

  it('selects a1200 for requires: ["OS 3.1"]', () => {
    expect(selectProfileFromReadme(['OS 3.1'], [])).toBe('a1200');
  });

  it('selects a1200 for requires: ["3.0"]', () => {
    expect(selectProfileFromReadme(['3.0'], [])).toBe('a1200');
  });

  it('selects a1200 for requires: ["AmigaOS 2.0"]', () => {
    expect(selectProfileFromReadme(['AmigaOS 2.0'], [])).toBe('a1200');
  });

  // Default case
  it('defaults to a500 when requires is empty', () => {
    expect(selectProfileFromReadme([], [])).toBe('a500');
  });

  it('defaults to a500 when empty requires and empty architecture', () => {
    expect(selectProfileFromReadme([], [])).toBe('a500');
  });

  it('defaults to a500 for unknown requirement text', () => {
    expect(selectProfileFromReadme(['some random text'], [])).toBe('a500');
  });

  // Priority: highest requirement wins
  it('selects a4000 when AGA and 68040 both present (highest wins)', () => {
    expect(selectProfileFromReadme(['AGA', '68040'], [])).toBe('a4000');
  });

  it('selects whdload when AGA and whdload both present (WHDLoad takes priority)', () => {
    expect(selectProfileFromReadme(['AGA', 'whdload'], [])).toBe('whdload');
  });
});

// ---------------------------------------------------------------------------
// writeFsUaeConfig
// ---------------------------------------------------------------------------

describe('writeFsUaeConfig', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'emulator-launch-test-'));
  });

  it('writes config string to disk at the given path', () => {
    const configPath = join(tmpDir, 'test.fs-uae');
    writeFsUaeConfig('[config]\namiga_model = A500\n', configPath);

    expect(existsSync(configPath)).toBe(true);
  });

  it('file content matches input string exactly', () => {
    const configPath = join(tmpDir, 'test.fs-uae');
    const content = '[config]\namiga_model = A500\nchip_memory = 512\n';
    writeFsUaeConfig(content, configPath);

    expect(readFileSync(configPath, 'utf-8')).toBe(content);
  });

  it('creates parent directories if they do not exist', () => {
    const configPath = join(tmpDir, 'nested', 'deep', 'test.fs-uae');
    writeFsUaeConfig('[config]\n', configPath);

    expect(existsSync(configPath)).toBe(true);
  });

  it('overwrites existing file at same path', () => {
    const configPath = join(tmpDir, 'overwrite.fs-uae');
    writeFsUaeConfig('old content', configPath);
    writeFsUaeConfig('new content', configPath);

    expect(readFileSync(configPath, 'utf-8')).toBe('new content');
  });
});

// ---------------------------------------------------------------------------
// launchEmulator
// ---------------------------------------------------------------------------

describe('launchEmulator', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'emulator-launch-test-'));
    vi.useFakeTimers({ now: new Date('2026-01-15T12:00:00Z') });
    mockExecFile.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const validConfig: LaunchConfig = {
    profileId: 'a500',
    kickstartFile: '/roms/kick13.rom',
    hardDrives: [
      { path: '/amiga/sys', label: 'DH0' },
    ],
  };

  it('returns success with configPath on happy path', async () => {
    mockExecFile.mockImplementation(
      ((_cmd: unknown, _args: unknown, cb: unknown) => {
        (cb as Function)(null, '', '');
      }) as typeof execFile,
    );

    const result = await launchEmulator(validConfig, tmpDir);

    expect(result.success).toBe(true);
    expect(result.configPath).toBeDefined();
    expect(result.configPath!.endsWith('.fs-uae')).toBe(true);
  });

  it('returns FSUAE_MISSING error when execFile throws ENOENT', async () => {
    mockExecFile.mockImplementation(
      ((_cmd: unknown, _args: unknown, cb: unknown) => {
        const err = Object.assign(new Error('spawn fs-uae ENOENT'), { code: 'ENOENT' });
        (cb as Function)(err, '', '');
      }) as typeof execFile,
    );

    const result = await launchEmulator(validConfig, tmpDir);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('FSUAE_MISSING');
    expect(result.error?.guidance).toContain('fs-uae');
  });

  it('returns NO_HARD_DRIVES error when hardDrives is empty', async () => {
    const config: LaunchConfig = {
      ...validConfig,
      hardDrives: [],
    };

    const result = await launchEmulator(config, tmpDir);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('NO_HARD_DRIVES');
  });

  it('returns LAUNCH_FAILED when execFile exits non-zero', async () => {
    mockExecFile.mockImplementation(
      ((_cmd: unknown, _args: unknown, cb: unknown) => {
        const err = Object.assign(new Error('Process exited with code 1'), { code: 1 });
        (cb as Function)(err, '', '');
      }) as typeof execFile,
    );

    const result = await launchEmulator(validConfig, tmpDir);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('LAUNCH_FAILED');
  });

  it('uses custom fsUaePath when provided', async () => {
    mockExecFile.mockImplementation(
      ((_cmd: unknown, _args: unknown, cb: unknown) => {
        (cb as Function)(null, '', '');
      }) as typeof execFile,
    );

    const config: LaunchConfig = {
      ...validConfig,
      fsUaePath: '/usr/local/bin/fs-uae',
    };

    await launchEmulator(config, tmpDir);

    expect(mockExecFile).toHaveBeenCalledWith(
      '/usr/local/bin/fs-uae',
      expect.arrayContaining([expect.stringContaining('.fs-uae')]),
      expect.any(Function),
    );
  });

  it('uses default "fs-uae" when fsUaePath is undefined', async () => {
    mockExecFile.mockImplementation(
      ((_cmd: unknown, _args: unknown, cb: unknown) => {
        (cb as Function)(null, '', '');
      }) as typeof execFile,
    );

    await launchEmulator(validConfig, tmpDir);

    expect(mockExecFile).toHaveBeenCalledWith(
      'fs-uae',
      expect.arrayContaining([expect.stringContaining('.fs-uae')]),
      expect.any(Function),
    );
  });

  it('writes config file to configDir before launching', async () => {
    mockExecFile.mockImplementation(
      ((_cmd: unknown, _args: unknown, cb: unknown) => {
        (cb as Function)(null, '', '');
      }) as typeof execFile,
    );

    const result = await launchEmulator(validConfig, tmpDir);

    expect(result.configPath).toBeDefined();
    expect(existsSync(result.configPath!)).toBe(true);
    const content = readFileSync(result.configPath!, 'utf-8');
    expect(content).toContain('[config]');
    expect(content).toContain('amiga_model');
  });

  it('config file name includes timestamp for uniqueness', async () => {
    mockExecFile.mockImplementation(
      ((_cmd: unknown, _args: unknown, cb: unknown) => {
        (cb as Function)(null, '', '');
      }) as typeof execFile,
    );

    const result = await launchEmulator(validConfig, tmpDir);

    expect(result.configPath).toBeDefined();
    // Should contain "launch-" prefix and a timestamp
    const filename = result.configPath!.split('/').pop()!;
    expect(filename).toMatch(/^launch-\d+\.fs-uae$/);
  });
});
