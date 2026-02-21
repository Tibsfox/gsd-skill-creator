import { describe, it, expect } from 'vitest';
import type { VirusSignature } from './types.js';
import { hexToBytes, isBootBlock, isHunkFile, scanBuffer } from './signature-scanner.js';

// ============================================================================
// hexToBytes
// ============================================================================

describe('hexToBytes', () => {
  it('converts "48656C6C6F" to [0x48, 0x65, 0x6C, 0x6C, 0x6F]', () => {
    const result = hexToBytes('48656C6C6F');
    expect(result).toEqual(new Uint8Array([0x48, 0x65, 0x6C, 0x6C, 0x6F]));
  });

  it('throws on odd-length hex string', () => {
    expect(() => hexToBytes('0000003F3')).toThrow();
  });

  it('returns empty Uint8Array for empty string', () => {
    const result = hexToBytes('');
    expect(result).toEqual(new Uint8Array([]));
  });

  it('handles case-insensitive hex', () => {
    const result = hexToBytes('ff00FF00');
    expect(result).toEqual(new Uint8Array([0xFF, 0x00, 0xFF, 0x00]));
  });
});

// ============================================================================
// isBootBlock
// ============================================================================

describe('isBootBlock', () => {
  it('recognizes DOS\\0 magic with >= 1024 bytes', () => {
    const buf = new Uint8Array(1024);
    buf[0] = 0x44; // D
    buf[1] = 0x4F; // O
    buf[2] = 0x53; // S
    buf[3] = 0x00; // \0
    expect(isBootBlock(buf)).toBe(true);
  });

  it('recognizes DOS\\1 magic (FFS)', () => {
    const buf = new Uint8Array(1024);
    buf[0] = 0x44;
    buf[1] = 0x4F;
    buf[2] = 0x53;
    buf[3] = 0x01;
    expect(isBootBlock(buf)).toBe(true);
  });

  it('rejects buffer starting with random bytes', () => {
    const buf = new Uint8Array(1024);
    buf[0] = 0x12;
    buf[1] = 0x34;
    buf[2] = 0x56;
    buf[3] = 0x78;
    expect(isBootBlock(buf)).toBe(false);
  });

  it('rejects buffer shorter than 4 bytes', () => {
    const buf = new Uint8Array(3);
    expect(isBootBlock(buf)).toBe(false);
  });
});

// ============================================================================
// isHunkFile
// ============================================================================

describe('isHunkFile', () => {
  it('recognizes HUNK_HEADER magic (0x000003F3)', () => {
    const buf = new Uint8Array(100);
    buf[0] = 0x00;
    buf[1] = 0x00;
    buf[2] = 0x03;
    buf[3] = 0xF3;
    expect(isHunkFile(buf)).toBe(true);
  });

  it('rejects buffer starting with DOS\\0', () => {
    const buf = new Uint8Array(100);
    buf[0] = 0x44;
    buf[1] = 0x4F;
    buf[2] = 0x53;
    buf[3] = 0x00;
    expect(isHunkFile(buf)).toBe(false);
  });

  it('rejects buffer starting with random bytes', () => {
    const buf = new Uint8Array(100);
    buf[0] = 0xAB;
    buf[1] = 0xCD;
    buf[2] = 0xEF;
    buf[3] = 0x01;
    expect(isHunkFile(buf)).toBe(false);
  });

  it('rejects buffer shorter than 4 bytes', () => {
    const buf = new Uint8Array(3);
    expect(isHunkFile(buf)).toBe(false);
  });
});

// ============================================================================
// scanBuffer
// ============================================================================

