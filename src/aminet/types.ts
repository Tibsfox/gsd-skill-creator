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

// ============================================================================
// Boot block schemas
// ============================================================================

/**
 * AmigaOS filesystem type identified from the DOS magic bytes.
 *
 * DOS\0 = OFS (Original File System)
 * DOS\1 = FFS (Fast File System)
 * DOS\2 = OFS with international characters
 * DOS\3 = FFS with international characters
 * DOS\4 = OFS with directory cache
 * DOS\5 = FFS with directory cache
 * UNKNOWN = no recognized DOS magic
 */
export const DosTypeSchema = z.enum([
  'OFS',
  'FFS',
  'OFS_INTL',
  'FFS_INTL',
  'OFS_DC',
  'FFS_DC',
  'UNKNOWN',
]);

export type DosType = z.infer<typeof DosTypeSchema>;

/**
 * Suspect pattern flags detected in boot block code area.
 *
 * These indicate behaviors commonly associated with boot block viruses:
 * - trackdisk_access: references to "trackdisk.device" (direct disk I/O)
 * - custom_bootcode: non-zero bytes in boot code area (offsets 12-1023)
 * - vector_modification: writes to trap/interrupt vectors in low memory
 * - resident_install: RTC_MATCHWORD (0x4AFC) for resident module installation
 * - exec_library_call: movea.l 4.w,a6 opcode pattern (Exec library base access)
 */
export const BootBlockFlagSchema = z.enum([
  'trackdisk_access',
  'custom_bootcode',
  'vector_modification',
  'resident_install',
  'exec_library_call',
]);

export type BootBlockFlag = z.infer<typeof BootBlockFlagSchema>;

/**
 * Parsed boot block from the first 1024 bytes of an Amiga disk image.
 */
export const BootBlockSchema = z.object({
  /** Filesystem type identified from DOS magic bytes */
  dosType: DosTypeSchema,
  /** Whether the boot block checksum is valid */
  isValid: z.boolean(),
  /** Stored checksum value from offset 4 */
  checksum: z.number(),
  /** Root block pointer from offset 8 */
  rootBlock: z.number(),
  /** Whether non-zero boot code is present after offset 12 */
  bootcodePresent: z.boolean(),
  /** Start offset of boot code area (always 12 if present) */
  bootcodeOffset: z.number(),
  /** Length of non-zero boot code in bytes */
  bootcodeLength: z.number(),
  /** Suspect pattern flags detected in boot code */
  suspectFlags: z.array(BootBlockFlagSchema),
  /** Raw first 1024 bytes (optional, for downstream analysis) */
  raw: z.instanceof(Uint8Array).optional(),
});

export type BootBlock = z.infer<typeof BootBlockSchema>;

// ============================================================================
// AminetPackageSchema
// ============================================================================

/**
 * A single package entry parsed from the Aminet INDEX fixed-width file.
 *
 * Each line in the INDEX represents one package with filename, directory
 * path (category/subcategory), size, age in days, and a short description.
 */
export const AminetPackageSchema = z.object({
  /** Archive filename (e.g., "ProTracker36.lha") */
  filename: z.string(),
  /** Full Aminet directory path (e.g., "mus/edit") */
  directory: z.string(),
  /** Top-level category (e.g., "mus") */
  category: z.string(),
  /** Subcategory within the category (e.g., "edit") */
  subcategory: z.string(),
  /** Size in kilobytes */
  sizeKb: z.number(),
  /** Age in days since upload */
  ageDays: z.number().int().nonnegative(),
  /** One-line package description */
  description: z.string(),
  /** Full path: directory/filename (e.g., "mus/edit/ProTracker36.lha") */
  fullPath: z.string(),
});

export type AminetPackage = z.infer<typeof AminetPackageSchema>;

// ============================================================================
// AminetIndexSchema
// ============================================================================

