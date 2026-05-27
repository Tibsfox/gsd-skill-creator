# Retrospective — v1.49.798

## Carryover lessons applied

- **Lesson #10412 — Recon-first as default.** 11th consecutive application. Read the token-budget enforcement surface (`src/chipset/gastown/token-budget.ts`), schema (`src/integration/config/schema.ts`), and config-types (`src/integration/config/types.ts`) BEFORE writing v798 code. Recon confirmed (a) `token_budget.warn_at_percent` is for skill-loading context-window enforcement (different concept than gastown convoy budgets), (b) no existing telemetry captures operator response to warn events, (c) schema validates `warn_at_percent ∈ [1, 100]` with default 4 — primitive's ABSOLUTE_FLOOR=1 still works. ~10 min recon → ~30-40 min implementation.
- **Lesson #10422 — Verdict-pattern surface separation.** Applied. The registry extraction (new file, new module boundary) is genuinely a new surface — kept separate from the CLI command file. The CLI's only delta beyond the SUPPORTED_THRESHOLDS array is swapping `loadSuggestions+entriesToObservations` calls for one `loadObservationsForThreshold` call (3 lines deleted, 1 line added) and threading sourceInfo into renderers.
- **Lesson #10423 — Lightest wire that satisfies the verdict.** Tested at second-instance boundary. The lightest wire would have been option (A) — reuse the suggestions source for token_budget. Rejected because it's semantically dishonest and would have baked confusion into operator-facing documentation. The discipline applies to *unnecessary* surface, not *necessary* surface — the per-class registry is necessary at this point in evolution. Distinguishing "necessary" from "unnecessary" is the judgment call the discipline asks for; recon helped frame it.
- **Lesson #10424 (ESTABLISHED v794) — Adoption-refresh AFTER bump.** Applied. Fifth consecutive ship under the gate.

## What Worked

- **Recon found the right architectural option fast.** Within 10 min of recon I had three options enumerated with clear pros/cons. Choosing option C took ~30 seconds once they were on paper. The recon → architecture-choice pipeline is the value-add of #10412 — without it I'd have defaulted to option A and shipped a misleading wire.
- **Second-instance extraction landed cleanly.** Once the registry file was authored, the CLI delta was a 3-line refactor (replace inline loader call with `loadObservationsForThreshold`). The primitive (`runCalibrationLoop`) did not change. The threshold-writer did not change. Surface separation continues to validate.
- **Test coverage for the registry surface is dedicated.** 12 unit tests in a new `observation-sources.test.ts` file separate the registry's behavior from CLI/calibration-loop tests. If the registry needs to evolve (add a 4th class, change classification rules), the test surface is localized.
- **Operator-facing visibility of the gap.** The JSON output's `observationSource: { wired: false, ... }` field makes the architectural gap visible at every CLI invocation. Operators don't need to remember which thresholds are wired; the CLI tells them.

## What Could Be Better

- **The new lesson candidate #10426 needs second-instance forward-shadow to promote.** First-instance is this ship; promotion path requires either (a) another cross-class registry extraction at a future second-class-boundary moment, or (b) codification at next discipline-coverage codification ship. Likely the latter — cross-class registry extractions don't happen often in any single codebase.
- **Renderer cleanup not bundled.** The `renderText` and `renderJson` functions now both call `observationSourceFor(rec.threshold)` independently. A small `RenderContext` or shared lookup could factor this. Deferred per lightest-wire — the duplication is two lines and the future cleanup is a few lines more. Not worth bundling.
- **`FlagLookup` discriminated union STILL in 4 CLI commands.** v793/v795/v796/v797 retros all flagged this. v798 continues to defer per lightest-wire discipline. Carrying forward.
- **No real observation source for token_budget yet.** This is the load-bearing follow-on. v798 wires the threshold honestly with an unwired stub; the real source ship is a known future need but explicitly out-of-scope.

## Surprises

