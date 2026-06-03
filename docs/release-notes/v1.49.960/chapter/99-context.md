---
title: "Context"
chapter: 99-context
version: v1.49.960
date: 2026-06-03
summary: "Where v1.49.960 sits in the larger arc."
tags: [context, m4, branches, crash-recovery]
---

# v1.49.960 — Context

## Milestone metadata

- **Version:** v1.49.960
- **Type:** `feat(branches)` — M4 intent-journal crash recovery for wedged commits
- **Predecessor:** v1.49.959 (param-return-through + parenthesized-literal detector lifts)
- **NASA degree:** 1.178 (frozen hold)
- **Counter-cadence count:** 27 (unchanged — normal forward feat)

## Where this sits

v960 completes the M4 commit() crash-recovery arc: v1.49.948 (per-round permanent
winner marker — closes the double-win) -> v1.49.952 (write-ahead so gc() can reap
the provably un-won `committing: false` orphans) -> **v1.49.960** (intent journal
+ recover() forward-completes the `committing: true` flip->rename wedge). It is
forward-candidate 3 of the operator's post-v958 "1 2 & 3" batch (shipped after the
v959 detector lifts; the counter-cadence ships last).

## Files changed

- `src/branches/recover.ts` (new) — `recover()` + `RecoverOptions` / `RecoverReport`.
- `src/branches/commit.ts` — LockEntry `trunkTmp` + `bodyHash` journal fields;
  enriched write-ahead; crash-recovery docstring (residuals documented).
- `src/branches/index.ts` — export `recover()`.
- `src/ab-harness/coordinator.ts` — best-effort `recover()` before each commit round.
- `src/branches/__tests__/recover.test.ts` (new, 17 tests) +
  `src/ab-harness/__tests__/coordinator.test.ts` (recover-wire test).

## Engine state at close

- NASA degree 1.178. Counter-cadence 27. Manifest 151 lessons. No
  `cadence_advances` marker.
