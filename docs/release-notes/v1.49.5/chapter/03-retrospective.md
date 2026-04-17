# Retrospective — v1.49.5

## What Worked

- **8-phase decomposition with machine-readable manifest.** The `moves.json` with 21 entries and per-move impact analysis turned a complex reorganization into auditable, repeatable steps. Phase 460's audit-before-move discipline prevented blind refactoring.
- **Dual XDG implementations (TypeScript + Rust) with identical semantics.** Both `src/fs/xdg.ts` and `src-tauri/src/xdg.rs` reject relative paths and handle missing `XDG_RUNTIME_DIR` the same way. The Rust/TypeScript parity eliminates a class of cross-boundary bugs.
- **Linux integration files follow real ecosystem conventions.** scdoc man pages, shell completions for 3 shells, .desktop entry, AppStream metadata, systemd service -- this is what actual Linux packages ship. The Alacritty `extra/` directory model was the right reference.
- **Zero regressions across 19,222 tests after moving 103 files.** The stale path sweep confirming zero old-path references is the kind of verification that makes large refactors trustworthy.

## What Could Be Better

- **Root directories went from 33 to 26 -- still high.** The consolidation removed 7 directories but 26 root-level entries is still a lot for a new contributor to parse. The `data/` consolidation (schemas, chipset, citations) was the right pattern -- more could follow.
- **Debian and RPM packaging infrastructure is speculative.** The packaging files are correct but untested in actual build environments (no CI for `.deb` or `.rpm` builds). They could drift from reality silently.

## Lessons Learned

1. **Audit-then-move with a machine-readable manifest is the safe way to reorganize a repository.** The `moves.json` approach from Phase 460 should be the template for any future large-scale file reorganization.
2. **FHS 3.0 + XDG compliance earns ecosystem integration for free.** Standard paths mean standard tooling (package managers, desktop environments, systemd) works without custom integration.
3. **Stale path sweeps after reorganization are non-negotiable.** A grep audit confirming zero remaining hardcoded old paths is the only way to trust that a large move is complete.
4. **scdoc over groff is the right choice for modern Linux projects.** Readable source, used by the Sway/wlroots ecosystem, and produces correct man pages without groff macros.
