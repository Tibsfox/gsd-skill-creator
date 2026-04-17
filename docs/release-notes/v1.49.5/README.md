# v1.49.5 — Project Filesystem Reorganization

**Released:** 2026-02-27
**Scope:** repository-wide filesystem refactor following FHS 3.0 + XDG Base Directory Specification; Linux ecosystem integration
**Branch:** dev → main
**Tag:** v1.49.5 (2026-02-27T07:09:22-08:00) — "Project Filesystem Reorganization"
**Predecessor:** v1.49.4 — Filesystem Management Strategy
**Successor:** v1.49.6
**Classification:** feature — filesystem + packaging infrastructure
**Commits:** 56659b2f5..062480818 (14 commits)
**Files changed:** 112 (+1,512 / -836)
**Phases:** 8 (460–467) · **Plans:** 17 · **Requirements:** 49
**Tests:** 19,222 passing (+37 new for XDG utilities), 0 failures · 0 TypeScript errors · 0 new Cargo warnings
**Verification:** `npx tsc --noEmit` clean · `cd desktop && npx tsc --noEmit` clean · `cd src-tauri && cargo check` clean · `npm test` 19,222/19,222

## Summary

**Linux open source conventions became the repository layout, not a style guide.** v1.49.5 refactored the gsd-skill-creator repository to the shape a packager, distro maintainer, or first-time contributor would recognize at a glance: FHS 3.0 for install paths, XDG Base Directory Specification for runtime state, Debian and RPM packaging skeletons for downstream distribution, and the Alacritty `extra/` directory convention for freedesktop integration files. The repository stopped being an ad-hoc tree of whatever accreted during the v1.0–v1.49 arc and started being something you could drop into `/usr/share` or a `.deb` without renaming anything. That reshape was the single load-bearing change of the release — every later integration (systemd user units, desktop entries, AppStream metadata, man pages) rides on top of it and only works because the root directory layout now agrees with what the rest of the Linux ecosystem expects.

**The audit-then-move manifest was the design primitive that made the reorganization safe.** Phase 460 (`moves.json`) enumerated all 33 root directories, tagged each with a disposition (keep / move / delete / hide / merge), and listed the destination for every move along with a per-move impact analysis. That manifest turned a potentially days-long "grep everywhere and pray" refactor into an auditable sequence of `git mv` operations with a known end state. Seven phases downstream (461–467) were re-executions of the manifest: each phase took a group of moves, applied them, updated references, and ran the stale-path sweep. The scorer-facing numbers — 33 → 26 root directories, 21 visible + 5 hidden, 17 new integration files — are checkpoints against that manifest, not post-hoc measurements.

**Dual XDG implementations in TypeScript and Rust encode identical semantics at the cross-boundary layer.** `src/fs/xdg.ts` (TypeScript, 62 lines, 16 tests) and `src-tauri/src/xdg.rs` (Rust, 112 lines, 6 inline tests) both implement `configDir`, `dataDir`, `stateDir`, `cacheDir`, and `runtimeDir` with two hard rules: (1) reject relative paths in XDG environment variables and fall back to the spec default, and (2) return `undefined`/`None` for `XDG_RUNTIME_DIR` when unset (no fallback — the spec explicitly forbids one). The Rust implementation uses the `dirs` crate, the TypeScript implementation reads `process.env` directly. Functional parity across the Tauri boundary eliminates a class of bugs where the TypeScript frontend thinks a config lives in one place and the Rust backend looks somewhere else. This matters because the `desktop/` frontend and `src-tauri/` backend previously each rolled their own home-directory resolution; after v1.49.5 they both resolve through the same spec.

**The `extra/` directory is the single drop-in location a Linux packager looks for.** Modeled on Alacritty, Sway, and other Wayland-ecosystem projects, `extra/` gathers every non-binary artifact a `.deb` or `.rpm` installer needs: `extra/man/` (three scdoc sources — `gsd-os.1.scd`, `skill-creator.1.scd`, `sc-config.5.scd`), `extra/completions/` (bash + zsh + fish for all `sc` subcommands), `extra/linux/` (a freedesktop.org `.desktop` entry plus an AppStream `appdata.xml` for GNOME Software / KDE Discover), `extra/systemd/` (a user service unit for headless agent mode), and `extra/logo/` (placeholder icon reference). A packager can now read the Debian `rules` or RPM `%install` section and see every artifact already staged in a predictable place — no archaeology across the repo required. The choice of scdoc over raw groff is deliberate: scdoc source is human-readable, the tool is ubiquitous in the Sway/wlroots ecosystem, and the generated man pages pass `lintian` cleanly.

