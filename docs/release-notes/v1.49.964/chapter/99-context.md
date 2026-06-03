---
title: "Context"
chapter: 99-context
version: v1.49.964
date: 2026-06-03
summary: "Where v1.49.964 sits in the larger arc."
tags: [context, branches, m4, crash-recovery]
---

# v1.49.964 — Context

## Milestone metadata

- **Version:** v1.49.964
- **Type:** `fix(branches)` — M4 orphan trunk-tmp cleanup on commit-lock reap
- **Predecessor:** v1.49.963 (verify-detector paren-param + nested-self-call bounds)
- **NASA degree:** 1.178 (frozen hold)
- **Counter-cadence count:** 29 (unchanged — normal forward fix)

## Where this sits

This completes the M4 first-commit-wins crash-recovery arc: v1.49.952
(write-ahead `committing` flag making gc() crash-orphan reaping sound) ->
v1.49.960 (intent journal + `recover()` replay for the flip->rename window) ->
v1.49.964 (orphan trunk-tmp cleanup for the stage->flip window). Only the
torn-marker residual (2) remains, which is irreducible without an atomic marker
rewrite and is hand-removable.

It is the second of the two carried non-blocking residuals taken up after
v1.49.962; the sibling — the verify-detector paren-param + nested-self-call
bounds — shipped as v1.49.963.

## Files changed

- `src/branches/commit.ts` — generate `trunkTmp` before the lock race; record it
  in the acquisition `LockEntry`; reuse it in the winner path; error-path unlink
  simplified; `LockEntry` JSDoc + module crash-recovery docstring updated.
- `src/branches/gc.ts` — `reapCommitLock` reads `parsed.trunkTmp` and unlinks it
  best-effort inside the `committing: false` reap branch; docstring updated.
- `src/branches/__tests__/gc.test.ts` — `makeLock` extended with `trunkTmp`; a
  `stageTmp` helper; 6 orphan-tmp cleanup cases incl. the SAFETY keep-the-tmp
  pins.
- `recover.ts` unchanged (acts only on `committing: true`).

## Engine state at close

- NASA degree 1.178 (frozen).
- Counter-cadence 29 (unchanged).
- Manifest 151 lessons (unchanged).
- No cadence_advances.
