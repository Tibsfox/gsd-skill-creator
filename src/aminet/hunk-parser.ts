/**
 * AmigaOS hunk executable format parser.
 *
 * Parses the standard Amiga hunk executable format used by all AmigaOS
 * executables and libraries. The format is a sequence of typed hunks
 * (CODE, DATA, BSS, RELOC32, SYMBOL, DEBUG, etc.) preceded by a header
 * containing hunk sizes and memory allocation flags.
 *
 * Key format details:
 * - All values are big-endian uint32 (Motorola 68000 byte order)
 * - Sizes are in longwords (4 bytes each)
 * - Memory flags are encoded in the upper 2 bits of hunk sizes
 * - When both MEMF_CHIP and MEMF_FAST are set (flags==3), an extra
 *   dword of extended memory attributes follows the hunk size
 *
 * Reference: "The AmigaDOS Manual" (Commodore, 3rd edition)
 */

import { AmigaBinaryReader } from './binary-reader.js';
import type { HunkFile, HunkBlock, HunkType, MemoryFlag, RelocationEntry, SymbolEntry } from './types.js';
import {
  HUNK_HEADER,
  HUNK_CODE,
  HUNK_DATA,
  HUNK_BSS,
  HUNK_RELOC32,
  HUNK_SYMBOL,
  HUNK_DEBUG,
  HUNK_END,
  HUNK_OVERLAY,
  HUNK_BREAK,
  HUNK_DREL32,
  HUNK_RELOC32SHORT,
  HUNK_ABSRELOC16,
  HUNK_TYPE_MAP,
} from './types.js';

// ============================================================================
// Memory flag extraction
// ============================================================================

/** Map upper 2-bit flag value to MemoryFlag string. */
const MEMORY_FLAG_MAP: Record<number, MemoryFlag> = {
  0: 'any',
  1: 'chip',  // bit 30 only = MEMF_CHIP
  2: 'fast',  // bit 31 only = MEMF_FAST
  3: 'chip_and_fast',
};

/**
 * Extract memory flags from a raw hunk size dword.
 *
 * The upper 2 bits encode MEMF_FAST (bit 31) and MEMF_CHIP (bit 30).
 * The lower 30 bits encode the actual size in longwords.
 *
 * @returns [size in longwords, memory flag string]
 */
function extractMemoryFlags(raw: number): [number, MemoryFlag] {
  const flags = (raw >>> 30) & 0x3;
  const size = raw & 0x3FFFFFFF;
  return [size, MEMORY_FLAG_MAP[flags] ?? 'any'];
}

// ============================================================================
// Hunk type helpers
// ============================================================================

/**
 * Resolve a raw hunk type uint32 to a HunkType string.
 * Masks off the upper 2 bits which are advisory flags.
 */
function resolveHunkType(raw: number): HunkType | undefined {
  const masked = raw & 0x3FFFFFFF;
  return HUNK_TYPE_MAP[masked];
}

// ============================================================================
// Relocation parser
// ============================================================================

/**
 * Parse HUNK_RELOC32 entries.
 *
 * Format: repeating groups of [count, targetHunk, offset...] terminated
 * by count==0.
 */
function parseReloc32(reader: AmigaBinaryReader): RelocationEntry[] {
  const entries: RelocationEntry[] = [];

  while (reader.remaining >= 4) {
    const count = reader.readUint32();
    if (count === 0) break;

    const targetHunk = reader.readUint32();
    const offsets: number[] = [];
    for (let i = 0; i < count; i++) {
      offsets.push(reader.readUint32());
    }
    entries.push({ targetHunk, offsets });
  }

  return entries;
}

// ============================================================================
// Symbol parser
// ============================================================================

/**
 * Parse HUNK_SYMBOL entries.
 *
 * Format: repeating [nameLength, name..., value] terminated by nameLength==0.
 * Name length is in longwords; name is padded to longword boundary.
 */
function parseSymbols(reader: AmigaBinaryReader): SymbolEntry[] {
  const entries: SymbolEntry[] = [];

  while (reader.remaining >= 4) {
    const nameLen = reader.readUint32();
    if (nameLen === 0) break;

    // Name is nameLen longwords (nameLen * 4 bytes), null-padded
    const nameBytes = reader.readBytes(nameLen * 4);
    // Trim trailing nulls
    let end = nameBytes.length;
    while (end > 0 && nameBytes[end - 1] === 0) end--;
    const name = new TextDecoder('ascii').decode(nameBytes.subarray(0, end));

    const value = reader.readUint32();
    entries.push({ name, value });
  }

  return entries;
}

// ============================================================================
// Main parser
// ============================================================================

/**
 * Parse an AmigaOS hunk executable file.
 *
 * @param data - Raw binary data as ArrayBuffer or Uint8Array
 * @returns Parsed HunkFile structure
 * @throws Error on invalid magic number
 * @throws RangeError on truncated data
 */
