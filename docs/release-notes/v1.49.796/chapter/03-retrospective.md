# Retrospective — v1.49.796

## Carryover lessons applied

- **Lesson #10412 — Recon-first as default.** 9th consecutive application since v784 codification. Read all 5 ship-1 source files + all 3 ship-1 test files + the CLI command file + `src/integration/config/schema.ts` + the live `.planning/skill-creator.json` BEFORE writing any v796 code. Recon surfaced (a) the architecture is already threshold-agnostic at the primitive layer — only `SUPPORTED_THRESHOLDS` in the CLI hardcodes the whitelist, (b) schema already validates `cooldown_days` in [1, 365] with default 7 matching the calibration loop's `ABSOLUTE_FLOOR = 1`, (c) the direction interpretation (`decrease` / `increase`) and the buildReason wording (`lower` / `raise`) work for both thresholds without modification. ~10 min recon → ~20 min implementation.
- **Lesson #10422 — Verdict-pattern surface separation.** Re-applied. The 4-line change to `SUPPORTED_THRESHOLDS` is the entire production-code delta for the wire. Docstring refreshes + test additions are surface-separated work that lives outside the production-code surface — they don't propagate through any other file.
- **Lesson #10423 — Lightest wire that satisfies the verdict.** Re-applied. Lightest possible wire: add the threshold key to a single array literal, update three docstrings, add focused tests. Resisted the temptation to (a) refactor `FlagLookup` mid-ship (still flagged for a dedicated future ship), (b) generalize the `proposeNewValue` floor logic to be per-threshold (`ABSOLUTE_FLOOR = 1` works for both `min_occurrences` and `cooldown_days`), (c) factor a per-threshold semantic-direction registry (the same accept→decrease / dismiss→increase mapping is correct for both).
- **Lesson #10424 (ESTABLISHED v794) — Adoption-refresh AFTER bump.** Applied — T14 step 11 ordering correctly places adoption-refresh after bump-version. Third consecutive ship under the active gate.

## What Worked

- **Ship-1 scaffolding paid off measurably.** Wall-clock: ~30 min, matching the lower bound of the v795 retrospective's 30-45 min prediction for ships 2-6. The "complete vertical for ONE threshold + threshold-agnostic primitive" pattern from ship 1 made ship 2 a near-trivial extension. Pattern-validation observation: when a new module is introduced as a vertical with a threshold-agnostic primitive layer, the second wire is sub-30-min routine work.
- **Schema-and-primitive alignment caught the floor decision early.** Schema validates `cooldown_days ∈ [1, 365]`; primitive's `ABSOLUTE_FLOOR = 1` matches. No new per-threshold floor logic needed. This alignment was deliberate in ship 1 (using `1` as the floor was generic enough to absorb the second threshold without modification).
- **Test trip-point math reused from ship 1.** Trip point at α = 0.05 and λ = 0.5: ~10 unanimous observations produce evidence ≈ 41.1 > 40. Same fixture works for `cooldown_days` tests — observed values `7 → 6` for decrease and `7 → 8` for increase, exactly matching the predicted single-step adjustment. No fixture-tuning iteration needed.
- **Sibling-preservation test catches a class of bugs.** The threshold-writer test for `cooldown_days` explicitly asserts `min_occurrences = 3` and `auto_dismiss_after_days = 30` remain on disk after `applyRecommendation` writes the cooldown_days update. This is the kind of test that would catch a future bug where `setThresholdValue` accidentally clobbers a sibling — cheap to write, surfaces a critical regression class.
- **Smoke test against live config surfaced the live default value.** `node dist/cli.js bounded-learning --threshold suggestions.cooldown_days --json` correctly reads `currentValue: 7` from the live `.planning/skill-creator.json`. The wire is verified end-to-end against production config, not just temp-dir fixtures.

## What Could Be Better

