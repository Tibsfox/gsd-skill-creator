# v1.49.835 — Retrospective

**Wall-clock:** ~30 min from v834 close to v835 release-notes draft. Scaffold ship — type system registration only.

## What went as expected

- **The v798 precedent transferred cleanly.** `token_budget.max_percent` at v798 was registered in the type union with `wired: false`; `loadObservationsForThreshold` returned empty; calibration returned hold. v835 applies the same shape to `predictive.low_confidence_threshold`. No new architectural decisions required; just follow the v798 template.
- **Tests added at the canonical site.** Existing test file `src/bounded-learning/__tests__/observation-sources.test.ts` already has paired tests for each threshold class (one in `observationSourceFor`, one in `loadObservationsForThreshold`). v835 adds the same pair for the new threshold; test count goes 14 → 16.
- **No CLI surface change required.** `SUPPORTED_THRESHOLDS` in `src/cli/commands/bounded-learning.ts` is the operator-facing allowlist. Since the new threshold's observation source is `wired: false`, surfacing it to operators would only invite confusion (the calibration would always return hold). Following the principle "don't surface what you can't act on," `SUPPORTED_THRESHOLDS` stays at 4 entries.
- **threshold-writer.ts needed no changes.** The writer uses generic dotted-path splitting (`threshold.split('.')`), so a new threshold class just works without code changes. Confirms the v798-era design decision to use string-segment paths over enum-dispatching switches.

## What I noticed

- **The v833 "6 of 6 wired" claim was ambiguous about which "6."** v833 README said "Wired calibratable thresholds: 6 of 6 (UNCHANGED)" but the type union had only 6 members total before v835. The "6 of 6" framing referenced the RUNTIME wire count (copper + selector + settings parse), not the calibration-framework type registration. v835 makes both views consistent: the type union now has 7 members (with the new scaffold), and 6 of those 7 are functionally-wired (the 7th is scaffold-only). Worth more precise framing in future ships: "type-registered" vs "observation-source-wired" vs "runtime-wired" are three distinct surfaces and conflating them produces silent gaps.
- **The v830 framework wire was incomplete in this dimension.** v830 added `lowConfidenceThreshold` to `PredictiveSkillLoaderConfig` + threaded through copper. It did NOT register the class with the bounded-learning calibration framework. The gap was silent because:
  - No production code consumes `predictive.low_confidence_threshold` via the `CalibratableThreshold` type.
  - The CLI's `SUPPORTED_THRESHOLDS` doesn't include it.
  - No test exercises calibration against this threshold (would have caught the type-not-listed gap).
- **Scaffold ships have a clean shape.** Register the new class, add the observation-source case with `wired: false`, add the dispatch case returning empty, add 2 mirror tests. ~24 LOC total. Different shape from both wire-adding chips and codify ships. May be worth distinguishing in any future "ship shapes" codification (alongside the v834 "stale-entry cleanup chip" shape).
- **The v835 work was directly predicted in the v833 handoff.** Line 219 of the handoff: "Bounded-learning calibration of `lowConfidenceThreshold` (the 6th wired calibratable threshold). Needs production observation data first — wire `fallbackProvider` in production code, collect activations, then schedule a calibration tick." Per-ship recon parsed this and identified the type-registration step as the actionable subset of the calibration work (the production wire is still future work).

## What surprised me

- **`observationSourceFor` had a "Defensive fallback for future threshold classes" return at the end.** Adding a new class means the defensive return is technically reachable in fewer cases now — but only marginally. The defensive return is the catch-all for type-system violations (e.g. a string-cast threshold that bypasses the type union). v835 doesn't change its purpose; just registers one more case that no longer falls through.
- **The test file's `describe` block header says `(v1.49.798)`.** The bounded-learning observation-sources file was introduced at v798 and the test still names that version in the describe. Worth updating to "v798 + v1.49.835" in a future cleanup if more threshold classes accrue.
- **Documentation in `observation-sources.ts` was load-bearing for the v835 ship.** The existing JSDoc on `loadObservationsForThreshold` explicitly listed the unwired classes: `(token_budget.max_percent, observation.*)`. Adding the new class meant updating this list. Without that doc, the v835 ship could have silently registered the class but left the dispatch dispatch's intent unclear. Doc paragraphs that enumerate the "unwired classes" list are doc-as-test surface — they fail at code-review time when out of date.

