# v1.49.960 — Summary

## The ship

v1.49.960 closes the M4 commit() crash-recovery residual documented since
v1.49.952: a hard process kill in the window between the marker's
`committing: true` flip and the trunk `fs.rename` left a permanently wedged round
(`committing: true` + un-advanced trunk; `gc()` keeps it to avoid reopening the
v1.49.948 double-win). The per-round marker is now an intent journal, and a new
`recover()` pass forward-completes the crashed commit idempotently.

## What shipped

- `commit.ts`: the `committing: true` write-ahead records `trunkTmp` + `bodyHash`
  (LockEntry gains two optional fields); the rename and never-unlink-on-success
  behaviour are unchanged.
- `recover.ts` (new): idempotent replay of `committing: true` wedges — redo the
  rename (guarded by `bodyHash` + a parent-generation stale-clobber check) or
  reconcile the manifest; never mutate a `committing: true` marker; never
  resurrect an aborted winner; best-effort per #10427.
- `index.ts`: export `recover()` + `RecoverOptions` / `RecoverReport`.
- `ab-harness/coordinator.ts`: best-effort `recover()` before each commit round.
- Doc updates: the two remaining minor cosmetic residuals (a window-(b) orphan
  trunk-tmp leak and the torn-marker sub-cases) named in `commit.ts`.

## Verification

- `npm run build` clean; branches + ab-harness suites green (272 tests across the
  two directories).
- All guards mutation-proven: bodyHash safety, committing-true gate, aborted
  gate, parent-generation stale-clobber guard, never-rollback double-win
  invariant, and the coordinator recover() wire.
- 4-lens adversarial review: 0 blockers; one MAJOR (aborted-resurrect path) fixed
  in code before commit.

## Engine state

- NASA degree 1.178 (frozen hold). Counter-cadence 27 (unchanged — normal feat).
  Manifest 151 (unchanged). No `cadence_advances` marker.
