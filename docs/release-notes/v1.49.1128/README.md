# v1.49.1128 — The Flywheel Capability Roadmap: The Adaptive-Learning Loop Closes From Observation Through Memory, College, Research, and Learning Into a Navigable Whole

**Shipped:** 2026-07-13
**Branch:** dev → main
**Type:** dev-line engineering ship (not a NASA degree)

## Summary

v1.49.1128 ships the **flywheel capability roadmap** — the entire 24-feature design that turns skill-creator's adaptive-learning subsystems from a set of disconnected pipelines into a single, navigable loop. Alongside the flagship **MemorySink** (the first real `ObservationSink` — a tested, opt-in capability that can promote mined patterns into recallable `lesson`/`finding` memories once a live observation flow is wired to it; it has no production callsite yet), the release wires the College, Research, Learning, and cross-cutting intelligence tracks so that a signal captured at one end of the system — an observation, a correction, a research source, a co-activation cluster — *can* travel through mining, memory, calibration, and promotion, and be joined and inspected via a new `flywheel status` command.

This is a large, interleaved ship: **182 commits ahead of `origin/main`** (the v1.49.1127 tip `a9135f77e`), comprising **145 pre-flywheel backlog commits** (item-7 auto-correction attribution, the MEM-7 memory work, a deferred-follow-ups cluster, and cargo/hygiene fixes) and **37 flywheel-session commits** (`82421a34b..b25614545`). In aggregate: **657 files changed, +47,167 / −6,903 lines**, spanning the TypeScript library and CLI (`src/`), the Rust backend (`src-tauri/`), the College structure (`.college/`), the release/adoption tooling, and the teams/chipsets examples.

Much of the flywheel work is deliberately a **bounded first cut**: each feature is a working, tested slice with its heavy-ML core stubbed behind a clean seam. Where an intelligent core needs real infrastructure rather than wiring — claim-extraction NLP, distill-enrichment fill, try-session pedagogy, live co-activation density — the seam is present and the deferral is documented (see *Still Open*, below). The ship is honest about that line.

## Mission Overview

The "flywheel" is the metaphor for skill-creator's adaptive-learning layer: every session observed feeds pattern mining; mined patterns become memories; memories inform the College's concept map and calibration; the College's evidence suggests cross-references and try-sessions; research sources and citations back claims; corrections and drift signals valve back into refinement; and telemetry gates what actually gets promoted into a skill. Before this release those subsystems existed but did not *connect* — each was a pipeline with an unwired downstream. The flywheel roadmap's job was to close the loops.

The work landed as **four sequential agent waves** (A–D). Each feature was built TDD-first, verified against `tsc --noEmit` plus its touched test suites plus the two chokepoint audits (LoaderContext and ProcessContext), and committed as one atomic conventional commit, with a main-context global verification between waves. Wave D was a follow-up pass that closed the last live-callsite tails: folding the knowledge spine into the gap radar, adding entry points to the source ledger, wiring the reverted-commit git signal at its real callsites, and making the flywheel join precise across precedent and citation sources.

## Key Features

### Flagship — Memory

- **MemorySink** (`5abffa701`) — the first real `ObservationSink`: given an observation stream, it can promote mined patterns into durable `lesson`/`finding` memories that the recall path surfaces later, where pattern mining previously terminated at a report. It is the keystone the loop is *designed* around — but it ships as a tested, opt-in library capability with **no production `ObservationEmitter` callsite yet** (its factory constructs nothing by default). Wiring a live observation flow into it is a documented follow-up (see *Still Open*), so this ship makes the loop *closable*, not yet closed in production.

### College — the Rosetta / department structure

- **`college` CLI namespace** (`586cdc827`) — a first-class command surface over the `.college/` departments (culinary-arts, mathematics, mind-body, and the Rosetta Core).
- **ConceptRegistry populator** (`efcf96e94`) — populates the registry with **975 concepts**, each carrying its panel assignment and a complex-plane position.
- **Department scaffolder** (`445eae5ba`) — scaffolds a discoverable department tree from the CLI.
- **Department doctor** (`689e5117b`) + **threshold flags** (`c2ff6825f`) — a coverage audit for departments, with `--min-concepts` / `--min-sessions` thresholds exposed as flags.
- **Calibration wiring** (`8e4c64f01`) — wires the calibration engine into feedback and gates the usage signal.
- **Cross-department xref suggestion** (`504ca7758`) + **semantic edge discovery** (`fa8c108f6`) — suggests cross-department cross-reference edges from evidence, with an embedding-based `xref suggest --semantic` mode.
- **Try-session generation** (`44a23830d`) — generates draft try-sessions from department concepts.
- **Real Rosetta translation** (`452d2357e`) — `college translate` now performs real cross-panel translation through the dynamically-imported Rosetta stack (rather than a stub).