describe('scanBuffer', () => {
  // Helper: build a boot block buffer with DOS\0 magic
  function makeBootBlock(size = 1024): Uint8Array {
    const buf = new Uint8Array(size);
    buf[0] = 0x44; // D
    buf[1] = 0x4F; // O
    buf[2] = 0x53; // S
    buf[3] = 0x00; // \0
    return buf;
  }

  // Helper: build a hunk file buffer with HUNK_HEADER magic
  function makeHunkFile(size = 512): Uint8Array {
    const buf = new Uint8Array(size);
    buf[0] = 0x00;
    buf[1] = 0x00;
    buf[2] = 0x03;
    buf[3] = 0xF3;
    return buf;
  }

  // Inline SCA bootblock signature
  const scaSig: VirusSignature = {
    name: 'SCA',
    type: 'bootblock',
    severity: 'high',
    patterns: [
      {
        // "Something wonderful" in ASCII hex
        bytes: '536F6D657468696E6720776F6E64657266756C',
        offset: 'any',
      },
    ],
    description: 'SCA bootblock virus',
    references: [],
  };

  // Inline file virus signature
  const fileVirusSig: VirusSignature = {
    name: 'TestFileVirus',
    type: 'file',
    severity: 'medium',
    patterns: [
      {
        bytes: 'DEADBEEF',
        offset: 'any',
      },
    ],
    description: 'Test file virus signature',
    references: [],
  };

  // Inline link virus signature
  const linkVirusSig: VirusSignature = {
    name: 'TestLinkVirus',
    type: 'link',
    severity: 'low',
    patterns: [
      {
        bytes: 'CAFEBABE',
        offset: 'any',
      },
    ],
    description: 'Test link virus signature',
    references: [],
  };

  it('detects SCA virus in bootblock buffer', () => {
    const buf = makeBootBlock(1024);
    // Write "Something wonderful" at offset 100
    const text = new TextEncoder().encode('Something wonderful');
    buf.set(text, 100);

    const matches = scanBuffer(buf, [scaSig]);
    expect(matches).toHaveLength(1);
    expect(matches[0].signatureName).toBe('SCA');
    expect(matches[0].matchOffset).toBe(100);
    expect(matches[0].signatureType).toBe('bootblock');
    expect(matches[0].severity).toBe('high');
    expect(matches[0].patternIndex).toBe(0);
  });

  it('skips bootblock signatures on hunk file data', () => {
    const buf = makeHunkFile(1024);
    // Write the SCA pattern into a hunk file -- should NOT match
    const text = new TextEncoder().encode('Something wonderful');
    buf.set(text, 100);

    const matches = scanBuffer(buf, [scaSig]);
    expect(matches).toHaveLength(0);
  });

  it('skips file signatures on bootblock data', () => {
    const buf = makeBootBlock(1024);
    // Embed file virus pattern in bootblock
    buf[50] = 0xDE;
    buf[51] = 0xAD;
    buf[52] = 0xBE;
    buf[53] = 0xEF;

    const matches = scanBuffer(buf, [fileVirusSig]);
    expect(matches).toHaveLength(0);
  });

  it('detects file virus in hunk file buffer', () => {
    const buf = makeHunkFile(512);
    // Embed pattern at offset 50
    buf[50] = 0xDE;
    buf[51] = 0xAD;
    buf[52] = 0xBE;
    buf[53] = 0xEF;

    const matches = scanBuffer(buf, [fileVirusSig]);
    expect(matches).toHaveLength(1);
    expect(matches[0].signatureName).toBe('TestFileVirus');
    expect(matches[0].matchOffset).toBe(50);
    expect(matches[0].patternIndex).toBe(0);
  });

  it('matches fixed-offset pattern at correct position', () => {
    const fixedSig: VirusSignature = {
      name: 'FixedOffset',
      type: 'bootblock',
      severity: 'medium',
      patterns: [{ bytes: 'AABBCCDD', offset: 100 }],
      description: 'Fixed offset test',
      references: [],
    };

    const buf = makeBootBlock(1024);
    // Place pattern at offset 100 (correct position)
    buf[100] = 0xAA;
    buf[101] = 0xBB;
    buf[102] = 0xCC;
    buf[103] = 0xDD;

    const matches = scanBuffer(buf, [fixedSig]);
    expect(matches).toHaveLength(1);
    expect(matches[0].matchOffset).toBe(100);
  });

  it('rejects fixed-offset pattern at wrong position', () => {
    const fixedSig: VirusSignature = {
      name: 'FixedOffset',
      type: 'bootblock',
      severity: 'medium',
      patterns: [{ bytes: 'AABBCCDD', offset: 100 }],
      description: 'Fixed offset test',
      references: [],
    };

    const buf = makeBootBlock(1024);
    // Place pattern at offset 50 (wrong position)
    buf[50] = 0xAA;
    buf[51] = 0xBB;
    buf[52] = 0xCC;
    buf[53] = 0xDD;

    const matches = scanBuffer(buf, [fixedSig]);
    expect(matches).toHaveLength(0);
  });

  it('supports wildcard mask for partial byte matching', () => {
    const maskedSig: VirusSignature = {
      name: 'MaskedVirus',
      type: 'bootblock',
      severity: 'low',
      patterns: [
        {
          bytes: 'FF00FF',
          mask: 'FF00FF',
          offset: 'any',
        },
      ],
      description: 'Mask test: middle byte is wildcard',
      references: [],
    };

    const buf = makeBootBlock(1024);
    // Place FF XX FF where XX can be anything
    buf[200] = 0xFF;
    buf[201] = 0x42; // wildcard -- any value should match
    buf[202] = 0xFF;

    const matches = scanBuffer(buf, [maskedSig]);
    expect(matches).toHaveLength(1);
    expect(matches[0].signatureName).toBe('MaskedVirus');
    expect(matches[0].matchOffset).toBe(200);
  });

  it('detects multiple signatures in one buffer', () => {
    const buf = makeHunkFile(512);
    // Embed two different patterns
    buf[50] = 0xDE;
    buf[51] = 0xAD;
    buf[52] = 0xBE;
    buf[53] = 0xEF;

    buf[200] = 0xCA;
    buf[201] = 0xFE;
    buf[202] = 0xBA;
    buf[203] = 0xBE;

    const matches = scanBuffer(buf, [fileVirusSig, linkVirusSig]);
    expect(matches).toHaveLength(2);
    const names = matches.map((m) => m.signatureName).sort();
    expect(names).toEqual(['TestFileVirus', 'TestLinkVirus']);
  });

  it('returns empty array for clean zero-filled buffer', () => {
    const buf = makeBootBlock(1024);
    // DOS magic is set, but all other bytes are zero -- no virus patterns
    const matches = scanBuffer(buf, [scaSig, fileVirusSig, linkVirusSig]);
    expect(matches).toHaveLength(0);
  });

  it('completes scan of 500KB buffer against 50 signatures in <2 seconds', () => {
    // Generate 500KB of random data with hunk header
    const buf = makeHunkFile(500 * 1024);
    for (let i = 4; i < buf.length; i++) {
      buf[i] = Math.floor(Math.random() * 256);
    }

    // Generate 50 file-type signatures with random 8-byte patterns
    const sigs: VirusSignature[] = [];
    for (let i = 0; i < 50; i++) {
      const bytes = Array.from({ length: 8 }, () =>
        Math.floor(Math.random() * 256).toString(16).padStart(2, '0'),
      ).join('');
      sigs.push({
        name: `PerfSig${i}`,
        type: 'file',
        severity: 'medium',
        patterns: [{ bytes, offset: 'any' }],
        description: `Perf test signature ${i}`,
        references: [],
      });
    }

    const start = performance.now();
    scanBuffer(buf, sigs);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(2000);
  });
});