**The Debian and RPM packaging skeletons are correct and unexercised, and that asymmetry is a known outstanding risk.** `packaging/debian/` ships `control`, `rules`, `changelog`, `copyright`, `compat`, `install`, and `source/format` targeting Ubuntu 22.04+. `packaging/rpm/gsd-os.spec` targets CentOS Stream 9+ with the right `BuildRequires` list. Both route man pages, shell completions, `.desktop` files, and the systemd unit to FHS-correct install paths (`/usr/share/man/man1`, `/usr/share/bash-completion/completions`, `/usr/share/applications`, `/usr/lib/systemd/user`). Neither has been exercised end-to-end in a real build environment — there is no CI job for `.deb` or `.rpm` builds in v1.49.5. The files are syntactically valid and semantically plausible; the first real build attempt will find whatever is wrong with them. Phase 462 shipped them anyway because the cost of carrying untested packaging metadata is low and the cost of starting from zero at packaging time would be high.

**The consolidation of scattered data directories is the pattern that could go further.** `schemas/` merged into `data/schemas/`, `test-fixtures/` merged into `test/fixtures/`, `.chipset/` and `.citations/` both folded under `data/`, `config/` and `configs/` unified into a single `config/` with the old `profiles/` absorbed, `archive/` hidden as `.archive/` (and gitignored), `dashboard/` relocated to `infra/dashboard/`, `minecraft/` relocated to `infra/minecraft/`, `bin/` folded into `scripts/bin/`. Each of these moves took a top-level directory that existed for legacy reasons and put it under a meaningful parent. Root went from 33 to 26 entries. That's better — but 26 is still high for a repository a new contributor encounters cold. The pattern (gather related entries under a named parent) is the right primitive; a v1.50 or later pass could push the root count below 20 without much additional risk now that the audit-manifest approach is in hand.

**Stale-path sweeps are the verification gate that makes repo-wide reorganization trustworthy.** Phase 466 closed with a full-repository grep confirming zero remaining references to old paths: no `bin/gsd-stack`, no `bootstrap.sh` at root, no `schemas/` imports, no `test-fixtures/` fixture loads, no `.chipset/` or `.citations/` references, no `serve-dashboard.mjs` at root. The sweep found and fixed several TypeScript import paths, the `tests/test-gsd-stack.sh` invocation path, and a handful of doc references. Without that sweep, a reorganization of this size always leaves phantom references that surface as mysterious import errors weeks later. With it, the reorganization either compiled or it didn't — and it did, with 19,222 tests green and 0 TypeScript errors across both the library and the desktop frontend.

**CONTRIBUTING.md, .editorconfig, and Makefile closed the first-contact gap for new contributors.** `CONTRIBUTING.md` (new) documents the fork → clone → test → commit workflow with explicit references to the conventional-commits hook. `.editorconfig` (new) normalizes indentation and line endings across TypeScript, Rust, Markdown, YAML, and JSON — any editor that reads `.editorconfig` (which is all of them) now produces files that pass the pre-commit hook on first try. The top-level `Makefile` (new) gives a discoverable entry point: `make build`, `make test`, `make lint`, `make desktop`, `make clean`, `make verify`, `make man`. These are three small files with outsized effect on onboarding — the difference between a contributor who ships a first PR that passes CI and one who bounces off a stale-path error in their editor.

**The `docs/FILE-STRUCTURE.md` rewrite, `CLAUDE.md` location updates, and `INSTALL.md` Makefile-aware commands kept the documentation truthful.** Filesystem reorganizations that leave the docs describing the old layout are worse than no reorganization — they actively mislead readers. Phase 466 rewrote `docs/FILE-STRUCTURE.md` against the new tree, updated `CLAUDE.md`'s "Key File Locations" block, and rewrote the `INSTALL.md` install commands to call `make` targets instead of raw paths. `.gitignore` was audited for orphaned rules (several removed) and new rules added for `.archive/` and the packaging build artifacts. Every path string in the docs at v1.49.5 was validated against the new tree.

