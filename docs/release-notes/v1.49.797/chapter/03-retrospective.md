# Retrospective — v1.49.797

## Carryover lessons applied

- **Lesson #10412 — Recon-first as default.** 10th consecutive application since v784 codification. Read all three v796-modified source files + all three v796-modified test files + the live `.planning/skill-creator.json` BEFORE writing any v797 code. Recon confirmed (a) the v796 extension pattern is reproducible verbatim, (b) the schema validates `auto_dismiss_after_days` (live default 30 present in config), (c) the same trip-point math applies (10 unanimous observations cross α = 0.05). ~5 min recon → ~10-15 min implementation.
- **Lesson #10422 — Verdict-pattern surface separation.** Re-applied. The 4-line addition to `SUPPORTED_THRESHOLDS` is the entire production-code delta. Surface separation continues to hold: primitive (no change) / CLI whitelist (one array entry) / docstrings (three small refreshes) / tests (one new describe block in three files).
- **Lesson #10423 — Lightest wire that satisfies the verdict.** Re-applied. Resisted the temptation to introduce inverted-direction support for `auto_dismiss_after_days` (where one could argue dismiss-skew should DECREASE the window, kill bad suggestions faster). Kept the identical mapping per the v796 retro's "semantic stretch is identical" framing and documented the resulting interpretation in the docstring. This is a deliberate scope decision: the threshold-agnostic primitive is a stronger architectural property than a perfectly-tuned per-threshold semantic.
- **Lesson #10424 (ESTABLISHED v794) — Adoption-refresh AFTER bump.** Applied — T14 step 11 ordering correctly places adoption-refresh after bump-version. Fourth consecutive ship under the active gate.

## What Worked

- **Sub-20-min wall-clock for ship 3.** v797 landed at ~15-20 min — beating the v796 lower bound and validating the v796 retro's pattern-prediction. Recon shortened because the v796 test surface is already a verbatim template; only delta values (30/29/31 vs 7/6/8) had to change.
- **Chained-ship session leverages template lock-in.** Authoring v797 immediately after closing v796 means the templates (release-notes, test patterns, docstring patterns) are still hot in working context. No re-reading of remote docs or prior conventions. Wall-clock saving estimated at ~5-10 min versus starting a v797 session cold.
- **Sibling-preservation test now covers all-3 siblings.** v797's threshold-writer test asserts `min_occurrences = 3` AND `cooldown_days = 7` remain on disk after writing `auto_dismiss_after_days = 29`. Coverage grows naturally with each extension.
- **Smoke test against live config matches predicted shape.** Same `currentValue` (30, the live default), same `direction: hold` against zero data, same `applied: noop`. The wire is verified end-to-end against production config.

## What Could Be Better

- **Semantic interpretation choice remains under-tested.** The accept-skew ⇒ DECREASE mapping for `auto_dismiss_after_days` is defensible but not the only defensible reading. A reader could argue dismiss-skew (operator finds suggestions bad) should also DECREASE the window (kill them faster), making the relationship between operator signal and threshold direction non-monotonic. v797 inherits the mapping from v795/v796 by symmetry rather than re-deriving it for the new threshold's specific semantics. Flag for v798 retro: if `token_budget.warn_at_percent` (different observation source) re-raises this, it may be worth a separate lesson candidate around "semantic mapping audit when adding a new threshold class."
- **`FlagLookup` discriminated union STILL in 4 CLI commands; not extracted this ship.** v793/v795/v796 retros all flagged this. v797 continues to defer per the lightest-wire discipline. The cost continues to accumulate at ~5 min per future CLI; the extract is ~15 min. Carrying forward.
- **No audit log of loop runs.** Carried from v795/v796. v799 (next ship in this chained session) explicitly addresses this.
- **Per-threshold semantic interpretation lives in CLI module docstring, not in a structured registry.** Three thresholds with identical mapping still don't justify a registry. At 4+ thresholds with potential semantic divergence (v798 `token_budget` is a candidate), a structured surface may become warranted.

## Surprises

- **v797 is the cleanest extension yet — no surprises.** Even the "semantic stretch" concern I worked through in recon resolved into a no-decision: keep the v796 mapping, document the interpretation, move on. Zero primitive-source-file edits. Zero new test infrastructure. The architectural-payoff prediction from v795 is now empirically backed by two extension data points (v796, v797), both sub-30-min.
- **Chained-session cadence emerging.** Authoring v796 last session, then v797 in the immediate continuation, the wall-clock for v797 was meaningfully lower than v796 (already an extension). This is a candidate observation for the meta-cadence: extension ships in series benefit not just from architectural payoff but also from session-context warmth. May matter for v798-v801 estimates.

## Lessons applied at v1.49.797 (from v1.49.795/796 and earlier)

- **#10412** (recon-first) — applied. 10th consecutive application.
- **#10422-#10423** (Verdict-pattern surface separation + lightest wire) — applied to both production-code edit + test additions + the semantic-interpretation scope decision.
- **#10424** (Adoption-refresh AFTER bump) — applied; gate inherited from v794.
- **#10425 candidate (v795)** (two-sided-on-binary insensitivity) — N/A this ship; identical inheritance from v795/v796.

## Lesson candidate emitted this ship

None. v797 is a clean extension within established scaffolding; no new design choices surfaced new traps.

Tentative observation (not a candidate yet): **chained-session extension-ship speed-up.** Wall-clock for v797 was meaningfully lower than v796 even though v796 was already the architectural-payoff data point. Hypothesis: session-context warmth amplifies architectural payoff. Will firm up across v798-v801 if the speed-up continues.

## Open lessons watchlist (apply at next opportunity)

- **#10412** (recon-first) — apply at every session start. v798 needs fresh recon because it moves to a new observation-source class.
- **#10422-#10423** (Verdict-pattern surface separation + lightest wire) — apply at every extension. v798's potential observation-source architectural choice is the first real opportunity to test whether lightest-wire still applies when the wedge is non-trivial.
- **#10425 candidate** (two-sided-on-binary insensitivity) — apply at every binary-observation calibration design. v798 is the first ship that MIGHT generate a second-instance forward-shadow if the architectural choice forces re-derivation of the e-process selection.
- **FlagLookup extract** — non-lesson refactor opportunity, now 4 copies, still deferred.

## Verdict on T1.1 ship 3 scope

The "wire `suggestions.auto_dismiss_after_days`" scope landed in one ship at ~15-20 min wall-clock — beating the v796 lower bound. Two consecutive extension ships now empirically validate the v795 architectural choice. v798 will test whether the architectural payoff holds when the next ship moves to a different observation source (forcing a potential observation-source architectural choice).
