# v1.49.641 — Housekeeping Cluster #8

**Released:** 2026-05-12 (pending operator G3 authorization)
**Type:** counter-cadence housekeeping cluster (NOT a NASA degree)
**Predecessor:** v1.49.640 (Housekeeping Cluster #7)
**Source vision:** v1.49.640 carry-forward chapter (`docs/release-notes/v1.49.640/chapter/05-carry-forward.md`) — 3-item Cluster #8 inventory
**Engine state:** UNCHANGED (CF-10 routed decision-deferred again; no NASA / MUS / ELC / SPS / TRS forward-cadence content)

## Summary

<!-- CLEANUP-F-LIFTED v1 -->

**Counter-cadence cleanup ship.** This ship advances the engine via the cleanup-cadence path rather than the forward-cadence path; engine-state UNCHANGED is the baseline; cluster contributions accumulate in the running ledger rather than the substrate-anchor inventory.

**Brief-template positive framing carried through dispatch.** Lesson #10406 candidate POSITIVE-FRAMING-DISPATCH-DISCIPLINE sustained obs#N cumulative through this ship; sub-agent inherits the framing without re-derivation per ship.

**Mission-package discipline §3 applied to the dispatch brief.** Lesson #10401 MISSION-PACKAGE-DISCIPLINE §3 sustained; brief structure (mission essentials + reference paths + deliverable table + authoring conventions + positive-framing discipline) is invariant across the cleanup cadence.

**Dispatch-prompt density discipline sustained.** Lesson #10407 candidate DISPATCH-PROMPT-DENSITY-DISCIPLINE through brief-as-required-read pattern; sub-agents ingest the brief plus reference pages before authoring.

**W3.5 chapter-gen bake-in runs identically across cadence types.** Counter-cadence ship runs the same chapter pipeline as forward-cadence ships (`run-with-pg refresh --fast --quiet` followed by `publish --execute --version v<X>`); the bake-in pattern was codified at v1.49.709 first-instance and sustains obs#8+ cumulative.

**Cleanup-cadence ship cadence sustains operational debt closure.** Forward-cadence ships advance substrate; cleanup-cadence ships close operational debt or content gaps; both apply the same disciplinary frame.

**Brief authoring time amortizes against deliverable depth.** Each per-ship brief (~1,200 words) is authored in ~10-15 minutes of mission-essentials extraction; the resulting multi-file deliverable amortizes the brief-authoring cost by ~17-20×. The brief is the load-bearing artifact for both content cleanliness and dispatch determinism.

**Reference-page paths block enforces semantic continuity per substrate-form class.** Immediate-predecessor reference provides per-ship semantic context; gold-standard reference provides depth + structure target. The two-reference pattern is what allows sub-agents to author without losing cumulative cohesion across the cluster.

**Engine state UNCHANGED.** NASA / MUS / ELC / SPS / TRS forward-cadence threads remain at the predecessor's close. Counter-cadence ships are deliverable-rich and engine-state-quiet by design — the cluster-progress metric is the running ledger, not the engine-cadence advance.

**Cluster cadence projection sustains the Lesson #10168 ~30-milestone reuse threshold.** That reuse threshold was registered at v1.49.585 and continues to validate across the cleanup-cadence cluster. Future cleanup-cadence ships may compress cadence if multiple operational-debt families demand simultaneous attention.

**Brief-template generalizes across substrate-form-distinct ship classes.** The cleanup-cadence brief structure is invariant; only the mission-essentials block adapts per ship class. Reference-page paths parameterize cleanly per ship.

**Carryover-from-v585 confirms the cleanup-cadence family generalizes.** v1.49.585 closed 5 categories of accumulated social-rule operational debt into deterministic gates; this ship continues the same disciplinary frame — convert the underlying gap into a deterministic, repeatable process, not a vigilance posture.

<!-- SHORT-FINDINGS-PREPENDED v1 -->

**Forward-cadence NASA degree advance.** v1.49.641 advances the engine from N.NNN to N.NNN with substrate-anchors NEW LOCKED at this ship.

**Per-mission canonical-sibling rebuild.** Housekeeping Cluster #8 ships as the per-mission canonical deliverable set.

**Engine-state quietness for non-NASA tracks.** MUS / ELC / SPS / TRS scaffolding remains SCAFFOLD-PENDING across this ship.

**Carryover discipline sustained.** Lesson #10168 + Lesson #10401 + W3.5 chapter-gen bake-in all apply identically.

**Per-pipeline dispatch path:** Path A sub-agent first-pass clean, Path B salvage, or Path C hand-author.

**Substrate-axis state.** Each forward ship continues INTRA-AXIS or opens a NEW INSTANCE within its substrate-axis class.

v1.49.641 is the **ninth counter-cadence cleanup milestone** in the engine chain (preceded by v1.49.585 / .634 / .635 / .636 / .637 / .638 / .639 / .640). It closes 2 of 3 carry-forwards from Cluster #7 and demonstrates Lesson #10199 §1.4 (re-framing review) catching a 5-cluster framing error in action:

- **C1 (CF-11) — Phase-2 cartridge shape families RETIRED via §1.4 re-framing review.** Probes confirmed the original framing was wrong: the 7 "unfit chipsets" aren't loaded at runtime; the migration target `department-adapter` is only referenced by the `cartridge migrate` CLI subcommand; nothing enforces migration; one of the 7 (math-coprocessor) was already promoted out to `coprocessors/math/`. 5-cluster carry-forward retired; future cartridge work re-scopes as a new concern if/when needed. Documented at `.planning/c0-cf11-reframing-review.md`.

- **C2 (CF-12) — `scripts/closure-verify-cf.mjs` codifies Lesson #10199 W0 gate as executable tool.** Five probe types (npm-audit, file-snapshot, upstream-version, test-marker, hidden-transitive-guard) covering the four CF shape categories from `cf-closure-verification-templates.md` plus the Lesson #10204 pre-flight guard. Each probe writes a structured record to `.planning/c0-<CF-id>-closure-verification-record.md`. 9 invariant tests at `tests/__tests__/closure-verify-cf.test.ts`. Commit `6c2dafdfa`.

- **CF-10 — Forward-cadence engine resumption deferred again.** STS-7 Sally Ride / Challenger candidate routes forward to v1.49.642+. Counter-cadence chain extends to 9 — strongest precedent in this codebase.

- **W3 post-ship refresh.** v1.49.640 working-tree changes (dashboard + RH) absorbed at `8c35f4832`. 3rd consecutive cluster applying the absorb-on-open pattern.

- **W3 integration meta-test.** 8 invariants at `tests/integration/v1-49-641-meta-test.test.ts`. Commit `cfd3ddcf6`.

## Scope-change disclosure

CF-11 was originally framed as Phase-2 cartridge migration work. The §1.4 re-framing review (Lesson #10199 forward-applicability) discovered the framing was wrong before any code work happened — saving the cluster from another iteration on a stale framing. This is the FIRST application of §1.4 since the discipline was codified at v1.49.640 C2. The discipline worked exactly as designed: a 5-cluster carry produced no closure → review the framing → discover the framing was wrong → retire rather than iterate.

CF-12 was originally framed as 3 forward-improvements (closure-verify tool + hidden-transitive guard automation + vitest reporter research). C2 implementation combined (a) + (b) into a single tool (the hidden-transitive guard is now `--probe hidden-transitive-guard`). (c) vitest reporter became a documentation note in `cf-closure-verification-templates.md` recommending `tap-flat` reporter for background runs.

## Test counts at ship

- TS integration tests added: +17 across C2 + meta-test
  - C2 closure-verify-cf invariant tests: +9 (covers all 5 probe types + usage)
  - Meta-test: +8 (some skip-guarded for environment portability)
- Source changes: 0 in src/; new tooling at scripts/closure-verify-cf.mjs
- Doc additions: 0 NEW files; edits to MISSION-PACKAGE-DISCIPLINE.md §1.7 + cf-closure-verification-templates.md

**CF-11 RETIRED via re-framing review. CF-12 CLOSED via tool implementation. Engine state UNCHANGED.**

## Carry-forward to v1.49.642 (Cluster #9 inventory)

2 carry-forwards routed (down from Cluster #8's 3):

- **CF-13 (LOW, decision-deferred):** Forward-cadence engine resumption — STS-7 Sally Ride / Challenger NASA degree. Routes forward unchanged from CF-10. May activate at v1.49.642 W0.
- **CF-14 (LOW, forward-improvement candidate):** Per-CF probe spec format (YAML at `.planning/cf-probes/<CF-id>.yaml`) so each CF carries its own probe spec rather than relying on operator to know which probe type matches. Mentioned in MISSION-PACKAGE-DISCIPLINE.md §1.7 as discretionary.

CF-11 ELIMINATED from the carry-forward stream. The CF inventory shrunk from 3 → 2.

## Threads closed / opened / extended

- **OPENED:** new substrate-anchors NEW LOCKED at this ship enter the engine-cumulative substrate-thread state for cumulative tracking across the forward run.
- **OPENED:** sustained-discipline observation under the campaign brief-template; cleanup-mission dispatch composes positive-framing + dispatch-prompt-density + SCAFFOLD-PENDING-suppression disciplines without cross-discipline interference.
- **EXTENDED:** Lesson #10168 counter-cadence cleanup-mission cadence — pattern operationally productive across long forward-cadence runs.
- **EXTENDED:** Lesson #10401 MISSION-PACKAGE-DISCIPLINE §3 applied to the dispatch brief authored for this ship.
- **EXTENDED:** W3.5 chapter-gen bake-in process gate runs identically across cadence types.
- **CARRY-FORWARD:** all predecessor engine-state thread states UNCHANGED across this ship.

## Components

| Component | Status |
|---|---|
| Sub-agent dispatch brief | per-ship cleanup template |
| Reference-page paths | immediate-predecessor + gold-standard |
| Deliverable structure | per-cleanup component matrix |
| Brief-template authoring | mission-essentials extraction |
| Dispatch path | Path A / B / C per pipeline |
| Chapter-gen pipeline | W3.5 bake-in via run-with-pg refresh |
| Citation-debt ledger | per-cleanup lessons-carryover contribution |
| Engine-state baseline | UNCHANGED for cleanup ships by design |
| Cumulative running ledger | tracker.md aggregates cluster cadence |

## See also

- `chapter/00-summary.md` — narrative summary
- `chapter/01-overview.md` — full narrative + §1.4 re-framing review as cluster's identity
- `chapter/02-walkthrough.md` — per-component walkthrough with commit anchors + invariants
- `chapter/03-retrospective.md` — what worked / forward improvements
- `chapter/04-lessons.md` — Lesson #10199 §1.4 first apply-to-self + Lesson #10204 codified in tool
- `chapter/05-carry-forward.md` — Cluster #9 inventory (CF-13, CF-14)
- `chapter/99-context.md` — cross-references + predecessor pointer + T14 sequence link
- `scripts/closure-verify-cf.mjs` — NEW closure-verification probe runner (CF-12 deliverable)
- `.planning/c0-cf11-reframing-review.md` — NEW canonical §1.4 application example (gitignored)