- **Wall-clock landed at the high end of the prediction.** v796 handoff predicted 45-60 min for ship 4. Actual: ~45-60 min. Recon spent ~10 min finding the right architectural option, ~5 min framing the gap-honesty design, ~30 min implementation, ~10 min release-notes. The architectural-choice tax IS visible in wall-clock; the chained-session warmth tailwind did not fully offset it (where v797 beat its prediction, v798 hit dead-center).
- **The observation-source visibility surface (JSON `observationSource` field) was an unplanned addition.** I added it mid-implementation because it felt like a natural use of the registry — operators see at-a-glance whether the calibration is informed. It would have been easy to defer to a future ship, but the marginal cost was ~15 LoC + 1 test assertion, and the operator-clarity ROI was high. This is exactly the kind of "do it now while context is hot" decision that emerges from chained-session warmth.

## Lessons applied at v1.49.798 (from v1.49.795-797 and earlier)

- **#10412** (recon-first) — applied. 11th consecutive application.
- **#10422-#10423** (Verdict-pattern surface separation + lightest wire) — applied with careful judgment call on "necessary vs unnecessary surface."
- **#10424** (Adoption-refresh AFTER bump) — applied; gate inherited from v794.
- **#10425 candidate (v795)** (two-sided-on-binary insensitivity) — applied at observation-sources registry design (the per-class loaders all produce observations in [-1, 1], consistent with the primitive's two-one-sided-Bonferroni design).

## Lesson candidate emitted this ship

**#10426 candidate (MEDIUM)** — Second-instance abstraction extraction for cross-class registries.

**Statement:** When a primitive accumulates instances across multiple classes (here: threshold classes with different observation sources), extract the per-class registry at the SECOND class instance, not the third. Extracting at the first class is premature (YAGNI); deferring to the third class means the second-class instance ships using the wrong source as a temporary measure, baking semantic confusion into documentation. The second-class instance is the discipline-correct extraction point.

**Why:** v798's architectural choice tested this. Option (A) would have deferred extraction to a hypothetical third class — but it would have required shipping token_budget against the wrong source, with a "temporary" docstring claim. Option (C) extracted at the second class boundary. The asymmetry is: at instance 1, you don't yet know what shape the abstraction needs to take; at instance 2, you know exactly what's varying (here: source identifier + loader function + wired boolean); at instance 3+, you've already accumulated debt that needs unwinding.

**How to apply:** When adding a feature that crosses a class boundary the codebase hasn't seen before, ask: "is this a one-off, or the start of a pattern?" If a pattern, extract the abstraction NOW. Don't defer to the third class.

**Promotion path:** Second-instance forward-shadow when another cross-class registry extraction surfaces (e.g. extending an enum-typed family to a new variant where per-variant config needs to dispatch). Alternatively, codification at next discipline-coverage codification ship as a fresh discipline note alongside #10422-#10423.

## Open lessons watchlist (apply at next opportunity)

- **#10412** (recon-first) — apply at every session start. v799 needs fresh recon for the audit-log surface (JSONL writer + retention semantics).
- **#10422-#10423** (Verdict-pattern surface separation + lightest wire) — apply at every extension.
- **#10425 candidate** (two-sided-on-binary insensitivity) — apply at every binary-observation calibration design.
- **#10426 candidate (NEW)** — apply at every cross-class abstraction-extraction moment.
- **FlagLookup extract** — non-lesson refactor opportunity, now 4 copies, still deferred.

## Verdict on T1.1 ship 4 scope

The "wire `token_budget.warn_at_percent` + per-class registry" scope landed in one ship at ~45-60 min wall-clock — matching the v796 handoff prediction. The architectural-choice tax was real but bounded. The registry extraction validates the v795-v796 design — primitive is threshold-agnostic, CLI is the only class-aware surface, sources are now per-class registered. v799+ ships can add new sources to the registry without touching the CLI module.

This is the first ship to deliver a genuinely new discipline observation (#10426 candidate). The remaining v799-v801 ships should consume less retro-content per ship.
