# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-19)

**Core value:** Skills, agents, and teams must match official Claude Code patterns — and the GSD ecosystem must provide spatial, visual, and operational tools that make complex system design tangible.
**Current focus:** v1.26 — Aminet Archive Extension Pack, Phase 242 Plan 05

## Current Position

Milestone: v1.26 — Aminet Archive Extension Pack
Phase: 242 of 242 (Desktop Panel, Agent Pipeline & Integration)
Plan: 5 of 7 in current phase
Status: Executing Phase 242
Last activity: 2026-02-19 — Plan 05 complete (status indicators 4-color scheme + mirror statistics dashboard widget, 38 tests)

Progress: [████████████████████] 98%

## Performance Metrics

| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 236   | 02   | 3min     | 1     | 3     |
| 236   | 04   | 3min     | 2     | 3     |
| 236   | 05   | 3min     | 1     | 3     |
| 236   | 03   | 3min     | 1     | 3     |
| 236   | 01   | 7min     | 2     | 5     |
| 236   | 06   | 3min     | 2     | 4     |
| 237   | 01   | 3min     | 1     | 4     |
| 237   | 02   | 2min     | 1     | 2     |
| 237   | 03   | 2min     | 1     | 2     |
| 237   | 05   | 2min     | 1     | 2     |
| 237   | 04   | 2min     | 2     | 3     |
| 238   | 01   | 2min     | 1     | 3     |
| 238   | 02   | 2min     | 1     | 3     |
| 238   | 03   | 3min     | 1     | 3     |
| 238   | 04   | 3min     | 2     | 8     |
| 238   | 05   | 3min     | 2     | 3     |
| 239   | 01   | 4min     | 1     | 6     |
| 239   | 02   | 2min     | 1     | 2     |
| 239   | 03   | 3min     | 1     | 2     |
| 239   | 04   | 3min     | 1     | 2     |
| 239   | 06   | 4min     | 2     | 3     |
| 239   | 05   | 5min     | 1     | 3     |

| 240   | 01   | 2min     | 1     | 3     |
| 240   | 02   | 4min     | 2     | 4     |
| 240   | 03   | 3min     | 1     | 2     |
| 240   | 04   | 5min     | 2     | 4     |
| 240   | 05   | 4min     | 2     | 3     |
| 241   | 01   | 3min     | 1     | 3     |
| 241   | 02   | 2min     | 1     | 2     |
| 241   | 03   | 5min     | 1     | 2     |
| 241   | 04   | 3min     | 1     | 2     |
| 241   | 05   | 3min     | 1     | 2     |
| 241   | 06   | 3min     | 2     | 3     |
| 242   | 01   | 2min     | 1     | 1     |
| 242   | 04   | 2min     | 1     | 3     |
| 242   | 02   | 3min     | 1     | 6     |
| 242   | 05   | 2min     | 2     | 4     |
| 242   | 03   | 4min     | 2     | 4     |

**Velocity:**
- Total plans completed: 37
- Average duration: 3min
- Total execution time: 113min

## Accumulated Context

### Key Context

