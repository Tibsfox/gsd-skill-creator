# Roadmap: v1.26 — Aminet Archive Extension Pack

## Overview

Build a complete Aminet archive management system across 7 phases and ~40 plans. The pipeline follows a natural dependency chain: INDEX infrastructure and mirror state form the foundation (Phases 236-237), search/browse and virus scanning build on parsed data (Phases 238-239), installation and emulator configuration depend on scanning clearance and ROM management (Phases 240-241), and the desktop panel, agent pipeline, and integration tests converge everything at the end (Phase 242). Phases 236-237 are independent and can run in parallel. The 5-agent topology (AM-1 through AM-5) is defined in `.chipset/aminet-archive.yaml`.

## Phases

**Phase Numbering:**
- Continues from v1.25 (Phase 235). This milestone: Phases 236-242.
- Integer phases (236, 237, ...): Planned milestone work
- Decimal phases (237.1, 237.2): Urgent insertions if needed (marked with INSERTED)

- [x] **Phase 236: INDEX Infrastructure & Binary Parsers** - Parse Aminet's ~84,000-entry INDEX, build AmigaBinaryReader, and implement hunk/bootblock format parsers (completed 2026-02-19)
- [x] **Phase 237: Mirror State & Download Engine** - Selective package download with integrity verification, state tracking, and rate-limited HTTP fetching (completed 2026-02-19)
- [x] **Phase 238: Search, Browse & Collections** - Full-text search, category browsing, architecture filtering, and curated collection management (completed 2026-02-19)
- [ ] **Phase 239: Virus Scanner & Quarantine** - Signature-based scanning, heuristic hunk analysis, boot block detection, quarantine system, and scan orchestration
- [ ] **Phase 240: Installation & Archive Extraction** - LhA/LZX extraction, filesystem placement, dependency detection, scan gate enforcement, and tool validation
- [ ] **Phase 241: Emulator Configuration & Launch** - FS-UAE config generation, 5 hardware profiles, ROM management, WHDLoad integration, and state snapshots
- [ ] **Phase 242: Desktop Panel, Agent Pipeline & Integration** - GSD-OS browser panel, chipset YAML, 5-agent pipeline wiring, dashboard widget, and integration test suite

## Phase Details

### Phase 236: INDEX Infrastructure & Binary Parsers
**Goal**: Users can query Aminet's full ~84,000-package catalog offline after a single INDEX fetch, and the system can parse Amiga binary formats (hunks, boot blocks) needed by downstream scanning
**Depends on**: Nothing (first phase of v1.26)
**Requirements**: IDX-01, IDX-02, IDX-03, IDX-04, IDX-05, IDX-06, SCN-03, NFR-01, NFR-02
**Success Criteria** (what must be TRUE):
  1. User can fetch Aminet INDEX.gz from a configured mirror, and the system decompresses, parses, and stores all ~84,000 entries as queryable JSON
  2. User can view structured metadata for any package (filename, category, size, age, description from INDEX; Short, Author, Uploader, Type, Version, Requires, Architecture from .readme)
  3. System detects stale INDEX (>24h) and prompts for update; RECENT-based incremental update works without re-fetching the full INDEX
  4. AmigaOS hunk executable format parser correctly identifies HUNK_HEADER through HUNK_END with proper big-endian reads and memory flags handling (MEMF_CHIP/FAST, flags==3 extra dword)
  5. INDEX parsing completes in <10 seconds for the full catalog
**Plans**: 6 plans

Plans:
- [ ] 236-01: AmigaBinaryReader utility and hunk format parser (big-endian DataView, readHunkSize with memory flags, round-trip tests)
- [ ] 236-02: Boot block parser and signature scanning foundation (first 1024 bytes, trackdisk.device detection patterns)
- [ ] 236-03: INDEX fetcher (download INDEX.gz, decompress, validate format, handle ISO-8859-1 encoding)
- [ ] 236-04: INDEX parser (fixed-width column extraction, lenient parsing, JSON cache output, <10s performance target)
- [ ] 236-05: .readme metadata parser (structured header fields, free-form description, Zod schemas for all data types)
- [ ] 236-06: INDEX freshness and incremental update (24h staleness check, RECENT file parsing, merge into cached JSON)

