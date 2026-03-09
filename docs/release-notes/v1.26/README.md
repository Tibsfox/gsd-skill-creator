# v1.26 — Aminet Archive Extension Pack

**Shipped:** 2026-02-19
**Phases:** 236-242 (7 phases) | **Plans:** 40 | **Commits:** 91 | **Requirements:** 81 | **Tests:** 10,032 | **LOC:** ~23,616

Build a complete Aminet archive management system — INDEX parsing for ~84,000 packages, selective mirroring with integrity verification, full-text search and curated collections, pure TypeScript virus scanning, LhA/LZX extraction with Amiga filesystem mapping, FS-UAE emulator integration, and GSD-OS desktop panel with 5-agent pipeline orchestration.

### Key Features

**INDEX Infrastructure & Binary Parsers (Phase 236):**
- Aminet INDEX.gz download, decompression, and fixed-width column parsing for ~84,000 entries
- .readme metadata extractor (Short, Author, Uploader, Type, Version, Requires, Architecture)
- JSON cache with 24-hour staleness detection and RECENT-based incremental updates
- AmigaBinaryReader for big-endian hunk executables (HUNK_HEADER through HUNK_END)
- Boot block parser with trackdisk.device detection patterns

**Mirror State & Download Engine (Phase 237):**
- 7-state per-package lifecycle (not-mirrored → downloading → mirrored → scan-pending → clean/infected → installed)
- Atomic JSON persistence with write-then-rename pattern
- Rate-limited HTTP fetching with configurable concurrency and User-Agent identification
- SHA-256 integrity verification for all downloaded files
- Configurable mirror list with fallback ordering

**Search, Browse & Collections (Phase 238):**
- 3-tier relevance-ranked full-text search (name=3x, description=2x, author=1x)
- Hierarchical category tree with subcategory navigation and package counts
- Architecture and OS version filtering
- Unified PackageDetail view merging INDEX + .readme + mirror state
- YAML collection format with 5 starter sets (31 packages total)
- CRUD collection manager with atomic persistence and bulk operations

**Virus Scanner & Quarantine (Phase 239):**
- 52 byte-pattern signatures across 3 families (14 boot block, 6 file, 32 link virus)
- Context-aware scanning: bootblock sigs scan first 1024 bytes, file/link sigs scan hunk files
- 4-rule heuristic hunk analysis (small first hunk, anomalous ordering, excessive relocations, suspicious entry point)
- 4-rule boot block analysis (virus pattern, suspicious bootcode, resident install, trackdisk without vector)
- Quarantine with atomic file moves and JSON metadata sidecars
- 3-layer scan orchestrator with configurable depth policies (fast/standard/thorough)
- Emulated scanning via FS-UAE and community checksum cross-reference

**Installation & Archive Extraction (Phase 240):**
- LhA extraction via lhasa with path traversal prevention (Zip-Slip)
- LZX extraction via unlzx with cwd workaround (no output directory flag)
- 11-assign Amiga filesystem mapper (case-insensitive C:/LIBS:/DEVS:/S:/L:/FONTS:/T:/LOCALE:/CLASSES:/REXX:/PREFS:)
- Dependency detector classifying 5 types from .readme Requires (package, os_version, hardware, library, unknown)
- Install tracker with per-package JSON manifests and clean uninstall
- Scan gate enforcing security policy (refuse unscanned, refuse infected, user override for suspicious)
- Tool validator with platform-specific install guidance

**Emulator Configuration & Launch (Phase 241):**
- FS-UAE config generator with sorted key-value output and path normalization
- 5 hardware profiles: A500 (OCS/68000/KS1.3), A1200 (AGA/68EC020/KS3.1), A1200+030 (68030/8MB fast), A4000 (68040/8MB fast), WHDLoad (A1200+8MB fast)
- Self-contained CRC32 ROM scanner (IEEE polynomial, no npm dependency)
- Cloanto encrypted ROM support (cyclic XOR decryption)
- Priority-based profile auto-selection from .readme metadata
- WHDLoad slave detection with per-game hardware overrides
- 9-slot state snapshot system with directory hard drive safety detection

**Desktop Panel, Agent Pipeline & Integration (Phase 242):**
- Chipset YAML defining 5 agents (AM-1 through AM-5), 6 skills, pipeline team, 7% token budget
- 6 SKILL.md files following GSD pack format specification
- 5-stage pipeline orchestrator with scan gate enforcement
- 4-pane Workbench-style browser panel (search bar, category tree, results, detail)
- 4-color status indicators (green/yellow/red/gray)
- Mirror statistics dashboard widget
- 14-test cross-module integration suite
- Standalone pack compliance verified (no GSD core modifications)

## Retrospective

### What Worked
- **Pure TypeScript virus scanner with 52 byte-pattern signatures.** No external antivirus dependency, no native binaries -- just pattern matching on boot blocks, hunk files, and link virus signatures. The 3-layer scan orchestrator (fast/standard/thorough) gives users control over the tradeoff between speed and completeness.
- **7-state package lifecycle with atomic persistence.** not-mirrored → downloading → mirrored → scan-pending → clean/infected → installed is a clear, auditable state machine. The write-then-rename atomic persistence pattern prevents corrupted state on crash.
- **Self-contained CRC32 ROM scanner without npm dependencies.** Building IEEE polynomial CRC32 from scratch instead of pulling in a package shows commitment to minimizing external dependencies, especially for security-sensitive code that validates ROM integrity.
- **Standalone pack compliance.** The entire Aminet system was built without modifying GSD core. 6 SKILL.md files, 5 agents, pipeline team, chipset YAML -- all self-contained. This validates the pack architecture's extensibility.

### What Could Be Better
- **~23,616 LOC in one release is substantial.** The 7-phase, 91-commit scope covers INDEX parsing, downloading, searching, scanning, extraction, emulation, and desktop integration. This is effectively a complete package manager built in one milestone.
- **LhA/LZX extraction depends on external tools (lhasa, unlzx).** The tool validator with platform-specific install guidance mitigates this, but the system isn't fully self-contained for archive extraction the way it is for virus scanning.

## Lessons Learned

1. **Scan gates at installation boundaries are the right security architecture.** Refusing to install unscanned packages and refusing infected ones means the security check is mandatory, not optional. The user override for suspicious (but not infected) packages preserves agency without compromising safety.
2. **Aminet INDEX.gz parsing for ~84,000 entries proves the architecture handles scale.** Fixed-width column parsing with JSON cache and 24-hour staleness detection means the initial load is slow but subsequent access is fast. RECENT-based incremental updates avoid re-downloading the full index.
3. **WHDLoad slave detection with per-game hardware overrides shows the depth of Amiga domain knowledge.** The 5 hardware profiles (A500 through WHDLoad) with priority-based auto-selection from .readme metadata mean most packages just work without manual configuration.
4. **Cloanto encrypted ROM support via cyclic XOR decryption.** Supporting both free (AROS) and commercial (Cloanto) ROMs means the system works for all users without requiring piracy. The CRC32 verification ensures ROM integrity regardless of source.

---