/**
 * The complete parsed Aminet INDEX, including all packages, error stats,
 * and the timestamp when parsing occurred. This is the shape written to
 * the INDEX.json cache file for offline querying.
 */
export const AminetIndexSchema = z.object({
  /** All successfully parsed package entries */
  packages: z.array(AminetPackageSchema),
  /** Number of lines that could not be parsed (lenient mode) */
  parseErrors: z.number().int().nonnegative(),
  /** Total number of lines in the raw INDEX content */
  totalLines: z.number().int().nonnegative(),
  /** ISO 8601 timestamp of when parsing was performed */
  parsedAt: z.string(),
});

export type AminetIndex = z.infer<typeof AminetIndexSchema>;

// ============================================================================
// FreshnessCheckSchema
// ============================================================================

/**
 * Result of an INDEX freshness check.
 *
 * Encodes how stale the cached INDEX is and what the recommended update
 * strategy should be:
 * - 'current': cache is fresh, no action needed
 * - 'stale_incremental': cache is old but usable, fetch RECENT to update
 * - 'stale_full': no cache exists, full INDEX download required
 */
export const FreshnessCheckSchema = z.object({
  /** Whether the cached INDEX is considered stale */
  isStale: z.boolean(),
  /** Milliseconds since the INDEX was fetched */
  ageMs: z.number(),
  /** Human-readable age in hours */
  ageHours: z.number(),
  /** ISO 8601 timestamp of when the INDEX was fetched */
  cachedAt: z.string(),
  /** Recommended update strategy */
  recommendation: z.enum(['current', 'stale_incremental', 'stale_full']),
});

export type FreshnessCheck = z.infer<typeof FreshnessCheckSchema>;

// ============================================================================
// PackageStatusSchema
// ============================================================================

/**
 * Per-package lifecycle status in the mirror system.
 *
 * Tracks a package from initial discovery through download, scanning,
 * and installation. The 7 states form a linear lifecycle:
 *   not-mirrored -> downloading -> mirrored -> scan-pending ->
 *   clean | infected -> installed
 */
export const PackageStatusSchema = z.enum([
  'not-mirrored',
  'downloading',
  'mirrored',
  'scan-pending',
  'clean',
  'infected',
  'installed',
]);

export type PackageStatus = z.infer<typeof PackageStatusSchema>;

// ============================================================================
// MirrorEntrySchema
// ============================================================================

/**
 * Per-package state entry in the mirror.
 *
 * Tracks the download status, integrity hash, local file path, and
 * timestamps for a single Aminet package in the local mirror.
 */
export const MirrorEntrySchema = z.object({
  /** Full Aminet path (e.g., "mus/edit/ProTracker36.lha") */
  fullPath: z.string(),
  /** Current lifecycle status */
  status: PackageStatusSchema,
  /** Package size in kilobytes (from INDEX) */
  sizeKb: z.number(),
  /** SHA-256 hash of downloaded file, null if not yet computed */
  sha256: z.string().nullable().default(null),
  /** Local filesystem path to the downloaded file, null if not mirrored */
  localPath: z.string().nullable().default(null),
  /** ISO 8601 timestamp of when the file was downloaded, null if not mirrored */
  downloadedAt: z.string().nullable().default(null),
  /** ISO 8601 timestamp of last integrity/status check, null if never checked */
  lastChecked: z.string().nullable().default(null),
});

export type MirrorEntry = z.infer<typeof MirrorEntrySchema>;

// ============================================================================
// MirrorStateSchema
// ============================================================================

/**
 * The full .mirror-state.json shape persisted to disk.
 *
 * Contains all per-package entries, a last-updated timestamp, and a
 * version field for future schema migration.
 */
export const MirrorStateSchema = z.object({
  /** Map from fullPath to MirrorEntry */
  entries: z.record(z.string(), MirrorEntrySchema),
  /** ISO 8601 timestamp of last state modification */
  lastUpdated: z.string(),
  /** Schema version -- always 1 for now */
  version: z.literal(1),
});