### Phase 237: Mirror State & Download Engine
**Goal**: Users can selectively download Aminet packages with integrity verification, building a personal collection one package at a time with full state tracking across sessions
**Depends on**: Nothing (independent of Phase 236; can run in parallel)
**Requirements**: MIR-01, MIR-02, MIR-03, MIR-04, MIR-05, MIR-06, MIR-07, MIR-08, MIR-09, MIR-10, MIR-11, MIR-12, NFR-06
**Success Criteria** (what must be TRUE):
  1. User can download a package (.lha + .readme) from a configured mirror, with automatic fallback to alternate mirrors on failure
  2. Downloaded files are verified against INDEX metadata (file size) and stored with SHA-256 hashes; corrupted or truncated downloads are detected
  3. Mirror state persists in .mirror-state.json across sessions, tracking per-package status (not-mirrored, downloading, mirrored, scan-pending, clean, infected, installed)
  4. Bulk download processes collections with configurable concurrency (default: 2) and respects rate limits with User-Agent identification
  5. Interrupted downloads resume from last good state; upstream version changes are detected via INDEX comparison
**Plans**: 5 plans

Plans:
- [ ] 237-01-PLAN.md — Mirror state schemas and atomic persistence (PackageStatus/MirrorEntry/MirrorState Zod schemas, write-then-rename, per-package status enum)
- [ ] 237-02-PLAN.md — Single-package fetcher with mirror fallback (HTTP download, .lha + .readme, directory hierarchy preservation, User-Agent header)
- [ ] 237-03-PLAN.md — Integrity verification (file size vs INDEX with +/-1KB tolerance, SHA-256 computation via node:crypto, corruption detection)
- [x] 237-04-PLAN.md — Bulk download engine with barrel update (async semaphore concurrency, global rate limiting, resume interrupted batches, all Phase 237 exports) (completed 2026-02-19)
- [ ] 237-05-PLAN.md — Sync detection (compare local mirror state vs current INDEX, flag upstream version changes by sizeKb diff)

### Phase 238: Search, Browse & Collections
**Goal**: Users can discover Amiga software through full-text search, category browsing, and curated collections without network access
**Depends on**: Phase 236 (needs parsed INDEX data)
**Requirements**: SRH-01, SRH-02, SRH-03, SRH-04, SRH-05, SRH-06, COL-01, COL-02, COL-03, COL-04, COL-05
**Success Criteria** (what must be TRUE):
  1. User can search for "ProTracker" and get relevant results from mus/edit with substring matching across name, description, and author
  2. User can browse the category tree (biz/, comm/, demo/, etc.) with subcategory navigation and accurate package counts per category
  3. User can filter results by architecture (m68k-amigaos, ppc-amigaos) and OS version requirement
  4. User can view a package detail merging INDEX + .readme data, showing mirror status, scan status, and install status
  5. User can load the 5 starter collections (essential-utils, classic-games, demo-scene, music-mods, dev-tools), create custom collections, and export them as shareable YAML
**Plans**: 5 plans

Plans:
- [ ] 238-01: Full-text search engine (search across name, description, author; substring matching; basic relevance ranking)
- [ ] 238-02: Category browser (tree navigation, subcategory listing, package counts, architecture and OS version filters)
- [ ] 238-03: Package detail view (merge INDEX + .readme metadata, display mirror/scan/install status per package)
- [ ] 238-04: Collection format and starter collections (YAML manifest schema, 5 curated collections with package references and notes)
- [ ] 238-05: Collection manager (create/edit/delete custom collections, bulk operations, import/export as shareable YAML)

### Phase 239: Virus Scanner & Quarantine
**Goal**: Users can scan downloaded Amiga software for viruses through signature matching and heuristic analysis, with infected files quarantined and clean files cleared for installation
**Depends on**: Phase 236 (needs hunk parser and bootblock parser), Phase 237 (needs downloaded packages)
**Requirements**: SCN-01, SCN-02, SCN-04, SCN-05, SCN-06, SCN-07, SCN-08, SCN-09, SCN-10, SCN-11, SCN-12, SCN-13, NFR-03, NFR-09
**Success Criteria** (what must be TRUE):
  1. Signature scanner detects the 20 most common Amiga viruses (SCA, Byte Bandit, Lamer Exterminator, IRQ, BGS9, HNY96, Saddam, DASA, etc.) from a database of >=50 known patterns stored as extensible JSON
  2. Heuristic scanner detects anomalous hunk structures, boot block trackdisk.device access patterns, and known infection patterns, achieving >=80% boot block virus detection rate vs VirusZ reference
  3. Scan results report clean/suspicious/infected/unscanned status per file; signature scan completes in <2 seconds per package
  4. Quarantine system moves infected files to .quarantine/ with metadata; configurable scan depth (fast/standard/thorough) via scan-policy.yaml
  5. Batch scanning processes bulk downloads; emulated scanning via VirusZ III/CheckX runs inside headless FS-UAE with community checksum cross-reference
