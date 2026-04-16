# v1.49.551 — Cartridge Tarball Fix

**Released:** 2026-04-15
**Branch:** dev
**Type:** Patch — ship-blocker fix for v1.49.550 npm publish
**New deps:** 0

## Summary

Patch release on top of v1.49.550. The v1.49.550 npm publish shipped
only `dist/` and `project-claude/` in the tarball, so
`installCartridgeDir` warned *"Cartridge source directory missing"* for
all four cartridges (`../examples/cartridges/*`) whenever the package
was installed via `npx`. v1.49.551 adds the four cartridge source
directories to the package `files` array so `@latest` on npm points at
a working install.

No code changes beyond the manifest. Same test surface as v1.49.550.

## Fix

- `package.json` — add `examples/cartridges/gsd-workflow`,
  `examples/cartridges/gsd-debugger`, `examples/cartridges/gsd-planner`,
  `examples/cartridges/gsd-executor` to `files`
- `package.json` / `package-lock.json` — version → `1.49.551`
- `src-tauri/Cargo.toml` / `src-tauri/tauri.conf.json` — version → `1.49.551`

## Verification

Install via `npx skill-creator@1.49.551` and confirm
`installCartridgeDir` resolves all four cartridge source directories
without the "missing" warning.

## Commits

- `77910139d` fix(release): include cartridge source dirs in npm tarball

## Context

v1.49.550 was the Platform Alignment Milestone (see
`docs/release-notes/v1.49.550/README.md`). This patch exists solely to
republish that milestone with the cartridge directories present in the
tarball. All other v1.49.550 content applies unchanged.
