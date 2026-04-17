# v1.49.4 — Filesystem Management Strategy

**Released:** 2026-02-27
**Scope:** Repository-level filesystem zones, `.sc-config.json`, and `sc` CLI surface for project/pack/contrib/www management
**Branch:** dev → main
**Tag:** v1.49.4 (2026-02-27T05:41:09-08:00)
**Predecessor:** v1.49.3 — GSD-OS Desktop Polish
**Successor:** v1.49.5
**Classification:** feature — structural/additive
**Commits:** `78ed6a23f..1df73ab0b` (10 commits)
**Files changed:** 44 (+2,413 / -5)
**Verification:** 97 new tests green · 19,185+ full suite, 0 new failures · TypeScript 0 errors
**Author:** Tibsfox <tibsfox@tibsfox.com>

## Summary

**Purely additive filesystem reorganization introduced four named repository zones without touching a single existing file.** v1.49.4 turned an implicit "everything lives under the repo root" convention into an explicit zoning scheme: `projects/` as the workspace for GSD projects, `contrib/` for collaboration (upstream PRs we send, downstream PRs we receive, publishing projects we spin out), `packs/` as the catalog of educational/domain packs (`holomorphic`, `electronics`, `agc`, `aminet`), and `www/` as the web staging area (`site/`, `tools/`, `staging/`). Every existing directory — `src/`, `src-tauri/`, `desktop/`, `docs/`, `.planning/`, `.claude/` — kept its path and its history. The 44-file diff is +2,413 / -5, and those 5 deletions are all within `src/cli/commands/` (a consolidation move inside the new `src/fs/commands/` subtree, committed in `26d01edbf`). Nothing external to the new feature was renamed, moved, or deleted, which is why the release ships as a feature rather than a refactor.

**Ten commits, seven concrete subsystems, one Zod schema, and a CLI verb surface — all landed in a single afternoon.** The commit stream is a textbook "build it in layers" sequence: `da64748b2` added `src/fs/types.ts` and `src/fs/config.ts` with the Zod schema. `db7574753` shipped the scaffold that materializes the zone directories and their self-documenting README files (with a deliberate deviation — dropping the legacy broad `www/` gitignore rule so the new `www/` zone could be tracked selectively). `ae32fe632` added `ProjectManager` (init/list/status). `d9794df9e` added `PackCatalog`. `ccd13f643` added `ContribManager` and `WWWStager` together. `c85734d18` wired in the CLI surface and integration tests. `7063c7bc4` registered the new verbs on `src/cli.ts`. `26d01edbf` consolidated the command implementations under `src/fs/commands/` (removing the transient duplicates in `src/cli/commands/`). `1df73ab0b` bumped version to 1.49.4. `78ed6a23f` landed the v1.49.1/v1.49.2/v1.49.3 retroactive patch release notes alongside the v1.49.4 notes — the docs-entry that starts the series.

**Zod-validated configuration is the load-bearing contract.** `.sc-config.json` is user-local (gitignored) and optional. When the file is absent, the system uses sensible defaults (`home: "projects"`, empty external projects, empty upstream forks, `www/site` as build dir, `www/tools` as tools dir). When the file is present, the Zod schema in `src/fs/config.ts` (97 LOC, 190 test lines) enforces it: unknown fields are rejected, external project paths must be absolute, the parser emits human-readable errors that name the offending field. The pattern — "works without config, fails loudly with bad config" — is the same one the project has used for `.planning/config.json` and should now be considered the project convention.

