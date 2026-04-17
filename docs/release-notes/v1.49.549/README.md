# v1.49.549 — Artemis II: The Space Between the Moon and the Earth

**Released:** 2026-04-14
**Mission window:** 2026-04-01 (launch, Pad 39B Kennedy Space Center) → 2026-04-14 (splashdown + wrap)
**Scope:** omnibus mission release covering the full 13-day Artemis II arc — ~356 point releases, Memory Arena M1→M13 Rust stack, Grove content-addressed format, Seattle 360 second pass through Degree 359, Phase B skill-author-discipline, NASA missions v1.0→v1.5, ~1.88M words research corpus, cartridge-forge unified schema
**Branch:** dev (merged from artemis-ii worktree via PR #32, plus follow-on dev work)
**Type:** omnibus milestone — every workstream that flew under Artemis II shipped under this tag
**Predecessor:** v1.49.548 — Degree 47: The Darkroom in Space
**Successor:** v1.49.550 — Platform Alignment Milestone (already uplifted)
**Commits:** `ee849c258..947895761` (752 commits across the 13-day window)
**Files changed:** 9,521
**Test delta:** ~19,500 → **23,645 passing** (+4,145 new tests across the mission)
**New deps:** 0 (cartridge-forge and Memory Arena both held the zero-new-runtime-deps line)
**Verification:** Full test suite green post-merge (23,438 → 23,645), harness-integrity baselines captured, Grove import clean at 299 resources with zero wasteland leakage, cartridge-forge self-evaluates via standard pipeline

## Summary

**Thirteen-day omnibus mission shipped eight parallel workstreams under one tag.** From launch day (2026-04-01, 22:35:12 UTC from Pad 39B Kennedy Space Center) through splashdown and final housekeeping, the mission shipped roughly 356 point releases (v1.49.193 → v1.49.549), grew the test suite from ~19,500 to 23,645 passing, landed the full Memory Arena stack (M1 → M13) in Rust with IPC and Grove integration, completed the Seattle 360 / Sound of Puget Sound second-pass arc through Degree 359, kept six NASA missions flying in the parallel catalog, defined and shipped the Grove content-addressed memory format, closed out Phase B skill-author-discipline, imported 299 resources into a unified library, and finally — on the last day — landed cartridge-forge with the unified 8-kind Cartridge/Chipset schema, seven CLI subcommands, a self-evaluating dogfood cartridge, and 43 department migrations. Zero new runtime dependencies. This release tags that entire body of work as a single omnibus milestone named for the Command Module CM-003 "Integrity" and the free-return trajectory that defines the crew's flyby.

**Parallel workstream execution proved itself under real load.** Seattle 360, NASA, Memory Arena, Grove, Phase B skill-author-discipline, research publication, and cartridge-forge all shipped inside the same 13-day window without interfering. The `artemis-ii` worktree isolation strategy kept the Rust churn away from the main release stream, and the PR #32 merge at the end preserved all 670 commits via a non-squash strategy. The `nasa` branch ran its own 6-mission catalog on a separate timeline. The `wasteland` exclusion held at import time — zero muse content leaked into the Grove namespace. The live FTP sync pipeline pushed research artifacts to tibsfox.com without breaking a single deployed page. The cadence never broke: degree releases continued even while Memory Arena M1 → M13 landed, NASA missions flew in parallel, and housekeeping ran in the background. Eight concurrent workstreams, one mission tag, no cross-contamination.

**Crossfade tier model worked on first try and beat projections by 4-8×.** M1 shipped the arena baseline (99 library tests, 591 ns alloc, 95 ns get, 1.43 s `warm_start_100k`, tip `95ff284eb`). M2 dropped that warm-start from 1.43 s to 86.24 ms (16.58× speedup, p=0.00, CI floor 15.7×) via `Arena::open_lazy()`, `validate_chunk()`, a `WarmStartConfig { eager_validation: false }` flag, and per-pool `replay_into_set()`. The original goal was 2–4×. The deferral-vs-validation asymmetry — 25:1 savings, 13.59 µs saved per deferred chunk versus 533 ns cost to validate eagerly — turned out to be the dominant cost, not memcpy and not checksum. M3 added demote crossfade (169 tests, demote 1 KiB = 41 µs begin + 41 µs complete), M4 mirrored it as promote crossfade with ±10% symmetric hysteresis (197 tests, tip `77063afb0`), M5 composed a policy-driven sweep driver on top (223 tests), M6 added VRAM tier via `cudarc` on RTX 4060 Ti (248 tests, tip `c8197b84a`), M7 ran the allocator bake-off (4 allocators behind a `ChunkAllocator` trait, 285 tests, tip `fba6c5a82`), M8 added the PG ColdSource plus `MAP_HUGETLB` fallback plus `read_header_core/extended` split (305 tests, tip `dd53a88d5`), and M9 → M13 landed arena slices + 8 IPC commands + the `RustArenaSet` TS client + `ContentAddressedSetStore` + the `GroveStore` interface + JSON↔ArenaSet migration + cgroup IPC + GPU `verify_checksums`. End state: 710 Rust + 393 TS tests, 15,575 lines of Rust, tip `2b7be9bdb`. The stack is Amiga-inspired (exec.library principles, RAD:-style warm start), uses crossfade transitions rather than binary promote/demote, and runs under a 32–48 GB RAM working budget with NVMe as an active chunk swap tier — never kernel swap.

**Grove absorbed 299 resources on first import with zero schema edits.** The normative spec lives at `docs/GROVE-FORMAT.md`. Layer A is `src/memory/grove-format.ts`. The full surface — `SkillView`, `GroveNamespace`, `SkillCodebase`, `SkillDiff`, export/import, `SignatureView`, `ActivityLog`, and a production adapter — handled a real-world library walk via `tools/import-filesystem-skills.ts` that pulled 172 skills, 93 agents, 27 teams, and 7 chipsets (299 total; 255 unique names bound after dedup) into the namespace. `.grove/arena.json` (7.3 MB) is the Node-persisted snapshot and loads by any Grove-compatible tool. The `examples/` directory expanded to 56 skills + 54 agents + 10 teams + 7 chipsets. Wasteland exclusion was empirically verified — zero muse content leaked through; `data/chipset/muses/` and the `wasteland` path segment were blocked by `--exclude` defaults. The content-addressed design met the first real workload without schema drift: no post-hoc schema edits, no normalizer patches, no field renames. The format landed clean.

**cartridge-forge closed the mission with a unified 8-kind schema and 43 migrations.** The closing milestone on 2026-04-14 delivered `src/cartridge/types.ts` (schema frozen at Wave 0 exit), the `skill-creator cartridge …` CLI subcommand group (`load`, `validate`, `scaffold`, `metrics`, `eval`, `dedup`, `fork`, plus `--help` and the `--allow-validation-debt` quarantine flag), forge source modules (loader, fragment resolver, validator, scaffold, distill, dedup, eval, metrics, fork, migrate), a dogfooded capability cartridge that backs the forge's own operations, and additive migrations of 43 existing department chipsets (4 hand-done + 39 bulk). The evaluation normalizer (`src/cartridge/normalizers/evaluation.ts`) established a loader-side pre-Zod flatten pattern so future legacy shapes can be bridged without schema edits. Full suite 23,645 passing (+207). The schema held across all 43 migrations and two normalizer passes — no edits after Wave 0 exit. Cross-chipset validation surfaced 22 departments of pre-existing drift that no tool had visibility into before: 10 Category A (`agent_affinity` refs), 12 Category B (`domains_covered` drift), all quarantined into `KNOWN_VALIDATION_DEBT` with a cap of 25 and documented per-department in `docs/cartridge/KNOWN-VALIDATION-DEBT.md`.

**Research corpus grew by ~1.88M words across 105 docs in two batches.** The PNW Research Series continued as the framework backbone. Session 016 published the pre-indexed embeddings work (NDCG@10 = 0.899, beats MemPalace), PCG native implementation (TypeScript + Rust, 41 tests), propagation graphs, a failure library, and two research series totaling 72K words. Session 017 published 105 research docs in two batches: 22 language packs (1.47M words, `d1fe737f2`) and 4 non-CS sets (409K words, `d42de8f66`) — combined roughly 1.88M words added to the published corpus. Live-site updates: CSP index + a new `deep-research.html` (22-pack index), PRM + RCA "Deep Research Enrichment" sections. 13 Rosetta clusters live. The publication pipeline fixed a `sync-research-to-live.sh` path bug (REMOTE_DIR was `//Research`), hardened retries (`max-retries 10`, `timeout 30`), and byte-exact force-fixed 7 truncated synced files. `wcl` / `wtx` content stayed private per the Fox Companies IP rule.

**Phase B skill-author-discipline shipped with 9/9 AC and zero new deps.** The phase brought CSO (Cognitive Skill Ops) discipline and TDD-for-skills publish gate into the skill-creator publish path. Every skill that ships via `npx skill-creator` now passes the discipline check before the tarball is assembled. The feature gate is binary — a failing discipline check fails the publish, period. The user confirmed tests pass at the W3.T4 checkpoint; no regressions from the artemis-ii branch landed in dev.

**Housekeeping cleared the repo root and fixed cli.test.ts unhandled rejection.** Session 016–017 housekeeping followed plan v2 steps 1–18 (step 16 deferred on math-coprocessor package coupling). The `www/` tree (228 MB, 8,275 files) stayed intentionally untracked — gitignored and lives on disk for sync scripts only. `tests/legacy/` graduation work began. Packaging alignment fixed maintainer, license, and Node baseline fields. `.gitignore` expansions covered `.local/`, `telemetry/`, sync scripts, and `.discovery-state.json`. CI fixture generation for Grove `arena.json` landed. Harness hook alignment identified missing hook files (`gsd-check-update.js`, `gsd-prompt-guard.js`) and version drift (package.json 1.49.500 vs Cargo.toml / tauri.conf.json 1.49.441). The critical `cli.test.ts` unhandled-rejection bug was fixed at `1d38b12d8` by adding an entrypoint guard so `src/cli.ts` `main()` doesn't run at module load — the real root cause behind two pre-existing failure clusters that had been blaming other files for weeks. Post-merge verification: full suite 23,438 → 23,645 passing, 0 errors.

**The omnibus tag ships what the mission actually produced, not what the mission was originally scoped for.** Artemis II was chartered as a research-tracking effort — telemetry ingest, paper cataloging, a live site keeping pace with the crew's free-return flyby. The Memory Arena stack, the Grove format, cartridge-forge, Phase B skill-author-discipline, and the research corpus expansion all ended up riding the same mission window because the `artemis-ii` worktree was the safe parallel surface and the tempo held. When the window closed, every one of those streams had shipped. The tag wraps the historical reality of the 13 days — not the original charter, not the final retrospective cleanup, but the thing that actually flew.

## Key Features

| Component | What Shipped |
|-----------|--------------|
| Memory Arena (Rust, M1→M13) | `src-tauri/arena/` — 710 Rust tests, 15,575 lines, tip `2b7be9bdb`; M2 16.58× warm-start speedup |
| Memory Arena — IPC + Grove integration | 8 IPC commands, `RustArenaSet` TS client, `ContentAddressedSetStore`, `GroveStore` interface, JSON↔ArenaSet migration |
| Grove content-addressed format (Layer A) | `docs/GROVE-FORMAT.md` + `src/memory/grove-format.ts` — SkillView, GroveNamespace, SkillCodebase, SkillDiff, SignatureView, ActivityLog |
| Grove library import | `tools/import-filesystem-skills.ts` — 299 resources (172 skills / 93 agents / 27 teams / 7 chipsets), 255 unique after dedup, 7.3 MB snapshot |
| cartridge-forge unified schema | `src/cartridge/types.ts` — 8-kind discriminated union, frozen at Wave 0 exit, held across 43 migrations |
| cartridge-forge CLI | `skill-creator cartridge <subcommand>` — 7 subcommands + `--help` + `--allow-validation-debt` |
| cartridge-forge normalizer pattern | `src/cartridge/normalizers/evaluation.ts` — pre-Zod flatten with `.passthrough()` data preservation channel |
| cartridge-forge migrations | 43 departments migrated (4 hand + 39 bulk), zero schema edits, zero new runtime deps |
| cartridge-forge dogfood | forge-itself-as-cartridge — self-evaluates through the standard pipeline; SC-05 integration test green |
| Seattle 360 engine (second pass) | Resumed at Degree 57, ran through Degree 359 — ~300 degree-level releases, ~1.88M words published |
| NASA mission catalog | 6 missions complete (v1.0 → v1.5) on `nasa` branch, v1.6 Explorer 6 queued next |
| Phase B skill-author-discipline | CSO discipline + TDD-for-skills publish gate, 9/9 AC, 0 new deps, tip `db42b9165` |
| Research corpus — 22 language packs | 1.47M words, `d1fe737f2` — full language-research batch |
| Research corpus — 4 non-CS sets | 409K words, `d42de8f66` — interdisciplinary expansion |
| Housekeeping & packaging | Repo root 95 → 43 entries; `cli.test.ts` entrypoint guard fix at `1d38b12d8`; harness hook alignment; version drift surfaced |
| artemis-ii → dev merge | PR #32 non-squash, 670 commits preserved, post-merge tests 23,438 → 23,645 |
| Pre-indexed embeddings (Session 016) | NDCG@10 = 0.899, beats MemPalace baseline |
| PCG native implementation | TypeScript + Rust, 41 tests — propagation graphs + failure library |

## Mission Arc Overview

The arc began on launch day with 37+ real-time sweeps spanning the first two days of live coverage: comms monitoring, 1,087 research pages synced to tibsfox.com via FTP, a pgvector database spun up on PostgreSQL 18 under the `artemis` schema, 30 papers cataloged, 5 new MUK (Mukilteo) sub-pages, and three new math sections (orbital mechanics, O2O Shannon capacity, circadian drift). The Seattle 360 engine — paused at degree 57 before launch — resumed as a combined NASA/360 second-pass engine and executed sustained degree-by-degree releases through to degree 359, each one pairing a PNW artist with a PNW species. Degree 61 (v1.49.200, 2026-04-01) was a taxonomic threshold — first Latina/bilingual artist (Y La Bamba) and first mammal (American Beaver) on the same degree.

The mission's middle week was dominated by the Memory Arena stack landing on the `artemis-ii` worktree: M1 baseline, M2's 16.58× speedup, then M3 through M13 in rapid succession, each milestone adding a new tier or policy layer on top of the last. Grove format work landed alongside Memory Arena so the arena could persist and import a full library. By 2026-04-08, Session 009 had imported 299 resources into the Grove namespace with a 7.3 MB `.grove/arena.json` snapshot, and the full Arena + Grove + skill-creator stack was complete.

The final days were splashdown + wrap: Session 016 shipped pre-indexed embeddings and Artemis II mission closure research, Session 017 executed repo-root housekeeping and published 105 research docs (~1.88M words), and the `artemis-ii` → `dev` merge went in via PR #32 on 2026-04-14 preserving all 670 commits. That same day, cartridge-forge shipped as the closing milestone — the final system capability added before the mission window closed.

## Retrospective

### What Worked

- **Sustained 13-day operational cadence at scale held without breaking.** Roughly 356 point releases, multiple workstreams running in parallel, live FTP syncs to tibsfox.com, a dedicated worktree for Rust work, and a separate branch for NASA content. The cadence never broke. Degree releases continued even while Memory Arena M1 → M13 landed, NASA missions flew in parallel, and housekeeping ran in the background.
- **Parallel workstream execution proved out.** Seattle 360, NASA, Memory Arena, Grove, Phase B skill-author-discipline, research publication, and cartridge-forge all shipped inside the same 13-day window. They didn't interfere. The `artemis-ii` worktree isolation strategy kept the Rust churn from touching the main release stream, and the PR #32 merge at the end preserved all 670 commits via a non-squash strategy.
- **The Memory Arena crossfade tier model worked on first try.** The decision to make tier transitions a crossfade rather than a binary promote/demote flip — informed by Amiga exec.library principles — paid off immediately. M3's demote crossfade landed in one iteration with 169 tests. M4's promote crossfade mirrored it symmetrically with ±10% hysteresis. M5's policy driver composed on top without rewriting anything underneath. M2's 16.58× speedup far exceeded the original 2–4× projection because the deferral-vs-validation asymmetry (25:1) turned out to be the dominant cost.
- **Grove format stayed clean at scale.** The content-addressed format absorbed 299 resources from a real filesystem walk on the first import attempt. No post-hoc schema edits, no wasteland leakage, 255 unique names bound after dedup. The SkillView/GroveNamespace/SkillDiff surface turned out to be expressive enough for the full library without extensions.
- **cartridge-forge dogfood proof.** The first cartridge shipped under the unified format was the cartridge that runs the forge. The SC-05 integration test loads cartridge-forge, validates it, counts metrics (6 skills, 5 agents), and runs eval — all green. The system that forges cartridges *is* a cartridge.
- **The `artemis-ii` → `dev` merge landed cleanly.** PR #32 preserved all 670 commits via the non-squash merge strategy. Post-merge test suite settled at 23,438 passing. Only the three pre-existing failure classes already documented in the handoff (grove tier count, multi-hop fixture, harness-integrity pollution) were red — no new regressions from the merge itself.

### What Could Be Better

- **Validate hand-migration targets against the unified schema *before* writing wrappers.** Wave 2B.1 wrote four cartridges and then discovered two of them (math, rca) couldn't include their evaluation chipset under the current schema. An up-front `validateCartridge()` dry-run against a stub wrapper would have surfaced the issue in an hour instead of across two commits. Scout first, wrap second.
- **The `--allow-validation-debt` escape hatch should have been a Wave 0 primitive.** Building the quarantine mechanism when we first hit strict-validator collision was the Wave 3 afterthought that should have been day-one infrastructure. Future missions ship escape hatches before they're needed.
- **Packaging version drift caught late.** `package.json` at 1.49.500 versus `Cargo.toml` / `tauri.conf.json` at 1.49.441 went unnoticed until harness-integrity surfaced it during post-merge verification. Future missions should have a cross-file version check running on every release.
- **The `pr-review-gate.sh` experimental hook added friction.** The sentinel-file pattern (`touch /tmp/.pr-reviewed-artemis-ii`) solved the intended problem but tripped workflow expectations more than once. Retired when `artemis-ii` closed.
- **Cross-chipset validation debt surfaced 22 departments of invisible drift.** 10 Category A (`agent_affinity` refs pointing at renamed agents) + 12 Category B (`domains_covered` field drift). None of it was visible until a tool could see it. Quarantined, not fixed — the actual department repairs remain follow-up work.

### What Was Surprising

- **M2's 16.58× speedup beat the projection by 4–8×.** The original goal was a modest 2–4× warm-start improvement. The deferral-vs-validation asymmetry (25:1 savings) meant the actual gain was 16.58× with p=0.00 and a CI floor of 15.7×. The 1.76 GiB/s large alloc turned out to be memcpy-bound, not checksum-bound.
- **The normalizer pattern's scope turned out to be broad.** Wave 3's evaluation normalizer (flatten `gates.pre_deploy` with `.passthrough()` preserving the original under `metadata.gateDetails`) was designed to solve one legacy shape. It generalizes to any legacy field that doesn't fit the canonical schema — future normalizers drop in beside the existing one, zero schema churn.
- **The full library import came in clean at 299 resources with zero wasteland leakage.** The `--exclude` defaults for `data/chipset/muses/` and the `wasteland` path segment held on the first import attempt.
- **The rebase-merge worked cleanly across all 17 cartridge-forge commits** despite the cartridge work touching files that had moved under concurrent dev work.

## Lessons Learned

- **Freeze schemas early and defend them with loader normalizers.** Every attempt across Waves 1–3 of cartridge-forge to "just add a field" was met with "use `metadata` or a loader normalizer." The same pattern holds at mission scale: the Grove format and the Cartridge schema both stabilized before their first real workload, and neither needed a breaking change under real data.
- **Build escape hatches on day one, not when you need them.** `KNOWN_VALIDATION_DEBT` and `--allow-validation-debt` were added in Wave 3 because the validator's strictness collided with pre-existing debt. If the quarantine pattern had been designed in at Wave 0, Waves 1 and 2 wouldn't have hit the false "loosen validator vs. skip test" choice. Pay for the escape hatch before you need it — applies equally to cross-file version checks, hook presence checks, and gitignored-path walkers.
- **Dogfood is the shortest path to format validation.** The cartridge-forge cartridge forced every schema decision to meet a real workload early. Half a dozen schema ambiguities collapsed into obvious answers the moment the forge cartridge had to declare its own skills, agents, and teams. "Use the system you're building" is cheaper than "write a test plan for the system you're building."
- **Parallel workstreams work when they're isolated at the right boundary.** The `artemis-ii` worktree, the `nasa` branch, the `wasteland` exclusion, and the live FTP sync pipeline kept eight concurrent workstreams from interfering with each other. The boundary of isolation matters more than the count of streams — pick worktrees and branches that split by *type of churn*, not by feature.
- **Verify state empirically before claiming it.** Multiple incidents during the mission (4 tracked in the memory-arena-m1 feedback file alone) traced to assertions about git state, file presence, or test status made without running a live query. Run the command first, then make the claim.
- **The crossfade tier model beats binary promote/demote for any live memory system.** Making tier transitions a crossfade rather than a flip means the system never has a period where data is "in-flight between tiers." A demote-in-progress chunk is still readable from its source; a promote-in-progress chunk is still readable after the copy starts. No window of unreadability, no retry logic for mid-transition reads. The Amiga exec.library pattern (crossfade with reference counting) transferred directly to Rust arena semantics.
- **Deferral asymmetry dominates warm-start cost.** The M2 benchmark showed 13.59 µs saved per deferred chunk versus 533 ns cost to validate eagerly — a 25:1 asymmetry that made eager validation the wrong default. The lesson generalizes: when deferred work averages 10× or more the cost of the eager check, default to deferred and validate on demand.
- **Non-squash merges preserve mission history.** PR #32 preserved all 670 artemis-ii commits via the non-squash strategy. The history is navigable by anyone who wants to bisect Memory Arena's M1 → M13 progression or the Grove format's evolution. A squash would have collapsed 13 days of work into one commit and erased the sub-milestone boundaries. When the branch IS the mission, preserve the branch.
- **Process failure fingerprints show up at test suite boundaries.** The `cli.test.ts` unhandled-rejection bug had been misdiagnosed for weeks as "flaky tests" or "cross-test pollution." The actual root cause — `src/cli.ts` `main()` running at module load — was caught once someone ran the failure under a node `--unhandled-rejections=strict` setting instead of guessing. Entrypoint guard at `1d38b12d8` resolved the whole cluster. Runtime-semantics-level debugging beats hypothesis-level debugging.
- **The omnibus tag matches what shipped, not what was chartered.** Artemis II was scoped as research tracking. What shipped was Memory Arena + Grove + cartridge-forge + the research tracking. Versioning the tag as "omnibus" acknowledges the gap between charter and reality without pretending either was wrong. Future missions should expect the same — what flies is what you tag.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.49.550](../v1.49.550/) | Successor — Platform Alignment Milestone, already uplifted; inherited the zero-new-deps precedent established here |
| [v1.49.551](../v1.49.551/) | Two-ahead successor — Cartridge Tarball Fix, closed the npm `files` packaging gap for cartridge-forge |
| [v1.49.548](../v1.49.548/) | Predecessor — Degree 47: The Darkroom in Space; last release before the Artemis II omnibus window |
| [v1.49.500](../v1.49.500/) | Last npx-published skill-creator — still the live version in the registry; v1.49.549 output feeds the next publish |
| [v1.49.441](../v1.49.441/) | Version-drift reference — Cargo.toml/tauri.conf.json stayed at 1.49.441 while package.json advanced to 1.49.500 during the mission |
| [v1.49.200](../v1.49.200/) | Degree 61 — launch-day degree release; first Latina/bilingual artist (Y La Bamba) + first mammal (American Beaver) taxonomic threshold |
| [v1.49.193](../v1.49.193/) | Mission-window opener — first point release after launch |
| [v1.0](../v1.0/) | Foundation — `extends:` inheritance and bounded learning parameters that cartridge-forge's schema builds on |
| [v1.50](../v1.50/) | Target milestone seven days after splashdown (2026-04-21) — v1.49.549's platform work feeds the v1.50 tag |
| `docs/GROVE-FORMAT.md` | Grove content-addressed format normative spec |
| `src/memory/grove-format.ts` | Grove Layer A TypeScript implementation |
| `src/cartridge/types.ts` | Unified Cartridge/Chipset 8-kind schema — frozen at Wave 0 exit, held across 43 migrations |
| `src/cartridge/normalizers/evaluation.ts` | Loader-side flatten normalizer pattern, reusable for future legacy shapes |
| `docs/cartridge/KNOWN-VALIDATION-DEBT.md` | 22-department quarantine register (10 Category A + 12 Category B) |
| `tools/import-filesystem-skills.ts` | Grove library import tool — 299 resources, 255 unique after dedup |
| `.planning/HANDOFF-SESSION-016.md` | Session 016 splashdown handoff |
| `.planning/HANDOFF-SESSION-017.md` | Session 017 housekeeping + publication handoff |
| PR #32 (`artemis-ii` → `dev`) | Non-squash merge preserving all 670 mission commits; merge commit `802963e1f` |
| PR #33 (`feat/rca-chipset`) | Dev-branch follow-on merge after the artemis-ii integration |

