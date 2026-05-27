# v1.49.837 — `predictive.low_confidence_threshold` Observation Source Wired

**Released:** 2026-05-27

## What shipped

Wires the observation source for `predictive.low_confidence_threshold` — closing the v835 unwired-stub gap. Mirrors v803's `token-budget-events.ts` shape exactly, with one deliberate design difference: the polarity is inverted because the underlying threshold semantics are inverted.

- **NEW** `src/bounded-learning/predictive-low-confidence-events.ts` (~200 LOC). Event type, kind mapping, append/read JSONL infrastructure.
- **MODIFIED** `src/bounded-learning/observation-sources.ts`. `wired: false → true`; dispatch reads the new JSONL.
- **MODIFIED** `src/cli/commands/bounded-learning.ts`. `SUPPORTED_THRESHOLDS` 4 → 5; `--record-event` dispatches by threshold to a new `runRecordPredictiveEvent` branch.
- **NEW** `src/bounded-learning/__tests__/predictive-low-confidence-events.test.ts` (+13 tests).
- **MODIFIED** existing tests updated for the `wired: true` flip + SUPPORTED_THRESHOLDS length.

## Why this ship

The v834-835 handoff listed wiring this threshold as the #1 follow-up. v835 left it as a scaffold (type-registered but observation-source-unwired). v837 closes the source side.

**Structural blocker on the production-fallbackProvider-construction part:** neither `ActivationSelector` nor copper `Activation` has a production caller at v837 ship time. Both are exercised only in tests. The end-to-end wire (CLI → JSONL → bounded-learning dispatch → calibration loop) is in place, but auto-emit from production fallback fires waits for a future ship that constructs a `fallbackProvider` in production code.

## Polarity flip — design rationale

`token_budget.warn_at_percent` (v803): raising threshold = warn fires LESS. responsive → +1 (favor decrease, warn earlier).

`predictive.low_confidence_threshold` (v837): raising threshold = fallback fires MORE. useful → -1 (favor increase, fire more).

The polarity is intrinsic to the threshold's mechanic. The v837 module documents this in JSDoc + test names to guard against future copy-paste from the v803 polarity convention.

## Engine state

NASA 1.178 (UNCHANGED, **55 consecutive** — widest pressure margin record again). Counter-cadence 6. Manifest 23 / lessons 77. UNCODIFIED 39 ≤ 41.

Wired calibratable threshold sources: 4 → 5 (`suggestions.* × 3 + token_budget.warn_at_percent + predictive.low_confidence_threshold`). Type-registered remains 7 of 7. SUPPORTED_THRESHOLDS 4 → 5.

## Tests

+14 net tests (35,243 → 35,257). Build clean. Pre-tag-gate 17/17.

## Predecessor

v836 (publish.mjs destination-side preservation) — paid off the chapter-overwrite friction class. v837 ships cleanly without the `git checkout HEAD --` workaround for the first time, validating v836's effectiveness end-to-end.
