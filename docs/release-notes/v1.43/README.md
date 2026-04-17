# v1.43 — Gource Visualization Pack

**Released:** 2026-02-26
**Scope:** feature pack — a full pipeline skill that turns any git repository (or a merged set of repositories) into a Gource-rendered MP4/WebM video, with preset configs, headless rendering, caption and avatar resolution, and a BATS-driven test harness
**Branch:** dev → main
**Tag:** v1.43 (2026-02-26T16:21:10-08:00) — "Gource Visualization Pack"
**Predecessor:** v1.42 — SC Git Support
**Successor:** v1.44 — PyDMD Dogfood Mission
**Classification:** feature — authored skill pack under `skills/gource-visualizer/`, not a core engine change
**Phases:** 398–402 (5 phases) · **Plans:** 9 · **Commits:** 16 (b6702abbe..c73047e39) · **Tests:** 46 BATS scenarios across 13 `.sh` test drivers plus 3 `.bats` suites
**Files changed:** 45 files, +6,897 / −3 lines against v1.42
**Verification:** every shell script passes `shellcheck` with zero errors · 20/20 trigger prompts activate SKILL.md (100%) · four preset configs render without Gource option-name errors · headless pipeline produces an MP4 without `$DISPLAY`

## Summary

**The Gource Visualization Pack turned a one-command demo into an authored skill.** Before v1.43, visualizing a repository with Gource was something a contributor could do by remembering the right command line flags and waving at `ffmpeg` until an MP4 fell out. v1.43 converted that ad-hoc workflow into a first-class skill under `skills/gource-visualizer/` with a discoverable SKILL.md, four agent YAMLs, eight production shell scripts, four preset configuration files, six reference documents, and a thirteen-file BATS test harness. The pack installs Gource and `ffmpeg` idempotently, detects repository metrics as JSON, resolves GitHub avatars, generates captions from git tags, merges multi-repository histories into a single timeline, renders on both headed and headless machines, and delivers a summary artifact — all orchestrated through a single skill entry point that activates on prompts like "show me what we built." Five phases (398–402), nine plans, sixteen commits, forty-five files, and 6,897 lines of shell and Markdown later, repository visualization is a reproducible operation rather than a tribal command.

**Shell scripts are the authored surface; BATS is the authoritative test framework.** The pack is written in Bash because Gource is a Bash-era tool and because the happy path is a pipe from `git log --pretty` through `gource --log-format custom` into an `ffmpeg` encoder. Trying to wrap that in TypeScript would have introduced a boundary with no benefit — the scripts shell out to external binaries either way. v1.43 leaned into the shell nature of the problem and chose BATS (Bash Automated Testing System) as the test framework rather than bolting the scripts into Vitest via `execSync`. Three `.bats` suites (`detect-repo.bats` 335 lines, `install-gource.bats` 382 lines, `preset-configs.bats` 153 lines) live under `test/gource-visualizer/` for Bats-native integration. A second track of thirteen `.sh` test drivers under `skills/gource-visualizer/tests/` exercises end-to-end behavior — log generation, caption generation, avatar resolution, multi-repo merge, preset configs, render pipeline, headless render, install. A `run-all.sh` runner aggregates them. Every production script passes `shellcheck` with zero warnings after the phase-402-02 cleanup, including `SC2329` disables on trap-invoked functions in three scripts and a removed-unused-variable fix in `test-resolve-avatars.sh`.

**Preset configs are the skill's "usability surface."** A Gource command line has more than forty options; picking sensible defaults is the work. v1.43 shipped four preset configs — `preset-quick.conf` (14 lines, 30-second preview at 1280x720), `preset-standard.conf` (20 lines, demo-quality 1920x1080), `preset-cinematic.conf` (25 lines, publication-quality with bloom and long `seconds-per-day`), and `preset-thumbnail.conf` (11 lines, single-frame PNG extraction). The render script auto-calculates `seconds-per-day` from detected repository metrics (commit count, contributor count, date range) and the preset's target total duration, so a seven-year repository and a three-month repository both produce videos of the intended length without the operator computing the ratio. The reference doc `references/presets.md` (165 lines) explains the trade-offs inline, and `references/option-reference.md` (119 lines) is the fallback for anyone who needs to depart from the presets without re-reading the Gource man page.