export type MirrorState = z.infer<typeof MirrorStateSchema>;

// ============================================================================
// DownloadConfigSchema
// ============================================================================

/**
 * Configuration for the download engine.
 *
 * Extends AminetMirrorConfigSchema with download-specific settings:
 * delay between requests, concurrency limit, and local mirror directory.
 */
export const DownloadConfigSchema = AminetMirrorConfigSchema.extend({
  /** Milliseconds to wait between consecutive downloads (rate limiting) */
  delayMs: z.number().int().nonnegative().default(500),
  /** Maximum number of concurrent downloads */
  concurrency: z.number().int().min(1).default(2),
  /** Local directory for storing mirrored packages */
  mirrorDir: z.string(),
});

export type DownloadConfig = z.infer<typeof DownloadConfigSchema>;

// ============================================================================
// Category browser schemas
// ============================================================================

/**
 * A subcategory node in the Aminet category tree.
 *
 * Represents a single subcategory (e.g., "shoot" under "game") with
 * its full directory path and the count of packages it contains.
 */
export const SubcategoryNodeSchema = z.object({
  /** Subcategory name (e.g., "shoot") */
  name: z.string(),
  /** Full directory path (e.g., "game/shoot") */
  path: z.string(),
  /** Number of packages in this subcategory */
  packageCount: z.number().int().nonnegative(),
});

export type SubcategoryNode = z.infer<typeof SubcategoryNodeSchema>;

/**
 * A top-level category node in the Aminet category tree.
 *
 * Represents one of Aminet's ~17 top-level categories (e.g., "game",
 * "mus", "util") with the total package count across all its
 * subcategories and the nested subcategory nodes.
 */
export const CategoryNodeSchema = z.object({
  /** Category name (e.g., "game") */
  name: z.string(),
  /** Total package count across all subcategories */
  packageCount: z.number().int().nonnegative(),
  /** Nested subcategory nodes, sorted alphabetically by name */
  subcategories: z.array(SubcategoryNodeSchema),
});

export type CategoryNode = z.infer<typeof CategoryNodeSchema>;

// ============================================================================
// Search schemas
// ============================================================================

/**
 * Options for searching the Aminet package catalog.
 *
 * The query string is matched as a case-insensitive substring against
 * package name, description, and author fields. Optional category and
 * subcategory filters narrow the search scope before matching.
 */
export const SearchOptionsSchema = z.object({
  /** Search query string (matched as case-insensitive substring) */
  query: z.string(),
  /** Optional category filter (e.g., "mus", "game", "util") */
  category: z.string().optional(),
  /** Optional subcategory filter (e.g., "edit", "shoot") */
  subcategory: z.string().optional(),
  /** Maximum number of results to return (default: 50) */
  limit: z.number().int().positive().optional(),
});

export type SearchOptions = z.infer<typeof SearchOptionsSchema>;

/**
 * A single search result with relevance scoring.
 *
 * matchField indicates which field produced the highest-scoring match:
 * - "name" (score 3): query found in package filename
 * - "description" (score 2): query found in package description
 * - "author" (score 1): query found in readme author field
 */
export const SearchResultSchema = z.object({
  /** The matched package */
  package: AminetPackageSchema,
  /** Relevance score: 3 = name, 2 = description, 1 = author */
  score: z.number(),
  /** Which field produced the match */
  matchField: z.enum(['name', 'description', 'author']),
});

export type SearchResult = z.infer<typeof SearchResultSchema>;

// ============================================================================
// PackageDetailSchema
// ============================================================================

/**
 * Unified view of a single Aminet package, merging INDEX metadata,
 * .readme parsed fields, and mirror lifecycle state.
 *
 * Built by `buildPackageDetail()` in package-detail.ts for display
 * in the package detail view. Readme fields are nullable because
 * not every package has a .readme, and mirror status defaults to
 * 'not-mirrored' when the package has no mirror entry.
 */
