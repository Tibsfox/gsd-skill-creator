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
// Mirror state management
// ============================================================================

export {
  loadMirrorState,
  saveMirrorState,
  updateEntry,
  getEntry,
} from './mirror-state.js';

// ============================================================================
// Package downloading
// ============================================================================

export { fetchPackage } from './package-fetcher.js';
export type { FetchResult } from './package-fetcher.js';

// ============================================================================
// Integrity verification
// ============================================================================

export { computeSha256, verifySizeKb, verifyIntegrity } from './integrity.js';
export type { IntegrityResult } from './integrity.js';

// ============================================================================
// Bulk downloading
// ============================================================================

export { bulkDownload } from './bulk-downloader.js';
export type { BulkDownloadResult } from './bulk-downloader.js';

// ============================================================================
// Sync detection
// ============================================================================

export { detectChanges, detectNewPackages, detectRemovedPackages } from './sync-detector.js';
export type { SyncReport } from './sync-detector.js';

// ============================================================================
// Search
// ============================================================================

export { searchPackages } from './search.js';

// ============================================================================
// Category browsing
// ============================================================================

export {
  buildCategoryTree,
  listPackages,
  filterByArchitecture,
  filterByOsVersion,
} from './category-browser.js';

// ============================================================================
// Package detail
// ============================================================================

export { buildPackageDetail } from './package-detail.js';

// ============================================================================
// Collections
// ============================================================================

export {
  importCollection,
  exportCollection,
  loadStarterCollection,
  listStarterCollections,
} from './collection.js';

export {
  createCollection,
  saveCollection,
  loadCollection,
  listCollections,
  addPackage,
  removePackage,
  deleteCollection,
  getCollectionPaths,
} from './collection-manager.js';

// ============================================================================
// Virus signature database (Phase 239)
// ============================================================================

export { loadSignatureDatabase, loadSignatureFile, mergeSignatures, getBuiltinSignaturesDir } from './signature-db.js';

// ============================================================================
// Signature scanning (Phase 239) -- created by Plan 239-02
// ============================================================================

export { scanBuffer, isBootBlock, isHunkFile, hexToBytes } from './signature-scanner.js';

// ============================================================================
// Heuristic scanning (Phase 239) -- created by Plan 239-03
// ============================================================================

export { analyzeHunkFile, analyzeBootBlock, deriveHeuristicVerdict } from './heuristic-scanner.js';

// ============================================================================
// Quarantine (Phase 239) -- created by Plan 239-04
// ============================================================================

export { quarantineFile, listQuarantined, restoreFile } from './quarantine.js';

// ============================================================================
// Scan orchestration (Phase 239) -- created by Plan 239-05
// ============================================================================

export { scanPackage, batchScan, loadScanPolicy, mergeVerdicts, defaultScanPolicy } from './scan-orchestrator.js';

// ============================================================================
// Emulated scanning (Phase 239)
// ============================================================================

export { runEmulatedScan, lookupChecksum, loadKnownGoodHashes } from './emulated-scanner.js';
export type { EmulatedScanResult, ChecksumMatch, EmulatedScanConfig } from './emulated-scanner.js';

// ============================================================================
// LhA extraction (Phase 240)
// ============================================================================

export { extractLha, sanitizePath, stripVolumePrefix, walkDirectory } from './lha-extractor.js';

// ============================================================================
// LZX extraction (Phase 240)
// ============================================================================

export { extractLzx } from './lzx-extractor.js';

// ============================================================================
// Tool validation (Phase 240)
// ============================================================================

export { validateExtractionTools } from './tool-validator.js';

// ============================================================================
// Filesystem mapping (Phase 240)
// ============================================================================

export { mapToAmigaPath, placeFiles, AMIGA_ASSIGN_MAP } from './filesystem-mapper.js';

// ============================================================================
// Dependency detection (Phase 240)
// ============================================================================

export { detectDependencies, classifyDependency, checkDependencySatisfied } from './dependency-detector.js';

// ============================================================================
// Install tracking (Phase 240)
// ============================================================================