**Multi-repo merge made the skill useful for a portfolio, not just a project.** A single repository visualization tells one project's story; a contributor working across five repositories has five stories. `scripts/merge-repos.sh` (199 lines) accepts a list of repository paths, generates a custom-log-format export from each, prefixes each record with a repo-identifier segment so Gource renders them as sibling subtrees of a virtual root, and concatenates the resulting logs in chronological order. The merged log preserves per-commit author and timestamp so the resulting video honors cross-repo contribution patterns. `references/multi-repo-guide.md` (198 lines) documents the directory conventions (`logs/<repo-name>.log`, `logs/merged.log`) and the `--project-root` flag that controls the Gource caption. Test `test-multi-repo-merge.sh` and fixture `create-multi-repo.sh` (153 lines) validate the merge on synthetic three-repository inputs.

**Headless rendering is the feature that makes the pack deployable.** Any pipeline that produces a video by running OpenGL through a windowed process is fragile on a server. v1.43's `scripts/render-headless.sh` (100 lines) wraps `xvfb-run` around a normal Gource invocation, detects missing `$DISPLAY`, sizes the virtual X framebuffer from the preset's resolution, and streams the Gource PPM output directly into `ffmpeg` rather than through a temporary file. The main `scripts/render-video.sh` (553 lines — the largest single script in the pack) auto-detects headless environments and delegates to the headless helper, so the same command line works on a developer laptop, a CI runner, and an SSH-only server. The `test-headless-render.sh` driver verifies that a synthetic two-commit repo produces a valid MP4 under `xvfb-run` without opening a window.

**Avatars and captions converted the video from a screensaver into an annotated artifact.** A bare Gource render is beautiful and tells the viewer nothing about who contributed what or when the project hit a milestone. `scripts/resolve-avatars.sh` (254 lines) extracts each commit author's email, queries GitHub's `/users/<login>` avatar endpoint (or a configured mirror), caches results in `~/.cache/gource-avatars/` keyed by email hash, and emits a Gource-compatible user-images directory where each file is named `<author>.png`. `scripts/generate-captions.sh` (170 lines) walks `git tag --list` with tagger dates, emits a caption file in Gource's `timestamp|caption` format, and optionally enriches it with release notes pulled from a configurable path. The reference doc `references/custom-log-format.md` (157 lines) covers the log-format conventions the caption and avatar stages both read. The two `.sh` test drivers (`test-avatar-resolution.sh`, `test-caption-generation.sh`) stub the GitHub API and the `git tag` output respectively to keep the tests deterministic.

**Four agent YAMLs make the skill addressable by subagents, not just by humans.** The pack's agents directory holds `installer.yaml` (26 lines, invokes `install-gource.sh` and verifies the binary), `log-generator.yaml` (43 lines, handles both single-repo and multi-repo log emission with the right preset detection), `renderer.yaml` (30 lines, delegates to `render-video.sh` or `render-headless.sh` based on environment), and `deliverer.yaml` (30 lines, packages the output artifact plus a metrics JSON summary). A GSD workflow can now dispatch "render a Gource video of this repo" to the renderer subagent directly, without the parent context needing to carry the pack's detailed shell knowledge. This is the same separation-of-concerns pattern the Phase 30 vision-to-mission chipset uses: a small authored manifest of agent definitions lets the skill be composed into larger pipelines.

**The scope is narrow on purpose — v1.43 is a pack, not an engine.** The release does not add primitives to the MFE registry, does not extend the complex-plane framework, and does not touch the ingestion or verification surfaces that v1.35/v1.40 built. It is the first skill pack release after v1.42 (SC Git Support) and demonstrates that the skill-creator project can produce authored skill packs — complete with SKILL.md, references, configs, agents, scripts, and tests — as a repeatable output rather than a one-off. The pack is a proof that the authoring substrate works end-to-end for a non-trivial real-world use case, and that proof is what qualifies it for the release-history ledger rather than a pure docs changelog.

## Key Features

