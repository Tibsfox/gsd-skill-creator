/**
 * Aminet Zod schemas and TypeScript types.
 *
 * Shared type definitions for the Aminet Archive Extension Pack.
 * This file is the single source of truth for all Aminet data shapes.
 * Other modules in src/aminet/ import from here.
 */

import { z } from 'zod';

// ============================================================================
// AminetMirrorConfigSchema
// ============================================================================

/**
 * Configuration for fetching the Aminet INDEX from HTTP mirrors.
 *
 * `mirrors` is an ordered list of base URLs -- the fetcher tries each in
 * sequence until one succeeds. `cacheDir` is where the decompressed INDEX
 * and its metadata JSON are persisted between runs.
 */
export const AminetMirrorConfigSchema = z.object({
  mirrors: z.array(z.string().url()).default(['https://aminet.net']),
  userAgent: z.string().default('GSD-Aminet-Pack/1.0'),
  timeoutMs: z.number().int().positive().default(30000),
  cacheDir: z.string(),
});

export type AminetMirrorConfig = z.infer<typeof AminetMirrorConfigSchema>;

// ============================================================================
// IndexMetadataSchema
// ============================================================================

/**
 * Metadata written alongside the cached INDEX file. Records which mirror
 * was used, when the fetch happened, and basic content stats for staleness
 * checks and diagnostics.
 */
export const IndexMetadataSchema = z.object({
  fetchedAt: z.string(), // ISO 8601
  mirror: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  lineCount: z.number().int().nonnegative(),
  encoding: z.literal('iso-8859-1'),
});

export type IndexMetadata = z.infer<typeof IndexMetadataSchema>;

// ============================================================================
// PackageReadmeSchema
// ============================================================================

/**
 * Schema for parsed Aminet .readme file content.
 *
 * Every Aminet package includes a .readme with structured header fields
 * (Short, Author, Uploader, Type, Version, Requires, Architecture)
 * followed by a free-form description body.
 *
 * Only the Short field is required; all others are optional.
 */
export const PackageReadmeSchema = z.object({
  /** One-line description from Short: field (required) */
  short: z.string(),
  /** Author: field, may include email in parentheses */
  author: z.string().nullable(),
  /** Uploader: field, may include email */
  uploader: z.string().nullable(),
  /** Type: field, e.g., "mus/edit", "dev/c", "text/guide" */
  type: z.string().nullable(),
  /** Version: field, e.g., "3.62b" */
  version: z.string().nullable(),
  /** Requires: field split into individual items (e.g., ["OS 3.0+", "68020+", "AGA"]) */
  requires: z.array(z.string()),
  /** Architecture: field split into items (e.g., ["m68k-amigaos", "ppc-amigaos"]) */
  architecture: z.array(z.string()),
  /** Free-form description body after the header section */
  description: z.string(),
  /** All header fields as key-value pairs for extensibility */
  rawHeader: z.record(z.string(), z.string()),
});

/** TypeScript type inferred from PackageReadmeSchema */
export type PackageReadme = z.infer<typeof PackageReadmeSchema>;

// ============================================================================
// Hunk type numeric constants
// ============================================================================

/** HUNK_UNIT -- start of a unit (object file) */
export const HUNK_UNIT = 0x000003E7;

/** HUNK_NAME -- hunk name */
export const HUNK_NAME = 0x000003E8;

/** HUNK_CODE -- executable code segment */
export const HUNK_CODE = 0x000003E9;

/** HUNK_DATA -- initialized data segment */
export const HUNK_DATA = 0x000003EA;

/** HUNK_BSS -- uninitialized data (zero-filled) segment */
export const HUNK_BSS = 0x000003EB;

/** HUNK_RELOC32 -- 32-bit relocation table */
export const HUNK_RELOC32 = 0x000003EC;

/** HUNK_RELOC16 -- 16-bit PC-relative relocation */
export const HUNK_RELOC16 = 0x000003ED;

/** HUNK_RELOC8 -- 8-bit PC-relative relocation */
export const HUNK_RELOC8 = 0x000003EE;

/** HUNK_EXT -- external symbol definitions/references */
export const HUNK_EXT = 0x000003EF;

/** HUNK_SYMBOL -- symbol table */
export const HUNK_SYMBOL = 0x000003F0;

/** HUNK_DEBUG -- debug information */
export const HUNK_DEBUG = 0x000003F1;

/** HUNK_END -- end of hunk */
export const HUNK_END = 0x000003F2;

/** HUNK_HEADER -- executable file header (magic number) */
export const HUNK_HEADER = 0x000003F3;

/** HUNK_OVERLAY -- overlay structure */
export const HUNK_OVERLAY = 0x000003F5;

/** HUNK_BREAK -- end of overlay */
export const HUNK_BREAK = 0x000003F7;

/** HUNK_DREL32 -- 32-bit data-relative relocation (short format) */
export const HUNK_DREL32 = 0x000003F8;

/** HUNK_DREL16 -- 16-bit data-relative relocation */
export const HUNK_DREL16 = 0x000003F9;

/** HUNK_DREL8 -- 8-bit data-relative relocation */
export const HUNK_DREL8 = 0x000003FA;

/** HUNK_LIB -- start of a library */
export const HUNK_LIB = 0x000003FB;

/** HUNK_INDEX -- library index */
export const HUNK_INDEX = 0x000003FC;

/** HUNK_RELOC32SHORT -- 32-bit relocation (short/compact format) */
export const HUNK_RELOC32SHORT = 0x000003FC;

/** HUNK_ABSRELOC16 -- absolute 16-bit relocation */
export const HUNK_ABSRELOC16 = 0x000003FD;