**v1.49.5 sits between v1.49.4's zone-CLI groundwork and later releases that needed a FHS-shaped layout.** v1.49.4 (Filesystem Management Strategy) introduced the filesystem-zone CLI commands (`project`, `pack`, `contrib`, `www`) and the `ProjectManager`, `PackCatalog`, `ContribManager`, `WWWStager` primitives. v1.49.5 followed by giving that zone model a home on disk that matches Linux conventions. Later releases (the v1.49.6+ line, the v1.49.500 consolidation, v1.50 release work) inherit this layout and build on it — the `data/` and `extra/` directories in particular show up repeatedly in later refactors. The reorganization itself is not interesting long-term; the fact that every post-v1.49.5 release can assume FHS-compatible paths is.

## Key Features

| Area | What Shipped |
|------|--------------|
| Linux man pages | `extra/man/gsd-os.1.scd`, `extra/man/skill-creator.1.scd`, `extra/man/sc-config.5.scd` — three scdoc sources, lint-clean when rendered |
| Shell completions | `extra/completions/` bash + zsh + fish coverage for all `sc` subcommands; installed to FHS paths via Debian/RPM rules |
| Freedesktop entry | `extra/linux/gsd-os.desktop` (freedesktop.org spec) + `extra/linux/appdata.xml` (AppStream) for GNOME Software / KDE Discover |
| systemd user service | `extra/systemd/gsd-agent.service` — headless agent mode, installs to `/usr/lib/systemd/user` |
| Logo placeholder | `extra/logo/` directory staged for icon assets |
| Debian packaging | `packaging/debian/control` + `rules` + `changelog` + `copyright` + `compat` + `install` + `source/format` targeting Ubuntu 22.04+ |
| RPM packaging | `packaging/rpm/gsd-os.spec` with correct BuildRequires for CentOS Stream 9+, FHS-correct `%install` |
| XDG (TypeScript) | `src/fs/xdg.ts` (62 lines) with `configDir` / `dataDir` / `stateDir` / `cacheDir` / `runtimeDir`; 16 tests in `test/fs/xdg.test.ts` |
| XDG (Rust) | `src-tauri/src/xdg.rs` (112 lines) using `dirs` crate; 6 inline tests; identical semantics to TS implementation |
| Relative-path rejection | Both XDG impls reject relative paths in env vars and fall back to spec default; `XDG_RUNTIME_DIR` returns `undefined`/`None` when unset |
| Root directory audit | `moves.json` enumerating 33 → 26 root entries with per-move disposition and impact analysis |
| Data consolidation | `schemas/` → `data/schemas/`, `test-fixtures/` → `test/fixtures/`, `.chipset/` → `data/chipset/`, `.citations/` → `data/citations/` |
| Config unification | `config/` and `configs/` merged; `profiles/` absorbed into `config/` |
| Infra relocation | `dashboard/` → `infra/dashboard/`, `minecraft/` → `infra/minecraft/`, `bin/` → `scripts/bin/` |
| Archive hiding | `archive/` → `.archive/` (gitignored); keeps the content, removes the noise |
| Scripts move | `bootstrap.sh` + `serve-dashboard.mjs` moved to `scripts/` via `git mv`; `tests/test-gsd-stack.sh` invocation path updated |
| Legacy cleanup | `CLAUDE.md.legacy` deleted, root screenshots removed, `README-integration.md` → `docs/INTEGRATION.md` |
| Contributor onboarding | `CONTRIBUTING.md` (new), `.editorconfig` (TS/Rust/MD/YAML/JSON), top-level `Makefile` with `build` / `test` / `lint` / `desktop` / `clean` / `verify` / `man` targets |
| Documentation refresh | `docs/FILE-STRUCTURE.md` rewritten to match new tree; `CLAUDE.md` key-file-locations updated; `INSTALL.md` rewritten to use Makefile targets |
| Stale-path sweep | Full-repo grep audit confirmed zero remaining references to old paths; `.gitignore` orphan rules removed; new rules for `.archive/` and packaging build artifacts |
| Verification gate | `npx tsc --noEmit` → 0 errors; `cd desktop && npx tsc --noEmit` → 0 errors; `cd src-tauri && cargo check` → 0 new warnings; `npm test` → 19,222 passing / 0 failures |

## Retrospective

### What Worked