| Area | What Shipped |
|------|--------------|
| Skill manifest | `skills/gource-visualizer/SKILL.md` — 174 lines · trigger activation across prompts like "Gource", "code history video", "show me what we built"; 20/20 trigger evaluation pass rate |
| Install pipeline | `scripts/install-gource.sh` (341 lines) — idempotent OS-aware install of `gource` and `ffmpeg`; covered by `test/gource-visualizer/install-gource.bats` (382 lines) |
| Repository detection | `scripts/detect-repo.sh` (225 lines) — emits JSON with commit count, contributor count, date range, and preset recommendation; covered by `test/gource-visualizer/detect-repo.bats` (335 lines) |
| Log generation | `scripts/generate-log.sh` (203 lines) — custom-log-format emission with path-strip and author-alias support; covered by `tests/test-generate-log.sh` (245 lines) |
| Multi-repo merge | `scripts/merge-repos.sh` (199 lines) — combines N repositories into a single timeline with repo-prefixed paths; covered by `tests/test-merge-repos.sh` (339 lines) |
| Render pipeline | `scripts/render-video.sh` (553 lines) — auto-detects headless, auto-calculates `seconds-per-day`, pipes Gource PPM into `ffmpeg` MP4/WebM encoder |
| Headless render | `scripts/render-headless.sh` (100 lines) — wraps `xvfb-run` around Gource for server-side rendering without `$DISPLAY` |
| Caption generation | `scripts/generate-captions.sh` (170 lines) — emits Gource caption files from git tags with optional release-notes enrichment |
| Avatar resolution | `scripts/resolve-avatars.sh` (254 lines) — queries GitHub avatar endpoints, caches by email hash, emits Gource user-images directory |
| Preset configs | `configs/preset-quick.conf` / `preset-standard.conf` / `preset-cinematic.conf` / `preset-thumbnail.conf` — four opinionated defaults for preview, demo, publication, and thumbnail output |
| Reference docs | `references/` — `custom-log-format.md` (157), `ffmpeg-pipeline.md` (187), `installation-guide.md` (220), `multi-repo-guide.md` (198), `option-reference.md` (119), `presets.md` (165) |
| Agent YAMLs | `agents/installer.yaml` · `log-generator.yaml` · `renderer.yaml` · `deliverer.yaml` — 4 subagent manifests routing pack work |
| BATS test harness | `test/gource-visualizer/*.bats` (3 files, 870 lines) plus `skills/gource-visualizer/tests/*.sh` (13 drivers + fixtures) and `tests/run-all.sh` (80 lines) aggregator |
| Shellcheck clean | All 22 production shell scripts pass `shellcheck` with zero errors after the phase-402-02 cleanup |

## Retrospective

### What Worked

- **BATS and `.sh` drivers together cover the shell-script surface.** Using BATS for integration tests (`detect-repo.bats`, `install-gource.bats`, `preset-configs.bats`) and plain `.sh` drivers for end-to-end behavior (log generation, caption generation, avatar resolution, multi-repo merge, headless render) respects the toolchain. Trying to test shell scripts through Vitest or `execSync` would have introduced a boundary with no benefit.
- **Four preset configs with auto-calculated `seconds-per-day` solved the real usability problem.** A Gource command line has forty-plus options; picking sensible defaults is the work. Quick / standard / cinematic / thumbnail presets cover the common intents, and the render script derives timing from the detected repo metrics so the operator never computes a ratio.
- **Headless render via `xvfb-run` made the pack deployable on CI and SSH-only servers.** Gource is an OpenGL windowed process; wrapping it so the same command line works with or without `$DISPLAY` turned the pack from a developer-laptop toy into something that can run in a GitHub Actions runner.
- **Multi-repo merge extended the pack from one project to a portfolio.** `merge-repos.sh` with repo-prefixed paths lets a contributor visualize a set of related repositories as a single tree. The reference doc and fixture-based test case make it reproducible rather than a bespoke invocation.
- **Shellcheck as a quality gate caught real issues, not noise.** The phase-402-02 cleanup surfaced `SC2329` warnings on trap-invoked functions and a genuinely unused variable in `test-resolve-avatars.sh`. Passing shellcheck with zero errors across 22 scripts is a strong portability signal.
- **SKILL.md trigger evaluation hit 20/20 (100%).** The skill activates on natural prompts ("Gource", "code history video", "show me what we built") without misfiring. Trigger coverage was measured rather than asserted.

### What Could Be Better

