# Requirements: GSD Skill Creator

**Defined:** 2026-02-19
**Core Value:** Skills, agents, and teams must match official Claude Code patterns — and the GSD ecosystem must provide spatial, visual, and operational tools that make complex system design tangible.

## v1.26 Requirements — Aminet Archive Extension Pack

Requirements for the Aminet archive management system. Each maps to roadmap phases.

### INDEX Management

- [x] **IDX-01**: System shall download Aminet INDEX.gz from configurable HTTP mirrors, decompress, and validate format
- [ ] **IDX-02**: INDEX parser shall extract filename, category, subcategory, size, age, and description from all ~84,000 entries
- [x] **IDX-03**: System shall parse `.readme` files extracting Short, Author, Uploader, Type, Version, Requires, and Architecture fields
- [ ] **IDX-04**: Parsed INDEX data shall be stored as JSON for offline querying
- [ ] **IDX-05**: INDEX shall be considered stale after 24 hours; system shall prompt for update
- [ ] **IDX-06**: System shall support incremental update via RECENT file

### Search & Browse

- [ ] **SRH-01**: Full-text search across package name, description, and author fields
- [ ] **SRH-02**: Category tree browsing with subcategory navigation and package counts
- [ ] **SRH-03**: Filter by architecture (m68k-amigaos, ppc-amigaos, etc.)
- [ ] **SRH-04**: Filter by OS version requirement
- [ ] **SRH-05**: Package detail view showing merged INDEX + .readme metadata
- [ ] **SRH-06**: Display mirror status, scan status, and install status per package

### Collections

- [ ] **COL-01**: Curated collection format as YAML manifest with package references
- [ ] **COL-02**: Ship 5 starter collections (essential-utils, classic-games, demo-scene, music-mods, dev-tools)
- [ ] **COL-03**: Users can create, edit, and delete custom collections
- [ ] **COL-04**: Collections support bulk operations (fetch all, scan all)
- [ ] **COL-05**: Collections exportable as shareable YAML for other GSD-OS users

### Mirror Management

- [ ] **MIR-01**: Download individual packages (.lha + .readme) from Aminet HTTP mirrors
- [ ] **MIR-02**: Support configurable mirror list with fallback ordering
- [ ] **MIR-03**: Preserve Aminet directory hierarchy in local mirror
- [ ] **MIR-04**: Verify downloaded file size against INDEX metadata
- [ ] **MIR-05**: Compute and store SHA-256 hash of all downloaded files
- [ ] **MIR-06**: Track per-package state: not-mirrored, downloading, mirrored, scan-pending, clean, infected, installed
- [ ] **MIR-07**: Persist mirror state to `.mirror-state.json` across sessions
- [ ] **MIR-08**: Bulk download with configurable concurrency limit (default: 2)
- [ ] **MIR-09**: Resume interrupted downloads
- [ ] **MIR-10**: Detect upstream version changes via INDEX comparison
- [ ] **MIR-11**: Include User-Agent identification in HTTP requests
- [ ] **MIR-12**: Respect rate limiting — configurable request delay between downloads

### Virus Scanning

- [ ] **SCN-01**: Signature-based scanning against a database of >=50 known Amiga virus byte patterns
- [ ] **SCN-02**: Detect the 20 most common Amiga viruses by signature (SCA, Byte Bandit, Lamer Exterminator, IRQ, BGS9, HNY96, Saddam, DASA, etc.)
- [ ] **SCN-03**: Parse AmigaOS hunk executable format (HUNK_HEADER through HUNK_END)
- [ ] **SCN-04**: Heuristic analysis detecting anomalous hunk structures and known infection patterns
- [ ] **SCN-05**: Boot block analysis detecting unauthorized trackdisk.device access patterns
- [ ] **SCN-06**: Quarantine system — move infected files to `.quarantine/` with metadata
- [ ] **SCN-07**: Scan results: clean / suspicious / infected / unscanned status per file
- [ ] **SCN-08**: Emulated scanning via VirusZ III / CheckX inside headless FS-UAE
- [ ] **SCN-09**: Community checksum cross-reference against known-good hashes
- [ ] **SCN-10**: Configurable scan depth via scan-policy.yaml (fast/standard/thorough)
- [ ] **SCN-11**: Batch scanning for bulk download processing
- [ ] **SCN-12**: Signature database stored as extensible JSON — new signatures addable by dropping files
- [ ] **SCN-13**: Heuristic scanner achieves >=80% boot block virus detection rate vs VirusZ reference

### Installation

