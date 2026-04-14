# v1.49.549 — Artemis II: The Space Between the Moon and the Earth

**Released:** 2026-04-14
**Mission window:** 2026-04-01 (launch) → 2026-04-14 (splashdown + wrap)
**Type:** Omnibus mission release — all work shipped under the Artemis II arc
**Branch:** dev (merged from artemis-ii worktree via PR #32, plus follow-on dev work)

## Summary

Artemis II was a 13-day sustained-operations mission that ran in parallel as
a real-world research tracking effort for NASA's Artemis II crewed lunar
flyby AND as the proving ground for several major gsd-skill-creator system
capabilities. From launch day (2026-04-01, 22:35:12 UTC from Pad 39B) through
splashdown and final housekeeping, the mission shipped **~356 point releases**
(v1.49.193 → v1.49.549), grew the test suite from ~19,500 to **23,645
passing**, landed the full **Memory Arena stack (M1 → M13)** in Rust with
IPC and Grove integration, completed the **Seattle 360 / Sound of Puget Sound**
second-pass arc through Degree 359, kept **6 NASA missions** flying in the
parallel catalog, defined and shipped the **Grove content-addressed memory
format**, closed out Phase B **skill-author-discipline**, imported **299
resources** into a unified library, and finally — on the last day — landed
**cartridge-forge** with the unified 8-kind Cartridge/Chipset schema, seven
CLI subcommands, a self-evaluating dogfood cartridge, and 43 department
migrations, all with zero new runtime dependencies. This release tags that
entire body of work as a single omnibus milestone.

## Mission Arc Overview

The arc began on launch day with 37+ real-time sweeps spanning the first
two days of live coverage: comms monitoring, 1,087 research pages synced to
tibsfox.com via FTP, a pgvector database spun up on PostgreSQL 18 under the
`artemis` schema, 30 papers cataloged, 5 new MUK (Mukilteo) sub-pages, and
three new math sections (orbital mechanics, O2O Shannon capacity, circadian
drift). The Seattle 360 engine — which had been paused at degree 57 before
launch — resumed as a combined NASA/360 second-pass engine and executed
sustained degree-by-degree releases through to degree 359, each one pairing
a PNW artist with a PNW species, all synced live.

The mission's middle week was dominated by the Memory Arena stack landing
on the `artemis-ii` worktree: M1 baseline, M2's 16.58× speedup, and then
M3 through M13 in rapid succession, each milestone adding a new tier or
policy layer on top of the last. Grove format work landed alongside
Memory Arena so the arena could persist and import a full library. By
2026-04-08, Session 009 had imported 299 resources (skills, agents, teams,
chipsets) into the Grove namespace with a 7.3 MB `.grove/arena.json`
snapshot, and the full Arena + Grove + skill-creator stack was complete.

The final days were splashdown + wrap: Session 016 shipped pre-indexed
embeddings and Artemis II mission closure research, Session 017 executed
repo-root housekeeping (95 → 43 entries) and published 105 research docs
(1.88M+ words), and the `artemis-ii` → `dev` merge went in via PR #32 on
2026-04-14 preserving all 670 commits. That same day, cartridge-forge
shipped as the closing milestone — the final system capability added
before the mission window closed.

## Workstreams Shipped

### 1. Seattle 360 / Sound of Puget Sound Engine (second pass)

The Seattle 360 engine had paused at degree 57 on the eve of Artemis II
launch. During the mission window it resumed as a combined NASA/360 engine
and executed through Degree 359 ("Unwound — *Leaves Turn Inside You* +
Puget Sound in Silence"), closing the 360-degree arc. Each degree release
paired a PNW musical artist with a PNW species (birds + mammals in scope;
marine/insect/amphibian coverage deferred to NASA). Degree 61 (v1.49.200,
2026-04-01) was a taxonomic threshold — first Latina/bilingual artist
(Y La Bamba) and first mammal (American Beaver) on the same degree.
Roughly 300 degree-level releases shipped in this stream. The research
corpus grew from ~1.76M to ~1.88M+ words. Live FTP sync pipeline, line-art
seed system per degree, CSP and deep-research indices, and byte-exact
force-fix for truncated synced files.

### 2. NASA Mission Series

6 NASA missions complete (v1.0 → v1.5) on the `nasa` branch alongside the
main release stream. 6-track architecture (5 parallel content tracks + 1 QA
gate), local-first data architecture with MCP servers, ~2 TB storage
budget, IP/Fox Companies guardrails, and wall-clock research cadence. The
720-mission catalog is the long-term runway. v1.6 Explorer 6 is queued as
the next mission post-Artemis II.

### 3. Memory Arena Stack (Rust, M1 → M13)

The largest Rust subsystem shipped during the mission. All work on the
`artemis-ii` worktree.

- **M1** — arena baseline, 99 library tests, 591 ns alloc, 95 ns get,
  1.43 s warm_start_100k, tip `95ff284eb`.
- **M2** — 16.58× warm-start speedup (1.43 s → 86.24 ms), p=0.00, CI
  floor 15.7×. `Arena::open_lazy()`, `validate_chunk()`,
  `WarmStartConfig { eager_validation: false }`, per-pool
  `replay_into_set()`. 125 tests, tip `7117f6731`.
- **M3** — demote crossfade. `ChunkState` enum,
  begin/complete/abort_demote, hysteresis cooldown. 169 tests. Demote
  1 KiB = 41 µs begin + 41 µs complete.
- **M4** — promote crossfade + orphan recovery. Symmetric ±10%. Shared
  helpers. Header bytes 80..88. 197 tests, tip `77063afb0`.
- **M5** — policy-driven sweep driver. `run_policy_sweep()` auto
  promotes/demotes. Eviction driver. Access count reset. 223 tests,
  tip `e3d1bed02`.
- **M6** — VRAM tier via cudarc. `VramContext` + `VramPool` + `ArenaSet`
  crossfade RAM↔VRAM on RTX 4060 Ti. 248 tests, tip `c8197b84a`.
- **M7** — allocator bake-off. 4 allocators behind `ChunkAllocator`
  trait with enum dispatch. 285 tests, tip `fba6c5a82`.
- **M8** — PG ColdSource (postgres feature) + MAP_HUGETLB fallback +
  read_header_core/extended split. 305 tests, tip `dd53a88d5`. 8
  baseline docs (M1–M8).
- **M9 → M13 + IPC + Grove integration** — arena slices, 8 IPC commands,
  `RustArenaSet` TS client, `ContentAddressedSetStore`, `GroveStore`
  interface, JSON↔ArenaSet migration, cgroup IPC, GPU
  `verify_checksums`. **710 Rust + 393 TS tests**. 15,575 lines Rust,
  tip `2b7be9bdb`.

The stack is Amiga-inspired (exec.library principles, RAD:-style warm
start), uses crossfade tier transitions rather than binary promote/demote,
and runs under a 32–48 GB RAM working budget with NVMe as an active chunk
swap tier (not kernel swap).

### 4. Grove Content-Addressed Format

Normative spec at `docs/GROVE-FORMAT.md`. Layer A in
`src/memory/grove-format.ts`. Full surface: `SkillView`, `GroveNamespace`,
`SkillCodebase`, `SkillDiff`, export/import, `SignatureView`, `ActivityLog`,
and a production adapter. **299 resources** imported into Grove via
`tools/import-filesystem-skills.ts` (172 skills, 93 agents, 27 teams, 7
chipsets), 255 unique names bound after dedup. `.grove/arena.json` (7.3
MB) is the Node-persisted snapshot loadable by any Grove-compatible tool.
`examples/` expanded to 56 skills + 54 agents + 10 teams + 7 chipsets.
**Zero wasteland content leaked** — `data/chipset/muses/` and `wasteland`
path segment blocked by `--exclude` defaults.

### 5. cartridge-forge Unified Schema & Forge Milestone

Closing milestone of the mission (2026-04-14). Ships the unified
`Cartridge` / `Chipset` schema (8-kind discriminated union), a
`skill-creator cartridge …` CLI subcommand group, forge source modules
(loader, fragment resolver, validator, scaffold, distill, dedup, eval,
metrics, fork, migrate), a dogfooded capability cartridge that backs the
forge's own operations, and additive migrations of 43 existing department
chipsets (4 hand + 39 bulk). Seven CLI subcommands — `load`, `validate`,
`scaffold`, `metrics`, `eval`, `dedup`, `fork` — plus `--help` and the
`--allow-validation-debt` quarantine flag. The evaluation normalizer
(`src/cartridge/normalizers/evaluation.ts`) establishes a loader-side
pre-Zod flatten pattern so future legacy shapes can be bridged without
schema edits. Full suite **23,645 passing (+207)**. **Zero new runtime
dependencies.** Schema (`src/cartridge/types.ts`) frozen at Wave 0 exit
and held across all 43 migrations and two normalizer passes. The
cartridge-forge cartridge evaluates itself through the same pipeline
every user cartridge uses — the first cartridge shipped under the unified
model is the cartridge that teaches the system how to ship more.

See the "Cartridge-Forge Retrospective" H3 section below for the
abbreviated forge-level retro (the full retro is inlined in this same
file rather than split out).

### 6. Phase B skill-author-discipline

Shipped 2026-04-14 on the `artemis-ii` worktree, tip `db42b9165`. 8
commits, 23,300 tests, 0 new deps, all 9 acceptance criteria met. Brings
CSO (Cognitive Skill Ops) discipline and TDD-for-skills publish gate into
the skill-creator publish path.

### 7. Research Corpus Expansion

Research project catalog grew from ~242 to **283+ projects** across
the mission window. PNW Research Series continued as the framework
backbone. Session 016 published the pre-indexed embeddings work
(NDCG@10=0.899, beats MemPalace), PCG native implementation (TypeScript +
Rust, 41 tests), propagation graphs, failure library, and two research
series totaling 72K words. Session 017 published 105 research docs in
two batches: 22 language packs (1.47M words, `d1fe737f2`) and 4 non-CS
sets (409K words, `d42de8f66`) — combined **1.88M+ words** added to the
published corpus. Live-site updates: CSP index + new `deep-research.html`
(22-pack index), PRM + RCA "Deep Research Enrichment" sections. 13
Rosetta clusters live. Publication pipeline: `sync-research-to-live.sh`
path bug fix (REMOTE_DIR double-slash), retry hardening (`max-retries
10`, `timeout 30`), byte-exact force-fix for 7 truncated synced files.
`wcl` / `wtx` content stays private per Fox Companies IP rule.

### 8. Infrastructure & Housekeeping

Session 016–017 housekeeping pass took the repo root from 95 → 43
entries (housekeeping plan v2 steps 1–18; step 16 deferred on
math-coprocessor package coupling). The `www/` tree (228 MB, 8,275
files) is intentionally untracked — gitignored and lives on disk for
sync scripts only. `tests/legacy/` graduation work began. Packaging
alignment fixed maintainer, license, and Node baseline fields.
`.gitignore` expansions covered `.local/`, `telemetry/`, sync scripts,
and `.discovery-state.json`. CI fixture generation for Grove
`arena.json` landed. Harness hook alignment work identified missing
hook files (`gsd-check-update.js`, `gsd-prompt-guard.js`) and version
drift (package.json 1.49.500 vs Cargo.toml/tauri.conf.json 1.49.441).
The critical `cli.test.ts` unhandled-rejection bug was fixed at
`1d38b12d8` by adding an entrypoint guard so `src/cli.ts` `main()`
doesn't run at module load. Post-merge verification: full suite
**23,438 → 23,645 passing, 0 errors**. Multi-hop retrieval fixture
expansion (Q4/Q5/Q6) remains open for follow-up.

## Mission Retrospective

### What went well

**Sustained 13-day operational cadence at scale.** The mission window held
a real tempo: roughly 356 point releases, multiple workstreams running in
parallel, live FTP syncs to tibsfox.com, a dedicated worktree for Rust
work, and a separate branch for NASA content. The cadence never broke.
Degree releases continued even while Memory Arena M1 → M13 landed, NASA
missions flew in parallel, and housekeeping ran in the background.

**Parallel workstream execution proved out.** Seattle 360, NASA, Memory
Arena, Grove, Phase B skill-author-discipline, research publication, and
cartridge-forge all shipped inside the same 13-day window. They didn't
interfere. The `artemis-ii` worktree isolation strategy kept the Rust
churn from touching the main release stream, and the PR #32 merge at the
end preserved all 670 commits via a non-squash strategy.

**The Memory Arena crossfade tier model worked on first try.** The
decision to make tier transitions a crossfade rather than a binary
promote/demote flip — informed by Amiga exec.library principles — paid
off immediately. M3's demote crossfade landed in one iteration with 169
tests. M4's promote crossfade mirrored it symmetrically with ±10%
hysteresis. M5's policy driver composed on top without rewriting
anything underneath. M2's 16.58× speedup far exceeded the original
projection because the deferral-vs-validation asymmetry (25:1, 13.59 µs
saved per chunk vs 533 ns validate per chunk) turned out to be the
dominant cost — not memcpy, not checksum.

**Grove format stayed clean at scale.** The content-addressed format
absorbed 299 resources from a real filesystem walk on the first import
attempt. No post-hoc schema edits, no wasteland leakage, 255 unique
names bound after dedup. The SkillView/GroveNamespace/SkillDiff surface
turned out to be expressive enough for the full library without
extensions.

**cartridge-forge dogfood proof.** The first cartridge shipped under the
unified format was the cartridge that runs the forge. The SC-05
integration test loads cartridge-forge, validates it, counts metrics
(6 skills, 5 agents), and runs eval — all green. This is the most
load-bearing proof available that the unified format works: the system
that forges cartridges *is* a cartridge.

**The `artemis-ii` → `dev` merge landed cleanly.** PR #32 preserved all
670 commits via the non-squash merge strategy. Post-merge test suite
settled at 23,438 passing. The only red cluster was the three pre-existing
failure classes already documented in the handoff (grove tier count,
multi-hop fixture, harness-integrity pollution) — no new regressions
introduced by the merge itself.

### What was surprising

- **M2's 16.58× speedup beat the projection.** The original goal was a
  modest 2–4× warm-start improvement. The deferral-vs-validation
  asymmetry (25:1 savings) meant the actual gain was 16.58× with
  p=0.00 and a CI floor of 15.7×. The 1.76 GiB/s large alloc turned out
  to be memcpy-bound, not checksum-bound.
- **Cross-chipset validation surfaced 22 departments of invisible drift.**
  The cartridge-forge validator cross-checked `agent_affinity` refs
  against `agents:` blocks and evaluation `domains_covered` against
  actual skill domains. 10 departments had Category A drift, 12 had
  Category B drift. None of it was visible until a tool could see it.
- **The normalizer pattern's scope turned out to be broad.** Wave 3's
  evaluation normalizer (flatten `gates.pre_deploy` with `.passthrough()`
  preserving the original under `metadata.gateDetails`) was designed to
  solve one legacy shape. It generalizes to any legacy field that
  doesn't fit the canonical schema — future normalizers drop in beside
  the existing one, zero schema churn.
- **The full library import came in clean at 299 resources with zero
  wasteland leakage.** The `--exclude` defaults for `data/chipset/muses/`
  and the `wasteland` path segment held on the first import attempt.
- **The rebase-merge worked cleanly across all 17 cartridge-forge
  commits** despite the cartridge work touching files that had moved
  under concurrent dev work.

### What we'd do differently

- **Validate hand-migration targets against the unified schema *before*
  writing wrappers.** Wave 2B.1 wrote four cartridges and then
  discovered two of them (math, rca) couldn't include their evaluation
  chipset under the current schema. An up-front `validateCartridge()`
  dry-run against a stub wrapper would have surfaced the issue in an
  hour instead of two commits. Scout first, wrap second.
- **The `--allow-validation-debt` escape hatch should have been a Wave
  0 primitive.** Building the quarantine mechanism when we first hit
  strict-validator collision was the Wave 3 afterthought that should
  have been day-one infrastructure.
- **Packaging version drift caught late.** `package.json` at 1.49.500
  versus `Cargo.toml` / `tauri.conf.json` at 1.49.441 went unnoticed
  until harness-integrity surfaced it during post-merge verification.
  Future missions should have a cross-file version check running on
  every release.
- **The `pr-review-gate.sh` experimental hook added friction.** The
  sentinel-file pattern (`touch /tmp/.pr-reviewed-artemis-ii`) solved
  the intended problem but tripped workflow expectations more than
  once. Retiring when `artemis-ii` closes.

### Cartridge-Forge Retrospective (abbreviated)

The forge milestone itself had four Wave-level observations worth
inlining here for future mission reference. **Wave 0 schema freeze held
across 43 migrations** — `src/cartridge/types.ts` last touched at Wave 0
exit, no edits across Waves 1–3, rescues went through loader normalizers.
**The normalizer pattern is the right tool** — Wave 2B.1 hit the
evaluation shape mismatch and was rescued in Wave 3 by a pure-function
loader normalizer, no cross-cutting refactor. **Dogfood worked as
advertised** — the forge cartridge self-evaluates through the standard
pipeline. **Test isolation via IO sink** — `cartridgeCommand(args, io)`
with injected `CartridgeCommandIO`, 16 CLI tests in ~230 ms, no
subprocess spawning. Two surprises: cross-chipset validation surfaced 22
departments of pre-existing drift (quarantined into `KNOWN_VALIDATION_DEBT`
with a cap of 25), and the `.passthrough()`-as-data-preservation-channel
trick stashed full legacy gate objects under `metadata.gateDetails`
byte-for-byte round-trip verified. Schema edits after W0: zero. New
runtime dependencies: zero. Cartridges migrated: 43 (4 hand + 39 bulk).

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
| Research projects | 283+ |
| Research corpus published | ~1.88M+ words (Session 017 alone) |
| NASA missions complete | 6 (v1.0 → v1.5) |
| cartridge-forge schema freeze | Held across 43 migrations |
| New runtime deps (cartridge-forge) | 0 |
| PR #32 commits preserved | 670 (non-squash merge) |

## Lessons Learned

1. **Freeze schemas early and defend them with loader normalizers.**
   Every attempt across Waves 1–3 of cartridge-forge to "just add a
   field" was met with "use `metadata` or a loader normalizer." The
   same pattern holds at mission scale: the Grove format and the
   Cartridge schema both stabilized before their first real workload,
   and neither needed a breaking change under real data.

2. **Build escape hatches on day one, not when you need them.**
   `KNOWN_VALIDATION_DEBT` and `--allow-validation-debt` were added in
   Wave 3 because the validator's strictness collided with pre-existing
   debt. If the quarantine pattern had been designed in at Wave 0,
   Waves 1 and 2 wouldn't have hit the false "loosen validator vs.
   skip test" choice. The same applies to cross-file version checks,
   hook presence checks, and gitignored-path walkers — pay for the
   escape hatch before you need it.

3. **Dogfood is the shortest path to format validation.** The
   cartridge-forge cartridge forced every schema decision to meet a
   real workload early. Half a dozen schema ambiguities collapsed into
   obvious answers the moment the forge cartridge had to declare its
   own skills, agents, and teams. "Use the system you're building" is
   cheaper than "write a test plan for the system you're building."

4. **Parallel workstreams work when they're isolated at the right
   boundary.** The `artemis-ii` worktree, the `nasa` branch, the
   `wasteland` exclusion, and the live FTP sync pipeline kept eight
   concurrent workstreams from interfering with each other. The
   boundary of isolation matters more than the count of streams —
   pick worktrees and branches that split by *type of churn*, not by
   feature.

5. **Verify state empirically before claiming it.** Multiple incidents
   during the mission (4 tracked in the memory-arena-m1 feedback file
   alone) traced to assertions about git state, file presence, or
   test status made without running a live query. Run the command
   first, then make the claim.

## Follow-Ups

Mission-level:

1. **Tag v1.49.549 as "Artemis II — The Space Between the Moon and the
   Earth"** at the main merge point. This is the omnibus tag for the
   entire 13-day arc.
2. **NASA v1.6 Explorer 6** is the next mission in the 720-mission
   catalog.
3. **Memory Arena M14+ roadmap** — the stack through M13 is complete
   with IPC and Grove integration; the next slice (persistence
   durability? network replication? heterogeneous NUMA?) is TBD and
   should be planned off the M8 baseline docs + the M2 speedup
   learnings.
4. **Grove Layer B + Layer C** — Layer A (the normative record format)
   is shipped in `src/memory/grove-format.ts`. The higher layers are
   specced but not implemented.

Cartridge-forge specific (carried from the forge retro):

5. **22-department validation-debt repair** —
   `docs/cartridge/KNOWN-VALIDATION-DEBT.md` enumerates per-category
   fixes. Category A (10 departments, `agent_affinity` drift) and
   Category B (12 departments, `domains_covered` drift). All fixes
   are source-chipset edits.
6. **electronics + spatial-computing Phase-2 source repair** — both
   cartridges ship with the evaluation chipset omitted because their
   source uses `wings_covered` instead of `domains_covered`. Fix
   option (a): rename the field; option (b): add a second loader
   normalizer.
7. **harness-integrity local-skill pollution triage** —
   `src/chipset/harness-integrity.test.ts` walks `.claude/skills/`
   and validates gitignored local scratch directories. Fix option
   (a): exclude gitignored paths from the walker; option (b): user
   cleans up local pollution.

## Dedication

**The Space Between the Moon and the Earth** — this mission tracked the
real Artemis II crew's free-return lunar flyby (launch 2026-04-01 from
Pad 39B Kennedy Space Center, splashdown ~2026-04-11, Command Module
CM-003 "Integrity"). Launch Director Charlie Blackwell-Thompson, CAPCOM
Stan Love, Launch Officer Mark Berger. The research window closed with
the telemetry, the research corpus it produced, and this release as the
technical artifact of the thirteen days the crew spent out there.