export const PackageDetailSchema = z.object({
  // From INDEX (AminetPackage)
  /** Archive filename (e.g., "ProTracker36.lha") */
  filename: z.string(),
  /** Full Aminet directory path (e.g., "mus/edit") */
  directory: z.string(),
  /** Top-level category (e.g., "mus") */
  category: z.string(),
  /** Subcategory within the category (e.g., "edit") */
  subcategory: z.string(),
  /** Size in kilobytes */
  sizeKb: z.number(),
  /** Age in days since upload */
  ageDays: z.number().int().nonnegative(),
  /** One-line package description from INDEX */
  description: z.string(),
  /** Full path: directory/filename (e.g., "mus/edit/ProTracker36.lha") */
  fullPath: z.string(),

  // From .readme (nullable when readme unavailable)
  /** Author from .readme Author: field */
  author: z.string().nullable(),
  /** Version from .readme Version: field */
  version: z.string().nullable(),
  /** Requirements parsed from .readme Requires: field */
  requires: z.array(z.string()),
  /** Architecture tags from .readme Architecture: field */
  architecture: z.array(z.string()),
  /** Free-form description body from .readme */
  longDescription: z.string().nullable(),

  // From mirror state
  /** Current lifecycle status from MirrorEntry, or 'not-mirrored' */
  mirrorStatus: PackageStatusSchema,
});

export type PackageDetail = z.infer<typeof PackageDetailSchema>;

// ============================================================================
// Collection schemas
// ============================================================================

/**
 * A single entry in a collection manifest.
 *
 * References an Aminet package by its full path (e.g., "mus/edit/ProTracker36.lha")
 * with an optional human-readable note explaining why it's included.
 */
export const CollectionEntrySchema = z.object({
  /** Full Aminet path (e.g., "util/dir/DOpus550.lha") */
  fullPath: z.string(),
  /** Optional note explaining why this package is in the collection */
  note: z.string().optional(),
}).strict();

export type CollectionEntry = z.infer<typeof CollectionEntrySchema>;

/**
 * A collection manifest -- a curated set of Aminet packages.
 *
 * Collections are stored as YAML files and validated at load time.
 * The version field is always 1 (for future schema migration).
 * Using strict() to reject unknown fields for safety.
 */
export const CollectionManifestSchema = z.object({
  /** Human-readable collection name */
  name: z.string(),
  /** Description of what this collection contains */
  description: z.string(),
  /** Schema version -- always 1 */
  version: z.literal(1),
  /** ISO 8601 timestamp of collection creation */
  createdAt: z.string(),
  /** ISO 8601 timestamp of last modification */
  updatedAt: z.string(),
  /** Optional author or curator name */
  author: z.string().optional(),
  /** Optional tags for categorization */
  tags: z.array(z.string()).optional(),
  /** Package entries in this collection */
  packages: z.array(CollectionEntrySchema),
}).strict();

export type CollectionManifest = z.infer<typeof CollectionManifestSchema>;

// ============================================================================
// Virus signature schemas
// ============================================================================

export const SignaturePatternSchema = z.object({
  /** Hex string of bytes to match (big-endian, e.g., "536F6D657468696E67") */
  bytes: z.string(),
  /** Byte offset: fixed number or 'any' to scan entire region */
  offset: z.union([z.number().int().nonnegative(), z.literal('any')]).default('any'),
  /** Optional hex bitmask for wildcard bytes */
  mask: z.string().optional(),
  /** Human-readable description of what this pattern matches */
  description: z.string().optional(),
});
export type SignaturePattern = z.infer<typeof SignaturePatternSchema>;

