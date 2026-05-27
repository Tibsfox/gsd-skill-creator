# Retrospective — v1.49.803

## Carryover lessons applied

- **Lesson #10412 — Recon-first as default.** 16th consecutive application. Read `observation-sources.ts` + `audit-log.ts` + the v798 retro + the v802-promoted lesson docs BEFORE writing v803 code. Recon surfaced: (a) the JSONL write + tolerant read pattern from audit-log mirrors the shape I needed; (b) the suggestions-mapper.ts pattern was already the right template for the events mapper; (c) the `--record-event` mode flag fits the existing CLI shape (alongside `--summary` and `--watch`) rather than warranting a new top-level subcommand. ~10 min recon → ~50-55 min build.
- **Lesson #10422 — Verdict-pattern surface separation.** 13th forward application. The new `token-budget-events.ts` module is genuinely a new surface — kept separate from `suggestions-mapper.ts` (different signal source, different optional-fields shape), kept separate from `observation-sources.ts` (the registry only knows about per-class dispatch; the mapper knows about event semantics).
- **Lesson #10423 — Lightest wire that satisfies the verdict.** 13th forward application. Rejected: (a) new top-level CLI subcommand (`skill-creator log-event ...`); (b) a "warn-outcome resolver" module that paired warn + response events into compound observations; (c) a separate observability surface for token-budget telemetry. The CLI mode flag + JSONL log + decision-rule embedded in the skill prompt is the lightest wire that delivers operator-observable telemetry and flips the registry to wired status.
- **Lesson #10424 (ESTABLISHED v794) — Adoption-refresh AFTER bump.** Applied. Tenth consecutive ship.
- **Lesson #10426 (newly ESTABLISHED v802) — APPLIED to a wired-vs-unwired distinction within a single class.** The per-class registry was extracted at the second class instance (v798); v803 is the FIRST wired-vs-unwired distinction inside a single class. `token_budget.warn_at_percent` is wired; `token_budget.max_percent` is not. The registry's per-threshold (not per-class) dispatch handled the divergence cleanly. The branch in `observationSourceFor` is on the full threshold key, not the class prefix, which already supported per-threshold variation.
- **Lesson #10427 (newly ESTABLISHED v802) — APPLIED three times in v803.** (a) `appendTokenBudgetEvent` callers swallow filesystem errors at the surface boundary (one wrap in `runRecordEvent`, one in the future skill-prompt invocation). (b) `readTokenBudgetEvents` is tolerant of malformed lines + unknown kinds — the failure asymmetry is "skip the unparseable, return what's valid." (c) `/sc:status` Step 4.6 invokes the CLI with a 2-second timeout + best-effort silent skip. All three contracts have paired test assertions.

## What Worked

- **The audit-log + suggestions-mapper template made the new module trivial.** The shape was determined in recon: JSONL append + tolerant read + mapper functions + observation lift. The only design choice was the kind taxonomy (`responsive` / `ignored`) and the +1 / -1 mapping. The math choice was constrained by the rest of the loop (CalibrationObservation expects accepted/dismissed decision + value in [-1, 1]).
- **`/sc:status` Step 4.6 decision rule is operator-observable.** "Did the warn line appear in step 4 this turn?" + "Did it appear LAST turn but not THIS turn?" is the responsive/ignored decision. The rule doesn't require server-side state — the skill prompt instruction is enough.
- **The `--record-event` mode flag did NOT need new argument-parsing infrastructure.** Reused `getFlagValue` + `parsePositiveFloat` exactly. The mode flag pattern (`if (args.includes('--record-event')) return runRecordEvent(...)`) sits cleanly alongside `--summary` and `--watch`.
- **The wired-vs-unwired distinction inside a single class is structurally clean.** The registry's per-threshold (not per-class) dispatch supported the divergence without restructuring. Future ships that wire `token_budget.max_percent` (if ever) will follow the same shape.

## What Could Be Better