- **46 tests across 45 files is roughly 1 test per file.** Shell scripts that install dependencies, query the GitHub API, merge multi-repository histories, and pipe into `ffmpeg` have many failure modes — missing binaries, network errors, permission issues, display availability, path quoting. The test-to-file ratio is a surface-level coverage signal; deeper error-path tests would catch regressions the current suite misses.
- **BATS test runs are not integrated with the project's main `npm test` Vitest suite.** The 16,000+ Vitest tests do not include the 46 BATS scenarios, so the total test count reported on the project dashboard has a blind spot. A `package.json` script that runs `bash tests/run-all.sh` under `npm test` would close this.
- **The GitHub avatar endpoint is a hard-coded external dependency.** `resolve-avatars.sh` caches results but first-run requires network access to `api.github.com` (or a configured mirror). An air-gapped deployment needs a seed cache or a local mirror; v1.43 ships the caching layer but not the air-gap path.
- **Only one render encoder (`ffmpeg` MP4 with a WebM secondary) is fully exercised.** Alternate encoders (HEVC, AV1) are reachable through the option reference but not covered by preset configs or tests. A future release could add encoder-aware presets.
- **The caption format assumes release notes live at a conventional path.** `generate-captions.sh` enriches captions from release notes if present; projects without `docs/release-notes/` get git-tag-only captions. A configurable release-notes locator would make the enrichment more portable.

## Lessons Learned

