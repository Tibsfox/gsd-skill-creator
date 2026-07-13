# Lessons — v1.49.1128

7 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Wiring is cheap; cores are expensive — and honesty about the line is the deliverable.**
   The flywheel roadmap proved that connecting subsystems (seams, entry points, routers, joins) is fast and testable, while the intelligent cores behind those seams (claim NLP, distill fill, pedagogy authoring) need real infrastructure. Shipping the wiring with the cores stubbed — and *documenting exactly which is which* — is more valuable than a half-built monolith.
   _⚙ Status: `investigate` · lesson #13393_

2. **A shared session-retro file is a footgun under sub-agents.**
   Sub-agents that run `tools/session-retro/observe.mjs start/end` clobber the parent mission's session state because the file is shared. Self-observing agents must not be relied on for parent-session retro capture.
   _⚙ Status: `investigate` · lesson #13394_

3. **The dynamic-import boundary has a runtime cost.**
   Because `.college/` is not emitted to `dist`, the `college`/`flywheel` verbs run fine under `tsx`/`vitest` but require `.college` to be compiled to run from the shipped binary — a pre-existing condition the flywheel work inherits, not introduces.
   _⚙ Status: `investigate` · lesson #13395_

4. **Targeted sweeps are not the full suite.**
   The Wave sweeps ran targeted suites (5797 pass / 0 fail on the Wave-D tip); the pre-tag gate is the first time the full ~36k-test suite runs against this dev tip. Plan for that to be the real gate.
   _⚙ Status: `investigate` · lesson #13396_

5. **The heavy-ML cores remain stubbed.**
   Claim-extraction NLP (`HeuristicClaimExtractor`), distill intelligent fill (`DistillEnricher`), try-session pedagogical authoring, and co-activation live-data density all still need real infrastructure. The seams are in place, but the intelligence is not yet.
   _⚙ Status: `investigate` · lesson #13397_

6. **Some live-callsite tails are still seams.**
   The gap-radar CLI does not yet inject a live `MemoryService`; the college-obs-adapter has no production callsite pumping it; the flywheel CLI does not yet load live precedents/citations; the ledger-scribe path is a seam; and the reverted-commit signal handles only the formal `git revert` case.
   _⚙ Status: `investigate` · lesson #13398_

7. **The full suite ran only at gate time.**
   The wave sweeps were targeted, not exhaustive, so the pre-tag gate's full-suite run is the first end-to-end validation of the complete dev tip. Earlier full-suite runs per wave would have de-risked the final gate.
   _⚙ Status: `investigate` · lesson #13399_
