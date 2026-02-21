/**
 * Tests for FS-UAE configuration generator.
 *
 * Covers buildFsUaeConfig (structured -> flat config) and
 * generateFsUaeConfig (flat config -> serialized string).
 * Pure functions, no mocking needed.
 */

import { describe, it, expect } from 'vitest';
import { buildFsUaeConfig, generateFsUaeConfig } from './emulator-config.js';
import type { HardwareProfile, LaunchConfig, FsUaeConfig } from './types.js';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const a500Profile: HardwareProfile = {
  id: 'a500',
  name: 'Amiga 500',
  amigaModel: 'A500',
  kickstartVersion: '1.3',
  kickstartRevision: '34.005',
  cpu: '68000',
  chipMemoryKb: 512,
  slowMemoryKb: 512,
  fastMemoryKb: 0,
  chipset: 'OCS',
  display: { width: 720, height: 568 },
  sound: { stereoSeparation: 70 },
};

const a1200Profile: HardwareProfile = {
  id: 'a1200',
  name: 'Amiga 1200',
  amigaModel: 'A1200',
  kickstartVersion: '3.1',
  kickstartRevision: '40.068',
  cpu: '68ec020',
  chipMemoryKb: 2048,
  slowMemoryKb: 0,
  fastMemoryKb: 0,
  chipset: 'AGA',
  display: { width: 720, height: 568 },
  sound: { stereoSeparation: 70 },
};

const whdloadProfile: HardwareProfile = {
  id: 'whdload',
  name: 'WHDLoad',
  amigaModel: 'A1200',
  kickstartVersion: '3.1',
  kickstartRevision: '40.068',
  cpu: '68020',
  chipMemoryKb: 2048,
  slowMemoryKb: 0,
  fastMemoryKb: 8192,
  chipset: 'AGA',
  display: { width: 720, height: 568 },
  sound: { stereoSeparation: 100 },
};

const baseLaunchConfig: LaunchConfig = {
  profileId: 'a500',
  kickstartFile: '/roms/kick13.rom',
  hardDrives: [
    { path: '/amiga/sys', label: 'DH0' },
  ],
};

// ---------------------------------------------------------------------------
// buildFsUaeConfig
// ---------------------------------------------------------------------------

