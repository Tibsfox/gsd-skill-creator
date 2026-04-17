# v1.49.551 — Cartridge Tarball Fix

**Released:** 2026-04-15
**Scope:** npm tarball repackaging — include cartridge source directories
**Branch:** dev
**Tag:** v1.49.551 (2026-04-15T17:32:51-07:00)
**Predecessor:** v1.49.550 — Platform Alignment Milestone
**Successor:** v1.49.552 — Degree 48
**Classification:** patch — ship-blocker for the v1.49.550 npm publish
**New deps:** 0
**Commits:** `77910139d` (fix), `67659d133` (release notes)
**Verification:** `npx skill-creator@1.49.551` resolves all four cartridge source directories without warnings

## Summary

**The v1.49.550 npm tarball was missing the cartridges.** The v1.49.550 publish shipped only `dist/` and `project-claude/` in the package, so `installCartridgeDir` warned "Cartridge source directory missing" for all four cartridges (`../examples/cartridges/gsd-workflow`, `gsd-debugger`, `gsd-planner`, `gsd-executor`) whenever the package was installed via `npx`. Anyone running `npx skill-creator@latest` was getting a half-installed framework with no cartridges. v1.49.551 adds the four cartridge source directories to the package `files` array so the next publish ships a complete tarball.

**No code changes beyond the manifest.** This is purely a packaging fix — the `files` array in `package.json` gained four entries, the version numbers in `package.json`, `package-lock.json`, `src-tauri/Cargo.toml`, and `src-tauri/tauri.conf.json` all ticked from 1.49.550 to 1.49.551. The test surface is identical to v1.49.550; nothing in the source tree changed.

**This is what v1.49.550's launch-smoke-test was supposed to catch.** The lesson from v1.49.3 — that unit tests can't see packaging failures and desktop releases need a launch-smoke-test gate — also applies to npm publishes. The v1.49.550 release passed every unit test and shipped broken. A `npx skill-creator@latest --help` run against a fresh install would have caught this before tagging. v1.49.551 pays the cost of that missing gate in real time: a ship-blocker patch within 24 hours of the parent release.

**The `files` array in `package.json` is where npm trust gets won or lost.** It's a single string list that determines exactly what ends up in the tarball. Default npm behavior (include everything not gitignored) would have shipped the cartridges by accident; the intentional `files` list in v1.49.550 traded convenience for determinism and paid for it with a missing directory. The right discipline is "list the directories explicitly, then verify the tarball before publish." v1.49.551 adds the list; a future patch should add the verify step to the publish pipeline.

**Every deployment pipeline has a packaging boundary that unit tests can't see.** For Tauri desktop releases, it's the frameless-window capability declarations (see v1.49.3). For npm releases, it's the `files` array. For Docker images, it's the `COPY` directives. The shape of the failure is the same: the application works in development because the developer's filesystem has everything the code needs. It fails at install time because the packaging step didn't ship those files. v1.49.551 is the npm-tarball instance of that pattern.

## Key Features

| Area | What Shipped |
|------|--------------|
| Packaging | `package.json` `files` array — added `examples/cartridges/gsd-workflow` |
| Packaging | `package.json` `files` array — added `examples/cartridges/gsd-debugger` |
| Packaging | `package.json` `files` array — added `examples/cartridges/gsd-planner` |
| Packaging | `package.json` `files` array — added `examples/cartridges/gsd-executor` |
| Versioning | `package.json` / `package-lock.json` — version → 1.49.551 |
| Versioning | `src-tauri/Cargo.toml` / `src-tauri/tauri.conf.json` — version → 1.49.551 |
| Verification | `npx skill-creator@1.49.551` resolves all four cartridge source directories without the "missing" warning |

## Retrospective

### What Worked

- **The patch scope was minimal and landable within hours.** Four entries to `package.json`, four version bumps, one verification command. No secondary changes, no scope creep. That's what a ship-blocker patch should look like.
- **The `installCartridgeDir` warning was clear enough to diagnose in one pass.** "Cartridge source directory missing" with the exact paths led directly to the missing `files` entries. No debugging session, no log-diving — read the warning, fix the manifest.
- **Version bumps across all four artifacts stayed in sync.** `package.json`, `package-lock.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json` — every version marker on disk matches 1.49.551. A fragmented version would have caused downstream confusion.
- **The retrospective-patch pattern established in v1.49.1/.2/.3 applied cleanly.** v1.49.550 was a milestone; v1.49.551 is the surgical first-patch fix. The shape is the same as the v1.49.0 → v1.49.1 relationship from February, showing the pattern is reusable.

### What Could Be Better

