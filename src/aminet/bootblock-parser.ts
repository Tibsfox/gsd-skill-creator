/**
 * Boot block parser for Amiga floppy disk images.
 *
 * Reads the first 1024 bytes of an ADF (Amiga Disk File) and identifies:
 * - DOS filesystem type (OFS, FFS, international, directory cache variants)
 * - Boot block checksum validity
 * - Root block pointer
 * - Boot code presence and suspect pattern flags
 *
 * Suspect patterns detected:
 * - trackdisk_access: ASCII "trackdisk.device" in boot code (direct disk I/O)
 * - custom_bootcode: any non-zero bytes in boot code area (offsets 12-1023)
 * - exec_library_call: movea.l 4.w,a6 opcode (0x2C78 0x0004)
 * - resident_install: RTC_MATCHWORD (0x4AFC)
 * - vector_modification: move.l to trap vectors ($6C, $70, $74, $78)
 *
 * Used by: Phase 239 virus scanner for heuristic boot block virus detection.
 */

import { AmigaBinaryReader } from './binary-reader.js';
import type { BootBlock, BootBlockFlag, DosType } from './types.js';

/** Boot block total size in bytes (2 sectors x 512 bytes). */
const BOOT_BLOCK_SIZE = 1024;

/** Boot code area starts at byte offset 12 (after magic + checksum + rootBlock). */
const BOOTCODE_START = 12;

/** DOS magic bytes: 'D', 'O', 'S' */
const DOS_MAGIC = [0x44, 0x4F, 0x53];

/** Map from DOS variant byte to DosType. */
const DOS_VARIANT_MAP: Record<number, DosType> = {
  0x00: 'OFS',
  0x01: 'FFS',
  0x02: 'OFS_INTL',
  0x03: 'FFS_INTL',
  0x04: 'OFS_DC',
  0x05: 'FFS_DC',
};

/**
 * ASCII bytes of "trackdisk.device" for pattern matching.
 */
const TRACKDISK_BYTES = Array.from('trackdisk.device').map((c) =>
  c.charCodeAt(0)
);

/**
 * Trap vector addresses in low memory that viruses commonly modify.
 * $6C = Level 2 interrupt autovector
 * $70 = Level 3 interrupt autovector
 * $74 = Level 4 interrupt autovector
 * $78 = Level 5 interrupt autovector
 */
const TRAP_VECTORS = [0x6c, 0x70, 0x74, 0x78];

/**
 * Parse the boot block from the first 1024 bytes of an Amiga disk image.
 *
 * Accepts buffers shorter than 1024 bytes (parses what is available).
 * Non-DOS disks (no magic at offset 0) return dosType='UNKNOWN', isValid=false.
 *
 * @param data - Raw disk image data (ArrayBuffer or Uint8Array)
 * @returns Parsed BootBlock structure
 */
export function parseBootBlock(data: ArrayBuffer | Uint8Array): BootBlock {
  const bytes =
    data instanceof Uint8Array ? data : new Uint8Array(data);
  const len = bytes.length;

  // Default result for degenerate cases
  const emptyResult: BootBlock = {
    dosType: 'UNKNOWN',
    isValid: false,
    checksum: 0,
    rootBlock: 0,
    bootcodePresent: false,
    bootcodeOffset: BOOTCODE_START,
    bootcodeLength: 0,
    suspectFlags: [],
  };

  // Need at least 4 bytes for DOS magic
  if (len < 4) {
    return emptyResult;
  }

  const reader = new AmigaBinaryReader(bytes);

  // --- Read DOS magic (4 bytes) ---
  const b0 = reader.readUint8();
  const b1 = reader.readUint8();
  const b2 = reader.readUint8();
  const b3 = reader.readUint8();

  const hasDOSMagic =
    b0 === DOS_MAGIC[0] && b1 === DOS_MAGIC[1] && b2 === DOS_MAGIC[2];

  const dosType: DosType = hasDOSMagic
    ? DOS_VARIANT_MAP[b3] ?? 'UNKNOWN'
    : 'UNKNOWN';

  if (!hasDOSMagic) {
    return emptyResult;
  }

  // --- Read checksum (offset 4, uint32) ---
  let storedChecksum = 0;
  if (len >= 8) {
    storedChecksum = reader.readUint32();
  }

  // --- Read root block pointer (offset 8, uint32) ---
  let rootBlock = 0;
  if (len >= 12) {
    rootBlock = reader.readUint32();
  }

  // --- Compute checksum validity ---
  const isValid = verifyChecksum(bytes);

  // --- Scan boot code area for patterns ---
  const codeEnd = Math.min(len, BOOT_BLOCK_SIZE);
  const suspectFlags: BootBlockFlag[] = [];

  // Determine boot code presence and length
  let bootcodePresent = false;
  let bootcodeLength = 0;

  if (codeEnd > BOOTCODE_START) {
    // Find the last non-zero byte in the boot code area
    let lastNonZero = -1;
    for (let i = codeEnd - 1; i >= BOOTCODE_START; i--) {
      if (bytes[i] !== 0) {
        lastNonZero = i;
        break;
      }
    }

    if (lastNonZero >= BOOTCODE_START) {
      bootcodePresent = true;
      bootcodeLength = lastNonZero - BOOTCODE_START + 1;
      suspectFlags.push('custom_bootcode');
    }
  }

  // Only scan for patterns if there is boot code
  if (bootcodePresent) {
    // --- trackdisk.device ---
    if (findBytes(bytes, BOOTCODE_START, codeEnd, TRACKDISK_BYTES)) {
      suspectFlags.push('trackdisk_access');
    }

    // --- exec_library_call: movea.l 4.w,a6 = 0x2C 0x78 0x00 0x04 ---
    if (findBytes(bytes, BOOTCODE_START, codeEnd, [0x2c, 0x78, 0x00, 0x04])) {
      suspectFlags.push('exec_library_call');
    }

    // --- resident_install: RTC_MATCHWORD = 0x4A 0xFC ---
    if (findBytes(bytes, BOOTCODE_START, codeEnd, [0x4a, 0xfc])) {
      suspectFlags.push('resident_install');
    }

    // --- vector_modification: move.l XX, $xxxx ---
    // Pattern: 0x23C0 followed by 0x0000 then one of the trap vector addresses
    // move.l d0,$XXXX = 23C0 0000 00XX
    // We also check for move.l aN,$XXXX variants (23C8-23CF)
    if (detectVectorModification(bytes, BOOTCODE_START, codeEnd)) {
      suspectFlags.push('vector_modification');
    }
  }

  return {
    dosType,
    isValid,
    checksum: storedChecksum,
    rootBlock,
    bootcodePresent,
    bootcodeOffset: BOOTCODE_START,
    bootcodeLength,
    suspectFlags,
  };
}