- [ ] **INS-01**: Extract LhA archives (methods -lh0- through -lh7-) via `lha` or `lhasa`
- [ ] **INS-02**: Extract LZX archives via `unlzx`
- [ ] **INS-03**: Map extracted files to emulated Amiga filesystem paths (Libs->LIBS:, C->C:, etc.)
- [ ] **INS-04**: Detect dependencies from .readme `Requires:` field
- [ ] **INS-05**: Report missing dependencies to user
- [ ] **INS-06**: Track all installed files per package for clean uninstall
- [ ] **INS-07**: Refuse installation of unscanned packages (scan gate)
- [ ] **INS-08**: Refuse installation of infected packages
- [ ] **INS-09**: Allow user override for suspicious packages with explicit confirmation
- [ ] **INS-10**: Check for required extraction tools at initialization, guide user to install if missing

### Emulator Integration

- [ ] **EMU-01**: Generate valid FS-UAE configuration files from hardware profile YAML
- [ ] **EMU-02**: Ship 5 hardware profiles: A500, A1200, A1200+030, A4000, WHDLoad
- [ ] **EMU-03**: Detect and validate Kickstart ROM files by CRC32/MD5
- [ ] **EMU-04**: Select appropriate ROM version for hardware profile
- [ ] **EMU-05**: Mount emulated hard drive containing installed software
- [ ] **EMU-06**: Auto-select emulator profile from package .readme metadata
- [ ] **EMU-07**: WHDLoad slave file detection and configuration
- [ ] **EMU-08**: Save/restore emulator state snapshots
- [ ] **EMU-09**: Provide clear guidance when required ROM is missing
- [ ] **EMU-10**: Do NOT distribute Kickstart ROM files

### User Interface

- [ ] **UI-01**: Aminet browser panel in GSD-OS with search, category tree, results, and detail pane
- [ ] **UI-02**: Status indicators: green (clean), yellow (suspicious), red (infected), gray (not mirrored)
- [ ] **UI-03**: Mirror statistics widget for GSD dashboard
- [ ] **UI-04**: Workbench-style window aesthetic consistent with GSD-OS design

### Agent & Team Architecture

- [ ] **AGT-01**: Five agents defined: AM-1 Archive, AM-2 Mirror, AM-3 Scanner, AM-4 Installer, AM-5 Emulator
- [ ] **AGT-02**: Team pipeline (aminet-pipeline.yaml) coordinating all agents through the full lifecycle
- [ ] **AGT-03**: Scan gate enforced — pipeline blocks installation if scan status != clean
- [ ] **AGT-04**: Resource locks on .mirror-state.json and .quarantine/
- [ ] **AGT-05**: Filesystem message bus for inter-agent communication

### Non-Functional

- [ ] **NFR-01**: All operations work offline after initial INDEX fetch (search, browse, scan, install from cached data)
- [ ] **NFR-02**: INDEX parsing completes in <10 seconds for full ~84,000 entries
- [ ] **NFR-03**: Signature scan of a single package completes in <2 seconds
- [ ] **NFR-04**: Test suite achieves >=80% code coverage
- [ ] **NFR-05**: No Kickstart ROM files distributed with the pack
- [ ] **NFR-06**: Mirror downloads identify as GSD-Aminet-Pack and respect rate limits
- [ ] **NFR-07**: All SKILL.md files follow GSD skill format specification
- [ ] **NFR-08**: All agent YAML follows GSD chipset architecture conventions
- [ ] **NFR-09**: Virus signature database extensible without code changes
- [ ] **NFR-10**: Pack functions as standalone skill set — no modifications to GSD core required

## Future Requirements

Deferred beyond v1.26. Tracked but not in current roadmap.

### Extended Platform Support
- **FUT-01**: PPC / AmigaOS 4.x / MorphOS / AROS package support (v1.26 is m68k-amigaos only)
- **FUT-02**: ADF floppy image creation from installed software
- **FUT-03**: Aminet upload capability (v1.26 is download-only)
- **FUT-04**: Integration with third-party Amiga package managers (AmiUpdate, etc.)
- **FUT-05**: CD-ROM image mounting for Aminet CD collections

