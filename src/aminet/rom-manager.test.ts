/**
 * Tests for ROM manager -- CRC32, known ROM database, directory scanning,
 * profile-based ROM selection, and Cloanto encrypted ROM support.
 *
 * @module rom-manager.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { DetectedRom } from './types.js';

// ---------------------------------------------------------------------------
// Module under test
// ---------------------------------------------------------------------------

import {
  computeCrc32,
  CRC32_TABLE,
  decryptCloantoRom,
  KNOWN_ROMS,
  scanRomDirectory,
  selectRomForProfile,
} from './rom-manager.js';

// ---------------------------------------------------------------------------
// CRC32_TABLE
// ---------------------------------------------------------------------------

describe('CRC32_TABLE', () => {
  it('has exactly 256 entries', () => {
    expect(CRC32_TABLE.length).toBe(256);
  });

  it('first entry (index 0) is 0x00000000', () => {
    expect(CRC32_TABLE[0]).toBe(0x00000000);
  });

  it('all entries are unsigned 32-bit integers', () => {
    for (let i = 0; i < 256; i++) {
      expect(CRC32_TABLE[i]).toBeGreaterThanOrEqual(0);
      expect(CRC32_TABLE[i]).toBeLessThanOrEqual(0xFFFFFFFF);
      expect(CRC32_TABLE[i]).toBe(CRC32_TABLE[i] >>> 0);
    }
  });
});

// ---------------------------------------------------------------------------
// computeCrc32
// ---------------------------------------------------------------------------

describe('computeCrc32', () => {
  it('returns 0x00000000 for empty buffer', () => {
    expect(computeCrc32(new Uint8Array([]))).toBe(0x00000000);
  });

  it('computes standard IEEE test vector: ASCII "123456789" -> 0xCBF43926', () => {
    const data = new TextEncoder().encode('123456789');
    expect(computeCrc32(data)).toBe(0xCBF43926);
  });

  it('computes CRC32 of single byte 0x00 -> 0xD202EF8D', () => {
    expect(computeCrc32(new Uint8Array([0x00]))).toBe(0xD202EF8D);
  });

  it('computes CRC32 of all-0xFF buffer of 4 bytes', () => {
    const data = new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF]);
    // Known CRC32 of 4 x 0xFF
    const result = computeCrc32(data);
    expect(result).toBe(result >>> 0); // unsigned
    expect(result).toBe(0xFFFFFFFF);
  });

  it('returns unsigned 32-bit integer (>>> 0 applied)', () => {
    // CRC32 should never be negative
    const data = new TextEncoder().encode('test');
    const result = computeCrc32(data);
    expect(result).toBe(result >>> 0);
    expect(result).toBeGreaterThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------------
// decryptCloantoRom
// ---------------------------------------------------------------------------

describe('decryptCloantoRom', () => {
  it('XOR decrypts with cyclic key', () => {
    const key = new Uint8Array([0xAA, 0xBB]);
    const data = new Uint8Array([0xFF, 0x00, 0xAA, 0xBB]);
    const result = decryptCloantoRom(data, key);
    expect(result).toEqual(new Uint8Array([0x55, 0xBB, 0x00, 0x00]));
  });

  it('key longer than data uses only key bytes up to data length', () => {
    const key = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05]);
    const data = new Uint8Array([0xFF, 0xFF]);
    const result = decryptCloantoRom(data, key);
    expect(result).toEqual(new Uint8Array([0xFE, 0xFD]));
  });

  it('returns empty result for empty data', () => {
    const key = new Uint8Array([0xAA]);
    const result = decryptCloantoRom(new Uint8Array([]), key);
    expect(result).toEqual(new Uint8Array([]));
  });

  it('decryption is its own inverse', () => {
    const key = new Uint8Array([0xDE, 0xAD, 0xBE, 0xEF]);
    const original = new Uint8Array([0x48, 0x65, 0x6C, 0x6C, 0x6F]);
    const encrypted = decryptCloantoRom(original, key);
    const decrypted = decryptCloantoRom(encrypted, key);
    expect(decrypted).toEqual(original);
  });
});

// ---------------------------------------------------------------------------
// KNOWN_ROMS
// ---------------------------------------------------------------------------

describe('KNOWN_ROMS', () => {
  it('has at least 12 entries', () => {
    expect(KNOWN_ROMS.length).toBeGreaterThanOrEqual(12);
  });

  it('A500 KS1.3 entry has correct metadata', () => {
    const ks13 = KNOWN_ROMS.find(
      (r) => r.version === '1.3' && r.model === 'A500',
    );
    expect(ks13).toBeDefined();
    expect(ks13!.revision).toBe('34.005');
    expect(ks13!.crc32).toBe(0xC4F0F55F);
    expect(ks13!.size).toBe(262144);
  });

  it('A1200 KS3.1 entry has correct metadata', () => {
    const ks31 = KNOWN_ROMS.find(
      (r) => r.version === '3.1' && r.revision === '40.068' && r.model === 'A1200',
    );
    expect(ks31).toBeDefined();
    expect(ks31!.crc32).toBe(0x1483A091);
    expect(ks31!.size).toBe(524288);
  });

  it('A4000 KS3.1 entry has correct metadata', () => {
    const ks31a4k = KNOWN_ROMS.find(
      (r) => r.version === '3.1' && r.revision === '40.068' && r.model === 'A4000',
    );
    expect(ks31a4k).toBeDefined();
    expect(ks31a4k!.crc32).toBe(0xD6BAE334);
    expect(ks31a4k!.size).toBe(524288);
  });

  it('every entry has version, revision, model, crc32, and size', () => {
    for (const rom of KNOWN_ROMS) {
      expect(typeof rom.version).toBe('string');
      expect(rom.version.length).toBeGreaterThan(0);
      expect(typeof rom.revision).toBe('string');
      expect(rom.revision.length).toBeGreaterThan(0);
      expect(typeof rom.model).toBe('string');
      expect(rom.model.length).toBeGreaterThan(0);
      expect(typeof rom.crc32).toBe('number');
      expect(rom.crc32).toBe(rom.crc32 >>> 0);
      expect([262144, 524288]).toContain(rom.size);
    }
  });

  it('no entry has any actual ROM data (no Buffer/Uint8Array fields)', () => {
    for (const rom of KNOWN_ROMS) {
      const values = Object.values(rom);
      for (const v of values) {
        expect(v).not.toBeInstanceOf(Buffer);
        expect(v).not.toBeInstanceOf(Uint8Array);
        expect(v).not.toBeInstanceOf(ArrayBuffer);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// scanRomDirectory
// ---------------------------------------------------------------------------

describe('scanRomDirectory', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'rom-scan-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('identifies a 256KB ROM file matching A500 KS1.3 by CRC32', async () => {
    // Create a 256KB file filled with zeros
    const romPath = join(tmpDir, 'kick.rom');
    const romData = Buffer.alloc(262144, 0);
    writeFileSync(romPath, romData);

    // Mock computeCrc32 to return A500 KS1.3 CRC for this data
    const { computeCrc32: realCrc32 } = await import('./rom-manager.js');
    const crc32Spy = vi.spyOn(
      await import('./rom-manager.js'),
      'computeCrc32',
    );
    crc32Spy.mockReturnValue(0xC4F0F55F);

    const results = scanRomDirectory(tmpDir);
    expect(results.length).toBe(1);
    expect(results[0].path).toBe(romPath);
    expect(results[0].rom.model).toBe('A500');
    expect(results[0].rom.version).toBe('1.3');
    expect(results[0].wasEncrypted).toBe(false);

    crc32Spy.mockRestore();
  });

  it('handles overdumped 512KB ROM via second-half checksum', async () => {
    // Create a 512KB file
    const romPath = join(tmpDir, 'overdump.rom');
    const romData = Buffer.alloc(524288, 0);
    writeFileSync(romPath, romData);

    // First call (full 512KB) returns no match, second call (second 256KB half) matches A1200 KS3.1
    const crc32Spy = vi.spyOn(
      await import('./rom-manager.js'),
      'computeCrc32',
    );
    crc32Spy
      .mockReturnValueOnce(0x00000000) // full file -- no match
      .mockReturnValueOnce(0x1483A091); // second half -- A1200 KS3.1

    const results = scanRomDirectory(tmpDir);
    expect(results.length).toBe(1);
    expect(results[0].rom.model).toBe('A1200');
    expect(results[0].rom.version).toBe('3.1');

    crc32Spy.mockRestore();
  });

  it('returns empty array when no matching files', () => {
    // Create a 256KB file that won't match any CRC
    const romPath = join(tmpDir, 'unknown.rom');
    writeFileSync(romPath, Buffer.alloc(262144, 0xAA));

    const results = scanRomDirectory(tmpDir);
    expect(results.length).toBe(0);
  });

  it('detects Cloanto encrypted ROMs via rom.key presence', async () => {
    // Create rom.key and a ROM file
    const keyPath = join(tmpDir, 'rom.key');
    const romPath = join(tmpDir, 'amiga-os-310-a1200.rom');
    writeFileSync(keyPath, Buffer.from([0x01, 0x02, 0x03]));
    writeFileSync(romPath, Buffer.alloc(524288, 0));

    // Mock: after XOR decryption, CRC matches A1200 KS3.1
    const crc32Spy = vi.spyOn(
      await import('./rom-manager.js'),
      'computeCrc32',
    );
    crc32Spy.mockReturnValue(0x1483A091);

    const results = scanRomDirectory(tmpDir);
    expect(results.length).toBe(1);
    expect(results[0].wasEncrypted).toBe(true);

    crc32Spy.mockRestore();
  });

  it('skips files with wrong size (not 256KB or 512KB)', () => {
    writeFileSync(join(tmpDir, 'small.bin'), Buffer.alloc(100, 0));
    writeFileSync(join(tmpDir, 'big.bin'), Buffer.alloc(1048576, 0));

    const results = scanRomDirectory(tmpDir);
    expect(results.length).toBe(0);
  });

  it('does not scan nested subdirectories (single level only)', async () => {
    // ROM in subdirectory should NOT be found
    const subDir = join(tmpDir, 'nested');
    mkdirSync(subDir);
    writeFileSync(join(subDir, 'kick.rom'), Buffer.alloc(262144, 0));

    // Mock so any 256KB file would match if scanned
    const crc32Spy = vi.spyOn(
      await import('./rom-manager.js'),
      'computeCrc32',
    );
    crc32Spy.mockReturnValue(0xC4F0F55F);

    const results = scanRomDirectory(tmpDir);
    expect(results.length).toBe(0);

    crc32Spy.mockRestore();
  });

  it('returns multiple DetectedRom entries for multiple ROM files', async () => {
    // Two ROM files
    writeFileSync(join(tmpDir, 'kick13.rom'), Buffer.alloc(262144, 0));
    writeFileSync(join(tmpDir, 'kick31.rom'), Buffer.alloc(524288, 0));

    const crc32Spy = vi.spyOn(
      await import('./rom-manager.js'),
      'computeCrc32',
    );
    // First file: A500 KS1.3, second file: A1200 KS3.1
    crc32Spy
      .mockReturnValueOnce(0xC4F0F55F) // kick13.rom
      .mockReturnValueOnce(0x1483A091); // kick31.rom

    const results = scanRomDirectory(tmpDir);
    expect(results.length).toBe(2);

    const models = results.map((r) => r.rom.model).sort();
    expect(models).toEqual(['A1200', 'A500']);

    crc32Spy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// selectRomForProfile
// ---------------------------------------------------------------------------

describe('selectRomForProfile', () => {
  // Build test DetectedRom arrays
  const a500Rom: DetectedRom = {
    path: '/roms/kick13.rom',
    rom: {
      version: '1.3',
      revision: '34.005',
      model: 'A500',
      crc32: 0xC4F0F55F,
      sha1: null,
      size: 262144,
    },
    wasEncrypted: false,
  };

  const a1200Rom: DetectedRom = {
    path: '/roms/kick31-a1200.rom',
    rom: {
      version: '3.1',
      revision: '40.068',
      model: 'A1200',
      crc32: 0x1483A091,
      sha1: null,
      size: 524288,
    },
    wasEncrypted: false,
  };

  const a4000Rom: DetectedRom = {
    path: '/roms/kick31-a4000.rom',
    rom: {
      version: '3.1',
      revision: '40.068',
      model: 'A4000',
      crc32: 0xD6BAE334,
      sha1: null,
      size: 524288,
    },
    wasEncrypted: false,
  };

  const allRoms: DetectedRom[] = [a500Rom, a1200Rom, a4000Rom];

  it('selects A500 ROM for A500 profile', () => {
    const result = selectRomForProfile(allRoms, 'a500');
    expect(result).toBeDefined();
    expect(result!.rom.model).toBe('A500');
  });

  it('selects A1200 ROM for A1200 profile', () => {
    const result = selectRomForProfile([a1200Rom], 'a1200');
    expect(result).toBeDefined();
    expect(result!.rom.model).toBe('A1200');
  });

  it('selects A1200 ROM for WHDLoad profile', () => {
    const result = selectRomForProfile(allRoms, 'whdload');
    expect(result).toBeDefined();
    expect(result!.rom.model).toBe('A1200');
  });

  it('selects A4000 ROM for A4000 profile', () => {
    const result = selectRomForProfile(allRoms, 'a4000');
    expect(result).toBeDefined();
    expect(result!.rom.model).toBe('A4000');
  });

  it('returns undefined when no matching ROM exists', () => {
    // Only A1200 ROM, requesting A500
    const result = selectRomForProfile([a1200Rom], 'a500');
    expect(result).toBeUndefined();
  });

  it('does not use A1200 KS3.1 ROM for A4000 even though same version', () => {
    // Only A1200 ROM available, A4000 profile should NOT match
    const result = selectRomForProfile([a1200Rom], 'a4000');
    expect(result).toBeUndefined();
  });

  it('WHDLoad profile accepts A1200 ROMs (same KS requirements)', () => {
    // Only A1200 ROM, WHDLoad should still match
    const result = selectRomForProfile([a1200Rom], 'whdload');
    expect(result).toBeDefined();
    expect(result!.rom.model).toBe('A1200');
  });
});