export const VirusSignatureSchema = z.object({
  /** Virus name (e.g., "SCA", "Byte Bandit") */
  name: z.string(),
  /** Signature type: which binary context this applies to */
  type: z.enum(['bootblock', 'file', 'link']),
  /** Severity: critical/high/medium/low */
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  /** Byte patterns to search for -- ANY match = detection */
  patterns: z.array(SignaturePatternSchema).min(1),
  /** Human-readable description */
  description: z.string(),
  /** Reference URLs (VHT encyclopedia, Wikipedia, etc.) */
  references: z.array(z.string()).default([]),
});
export type VirusSignature = z.infer<typeof VirusSignatureSchema>;

export const VirusSignatureDatabaseSchema = z.object({
  /** Schema version */
  version: z.literal(1),
  /** Human-readable description of this signature set */
  description: z.string(),
  /** Array of virus signatures */
  signatures: z.array(VirusSignatureSchema),
});
export type VirusSignatureDatabase = z.infer<typeof VirusSignatureDatabaseSchema>;

// ============================================================================
// Scan result schemas
// ============================================================================

export const ScanMatchSchema = z.object({
  /** Name of the matched virus signature */
  signatureName: z.string(),
  /** Type of the matched signature */
  signatureType: z.enum(['bootblock', 'file', 'link']),
  /** Severity of the matched signature */
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  /** Byte offset where the pattern was found */
  matchOffset: z.number().int().nonnegative(),
  /** Which pattern within the signature matched */
  patternIndex: z.number().int().nonnegative(),
});
export type ScanMatch = z.infer<typeof ScanMatchSchema>;

export const HeuristicFlagSchema = z.object({
  /** Rule identifier (e.g., "small-first-hunk", "boot-virus-pattern") */
  rule: z.string(),
  /** Severity level */
  severity: z.enum(['info', 'warning', 'critical']),
  /** Human-readable description */
  description: z.string(),
});
export type HeuristicFlag = z.infer<typeof HeuristicFlagSchema>;

export const ScanVerdictSchema = z.enum(['clean', 'suspicious', 'infected', 'unscanned']);
export type ScanVerdict = z.infer<typeof ScanVerdictSchema>;

export const ScanDepthSchema = z.enum(['fast', 'standard', 'thorough']);
export type ScanDepth = z.infer<typeof ScanDepthSchema>;

export const ScanReportSchema = z.object({
  /** Full Aminet path of the scanned file */
  fullPath: z.string(),
  /** Final merged verdict */
  verdict: ScanVerdictSchema,
  /** ISO 8601 timestamp of scan completion */
  scannedAt: z.string(),
  /** Scan depth used */
  scanDepth: ScanDepthSchema,
  /** Signature matches found (empty if clean) */
  signatureMatches: z.array(ScanMatchSchema),
  /** Heuristic flags raised (empty if clean) */
  heuristicFlags: z.array(HeuristicFlagSchema),
  /** Emulated scan result (only in thorough mode) */
  emulatedResult: z.object({
    ran: z.boolean(),
    verdict: ScanVerdictSchema,
    tool: z.string(),
    output: z.string(),
    timedOut: z.boolean(),
  }).optional(),
  /** Community checksum match result */
  checksumMatch: z.object({
    sha256: z.string(),
    knownGood: z.boolean(),
    source: z.string(),
  }).optional(),
});
export type ScanReport = z.infer<typeof ScanReportSchema>;

// ============================================================================
// Quarantine schemas
// ============================================================================

export const QuarantineEntrySchema = z.object({
  /** Original file path before quarantine */
  originalPath: z.string(),
  /** ISO 8601 timestamp of quarantine */
  quarantinedAt: z.string(),
  /** Full scan report that triggered quarantine */
  scanReport: ScanReportSchema,
  /** SHA-256 hash of the quarantined file */
  sha256: z.string(),
});
export type QuarantineEntry = z.infer<typeof QuarantineEntrySchema>;

// ============================================================================
// Scan policy schemas
// ============================================================================

export const ScanDepthConfigSchema = z.object({
  signatureScan: z.boolean(),
  heuristicScan: z.boolean(),
  emulatedScan: z.boolean(),
  checksumLookup: z.boolean(),
});
export type ScanDepthConfig = z.infer<typeof ScanDepthConfigSchema>;

