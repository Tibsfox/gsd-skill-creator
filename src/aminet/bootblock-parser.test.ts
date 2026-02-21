/**
 * Boot block parser tests.
 *
 * Tests cover: OFS/FFS identification, checksum validation, bootcode detection,
 * trackdisk.device pattern, Exec library call pattern, resident install pattern,
 * vector modification pattern, short buffers, and non-DOS disks.
 */

import { describe, it, expect } from 'vitest';
import { parseBootBlock } from './bootblock-parser.js';
import type { BootBlock } from './types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a 1024-byte boot block buffer with DOS magic and optional payload.
 * Checksum field at offset 4 is left as 0 initially -- call computeChecksum
 * to fill it in if a valid checksum is desired.
 */
function makeBootBlock(dosBytes: [number, number, number, number]): Uint8Array {
  const buf = new Uint8Array(1024);
  buf[0] = dosBytes[0]; // 'D'
  buf[1] = dosBytes[1]; // 'O'
  buf[2] = dosBytes[2]; // 'S'
  buf[3] = dosBytes[3]; // variant byte
  return buf;
}

/**
 * Write a big-endian uint32 at the given byte offset.
 */
function writeUint32(buf: Uint8Array, offset: number, value: number): void {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  view.setUint32(offset, value >>> 0, false); // big-endian
}

/**
 * Read a big-endian uint32 at the given byte offset.
 */
function readUint32(buf: Uint8Array, offset: number): number {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  return view.getUint32(offset, false);
}

/**
 * Compute the Amiga boot block checksum and write it at offset 4.
 *
 * Algorithm: sum all 256 longwords (treating checksum field at offset 4 as 0),
 * using unsigned 32-bit addition with carry. The checksum value is the ones'
 * complement (~sum) so that when the checksum field is included in the sum,
 * the total equals 0xFFFFFFFF.
 */
function computeAndWriteChecksum(buf: Uint8Array): void {
  // Zero the checksum field first
  writeUint32(buf, 4, 0);

  let sum = 0;
  for (let i = 0; i < 256; i++) {
    const longword = readUint32(buf, i * 4);
    const newSum = sum + longword;
    // Unsigned 32-bit addition with carry
    if (newSum > 0xFFFFFFFF) {
      sum = (newSum & 0xFFFFFFFF) + 1; // wrap carry
    } else {
      sum = newSum;
    }
  }
  // Ones' complement
  const checksum = (~sum) >>> 0;
  writeUint32(buf, 4, checksum);
}

/**
 * Write an ASCII string into a buffer at the given offset.
 */