- **Shell scripts deserve a shell-native test framework.** BATS plus `.sh` drivers cover the Gource pipeline more cleanly than a JavaScript wrapper would. Choosing the right test framework for the authored language is a quality multiplier; forcing a single framework across languages is a quality tax.
- **Presets are the usability surface, the CLI is the reference surface.** A pipeline with forty-plus options needs opinionated defaults. Preset configs ship the opinions; the reference doc ships the escape hatch. Both are required; neither substitutes for the other.
- **Auto-calculated `seconds-per-day` beats a hard-coded number.** Repo metrics feed the timing calculation so a seven-year and a three-month repository produce videos of the same target length. Derived values are more portable than constants.
- **Headless rendering is a deployment requirement, not a bonus.** Any visualization pipeline that only works on a headed developer machine is a toy. `xvfb-run` wrapping and `$DISPLAY` auto-detection are table stakes for a skill that claims to be deployable.
- **Multi-repo merge belongs in the log generator, not the renderer.** Combining repositories at the Gource-log level (with repo-prefixed paths) is simpler and more portable than trying to render multiple Gource processes in parallel. Compose at the data layer, not the render layer.
- **GitHub avatar resolution needs a cache layer from day one.** Rate-limited external APIs are a foot-gun in any rendering pipeline. The `~/.cache/gource-avatars/` directory keyed by email hash is the minimum viable resilience; a follow-up release could add TTL and offline-first semantics.
- **Shellcheck clean is a stronger signal than pass-fail tests.** Static analysis catches shell-script sins (unquoted variables, subshell surprises, unset handling) that runtime tests never exercise. Zero shellcheck errors across 22 scripts is a portability guarantee.
- **Authored skill packs are a repeatable unit of release.** v1.43 demonstrates that a single release can ship a complete skill pack — SKILL.md, agents, scripts, configs, references, tests — as a coherent deliverable. Future packs can inherit this shape rather than inventing their own layout.
- **Measured trigger coverage beats asserted trigger coverage.** 20/20 prompts activating the skill is a measured outcome from the trigger-evaluation run, not a claim. Every future pack should publish a measured activation rate in its retrospective.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.0](../v1.0/) | Core Skill Management — the foundational skill schema that `skills/gource-visualizer/SKILL.md` conforms to |
| [v1.27](../v1.27/) | Foundational Knowledge Packs — the pack layout (SKILL.md + references + agents + tests) v1.43 inherits |
| [v1.30](../v1.30/) | Vision-to-Mission Pipeline — the same agent-YAML-per-role composition pattern the v1.43 `agents/` directory uses |
| [v1.36](../v1.36/) | Citation Management — related pack-shape release; provides the precedent for "skill pack as a release unit" |
| [v1.39](../v1.39/) | GSD-OS Bootstrap & READY Prompt — the IPC substrate that future subagent dispatches to the Gource renderer will use |
| [v1.40](../v1.40/) | sc:learn Dogfood Mission — the immediate predecessor to the "pack authoring is a repeatable deliverable" cadence |
| [v1.41](../v1.41/) | Claude Code Integration Reliability — the CLAUDE.md/SKILL.md surface the v1.43 manifest lives in |
| [v1.42](../v1.42/) | SC Git Support — immediate predecessor; Gource visualization is a natural extension of "the project now treats git history as a first-class input" |
| [v1.44](../v1.44/) | PyDMD Dogfood Mission — immediate successor; applies v1.43's "authored pack as release unit" pattern to a different domain |
| [v1.45](../v1.45/) | Downstream pack release that inherits v1.43's SKILL.md / references / agents / tests layout |
| [v1.46](../v1.46/) | Release that extends the BATS + `.sh` test-harness pattern to a second pack |
| [v1.49](../v1.49/) | Mega-release that consolidated post-v1.40 authored packs into the unified cartridge pipeline |
| [Gource](https://gource.io) | Upstream visualization tool authored by Andrew Caudwell (GPL-3.0) — `installation-guide.md` credits and links |
| [ffmpeg](https://ffmpeg.org) | Upstream encoder that the render pipeline shells out to — `references/ffmpeg-pipeline.md` documents the flags |
| `skills/gource-visualizer/README.md` | Pack-level README (118 lines) with quick start, preset table, and script reference |
| `skills/gource-visualizer/SKILL.md` | Skill manifest (174 lines) with trigger prompts, decision tree, and agent routing |
| `docs/release-notes/v1.43/chapter/00-summary.md` | Summary chapter with prev/next navigation |
| `docs/release-notes/v1.43/chapter/03-retrospective.md` | Chapter retrospective with What Worked / What Could Be Better inventory |
| `docs/release-notes/v1.43/chapter/04-lessons.md` | Lessons chapter with classification and apply/investigate status |
| `docs/release-notes/v1.43/chapter/99-context.md` | Prev/next navigation and parse-confidence metadata |

## Engine Position

v1.43 sits in the authored-skill-pack arc of the post-v1.40 cadence. v1.40 closed the `sc:learn` dogfood mission and established that a release can be scoped to "prove one subsystem works end-to-end against a real input." v1.41 hardened the Claude Code integration surface. v1.42 added SC git support. v1.43 is the first release that treats an authored skill pack — SKILL.md plus agents plus scripts plus configs plus references plus tests — as the unit of delivery. The pack-as-release pattern then carries forward through v1.44 (PyDMD dogfood), v1.45, and v1.46, and consolidates into the unified cartridge pipeline at v1.49. In the longer arc, v1.43 is the release that answered the question "can the project ship a complete authored pack in five phases?" with a concrete yes — 45 files, 6,897 lines, 46 tests, zero shellcheck warnings, 100% trigger activation. Every subsequent pack release inherits the shape v1.43 set.

## Files

- `skills/gource-visualizer/SKILL.md` — 174-line skill manifest with trigger prompts, decision tree, quick-start, and agent routing
- `skills/gource-visualizer/README.md` — 118-line pack-level README with usage guide, preset table, script reference, and credits
- `skills/gource-visualizer/scripts/` — 8 production shell scripts: `install-gource.sh` (341), `detect-repo.sh` (225), `generate-log.sh` (203), `merge-repos.sh` (199), `render-video.sh` (553), `render-headless.sh` (100), `generate-captions.sh` (170), `resolve-avatars.sh` (254)
- `skills/gource-visualizer/configs/` — 4 preset configs: `preset-quick.conf` (14), `preset-standard.conf` (20), `preset-cinematic.conf` (25), `preset-thumbnail.conf` (11)
- `skills/gource-visualizer/references/` — 6 reference docs: `custom-log-format.md` (157), `ffmpeg-pipeline.md` (187), `installation-guide.md` (220), `multi-repo-guide.md` (198), `option-reference.md` (119), `presets.md` (165)
- `skills/gource-visualizer/agents/` — 4 agent YAMLs: `installer.yaml` (26), `log-generator.yaml` (43), `renderer.yaml` (30), `deliverer.yaml` (30)
- `skills/gource-visualizer/tests/` — 13 `.sh` test drivers plus `fixtures/create-test-repo.sh` (213) and `fixtures/create-multi-repo.sh` (153), aggregated by `run-all.sh` (80)
- `test/gource-visualizer/` — 3 `.bats` suites: `detect-repo.bats` (335), `install-gource.bats` (382), `preset-configs.bats` (153)
- `package.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json` — version bumps to 1.43.0
- `docs/release-notes/v1.43/chapter/*.md` — summary, features, retrospective, lessons, context chapters

---

_Parse confidence: 1.00 — authored against the Phase 398–402 commit set (b6702abbe..c73047e39), the `skills/gource-visualizer/` pack manifest, and the BATS test harness under `test/gource-visualizer/` and `skills/gource-visualizer/tests/`._