export const ScanPolicyConfigSchema = z.object({
  version: z.literal(1),
  defaultDepth: ScanDepthSchema,
  depths: z.object({
    fast: ScanDepthConfigSchema,
    standard: ScanDepthConfigSchema,
    thorough: ScanDepthConfigSchema,
  }),
  emulatedScan: z.object({
    timeoutMs: z.number().int().positive().default(60000),
    fsUaePath: z.string().default('fs-uae'),
    kickstartPath: z.string().nullable().default(null),
  }).optional(),
});
export type ScanPolicyConfig = z.infer<typeof ScanPolicyConfigSchema>;

// ============================================================================
// Installation types (Phase 240)
// ============================================================================

/**
 * Result of extracting an archive to a temp directory.
 */
export const ExtractionResultSchema = z.object({
  /** Relative file paths extracted (relative to extractDir) */
  files: z.array(z.string()),
  /** Absolute path to temp extraction directory */
  extractDir: z.string(),
  /** Archive format detected */
  format: z.enum(['lha', 'lzx']),
});
export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;

/**
 * Status of an external extraction tool (lha, unlzx).
 */
export const ToolStatusSchema = z.object({
  /** Tool name */
  name: z.string(),
  /** Whether tool is available on the system */
  available: z.boolean(),
  /** Tool version string, null if unavailable or no --version */
  version: z.string().nullable(),
  /** Platform-specific install instructions */
  installGuide: z.string(),
  /** Whether this tool is required (true) or optional with graceful degradation (false) */
  required: z.boolean(),
});
export type ToolStatus = z.infer<typeof ToolStatusSchema>;

/**
 * Configuration for installing a package into the emulated filesystem.
 */
export const InstallConfigSchema = z.object({
  /** Root of the emulated Amiga filesystem (acts as SYS:) */
  sysRoot: z.string(),
  /** Optional custom install path relative to sysRoot (e.g., "Games/MyGame") */
  customPath: z.string().optional(),
});
export type InstallConfig = z.infer<typeof InstallConfigSchema>;

/**
 * Dependency reference types found in Aminet .readme Requires: field.
 */
export const DependencyTypeSchema = z.enum([
  'package',      // Full Aminet path: "util/libs/mui38usr.lha"
  'os_version',   // OS requirement: "OS 3.0+", "AmigaOS 2.0"
  'hardware',     // Hardware requirement: "68020+", "AGA", "RTG"
  'library',      // Library name without path: "muimaster.library"
  'unknown',      // Unclassified
]);
export type DependencyType = z.infer<typeof DependencyTypeSchema>;

/**
 * A classified dependency from the .readme Requires: field.
 */
export const DependencySchema = z.object({
  /** Raw string from the Requires: field */
  raw: z.string(),
  /** Classified dependency type */
  type: DependencyTypeSchema,
  /** For 'package' type: the Aminet fullPath; null for other types */
  fullPath: z.string().nullable(),
  /** Whether this dependency is satisfied (package installed or system requirement met) */
  satisfied: z.boolean(),
});
export type Dependency = z.infer<typeof DependencySchema>;

/**
 * A single file tracked as part of an installation.
 */
export const InstalledFileSchema = z.object({
  /** Path relative to extraction root */
  sourcePath: z.string(),
  /** Absolute path where file was placed */
  destPath: z.string(),
  /** SHA-256 hash of the placed file */
  sha256: z.string(),
});
export type InstalledFile = z.infer<typeof InstalledFileSchema>;

/**
 * Per-package installation manifest for tracking and uninstall.
 */
export const InstallManifestSchema = z.object({
  /** Aminet full path (e.g., "mus/edit/ProTracker36.lha") */
  fullPath: z.string(),
  /** ISO 8601 timestamp of installation */
  installedAt: z.string(),
  /** All files placed during installation */
  files: z.array(InstalledFileSchema),
  /** Dependencies detected from .readme */
  dependencies: z.array(DependencySchema),
  /** Install path used (sysRoot or custom) */
  installPath: z.string(),
});
export type InstallManifest = z.infer<typeof InstallManifestSchema>;

