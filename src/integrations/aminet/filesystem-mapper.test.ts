/**
 * Tests for Amiga filesystem mapper.
 *
 * Covers assign mapping, path translation, volume prefix stripping,
 * case-insensitive lookup, file placement, and temp dir cleanup.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { rmSync } from 'node:fs';
import { AMIGA_ASSIGN_MAP, mapToAmigaPath, placeFiles } from './filesystem-mapper.js';
import type { InstallConfig } from './types.js';

describe('AMIGA_ASSIGN_MAP', () => {
  it('has entries for all 11 standard assigns', () => {
    const expectedKeys = ['c', 'libs', 'devs', 's', 'l', 'fonts', 'locale', 'classes', 'rexx', 'prefs', 't'];
    for (const key of expectedKeys) {
      expect(AMIGA_ASSIGN_MAP).toHaveProperty(key);
    }
    expect(Object.keys(AMIGA_ASSIGN_MAP)).toHaveLength(11);
  });

  it('all keys are lowercase', () => {
    for (const key of Object.keys(AMIGA_ASSIGN_MAP)) {
      expect(key).toBe(key.toLowerCase());
    }
  });
});

describe('mapToAmigaPath', () => {
  const sysRoot = '/tmp/amiga';

  it('maps Libs/ to sysRoot/Libs/', () => {
    const config: InstallConfig = { sysRoot };
    expect(mapToAmigaPath('Libs/mylib.library', 'game/shoot/Doom', config)).toBe(
      join(sysRoot, 'Libs', 'mylib.library'),
    );
  });

  it('handles case-insensitive LIBS/ -> Libs/', () => {
    const config: InstallConfig = { sysRoot };
    expect(mapToAmigaPath('LIBS/mylib.library', 'game/shoot/Doom', config)).toBe(
      join(sysRoot, 'Libs', 'mylib.library'),
    );
  });

  it('handles case-insensitive libs/ -> Libs/', () => {
    const config: InstallConfig = { sysRoot };
    expect(mapToAmigaPath('libs/mylib.library', 'game/shoot/Doom', config)).toBe(
      join(sysRoot, 'Libs', 'mylib.library'),
    );
  });

  it('maps C/ to sysRoot/C/', () => {
    const config: InstallConfig = { sysRoot };
    expect(mapToAmigaPath('C/MyCommand', 'util/cli/MyCLI', config)).toBe(
      join(sysRoot, 'C', 'MyCommand'),
    );
  });

  it('maps nested paths within an assign', () => {
    const config: InstallConfig = { sysRoot };
    expect(mapToAmigaPath('Devs/Keymaps/usa', 'util/misc/Keys', config)).toBe(
      join(sysRoot, 'Devs', 'Keymaps', 'usa'),
    );
  });

  it('maps S/ to sysRoot/S/', () => {
    const config: InstallConfig = { sysRoot };
    expect(mapToAmigaPath('S/Startup-Sequence', 'util/boot/StartSeq', config)).toBe(
      join(sysRoot, 'S', 'Startup-Sequence'),
    );
  });

  it('maps Fonts/ to sysRoot/Fonts/', () => {
    const config: InstallConfig = { sysRoot };
    expect(mapToAmigaPath('Fonts/topaz.font', 'text/font/Topaz', config)).toBe(
      join(sysRoot, 'Fonts', 'topaz.font'),
    );
  });

  it('places non-system files in Software/{basename}/', () => {
    const config: InstallConfig = { sysRoot };
    expect(mapToAmigaPath('MyGame/game.exe', 'game/shoot/Doom', config)).toBe(
      join(sysRoot, 'Software', 'Doom', 'MyGame', 'game.exe'),
    );
  });

  it('uses customPath when specified', () => {
    const config: InstallConfig = { sysRoot, customPath: 'Games/Doom' };
    expect(mapToAmigaPath('MyGame/game.exe', 'game/shoot/Doom', config)).toBe(
      join(sysRoot, 'Games', 'Doom', 'MyGame', 'game.exe'),
    );
  });

  it('strips SYS: volume prefix before mapping', () => {
    const config: InstallConfig = { sysRoot };
    expect(mapToAmigaPath('SYS:C/MyCommand', 'util/cli/MyCLI', config)).toBe(
      join(sysRoot, 'C', 'MyCommand'),
    );
  });

  it('strips Work: volume prefix and places in Software/ for non-assign', () => {
    const config: InstallConfig = { sysRoot };
    expect(mapToAmigaPath('Work:Games/Doom', 'game/shoot/Doom', config)).toBe(
      join(sysRoot, 'Software', 'Doom', 'Games', 'Doom'),
    );
  });

  it('places root-level single file in Software/{packageName}/', () => {
    const config: InstallConfig = { sysRoot };
    expect(mapToAmigaPath('readme.txt', 'game/shoot/Doom', config)).toBe(
      join(sysRoot, 'Software', 'Doom', 'readme.txt'),
    );
  });
});

describe('placeFiles', () => {
  const tempDirs: string[] = [];

  function makeTempDir(prefix: string): string {
    const dir = mkdtempSync(join(tmpdir(), prefix));
    tempDirs.push(dir);
    return dir;
  }

  afterEach(() => {
    for (const dir of tempDirs) {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        // ignore cleanup errors
      }
    }
    tempDirs.length = 0;
  });

  it('places 3 files including nested dirs and cleans up source', () => {
    const extractDir = makeTempDir('extract-');
    const sysRoot = makeTempDir('sys-');

    // Create 3 files in extractDir (including a nested dir)
    writeFileSync(join(extractDir, 'readme.txt'), 'Hello Amiga');
    mkdirSync(join(extractDir, 'Data'), { recursive: true });
    writeFileSync(join(extractDir, 'Data', 'level1.map'), 'level data');
    writeFileSync(join(extractDir, 'run.sh'), 'start game');

    const config: InstallConfig = { sysRoot };
    const result = placeFiles(extractDir, 'game/shoot/Doom', config);

    expect(result).toHaveLength(3);

    // Verify all destination files exist
    for (const file of result) {
      expect(existsSync(file.destPath)).toBe(true);
    }

    // Verify directories were created
    expect(existsSync(join(sysRoot, 'Software', 'Doom'))).toBe(true);

    // Verify source temp dir is cleaned up
    expect(existsSync(extractDir)).toBe(false);

    // Remove sysRoot from tracking since extractDir is already gone
    const idx = tempDirs.indexOf(extractDir);
    if (idx !== -1) tempDirs.splice(idx, 1);
  });

  it('returns InstalledFile[] with correct sourcePath, destPath, sha256', () => {
    const extractDir = makeTempDir('extract-');
    const sysRoot = makeTempDir('sys-');

    writeFileSync(join(extractDir, 'test.txt'), 'content123');

    const config: InstallConfig = { sysRoot };
    const result = placeFiles(extractDir, 'util/misc/Test', config);

    expect(result).toHaveLength(1);
    expect(result[0].sourcePath).toBe('test.txt');
    expect(result[0].destPath).toBe(join(sysRoot, 'Software', 'Test', 'test.txt'));
    expect(result[0].sha256).toMatch(/^[a-f0-9]{64}$/);

    // Remove extractDir from tracking
    const idx = tempDirs.indexOf(extractDir);
    if (idx !== -1) tempDirs.splice(idx, 1);
  });

  it('places assign-mapped files correctly', () => {
    const extractDir = makeTempDir('extract-');
    const sysRoot = makeTempDir('sys-');

    mkdirSync(join(extractDir, 'Libs'), { recursive: true });
    writeFileSync(join(extractDir, 'Libs', 'mylib.library'), 'library data');

    const config: InstallConfig = { sysRoot };
    const result = placeFiles(extractDir, 'util/libs/MyLib', config);

    expect(result).toHaveLength(1);
    expect(result[0].destPath).toBe(join(sysRoot, 'Libs', 'mylib.library'));
    expect(existsSync(result[0].destPath)).toBe(true);

    const idx = tempDirs.indexOf(extractDir);
    if (idx !== -1) tempDirs.splice(idx, 1);
  });

  it('places files with overlapping assigns correctly', () => {
    const extractDir = makeTempDir('extract-');
    const sysRoot = makeTempDir('sys-');

    mkdirSync(join(extractDir, 'C'), { recursive: true });
    mkdirSync(join(extractDir, 'Libs'), { recursive: true });
    writeFileSync(join(extractDir, 'C', 'cmd'), 'command data');
    writeFileSync(join(extractDir, 'Libs', 'lib'), 'library data');

    const config: InstallConfig = { sysRoot };
    const result = placeFiles(extractDir, 'util/misc/Multi', config);

    expect(result).toHaveLength(2);

    const cmdFile = result.find((f) => f.sourcePath === 'C/cmd');
    const libFile = result.find((f) => f.sourcePath === 'Libs/lib');

    expect(cmdFile).toBeDefined();
    expect(libFile).toBeDefined();
    expect(cmdFile!.destPath).toBe(join(sysRoot, 'C', 'cmd'));
    expect(libFile!.destPath).toBe(join(sysRoot, 'Libs', 'lib'));
    expect(existsSync(cmdFile!.destPath)).toBe(true);
    expect(existsSync(libFile!.destPath)).toBe(true);

    const idx = tempDirs.indexOf(extractDir);
    if (idx !== -1) tempDirs.splice(idx, 1);
  });

  it('computes sha256 for each placed file (not empty)', () => {
    const extractDir = makeTempDir('extract-');
    const sysRoot = makeTempDir('sys-');

    writeFileSync(join(extractDir, 'file1.txt'), 'data1');
    writeFileSync(join(extractDir, 'file2.txt'), 'data2');

    const config: InstallConfig = { sysRoot };
    const result = placeFiles(extractDir, 'util/misc/HashTest', config);

    expect(result).toHaveLength(2);
    for (const file of result) {
      expect(file.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(file.sha256).not.toBe('');
    }

    const idx = tempDirs.indexOf(extractDir);
    if (idx !== -1) tempDirs.splice(idx, 1);
  });
});