- 29 milestones shipped (v1.0-v1.25 + v1.8.1 patch), 235 phases, 639 plans, ~278k LOC
- 9,355 tests passing, TypeScript clean
- v1.26: 7 phases (236-242), 40 plans, 81 requirements, 5 agents (AM-1 through AM-5)
- Chipset YAML pre-prepared at /tmp/v1.27-input/chipset.yaml
- Research complete: AmigaBinaryReader needed first (big-endian pitfall), two-phase scan protocol, lhasa+unlzx for extraction
- Phases 236-237 are independent and can run in parallel
- Phase 239 (scanning) is highest-risk: ClamAV .ndb custom signatures need validation
- Phase 242 is convergence point: all components must be stable
- External dependencies: FS-UAE, lha/lhasa, unlzx, user-provided Kickstart ROMs
- Phase 236 planned: 6 plans, 3 waves (W1: 01+03+05 parallel, W2: 02+04 parallel, W3: 06)
- All plans are TDD, autonomous, pure TypeScript in src/aminet/
- Shared types.ts: Wave 2+ plans must READ FIRST then extend
- Plan 05: rawHeader keys lowercase for consistent lookup; multi-value split on comma+semicolon
- Plan 03: ISO-8859-1 via TextDecoder for INDEX decoding; cache uses INDEX + INDEX.meta.json sidecar
- Plan 01: bit30=MEMF_CHIP (flags=1), bit31=MEMF_FAST (flags=2); unknown hunks skipped gracefully
- Plan 04: Token-based regex parsing for INDEX; K=1x M=1000x size suffixes; 84K entries in ~114ms; JSON cache for offline
- Plan 02: Boot block parser with DOS magic, checksum validation, and 5 suspect pattern detectors for virus scanning
- Plan 06: 24h freshness detection, RECENT-based incremental merge by fullPath, barrel file exporting complete public API
- Phase 237 planned: 5 plans, wave 1 (01), then 02-05
- Plan 01: PackageStatus 7-state enum, MirrorEntry/MirrorState/DownloadConfig Zod schemas, atomic write-then-rename persistence, immutable updateEntry
- Plan 02: fetchPackage with ordered mirror fallback, directory hierarchy preservation, non-fatal .readme, User-Agent on all requests
- Plan 03: computeSha256 via node:crypto, verifySizeKb with +/-1 KB tolerance, verifyIntegrity combining both into IntegrityResult
- Plan 05: detectChanges compares mirror state vs INDEX by sizeKb; only change-eligible statuses (mirrored+) compared; O(1) Map lookup
- Plan 04: bulkDownload with async semaphore concurrency, global rate limiting gate, resume from interruption, serialized state writes via Promise chain mutex
- Phase 238 planned: 5 plans, wave 1 (01+02+03 parallel), wave 2 (04+05 sequential)
- Plan 238-01: searchPackages with case-insensitive substring matching, relevance scoring (name=3, description=2, author=1)
- Plan 238-02: buildCategoryTree, listPackages, filterByArchitecture, filterByOsVersion for browsing
- Plan 238-03: buildPackageDetail merging INDEX + readme + mirror state into unified view
- Plan 238-04: CollectionManifest Zod schema, importCollection/exportCollection YAML round-trip, 5 starter collections
- Plan 238-05: Collection manager CRUD with DI-first pattern (collectionsDir param), atomic write-then-rename, slugified filenames, getCollectionPaths for bulkDownload
- Plan 239-01: All Phase 239 Zod schemas (VirusSignature, ScanReport, QuarantineEntry, ScanPolicyConfig) + 52 virus signatures in 3 JSON files; last-wins deduplication; extensible via JSON drop-in
- Plan 239-02: Context-aware scanBuffer with hex pattern matching, wildcard bitmasks, bootblock/hunk dispatch, <2s for 500KB x 50 sigs; 22 tests
- Plan 239-03: Heuristic scanner with 8 rules (4 hunk, 4 boot block), worst-case verdict derivation, zero false positives on legitimate files; 21 tests
- Plan 239-04: Quarantine system with atomic file moves, metadata sidecars, path traversal prevention, restore round-trip; 15 tests
- Plan 239-06: FS-UAE + CheckX emulated scanner with AbortController timeout, community checksum cross-reference, barrel updated with Phase 239 exports; 12 tests
- Plan 239-05: Scan orchestrator coordinating signature + heuristic scanners into unified ScanReport; configurable depth (fast/standard/thorough); batch processing with auto-quarantine; worst-case verdict merging; YAML policy with Zod; 28 tests
- Plan 240-01: All Phase 240 Zod schemas (ExtractionResult, ToolStatus, InstallConfig, DependencyType, Dependency, InstalledFile, InstallManifest, ScanGateResult) + LhA extractor via lhasa with Zip-Slip prevention, volume prefix stripping, 30s timeout; 21 tests
- Plan 240-02: LZX extractor via unlzx with cwd workaround (no output dir flag), tool validator with platform-specific install guidance (apt/brew), unlzx exit-code-2 detection; 17 tests
- Plan 240-03: Filesystem mapper with AMIGA_ASSIGN_MAP (11 assigns), case-insensitive lookup, Software/ default placement, placeFiles with SHA-256 tracking and temp cleanup; 19 tests
- Plan 240-04: Dependency detector classifying 5 types (package, os_version, hardware, library, unknown) from .readme Requires:; package deps cross-referenced against mirror state; install tracker with atomic manifest persistence, slugified filenames, uninstall with directory cleanup; 39 tests
- Plan 240-05: Scan gate enforcing INS-07 (refuse unscanned), INS-08 (refuse infected), INS-09 (suspicious override via confirmFn); installPackage orchestrator coordinating gate->extract->place->deps->track->state; barrel exports complete Phase 240 API; 19 tests
- Plan 241-01: 9 Phase 241 Zod schemas (HardwareProfileId, HardwareProfile, KnownRom, DetectedRom, FsUaeConfig, LaunchConfig, LaunchResult, WhdloadEntry, EmulatorSnapshot) + FS-UAE config generator with buildFsUaeConfig/generateFsUaeConfig, path normalization, sorted keys, boolean 1/0 serialization; 23 tests
- Plan 241-02: 5 hardware profiles (A500/A1200/A1200+030/A4000/WHDLoad) as embedded TS constants; HardwareProfile types defined locally (241-01 parallel); getProfile/getAllProfiles/getProfileForModel with deep-frozen structuredClone copies; 37 tests
- Plan 241-03: ROM manager with CRC32 IEEE polynomial (no external deps), 12 known ROM entries (checksums only, no ROM data), scanRomDirectory with Cloanto XOR decryption and overdump handling, selectRomForProfile with WHDLoad-to-A1200 mapping, DI-based crc32Fn for testability; 32 tests
- Plan 241-04: selectProfileFromReadme with priority-based matching (WHDLoad>040>030>AGA>020>OS3.x>A500 default); writeFsUaeConfig with recursive mkdir; launchEmulator orchestrating config gen+write+execFile with structured errors (NO_HARD_DRIVES, INVALID_PROFILE, FSUAE_MISSING, LAUNCH_FAILED); vi.mock for ESM child_process mocking; 33 tests
- Plan 241-05: WHDLoad integration: detectSlaveFiles (case-insensitive recursive .Slave scanner), WHDLOAD_KICKSTART_MAP (8 revisions), buildWhdloadConfig with per-game CPU/chipset/RAM/NTSC/clock overrides; save_states=0 forced; PRELOAD hint at 4MB+; 25 tests
- Plan 241-06: Emulator state: 9-slot snapshot metadata (save/list/delete), shouldDisableSaveStates for directory hard drive safety, buildMissingRomGuidance with CRC32 hex + legal sources; barrel updated with all Phase 241 exports (6 modules, 9 types, 9 schemas); 23 tests
- Plan 242-04: AminetPanel class in desktop/src/aminet/ with four-pane CSS grid (search/categories/results/detail), Workbench 3.x aesthetic (Topaz, #0055aa/#ffffff/#ff8800), data injection via methods, WindowType extended with "aminet"; 22 tests
- Plan 242-02: 6 SKILL.md files for Aminet pack (index 1.5%, browser 1.0%, mirror 1.0%, scanner 1.5%, installer 1.0%, emulator 1.0% = 7.0% total); follows infra/skills/ uae-emulation.md format exactly
- Plan 242-05: Status indicators (getStatusColor/getStatusLabel/renderStatusBadge) with DisplayStatus type duplicated in desktop/src; mirror statistics widget (renderMirrorWidget/renderMirrorWidgetStyles) following budget-gauge.ts pure render pattern; 38 tests
- Plan 242-03: Pipeline stage orchestrator (executePipelineStage) delegating 5 stages to barrel exports; scan gate enforced on install (AGT-03); team YAML at infra/packs/aminet/teams/aminet-pipeline.yaml; 9 tests

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-02-19
Stopped at: Completed 242-05-PLAN.md (status indicators + mirror widget, 38 tests)
Resume file: None

## ▶ Next Up

Phase 242 in progress (6/7 plans). Continue with plans 242-06, 242-07.
