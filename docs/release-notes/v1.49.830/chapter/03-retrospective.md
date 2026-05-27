# v1.49.830 — Retrospective

**Wall-clock:** ~40 min from session pickup to release-notes draft. First ship of v830-832 Option C arc.

## What went as expected

- **Recon-first paid off.** The v829 handoff named two methods on `ConceptRegistry`: `search(query, domain?)` and `getAnalogiesByDomain(id, targetDomain)`. The first is correct; the second is actually `getAnalogies(id, targetDomain)` — no "By". Caught at recon time, no rework. v831 plan adjusted in-place.
- **The cross-rootdir wire shape transferred cleanly from v823/v829.** Declaring `ConceptFallbackProvider` in src/ + threading it as an optional field on `ActivationContext` is structurally identical to `SkillActivationObserver`/`ObservationBridge`. No new architectural questions arose.
- **`predictNextSkillsWithMeta` was already on the public surface.** v830 just switched copper from `predictNextSkills` to the meta variant to get the threshold without a second config read. The disabled path also populates the threshold field — the consumer doesn't need to branch.
- **Subscriber-gating extended naturally to two layers.** Adding `if (!hook && !fallback) return;` preserves the byte-identical-when-off invariant. When neither is wired, the predictor is never even invoked.

## What I noticed

- **Threading `lowConfidenceThreshold` through `PredictionResult` is the right shape.** Each `emitPredictions` call already pays one settings read inside `predictNextSkillsWithMeta`; carrying the threshold out in the result means zero extra cost for the new feature. The alternative (separate `readPredictiveSkillLoaderConfig()` call inside `emitPredictions`) would double the hot-path settings read.
- **Empty-predictions = max-score 0 is the right default for the fallback trigger.** Empty predictions occur both when the flag is OFF (default) AND when the substrate is on but produces no candidates. In both cases the operator-supplied fallback fires (subscriber-gated by the provider itself being wired). Operators who don't want fallback when off simply don't wire `fallbackProvider`.
- **The pattern is now 3 instances of cross-rootdir duck-typing.** v823 declared the interface; v829 verified the wire; v830 added a sibling interface in the same shape. #10426 threshold is met 2 ships over.
- **`lowConfidenceThreshold` is the 6th wired calibratable threshold.** All 6 thresholds are now registered surfaces; the bounded-learning calibration loop can schedule ticks against any of them. This may be a quiet milestone for the calibration-axis (#10428 meta-cadence).

## What surprised me

- **The `PredictionResult` change required updates to 5 inline config objects across 2 test files.** Adding a required field to a public-surface interface is a textbook breaking change; my forward-cadence assumption was zero downstream test-file edits. The 5 updates were mechanical (~1 LOC each via `replace_all`), but the lesson is that "framework-only ship" doesn't mean "no test surface impact" — required-field additions ripple.
- **TypeScript didn't complain about the `fallbackProvider` field even with strict optional-chaining off elsewhere.** The provider is checked for truthiness once inside `emitPredictions` and never elsewhere, so the type narrowing is local. No need for `?.` chaining or non-null assertions.

## Risk that didn't materialize

- The `predictNextSkillsWithMeta` switch might have broken the existing onPredictions hook contract. It didn't — the result includes both `predictions` AND the new `lowConfidenceThreshold`; the existing call path just consumes `predictions`.
- Subscriber-gating both layers might have hidden a regression in `onPredictions`-only callers. Existing v810 test "invokes the hook with the activated skill after a successful skill activation" still passes — confirms the new `fallback === undefined` branch is byte-equivalent.

## Carried forward

- **Cross-rootdir wire pattern: 3 instances** (v823 + v829 + v830). #10426 threshold met 2 ships over.
- **Substrate-consumer hook PAIR pattern (`onPredictions` + `fallbackProvider`): 1 instance** (v830). Wait for 2nd.
- **`lowConfidenceThreshold` is the 6th wired calibratable threshold.** No 2nd-instance pattern yet (existing 5 thresholds are heterogeneous: bandwidth, anytime-gate, retrieval, etc.).
- v831 implementation: `RosettaConceptFallback` in `.college/integration/`. Uses `ConceptRegistry.search` + `getAnalogies` (NOT `getAnalogiesByDomain` — handoff name was wrong; recon-corrected).
- v832 integration: `tests/integration/copper-rosetta-fallback-wire.integration.test.ts` mirroring v829's pattern + selector wire as 2nd production caller.

## Forward-test of existing lessons

| Lesson | Status |
|---|---|
| #10416 lightest wire | RESPECTED — single optional field added to context; no breaking change for un-wired callers |
| #10426 second-instance threshold | EXCEEDED — cross-rootdir wire now at 3 instances; codify deferred to v833 |
| #10427 failure-mode contracts | RESPECTED — fallback errors swallowed at the same boundary as onPredictions errors; both are observability-only |
| #10428 meta-cadence | calibrate-axis tick: `lowConfidenceThreshold` registers as the 6th tunable threshold |
| #10432 KNOWN_UNWIRED ledger | NOT EXERCISED — not a chokepoint chip |
| #10433 internal-helper | NOT EXERCISED — not a chokepoint chip |

## Cadence observation

This is the first ship of a 3-ship arc (v830 framework / v831 impl / v832 integration). Per the v829 handoff: "~45-60 min per ship × 2-3 ships = ~2.5-3.5 hours." v830 took ~40 min — on the low end thanks to recon already done at v829. v831 and v832 should each take ~45-60 min unless RosettaCore integration surfaces unexpected schema gaps.

The codify-axis (#10428) is now 6 ships ago (last was v824) — still within the 7-10 ship floor but approaching the lower bound. v833 codify ship at chain close will reset.