**Plans**: 6 plans

Plans:
- [ ] 239-01: Virus signature database (>=50 patterns: boot block, file virus, link virus; JSON format with name, type, byte pattern, offset, severity)
- [ ] 239-02: Signature scanner engine (context-aware scanning: boot block sigs on first 1024 bytes, hunk sigs on 0x000003F3 magic files; never scan raw compressed data)
- [ ] 239-03: Heuristic analysis engine (anomalous hunk ordering, suspicious first-hunk modifications, trackdisk.device patterns, vector table patching detection)
- [ ] 239-04: Quarantine system and scan results (ScanReport/ScanResult/ScanVerdict Zod schemas, atomic file moves to .quarantine/, per-file scan records with timestamps)
- [ ] 239-05: Scan orchestration and batch processing (configurable scan depth via scan-policy.yaml, batch scanning for bulk downloads, layer coordination)
- [ ] 239-06: Emulated scanning and community checksums (headless FS-UAE + VirusZ III/CheckX pipeline, SHA-256 cross-reference against known-good hashes, 60s timeout with manual review flag)

### Phase 240: Installation & Archive Extraction
**Goal**: Users can install scanned Amiga software into the emulated filesystem with proper path mapping, dependency awareness, and the scan gate preventing installation of unscanned or infected packages
**Depends on**: Phase 239 (needs scan gate), Phase 236 (needs binary parsers for .readme dependency parsing)
**Requirements**: INS-01, INS-02, INS-03, INS-04, INS-05, INS-06, INS-07, INS-08, INS-09, INS-10
**Success Criteria** (what must be TRUE):
  1. LhA archives (methods -lh0- through -lh7-) extract via lhasa, and LZX archives extract via unlzx, with path traversal prevention (canonicalize paths, strip Amiga volume syntax)
  2. Extracted files map to correct emulated Amiga filesystem locations (Libs->LIBS:, C->C:, Devs->DEVS:, S->S:, Fonts->FONTS:)
  3. System detects dependencies from .readme Requires field and reports missing dependencies to the user
  4. Installation is refused for unscanned packages (scan gate) and infected packages; suspicious packages require explicit user confirmation to override
  5. All installed files are tracked per package for clean uninstall; required extraction tools are checked at initialization with guidance if missing
**Plans**: 5 plans

Plans:
- [ ] 240-01: LhA extraction engine (lhasa shell-out via execFile, methods -lh0- through -lh7-, path traversal sanitization, temp directory extraction)
- [ ] 240-02: LZX extraction and tool validation (unlzx integration, graceful degradation, extraction tool presence check at init with install guidance)
- [ ] 240-03: Filesystem placement (Amiga assign path mapping, custom install paths from .readme, game directory structure creation)
- [ ] 240-04: Dependency detection and install tracking (parse .readme Requires field, cross-reference installed packages, track all placed files per package for uninstall)
- [ ] 240-05: Scan gate enforcement (refuse unscanned/infected packages, allow user override for suspicious with explicit confirmation, integration with scanner verdict)

### Phase 241: Emulator Configuration & Launch
**Goal**: Users can launch installed Amiga software in correctly configured FS-UAE instances with appropriate hardware profiles, ROMs, and WHDLoad support
**Depends on**: Phase 240 (needs installed software), Phase 239 (needs scan clearance for ROM validation context)
**Requirements**: EMU-01, EMU-02, EMU-03, EMU-04, EMU-05, EMU-06, EMU-07, EMU-08, EMU-09, EMU-10, NFR-05
**Success Criteria** (what must be TRUE):
  1. System generates valid FS-UAE configuration files from hardware profile YAML; all 5 profiles (A500, A1200, A1200+030, A4000, WHDLoad) produce bootable emulated systems
  2. ROM files are detected by scanning configurable directories, validated by CRC32/MD5 checksum against known versions, and selected appropriately for each hardware profile
  3. WHDLoad slave files are detected in installed packages and configured with correct Kickstart, memory, and preload settings from whdload_db.xml
  4. System auto-selects emulator profile from package .readme metadata (Architecture, Requires fields) and mounts the emulated hard drive containing installed software
  5. Emulator state snapshots save and restore correctly; missing ROMs produce clear guidance (not a crash) and no ROM files are distributed
**Plans**: 6 plans