- **The v1.49.550 publish process didn't have a tarball-verify step.** Every npm publish should run `npm pack --dry-run`, inspect the resulting file list, and fail loudly on missing directories. Adding that to the publish pipeline would prevent this exact class of failure.
- **The `files` array is a single point of truth with no drift detection.** Cartridges are directories that exist under `examples/` but must be enumerated manually in `package.json`. A sync-check script comparing `examples/cartridges/*` against the `files` entries would have caught this.
- **"Ship-blocker within 24 hours" is an indicator something is wrong upstream.** Fast-turn patches are cheap to land but indicate gaps in the parent release's QA. v1.49.551 being needed at all is a signal to harden v1.49.550's publish checklist.
- **npm tarball size isn't being monitored.** The missing cartridges produced a smaller-than-expected tarball; a size-regression check against the previous version would have surfaced this as a warning before tagging.

## Lessons Learned

1. **The `files` array in `package.json` is what trust is built on for npm consumers.** Every directory a user needs at install time must appear in `files` or it won't ship. Default behavior includes too much; explicit `files` includes exactly what's listed and nothing more.
2. **Publishing without a tarball smoke-test is shipping untested code.** The dev-machine install works because the dev machine has everything. The npm install works only if the tarball is complete. Add `npm pack --dry-run` to every publish pipeline.
3. **Ship-blocker patches within 24 hours are a process smell, not a bragging point.** Fast remediation is good; needing fast remediation is a gap. Treat every ship-blocker as a post-mortem trigger for the parent release.
4. **Version markers on disk should all move together.** `package.json`, `package-lock.json`, `Cargo.toml`, `tauri.conf.json` — every version reference must match. A bump script (or pre-tag hook) that verifies all of them stay in sync is table stakes.
5. **Missing-resource warnings deserve CI failures, not log lines.** `installCartridgeDir` warned about missing directories and let installation proceed. In a CI environment, "missing source directory" should fail the build, not log a warning.
6. **Packaging boundaries exist in every deployment pipeline.** Tauri capabilities, npm `files`, Docker `COPY`, Python `MANIFEST.in` — each technology has a step where "what ships" is declared separately from "what runs." The shape of the failure is always the same.
7. **Patch scope discipline is what keeps patches landable.** v1.49.551 was tempting to expand into "while we're in `package.json`, let's also fix X." Resisting that made the patch land in hours instead of days.
8. **Tarball size monitoring catches a whole class of packaging bugs.** A v1.49.551 tarball that's identical in size to v1.49.550 minus the missing directories would have triggered a "why did it shrink?" check before the tag landed. Size regressions are signals.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.49.550](../v1.49.550/) | Parent milestone whose npm tarball was incomplete |
| [v1.49.3](../v1.49.3/) | Prior ship-blocker patch with the same lesson in a different domain (Tauri capability model) |
| [v1.49.1](../v1.49.1/) | Precedent for the first-patch-after-milestone pattern |
| [v1.49.552](../v1.49.552/) | Successor (Degree 48) — post-milestone work resumes |
| `package.json` | File containing the `files` array that was fixed |
| `examples/cartridges/gsd-workflow/` | Cartridge source directory now included in the tarball |
| `examples/cartridges/gsd-debugger/` | Cartridge source directory now included |
| `examples/cartridges/gsd-planner/` | Cartridge source directory now included |
| `examples/cartridges/gsd-executor/` | Cartridge source directory now included |
| `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json` | Cross-stack version markers kept in sync |
| `project-claude/install.cjs` | Code that called `installCartridgeDir` and produced the "missing" warning |

## Engine Position

v1.49.551 closes the v1.49.550 Platform Alignment Milestone's packaging gap within 24 hours of the tag. It's the second instance (after v1.49.3) of a ship-blocker patch in the v1.49 line, and together they establish the pattern: every mega-release needs a packaging-layer smoke test run against the actual install target (Tauri window, npm tarball) before the tag is cut. The cartridge directories added to `files` here are load-bearing for every subsequent `npx skill-creator@latest` install.

## Files

- `package.json` — `files` array gained 4 cartridge-directory entries; version bumped to 1.49.551
- `package-lock.json` — version bumped to 1.49.551
- `src-tauri/Cargo.toml` — version bumped to 1.49.551
- `src-tauri/tauri.conf.json` — version bumped to 1.49.551
- `examples/cartridges/gsd-workflow/` — directory now included in the npm tarball
- `examples/cartridges/gsd-debugger/` — directory now included
- `examples/cartridges/gsd-planner/` — directory now included
- `examples/cartridges/gsd-executor/` — directory now included
- `docs/release-notes/v1.49.551/` — this release's notes (`67659d133`)
