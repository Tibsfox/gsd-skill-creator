# v1.49.952 — Summary

## The ship

Item 2 of the post-v1.49.950 "1 2 3 and 4" batch: close the residual M4 liveness gap from v1.49.948 — an orphan per-round commit-lock marker left by a hard crash (SIGKILL/OOM mid-commit) wedged its round forever, because `gc()` skipped all dotfiles. The sound fix is a WRITE-AHEAD in `commit()` plus a `gc()` reaper that reads it.

## Why a gc-only reaper is unsound (what the review found)

`commit()`'s winner path advances the trunk (`fs.rename`) BEFORE it records success (`writeManifest('committed')`). A pure gc-side reaper cannot tell a crash-before-apply from a crash-after-apply without consulting mutable trunk content — and a 3-lens adversarial review found two concrete sequences (the trunk-rename-before-manifest window; a later round restoring the parent body) where a gc-only reaper reaps a WON round's marker, reopening the v948 double-win.

## What shipped (the sound fix)

- **Write-ahead in `commit()`.** The `LockEntry` gains `committing`; written `false` at lock acquisition, flipped to `true` immediately BEFORE the trunk rename (never written back to `false`). This is the durable "the trunk write was reached" signal.
- **`gc()` reaps iff** (age > `commitLockMaxAgeMs`, default 1h) AND the marker explicitly records `committing: false` — proof the crash preceded the trunk write (round never won). `committing: true`, legacy (no field), young, and corrupt markers are all kept/skipped.
- **No trunk read, no winner-state read** -> robust to a crash anywhere in the commit timeline AND to a later parent-body restore. Closes both review blockers AND the gone-winner liveness residual.
- **v948 preserved** — additive change; the atomic `ax` winner selection and never-unlink-on-success are untouched.
- **gc()'s first-ever tests (18)** + a `commit.test.ts` write-ahead assertion. The `committing: true` SAFETY case is mutation-proven.

## Residual (safe; tiny)

A crash in the sub-instruction window between the `committing: true` write and the rename leaves `committing: true` with the trunk un-advanced -> that one round stays wedged (kept). Safety over a hair of liveness.

## Verification

- tsc clean; full `src/branches/` 85/85 incl. the v948 concurrent-commit (double-win) tests.
- Mutation-proven: dropping the `committing !== false` guard reaps a `committing: true` marker and fails the SAFETY test.
- Review: 3-lens Workflow (found the gc-only blockers) -> operator chose the write-ahead -> focused final safety review.

## Engine state

NASA 1.178 (unchanged), counter-cadence **24** (unchanged — forward `fix`), manifest **151** (unchanged — applies #10427; promotes none). No `cadence_advances` tag (advances no measured axis).