describe('buildFsUaeConfig', () => {
  it('produces correct base config from A500 profile with one hard drive', () => {
    const result = buildFsUaeConfig(a500Profile, baseLaunchConfig);

    expect(result.amiga_model).toBe('A500');
    expect(result.kickstart_file).toBe('/roms/kick13.rom');
    expect(result.chip_memory).toBe(512);
    expect(result.slow_memory).toBe(512);
    expect(result.fast_memory).toBe(0);
    expect(result.hard_drive_0).toBe('/amiga/sys');
    expect(result.hard_drive_0_label).toBe('DH0');
    expect(result.window_width).toBe(720);
    expect(result.window_height).toBe(568);
    expect(result.stereo_separation).toBe(70);
  });

  it('handles A1200 profile with 2 hard drives', () => {
    const config: LaunchConfig = {
      profileId: 'a1200',
      kickstartFile: '/roms/kick31.rom',
      hardDrives: [
        { path: '/amiga/sys', label: 'DH0' },
        { path: '/amiga/work', label: 'DH1' },
      ],
    };

    const result = buildFsUaeConfig(a1200Profile, config);

    expect(result.amiga_model).toBe('A1200');
    expect(result.hard_drive_0).toBe('/amiga/sys');
    expect(result.hard_drive_0_label).toBe('DH0');
    expect(result.hard_drive_1).toBe('/amiga/work');
    expect(result.hard_drive_1_label).toBe('DH1');
  });

  it('sets fast_memory from WHDLoad profile', () => {
    const config: LaunchConfig = {
      profileId: 'whdload',
      kickstartFile: '/roms/kick31.rom',
      hardDrives: [{ path: '/amiga/games', label: 'DH0' }],
    };

    const result = buildFsUaeConfig(whdloadProfile, config);

    expect(result.fast_memory).toBe(8192);
  });

  it('sets hard_drive_0_read_only for readOnly drives', () => {
    const config: LaunchConfig = {
      profileId: 'a500',
      kickstartFile: '/roms/kick13.rom',
      hardDrives: [
        { path: '/amiga/sys', label: 'DH0', readOnly: true },
      ],
    };

    const result = buildFsUaeConfig(a500Profile, config);

    expect(result.hard_drive_0_read_only).toBe('1');
  });

  it('sets hard_drive_0_priority for bootPriority drives', () => {
    const config: LaunchConfig = {
      profileId: 'a500',
      kickstartFile: '/roms/kick13.rom',
      hardDrives: [
        { path: '/amiga/sys', label: 'DH0', bootPriority: 0 },
      ],
    };

    const result = buildFsUaeConfig(a500Profile, config);

    expect(result.hard_drive_0_priority).toBe(0);
  });

  it('maps floppy drives to floppy_drive_N keys', () => {
    const config: LaunchConfig = {
      profileId: 'a500',
      kickstartFile: '/roms/kick13.rom',
      hardDrives: [],
      floppyDrives: ['/disks/wb13.adf', '/disks/extras13.adf'],
    };

    const result = buildFsUaeConfig(a500Profile, config);

    expect(result.floppy_drive_0).toBe('/disks/wb13.adf');
    expect(result.floppy_drive_1).toBe('/disks/extras13.adf');
  });

  it('enables save states when saveStates is true with saveStatesDir', () => {
    const config: LaunchConfig = {
      profileId: 'a500',
      kickstartFile: '/roms/kick13.rom',
      hardDrives: [{ path: '/amiga/sys', label: 'DH0' }],
      saveStates: true,
      saveStatesDir: '/saves/a500',
    };

    const result = buildFsUaeConfig(a500Profile, config);

    expect(result.save_states).toBe(1);
    expect(result.save_states_dir).toBe('/saves/a500');
  });

  it('disables save states when saveStates is false or undefined', () => {
    const result = buildFsUaeConfig(a500Profile, baseLaunchConfig);

    expect(result.save_states).toBe(0);
    expect(result.save_states_dir).toBeUndefined();
  });

  it('merges extraOptions over profile defaults', () => {
    const config: LaunchConfig = {
      profileId: 'a500',
      kickstartFile: '/roms/kick13.rom',
      hardDrives: [{ path: '/amiga/sys', label: 'DH0' }],
      extraOptions: { fullscreen: 1, custom_key: 'custom_value' },
    };

    const result = buildFsUaeConfig(a500Profile, config);

    // extraOptions override profile defaults
    expect(result.fullscreen).toBe(1);
    expect(result.custom_key).toBe('custom_value');
  });

  it('sets keep_aspect = 1 and fullscreen = 0 as defaults', () => {
    const result = buildFsUaeConfig(a500Profile, baseLaunchConfig);

    expect(result.keep_aspect).toBe(1);
    expect(result.fullscreen).toBe(0);
  });

  it('sets accuracy = 1 for cycle-exact emulation', () => {
    const result = buildFsUaeConfig(a500Profile, baseLaunchConfig);

    expect(result.accuracy).toBe(1);
  });

  it('includes volume = 100', () => {
    const result = buildFsUaeConfig(a500Profile, baseLaunchConfig);

    expect(result.volume).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// generateFsUaeConfig
// ---------------------------------------------------------------------------

describe('generateFsUaeConfig', () => {
  it('produces string starting with [config] header', () => {
    const config: FsUaeConfig = { amiga_model: 'A500' };
    const output = generateFsUaeConfig(config);

    expect(output.startsWith('[config]\n')).toBe(true);
  });

  it('emits each key-value pair on its own line as "key = value"', () => {
    const config: FsUaeConfig = {
      amiga_model: 'A500',
      chip_memory: 512,
    };
    const output = generateFsUaeConfig(config);
    const lines = output.split('\n');

    // [config] header + 2 key-value lines + trailing newline = 4 segments (last empty)
    expect(lines).toContain('amiga_model = A500');
    expect(lines).toContain('chip_memory = 512');
  });

  it('ends with a trailing newline', () => {
    const config: FsUaeConfig = { amiga_model: 'A500' };
    const output = generateFsUaeConfig(config);

    expect(output.endsWith('\n')).toBe(true);
  });

  it('normalizes Windows-style paths to forward slashes', () => {
    const config: FsUaeConfig = {
      kickstart_file: 'C:\\Users\\foxy\\roms\\kick13.rom',
    };
    const output = generateFsUaeConfig(config);

    expect(output).toContain('kickstart_file = C:/Users/foxy/roms/kick13.rom');
    expect(output).not.toContain('\\');
  });

  it('normalizes mixed slashes in paths', () => {
    const config: FsUaeConfig = {
      hard_drive_0: 'C:\\Users/foxy\\amiga/sys',
    };
    const output = generateFsUaeConfig(config);

    expect(output).toContain('hard_drive_0 = C:/Users/foxy/amiga/sys');
  });

  it('leaves forward-slash-only paths unchanged', () => {
    const config: FsUaeConfig = {
      hard_drive_0: '/home/foxy/amiga/sys',
    };
    const output = generateFsUaeConfig(config);

    expect(output).toContain('hard_drive_0 = /home/foxy/amiga/sys');
  });

  it('serializes boolean true as "1" and false as "0"', () => {
    const config: FsUaeConfig = {
      save_states: true,
      fullscreen: false,
    };
    const output = generateFsUaeConfig(config);

    expect(output).toContain('save_states = 1');
    expect(output).toContain('fullscreen = 0');
  });

  it('serializes numbers as strings', () => {
    const config: FsUaeConfig = {
      chip_memory: 2048,
    };
    const output = generateFsUaeConfig(config);

    expect(output).toContain('chip_memory = 2048');
  });

  it('omits undefined values from output', () => {
    const config: Record<string, string | number | boolean | undefined> = {
      amiga_model: 'A500',
      missing_key: undefined,
    };
    // Cast to FsUaeConfig -- in practice undefined values may slip through
    const output = generateFsUaeConfig(config as unknown as FsUaeConfig);

    expect(output).not.toContain('missing_key');
    expect(output).not.toContain('undefined');
  });

  it('sorts keys alphabetically for deterministic output', () => {
    const config: FsUaeConfig = {
      window_width: 720,
      amiga_model: 'A500',
      chip_memory: 512,
    };
    const output = generateFsUaeConfig(config);
    const lines = output.split('\n').filter(l => l.includes(' = '));

    expect(lines[0]).toContain('amiga_model');
    expect(lines[1]).toContain('chip_memory');
    expect(lines[2]).toContain('window_width');
  });

  it('returns just "[config]\\n" for empty config', () => {
    const output = generateFsUaeConfig({});

    expect(output).toBe('[config]\n');
  });
});
