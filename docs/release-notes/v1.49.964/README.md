---
title: "v1.49.964 — M4 orphan trunk-tmp cleanup on commit-lock reap"
version: v1.49.964
date: 2026-06-03
summary: >
  Closes the last documented residual in the M4 branch-commit crash-recovery
  arc: a SIGKILL after staging the trunk tmp but before the commit-intent flip
  leaked an orphan <trunk>.tmp.<uuid>. commit() now records trunkTmp in the
  acquisition marker so gc() unlinks the orphan when it reaps that round.
  Cosmetic (no wedge, no data loss); recover() is unchanged.
tags: [fix, branches, m4, crash-recovery, gc]
---

# v1.49.964 — M4 orphan trunk-tmp cleanup on commit-lock reap

**Shipped:** 2026-06-03

One-line: `gc()` now unlinks the orphan trunk-tmp left by a crash before the
`committing: true` flip, by recording `trunkTmp` in the acquisition marker.

## Why this ship

The M4 first-commit-wins crash-recovery arc — v1.49.952 (write-ahead
`committing` flag) and v1.49.960 (intent journal + `recover()` replay) — left
one documented cosmetic residual. A hard process kill (SIGKILL/OOM) landing
AFTER `commit()` stages the trunk-body temp file but BEFORE the
`committing: true` flip leaves a `committing: false` marker (which `gc()`
correctly reaps, un-wedging the round) plus an orphan `<trunkPath>.tmp.<uuid>`
on disk. Nothing cleaned that stray file because the acquisition marker did not
record `trunkTmp` (it was computed later, inside the winner path). This is the
sibling carried residual to the v1.49.963 detector lift; closing it retires the
last documented residual (1) in `commit.ts`.

## What shipped

- **`commit()` records `trunkTmp` at acquisition.** The staged-tmp path is now
  generated once, before the lock race, and written into the acquisition marker
  alongside `committing: false`. The winner path stages to and renames from that
  exact path (no second UUID); the write-ahead flip re-affirms it with
  `bodyHash` for `recover()`'s replay, unchanged.
- **`gc().reapCommitLock` unlinks the recorded orphan.** When it reaps a marker
  (old AND explicit `committing: false`), it also unlinks `parsed.trunkTmp`
  best-effort. This is sound because the reap fires only on an explicit
  `committing: false` — proof the trunk rename never ran — so the staged tmp is
  always an orphan, never a won or in-flight round's body. The unlink is
  structurally gated after the `committing !== false` early-return.
- **`recover()` is unchanged.** It acts only on `committing: true` markers, so a
  `committing: false` marker carrying `trunkTmp` is skipped exactly as before.

## Verification

- 108 branches tests green (6 new `gc()` cases): reap-and-unlink, plus the
  load-bearing SAFETY pins — a `committing: true` (won) marker's tmp and a young
  `committing: false` (in-flight) marker's tmp both SURVIVE; an already-gone tmp
  is tolerated; dry-run unlinks nothing.
- The `gc()` orphan-tmp unlink is mutation-proven (disabling it reds the
  reap-and-unlink test).
- `npm run build` (tsc) clean.
- Two-lens adversarial review (additive-probe-only) drove `fork`/`commit`/`gc`/
  `recover` over won, in-flight, concurrent-different-round, happy-path, and
  crash-replay scenarios.

## Engine state

- NASA degree: 1.178 (frozen hold; unchanged).
- Counter-cadence count: 29 (unchanged — normal forward fix).
- Manifest lessons: 151 (unchanged — applies #10427; no new lesson promoted).
- cadence_advances: none.