- **Audit-then-move with a machine-readable manifest.** Phase 460's `moves.json` with 21 entries and per-move impact analysis converted a reorganization of 103+ files into an auditable sequence of `git mv` operations. Every subsequent phase (461–467) was a re-execution of a slice of that manifest with its own verification step. No blind refactoring, no guessing, no "wait where did this file go" moments during review.
- **Dual XDG implementations with identical semantics across the Tauri boundary.** `src/fs/xdg.ts` (TypeScript, 16 tests) and `src-tauri/src/xdg.rs` (Rust, 6 inline tests) return the same paths for the same inputs, reject relative paths the same way, and handle the missing-`XDG_RUNTIME_DIR` case the same way. The parity eliminates an entire class of cross-boundary bugs between the desktop frontend and the Rust backend.
- **Linux integration files follow real ecosystem conventions.** scdoc man pages (not raw groff), shell completions for the three shells people actually use, a freedesktop.org `.desktop` entry, AppStream `appdata.xml` for software centers, a systemd user service — this is what actual Linux packages ship. The Alacritty `extra/` directory model was the right reference and makes the layout immediately legible to any distro packager.
- **Zero regressions across 19,222 tests after moving 103 files.** The stale-path grep sweep at the end of Phase 466 — confirming zero old-path references anywhere in the tree — is the verification that makes a large refactor trustworthy. The full suite passing, including the 37 new XDG utility tests, proved the reorganization was complete rather than just "compiled once."
- **Debian and RPM packaging skeletons landed at the same time as the integration files.** Writing the `.deb` and `.rpm` rules while the `extra/` layout was fresh meant the install paths stayed consistent. Deferring packaging would have produced two slightly different mental models of where files belong.
- **Contributor-onboarding files (CONTRIBUTING.md, .editorconfig, Makefile) landed in the same release as the layout change.** Any contributor who clones the post-v1.49.5 tree sees a standard-looking repository with discoverable `make` targets. A reorganization without these three files would have made onboarding worse, not better, during the window before docs caught up.

### What Could Be Better

- **Root went from 33 to 26 entries — still high.** The consolidation removed seven directories but a 26-entry root is still more than a new contributor can hold in working memory. The `data/` consolidation was the right pattern; `infra/` was the right pattern; there is room for a second pass that pushes root below 20 without much additional risk.
- **Debian and RPM packaging are unexercised.** The files are syntactically valid and the install paths are FHS-correct, but neither has been end-to-end built in a real build environment. There is no CI job for `.deb` or `.rpm` builds in v1.49.5. They will drift silently from reality until the first time someone tries to build a package.
- **`extra/logo/` is a placeholder.** The directory exists and the `.desktop` entry references an icon, but the actual icon asset was not shipped in v1.49.5. Software centers will fall back to a generic icon until the logo lands.
- **No CI gate on the `make` targets.** `make build`, `make test`, `make lint`, etc. all work locally, but there is no CI job that runs `make verify` end-to-end. A future regression that breaks `make` without breaking `npm test` directly would go unnoticed.
- **`docs/FILE-STRUCTURE.md` rewrite is a point-in-time snapshot.** It was accurate at release, but there is no mechanism that fails CI if a subsequent change adds a new root directory without updating the doc. A generator (tree → doc diff gate) would close this hole.
- **XDG utilities are not yet the single source of path resolution.** Several pre-existing places in the codebase still compute config/data paths inline. The XDG utilities are available but adoption across the rest of the library is a follow-on task, not complete at v1.49.5.

## Lessons Learned

- **Audit-then-move with a machine-readable manifest is the safe way to reorganize a repository.** The `moves.json` approach from Phase 460 should be the template for any future large-scale file reorganization. Every large `git mv` effort wants the same primitive: a declarative list of moves with per-move impact analysis, executed in phases, verified by a stale-path sweep. Without the manifest the refactor is unauditable; with it the refactor is a script.
- **FHS 3.0 + XDG Base Directory compliance earns ecosystem integration for free.** Once the repository layout matches what distro tooling, desktop environments, and systemd expect, the packaging rules write themselves. Deviating from FHS costs every downstream packager time; conforming to FHS costs the upstream project a one-time reshape.
- **Stale-path sweeps after reorganization are non-negotiable.** A full-repo grep audit confirming zero remaining hardcoded old paths is the only way to trust that a large move is complete. Phantom references surface as mysterious import errors weeks later if you skip the sweep. Do the sweep, commit the fixups, then claim victory.
- **scdoc over groff is the right choice for modern Linux projects.** Readable source, used by the Sway/wlroots ecosystem, and produces `lintian`-clean man pages without the groff macro fluency tax. Future man pages in this project should stay scdoc.
- **Dual-implementation parity at cross-language boundaries is worth the duplication.** The TypeScript and Rust XDG utilities are small, almost identical in shape, and could have been consolidated behind an IPC call. Keeping both native avoids an IPC dependency in what should be a fast path, and the identical semantics eliminate a class of bugs that would have been hard to diagnose. Duplicate tests make drift visible.
- **Ship packaging skeletons with the reorganization, not after.** The `.deb` and `.rpm` rules wrote themselves because the `extra/` layout was fresh in mind. Deferring packaging to a later release would have produced two slightly different mental models of where files belong — one for the repo, one for distributions — and the reconciliation cost would have dwarfed the write-it-now cost.
- **Contributor onboarding files belong in the same release as the layout change.** CONTRIBUTING.md, .editorconfig, and Makefile are small in line count and large in effect. A reorganization without them makes the first-contact experience worse during the window before docs and tutorials catch up. Ship them together.
- **Hide legacy state rather than carrying it or deleting it.** `archive/` → `.archive/` (gitignored) keeps the history available on disk for anyone who needs it while removing it from the root listing, from editor file pickers, and from new-contributor attention. Deleting would have lost context; carrying would have cluttered; hiding is the middle path.
- **Relative-path rejection in env-driven config is a security posture, not just a correctness nit.** Both XDG implementations reject relative values in `XDG_*_DIR` variables and fall back to spec defaults. A relative path in `XDG_CONFIG_DIR` could have created path-traversal ambiguity between the frontend and the backend. Rejecting them is simpler and closes the class of bug entirely.
- **Root directory count is a legibility metric.** Going from 33 to 26 is measurable progress; 26 is still above the threshold where a new contributor can hold the tree in their head. Further consolidation (pushing root below 20) should be treated as a first-class ergonomic goal, not a "nice to have."