### Research — VTM, citations, gap radar, source ledger

- **Scholarly resolver adapters** (`6a2d8f312`) — semantic-scholar, DBLP, and PubMed resolver adapters for citation resolution.
- **Corpus-aware research gap radar** (`d0c4d25f9`) + **knowledge-spine fold-in** (`690ae6ccc`) — a gap radar that measures corpus coverage, extended in Wave D to fold the knowledge spine into that coverage signal.
- **Unified source ledger** (`d338b1edd`) + **scLearn/citation entry points** (`7612ad8cf`) — an append-only source ledger with two entry points, extended with `scLearn` and citation entry points at their real callsites.
- **Citation integrity gate** (`a5cfeb604`) + **claim-support harness** (`3004826cb`) + **integrity-gate coverage** (`2f4421103`) — gates ingest on integrity-audit signals and adds a citation-backed claim-support harness with test coverage.
- **`cartridge distill`** (`577aa81f1`) — distills validated cartridges from research sources.

### Learning — drift, contradiction, quarantine, reverted-commit, dogfood, experience routing

- **Drift + contradiction valves** (`74f66a8c7`) — wires drift and contradiction guards into the `refine` command.
- **Feedback quarantine triage** (`e192b87b2`) — batch-review triage for quarantined feedback.
- **Reverted-commit correction signal** (`fe0ef283a`) + **git wiring** (`4d7ec77e9`) — a new correction signal derived from reverted commits, wired into the `detect-corrections` callsites.
- **Dogfood → drafts** (`42f831b1f`) + **run persistence** (`6dea3b46f`) — routes `create` SkillUpdates into staged skill drafts, and persists refine-run output so `promote` can consume it.
- **Experience-level router** (`d5d49dab5`) — routes captured signals along the episodic → procedural → declarative axis.
- **Bounded-learning calibration** (`ff8f5e477`) — brings the refinement-engine knobs under the calibration engine.

### Cross-cutting — intelligence, telemetry, cartridge, retro, flywheel

- **intelligence.db → pgvector mirror** (`825721c90`) + **`mirror-findings` CLI** (`417f6368d`) — mirrors KB findings into pgvector for cross-project recall, with a CLI trigger to run the sync.
- **Telemetry ROI gate** (`e678ec5c1`) — an advisory telemetry-driven ROI gate on skill mint.
- **Co-activation department draft** (`3ab390276`) — mints a department draft from co-activation evidence.
- **Retro milestone driver** (`c4e1b46a7`) — a milestone driver plus action router for retrospectives.
- **`flywheel status` capstone** (`d562f36a6`) + **precise upstream join** (`b25614545`) — joins lineage across the whole flywheel into a navigable `status` command (with `--html`), extended in Wave D to join precisely across precedent and citation sources.
- **College → pattern-pipeline binding** (`719cb7f21`) — binds the college connector to the observation pattern pipeline.
- **Help coverage** (`9bc7854ab`) — adds help lines for the `retro` and `dogfood` commands so the dispatch↔help parity audit stays green.

### Backlog shipped alongside (the 145 pre-flywheel commits)

- **Item-7 auto-correction attribution** — correction attribution that is QUARANTINE-only and **never auto-attributes** (`skillName` is left null; a human accepts via `feedback quarantine accept`). This is a safety-first design in a self-modifying system: the machine proposes, a human disposes.
- **MEM-7 memory work** — nine `feat(memory)` + six `fix(memory)` + three `test(memory)` commits hardening the memory subsystem.
- **Deferred-follow-ups cluster** — a frontmatter gate, a skill-forge peer, a knip dead-code sweep (66 → 6), a fail-closed `feedback record`, and cargo hygiene.
- **Adoption baselines** — 25 `docs(audit)` commits recording adoption-baseline snapshots, plus install, settings, orchestrator, and agent fixes.

## Structural firsts