- **`FlagLookup` discriminated union still in 4 CLI commands; not extracted this ship.** The v793 + v795 retrospectives flagged this as a refactor opportunity. v796 did not bundle it because (a) v796's scope is "wire a second threshold" not "refactor", and (b) the lightest-wire discipline says: do the wire, don't bundle adjacent refactors. The cost continues to accumulate at ~5 min per future CLI; the extract is ~15 min. Still a deferred-maintenance candidate.
- **No audit log of loop runs.** Carried over from v795. Every CLI invocation produces a recommendation, but there's no persistent record. Ship 3 candidate.
- **Per-threshold semantic interpretation lives in CLI module docstring, not in a structured registry.** The `cooldown_days` accept-skew → DECREASE (re-surface sooner) interpretation is documented in the CLI module docstring; it's not encoded in a structured table or per-threshold metadata. Fine for 2 thresholds; will need a structured surface at 4+ thresholds. Not blocking ship 2.
- **Observation source is the same for both thresholds — coarse calibration only.** Both `min_occurrences` and `cooldown_days` calibrate against the same `entriesToObservations` filtered list of accept/dismiss decisions. For `cooldown_days`, a more precise signal would filter to RE-SURFACED suggestions only (where the cooldown period elapsed and the suggestion was shown again). The current wire produces a coarse "overall operator skew" calibration; precision-cooldown calibration is a future ship.

## Surprises

- **Zero primitive change required to wire the second threshold.** The recon confirmed expectation that the primitive was threshold-agnostic, but the reality was even cleaner — not a single source-file edit in `src/bounded-learning/calibration-loop.ts`, `threshold-writer.ts`, or `suggestions-mapper.ts`. Only docstring edits to types.ts and index.ts. The architectural separation from ship 1 was correct and didn't leak.
- **The CLI's `parseThresholdKey` function already handled the new threshold without modification.** It validates against `SUPPORTED_THRESHOLDS` membership; widening the array cascaded automatically.
- **Test count growth was sub-linear to expectations.** Initial estimate: ~10-15 new tests. Actual: 9 new tests covered the cooldown_days wire end-to-end (4 calibration-loop + 1 threshold-writer + 4 CLI). The primitive's threshold-agnosticism meant we didn't need to re-test the loop's internal mechanics, only the per-threshold trip-points and the writer's sibling-preservation behavior.

## Lessons applied at v1.49.796 (from v1.49.795 and earlier)

- **#10412** (recon-first) — applied. 9th consecutive application.
- **#10422-#10423** (Verdict-pattern surface separation + lightest wire) — applied to both production-code edit + test additions.
- **#10424** (Adoption-refresh AFTER bump) — applied; gate inherited from v794.
- **#10425 candidate (v795)** (two-sided-on-binary insensitivity) — N/A this ship; primitive inherits the two-one-sided-Bonferroni design from v795 without independently re-applying the choice. Does NOT count as a second-instance forward-shadow — see lessons chapter for promotion-path discussion.

## Lesson candidate emitted this ship

None. v796 is a clean extension within established scaffolding; no new design choices surfaced new traps.

## Open lessons watchlist (apply at next opportunity)

- **#10412** (recon-first) — apply at every session start.
- **#10422-#10423** (Verdict-pattern surface separation + lightest wire) — apply at every extension.
- **#10425 candidate** (two-sided-on-binary insensitivity) — apply at every binary-observation calibration design (NOT applicable to mere extensions that reuse the existing primitive).
- **FlagLookup extract** — non-lesson refactor opportunity, now 4 copies, still deferred.

## Verdict on T1.1 ship 2 scope

The "wire `suggestions.cooldown_days`" scope landed in one ship at ~30 min wall-clock — at the lower bound of the v795 retrospective's prediction. Ship 2 produces a horizontal extension: same vertical (read → compute → write), one more threshold supported. Ship 3 has freedom to extend horizontally further (more thresholds) or deepen vertically (audit log, watch mode, status integration). The pattern-validation observation (extension ships are sub-30-min routine work once the vertical is in place) is now empirically supported by one data point and will firm up across ships 3-6.