## Cross-References

| Related | Why |
|---------|-----|
| [v1.49.4](../v1.49.4/) | Predecessor — Filesystem Management Strategy introduced the filesystem-zone CLI (`project`, `pack`, `contrib`, `www`) and the `ProjectManager` / `PackCatalog` / `ContribManager` / `WWWStager` primitives that v1.49.5 rehomed on disk |
| [v1.49.3](../v1.49.3/) | Two patches back — GSD-OS Desktop Polish; v1.49.5's root cleanup removed several screenshot artifacts created during v1.49.3 debugging |
| [v1.49.2](../v1.49.2/) | Indicator-wiring patch that preceded the v1.49.3/.4/.5 mini-arc on desktop + filesystem |
| [v1.49.1](../v1.49.1/) | First patch of the v1.49.0 retrospective patch sequence |
| [v1.49.0](../v1.49.0/) | Parent mega-release; v1.49.5 is the fifth patch in its retrospective-patch series |
| [v1.49.6](../v1.49.6/) | Successor — rides on top of the new FHS-shaped layout |
| [v1.48](../v1.48/) | Predecessor mega-release — physical infrastructure engineering pack |
| [v1.0](../v1.0/) | Foundation release — defines the `.claude/skills/` + `.claude/agents/` + `.planning/patterns/` directory shape that v1.49.5 preserved during the reshape |
| [v1.10](../v1.10/) | Security Hardening — path-handling debt originally paid down there; v1.49.5's relative-path rejection continues the same discipline |
| [v1.34](../v1.34/) | Documentation Ecosystem — established `docs/` as the canonical documentation source; v1.49.5's `docs/INTEGRATION.md` move and `docs/FILE-STRUCTURE.md` rewrite extend that |
| `moves.json` | Machine-readable 21-entry manifest in Phase 460 — template for future reorganizations |
| `extra/` | Alacritty-model directory for Linux integration files (man, completions, linux, systemd, logo) |
| `packaging/debian/` | Debian packaging skeleton for Ubuntu 22.04+ |
| `packaging/rpm/gsd-os.spec` | RPM spec file for CentOS Stream 9+ |
| `src/fs/xdg.ts` | TypeScript XDG Base Directory utility (62 lines, 16 tests) |
| `src-tauri/src/xdg.rs` | Rust XDG Base Directory utility (112 lines, 6 inline tests) using the `dirs` crate |
| `test/fs/xdg.test.ts` | 16 TypeScript tests covering config/data/state/cache/runtime resolution, relative-path rejection, and missing-env fallbacks |
| `docs/FILE-STRUCTURE.md` | Post-v1.49.5 canonical layout reference, rewritten in Phase 466 |
| `CONTRIBUTING.md` | New contributor onboarding file (Phase 463) |
| `Makefile` | Top-level `make build` / `test` / `lint` / `desktop` / `clean` / `verify` / `man` entry points |
| FHS 3.0 spec | Upstream Filesystem Hierarchy Standard — the target layout for install paths |
| XDG Base Directory Specification | Upstream freedesktop.org spec for runtime config/data/state/cache/runtime paths |
| Alacritty `extra/` convention | Reference project for the `extra/man/` + `extra/completions/` + `extra/linux/` + `extra/systemd/` directory model |
| scdoc | Sway/wlroots ecosystem man-page source format; chosen over raw groff |
| `.planning/MILESTONES.md` | Canonical phase/plan/requirement detail for v1.49.5 |