- **First real `ObservationSink`.** MemorySink is the first sink *built* to close the observe → mine → *remember* loop with durable, recallable memories rather than a terminal report. The sink exists and is tested; a production callsite that pumps it is still a seam (see *Still Open*).
- **First navigable flywheel join.** `flywheel status` is the first command that traverses lineage across all of the adaptive-learning subsystems and renders it (including `--html`), joining precedent and citation sources precisely.
- **First real `college translate`.** Cross-panel Rosetta translation runs against the live Rosetta stack instead of a stub, reached via a computed dynamic `import()` because `src/` cannot statically import `.college/`.
- **First embedding-driven xref discovery.** `xref suggest --semantic` discovers cross-department edges from embedding similarity rather than only from explicit evidence.

## Decisions Made

- **Ship the 182-commit scope as one dev-line release, not a cherry-picked subset.** The 37 flywheel commits are interleaved with 145 backlog commits and cannot be cleanly separated; the operator confirmed shipping all of `dev` as v1.49.1128.
- **Renumber the reserved NASA milestone.** NASA observation #31 was reserved for the next degree; it is renumbered to **v1.49.1129** so the dev-line ship can take v1.49.1128 without disturbing the NASA cadence.
- **Bounded first cut over blocked completeness.** Each flywheel feature ships as a working, tested slice with its heavy-ML core stubbed behind a documented seam, rather than blocking the whole roadmap on unbuilt infrastructure.
- **Attribution stays human-gated.** In a self-modifying system, auto-correction attribution is QUARANTINE-only and never writes a `skillName` automatically — a human must accept.
- **Respect the `src/` → `.college/` boundary.** Because `tsconfig` sets `rootDir=src`, the `college`/`flywheel` CLIs reach `.college/` via a computed dynamic `import()` (`moduleUrl()` in `src/cli/commands/college.ts`) rather than a static import, preserving the build boundary.
- **Avoid the chokepoint basenames.** New `src/` files deliberately avoid the `loader|reader|scanner|walker|store` basenames that red-gate the LoaderContext audit, and keep `child_process` inside already-gated modules — so no new chokepoint waivers were needed (`KNOWN_UNWIRED=0`).

## Lessons Learned

- **Wiring is cheap; cores are expensive — and honesty about the line is the deliverable.** The flywheel roadmap proved that connecting subsystems (seams, entry points, routers, joins) is fast and testable, while the intelligent cores behind those seams (claim NLP, distill fill, pedagogy authoring) need real infrastructure. Shipping the wiring with the cores stubbed — and *documenting exactly which is which* — is more valuable than a half-built monolith.
- **A shared session-retro file is a footgun under sub-agents.** Sub-agents that run `tools/session-retro/observe.mjs start/end` clobber the parent mission's session state because the file is shared. Self-observing agents must not be relied on for parent-session retro capture.
- **The dynamic-import boundary has a runtime cost.** Because `.college/` is not emitted to `dist`, the `college`/`flywheel` verbs run fine under `tsx`/`vitest` but require `.college` to be compiled to run from the shipped binary — a pre-existing condition the flywheel work inherits, not introduces.
- **Targeted sweeps are not the full suite.** The Wave sweeps ran targeted suites (5797 pass / 0 fail on the Wave-D tip); the pre-tag gate is the first time the full ~36k-test suite runs against this dev tip. Plan for that to be the real gate.

## Surprises

- **The loop's design turned on a small keystone.** A single sink (MemorySink) is all the loop is *designed* to need to become bidirectional — the downstream connections were mostly already latent, waiting for a durable memory target. The keystone is in place and tested; triggering it from a live observation flow is the remaining wiring, not more design.
- **975 concepts already carried panel + position structure.** Populating the ConceptRegistry surfaced that the College's concept corpus was richer and more geometrically organized (complex-plane positions) than a flat list, which made the semantic xref discovery immediately useful.
- **The backlog was larger than the marquee work.** The 145 pre-flywheel commits (auto-correction attribution, MEM-7, deferred follow-ups) outnumbered the 37 flywheel commits nearly 4:1 — the release is as much a backlog drain as a feature ship.

## Retrospective

### What Worked

