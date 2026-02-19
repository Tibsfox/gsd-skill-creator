/**
 * Tests for AmigaOS hunk executable format parser.
 *
 * Each test constructs a Uint8Array with exact hunk binary data and
 * verifies that parseHunkFile produces the expected structured output.
 * All values are big-endian, matching the Amiga 68000 architecture.
 */

import { parseHunkFile } from './hunk-parser.js';
import {
  HUNK_HEADER,
  HUNK_CODE,
  HUNK_DATA,
  HUNK_BSS,
  HUNK_RELOC32,
  HUNK_END,
} from './types.js';

// ============================================================================
// Helpers
// ============================================================================

/** Write a big-endian uint32 into a byte array at given offset. */
function writeU32(arr: number[], offset: number, value: number): void {
  arr[offset] = (value >>> 24) & 0xFF;
  arr[offset + 1] = (value >>> 16) & 0xFF;
  arr[offset + 2] = (value >>> 8) & 0xFF;
  arr[offset + 3] = value & 0xFF;
}

/**
 * Build a minimal valid hunk executable.
 *
 * Structure:
 * - HUNK_HEADER (0x3F3)
 * - String table: count=0 (empty)
 * - numHunks=1, firstHunk=0, lastHunk=0
 * - hunkSizes: [1] (1 longword)
 * - HUNK_CODE (0x3E9), size=1, data=0xDEADBEEF
 * - HUNK_END (0x3F2)
 */
function buildMinimalHunk(): Uint8Array {
  const bytes = new Array(10 * 4).fill(0);
  let off = 0;

  // HUNK_HEADER
  writeU32(bytes, off, HUNK_HEADER); off += 4;
  // String table: 0 entries (empty)
  writeU32(bytes, off, 0x00000000); off += 4;
  // numHunks
  writeU32(bytes, off, 1); off += 4;
  // firstHunk
  writeU32(bytes, off, 0); off += 4;
  // lastHunk
  writeU32(bytes, off, 0); off += 4;
  // hunkSizes[0] = 1 longword, no memory flags
  writeU32(bytes, off, 1); off += 4;

  // HUNK_CODE
  writeU32(bytes, off, HUNK_CODE); off += 4;
  // size = 1 longword
  writeU32(bytes, off, 1); off += 4;
  // data = 0xDEADBEEF
  writeU32(bytes, off, 0xDEADBEEF); off += 4;

  // HUNK_END
  writeU32(bytes, off, HUNK_END); off += 4;

  return new Uint8Array(bytes.slice(0, off));
}

// ============================================================================
// Tests
// ============================================================================