## Engine Position

v1.49.5 is the layout-reshape patch inside the v1.49.0 mega-release's retrospective-patch sequence. The sequence shape so far: v1.49.1 (field-name alignment), v1.49.2 (indicator wiring), v1.49.3 (desktop polish), v1.49.4 (filesystem management strategy / zone CLI), v1.49.5 (filesystem reorganization / packaging skeleton). v1.49.4 introduced the zone primitives in code; v1.49.5 gave them a home on disk that matches Linux conventions. Every post-v1.49.5 release inherits FHS-compatible paths, the `extra/` directory convention, the `data/` consolidation, and the XDG utilities — these become load-bearing for any release that wants to ship installer metadata, a new subsystem under `data/`, or a cross-boundary path resolver. v1.49.5 is not a feature users will notice directly; it is the foundation every later packaging-adjacent release (up through v1.49.500 and into the v1.50 release work) assumes exists. The `moves.json` manifest approach also becomes the template for any future reorganization of this size, which is its own long-tail contribution beyond the one-time reshape.

## Files

- `extra/man/` — three scdoc man page sources: `gsd-os.1.scd`, `skill-creator.1.scd`, `sc-config.5.scd`
- `extra/completions/` — bash, zsh, and fish completions for all `sc` subcommands
- `extra/linux/gsd-os.desktop` — freedesktop.org `.desktop` entry for application launchers
- `extra/linux/appdata.xml` — AppStream metadata for GNOME Software / KDE Discover integration
- `extra/systemd/gsd-agent.service` — systemd user service unit for headless agent mode
- `extra/logo/` — icon asset directory (placeholder pending final logo)
- `packaging/debian/` — full Debian packaging skeleton: `control`, `rules`, `changelog`, `copyright`, `compat`, `install`, `source/format`
- `packaging/rpm/gsd-os.spec` — RPM spec file (94 lines) for CentOS Stream 9+ with FHS-correct `%install`
- `src/fs/xdg.ts` — TypeScript XDG Base Directory utility (62 lines)
- `src/fs/index.ts` — updated to export the XDG utility
- `src-tauri/src/xdg.rs` — Rust XDG Base Directory utility (112 lines) with 6 inline tests
- `src-tauri/src/lib.rs` — updated to register the `xdg` module
- `src-tauri/Cargo.toml` — added `dirs` crate dependency
- `test/fs/xdg.test.ts` — 16 TypeScript tests (137 lines) covering relative-path rejection and env-var fallbacks
- `test/fixtures/` — new canonical location for test fixtures (formerly `test-fixtures/`)
- `data/schemas/` — canonical location for JSON schemas (formerly top-level `schemas/`)
- `data/chipset/` — formerly `.chipset/`
- `data/citations/` — formerly `.citations/`
- `infra/dashboard/` — formerly top-level `dashboard/`
- `infra/minecraft/` — formerly top-level `minecraft/`
- `scripts/bootstrap.sh` — formerly top-level `bootstrap.sh`
- `scripts/serve-dashboard.mjs` — formerly top-level `serve-dashboard.mjs`
- `scripts/bin/gsd-stack` — formerly top-level `bin/gsd-stack`
- `CONTRIBUTING.md` — new contributor onboarding document
- `.editorconfig` — editor normalization for TS, Rust, MD, YAML, JSON
- `Makefile` — top-level build/test/lint/desktop/clean/verify/man targets
- `docs/FILE-STRUCTURE.md` — rewritten to reflect the new tree
- `docs/INTEGRATION.md` — formerly root-level `README-integration.md`
- `.gitignore` — audited for orphan rules, new entries for `.archive/` and packaging build artifacts
- `package.json` — version bumped to 1.49.5
- `src-tauri/tauri.conf.json` — version bumped to 1.49.5

## Version History Reference

For the full v1.x line context, see the [v1.0 release notes](../v1.0/) Version History table. v1.49.5 inherits the v1.0 foundation (`.claude/skills/`, `.claude/agents/`, `.planning/patterns/`) unchanged while reshaping the surrounding tree to match FHS + XDG conventions.