### Advanced Features
- **FUT-06**: Full Aminet mirror (v1.26 is selective mirror only)
- **FUT-07**: Automatic dependency resolution across packages (v1.26 detects but doesn't auto-fetch)
- **FUT-08**: Real-time network multiplayer through emulated serial ports
- **FUT-09**: Full GSD-OS security module (v1.26 scans Aminet packages only)
- **FUT-10**: MOD/MED music format parsing and playback

## Out of Scope

| Feature | Reason |
|---------|--------|
| Amiga OS installation/configuration | Assumes working emulated system |
| Hardware ROM extraction tools | Legal liability; users must acquire ROMs independently |
| Kickstart ROM distribution | Legal requirement — pack does NOT distribute ROMs |
| Full 60GB Aminet mirror | Selective mirror is the design — users curate their own collection |
| PPC/OS4/MorphOS support | m68k-amigaos only for v1; platform detection exists for future |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| IDX-01 | Phase 236 | Complete |
| IDX-02 | Phase 236 | Pending |
| IDX-03 | Phase 236 | Complete |
| IDX-04 | Phase 236 | Pending |
| IDX-05 | Phase 236 | Pending |
| IDX-06 | Phase 236 | Pending |
| SRH-01 | Phase 238 | Pending |
| SRH-02 | Phase 238 | Pending |
| SRH-03 | Phase 238 | Pending |
| SRH-04 | Phase 238 | Pending |
| SRH-05 | Phase 238 | Pending |
| SRH-06 | Phase 238 | Pending |
| COL-01 | Phase 238 | Pending |
| COL-02 | Phase 238 | Pending |
| COL-03 | Phase 238 | Pending |
| COL-04 | Phase 238 | Pending |
| COL-05 | Phase 238 | Pending |
| MIR-01 | Phase 237 | Pending |
| MIR-02 | Phase 237 | Pending |
| MIR-03 | Phase 237 | Pending |
| MIR-04 | Phase 237 | Pending |
| MIR-05 | Phase 237 | Pending |
| MIR-06 | Phase 237 | Pending |
| MIR-07 | Phase 237 | Pending |
| MIR-08 | Phase 237 | Pending |
| MIR-09 | Phase 237 | Pending |
| MIR-10 | Phase 237 | Pending |
| MIR-11 | Phase 237 | Pending |
| MIR-12 | Phase 237 | Pending |
| SCN-01 | Phase 239 | Pending |
| SCN-02 | Phase 239 | Pending |
| SCN-03 | Phase 236 | Pending |
| SCN-04 | Phase 239 | Pending |
| SCN-05 | Phase 239 | Pending |
| SCN-06 | Phase 239 | Pending |
| SCN-07 | Phase 239 | Pending |
| SCN-08 | Phase 239 | Pending |
| SCN-09 | Phase 239 | Pending |
| SCN-10 | Phase 239 | Pending |
| SCN-11 | Phase 239 | Pending |
| SCN-12 | Phase 239 | Pending |
| SCN-13 | Phase 239 | Pending |
| INS-01 | Phase 240 | Pending |
| INS-02 | Phase 240 | Pending |
| INS-03 | Phase 240 | Pending |
| INS-04 | Phase 240 | Pending |
| INS-05 | Phase 240 | Pending |
| INS-06 | Phase 240 | Pending |
| INS-07 | Phase 240 | Pending |
| INS-08 | Phase 240 | Pending |
| INS-09 | Phase 240 | Pending |
| INS-10 | Phase 240 | Pending |
| EMU-01 | Phase 241 | Pending |
| EMU-02 | Phase 241 | Pending |
| EMU-03 | Phase 241 | Pending |
| EMU-04 | Phase 241 | Pending |
| EMU-05 | Phase 241 | Pending |
| EMU-06 | Phase 241 | Pending |
| EMU-07 | Phase 241 | Pending |
| EMU-08 | Phase 241 | Pending |
| EMU-09 | Phase 241 | Pending |
| EMU-10 | Phase 241 | Pending |
| UI-01 | Phase 242 | Pending |
| UI-02 | Phase 242 | Pending |
| UI-03 | Phase 242 | Pending |
| UI-04 | Phase 242 | Pending |
| AGT-01 | Phase 242 | Pending |
| AGT-02 | Phase 242 | Pending |
| AGT-03 | Phase 242 | Pending |
| AGT-04 | Phase 242 | Pending |
| AGT-05 | Phase 242 | Pending |
| NFR-01 | Phase 236 | Pending |
| NFR-02 | Phase 236 | Pending |
| NFR-03 | Phase 239 | Pending |
| NFR-04 | Phase 242 | Pending |
| NFR-05 | Phase 241 | Pending |
| NFR-06 | Phase 237 | Pending |
| NFR-07 | Phase 242 | Pending |
| NFR-08 | Phase 242 | Pending |
| NFR-09 | Phase 239 | Pending |
| NFR-10 | Phase 242 | Pending |

**Coverage:**
- v1.26 requirements: 81 total
- Mapped to phases: 81
- Unmapped: 0

**Per-phase breakdown:**
- Phase 236: 9 requirements (IDX-01..06, SCN-03, NFR-01, NFR-02)
- Phase 237: 13 requirements (MIR-01..12, NFR-06)
- Phase 238: 11 requirements (SRH-01..06, COL-01..05)
- Phase 239: 14 requirements (SCN-01, SCN-02, SCN-04..13, NFR-03, NFR-09)
- Phase 240: 10 requirements (INS-01..10)
- Phase 241: 11 requirements (EMU-01..10, NFR-05)
- Phase 242: 13 requirements (UI-01..04, AGT-01..05, NFR-04, NFR-07, NFR-08, NFR-10)

---
*Requirements defined: 2026-02-19*
*Last updated: 2026-02-19 after roadmap creation — 81/81 requirements mapped*