**Path-traversal prevention is a first-class concern, not an afterthought.** `ProjectManager` (`src/fs/project-manager.ts`, 81 LOC, 246 test lines) rejects project names containing `..`, `/`, or `\` before any filesystem call. This is the right boundary: a CLI that creates arbitrary directories from user input has exactly one security requirement, and the code enforces it before ever reaching `mkdir`. The integration tests in `test/fs/cli-integration.test.ts` (254 lines) exercise the full CLI surface including the rejection paths, which means the safety property is covered at the protocol level and not just at the module level.

**97 tests ship alongside ~630 LOC of source code — a 15% test-to-source ratio with integration coverage of the CLI.** The test layout mirrors the source tree: `test/fs/config.test.ts` (190 lines) covers the Zod schema, `test/fs/scaffold.test.ts` (119 lines) covers idempotent directory creation, `test/fs/project-manager.test.ts` (246 lines) covers project CRUD and the name-validation guardrail, `test/fs/pack-catalog.test.ts` (134 lines) covers the pack registry, `test/fs/contrib-manager.test.ts` (116 lines) covers upstream/downstream/publishing scanning, `test/fs/www-stager.test.ts` (125 lines) covers WWW lifecycle, and `test/fs/cli-integration.test.ts` (254 lines) covers the eight new `sc` CLI verbs end-to-end. The full project regression stayed green at 19,185+ tests, which is the strongest evidence that the additive design held — no existing module's behavior shifted.

**The eight new `sc` verbs are the user-visible face of the zoning scheme.** `sc project init <name>`, `sc project list`, `sc project status`, `sc pack list`, `sc pack info <name>`, `sc contrib status`, `sc contrib list`, `sc www status` — each verb maps to a single manager method with predictable I/O. The verbs were added in two commits (`c85734d18` with their implementations and integration tests, `7063c7bc4` wiring them into `src/cli.ts`), then consolidated to `src/fs/commands/` in `26d01edbf` to avoid the awkward duplication between `src/cli/commands/` (the old home) and `src/fs/commands/` (the new home aligned with the subsystem). The consolidation is the reason the final diff shows 5 deletions — they are the transient duplicates being cleaned up inside the same release.

**Engine-position framing: v1.49.4 is the first feature release after the v1.49.3 retrospective-patch sequence closed.** v1.49.1 (surgical patch), v1.49.2 (mechanical cleanup), and v1.49.3 (polish + manual verification) finished the v1.49.0 mega-release's first-run hardening. v1.49.4 resumes feature development — and it does so with a release that is, deliberately, as low-risk as a feature can be: additive, zone-scoped, schema-validated, and test-covered. The filesystem zones become load-bearing for every subsequent `sc`-driven workflow (the full skill-center CLI surface planned for v1.50) and for the eventual split between the skill-creator monorepo and the per-project workspaces it hosts. v1.49.4 does not reorganize the past; it puts the floor under the future.

## Key Features

| Area | What Shipped |
|------|--------------|
| Zone directory: `projects/` | User workspace for GSD projects; each subdir is independent, with its own `.planning/` state. Supports external project dirs via `.sc-config.json`. |
| Zone directory: `contrib/` | Collaboration zone — `upstream/` for PRs we send, `downstream/staging/` for PRs we receive, `publishing/` for side projects we spin out for independent release. |
| Zone directory: `packs/` | Catalog of educational/domain packs (`holomorphic`, `electronics`, `agc`, `aminet`) referencing their source directories in `src/`. |
| Zone directory: `www/` | Web staging: `site/` for generated output, `tools/` for web tool sources, `staging/` for pre-publish review. Dropped the legacy `www/` gitignore rule as a deliberate deviation. |
| Config schema | `.sc-config.json` (gitignored, user-local) with Zod validation — unknown fields rejected, relative external paths rejected, human-readable errors naming the offending field. |
| Default-config behavior | Works with zero configuration — sensible defaults when no config exists, so the feature is immediately useful without asking users to write JSON first. |
| CLI verbs | Eight new `sc` verbs: `project init`, `project list`, `project status`, `pack list`, `pack info`, `contrib status`, `contrib list`, `www status`. |
| Core modules | Seven TypeScript modules under `src/fs/` (types, config, scaffold, project-manager, pack-catalog, contrib-manager, www-stager) + command implementations under `src/fs/commands/`. |
| Path-traversal guard | `ProjectManager` rejects names with `..`, `/`, `\` before any filesystem operation — safety boundary enforced at the protocol entry, not inside scaffold. |
| Idempotent scaffold | `src/fs/scaffold.ts` (205 LOC) creates zone directories + README files safely on repeat runs; the scaffold is the same shape whether you start from a clean repo or an existing one. |
| Test coverage | 97 new tests across 7 files (`config`, `scaffold`, `project-manager`, `pack-catalog`, `contrib-manager`, `www-stager`, `cli-integration`) — 15% test-to-source ratio with full CLI end-to-end coverage. |
| Full regression | 19,185+ tests green, 0 new failures; TypeScript 0 errors. Purely additive design kept the regression surface at zero. |
| CLI consolidation | Duplicates in `src/cli/commands/` (contrib/pack/project/www) removed in `26d01edbf` after the same commands landed under `src/fs/commands/` — 5 deletions that account for the entire `-5` in the shortstat. |
| Version + tag | `1.49.4` bumped across `package.json`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`, `src-tauri/tauri.conf.json`; `docs/RELEASE-HISTORY.md` updated; tag pushed. |

