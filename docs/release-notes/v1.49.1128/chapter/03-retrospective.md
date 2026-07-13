# Retrospective — v1.49.1128

## What Worked

- **Wave-based TDD with per-feature atomic commits.** Building each of the 24 features TDD-first, verifying against `tsc` + touched suites + both chokepoint audits, and committing atomically, kept the tree green across 37 commits with **0 `.planning` files staged** and **0 Claude co-author trailers** — clean hygiene at scale.
- **Bounded first cuts with clean seams.** Stubbing heavy-ML cores behind seams let the whole roadmap land as working, testable slices in four waves, with the deferrals documented rather than hidden.
- **Chokepoint discipline held.** By avoiding the red-gating basenames and keeping `child_process` in already-gated modules, the flywheel work added zero new chokepoint waivers (`KNOWN_UNWIRED=0`), so the LoaderContext and ProcessContext audits stayed green without exceptions.
- **Global verification between waves caught drift early.** A main-context `tsc` + `npm run build` + aggregate vitest sweep between waves confirmed the accumulating dev tip stayed coherent, ending at 5797 pass / 0 fail on the Wave-D verify.

## What Could Be Better

- **The heavy-ML cores remain stubbed.** Claim-extraction NLP (`HeuristicClaimExtractor`), distill intelligent fill (`DistillEnricher`), try-session pedagogical authoring, and co-activation live-data density all still need real infrastructure. The seams are in place, but the intelligence is not yet.
- **Some live-callsite tails are still seams.** The gap-radar CLI does not yet inject a live `MemoryService`; the college-obs-adapter has no production callsite pumping it; the flywheel CLI does not yet load live precedents/citations; the ledger-scribe path is a seam; and the reverted-commit signal handles only the formal `git revert` case.
- **The full suite ran only at gate time.** The wave sweeps were targeted, not exhaustive, so the pre-tag gate's full-suite run is the first end-to-end validation of the complete dev tip. Earlier full-suite runs per wave would have de-risked the final gate.

## Surprises

- **The loop closed with a small keystone.** A single sink (MemorySink) was enough to turn a set of one-directional pipelines into a genuine flywheel — the downstream connections were mostly already latent, waiting for a durable memory target.
- **975 concepts already carried panel + position structure.** Populating the ConceptRegistry surfaced that the College's concept corpus was richer and more geometrically organized (complex-plane positions) than a flat list, which made the semantic xref discovery immediately useful.
- **The backlog was larger than the marquee work.** The 145 pre-flywheel commits (auto-correction attribution, MEM-7, deferred follow-ups) outnumbered the 37 flywheel commits nearly 4:1 — the release is as much a backlog drain as a feature ship.

## Lessons Learned

- **Wiring is cheap; cores are expensive — and honesty about the line is the deliverable.** The flywheel roadmap proved that connecting subsystems (seams, entry points, routers, joins) is fast and testable, while the intelligent cores behind those seams (claim NLP, distill fill, pedagogy authoring) need real infrastructure. Shipping the wiring with the cores stubbed — and *documenting exactly which is which* — is more valuable than a half-built monolith.
- **A shared session-retro file is a footgun under sub-agents.** Sub-agents that run `tools/session-retro/observe.mjs start/end` clobber the parent mission's session state because the file is shared. Self-observing agents must not be relied on for parent-session retro capture.
- **The dynamic-import boundary has a runtime cost.** Because `.college/` is not emitted to `dist`, the `college`/`flywheel` verbs run fine under `tsx`/`vitest` but require `.college` to be compiled to run from the shipped binary — a pre-existing condition the flywheel work inherits, not introduces.
- **Targeted sweeps are not the full suite.** The Wave sweeps ran targeted suites (5797 pass / 0 fail on the Wave-D tip); the pre-tag gate is the first time the full ~36k-test suite runs against this dev tip. Plan for that to be the real gate.