## Risk that didn't materialize

- The CLI might have rejected the threshold (it accepts only `SUPPORTED_THRESHOLDS`) — not exercised this ship; CLI surface unchanged so this stays a future concern.
- The type-union addition might have broken the `audit-log.ts` switch (if there was one) — checked: `audit-log.ts` uses the type but doesn't switch on it; just stores it as a string-typed field in audit-log records. Generic enough to accept the new member without changes.
- The calibration-loop.ts might have switched on the threshold class — checked: it uses the type as an opaque identifier; doesn't switch on it.
- The threshold-writer.ts might have needed a special case for the new class — confirmed not needed (generic dotted-path splitting). Per-class observation sources are necessary surface; per-class writers are NOT necessary surface (the lightest-wire discipline #10416 applies asymmetrically).

## Carried forward

NEW this ship (1 instance each, deferred per #10426):
- **Scaffold ship pattern** (1 instance: v835). Different from wire-adding chip + stale-entry cleanup chip + codify ship + calibrate ship. Type-system registration only, with explicit "not yet wired" semantics and matching tests. Wait for 2nd before codifying as a class.
- **Paired "framework-predicted, recon-caught" ship arc** (v834 + v835 — 1 arc). Two ships closing related framework gaps in the same session, both predicted in prior docs/handoffs, both caught by per-ship recon. Wait for 2nd arc before codifying.
- **Type-registered vs observation-source-wired vs runtime-wired** as 3 distinct surfaces for calibratable thresholds (1 forward-flag observation from this ship — clarifies the v833 README ambiguity). Worth precise framing in future calibration ships.

Inherited from v834 close (no change):
- Stale-entry cleanup chip pattern (1 instance: v834) — DEFERRED.
- Per-ship release-notes count claims inherit predecessor without source-of-truth re-derivation (1 instance) — DEFERRED.
- Audit-inverse-check enhancement as defensive measure (1 forward-flag) — DEFERRED.

Inherited from v833 close (no change):
- Substrate-consumer hook PAIR pattern (2 instances) — DEFERRED.
- `onPredictions` substrate-consumer wire pattern (2 instances) — DEFERRED.
- #10433 LOC-band-by-callsite-count refinement (3 instances) — DEFERRED.
- Verification/integration-only ships axis (2 instances) — DEFERRED.

## Forward-test of existing lessons

| Lesson | Status |
|---|---|
| #10416 lightest wire | RESPECTED — minimum work (type-system addition + observation source case + 2 tests) closes the registration gap |
| #10426 second-instance threshold | RESPECTED — scaffold ship pattern at 1 instance; not codified yet |
| #10428 meta-cadence | RESPECTED — calibrate-axis tick: 5 ships past last calibrate (v830); within floor |
| #10432 KNOWN_UNWIRED ledger | NOT EXERCISED |
| #10433 internal-helper | NOT EXERCISED |
| #10434 discipline coverage ratchet | RESPECTED — UNCODIFIED unchanged at 39 (≤ ceiling 41) |
| Bounded-learning #10425 calibration discipline | RESPECTED — `wired: false` baseline returns `direction: 'hold'`, the honest outcome for "wire exists, source not yet captured" (matches v798 precedent exactly) |

## Cadence observation

v835 closes a 2-ship session paired with v834. Both ships closed silent framework gaps in the same session, both predicted in prior docs. The cadence shape: post-chain-close → paired counter-cadence-flavor work → return to forward-cadence (NASA 1.179 next).

Calibrate-axis cadence: 5 ships past last calibrate (v830 introduced the 6th wired threshold runtime-side). v835 makes it 0 ships ago for "calibratable threshold registered in the framework type" axis, distinct from "calibratable threshold has observation source wired" axis. The two axes diverged at v830 and converge again at the next production-wire ship.