- **The decision rule for responsive/ignored is operator-prompt-side, not CLI-side.** The CLI just records what it's told. If the skill prompt makes the wrong decision (or if a session has no prior `/sc:status` to compare against), the events are noise. This is acceptable for v803 — the lightest wire that satisfies the verdict — but a future ship could move the decision rule server-side by having the CLI track session-state (which `usagePercent` was reported last invocation).
- **No "responsive within N minutes" window.** The decision rule is binary: was the warn fired last turn or not. A 30-minute-window approach (warn must have fired within the last 30 min for "responsive" to count) would be more semantically defensible but adds complexity. Defer.
- **The skill prompt change is operator-facing and not automated-tested.** The CLI side has 5 new tests; the markdown skill (Step 4.6) is tested by operator running `/sc:status`. No automated test verifies the integration. Acceptable for prompts (same as v801's Step 5.5), but worth flagging as a recurring pattern.
- **No `bounded-learning log` query subcommand.** With three append-only logs now (suggestions, audit, token-budget-events), the next natural ask is a query CLI. Carry forward to a follow-on ship.

## Surprises

- **The fifth wired threshold landed at the low end of prediction.** v798 retro predicted ~45-60 min for "new-module + cross-class wedge." v803 was strictly less than v798 (the architectural retrofit was already in place). Actual: ~50-55 min. Closer to v799's "new module consuming established abstractions" cadence.
- **Zero edits to `calibration-loop.ts`, `threshold-writer.ts`, `watch-loop.ts`, `audit-log.ts`.** The registry abstraction at v798 paid off again — none of the loop / writer / watcher / audit-log code needed touching. They consume `observationSourceFor` + `loadObservationsForThreshold` and inherit the new behavior. This is exactly the architectural-payoff signal Lesson #10426 codifies.
- **The wire flipped through ONE line in `observationSourceFor`** (the new `if (threshold === 'token_budget.warn_at_percent')` branch returning `wired: true`). Plus one branch in `loadObservationsForThreshold`. Plus one option field on `ObservationLoaderOptions`. Three surgical edits in the existing file; everything else is the new module + the CLI flag + the tests + the skill prompt change.

## Lesson candidates emitted this ship

None this ship. v803 is structurally well-grooved — every design choice came from a recently-ESTABLISHED discipline (#10412, #10422, #10423, #10426, #10427), and no surprise surfaced a new candidate.

## Tentative observation: registry-abstraction payoff window

The v798 registry extraction has now paid off in 4 ships (v799 audit log, v800 watch loop, v801 summary, v803 token-budget-events wire). The empirical pattern is now clearer:

- v798 → v801 (within the same chained session): 3 consumer-side validations on the registry. Net wall-clock savings ~30-45 min.
- v803 (one ship after a codification ship, two ships after the chain): 1 consumer-side validation on the registry — but a wired-vs-unwired distinction WITHIN a class, which is a different shape than the cross-class pattern that motivated the extraction. Net wall-clock savings ~10-15 min (the alternative would have been refactoring observation-sources.ts to lift the dispatch out of a class prefix check).

The registry extraction's lifetime payoff is now N=4 consumer ships across two chained-session boundaries. The break-even point predicted by #10426 (2nd consumer) is empirically validated; the net-positive point (3rd consumer) is also validated. Carry forward as supporting evidence for #10426 in future codification ships.

## Open lessons watchlist (apply at next opportunity)

- **#10412** (recon-first) — apply at every session start.
- **#10422-#10423** (Verdict-pattern surface separation + lightest wire) — apply at every extension.
- **#10424** (Adoption-refresh AFTER bump) — gate is active on every ship.
- **#10425** (newly ESTABLISHED v802 — bounded-learning calibration) — apply at every new threshold class or math primitive choice.
- **#10426** (newly ESTABLISHED v802 — Architecture-retrofit extension) — apply at every SECOND class instance + every wired-vs-unwired distinction inside a class.
- **#10427** (newly ESTABLISHED v802 — Failure-mode contracts) — apply at every new function/section that has an explicit or implicit failure-mode contract.
- **(tentative) registry-abstraction payoff window** — N=4 consumer validations across two chain boundaries; carry forward as supporting #10426 evidence.

## Verdict on v803 scope

The fifth-wired-threshold scope landed in one ship at ~50-55 min wall-clock — at the low end of the new-module-with-existing-abstractions cadence band. The architectural payoff from v798 continues to validate.

The lightest-wire choice for the operator-observability surface (Step 4.6 in `/sc:status` invoking the CLI on the responsive/ignored decision rule) is the right scope for v803. Future ships can deepen it if signals from the calibration loop suggest the noise level is too high or too low.
