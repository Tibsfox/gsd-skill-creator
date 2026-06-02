---
title: "v1.49.951 — close the last bounded-learning verify gap (suggestions.* end-to-end test)"
version: v1.49.951
date: 2026-06-02
cadence_advances: [verify]
summary: >
  Item 1 of the post-v1.49.950 "1 2 3 and 4" batch: close the LAST
  bounded-learning verify-axis coverage gap. The three suggestions.* calibratable
  thresholds (suggestions.min_occurrences, suggestions.cooldown_days,
  suggestions.auto_dismiss_after_days) — the ORIGINAL thresholds wired at
  v1.49.795-797, before the substrate-auto-emit pattern existed — never received
  the canonical #10453 substrate -> calibration end-to-end test, while all four
  later thresholds did (predictive v856, observation-retention v894,
  token_budget.max v898, token_budget.warn v926). This ship adds
  tests/integration/suggestions-calibration-end-to-end.integration.test.ts: 7
  tests that exercise the REAL SuggestionStore substrate write
  (.addCandidates -> .transition) flowing through to the real
  loadObservationsForThreshold('suggestions.<x>', { suggestionsPath }) calibration
  read, asserting accepted -> +1 / dismissed -> -1 polarity, terminal-only
  filtering (pending/deferred produce zero observations), and missing-file +
  malformed-file tolerance. The skill-creator cadence verify axis flips from
  candidate (3 uncovered) to not-overdue (0 uncovered). This is a genuine verify
  advance, so the README is tagged cadence_advances: [verify] — the first verify
  producer for the v1.49.950 ships-since reader.
tags: [test, verify, bounded-learning, suggestions, lesson-10438, lesson-10453, lesson-10461]
---

# v1.49.951 — close the last bounded-learning verify gap (suggestions.* end-to-end test)

**Shipped:** 2026-06-02

One-line: the three `suggestions.*` calibratable thresholds get their canonical substrate -> calibration end-to-end integration test (the #10453 pattern), closing the last bounded-learning verify-axis coverage gap and flipping the `cadence` verify axis from `candidate` to `not-overdue`.

## Why this ship

Item 1 of the operator-directed "1 2 3 and 4" batch from the post-v1.49.950 handoff. The `skill-creator cadence` verify axis (built across v1.49.947/949/950) precisely flagged the three `suggestions.*` thresholds as the one remaining integration-coverage gap: they are wired (operator accept/dismiss decisions feed the calibration loop) but had no dedicated `*-end-to-end.integration.test.ts` proving the substrate -> calibration wire against real collaborators. Every later threshold had one; these three — the oldest — never did.

## What shipped

- **`tests/integration/suggestions-calibration-end-to-end.integration.test.ts`** — 7 tests. Unlike the four sibling classes (each with a `runX()` substrate + per-event JSONL), `suggestions.*` has no `runX()`: its substrate is the real `SuggestionStore` (the write side of `/sc:suggest`) and all three thresholds read the SAME `.planning/patterns/suggestions.json`. The test drives `SuggestionStore.addCandidates()` -> `.transition(id, 'accepted'|'dismissed')` (substrate write) and reads through `loadObservationsForThreshold('suggestions.<x>', { suggestionsPath })` (calibration read).
  - One explicit `it()` per threshold (literal threshold argument), asserting `accepted -> +1`, `dismissed -> -1`.
  - Terminal-only filtering: a `pending` and a `deferred` suggestion produce ZERO observations.
  - Accumulation: 3 accepts + 2 dismisses -> 5 observations, net `+1` (order-independent count + net-polarity, per #10453).
  - Missing-file tolerance (`[]`) and malformed-`suggestions.json` tolerance (`[]`, the reader swallows the parse error).
- **`cadence_advances: [verify]` on this README** — this ship genuinely advances the verify axis, so it is tagged as the FIRST verify producer for the v1.49.950 `readAxisAdvances` reader. (The honest-marker discipline: tag iff the ship truly advances the axis.)

## Live behavior after the ship

- `node dist/cli.js cadence --axis verify` -> `not-overdue` (0 uncovered thresholds; 5 dedicated end-to-end files).
- The verify axis now has an anchor (v1.49.951) for ships-since tracking; its first conjunct is unmet (no uncovered threshold), so it can never go `overdue` while coverage holds.

## Verification

- `npx tsc --noEmit` clean.
- The new integration file: 7/7 passing.
- `cadence --axis verify --json`: `status: not-overdue`, `uncovered: []`, 5 end-to-end files detected.
- Focused single-agent adversarial review (gsd-code-reviewer): PASS, 0 blockers — verified polarity signs, terminal-only filtering, and missing/malformed tolerance against the real `SuggestionStore` + `suggestions-mapper` + `observation-sources` implementations.

## Engine state

NASA 1.178 (unchanged), counter-cadence **24** (unchanged — forward verify-axis work, not a counter-cadence ship, mirroring v1.49.926), manifest **151** (unchanged — applies #10438 / #10453 / #10461; promotes no lesson).