export { recordInstall, loadInstallManifest, listInstalled, uninstallPackage } from './install-tracker.js';

// ============================================================================
// Scan gate and installation (Phase 240)
// ============================================================================

export { checkScanGate, installPackage } from './scan-gate.js';
export type { InstallPackageOptions } from './scan-gate.js';

// ============================================================================
// Emulator configuration (Phase 241)
// ============================================================================

export { generateFsUaeConfig, buildFsUaeConfig } from './emulator-config.js';

// ============================================================================
// Hardware profiles (Phase 241)
// ============================================================================

export { HARDWARE_PROFILES, getProfile, getAllProfiles, getProfileForModel } from './hardware-profiles.js';

// ============================================================================
// ROM management (Phase 241)
// ============================================================================

export { computeCrc32, KNOWN_ROMS, scanRomDirectory, selectRomForProfile, decryptCloantoRom } from './rom-manager.js';

// ============================================================================
// Emulator launch (Phase 241)
// ============================================================================

export { selectProfileFromReadme, launchEmulator, writeFsUaeConfig } from './emulator-launch.js';

// ============================================================================
// WHDLoad integration (Phase 241)
// ============================================================================

export { detectSlaveFiles, buildWhdloadConfig, WHDLOAD_KICKSTART_MAP } from './whdload.js';

// ============================================================================
// Emulator state management (Phase 241)
// ============================================================================

export { saveSnapshot, listSnapshots, deleteSnapshot, buildMissingRomGuidance, shouldDisableSaveStates } from './emulator-state.js';

// ============================================================================
// Pipeline orchestration (Phase 242)
// ============================================================================

export { executePipelineStage } from './pipeline.js';
export type { PipelineStage, PipelineStageResult, StageContext } from './pipeline.js';

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
  PackageStatus,
  MirrorEntry,
  MirrorState,
  DownloadConfig,
  SearchResult,
  SearchOptions,
  CategoryNode,
  SubcategoryNode,
  PackageDetail,
  CollectionEntry,
  CollectionManifest,
  SignaturePattern,
  VirusSignature,
  VirusSignatureDatabase,
  ScanMatch,
  HeuristicFlag,
  ScanVerdict,
  ScanDepth,
  ScanReport,
  QuarantineEntry,
  ScanDepthConfig,
  ScanPolicyConfig,
  ExtractionResult,
  ToolStatus,
  InstallConfig,
  DependencyType,
  Dependency,
  InstalledFile,
  InstallManifest,
  ScanGateResult,
  HardwareProfileId,
  HardwareProfile,
  KnownRom,
  DetectedRom,
  FsUaeConfig,
  LaunchConfig,
  LaunchResult,
  WhdloadEntry,
  EmulatorSnapshot,
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
  PackageStatusSchema,
  MirrorEntrySchema,
  MirrorStateSchema,
  DownloadConfigSchema,
  SearchResultSchema,
  SearchOptionsSchema,
  CategoryNodeSchema,
  SubcategoryNodeSchema,
  PackageDetailSchema,
  CollectionEntrySchema,
  CollectionManifestSchema,
  SignaturePatternSchema,
  VirusSignatureSchema,
  VirusSignatureDatabaseSchema,
  ScanMatchSchema,
  HeuristicFlagSchema,
  ScanVerdictSchema,
  ScanDepthSchema,
  ScanReportSchema,
  QuarantineEntrySchema,
  ScanDepthConfigSchema,
  ScanPolicyConfigSchema,
  ExtractionResultSchema,
  ToolStatusSchema,
  InstallConfigSchema,
  DependencyTypeSchema,
  DependencySchema,
  InstalledFileSchema,
  InstallManifestSchema,
  ScanGateResultSchema,
  HardwareProfileIdSchema,
  HardwareProfileSchema,
  KnownRomSchema,
  DetectedRomSchema,
  FsUaeConfigSchema,
  LaunchConfigSchema,
  LaunchResultSchema,
  WhdloadEntrySchema,
  EmulatorSnapshotSchema,
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