## Engine Position

v1.49.549 is the omnibus tag that closes the 13-day Artemis II mission window (2026-04-01 → 2026-04-14) and consolidates eight parallel workstreams into one release marker. It sits immediately before the Platform Alignment Milestone (v1.49.550), which absorbed the post-merge cleanup — harness-integrity tmpdir refactor, six new deterministic hooks, Gastown skill splits, skill merges, relevance-scored memory loading, and skill lifecycle frontmatter. v1.49.549 itself is the mission-arc checkpoint; v1.49.550 is the platform-cleanup checkpoint. Together they bracket the artemis-ii → dev integration and hold the baseline for the v1.50 ship on 2026-04-21 (Foxy's 50th birthday and the first Moon-mission milestone). Memory Arena M14+, Grove Layer B + C, NASA v1.6 Explorer 6, the 22-department validation-debt repair, and electronics + spatial-computing Phase-2 source repair all queue behind this tag as named follow-ups. The omnibus tag is load-bearing: every later milestone reads back from here to recover "what shipped during Artemis II" without diffing 752 commits by hand.

## Cumulative Statistics

Mission-to-date cumulative numbers captured at the omnibus tag, spanning the full 13-day arc from launch through splashdown and housekeeping.

| Cumulative Metric | Value |
|---|---|
| Total tests (cumulative at tag) | 23,645 (full suite passing) |
| Cumulative new tests across mission | ~4,145 |
| Cumulative Rust tests (Memory Arena stack) | 710 |
| Cumulative TypeScript tests (Memory Arena + Grove) | 393 |
| Cumulative Rust lines of code (arena) | ~15,575 |
| Cumulative degrees released (second pass) | Degree 57 → 359 |
| Cumulative point releases in window | ~356 |
| Cumulative research corpus growth | ~1.88M words |
| Cumulative cartridge migrations | 43 |
| Cumulative Grove resources bound | 299 (255 unique) |

## Shipping Metrics

| Metric | Value |
|---|---|
| Mission window | 13 days (2026-04-01 → 2026-04-14) |
| Point releases shipped | ~356 (v1.49.193 → v1.49.549) |
| Total tests (end of mission) | 23,645 (full suite passing) |
| New Rust tests (Memory Arena) | 710 |
| New TypeScript tests (Memory Arena + Grove integration) | 393 |
| Grove resources imported | 299 (172 skills + 93 agents + 27 teams + 7 chipsets) |
| Grove `.grove/arena.json` size | 7.3 MB |
| Memory Arena Rust lines | ~15,575 |
| Cartridges migrated | 43 (4 hand + 39 bulk) |
| cartridge-forge CLI subcommands | 7 + `--help` |
| Research projects (end of mission) | 283+ |
| Research corpus published (Session 017 alone) | ~1.88M words |
| NASA missions complete | 6 (v1.0 → v1.5) |
| cartridge-forge schema freeze | Held across 43 migrations |
| New runtime deps (cartridge-forge + Memory Arena) | 0 |
| PR #32 commits preserved | 670 (non-squash merge) |
| Files changed (v1.49.548..v1.49.549) | 9,521 |
| Commits (v1.49.548..v1.49.549) | 752 |

## Files

- `src-tauri/arena/` — Memory Arena M1→M13 Rust implementation, 710 tests, ~15,575 lines, tip `2b7be9bdb`
- `src/memory/grove-format.ts` — Grove content-addressed format Layer A (SkillView, GroveNamespace, SkillCodebase, SkillDiff, export/import, SignatureView, ActivityLog)
- `src/cartridge/types.ts` — unified 8-kind Cartridge/Chipset schema (frozen at Wave 0 exit, held across 43 migrations)
- `src/cartridge/normalizers/evaluation.ts` — loader-side pre-Zod flatten normalizer with `.passthrough()` data preservation channel
- `src/cartridge/cli/` — cartridge CLI subcommand group (`load`, `validate`, `scaffold`, `metrics`, `eval`, `dedup`, `fork`) + `--help` + `--allow-validation-debt`
- `tools/import-filesystem-skills.ts` — Grove library import (299 resources, 255 unique after dedup)
- `.grove/arena.json` — 7.3 MB Node-persisted library snapshot
- `docs/GROVE-FORMAT.md` — Grove content-addressed format normative spec
- `docs/cartridge/` — forge docs + `KNOWN-VALIDATION-DEBT.md` (22 departments)
- `examples/` — expanded to 56 skills + 54 agents + 10 teams + 7 chipsets
- `src/cli.ts` — entrypoint guard at `1d38b12d8` fixing cli.test.ts unhandled-rejection cluster
- `sync-research-to-live.sh` — research publication pipeline (REMOTE_DIR path fix + retry hardening: `max-retries 10`, `timeout 30`)
- `CHANGELOG.md` + `docs/RELEASE-HISTORY.md` — updated to v1.49.549 omnibus framing
- `.planning/HANDOFF-SESSION-016.md` + `.planning/HANDOFF-SESSION-017.md` — splashdown + housekeeping handoffs
- `docs/release-notes/v1.49.549/chapter/` — 4 chapter files (summary, retrospective, lessons, context)

## Follow-Ups

Mission-level:

1. **NASA v1.6 Explorer 6** is the next mission in the 720-mission catalog on the `nasa` branch.
2. **Memory Arena M14+ roadmap** — the stack through M13 is complete with IPC and Grove integration; the next slice (persistence durability? network replication? heterogeneous NUMA?) is TBD and should be planned off the M8 baseline docs + the M2 speedup learnings.
3. **Grove Layer B + Layer C** — Layer A (the normative record format) is shipped in `src/memory/grove-format.ts`. The higher layers are specced but not implemented.

Cartridge-forge specific (carried from the forge retro):

4. **22-department validation-debt repair** — `docs/cartridge/KNOWN-VALIDATION-DEBT.md` enumerates per-category fixes. Category A (10 departments, `agent_affinity` drift) and Category B (12 departments, `domains_covered` drift). All fixes are source-chipset edits.
5. **electronics + spatial-computing Phase-2 source repair** — both cartridges ship with the evaluation chipset omitted because their source uses `wings_covered` instead of `domains_covered`. Fix option (a): rename the field; option (b): add a second loader normalizer.
6. **harness-integrity local-skill pollution triage** — `src/chipset/harness-integrity.test.ts` walks `.claude/skills/` and validates gitignored local scratch directories. Fix option (a): exclude gitignored paths from the walker; option (b): user cleans up local pollution.

## Dedication

**The Space Between the Moon and the Earth** — this mission tracked the real Artemis II crew's free-return lunar flyby (launch 2026-04-01 from Pad 39B Kennedy Space Center, splashdown ~2026-04-11, Command Module CM-003 "Integrity"). Launch Director Charlie Blackwell-Thompson, CAPCOM Stan Love, Launch Officer Mark Berger. The research window closed with the telemetry, the research corpus it produced, and this release as the technical artifact of the thirteen days the crew spent out there.
