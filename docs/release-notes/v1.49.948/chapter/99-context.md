---
title: "Context"
chapter: 99-context
version: v1.49.948
date: 2026-06-02
summary: "Where v1.49.948 sits in the larger arc."
tags: [context, branches, m4, concurrency, fix]
---

# v1.49.948 — Context

## Milestone metadata

- **Version:** v1.49.948
- **Type:** `fix` (M4 branch-commit concurrency; NOT counter-cadence)
- **Predecessor:** v1.49.947 (`skill-creator cadence` CLI; counter-cadence #24)
- **NASA degree:** 1.178 (unchanged — degree-non-advancing)
- **Counter-cadence count:** 24 (unchanged — this is a `fix`, like v945/v946 did not increment it)

## Where this sits

- The first ship of a second operator-directed "1 2 3" batch following the post-v1.49.947 handoff, which numbered three forward-candidates: (1) fix the M4 double-win, (2) harden the `cadence` verify heuristic, (3) add per-axis ships-since tracking. This is item 1.
- It closes the highest-value open follow-up the post-v944 handoff carried forward and the v947 ship's own README explicitly anticipated ("filed as a dedicated follow-up fix ship"). The M4 double-win had been forcing a `vitest` pre-tag-gate bypass since v1.49.946.
- It is the #10415 escalated-wedge closure: an open bug that an operator-authorized gate bypass was papering over, closed within two milestones of surfacing.

## Files changed

- `src/branches/commit.ts` — permanent per-round winner lock (`commitRoundKey` + `COMMIT_LOCK_PREFIX`), winner no longer unlinks on success, atomic write-then-rename trunk write, `LockEntry` gains `parentHash` + `trunkPath` (observability), expanded module docstring (permanent-record / round-key boundary / 0-delta idempotency / crash recovery). `COMMIT_LOCK_FILENAME` retained as a legacy export.
- `src/branches/__tests__/commit.test.ts` — 11 tests: 5 original kept; per-round marker (rewrites the old lock-cleanup test); `CF-M4-02b` deterministic sequential double-win regression (mutation-proven); future-round-still-commits (mutation-proven, pins parentHash-in-key); unrelated-rounds-independent; 0-delta idempotency; winner-error-path recovery (mutation-proven).
- `src/branches/fork.ts` — comment noting 0-delta is permitted and collides on roundKey.
- `src/branches/gc.ts` — comment updated for the per-round marker name.
- `src/branches/index.ts` — barrel exports `COMMIT_LOCK_PREFIX` + `commitRoundKey`.
- `docs/release-notes/v1.49.948/` — milestone notes (README + 00/03/04/99 chapters).

## The bug -> fix, at a glance

| | Pre-v1.49.948 | v1.49.948 |
|---|---|---|
| Lock | single global `.commit-lock`, RELEASED on winner success | per-round `.commit-lock-<roundKey>`, PERMANENT on success |
| Winner selection | `ax` open; window reopens on unlink | `ax` open; window never reopens (no success unlink) |
| Round key | none (global) | `sha256(resolve(trunkPath) + NUL + parentHash)` |
| Double-win | possible (late racer after unlink) | impossible (zero timing dependence) |
| Unrelated trunks | could spuriously block each other | independent |
| Failure release | on success AND error | error path only |

## Test posture

- `npx tsc --noEmit` clean.
- `commit.test.ts` 11/11; branches + ab-harness scope **235/235**.
- Mutation-proofs: restore success-path unlink -> `CF-M4-02b` double-wins; drop `parentHash` from the key -> a future round is over-blocked; remove the error-path unlink -> the round wedges (sibling cannot recover).
- 4-lens adversarial-review Workflow: 0 blockers / 0 majors; 5 minor findings (4 applied with tests, 1 was the documented 0-delta behavior). The race lens's headline candidate ("second winner after error release") was verified correct per first-commit-wins.
- **Pre-tag-gate: `vitest` step run UN-bypassed** — the full suite passes under the gate's local high-parallelism build->full-suite contention now that the race is deterministically impossible.

## Engine state at close

- NASA degree 1.178 (unchanged).
- Counter-cadence count 24 (unchanged — a `fix`).
- Manifest: **151 lessons** (unchanged — applies #10415 / #10427 / #10409; records a carried-forward candidate; promotes none).

## References

- The fixed module: `src/branches/commit.ts`; the regression tests: `src/branches/__tests__/commit.test.ts`.
- The sole production caller: `src/ab-harness/coordinator.ts` (one commit per A/B experiment).
- The escalated-wedge discipline: `docs/deferred-maintenance-discipline.md` (#10415).
- The bug as filed: post-v1.49.944 and post-v1.49.947 handoffs ("M4 branches first-commit-wins double-win").
