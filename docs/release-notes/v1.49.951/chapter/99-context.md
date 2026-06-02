---
title: "Context"
chapter: 99-context
version: v1.49.951
date: 2026-06-02
summary: "Where v1.49.951 sits in the larger arc."
tags: [context, verify, bounded-learning, suggestions]
---

# v1.49.951 — Context

## Milestone metadata

- **Version:** v1.49.951
- **Type:** `test` — verify-axis end-to-end coverage (forward work, NOT counter-cadence)
- **Predecessor:** v1.49.950 (cadence ships-since second-conjunct gate)
- **NASA degree:** 1.178 (unchanged — degree-non-advancing)
- **Counter-cadence count:** 24 (unchanged — forward verify-axis work, mirroring v1.49.926)

## Where this sits

- Item 1 of the operator-directed "1 2 3 and 4" batch from the post-v1.49.950 handoff: (1) suggestions.* end-to-end tests [this ship], (2) `gc()` commit-lock-marker reaping, (3) a true substrate-to-caller wire detector, (4) counter-cadence #25.
- It closes the LAST bounded-learning verify-axis gap. The five dedicated substrate -> calibration end-to-end files now cover all six wired calibratable thresholds:

  | Threshold | End-to-end test | Shipped |
  |---|---|---|
  | predictive.low_confidence_threshold | predictive-low-confidence-end-to-end | v856 (source unwired; not verify-counted) |
  | observation.retention_days | observation-retention-end-to-end | v894 |
  | token_budget.max_percent | token-budget-max-end-to-end | v898 |
  | token_budget.warn_at_percent | token-budget-warn-end-to-end | v926 |
  | suggestions.min_occurrences | suggestions-calibration-end-to-end | **v951** |
  | suggestions.cooldown_days | suggestions-calibration-end-to-end | **v951** |
  | suggestions.auto_dismiss_after_days | suggestions-calibration-end-to-end | **v951** |

## Files changed

- `tests/integration/suggestions-calibration-end-to-end.integration.test.ts` — NEW. 7 tests exercising the real `SuggestionStore` substrate -> real `loadObservationsForThreshold` calibration wire for the three `suggestions.*` thresholds.
- `docs/release-notes/v1.49.951/README.md` — tagged `cadence_advances: [verify]` (the first verify producer for the v1.49.950 ships-since reader).

## The substrate, for this class

- **Substrate write:** `src/detection/suggestion-store.ts::SuggestionStore` — `.addCandidates()` (pending) then `.transition(id, 'accepted'|'dismissed')` (terminal decision), persisted atomically to `<patternsDir>/suggestions.json`.
- **Calibration read:** `src/bounded-learning/observation-sources.ts::loadObservationsForThreshold('suggestions.<x>', { suggestionsPath })` -> `loadSuggestionsFromFile` -> `entriesToObservations` (src/bounded-learning/suggestions-mapper.ts): `accepted -> +1`, `dismissed -> -1`, `pending`/`deferred` -> filtered out.

## Test posture

- `npx tsc --noEmit` clean.
- New integration file: 7/7.
- `cadence --axis verify --json`: `status: not-overdue`, `uncovered: []`, 5 dedicated end-to-end files.
- Focused single-agent adversarial review (gsd-code-reviewer): PASS, 0 blockers.

## Engine state at close

- NASA degree 1.178 (unchanged).
- Counter-cadence count 24 (unchanged — forward verify-axis work).
- Manifest: **151 lessons** (unchanged — applies #10438 / #10453 / #10461; records a carried-forward "store-as-substrate" candidate; promotes none).

## References

- The test: `tests/integration/suggestions-calibration-end-to-end.integration.test.ts`.
- The substrate: `src/detection/suggestion-store.ts`.
- The read side: `src/bounded-learning/observation-sources.ts` + `suggestions-mapper.ts`.
- The gate that scoped it: `src/cli/commands/cadence.ts` (verify axis).
- The batch: v1.49.951 (this), then v1.49.952 (gc reaping), v1.49.953 (wire detector), v1.49.954 (counter-cadence #25).
