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

## Retrospective

### What Worked
- **Runtime detection over build-time feature flags.** Using `command -v` on Unix and `where.exe` on Windows means the same binary works regardless of what's installed -- no separate "with-tmux" and "without-tmux" builds.
- **FileWatcher dependency correction caught a Rust/TypeScript graph divergence.** The FileWatcher declared `[Tmux]` as a dependency in one language but not the other. Fixing this in a dedicated patch keeps the dependency graph honest across both language boundaries.

### What Could Be Better
- **This should have been part of v1.49.6 (macOS compatibility).** The tmux-optional work is a natural companion to the Bash 3.2 fixes -- both are about making the system work on environments that don't have Linux-centric tooling.

## Lessons Learned

1. **Every external tool dependency should have a fallback path.** tmux, like any CLI tool, may not be installed. The raw PTY fallback pattern is reusable for any optional external dependency.
2. **Dependency graphs must be identical across language boundaries.** When Rust and TypeScript both model the same service dependency graph, divergences are silent bugs that corrupt orchestration logic.