Plans:
- [ ] 241-01: FS-UAE config generator (hardware profile YAML to UAE key-value mapping, cpu_type, chipset, memory, hard_drives, display)
- [ ] 241-02: Hardware profile library (A500/A1200/A1200+030/A4000/WHDLoad profiles as YAML with sensible defaults for display, sound, input)
- [ ] 241-03: ROM management (scan directories, validate checksums against known ROM database, select ROM for profile, Cloanto encrypted ROM support)
- [ ] 241-04: Software launch and profile auto-selection (select profile from .readme metadata, mount hard drive, configure startup, invoke FS-UAE)
- [ ] 241-05: WHDLoad integration (slave file detection, whdload_db.xml hardware requirements, Kickstart/memory configuration, preload tuning)
- [ ] 241-06: State management and ROM safety (save/restore emulator snapshots, clear missing-ROM guidance, enforce no ROM distribution)

### Phase 242: Desktop Panel, Agent Pipeline & Integration
**Goal**: The complete Aminet pipeline is wired end-to-end through the 5-agent team, with a Workbench-style browser panel in GSD-OS and dashboard integration, all verified by comprehensive tests
**Depends on**: Phases 236-241 (convergence point — all components must be stable)
**Requirements**: UI-01, UI-02, UI-03, UI-04, AGT-01, AGT-02, AGT-03, AGT-04, AGT-05, NFR-04, NFR-07, NFR-08, NFR-10
**Success Criteria** (what must be TRUE):
  1. Aminet browser panel renders in GSD-OS with Workbench-style aesthetic: search bar, category tree, results list, detail pane, and color-coded status indicators (green=clean, yellow=suspicious, red=infected, gray=not mirrored)
  2. Five agents (AM-1 Archive, AM-2 Mirror, AM-3 Scanner, AM-4 Installer, AM-5 Emulator) are defined with SKILL.md files following GSD skill format, and chipset YAML follows GSD conventions
  3. Pipeline team (aminet-pipeline.yaml) coordinates the full lifecycle: search -> select -> fetch -> scan -> install -> launch with scan gate enforcement and resource locks on .mirror-state.json and .quarantine/
  4. Test suite achieves >=80% code coverage with unit tests for parsers/scanners and integration tests for the download -> scan -> install pipeline
  5. Pack functions as standalone skill set with no modifications to GSD core; mirror dashboard widget shows accurate statistics in GSD planning docs
**Plans**: 7 plans

Plans:
- [ ] 242-01: Chipset YAML and agent definitions (aminet-archive.yaml with 5 agents AM-1 through AM-5, skill registration, pipeline topology, 7.0% token budget)
- [ ] 242-02: SKILL.md files for all 6 skills (aminet-index, aminet-browser, aminet-mirror, aminet-scanner, aminet-installer, aminet-emulator — all following GSD format)
- [ ] 242-03: Pipeline team coordination (aminet-pipeline.yaml, filesystem message bus, sync points, scan gate enforcement, resource locks)
- [ ] 242-04: Aminet browser panel for GSD-OS (Workbench-style window, search/category/results/detail panes, Topaz font, blue/white/orange palette)
- [ ] 242-05: Status indicators and dashboard widget (color-coded package status, mirror statistics widget for GSD dashboard)
- [ ] 242-06: Integration test suite (unit tests for parsers/scanners, integration tests for full pipeline, >=80% coverage target, offline mode verification)
- [ ] 242-07: Hardening and standalone verification (pack independence from GSD core, NFR compliance validation, documentation finalization)

## Progress

**Execution Order:**
Phases 236 and 237 can run in parallel (no dependencies). Then 238 -> 239 -> 240 -> 241 -> 242 in sequence.

```
Phase 236 ──┬──> Phase 238 (search needs parsed INDEX)
             │
             └──> Phase 239 (scanner needs hunk/bootblock parsers)
                       │
Phase 237 ──────> 239  │ (scanner needs downloaded packages)
                       │
                       └──> Phase 240 (installer needs scan gate)
                                 │
                                 └──> Phase 241 (emulator needs installed software + ROM management)
                                           │
                                           └──> Phase 242 (integration needs all components)
```

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 236. INDEX Infrastructure & Binary Parsers | 6/6 | Complete    | 2026-02-19 |
| 237. Mirror State & Download Engine | 5/5 | Complete    | 2026-02-19 |
| 238. Search, Browse & Collections | 5/5 | Complete   | 2026-02-19 |
| 239. Virus Scanner & Quarantine | 0/6 | Not started | - |
| 240. Installation & Archive Extraction | 0/5 | Not started | - |
| 241. Emulator Configuration & Launch | 0/6 | Not started | - |
| 242. Desktop Panel, Agent Pipeline & Integration | 0/7 | Not started | - |

---
*Roadmap created: 2026-02-19*
*Milestone: v1.26 — Aminet Archive Extension Pack (Phases 236-242, 40 plans)*
