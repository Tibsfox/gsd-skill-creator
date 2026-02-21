/**
 * Tests for AmigaBinaryReader -- big-endian DataView wrapper.
 *
 * Verifies that the reader correctly interprets bytes in big-endian
 * (Motorola) byte order, matching the Amiga's 68000 architecture.
 */

import { describe, it, expect } from 'vitest';
import { AmigaBinaryReader } from './binary-reader.js';

// ============================================================================
// Helpers
// ============================================================================

/** Create a reader from raw byte values. */
function readerFrom(...bytes: number[]): AmigaBinaryReader {
  return new AmigaBinaryReader(new Uint8Array(bytes));
}

// ============================================================================
// Construction
// ============================================================================

describe('AmigaBinaryReader', () => {
  describe('construction', () => {
    it('constructs from ArrayBuffer with correct length and position', () => {
      const buf = new ArrayBuffer(16);
      const reader = new AmigaBinaryReader(buf);
      expect(reader.length).toBe(16);
      expect(reader.position).toBe(0);
    });

    it('constructs from Uint8Array with correct length and position', () => {
      const arr = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
      const reader = new AmigaBinaryReader(arr);
      expect(reader.length).toBe(4);
      expect(reader.position).toBe(0);
    });

    it('handles Uint8Array with byteOffset correctly', () => {
      const buf = new ArrayBuffer(8);
      const view = new Uint8Array(buf);
      view[4] = 0xAB;
      view[5] = 0xCD;
      // Create a sub-view starting at offset 4
      const sub = new Uint8Array(buf, 4, 2);
      const reader = new AmigaBinaryReader(sub);
      expect(reader.length).toBe(2);
      expect(reader.readUint8()).toBe(0xAB);
      expect(reader.readUint8()).toBe(0xCD);
    });
  });

  // ==========================================================================
  // Reading integers
  // ==========================================================================

  describe('readUint8', () => {
    it('returns correct byte and advances position by 1', () => {
      const reader = readerFrom(0xFF, 0x42);
      expect(reader.readUint8()).toBe(0xFF);
      expect(reader.position).toBe(1);
      expect(reader.readUint8()).toBe(0x42);
      expect(reader.position).toBe(2);
    });
  });

  describe('readUint16', () => {
    it('reads big-endian 16-bit value', () => {
      // Big-endian: 0x01 0x02 -> 0x0102 (258), NOT 0x0201 (513)
      const reader = readerFrom(0x01, 0x02);
      expect(reader.readUint16()).toBe(0x0102);
      expect(reader.position).toBe(2);
    });

    it('reads 0xFFFF correctly', () => {
      const reader = readerFrom(0xFF, 0xFF);
      expect(reader.readUint16()).toBe(0xFFFF);
    });
  });

  describe('readUint32', () => {
    it('reads big-endian 32-bit value', () => {
      // HUNK_HEADER magic: 0x000003F3
      const reader = readerFrom(0x00, 0x00, 0x03, 0xF3);
      expect(reader.readUint32()).toBe(0x000003F3);
      expect(reader.position).toBe(4);
    });

    it('reads high bit values correctly (no sign extension)', () => {
      // 0xC0000001 -- both memory flag bits set + size 1
      const reader = readerFrom(0xC0, 0x00, 0x00, 0x01);
      expect(reader.readUint32()).toBe(0xC0000001 >>> 0);
      expect(reader.position).toBe(4);
    });
  });

  // ==========================================================================
  // readBytes
  // ==========================================================================

  describe('readBytes', () => {
    it('returns Uint8Array slice and advances position', () => {
      const reader = readerFrom(0x10, 0x20, 0x30, 0x40, 0x50);
      const bytes = reader.readBytes(3);
      expect(bytes).toEqual(new Uint8Array([0x10, 0x20, 0x30]));
      expect(reader.position).toBe(3);
    });

    it('returns empty Uint8Array for zero length', () => {
      const reader = readerFrom(0x01);
      const bytes = reader.readBytes(0);
      expect(bytes.length).toBe(0);
      expect(reader.position).toBe(0);
    });
  });

  // ==========================================================================
  // peek
  // ==========================================================================

  describe('peek', () => {
    it('reads uint32 without advancing position', () => {
      const reader = readerFrom(0x00, 0x00, 0x03, 0xF3, 0xFF);
      const value = reader.peek();
      expect(value).toBe(0x000003F3);
      expect(reader.position).toBe(0);
    });
  });

  // ==========================================================================
  // Navigation
  // ==========================================================================

  describe('skip', () => {
    it('advances position by n bytes', () => {
      const reader = readerFrom(0x01, 0x02, 0x03, 0x04);
      reader.skip(2);
      expect(reader.position).toBe(2);
      expect(reader.readUint8()).toBe(0x03);
    });
  });

  describe('seek', () => {
    it('sets absolute position', () => {
      const reader = readerFrom(0x01, 0x02, 0x03, 0x04);
      reader.seek(3);
      expect(reader.position).toBe(3);
      expect(reader.readUint8()).toBe(0x04);
    });
  });

  describe('remaining', () => {
    it('returns bytes left to read', () => {
      const reader = readerFrom(0x01, 0x02, 0x03, 0x04);
      expect(reader.remaining).toBe(4);
      reader.readUint8();
      expect(reader.remaining).toBe(3);
      reader.readUint16();
      expect(reader.remaining).toBe(1);
    });
  });

  // ==========================================================================
  // Bounds checking
  // ==========================================================================

  describe('bounds checking', () => {
    it('throws RangeError when reading past end (readUint8)', () => {
      const reader = readerFrom(0x01);
      reader.readUint8();
      expect(() => reader.readUint8()).toThrow(RangeError);
    });

    it('throws RangeError when reading past end (readUint16)', () => {
      const reader = readerFrom(0x01);
      expect(() => reader.readUint16()).toThrow(RangeError);
    });

    it('throws RangeError when reading past end (readUint32)', () => {
      const reader = readerFrom(0x01, 0x02, 0x03);
      expect(() => reader.readUint32()).toThrow(RangeError);
    });

    it('throws RangeError when readBytes exceeds remaining', () => {
      const reader = readerFrom(0x01, 0x02);
      expect(() => reader.readBytes(3)).toThrow(RangeError);
    });

    it('throws RangeError on seek past end', () => {
      const reader = readerFrom(0x01, 0x02);
      expect(() => reader.seek(3)).toThrow(RangeError);
    });

    it('throws RangeError on seek to negative position', () => {
      const reader = readerFrom(0x01, 0x02);
      expect(() => reader.seek(-1)).toThrow(RangeError);
    });

    it('throws RangeError on skip past end', () => {
      const reader = readerFrom(0x01, 0x02);
      expect(() => reader.skip(3)).toThrow(RangeError);
    });

    it('includes position info in error message', () => {
      const reader = readerFrom(0x01);
      reader.readUint8();
      try {
        reader.readUint8();
        expect.unreachable('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(RangeError);
        expect((e as RangeError).message).toMatch(/position/i);
      }
    });
  });
});
