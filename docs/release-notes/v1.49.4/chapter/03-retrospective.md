# Retrospective — v1.49.4

## What Worked

- **Purely additive design kept risk at zero.** No existing files moved or renamed -- four new zone directories (`projects/`, `contrib/`, `packs/`, `www/`) with self-documenting READMEs. Zero regressions possible because zero existing code was touched.
- **Zod validation for `.sc-config.json` catches bad configs at parse time.** Unknown fields rejected, relative external paths rejected, human-readable errors naming the offending field. Config-as-code with proper validation is a pattern that scales.
- **Path traversal prevention before any filesystem operation.** Rejecting `..`, `/`, `\` in project names is the correct security boundary for a CLI that creates directories.
- **Works with zero configuration.** Sensible defaults when no config exists means the feature is immediately useful without asking users to write JSON first.

## What Could Be Better

- **97 tests across 7 files for ~630 LOC of source.** The test-to-source ratio (15%) is healthy, but the CLI commands (280 LOC) have proportionally less coverage than the core modules.
- **Four new top-level directories add cognitive load.** Going from an already-crowded root to adding `projects/`, `contrib/`, `packs/`, `www/` works architecturally but increases the surface area a new contributor must understand.

## Lessons Learned

1. **Purely additive changes are the safest way to introduce structural features.** By creating new directories rather than moving existing files, the 97 new tests only need to validate new behavior -- no regression surface.
2. **Config schemas should work with zero configuration and fail loudly with bad configuration.** The Zod validation + defaults pattern in `.sc-config.json` is reusable across the project.
3. **Filesystem management layers need explicit path traversal prevention.** Any module that creates directories from user input must validate names before touching the filesystem.