export function parseHunkFile(data: ArrayBuffer | Uint8Array): HunkFile {
  const reader = new AmigaBinaryReader(data);

  // ---- Magic ----
  const magic = reader.readUint32();
  if (magic !== HUNK_HEADER) {
    throw new Error(
      `Invalid hunk magic: expected 0x${HUNK_HEADER.toString(16).padStart(8, '0')}, ` +
      `got 0x${magic.toString(16).padStart(8, '0')}`
    );
  }

  // ---- String table (resident library names) ----
  // Read count of name strings. Usually 0 (empty).
  // Each name is preceded by its length in longwords.
  while (true) {
    const nameLen = reader.readUint32();
    if (nameLen === 0) break;
    // Skip the name data (nameLen longwords = nameLen * 4 bytes)
    reader.skip(nameLen * 4);
  }

  // ---- Hunk table ----
  const numHunks = reader.readUint32();
  const firstHunk = reader.readUint32();
  const lastHunk = reader.readUint32();

  // Read hunk sizes with memory flag extraction
  const hunkSizes: number[] = [];
  const hunkMemoryFlags: MemoryFlag[] = [];

  for (let i = 0; i < numHunks; i++) {
    const raw = reader.readUint32();
    const [size, memFlag] = extractMemoryFlags(raw);
    hunkSizes.push(size);
    hunkMemoryFlags.push(memFlag);

    // When flags==3 (both MEMF_CHIP and MEMF_FAST), read extra dword
    const flags = (raw >>> 30) & 0x3;
    if (flags === 3) {
      reader.readUint32(); // extended memory attributes -- consume and discard
    }
  }

  // ---- Parse hunk blocks ----
  const hunks: HunkBlock[] = [];
  let currentHunkIndex = 0;

  while (reader.remaining >= 4) {
    const rawType = reader.readUint32();
    const maskedType = rawType & 0x3FFFFFFF;
    const typeName = resolveHunkType(rawType);

    if (typeName === undefined) {
      // Unknown hunk type: try to skip gracefully
      if (reader.remaining >= 4) {
        const skipSize = reader.readUint32();
        if (reader.remaining >= skipSize * 4) {
          reader.skip(skipSize * 4);
        }
      }
      continue;
    }

    const memFlag: MemoryFlag = currentHunkIndex < hunkMemoryFlags.length
      ? hunkMemoryFlags[currentHunkIndex]
      : 'any';

    switch (maskedType) {
      case HUNK_CODE:
      case HUNK_DATA: {
        const size = reader.readUint32(); // size in longwords
        const dataOffset = reader.position;
        const dataLength = size * 4;
        if (dataLength > 0) {
          reader.skip(dataLength);
        }
        hunks.push({
          type: typeName,
          memoryFlag: memFlag,
          dataOffset,
          dataLength,
        });
        break;
      }

      case HUNK_BSS: {
        const size = reader.readUint32(); // size in longwords (no payload)
        hunks.push({
          type: 'HUNK_BSS',
          memoryFlag: memFlag,
          dataOffset: reader.position,
          dataLength: 0, // BSS has no data payload
        });
        break;
      }

      case HUNK_RELOC32: {
        const startOffset = reader.position;
        const relocations = parseReloc32(reader);
        hunks.push({
          type: 'HUNK_RELOC32',
          memoryFlag: memFlag,
          dataOffset: startOffset,
          dataLength: reader.position - startOffset,
          relocations,
        });
        break;
      }

      case HUNK_SYMBOL: {
        const startOffset = reader.position;
        const symbols = parseSymbols(reader);
        hunks.push({
          type: 'HUNK_SYMBOL',
          memoryFlag: memFlag,
          dataOffset: startOffset,
          dataLength: reader.position - startOffset,
          symbols,
        });
        break;
      }

      case HUNK_DEBUG: {
        const size = reader.readUint32();
        const dataOffset = reader.position;
        const dataLength = size * 4;
        if (dataLength > 0) {
          reader.skip(dataLength);
        }
        hunks.push({
          type: 'HUNK_DEBUG',
          memoryFlag: memFlag,
          dataOffset,
          dataLength,
        });
        break;
      }

      case HUNK_END: {
        hunks.push({
          type: 'HUNK_END',
          memoryFlag: 'any',
          dataOffset: reader.position,
          dataLength: 0,
        });
        currentHunkIndex++;
        break;
      }

      case HUNK_OVERLAY: {
        // Overlay: read table size, skip table data
        const tableSize = reader.readUint32();
        const dataOffset = reader.position;
        // Overlay table is (tableSize + 1) longwords
        const dataLength = (tableSize + 1) * 4;
        if (dataLength > 0 && reader.remaining >= dataLength) {
          reader.skip(dataLength);
        }
        hunks.push({
          type: 'HUNK_OVERLAY',
          memoryFlag: 'any',
          dataOffset,
          dataLength,
        });
        break;
      }

      case HUNK_BREAK: {
        hunks.push({
          type: 'HUNK_BREAK',
          memoryFlag: 'any',
          dataOffset: reader.position,
          dataLength: 0,
        });
        break;
      }

      case HUNK_DREL32:
      case HUNK_RELOC32SHORT:
      case HUNK_ABSRELOC16: {
        // Short relocation formats use 16-bit offsets
        const startOffset = reader.position;
        const relocations = parseReloc32(reader);
        hunks.push({
          type: typeName,
          memoryFlag: memFlag,
          dataOffset: startOffset,
          dataLength: reader.position - startOffset,
          relocations,
        });
        break;
      }

      default: {
        // Fallthrough for any other recognized but unhandled types
        // Try size + skip pattern
        if (reader.remaining >= 4) {
          const size = reader.readUint32();
          const dataOffset = reader.position;
          const dataLength = size * 4;
          if (dataLength > 0 && reader.remaining >= dataLength) {
            reader.skip(dataLength);
          }
          hunks.push({
            type: typeName,
            memoryFlag: memFlag,
            dataOffset,
            dataLength,
          });
        }
        break;
      }
    }
  }

  return {
    magic: HUNK_HEADER,
    numHunks,
    firstHunk,
    lastHunk,
    hunkSizes,
    hunkMemoryFlags,
    hunks,
  };
}