// ============================================================================
// Memory flag schema
// ============================================================================

/**
 * Memory allocation flags from hunk size upper 2 bits.
 *
 * - any: no preference (flags=0)
 * - fast: MEMF_FAST, bit 31 set (flags=1)
 * - chip: MEMF_CHIP, bit 30 set (flags=2)
 * - chip_and_fast: both bits set (flags=3), extra dword follows
 */
export const MemoryFlagSchema = z.enum(['any', 'chip', 'fast', 'chip_and_fast']);

export type MemoryFlag = z.infer<typeof MemoryFlagSchema>;

// ============================================================================
// Hunk type schema
// ============================================================================

/**
 * Hunk type string identifiers matching the AmigaOS specification.
 */
export const HunkTypeSchema = z.enum([
  'HUNK_UNIT',
  'HUNK_NAME',
  'HUNK_CODE',
  'HUNK_DATA',
  'HUNK_BSS',
  'HUNK_RELOC32',
  'HUNK_RELOC16',
  'HUNK_RELOC8',
  'HUNK_EXT',
  'HUNK_SYMBOL',
  'HUNK_DEBUG',
  'HUNK_END',
  'HUNK_HEADER',
  'HUNK_OVERLAY',
  'HUNK_BREAK',
  'HUNK_DREL32',
  'HUNK_DREL16',
  'HUNK_DREL8',
  'HUNK_LIB',
  'HUNK_INDEX',
  'HUNK_RELOC32SHORT',
  'HUNK_ABSRELOC16',
]);

export type HunkType = z.infer<typeof HunkTypeSchema>;

/**
 * Map from numeric hunk type value to string identifier.
 */
export const HUNK_TYPE_MAP: Record<number, HunkType> = {
  [HUNK_UNIT]: 'HUNK_UNIT',
  [HUNK_NAME]: 'HUNK_NAME',
  [HUNK_CODE]: 'HUNK_CODE',
  [HUNK_DATA]: 'HUNK_DATA',
  [HUNK_BSS]: 'HUNK_BSS',
  [HUNK_RELOC32]: 'HUNK_RELOC32',
  [HUNK_RELOC16]: 'HUNK_RELOC16',
  [HUNK_RELOC8]: 'HUNK_RELOC8',
  [HUNK_EXT]: 'HUNK_EXT',
  [HUNK_SYMBOL]: 'HUNK_SYMBOL',
  [HUNK_DEBUG]: 'HUNK_DEBUG',
  [HUNK_END]: 'HUNK_END',
  [HUNK_HEADER]: 'HUNK_HEADER',
  [HUNK_OVERLAY]: 'HUNK_OVERLAY',
  [HUNK_BREAK]: 'HUNK_BREAK',
  [HUNK_DREL32]: 'HUNK_DREL32',
  [HUNK_DREL16]: 'HUNK_DREL16',
  [HUNK_DREL8]: 'HUNK_DREL8',
  // HUNK_LIB and HUNK_INDEX share 0x3FC with HUNK_RELOC32SHORT
  // In executable context, 0x3FC is HUNK_RELOC32SHORT
  [HUNK_RELOC32SHORT]: 'HUNK_RELOC32SHORT',
  [HUNK_ABSRELOC16]: 'HUNK_ABSRELOC16',
};

// ============================================================================
// Hunk block schemas
// ============================================================================

/**
 * A relocation entry: offsets within the hunk targeting another hunk.
 */
export const RelocationEntrySchema = z.object({
  /** Target hunk number */
  targetHunk: z.number(),
  /** Offsets within this hunk to relocate */
  offsets: z.array(z.number()),
});

export type RelocationEntry = z.infer<typeof RelocationEntrySchema>;

/**
 * A symbol entry from HUNK_SYMBOL.
 */
export const SymbolEntrySchema = z.object({
  /** Symbol name */
  name: z.string(),
  /** Symbol value (offset within hunk) */
  value: z.number(),
});

export type SymbolEntry = z.infer<typeof SymbolEntrySchema>;

/**
 * A single parsed hunk block.
 */
export const HunkBlockSchema = z.object({
  /** Hunk type identifier */
  type: HunkTypeSchema,
  /** Memory allocation flag */
  memoryFlag: MemoryFlagSchema,
  /** Byte offset of data payload within the original buffer */
  dataOffset: z.number(),
  /** Length of data payload in bytes */
  dataLength: z.number(),
  /** Relocation entries (present for RELOC32, RELOC32SHORT, etc.) */
  relocations: z.array(RelocationEntrySchema).optional(),
  /** Symbol entries (present for HUNK_SYMBOL) */
  symbols: z.array(SymbolEntrySchema).optional(),
});

export type HunkBlock = z.infer<typeof HunkBlockSchema>;

/**
 * A fully parsed AmigaOS hunk executable file.
 */
export const HunkFileSchema = z.object({
  /** Magic number -- always 0x000003F3 (HUNK_HEADER) */
  magic: z.literal(HUNK_HEADER),
  /** Total number of hunks */
  numHunks: z.number(),
  /** First hunk index (usually 0) */
  firstHunk: z.number(),
  /** Last hunk index (usually numHunks - 1) */
  lastHunk: z.number(),
  /** Sizes of each hunk in longwords (with memory flags extracted) */
  hunkSizes: z.array(z.number()),
  /** Memory flags per hunk */
  hunkMemoryFlags: z.array(MemoryFlagSchema),
  /** Parsed hunk blocks */
  hunks: z.array(HunkBlockSchema),
});

export type HunkFile = z.infer<typeof HunkFileSchema>;