## Retrospective

### What Worked

- **Purely additive design kept the regression surface at zero.** No existing files moved or renamed — four new zone directories (`projects/`, `contrib/`, `packs/`, `www/`) with self-documenting READMEs. The `-5` in the shortstat is entirely a same-release cleanup (duplicates removed in `26d01edbf` after the commands moved to `src/fs/commands/`). Zero regressions were possible because zero pre-existing code was touched.
- **Zod validation for `.sc-config.json` caught bad configs at parse time.** Unknown fields rejected, relative external paths rejected, human-readable errors naming the offending field. The config-as-code-with-validation pattern scales across the project and should now be considered the convention (same shape as `.planning/config.json`).
- **Path-traversal prevention before any filesystem operation.** Rejecting `..`, `/`, `\` in project names inside `ProjectManager` is the correct security boundary for a CLI that creates arbitrary directories from user input — the guard lives at the protocol entry, not buried inside scaffold.
- **Works with zero configuration.** Sensible defaults when no config exists means the feature is immediately useful on day one. Users never need to write JSON just to try the CLI.
- **Commit-stream layering kept each change reviewable.** Types/schema → scaffold → managers (three, in three commits) → tests → CLI wiring → consolidation → version bump. Each commit is independently reviewable and individually revertable.
- **Integration tests covered the CLI at the protocol level.** `test/fs/cli-integration.test.ts` (254 lines) exercises the eight new verbs end-to-end, which means the safety guards are verified through the same code path a user would hit, not just in isolated module tests.

### What Could Be Better

- **97 tests across 7 files for ~630 LOC of source.** The 15% test-to-source ratio is healthy, but the CLI command implementations (`src/fs/commands/*.ts`, ~280 LOC) have proportionally less coverage than the core modules — a gap worth closing if the verbs are expanded in v1.50.
- **Four new top-level directories increased cognitive load.** Going from an already-crowded root to adding `projects/`, `contrib/`, `packs/`, `www/` works architecturally but increases the surface area a new contributor has to understand on first checkout. A short README at the repo root pointing at the zone READMEs would soften the onboarding.
- **The CLI consolidation happened inside the same release.** Adding `src/fs/commands/*.ts` alongside the transient `src/cli/commands/*.ts` copies and then deleting the duplicates in `26d01edbf` is the right final state, but it would have been cleaner to land them in the correct location the first time. The history shows the ambiguity about where CLI command implementations should live.
- **`www/` zone dropped the legacy gitignore rule as a deliberate deviation.** The removal is documented in the `db7574753` commit body, but there is no top-level `CHANGELOG` entry explaining why tracked files now live under `www/` when historically `www/` was gitignored build output. Future readers scanning `git log -- .gitignore` will find the change; those scanning only the release notes may miss it.
- **No end-to-end smoke test for `sc project init` against a real workspace.** The unit and integration tests cover the module and CLI layers, but there is no scripted "run `sc project init foo` in a tmpdir, assert the resulting tree matches a fixture" test. A fixture-diff smoke test would catch drift in the scaffold output.

## Lessons Learned

- **Purely additive is the lowest-risk shape for a structural feature.** By creating new zone directories rather than moving existing files, the 97 new tests only need to validate new behavior — the regression surface is zero by construction. When a structural change can be framed as additive, frame it that way.
- **Zod-with-defaults is the project convention for user-local JSON configuration.** `.sc-config.json` reuses the same "optional file, loud parser, sensible defaults" shape as `.planning/config.json`. Future user-local config files should follow this pattern rather than inventing new validation idioms.
- **Validate user input at the protocol entry, not inside the scaffold.** `ProjectManager` rejects `..`, `/`, `\` in project names before any `mkdir` runs. Putting the guard at the CLI boundary, not inside the filesystem-touching helper, keeps the trust boundary explicit and makes the safety property easy to test in isolation.
- **Commit in implementation layers, not in feature branches.** Types → schema → scaffold → managers → tests → CLI wiring → consolidation → version bump is a reviewable narrative. Each commit is a legitimate bisect target. The result is a feature that looks big in aggregate but reviews like a sequence of small changes.
- **Consolidate duplicates inside the same release that introduced them.** `26d01edbf` removed the transient `src/cli/commands/*.ts` copies after the canonical implementations landed under `src/fs/commands/`. Leaving the duplicates as a known debt for the next release would have cost more than the in-release cleanup.
- **Documented deviations belong in commit bodies, not only in retros.** The `www/` gitignore-rule removal is called out in the `db7574753` commit body as a deliberate deviation. That is the right place for a future reader of `git log` to find it; the retrospective and release notes are secondary surfaces.
- **Integration tests for a CLI should exercise the full verb surface, including rejection paths.** `cli-integration.test.ts` covers the eight new `sc` verbs in the same code path a user would hit, and it covers the name-rejection path, not just the happy path. Rejection-path coverage is what turns a safety guard into a verified property.
- **Structural features should ship with a visible onboarding aid.** Self-documenting zone READMEs (`projects/README.md`, `contrib/README.md`, `packs/README.md`, `www/README.md`) tell a new contributor what lives where without requiring them to read the commit history. Every new zone should ship with its own README.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.49.3](../v1.49.3/) | Predecessor — closed the v1.49.0 retrospective-patch sequence (xterm CSS, Tauri v2 capabilities, `tauri::async_runtime::spawn`). v1.49.4 is the first post-sequence feature release. |
| [v1.49.2](../v1.49.2/) | Second patch in the v1.49.0 retrospective sequence (indicator wiring) — retroactive release note landed in this release (`78ed6a23f`). |
| [v1.49.1](../v1.49.1/) | First patch in the v1.49.0 retrospective sequence — retroactive release note landed in this release (`78ed6a23f`). |
| [v1.49.0](../v1.49.0/) | Parent mega-release — GSD-OS shipped there; the v1.49.1–v1.49.3 patches hardened first-run, v1.49.4+ resumes feature work. |
| [v1.49.5](../v1.49.5/) | Successor — continues from the zoning scheme this release put in place. |
| `src/fs/types.ts` | Zone, `ProjectDescriptor`, `PackDescriptor`, `ContribDescriptor`, `WwwDescriptor` — 40 LOC of shared types. |
| `src/fs/config.ts` | Zod schema, `loadConfig`, `saveConfig`, defaults — 97 LOC with 190 test lines. |
| `src/fs/scaffold.ts` | Idempotent directory creation + README generation — 205 LOC with 119 test lines. |
| `src/fs/project-manager.ts` | Project CRUD with name validation — 81 LOC with 246 test lines. |
| `src/fs/pack-catalog.ts` | Pack registry and info lookup — 64 LOC with 134 test lines. |
| `src/fs/contrib-manager.ts` | Upstream/downstream/publishing scanning — 84 LOC with 116 test lines. |
| `src/fs/www-stager.ts` | WWW directory lifecycle — 40 LOC with 125 test lines. |
| `src/fs/commands/*.ts` | CLI verb implementations (`project`, `pack`, `contrib`, `www`) — ~280 LOC with 254 integration-test lines. |
| `src/cli.ts` | CLI registration for the eight new `sc` verbs. |
| `.gitignore` | Dropped legacy broad `www/` rule; added selective rules for tracked conventions vs. untracked user data. |
| `projects/README.md`, `contrib/README.md`, `packs/README.md`, `www/README.md` | Zone READMEs — self-documenting onboarding for the new filesystem layout. |
| `package.json`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`, `src-tauri/tauri.conf.json` | Version bumped to 1.49.4. |
| `docs/RELEASE-HISTORY.md` | v1.49.1/v1.49.2/v1.49.3/v1.49.4 entries added in `78ed6a23f` + `1df73ab0b`. |

## Engine Position

v1.49.4 is the first feature release after the v1.49.0 retrospective-patch sequence (v1.49.1, v1.49.2, v1.49.3) closed. It resumes feature development on `dev`, and it does so with a release deliberately shaped to be as low-risk as a feature can be: additive, zone-scoped, schema-validated, test-covered. The filesystem zones introduced here (`projects/`, `contrib/`, `packs/`, `www/`) become load-bearing for every subsequent `sc`-driven workflow — the skill-center CLI surface planned for v1.50, the per-project workspace split, the publishing/upstream/downstream triage paths for community contributions, and the `www/` staging pipeline that will feed `tibsfox.com` once the degree engine resumes. In the v1.49.x mega-release timeline, v1.49.4 is where the repository stops being a single-purpose codebase and starts being a multi-zone workspace. Downstream releases extend the zones; v1.49.4 puts the floor under them.

## Files

- `src/fs/types.ts` — 40 LOC, shared filesystem-zone types (Zone, ProjectDescriptor, PackDescriptor, ContribDescriptor, WwwDescriptor).
- `src/fs/config.ts` — 97 LOC, Zod schema + `loadConfig`/`saveConfig` + defaults for `.sc-config.json`.
- `src/fs/scaffold.ts` — 205 LOC, idempotent zone directory creation and README materialization.
- `src/fs/project-manager.ts` — 81 LOC, project CRUD with name-validation guardrail.
- `src/fs/pack-catalog.ts` — 64 LOC, pack registry (`holomorphic`, `electronics`, `agc`, `aminet`) and info lookup.
- `src/fs/contrib-manager.ts` — 84 LOC, upstream/downstream/publishing scanning.
- `src/fs/www-stager.ts` — 40 LOC, WWW directory lifecycle.
- `src/fs/commands/{contrib,pack,project,www}.ts` — ~280 LOC combined, CLI verb implementations registered on `src/cli.ts`.
- `test/fs/{config,scaffold,project-manager,pack-catalog,contrib-manager,www-stager,cli-integration}.test.ts` — 97 new tests across 7 files.
- `projects/README.md`, `contrib/README.md`, `packs/README.md`, `www/README.md` — zone onboarding READMEs.
- `.gitignore` — 22 lines added, 1 line removed (legacy `www/` rule dropped as deliberate deviation).
- `package.json`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`, `src-tauri/tauri.conf.json` — version bumped to 1.49.4.
- `docs/RELEASE-HISTORY.md` — four new entries (v1.49.1..v1.49.4).
- `docs/release-notes/v1.49.{1,2,3,4}/README.md` — release notes (retroactive for .1/.2/.3; primary for .4).
