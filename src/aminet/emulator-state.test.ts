/**
 * Tests for emulator state management module.
 *
 * Covers snapshot save/load/delete lifecycle, save state safety checks
 * against directory hard drives, and missing ROM guidance generation.
 *
 * @module emulator-state.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { LaunchConfig, HardwareProfile } from './types.js';
import {
  shouldDisableSaveStates,
  saveSnapshot,
  listSnapshots,
  deleteSnapshot,
  buildMissingRomGuidance,
} from './emulator-state.js';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeTempDir(): string {
  const dir = join(tmpdir(), `emu-state-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function makeLaunchConfig(overrides: Partial<LaunchConfig> = {}): LaunchConfig {
  return {
    profileId: 'a500',
    kickstartFile: '/roms/kick13.rom',
    hardDrives: [],
    ...overrides,
  };
}

function makeProfile(overrides: Partial<HardwareProfile> = {}): HardwareProfile {
  return {
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
    ...overrides,
  } as HardwareProfile;
}

// ---------------------------------------------------------------------------
// shouldDisableSaveStates
// ---------------------------------------------------------------------------

describe('shouldDisableSaveStates', () => {
  it('returns true when hard drive path is a directory (no .hdf extension)', () => {
    const config = makeLaunchConfig({
      hardDrives: [{ path: '/games/DH0', label: 'DH0' }],
    });
    expect(shouldDisableSaveStates(config)).toBe(true);
  });

  it('returns false when hard drive path ends with .hdf', () => {
    const config = makeLaunchConfig({
      hardDrives: [{ path: '/images/system.hdf', label: 'DH0' }],
    });
    expect(shouldDisableSaveStates(config)).toBe(false);
  });

  it('returns true when mixed: one directory and one .hdf', () => {
    const config = makeLaunchConfig({
      hardDrives: [
        { path: '/images/system.hdf', label: 'DH0' },
        { path: '/games/WHDLoad', label: 'DH1' },
      ],
    });
    expect(shouldDisableSaveStates(config)).toBe(true);
  });

  it('returns false when hardDrives is empty', () => {
    const config = makeLaunchConfig({ hardDrives: [] });
    expect(shouldDisableSaveStates(config)).toBe(false);
  });

  it('returns false when only floppy drives (no hard drives)', () => {
    const config = makeLaunchConfig({
      hardDrives: [],
      floppyDrives: ['/disks/df0.adf'],
    });
    expect(shouldDisableSaveStates(config)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// saveSnapshot
// ---------------------------------------------------------------------------

describe('saveSnapshot', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = makeTempDir();
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('writes metadata JSON to snapshotsDir/snapshots.json', () => {
    const snap = saveSnapshot(1, 'Test save', 'a500', tempDir);
    const metaPath = join(tempDir, 'snapshots.json');
    expect(existsSync(metaPath)).toBe(true);

    const data = JSON.parse(readFileSync(metaPath, 'utf-8'));
    expect(data).toBeInstanceOf(Array);
    expect(data.length).toBe(1);
    expect(data[0].slot).toBe(1);
    expect(data[0].label).toBe('Test save');
    expect(data[0].profileId).toBe('a500');
    expect(snap.slot).toBe(1);
  });

  it('metadata contains slot, savedAt (ISO 8601), label, profileId, snapshotDir', () => {
    const snap = saveSnapshot(5, 'Midgame', 'a1200', tempDir);
    expect(snap.slot).toBe(5);
    expect(snap.label).toBe('Midgame');
    expect(snap.profileId).toBe('a1200');
    expect(snap.snapshotDir).toBe(tempDir);
    // ISO 8601 timestamp check
    expect(() => new Date(snap.savedAt).toISOString()).not.toThrow();
  });

  it('multiple saves to different slots -> all entries present', () => {
    saveSnapshot(1, 'Save A', 'a500', tempDir);
    saveSnapshot(3, 'Save B', 'a1200', tempDir);
    saveSnapshot(9, 'Save C', 'a4000', tempDir);

    const metaPath = join(tempDir, 'snapshots.json');
    const data = JSON.parse(readFileSync(metaPath, 'utf-8'));
    expect(data.length).toBe(3);
  });

  it('save to same slot twice -> later save overwrites earlier', () => {
    saveSnapshot(2, 'First', 'a500', tempDir);
    saveSnapshot(2, 'Second', 'a500', tempDir);

    const metaPath = join(tempDir, 'snapshots.json');
    const data = JSON.parse(readFileSync(metaPath, 'utf-8'));
    expect(data.length).toBe(1);
    expect(data[0].label).toBe('Second');
  });

  it('throws for slot 0', () => {
    expect(() => saveSnapshot(0, 'Bad', 'a500', tempDir)).toThrow();
  });

  it('throws for slot 10', () => {
    expect(() => saveSnapshot(10, 'Bad', 'a500', tempDir)).toThrow();
  });

  it('creates non-existent snapshotsDir automatically', () => {
    const nested = join(tempDir, 'deep', 'nested', 'snapshots');
    saveSnapshot(1, 'Auto-create', 'a500', nested);
    expect(existsSync(join(nested, 'snapshots.json'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// listSnapshots
// ---------------------------------------------------------------------------

describe('listSnapshots', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = makeTempDir();
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('returns snapshots sorted by slot number', () => {
    saveSnapshot(9, 'Last', 'a500', tempDir);
    saveSnapshot(1, 'First', 'a500', tempDir);
    saveSnapshot(5, 'Middle', 'a500', tempDir);

    const snapshots = listSnapshots(tempDir);
    expect(snapshots.length).toBe(3);
    expect(snapshots[0].slot).toBe(1);
    expect(snapshots[1].slot).toBe(5);
    expect(snapshots[2].slot).toBe(9);
  });

  it('returns empty array for empty snapshotsDir (no snapshots.json)', () => {
    const emptyDir = makeTempDir();
    expect(listSnapshots(emptyDir)).toEqual([]);
    rmSync(emptyDir, { recursive: true, force: true });
  });

  it('returns empty array for non-existent snapshotsDir', () => {
    expect(listSnapshots('/nonexistent/path/12345')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// deleteSnapshot
// ---------------------------------------------------------------------------

describe('deleteSnapshot', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = makeTempDir();
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('removes entry from metadata and returns true', () => {
    saveSnapshot(3, 'To delete', 'a500', tempDir);
    saveSnapshot(5, 'Keep', 'a500', tempDir);

    const result = deleteSnapshot(3, tempDir);
    expect(result).toBe(true);

    const remaining = listSnapshots(tempDir);
    expect(remaining.length).toBe(1);
    expect(remaining[0].slot).toBe(5);
  });

  it('returns false for non-existent slot', () => {
    saveSnapshot(1, 'Only', 'a500', tempDir);
    expect(deleteSnapshot(7, tempDir)).toBe(false);
  });

  it('after deletion, listSnapshots no longer includes the deleted slot', () => {
    saveSnapshot(1, 'A', 'a500', tempDir);
    saveSnapshot(2, 'B', 'a500', tempDir);
    saveSnapshot(3, 'C', 'a500', tempDir);

    deleteSnapshot(2, tempDir);
    const snapshots = listSnapshots(tempDir);
    expect(snapshots.map((s) => s.slot)).toEqual([1, 3]);
  });
});

// ---------------------------------------------------------------------------
// buildMissingRomGuidance
// ---------------------------------------------------------------------------

describe('buildMissingRomGuidance', () => {
  it('returns correct guidance for A500 (KS 1.3, CRC32 0xC4F0F55F)', () => {
    const profile = makeProfile({
      id: 'a500',
      name: 'Amiga 500',
      kickstartVersion: '1.3',
      kickstartRevision: '34.005',
    });

    const result = buildMissingRomGuidance(profile);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error!.code).toBe('ROM_MISSING');
    expect(result.error!.romRequired).toBeDefined();
    expect(result.error!.romRequired!.version).toBe('1.3');
    expect(result.error!.romRequired!.crc32).toBe('0xC4F0F55F');
    expect(result.error!.romRequired!.model).toBe('A500');
  });

  it('returns correct guidance for A1200 (KS 3.1, CRC32 0x1483A091)', () => {
    const profile = makeProfile({
      id: 'a1200',
      name: 'Amiga 1200',
      kickstartVersion: '3.1',
      kickstartRevision: '40.068',
    });

    const result = buildMissingRomGuidance(profile);
    expect(result.success).toBe(false);
    expect(result.error!.romRequired!.version).toBe('3.1');
    expect(result.error!.romRequired!.crc32).toBe('0x1483A091');
    expect(result.error!.romRequired!.model).toBe('A1200');
  });

  it('returns correct guidance for A4000 (KS 3.1, CRC32 0xD6BAE334)', () => {
    const profile = makeProfile({
      id: 'a4000',
      name: 'Amiga 4000/040',
      amigaModel: 'A4000/040',
      kickstartVersion: '3.1',
      kickstartRevision: '40.068',
    });

    const result = buildMissingRomGuidance(profile);
    expect(result.success).toBe(false);
    expect(result.error!.romRequired!.crc32).toBe('0xD6BAE334');
  });

  it('guidance mentions ROMs are NOT distributed with this pack', () => {
    const profile = makeProfile();
    const result = buildMissingRomGuidance(profile);
    expect(result.error!.guidance).toContain('NOT distributed');
  });

  it('guidance mentions Cloanto Amiga Forever as legal ROM source', () => {
    const profile = makeProfile();
    const result = buildMissingRomGuidance(profile);
    expect(result.error!.guidance).toContain('Cloanto Amiga Forever');
    expect(result.error!.guidance).toContain('amigaforever.com');
  });
});