/**
 * Verify the Amiga boot block checksum.
 *
 * Algorithm: sum all longwords (up to 256) treating the checksum field
 * (offset 4) as zero. Use unsigned 32-bit addition with carry wrapping.
 * The stored checksum should be the ones' complement of the sum so that
 * including it makes the total 0xFFFFFFFF.
 */
function verifyChecksum(bytes: Uint8Array): boolean {
  const len = bytes.length;
  if (len < 8) return false; // Need at least magic + checksum

  const view = new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength
  );

  const numLongwords = Math.min(Math.floor(len / 4), 256);
  let sum = 0;

  for (let i = 0; i < numLongwords; i++) {
    // Skip checksum field at offset 4 (longword index 1)
    if (i === 1) continue;

    const longword = view.getUint32(i * 4, false); // big-endian
    const newSum = sum + longword;

    // Unsigned 32-bit addition with carry
    if (newSum > 0xffffffff) {
      sum = (newSum & 0xffffffff) + 1;
    } else {
      sum = newSum;
    }
  }

  // The stored checksum should be ~sum (ones' complement)
  const storedChecksum = view.getUint32(4, false);
  const expectedChecksum = (~sum) >>> 0;

  return storedChecksum === expectedChecksum;
}

/**
 * Search for a byte pattern within a range of a buffer.
 */
function findBytes(
  buf: Uint8Array,
  start: number,
  end: number,
  pattern: number[]
): boolean {
  const patLen = pattern.length;
  const searchEnd = end - patLen;

  for (let i = start; i <= searchEnd; i++) {
    let found = true;
    for (let j = 0; j < patLen; j++) {
      if (buf[i + j] !== pattern[j]) {
        found = false;
        break;
      }
    }
    if (found) return true;
  }
  return false;
}

/**
 * Detect writes to low memory trap/interrupt vectors.
 *
 * Looks for 68000 move.l patterns that write to addresses $6C, $70, $74, $78:
 * - move.l Dn,$XXXX: opcode 0x23C0-0x23C7 followed by 0x0000 00XX
 * - move.l An,$XXXX: opcode 0x23C8-0x23CF followed by 0x0000 00XX
 */
function detectVectorModification(
  buf: Uint8Array,
  start: number,
  end: number
): boolean {
  // Need at least 6 bytes for the instruction
  const searchEnd = end - 5;

  for (let i = start; i <= searchEnd; i++) {
    // Check for move.l Rn,$XXXX.L (opcode 0x23C0-0x23CF)
    if (buf[i] === 0x23 && buf[i + 1] >= 0xc0 && buf[i + 1] <= 0xcf) {
      // Next 4 bytes are the absolute address
      if (buf[i + 2] === 0x00 && buf[i + 3] === 0x00) {
        const addr = (buf[i + 4] << 8) | buf[i + 5];
        if (TRAP_VECTORS.includes(addr)) {
          return true;
        }
      }
    }
  }
  return false;
}
