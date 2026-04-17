# Retrospective — v1.49.7

## What Worked

- **Runtime detection over build-time feature flags.** Using `command -v` on Unix and `where.exe` on Windows means the same binary works regardless of what's installed -- no separate "with-tmux" and "without-tmux" builds.
- **FileWatcher dependency correction caught a Rust/TypeScript graph divergence.** The FileWatcher declared `[Tmux]` as a dependency in one language but not the other. Fixing this in a dedicated patch keeps the dependency graph honest across both language boundaries.

## What Could Be Better

- **This should have been part of v1.49.6 (macOS compatibility).** The tmux-optional work is a natural companion to the Bash 3.2 fixes -- both are about making the system work on environments that don't have Linux-centric tooling.

## Lessons Learned

1. **Every external tool dependency should have a fallback path.** tmux, like any CLI tool, may not be installed. The raw PTY fallback pattern is reusable for any optional external dependency.
2. **Dependency graphs must be identical across language boundaries.** When Rust and TypeScript both model the same service dependency graph, divergences are silent bugs that corrupt orchestration logic.
