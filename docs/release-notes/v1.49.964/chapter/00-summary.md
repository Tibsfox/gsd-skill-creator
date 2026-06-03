# v1.49.964 — Summary

## The ship

Closes the last documented cosmetic residual in the M4 first-commit-wins
crash-recovery arc. A SIGKILL after `commit()` stages the trunk-body temp but
before the `committing: true` flip leaked an orphan `<trunk>.tmp.<uuid>`.
`commit()` now records `trunkTmp` in the acquisition marker (alongside
`committing: false`), so `gc()` unlinks the orphan when it reaps that round.
No wedge, no data loss; `recover()` is unchanged.

## What shipped

- `commit()` generates `trunkTmp` once before the lock race and records it in
  the acquisition marker; the winner path stages to and renames from that exact
  path; the write-ahead flip re-affirms it with `bodyHash`.
- `gc().reapCommitLock` unlinks `parsed.trunkTmp` best-effort when it reaps an
  old `committing: false` marker — sound because that reap proves the rename
  never ran, so the tmp is always an orphan; the unlink is structurally gated
  after the `committing !== false` early-return.
- `recover()` is unchanged (it acts only on `committing: true` markers).

## Verification

- 108 branches tests green (6 new `gc()` cases incl. won/in-flight SAFETY pins
  where the tmp must survive); `gc()` unlink mutation-proven; tsc build clean.
- Two-lens adversarial review (additive-probe-only) over won / in-flight /
  concurrent-different-round / happy-path / crash-replay scenarios.

## Engine state

- NASA degree 1.178 (frozen). Counter-cadence 29 (unchanged — normal forward
  fix). Manifest 151 lessons (unchanged). No cadence_advances.
