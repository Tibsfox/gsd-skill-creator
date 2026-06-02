# v1.49.951 — Summary

## The ship

Item 1 of the post-v1.49.950 "1 2 3 and 4" batch: close the LAST bounded-learning verify-axis coverage gap by giving the three `suggestions.*` calibratable thresholds their canonical #10453 substrate -> calibration end-to-end integration test.

## What shipped

- **`tests/integration/suggestions-calibration-end-to-end.integration.test.ts`** (7 tests). The `suggestions.*` class is special: no `runX()` substrate, no per-event JSONL. Its substrate is the real `SuggestionStore`, and all three thresholds read the same `suggestions.json`.
  - Per-threshold `it()` blocks (literal threshold arg): `suggestions.min_occurrences`, `suggestions.cooldown_days`, `suggestions.auto_dismiss_after_days` — `accepted -> +1`, `dismissed -> -1`.
  - Terminal-only filtering: `pending` + `deferred` -> zero observations.
  - Accumulation (3 accept + 2 dismiss -> net `+1`), missing-file tolerance, malformed-file tolerance.
- **`cadence_advances: [verify]`** on the README — the first genuine verify producer for the v1.49.950 ships-since reader.

## Why these three were last

They are the ORIGINAL calibratable thresholds (v1.49.795-797), wired before the substrate-auto-emit pattern existed. Every threshold wired AFTER them got the canonical end-to-end test (predictive v856, observation-retention v894, token_budget.max v898, token_budget.warn v926); these three never did. The `cadence` verify axis surfaced the omission precisely.

## Live behavior

- `cadence --axis verify` -> `not-overdue` (was `candidate` with 3 uncovered). 5 dedicated end-to-end files now cover all 6 wired thresholds (`predictive.low_confidence_threshold` stays unwired/unchecked by design).

## Verification

- tsc clean; the new file 7/7; `cadence --axis verify` confirms `uncovered: []`.
- Focused adversarial review (gsd-code-reviewer): PASS, 0 blockers — polarity, terminal-only filtering, and missing/malformed tolerance verified against the real implementation.

## Engine state

NASA 1.178 (unchanged), counter-cadence **24** (unchanged — forward verify-axis work, not counter-cadence), manifest **151** (unchanged — applies #10438 / #10453 / #10461; promotes none).