describe('parseHunkFile', () => {
  describe('minimal valid hunk file', () => {
    it('parses HUNK_HEADER magic and basic structure', () => {
      const data = buildMinimalHunk();
      const result = parseHunkFile(data);

      expect(result.magic).toBe(HUNK_HEADER);
      expect(result.numHunks).toBe(1);
      expect(result.firstHunk).toBe(0);
      expect(result.lastHunk).toBe(0);
      expect(result.hunkSizes).toEqual([1]);
      expect(result.hunkMemoryFlags).toEqual(['any']);
    });

    it('parses HUNK_CODE block with data', () => {
      const data = buildMinimalHunk();
      const result = parseHunkFile(data);

      expect(result.hunks.length).toBeGreaterThanOrEqual(1);
      const codeHunk = result.hunks.find(h => h.type === 'HUNK_CODE');
      expect(codeHunk).toBeDefined();
      expect(codeHunk!.type).toBe('HUNK_CODE');
      expect(codeHunk!.memoryFlag).toBe('any');
      // 1 longword = 4 bytes
      expect(codeHunk!.dataLength).toBe(4);
    });
  });

  // ==========================================================================
  // Memory flags
  // ==========================================================================

  describe('memory flags', () => {
    it('parses MEMF_CHIP flag (bit 30 set)', () => {
      const bytes = new Array(10 * 4).fill(0);
      let off = 0;

      writeU32(bytes, off, HUNK_HEADER); off += 4;
      writeU32(bytes, off, 0); off += 4; // empty string table
      writeU32(bytes, off, 1); off += 4; // numHunks
      writeU32(bytes, off, 0); off += 4; // firstHunk
      writeU32(bytes, off, 0); off += 4; // lastHunk
      // hunkSize with bit 30 set: 0x40000001 = chip memory, 1 longword
      writeU32(bytes, off, 0x40000001); off += 4;

      writeU32(bytes, off, HUNK_CODE); off += 4;
      writeU32(bytes, off, 1); off += 4;
      writeU32(bytes, off, 0xCAFEBABE); off += 4;
      writeU32(bytes, off, HUNK_END); off += 4;

      const result = parseHunkFile(new Uint8Array(bytes.slice(0, off)));
      expect(result.hunkMemoryFlags[0]).toBe('chip');
      expect(result.hunkSizes[0]).toBe(1);
    });

    it('parses MEMF_FAST flag (bit 31 set)', () => {
      const bytes = new Array(10 * 4).fill(0);
      let off = 0;

      writeU32(bytes, off, HUNK_HEADER); off += 4;
      writeU32(bytes, off, 0); off += 4;
      writeU32(bytes, off, 1); off += 4;
      writeU32(bytes, off, 0); off += 4;
      writeU32(bytes, off, 0); off += 4;
      // hunkSize with bit 31 set: 0x80000001 = fast memory, 1 longword
      writeU32(bytes, off, 0x80000001); off += 4;

      writeU32(bytes, off, HUNK_CODE); off += 4;
      writeU32(bytes, off, 1); off += 4;
      writeU32(bytes, off, 0x12345678); off += 4;
      writeU32(bytes, off, HUNK_END); off += 4;

      const result = parseHunkFile(new Uint8Array(bytes.slice(0, off)));
      expect(result.hunkMemoryFlags[0]).toBe('fast');
      expect(result.hunkSizes[0]).toBe(1);
    });

    it('parses flags==3 (both bits set) with extra dword consumed', () => {
      const bytes = new Array(12 * 4).fill(0);
      let off = 0;

      writeU32(bytes, off, HUNK_HEADER); off += 4;
      writeU32(bytes, off, 0); off += 4;
      writeU32(bytes, off, 1); off += 4;
      writeU32(bytes, off, 0); off += 4;
      writeU32(bytes, off, 0); off += 4;
      // hunkSize with bits 30+31 set: 0xC0000001 = chip_and_fast, 1 longword
      writeU32(bytes, off, 0xC0000001); off += 4;
      // Extra dword for extended memory attributes (must be consumed)
      writeU32(bytes, off, 0x00000002); off += 4;

      writeU32(bytes, off, HUNK_CODE); off += 4;
      writeU32(bytes, off, 1); off += 4;
      writeU32(bytes, off, 0xAABBCCDD); off += 4;
      writeU32(bytes, off, HUNK_END); off += 4;

      const result = parseHunkFile(new Uint8Array(bytes.slice(0, off)));
      expect(result.hunkMemoryFlags[0]).toBe('chip_and_fast');
      expect(result.hunkSizes[0]).toBe(1);
      // The extra dword must be consumed -- if not, the parser will misread
      // HUNK_CODE as the extra dword and break
      const codeHunk = result.hunks.find(h => h.type === 'HUNK_CODE');
      expect(codeHunk).toBeDefined();
      expect(codeHunk!.dataLength).toBe(4);
    });
  });

  // ==========================================================================
  // HUNK_RELOC32
  // ==========================================================================

  describe('HUNK_RELOC32', () => {
    it('parses relocation block with offset entries', () => {
      const bytes = new Array(20 * 4).fill(0);
      let off = 0;

      // Header
      writeU32(bytes, off, HUNK_HEADER); off += 4;
      writeU32(bytes, off, 0); off += 4;
      writeU32(bytes, off, 1); off += 4;
      writeU32(bytes, off, 0); off += 4;
      writeU32(bytes, off, 0); off += 4;
      writeU32(bytes, off, 2); off += 4; // 2 longwords code

      // HUNK_CODE with 2 longwords of data
      writeU32(bytes, off, HUNK_CODE); off += 4;
      writeU32(bytes, off, 2); off += 4;
      writeU32(bytes, off, 0x4EF90000); off += 4; // jsr abs.l
      writeU32(bytes, off, 0x00000000); off += 4; // address to relocate

      // HUNK_RELOC32: 2 offsets targeting hunk 0
      writeU32(bytes, off, HUNK_RELOC32); off += 4;
      writeU32(bytes, off, 2); off += 4; // count = 2
      writeU32(bytes, off, 0); off += 4; // target hunk = 0
      writeU32(bytes, off, 0); off += 4; // offset 0
      writeU32(bytes, off, 4); off += 4; // offset 4
      writeU32(bytes, off, 0); off += 4; // terminator (count=0)

      writeU32(bytes, off, HUNK_END); off += 4;

      const result = parseHunkFile(new Uint8Array(bytes.slice(0, off)));
      const reloc = result.hunks.find(h => h.type === 'HUNK_RELOC32');
      expect(reloc).toBeDefined();
      expect(reloc!.relocations).toBeDefined();
      expect(reloc!.relocations!.length).toBe(1);
      expect(reloc!.relocations![0].targetHunk).toBe(0);
      expect(reloc!.relocations![0].offsets).toEqual([0, 4]);
    });
  });

  // ==========================================================================
  // HUNK_BSS
  // ==========================================================================

  describe('HUNK_BSS', () => {
    it('parses BSS block (size only, no data payload)', () => {
      const bytes = new Array(10 * 4).fill(0);
      let off = 0;

      writeU32(bytes, off, HUNK_HEADER); off += 4;
      writeU32(bytes, off, 0); off += 4;
      writeU32(bytes, off, 1); off += 4;
      writeU32(bytes, off, 0); off += 4;
      writeU32(bytes, off, 0); off += 4;
      writeU32(bytes, off, 64); off += 4; // 64 longwords BSS

      // HUNK_BSS: just size, no data
      writeU32(bytes, off, HUNK_BSS); off += 4;
      writeU32(bytes, off, 64); off += 4; // 64 longwords = 256 bytes

      writeU32(bytes, off, HUNK_END); off += 4;

      const result = parseHunkFile(new Uint8Array(bytes.slice(0, off)));
      const bss = result.hunks.find(h => h.type === 'HUNK_BSS');
      expect(bss).toBeDefined();
      // BSS has no data payload, but reports size
      expect(bss!.dataLength).toBe(0);
    });
  });

  // ==========================================================================
  // Multi-hunk file
  // ==========================================================================

  describe('multi-hunk file', () => {
    it('parses file with 2 hunks (code + data)', () => {
      const bytes = new Array(30 * 4).fill(0);
      let off = 0;

      // Header with 2 hunks
      writeU32(bytes, off, HUNK_HEADER); off += 4;
      writeU32(bytes, off, 0); off += 4;
      writeU32(bytes, off, 2); off += 4; // numHunks = 2
      writeU32(bytes, off, 0); off += 4; // firstHunk
      writeU32(bytes, off, 1); off += 4; // lastHunk
      writeU32(bytes, off, 1); off += 4; // hunkSize[0] = 1 longword
      writeU32(bytes, off, 1); off += 4; // hunkSize[1] = 1 longword

      // Hunk 0: CODE
      writeU32(bytes, off, HUNK_CODE); off += 4;
      writeU32(bytes, off, 1); off += 4;
      writeU32(bytes, off, 0x4E750000); off += 4; // RTS
      writeU32(bytes, off, HUNK_END); off += 4;

      // Hunk 1: DATA
      writeU32(bytes, off, HUNK_DATA); off += 4;
      writeU32(bytes, off, 1); off += 4;
      writeU32(bytes, off, 0x48454C4C); off += 4; // "HELL"
      writeU32(bytes, off, HUNK_END); off += 4;

      const result = parseHunkFile(new Uint8Array(bytes.slice(0, off)));
      expect(result.numHunks).toBe(2);
      expect(result.hunkSizes).toEqual([1, 1]);

      const code = result.hunks.find(h => h.type === 'HUNK_CODE');
      const data = result.hunks.find(h => h.type === 'HUNK_DATA');
      expect(code).toBeDefined();
      expect(data).toBeDefined();
    });
  });

  // ==========================================================================
  // Error cases
  // ==========================================================================

  describe('error handling', () => {
    it('rejects non-hunk file (wrong magic)', () => {
      const bytes = new Array(4).fill(0);
      writeU32(bytes, 0, 0xDEADBEEF);

      expect(() => parseHunkFile(new Uint8Array(bytes))).toThrow(/magic/i);
    });

    it('rejects truncated file (header present, data cut short)', () => {
      // Header starts but numHunks etc. are missing
      const bytes = new Array(2 * 4).fill(0);
      writeU32(bytes, 0, HUNK_HEADER);
      writeU32(bytes, 4, 0); // string table empty

      // Missing numHunks, firstHunk, lastHunk, hunkSizes
      expect(() => parseHunkFile(new Uint8Array(bytes))).toThrow();
    });

    it('handles ArrayBuffer input as well as Uint8Array', () => {
      const data = buildMinimalHunk();
      const result = parseHunkFile(data.buffer);
      expect(result.magic).toBe(HUNK_HEADER);
    });
  });
});