/**
 * Result of a scan gate check.
 */
export const ScanGateResultSchema = z.object({
  /** Whether installation is allowed */
  allowed: z.boolean(),
  /** Human-readable reason */
  reason: z.string(),
  /** Whether the user can override this decision (suspicious packages only) */
  requiresOverride: z.boolean(),
});
export type ScanGateResult = z.infer<typeof ScanGateResultSchema>;

// ============================================================================
// Emulator types (Phase 241)
// ============================================================================

/**
 * Hardware profile identifiers for the 5 supported Amiga configurations.
 */
export const HardwareProfileIdSchema = z.enum([
  'a500',
  'a1200',
  'a1200-030',
  'a4000',
  'whdload',
]);
export type HardwareProfileId = z.infer<typeof HardwareProfileIdSchema>;

/**
 * A complete hardware profile defining an emulated Amiga configuration.
 */
export const HardwareProfileSchema = z.object({
  /** Profile identifier */
  id: HardwareProfileIdSchema,
  /** Human-readable name (e.g., "Amiga 500") */
  name: z.string(),
  /** FS-UAE amiga_model value (e.g., "A500", "A1200", "A4000/040") */
  amigaModel: z.string(),
  /** Required Kickstart version (e.g., "1.3", "3.1") */
  kickstartVersion: z.string(),
  /** Required Kickstart revision (e.g., "34.005", "40.068") */
  kickstartRevision: z.string(),
  /** CPU type string (e.g., "68000", "68ec020", "68030", "68040") */
  cpu: z.string(),
  /** Chip memory in KB */
  chipMemoryKb: z.number().int().nonnegative(),
  /** Slow memory in KB (A500 trapdoor expansion) */
  slowMemoryKb: z.number().int().nonnegative(),
  /** Fast memory in KB (Zorro II/III) */
  fastMemoryKb: z.number().int().nonnegative(),
  /** Chipset type for documentation/display */
  chipset: z.enum(['OCS', 'ECS', 'AGA']),
  /** Display settings */
  display: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
  /** Audio settings */
  sound: z.object({
    stereoSeparation: z.number().int().min(0).max(100),
  }),
});
export type HardwareProfile = z.infer<typeof HardwareProfileSchema>;

/**
 * A known Kickstart ROM entry for checksum-based identification.
 * Only checksums and metadata -- no ROM data (EMU-10, NFR-05).
 */
export const KnownRomSchema = z.object({
  /** Kickstart version (e.g., "1.3", "3.1") */
  version: z.string(),
  /** Kickstart revision (e.g., "34.005", "40.068") */
  revision: z.string(),
  /** Target Amiga model (e.g., "A500", "A1200", "A4000") */
  model: z.string(),
  /** CRC32 checksum as unsigned 32-bit integer */
  crc32: z.number().int().nonnegative(),
  /** SHA-1 hex string for FS-UAE cross-verification (optional) */
  sha1: z.string().nullable(),
  /** Expected file size in bytes (262144 for 256KB, 524288 for 512KB) */
  size: z.number().int().positive(),
});
export type KnownRom = z.infer<typeof KnownRomSchema>;

/**
 * A validated ROM file found on the user's system.
 */
export const DetectedRomSchema = z.object({
  /** Absolute path to the ROM file */
  path: z.string(),
  /** Matched KnownRom entry */
  rom: KnownRomSchema,
  /** Whether the ROM was encrypted (Cloanto) and needed decryption */
  wasEncrypted: z.boolean(),
});
export type DetectedRom = z.infer<typeof DetectedRomSchema>;