- **Wave-based TDD with per-feature atomic commits.** Building each of the 24 features TDD-first, verifying against `tsc` + touched suites + both chokepoint audits, and committing atomically, kept the tree green across 37 commits with **0 `.planning` files staged** and **0 Claude co-author trailers** — clean hygiene at scale.
- **Bounded first cuts with clean seams.** Stubbing heavy-ML cores behind seams let the whole roadmap land as working, testable slices in four waves, with the deferrals documented rather than hidden.
- **Chokepoint discipline held.** By avoiding the red-gating basenames and keeping `child_process` in already-gated modules, the flywheel work added zero new chokepoint waivers (`KNOWN_UNWIRED=0`), so the LoaderContext and ProcessContext audits stayed green without exceptions.
- **Global verification between waves caught drift early.** A main-context `tsc` + `npm run build` + aggregate vitest sweep between waves confirmed the accumulating dev tip stayed coherent, ending at 5797 pass / 0 fail on the Wave-D verify.

### What Could Be Better

- **The heavy-ML cores remain stubbed.** Claim-extraction NLP (`HeuristicClaimExtractor`), distill intelligent fill (`DistillEnricher`), try-session pedagogical authoring, and co-activation live-data density all still need real infrastructure. The seams are in place, but the intelligence is not yet.
- **Some live-callsite tails are still seams.** The gap-radar CLI does not yet inject a live `MemoryService`; the college-obs-adapter has no production callsite pumping it; the flywheel CLI does not yet load live precedents/citations; the ledger-scribe path is a seam; and the reverted-commit signal handles only the formal `git revert` case.
- **The full suite ran only at gate time.** The wave sweeps were targeted, not exhaustive, so the pre-tag gate's full-suite run is the first end-to-end validation of the complete dev tip. Earlier full-suite runs per wave would have de-risked the final gate.

## Still Open (deferred, honest — not ship blockers)

- **MemorySink has no production `ObservationEmitter` callsite yet.** The sink is a tested, opt-in library capability — its factory constructs nothing by default — and is not yet triggered by any live session/observation flow. Wiring a production emitter to it is the follow-up that actually closes the observe → mine → remember loop in production; until then the loop is *closable*, not closed.
- **`flywheel status` concept-join is heuristic-only and off by default.** The `.college` Rosetta data model carries no concept→skill back-link, so the concept stage of `flywheel status <skill>` renders empty unless the new `--allow-heuristic` flag opts into token-overlap matching. A real back-link (or mapping artifact) is the durable fix.
- **Heavy-ML cores** need real infrastructure, not wiring: claim-extraction NLP (`HeuristicClaimExtractor`), distill intelligent fill (`DistillEnricher`), try-session pedagogical authoring, and co-activation live-data density (activation writers unwired, Phase 646).
- **Wave-D live-callsite tails**: gap-radar CLI live `MemoryService` injection; a production callsite pumping the college-obs-adapter; the flywheel CLI loading live precedents/citations; the ledger-scribe path; and reverted-commit coverage beyond the formal `git revert` case.

## Cross-References

- **Roadmap artifact:** `flywheel-roadmap-v1` (🌀).
- **Task ledger:** #38–#71 (25 features + 9 Wave-D follow-ups), all `completed`.
- **Handoff:** `HANDOFF-2026-07-12-flywheel-24-ship-v1128.md`; prior handoff `HANDOFF-2026-07-12-item7-auto-correction-attribution.md`.
- **Predecessor:** v1.49.1127 — TOPEX/Poseidon (NASA degree 1.310, obs#30). The next NASA degree is renumbered to v1.49.1129 (obs#31).

## Engine state

- **Predecessor milestone:** v1.49.1127 (tag `v1.49.1127`, NASA degree 1.310).
- **This ship:** v1.49.1128, dev-line engineering release (no NASA degree; NASA/MUS/ELC/SPICE gate steps no-op).
- **Next reserved:** v1.49.1129 (NASA obs#31, renumbered from the previously-reserved slot).

## File inventory

- **Scope:** 657 files changed, +47,167 / −6,903 across `src/` (CLI + memory + learning + citations + cartridge + orchestrator + mcp), `src-tauri/` (Rust backend), `.college/` (Rosetta Core + departments), the release/adoption tooling, and the teams/chipsets examples.
- **Build:** `npm run build` green — 28 assets including the new `004_finding_embedding.sql` migration for the pgvector finding mirror.
- **Verification:** `npx tsc --noEmit` clean; aggregate vitest sweep 5797 pass / 0 fail on the Wave-D tip (targeted, not the full suite — the pre-tag gate runs the full ~36k-test suite).
