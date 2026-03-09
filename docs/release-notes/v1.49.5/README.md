# v1.49.5 — Project Filesystem Reorganization

**Shipped:** 2026-02-27
**Phases:** 8 (460-467) | **Plans:** 17 | **Commits:** 14
**Requirements:** 49 | **Tests:** 19,222 (+37 new) | **Files Changed:** 103 (+1,334/-829)

## Summary

Deep refactor of the entire repository filesystem to follow Linux open source conventions (FHS 3.0, XDG Base Directory Specification). Reduced root directories from 33 to 26, added Linux integration files (man pages, shell completions, desktop entry, systemd service), created Debian and RPM packaging infrastructure, implemented XDG Base Directory utilities in TypeScript and Rust, and verified zero regressions across 19,222 tests.

## Key Features

### Phase 460: Audit & Design
- Complete audit of all 33 root directories (27 visible + 6 hidden) with disposition for each
- Target layout design specifying 21 visible + 5 hidden directories
- Machine-readable moves.json manifest with 21 entries and per-move impact analysis

### Phase 461: Linux Integration
- 3 scdoc man pages: gsd-os(1), skill-creator(1), sc-config(5)
- Shell completions for bash, zsh, and fish covering all `sc` subcommands
- .desktop entry following freedesktop.org specification
- AppStream appdata.xml for software center integration
- systemd user service unit for headless agent mode
- Logo directory with placeholder and icon reference

### Phase 462: Packaging Infrastructure
- Debian packaging (packaging/debian/): control, rules, changelog, copyright, compat, source/format for Ubuntu 22.04+
- RPM spec file (packaging/rpm/gsd-os.spec) with correct BuildRequires for CentOS Stream 9+
- Both install man pages, completions, desktop files, and systemd unit to FHS-correct paths

### Phase 463: Root Cleanup
- bootstrap.sh and serve-dashboard.mjs moved to scripts/ via git mv
- README-integration.md moved to docs/INTEGRATION.md
- CLAUDE.md.legacy and root screenshots deleted
- CONTRIBUTING.md created with fork/clone/test/commit workflow
- .editorconfig created for TS, Rust, MD, YAML, JSON
- Makefile created with build, test, lint, desktop, clean, verify, man targets

### Phase 464: Directory Consolidation
- schemas/ merged into data/schemas/ with all references updated
- test-fixtures/ merged into test/fixtures/ with all test imports updated
- .chipset/ and .citations/ moved to data/chipset/ and data/citations/
- config/ and configs/ unified into single config/ with profiles/ absorbed
- archive/ hidden as .archive/ (gitignored)
- dashboard/ and minecraft/ relocated to infra/dashboard/ and infra/minecraft/
- bin/ merged into scripts/bin/

### Phase 465: XDG Compliance
- src/fs/xdg.ts: TypeScript XDG utility with configDir, dataDir, stateDir, cacheDir, runtimeDir
- src-tauri/src/xdg.rs: Rust XDG utility using dirs crate
- Relative paths in XDG env variables correctly ignored with fallback to defaults
- XDG_RUNTIME_DIR returns undefined/None when unset (no fallback)
- Grep audit confirmed zero remaining hardcoded home directory paths

### Phase 466: Reference Updates
- .gitignore updated with no orphaned rules
- docs/FILE-STRUCTURE.md rewritten to reflect new layout
- CLAUDE.md key file locations updated
- INSTALL.md updated with new script paths and Makefile targets
- Stale path sweep confirmed zero old-path references

### Phase 467: Verification
- `npx tsc --noEmit` — 0 errors
- `cd desktop && npx tsc --noEmit` — 0 errors
- `cd src-tauri && cargo check` — 0 new warnings
- `npm test` — 19,222 tests passed, 0 failures
- Root directory: 21 visible + 5 hidden = 26 total
- 17/17 new files validated present and well-formed

## Design Decisions

- **Alacritty extra/ model**: extra/man/, extra/completions/, extra/linux/, extra/systemd/, extra/logo/ mirrors Wayland ecosystem conventions
- **scdoc over groff**: Modern, readable man page source format used by Sway/wlroots ecosystem
- **FHS 3.0 + XDG compliance**: Standard Linux conventions earn ecosystem integration for free
- **data/ consolidation**: Single location for static project data (schemas, chipset, citations)
- **XDG relative path rejection**: Both implementations ignore relative paths, preventing path traversal

## Retrospective

### What Worked
- **8-phase decomposition with machine-readable manifest.** The `moves.json` with 21 entries and per-move impact analysis turned a complex reorganization into auditable, repeatable steps. Phase 460's audit-before-move discipline prevented blind refactoring.
- **Dual XDG implementations (TypeScript + Rust) with identical semantics.** Both `src/fs/xdg.ts` and `src-tauri/src/xdg.rs` reject relative paths and handle missing `XDG_RUNTIME_DIR` the same way. The Rust/TypeScript parity eliminates a class of cross-boundary bugs.
- **Linux integration files follow real ecosystem conventions.** scdoc man pages, shell completions for 3 shells, .desktop entry, AppStream metadata, systemd service -- this is what actual Linux packages ship. The Alacritty `extra/` directory model was the right reference.
- **Zero regressions across 19,222 tests after moving 103 files.** The stale path sweep confirming zero old-path references is the kind of verification that makes large refactors trustworthy.

### What Could Be Better
- **Root directories went from 33 to 26 -- still high.** The consolidation removed 7 directories but 26 root-level entries is still a lot for a new contributor to parse. The `data/` consolidation (schemas, chipset, citations) was the right pattern -- more could follow.
- **Debian and RPM packaging infrastructure is speculative.** The packaging files are correct but untested in actual build environments (no CI for `.deb` or `.rpm` builds). They could drift from reality silently.

## Lessons Learned

1. **Audit-then-move with a machine-readable manifest is the safe way to reorganize a repository.** The `moves.json` approach from Phase 460 should be the template for any future large-scale file reorganization.
2. **FHS 3.0 + XDG compliance earns ecosystem integration for free.** Standard paths mean standard tooling (package managers, desktop environments, systemd) works without custom integration.
3. **Stale path sweeps after reorganization are non-negotiable.** A grep audit confirming zero remaining hardcoded old paths is the only way to trust that a large move is complete.
4. **scdoc over groff is the right choice for modern Linux projects.** Readable source, used by the Sway/wlroots ecosystem, and produces correct man pages without groff macros.
