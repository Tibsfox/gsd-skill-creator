# v1.49.7 — Optional tmux with Graceful Degradation

**Shipped:** 2026-03-01
**Type:** Patch

## Summary

Makes tmux fully optional across the entire stack (Rust, TypeScript, shell scripts, packaging). When tmux is unavailable the desktop terminal falls back to a raw PTY, and the bootstrap flow handles optional service failures gracefully. Fixes a Rust/TypeScript divergence in FileWatcher dependency declarations.

## Key Changes

- Cross-platform detection: `command -v` on Unix, `where.exe` on Windows
- Desktop terminal falls back to raw PTY when tmux is unavailable
- Bootstrap flow handles optional service failures gracefully
- FileWatcher deps corrected from `[Tmux]` to `[]` (fixes Rust/TS graph divergence)
- 5 Rust tests updated for corrected dependency graph structure

## Design Decisions

- **Detection over assumption**: Runtime `command -v` / `where.exe` probing rather than build-time feature flags ensures correct behavior regardless of install state
- **Graceful degradation over hard failure**: Every tmux call site has a non-tmux fallback path, so the desktop app works on minimal environments