function writeASCII(buf: Uint8Array, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    buf[offset + i] = str.charCodeAt(i);
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('parseBootBlock', () => {
  it('parses a standard OFS boot block with valid checksum', () => {
    const buf = makeBootBlock([0x44, 0x4F, 0x53, 0x00]); // DOS\0
    // Root block pointer at offset 8
    writeUint32(buf, 8, 880); // standard root block for DD floppy
    computeAndWriteChecksum(buf);

    const result = parseBootBlock(buf);

    expect(result.dosType).toBe('OFS');
    expect(result.isValid).toBe(true);
    expect(result.rootBlock).toBe(880);
    expect(result.bootcodePresent).toBe(false);
    expect(result.suspectFlags).toEqual([]);
  });

  it('parses an FFS boot block', () => {
    const buf = makeBootBlock([0x44, 0x4F, 0x53, 0x01]); // DOS\1
    computeAndWriteChecksum(buf);

    const result = parseBootBlock(buf);

    expect(result.dosType).toBe('FFS');
    expect(result.isValid).toBe(true);
  });

  it('parses OFS_INTL (DOS\\2)', () => {
    const buf = makeBootBlock([0x44, 0x4F, 0x53, 0x02]);
    computeAndWriteChecksum(buf);

    const result = parseBootBlock(buf);
    expect(result.dosType).toBe('OFS_INTL');
  });

  it('parses FFS_INTL (DOS\\3)', () => {
    const buf = makeBootBlock([0x44, 0x4F, 0x53, 0x03]);
    computeAndWriteChecksum(buf);

    const result = parseBootBlock(buf);
    expect(result.dosType).toBe('FFS_INTL');
  });

  it('parses OFS_DC (DOS\\4)', () => {
    const buf = makeBootBlock([0x44, 0x4F, 0x53, 0x04]);
    computeAndWriteChecksum(buf);

    const result = parseBootBlock(buf);
    expect(result.dosType).toBe('OFS_DC');
  });

  it('parses FFS_DC (DOS\\5)', () => {
    const buf = makeBootBlock([0x44, 0x4F, 0x53, 0x05]);
    computeAndWriteChecksum(buf);

    const result = parseBootBlock(buf);
    expect(result.dosType).toBe('FFS_DC');
  });

  it('detects custom bootcode when non-zero bytes after offset 12', () => {
    const buf = makeBootBlock([0x44, 0x4F, 0x53, 0x00]);
    // Write some non-zero bytes in boot code area
    buf[20] = 0x4E; // NOP opcode
    buf[21] = 0x71;
    buf[22] = 0x4E;
    buf[23] = 0x75; // RTS opcode
    computeAndWriteChecksum(buf);

    const result = parseBootBlock(buf);

    expect(result.bootcodePresent).toBe(true);
    expect(result.bootcodeLength).toBeGreaterThan(0);
    expect(result.suspectFlags).toContain('custom_bootcode');
  });

  it('detects trackdisk.device pattern', () => {
    const buf = makeBootBlock([0x44, 0x4F, 0x53, 0x00]);
    // Embed "trackdisk.device" string in boot code area
    writeASCII(buf, 100, 'trackdisk.device');
    computeAndWriteChecksum(buf);

    const result = parseBootBlock(buf);

    expect(result.suspectFlags).toContain('trackdisk_access');
    expect(result.suspectFlags).toContain('custom_bootcode');
  });

  it('detects exec library call pattern (movea.l 4.w,a6)', () => {
    const buf = makeBootBlock([0x44, 0x4F, 0x53, 0x00]);
    // Write 68000 opcode: movea.l 4.w,a6 = 0x2C78 0x0004
    buf[40] = 0x2C;
    buf[41] = 0x78;
    buf[42] = 0x00;
    buf[43] = 0x04;
    computeAndWriteChecksum(buf);

    const result = parseBootBlock(buf);

    expect(result.suspectFlags).toContain('exec_library_call');
    expect(result.suspectFlags).toContain('custom_bootcode');
  });

  it('detects resident install pattern (RTC_MATCHWORD 0x4AFC)', () => {
    const buf = makeBootBlock([0x44, 0x4F, 0x53, 0x00]);
    // Write RTC_MATCHWORD
    buf[80] = 0x4A;
    buf[81] = 0xFC;
    computeAndWriteChecksum(buf);

    const result = parseBootBlock(buf);

    expect(result.suspectFlags).toContain('resident_install');
    expect(result.suspectFlags).toContain('custom_bootcode');
  });

  it('detects vector modification pattern (write to trap vectors)', () => {
    const buf = makeBootBlock([0x44, 0x4F, 0x53, 0x00]);
    // Write 68000 opcode: move.l XX,$6C (write to trap vector)
    // move.l d0,$6C = 0x23C0 0000 006C
    buf[50] = 0x23;
    buf[51] = 0xC0;
    buf[52] = 0x00;
    buf[53] = 0x00;
    buf[54] = 0x00;
    buf[55] = 0x6C;
    computeAndWriteChecksum(buf);

    const result = parseBootBlock(buf);

    expect(result.suspectFlags).toContain('vector_modification');
    expect(result.suspectFlags).toContain('custom_bootcode');
  });

  it('handles short buffer (less than 1024 bytes)', () => {
    // Only 512 bytes -- still parses what's available
    const buf = new Uint8Array(512);
    buf[0] = 0x44; // D
    buf[1] = 0x4F; // O
    buf[2] = 0x53; // S
    buf[3] = 0x00; // \0

    const result = parseBootBlock(buf);

    expect(result.dosType).toBe('OFS');
    // Short buffer: checksum computation uses available data
    expect(result.bootcodeOffset).toBe(12);
  });

  it('handles non-DOS disk (no DOS magic)', () => {
    const buf = new Uint8Array(1024);
    // No DOS magic -- just zeros or random data
    buf[0] = 0x00;
    buf[1] = 0x00;
    buf[2] = 0x00;
    buf[3] = 0x00;

    const result = parseBootBlock(buf);

    expect(result.dosType).toBe('UNKNOWN');
    expect(result.isValid).toBe(false);
  });

  it('verifies boot block checksum correctly', () => {
    const buf = makeBootBlock([0x44, 0x4F, 0x53, 0x00]);
    writeUint32(buf, 8, 880);
    // Write some boot code
    buf[20] = 0x60; // BRA instruction
    buf[21] = 0xFE;
    computeAndWriteChecksum(buf);

    const result = parseBootBlock(buf);
    expect(result.isValid).toBe(true);

    // Now corrupt the checksum
    const corruptBuf = new Uint8Array(buf);
    writeUint32(corruptBuf, 4, 0xDEADBEEF);

    const corruptResult = parseBootBlock(corruptBuf);
    expect(corruptResult.isValid).toBe(false);
  });

  it('returns correct bootcodeOffset and bootcodeLength', () => {
    const buf = makeBootBlock([0x44, 0x4F, 0x53, 0x00]);
    // Fill bytes 100-199 with non-zero values
    for (let i = 100; i < 200; i++) {
      buf[i] = 0xFF;
    }
    computeAndWriteChecksum(buf);

    const result = parseBootBlock(buf);

    expect(result.bootcodePresent).toBe(true);
    expect(result.bootcodeOffset).toBe(12);
    // bootcodeLength should reflect the range of non-zero data
    expect(result.bootcodeLength).toBeGreaterThan(0);
  });

  it('accepts ArrayBuffer input', () => {
    const buf = makeBootBlock([0x44, 0x4F, 0x53, 0x01]); // FFS
    computeAndWriteChecksum(buf);

    // Pass the underlying ArrayBuffer, not the Uint8Array
    const result = parseBootBlock(buf.buffer as ArrayBuffer);

    expect(result.dosType).toBe('FFS');
    expect(result.isValid).toBe(true);
  });

  it('detects multiple suspect flags simultaneously', () => {
    const buf = makeBootBlock([0x44, 0x4F, 0x53, 0x00]);
    // trackdisk.device
    writeASCII(buf, 100, 'trackdisk.device');
    // exec library call
    buf[200] = 0x2C;
    buf[201] = 0x78;
    buf[202] = 0x00;
    buf[203] = 0x04;
    // RTC_MATCHWORD
    buf[300] = 0x4A;
    buf[301] = 0xFC;
    computeAndWriteChecksum(buf);

    const result = parseBootBlock(buf);

    expect(result.suspectFlags).toContain('custom_bootcode');
    expect(result.suspectFlags).toContain('trackdisk_access');
    expect(result.suspectFlags).toContain('exec_library_call');
    expect(result.suspectFlags).toContain('resident_install');
  });

  it('handles very short buffer (less than 4 bytes)', () => {
    const buf = new Uint8Array(2); // Too short even for DOS magic

    const result = parseBootBlock(buf);

    expect(result.dosType).toBe('UNKNOWN');
    expect(result.isValid).toBe(false);
    expect(result.bootcodePresent).toBe(false);
  });
});
