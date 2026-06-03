---
title: "v1.49.952 — close the M4 commit-lock crash-recovery boundary (write-ahead + gc reaping)"
version: v1.49.952
date: 2026-06-02
summary: >
  Item 2 of the post-v1.49.950 "1 2 3 and 4" batch: close the residual M4
  liveness gap left by v1.49.948. The v948 double-win fix made the per-round
  commit-lock marker a PERMANENT winner record; the documented residual was that
  a hard process kill (SIGKILL/OOM) mid-commit leaves an ORPHAN marker that
  wedges that round forever, because gc() skipped all dotfiles. The obvious fix
  (age-based gc reaping) turns out to be UNSOUND on its own: commit() advances
  the trunk (fs.rename) BEFORE it records success (writeManifest committed), so a
  gc-side reaper cannot tell a crash-before-apply from a crash-after-apply
  without consulting mutable trunk content — and a 3-lens adversarial review
  found two concrete crash/interleaving sequences where a gc-only reaper reaps a
  WON round's marker, reopening the v948 double-win. The sound fix (operator-
  chosen) is a WRITE-AHEAD inside commit(): the marker records committing:false
  at lock acquisition and is flipped to committing:true immediately before the
  trunk rename. gc() then reaps an orphan iff (age > commitLockMaxAgeMs, default
  1h) AND the marker explicitly records committing:false — which PROVES the crash
  preceded the trunk write (round never won). committing:true (trunk may be
  advanced), a legacy marker (no field), young, or corrupt markers are all kept.
  The write-ahead is ADDITIVE to commit() — it does not change winner selection
  (the atomic 'ax' open) or the never-unlink-on-success behavior, so v948 is
  fully preserved. gc() got its first-ever tests (18); the committing guard is
  mutation-proven.
tags: [fix, branches, m4, crash-recovery, gc, write-ahead, lesson-10427]
---

# v1.49.952 — close the M4 commit-lock crash-recovery boundary (write-ahead + gc reaping)

**Shipped:** 2026-06-02

One-line: `commit()` durably records commit-intent (`committing: true`) right before the trunk rename, so `gc()` can SOUNDLY reap crash-orphan commit-lock markers (those still `committing: false`) without ever reaping a won round — closing the last residual M4 liveness gap from v1.49.948.

## Why this ship

Item 2 of the operator-directed "1 2 3 and 4" batch. v1.49.948 made the per-round commit-lock a PERMANENT winner record (`commit()` leaves it in place on success so a lagging sibling always loses the atomic `ax` race). The v948 retrospective named the residual: a hard kill between acquiring the marker and finishing the commit leaves an orphan marker, and `gc()` skipped all dotfiles, so the round stayed wedged until removed by hand.

## What the review found (why a gc-only reaper is unsound)

The naive fix — `gc()` reaps markers by age — is **unsound**, because `commit()`'s winner path advances the trunk (`fs.rename(trunkTmp, trunkPath)`) BEFORE it flips the manifest to `committed`. A gc-side reaper that infers "round un-won" from the winner branch being `open`, or from the trunk still hashing to the round's `parentHash`, has holes that a 3-lens adversarial review made concrete:

- a crash in the trunk-rename-before-manifest window leaves the branch `open` but the trunk already applied;
- the trunk-hash check is monotonicity-blind — a later round that restores the parent body makes it wrongly true;
- the stored `trunkPath` is unresolved while the roundKey is resolved (a cwd mismatch could read the wrong file).

Each reaps a WON round's marker -> reopens the v948 double-win. The root cause is structural: a pure gc-side reaper cannot reliably distinguish won from un-won, because the only durable success signal (the committed manifest) is written AFTER the trunk is applied.

## What shipped (the sound fix)

- **Write-ahead in `commit()`.** The `LockEntry` gains a `committing` flag. It is written `false` at lock acquisition and flipped to `true` by an explicit marker overwrite immediately BEFORE `fs.rename(trunkTmp, trunkPath)`. It is never written back to `false`. This is the durable, immutable-once-`true` signal of "the trunk write was reached."
- **`gc()` reaps SOUNDLY.** A marker is reaped iff (age > `commitLockMaxAgeMs`, default **1 hour**) AND it explicitly records `committing: false`. That PROVES the crash preceded the trunk write (the round was never won), so reaping merely un-wedges the round. `committing: true` (trunk may be advanced), a legacy marker with no field (pre-v1.49.952, conservatively kept), a young marker, or a corrupt/unreadable marker are all KEPT/SKIPPED.
- **No trunk read, no winner-state read.** Because the reaper consults only the marker's durable intent flag, it is robust to a crash ANYWHERE in the commit timeline (including the trunk-rename window) AND to a later round restoring the parent body — closing both review blockers AND the gone-winner liveness residual (a gone winner's `committing: false` orphan is now reapable; its `committing: true` permanent record is kept).
- **v1.49.948 fully preserved.** The write-ahead is additive: the atomic `ax` winner selection and the never-unlink-on-success behavior are unchanged. Winner selection does not depend on `committing`.
- **`commitLockMaxAgeMs` option** (default 1h; `Infinity` disables reaping) and three new `GcReport` fields — `reapedLocks` / `keptLocks` / `skippedLocks`.
- **gc()'s first-ever tests (18)** — branch reaping (terminal/open age boundaries, unreadable skip, dry-run, missing dir) + lock reaping, including the `committing: true` SAFETY case (the double-win guard, **mutation-proven**). Plus one `commit.test.ts` test asserting a successful commit leaves the marker `committing: true` (the write-ahead is observable).

## Residual (safe; tiny)

A crash in the sub-instruction window between the `committing: true` write and the `fs.rename` leaves `committing: true` with the trunk un-advanced, so that ONE round stays wedged (kept, never reaped — removable by hand). This trades a hair of liveness for guaranteed safety.

## Verification

- `npx tsc --noEmit` clean (no import cycle from `gc.js` -> `commit.js`).
- Full `src/branches/` suite 85/85 — incl. the v948 CF-M4-02 concurrent-commit (double-win) tests, unchanged and green.
- Mutation-proven: dropping the `committing !== false` guard reaps a `committing: true` marker and fails the SAFETY test.
- Review trail: 3-lens adversarial Workflow (found the gc-only blockers) -> operator chose the write-ahead -> focused final safety review of the write-ahead design.

## Engine state

NASA 1.178 (unchanged), counter-cadence **24** (unchanged — forward `fix`, not a counter-cadence ship), manifest **151** (unchanged — applies #10427; promotes no lesson). No `cadence_advances` tag: a crash-recovery fix advances none of the four measured meta-cadence axes.