/**
 * Flat FS-UAE configuration key-value pairs ready for serialization.
 * Keys use FS-UAE underscore convention (e.g., amiga_model, chip_memory).
 */
export const FsUaeConfigSchema = z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]));
export type FsUaeConfig = z.infer<typeof FsUaeConfigSchema>;

/**
 * High-level launch configuration combining profile, ROM, and hard drives.
 */
export const LaunchConfigSchema = z.object({
  /** Hardware profile to use */
  profileId: HardwareProfileIdSchema,
  /** Absolute path to Kickstart ROM file */
  kickstartFile: z.string(),
  /** Hard drive mounts: array of { path, label, readOnly?, bootPriority? } */
  hardDrives: z.array(z.object({
    path: z.string(),
    label: z.string(),
    readOnly: z.boolean().optional(),
    bootPriority: z.number().int().optional(),
  })).max(10),
  /** Floppy drive paths (0-3) */
  floppyDrives: z.array(z.string()).max(4).optional(),
  /** Optional save states directory */
  saveStatesDir: z.string().optional(),
  /** Enable save states (default false -- disabled for directory hard drives) */
  saveStates: z.boolean().optional(),
  /** FS-UAE binary path (default: "fs-uae") */
  fsUaePath: z.string().optional(),
  /** Additional FS-UAE options to merge (advanced override) */
  extraOptions: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});
export type LaunchConfig = z.infer<typeof LaunchConfigSchema>;

/**
 * Result of an emulator launch attempt.
 * Uses graceful degradation pattern: success: false + structured error, never throws.
 */
export const LaunchResultSchema = z.object({
  /** Whether launch succeeded */
  success: z.boolean(),
  /** Absolute path to generated .fs-uae config file (present on success) */
  configPath: z.string().optional(),
  /** Structured error (present on failure) */
  error: z.object({
    code: z.enum(['ROM_MISSING', 'FSUAE_MISSING', 'INVALID_PROFILE', 'LAUNCH_FAILED', 'NO_HARD_DRIVES']),
    message: z.string(),
    romRequired: z.object({
      version: z.string(),
      crc32: z.string(),
      model: z.string(),
    }).optional(),
    guidance: z.string(),
  }).optional(),
});
export type LaunchResult = z.infer<typeof LaunchResultSchema>;

/**
 * WHDLoad game/demo database entry with hardware requirements.
 * Derived from community whdload_db.xml format.
 */
export const WhdloadEntrySchema = z.object({
  /** LHA filename (case-sensitive, e.g., "Doom.lha") */
  filename: z.string(),
  /** Clean game/demo name */
  name: z.string(),
  /** Default .Slave filename */
  slaveDefault: z.string(),
  /** Number of slave files available */
  slaveCount: z.number().int().nonnegative(),
  /** Hardware requirements for WHDLoad configuration */
  hardware: z.object({
    cpu: z.enum(['68000', '68010', '68020', '68040']).optional(),
    chipset: z.enum(['OCS', 'ECS', 'AGA']).optional(),
    fastRamMb: z.number().int().nonnegative().optional(),
    z3RamMb: z.number().int().nonnegative().optional(),
    ntsc: z.boolean().optional(),
    clock: z.enum(['7', '14', '25', '28', 'MAX']).optional(),
  }),
});
export type WhdloadEntry = z.infer<typeof WhdloadEntrySchema>;

/**
 * Emulator state snapshot metadata.
 */
export const EmulatorSnapshotSchema = z.object({
  /** Snapshot slot number (1-9) */
  slot: z.number().int().min(1).max(9),
  /** ISO 8601 timestamp of when the snapshot was saved */
  savedAt: z.string(),
  /** Description/label for the snapshot */
  label: z.string(),
  /** Hardware profile used when snapshot was taken */
  profileId: HardwareProfileIdSchema,
  /** Absolute path to snapshot directory */
  snapshotDir: z.string(),
});
export type EmulatorSnapshot = z.infer<typeof EmulatorSnapshotSchema>;
