/**
 * Aminet Archive Extension Pack -- public API barrel.
 *
 * Re-exports the complete public surface from all src/aminet/ modules.
 * Downstream consumers should import from 'src/aminet/index.js' rather
 * than reaching into individual module files.
 *
 * @module
 */

// ============================================================================
// Binary parsing
// ============================================================================

export { AmigaBinaryReader } from './binary-reader.js';
export { parseHunkFile } from './hunk-parser.js';
export { parseBootBlock } from './bootblock-parser.js';

// ============================================================================
// INDEX management
// ============================================================================

export {
  fetchAminetIndex,
  decompressIndex,
  decodeIndexContent,
  validateIndexFormat,
  isIndexStale,
  loadCachedIndex,
} from './index-fetcher.js';

export {
  parseAminetIndex,
  parseIndexLine,
  writeIndexCache,
  readIndexCache,
} from './index-parser.js';

// ============================================================================
// .readme parsing
// ============================================================================

export { parseReadme } from './readme-parser.js';

// ============================================================================
// Freshness and incremental updates
// ============================================================================

export {
  checkFreshness,
  fetchRecent,
  mergeRecentIntoIndex,
} from './index-freshness.js';

// ============================================================================
// Types (inferred from Zod schemas)
// ============================================================================

export type {
  AminetMirrorConfig,
  IndexMetadata,
  PackageReadme,
  MemoryFlag,
  HunkType,
  RelocationEntry,
  SymbolEntry,
  HunkBlock,
  HunkFile,
  DosType,
  BootBlockFlag,
  BootBlock,
  AminetPackage,
  AminetIndex,
  FreshnessCheck,
} from './types.js';

// ============================================================================
// Zod schemas (for runtime validation)
// ============================================================================

export {
  AminetMirrorConfigSchema,
  IndexMetadataSchema,
  PackageReadmeSchema,
  MemoryFlagSchema,
  HunkTypeSchema,
  HUNK_TYPE_MAP,
  RelocationEntrySchema,
  SymbolEntrySchema,
  HunkBlockSchema,
  HunkFileSchema,
  DosTypeSchema,
  BootBlockFlagSchema,
  BootBlockSchema,
  AminetPackageSchema,
  AminetIndexSchema,
  FreshnessCheckSchema,
} from './types.js';

// ============================================================================
// Hunk type numeric constants
// ============================================================================

export {
  HUNK_UNIT,
  HUNK_NAME,
  HUNK_CODE,
  HUNK_DATA,
  HUNK_BSS,
  HUNK_RELOC32,
  HUNK_RELOC16,
  HUNK_RELOC8,
  HUNK_EXT,
  HUNK_SYMBOL,
  HUNK_DEBUG,
  HUNK_END,
  HUNK_HEADER,
  HUNK_OVERLAY,
  HUNK_BREAK,
  HUNK_DREL32,
  HUNK_DREL16,
  HUNK_DREL8,
  HUNK_LIB,
  HUNK_INDEX,
  HUNK_RELOC32SHORT,
  HUNK_ABSRELOC16,
} from './types.js';
