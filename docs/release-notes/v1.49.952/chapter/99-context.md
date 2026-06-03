---
title: "Context"
chapter: 99-context
version: v1.49.952
date: 2026-06-02
summary: "Where v1.49.952 sits in the larger arc."
tags: [context, branches, m4, crash-recovery, gc, write-ahead]
---

# v1.49.952 — Context

## Milestone metadata

- **Version:** v1.49.952
- **Type:** `fix(branches)` — M4 commit-lock crash-recovery write-ahead + gc reaping (forward work, NOT counter-cadence)
- **Predecessor:** v1.49.951 (suggestions.* verify end-to-end test)
- **NASA degree:** 1.178 (unchanged — degree-non-advancing)
- **Counter-cadence count:** 24 (unchanged — forward `fix`)

## Where this sits

- Item 2 of the operator-directed "1 2 3 and 4" batch from the post-v1.49.950 handoff: (1) suggestions.* end-to-end tests [v1.49.951], (2) M4 commit-lock crash-recovery [this ship], (3) a true substrate-to-caller wire detector, (4) counter-cadence #25.
- It completes the M4 first-commit-wins arc: v1.49.948 fixed the double-win by making the per-round commit-lock a PERMANENT winner record, and named the residual crash-recovery boundary. This ship closes that boundary SOUNDLY — after a review proved the obvious gc-only fix is structurally unsound.

## The commit() winner timeline + the write-ahead

| Step | Marker state | Round won? | gc() on a crash here |
|---|---|---|---|
| acquire `ax` lock | `committing: false` | no | REAP (un-wedge) |
| read skill.md / mkdir / write trunkTmp | `committing: false` | no | REAP (un-wedge) |
| **flip to `committing: true`** (write-ahead) | `committing: true` | not yet | KEEP (residual, tiny window) |
| `fs.rename(trunkTmp, trunkPath)` | `committing: true` | **yes** | KEEP (safe) |
| `writeManifest('committed')` | `committing: true` | yes | KEEP (safe) |
| success — lock retained as permanent record | `committing: true` | yes | KEEP (permanent record) |

`committing: false` is reachable ONLY before the trunk write -> reaping it is sound. (Legacy pre-v1.49.952 markers have no field -> also kept.)

## Files changed

- `src/branches/commit.ts` — `LockEntry.committing` added; written `false` at lock acquisition, flipped to `true` immediately before `fs.rename`; `trunkTmp` hoisted so the error path cleans it up; crash-recovery docstring rewritten for the write-ahead.
- `src/branches/gc.ts` — pass-1 commit-lock reaping (`reapCommitLock`): reap iff old AND `committing === false`; `DEFAULT_COMMIT_LOCK_MAX_AGE_MS` (1h) + `commitLockMaxAgeMs` option; `reapedLocks` / `keptLocks` / `skippedLocks` added to `GcReport`; module docstring rewritten for the soundness argument.
- `src/branches/__tests__/gc.test.ts` — NEW. 18 tests (gc had zero): branch reaping + lock reaping, incl. the `committing: true` SAFETY case (mutation-proven double-win guard).
- `src/branches/__tests__/commit.test.ts` — +1 test asserting a successful commit leaves the marker `committing: true` (the write-ahead is observable).

## Why a gc-only reaper is unsound (the review trail)

- 3-lens adversarial Workflow on the first design (reap iff old AND winner branch `open`): FAIL — a crash in the trunk-rename-before-manifest window leaves the branch `open` but the trunk applied.
- Revised to also require the trunk to hash to `parentHash`; re-review: FAIL — the hash check is monotonicity-blind (a later round restoring the parent body) and cwd-fragile (unresolved `trunkPath`).
- Converged conclusion: a pure gc-side reaper cannot be sound because the durable success signal (committed manifest) is written AFTER the trunk is applied. Operator chose the `commit()` write-ahead.
- Focused final safety review of the write-ahead: PASS, 0 blockers (all six attack vectors clean; 2 doc/tidiness nits applied).

## Test posture

- `npx tsc --noEmit` clean — no problematic `gc.js` -> `commit.js` cycle (`commit.js` does not import `gc.js`).
- Full `src/branches/` 85/85, incl. the v948 CF-M4-02 concurrent-commit (double-win) tests, unchanged.
- Mutation-proven: dropping the `committing !== false` guard reaps a `committing: true` marker and fails the SAFETY test.

## Engine state at close

- NASA degree 1.178 (unchanged).
- Counter-cadence count 24 (unchanged — forward `fix`).
- Manifest: **151 lessons** (unchanged — applies #10427; records a carried-forward "producer-side write-ahead for permanent-record-or-orphan reaping" candidate; promotes none).

## References

- The fix: `src/branches/commit.ts` (write-ahead) + `src/branches/gc.ts` (the `reapCommitLock` pass).
- The v948 design it preserves: `src/branches/commit.ts` (permanent per-round winner lock).
- The batch: v1.49.951 (suggestions verify), v1.49.952 (this), then v1.49.953 (wire detector), v1.49.954 (counter-cadence #25).
