---
title: "Context"
chapter: 99-context
version: v1.49.953
date: 2026-06-02
summary: "Where v1.49.953 sits in the larger arc."
tags: [context, cli, cadence, verify, wire-detector]
---

# v1.49.953 — Context

## Milestone metadata

- **Version:** v1.49.953
- **Type:** `feat(cli)` — structural substrate-to-caller wire detector for the verify axis (forward work, NOT counter-cadence)
- **Predecessor:** v1.49.952 (M4 commit-lock crash-recovery write-ahead)
- **NASA degree:** 1.178 (unchanged — degree-non-advancing)
- **Counter-cadence count:** 24 (unchanged — a `feat`, mirroring v1.49.949)

## Where this sits

- Item 3 of the operator-directed "1 2 3 and 4" batch from the post-v1.49.950 handoff: (1) suggestions.* end-to-end tests [v1.49.951], (2) M4 crash-recovery [v1.49.952], (3) a true substrate-to-caller wire detector [this ship], (4) counter-cadence #25.
- It completes the meta-cadence verify-axis hardening arc:
  - v1.49.947 — verify axis built on global-substring over all integration files.
  - v1.49.949 — restricted to dedicated `*-end-to-end.integration.test.ts` files.
  - v1.49.953 — structural wire detection within those files (this ship).

## The detector

| End | What it checks | Regex |
|---|---|---|
| caller | threshold passed as a string-literal arg to the calibration reader | `loadObservationsForThreshold\(\s*['"]<escaped T>['"]` |
| substrate | the file imports a substrate/events module | `/from ... (?:-substrate\|-events\|suggestion-store) .../` |

Covered iff BOTH. The `\s*` spans the multi-line call style; the threshold's `.`s are regex-escaped by `escapeRegExp`.

## The 5 dedicated end-to-end files (all structurally wire, post-v953)

| Threshold | Substrate import (write end) | Reader call (caller end) |
|---|---|---|
| suggestions.{min_occurrences,cooldown_days,auto_dismiss_after_days} | `detection/suggestion-store` | `loadObservationsForThreshold('suggestions.<x>', ...)` |
| token_budget.warn_at_percent | `token-budget/warn-substrate` | `loadObservationsForThreshold('token_budget.warn_at_percent', ...)` |
| token_budget.max_percent | `token-budget/ceiling-substrate` | `loadObservationsForThreshold('token_budget.max_percent', ...)` |
| observation.retention_days | `observation/retention-substrate` | `loadObservationsForThreshold('observation.retention_days', ...)` |
| predictive.low_confidence_threshold | `bounded-learning/predictive-low-confidence-events` | `loadObservationsForThreshold('predictive.low_confidence_threshold', ...)` |

## Files changed

- `src/cli/commands/cadence.ts` — `detectThresholdWire` + `CALIBRATION_READER` + `SUBSTRATE_MODULE_RE` + `escapeRegExp`; `verifyVerdict` uses the detector instead of `content.includes`; module docstring + verdict detail text updated from "string-presence" to "structural wiring".
- `src/cli/commands/cadence.test.ts` — 9 new `detectThresholdWire` unit tests + `wiredContent`/`mentionContent` helpers; the `verifyVerdict` and dedicated-file-restriction tests migrated to structural-wire synthetic content.

## Test posture

- `npx tsc --noEmit` clean.
- `cadence.test.ts` 44/44 (9 new detector tests).
- `cadence --axis verify --json`: `status: not-overdue`, `uncovered: []` (verdict unchanged; evidence stronger).
- Mutation-proven (both conjuncts): revert to `content.includes` fails the comment-only-mention guard; drop the substrate conjunct fails the reader-call-without-substrate guard.

## Engine state at close

- NASA degree 1.178 (unchanged).
- Counter-cadence count 24 (unchanged — a `feat`).
- Manifest: **151 lessons** (unchanged — applies #10461; records a carried-forward "harden string-presence gates to call-with-literal" candidate; promotes none).

## References

- The detector: `src/cli/commands/cadence.ts` (`detectThresholdWire`).
- The verify-axis arc: v1.49.947 (build) -> v1.49.949 (dedicated-file restriction) -> v1.49.953 (structural wiring).
- The batch: v1.49.951 (suggestions verify), v1.49.952 (M4 crash-recovery), v1.49.953 (this), then v1.49.954 (counter-cadence #25).
