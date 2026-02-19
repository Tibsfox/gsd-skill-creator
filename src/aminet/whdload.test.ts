/**
 * Tests for WHDLoad slave detection, Kickstart naming map, and config builder.
 *
 * Verifies:
 * - detectSlaveFiles finds .Slave files case-insensitively and recursively
 * - WHDLOAD_KICKSTART_MAP follows WHDLoad naming convention
 * - buildWhdloadConfig generates correct FsUaeConfig with hardware overrides
 */

import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { detectSlaveFiles, buildWhdloadConfig, WHDLOAD_KICKSTART_MAP } from './whdload.js';
import type { WhdloadEntry, LaunchConfig } from './types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), 'whdload-test-'));
}

function touch(dir: string, relPath: string): void {
  const full = join(dir, relPath);
  mkdirSync(join(full, '..'), { recursive: true });
  writeFileSync(full, '');
}

/** Minimal WhdloadEntry for config tests. */
function makeEntry(overrides: Partial<WhdloadEntry> = {}): WhdloadEntry {
  return {
    filename: 'TestGame.lha',
    name: 'Test Game',
    slaveDefault: 'TestGame.Slave',
    slaveCount: 1,
    hardware: {},
    ...overrides,
  };
}

/** Minimal LaunchConfig for config tests. */
function makeLaunchConfig(overrides: Partial<LaunchConfig> = {}): LaunchConfig {
  return {
    profileId: 'whdload',
    kickstartFile: '/roms/kick40068.A1200',
    hardDrives: [
      { path: '/amiga/System', label: 'DH0' },
    ],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Temp dir cleanup
// ---------------------------------------------------------------------------

const tempDirs: string[] = [];
afterEach(() => {
  for (const d of tempDirs) {
    rmSync(d, { recursive: true, force: true });
  }
  tempDirs.length = 0;
});

// ---------------------------------------------------------------------------
// detectSlaveFiles
// ---------------------------------------------------------------------------

describe('detectSlaveFiles', () => {
  it('returns only .Slave files from a mixed directory', () => {
    const dir = makeTempDir();
    tempDirs.push(dir);
    touch(dir, 'Game.Slave');
    touch(dir, 'readme.txt');
    touch(dir, 'icon.info');

    const result = detectSlaveFiles(dir);
    expect(result).toEqual(['Game.Slave']);
  });

  it('detects slaves case-insensitively (.slave, .SLAVE)', () => {
    const dir = makeTempDir();
    tempDirs.push(dir);
    touch(dir, 'game.slave');
    touch(dir, 'OTHER.SLAVE');

    const result = detectSlaveFiles(dir);
    expect(result).toHaveLength(2);
    expect(result).toContain('game.slave');
    expect(result).toContain('OTHER.SLAVE');
  });

  it('returns relative paths including subdirectories', () => {
    const dir = makeTempDir();
    tempDirs.push(dir);
    touch(dir, 'Game/Game.Slave');

    const result = detectSlaveFiles(dir);
    expect(result).toEqual(['Game/Game.Slave']);
  });

  it('returns multiple slaves sorted alphabetically', () => {
    const dir = makeTempDir();
    tempDirs.push(dir);
    touch(dir, 'Zeta.Slave');
    touch(dir, 'Alpha.Slave');

    const result = detectSlaveFiles(dir);
    expect(result).toEqual(['Alpha.Slave', 'Zeta.Slave']);
  });

  it('returns empty array for empty directory', () => {
    const dir = makeTempDir();
    tempDirs.push(dir);

    expect(detectSlaveFiles(dir)).toEqual([]);
  });

  it('returns empty array for non-existent directory (graceful degradation)', () => {
    expect(detectSlaveFiles('/tmp/does-not-exist-whdload-test')).toEqual([]);
  });

  it('returns empty array when no .Slave files present', () => {
    const dir = makeTempDir();
    tempDirs.push(dir);
    touch(dir, 'readme.txt');
    touch(dir, 'icon.info');
    touch(dir, 'data.bin');

    expect(detectSlaveFiles(dir)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// WHDLOAD_KICKSTART_MAP
// ---------------------------------------------------------------------------

describe('WHDLOAD_KICKSTART_MAP', () => {
  it('maps 34.005 to kick34005.A500 (KS 1.3)', () => {
    expect(WHDLOAD_KICKSTART_MAP['34.005']).toBe('kick34005.A500');
  });

  it('maps 40.068 to kick40068.A1200 (KS 3.1)', () => {
    expect(WHDLOAD_KICKSTART_MAP['40.068']).toBe('kick40068.A1200');
  });

  it('has entries for at least 5 common revisions', () => {
    const required = ['34.005', '37.175', '37.299', '39.106', '40.068'];
    for (const rev of required) {
      expect(WHDLOAD_KICKSTART_MAP).toHaveProperty(rev);
    }
  });

  it('all values follow pattern: kick + revision-without-dot + . + model', () => {
    for (const [rev, filename] of Object.entries(WHDLOAD_KICKSTART_MAP)) {
      expect(filename).toMatch(/^kick\d+\.\w+$/);
      // The digits part should match revision with dot removed
      const digits = rev.replace('.', '');
      expect(filename.startsWith(`kick${digits}`)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// buildWhdloadConfig
// ---------------------------------------------------------------------------

describe('buildWhdloadConfig', () => {
  it('returns default WHDLoad profile config with no hardware overrides', () => {
    const entry = makeEntry();
    const config = makeLaunchConfig();
    const installDir = '/amiga/Games/TestGame';

    const result = buildWhdloadConfig(entry, config, installDir);

    // WHDLoad profile defaults: A1200, 2048 chip, 8192 fast
    expect(result.amiga_model).toBe('A1200');
    expect(result.chip_memory).toBe(2048);
    expect(result.fast_memory).toBe(8192);
  });

  it('overrides CPU from WhdloadEntry hardware.cpu', () => {
    const entry = makeEntry({ hardware: { cpu: '68040' } });
    const config = makeLaunchConfig();
    const installDir = '/amiga/Games/TestGame';

    const result = buildWhdloadConfig(entry, config, installDir);

    // CPU override should change amiga_model to A4000/040-like
    expect(result.amiga_model).toBe('A4000/040');
  });

  it('adjusts model when hardware.chipset is OCS', () => {
    const entry = makeEntry({ hardware: { chipset: 'OCS' } });
    const config = makeLaunchConfig();
    const installDir = '/amiga/Games/TestGame';

    const result = buildWhdloadConfig(entry, config, installDir);

    expect(result.amiga_model).toBe('A500');
  });

  it('overrides fast_memory from hardware.fastRamMb', () => {
    const entry = makeEntry({ hardware: { fastRamMb: 4 } });
    const config = makeLaunchConfig();
    const installDir = '/amiga/Games/TestGame';

    const result = buildWhdloadConfig(entry, config, installDir);

    expect(result.fast_memory).toBe(4096); // 4 * 1024
  });

  it('adds ntsc_mode when hardware.ntsc is true', () => {
    const entry = makeEntry({ hardware: { ntsc: true } });
    const config = makeLaunchConfig();
    const installDir = '/amiga/Games/TestGame';

    const result = buildWhdloadConfig(entry, config, installDir);

    expect(result.ntsc_mode).toBe(1);
  });

  it('maps hardware.clock to cpu_speed', () => {
    const entry = makeEntry({ hardware: { clock: '14' } });
    const config = makeLaunchConfig();
    const installDir = '/amiga/Games/TestGame';

    const result = buildWhdloadConfig(entry, config, installDir);

    expect(result.cpu_speed).toBe('2x');
  });

  it('includes hard_drive_0 pointing to installDir', () => {
    const entry = makeEntry();
    const config = makeLaunchConfig();
    const installDir = '/amiga/Games/TestGame';

    const result = buildWhdloadConfig(entry, config, installDir);

    expect(result.hard_drive_0).toBe('/amiga/Games/TestGame');
  });

  it('includes kickstart_file from LaunchConfig', () => {
    const entry = makeEntry();
    const config = makeLaunchConfig({ kickstartFile: '/roms/kick34005.A500' });
    const installDir = '/amiga/Games/TestGame';

    const result = buildWhdloadConfig(entry, config, installDir);

    expect(result.kickstart_file).toBe('/roms/kick34005.A500');
  });

  it('sets PRELOAD hint when fastRamMb >= 4', () => {
    const entry = makeEntry({ hardware: { fastRamMb: 8 } });
    const config = makeLaunchConfig();
    const installDir = '/amiga/Games/TestGame';

    const result = buildWhdloadConfig(entry, config, installDir);

    expect(result.whdload_preload).toBe(1);
  });

  it('sets PRELOAD hint when default profile has fast >= 4096', () => {
    const entry = makeEntry(); // no hardware overrides; WHDLoad profile has 8192 fast
    const config = makeLaunchConfig();
    const installDir = '/amiga/Games/TestGame';

    const result = buildWhdloadConfig(entry, config, installDir);

    expect(result.whdload_preload).toBe(1);
  });

  it('disables save_states (corruption prevention for directory hard drives)', () => {
    const entry = makeEntry();
    const config = makeLaunchConfig();
    const installDir = '/amiga/Games/TestGame';

    const result = buildWhdloadConfig(entry, config, installDir);

    expect(result.save_states).toBe(0);
  });

  it('all config values are string | number | boolean', () => {
    const entry = makeEntry({ hardware: { cpu: '68040', ntsc: true, clock: '14' } });
    const config = makeLaunchConfig();
    const installDir = '/amiga/Games/TestGame';

    const result = buildWhdloadConfig(entry, config, installDir);

    for (const [key, value] of Object.entries(result)) {
      expect(
        typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean',
      ).toBe(true);
    }
  });

  it('uses WHDLoad profile defaults with no hardware overrides', () => {
    const entry = makeEntry({ hardware: {} });
    const config = makeLaunchConfig();
    const installDir = '/amiga/Games/TestGame';

    const result = buildWhdloadConfig(entry, config, installDir);

    expect(result.amiga_model).toBe('A1200');
    expect(result.chip_memory).toBe(2048);
    expect(result.fast_memory).toBe(8192);
  });

  it('uses WHDLoad profile defaults with empty hardware object', () => {
    const entry: WhdloadEntry = {
      filename: 'TestGame.lha',
      name: 'Test Game',
      slaveDefault: 'TestGame.Slave',
      slaveCount: 1,
      hardware: {},
    };
    const config = makeLaunchConfig();
    const installDir = '/amiga/Games/TestGame';

    const result = buildWhdloadConfig(entry, config, installDir);

    expect(result.amiga_model).toBe('A1200');
    expect(result.chip_memory).toBe(2048);
    expect(result.fast_memory).toBe(8192);
  });
});
