---
title: "v1.49.960 — M4 intent-journal crash recovery for wedged commits"
version: v1.49.960
date: 2026-06-03
summary: >
  Closes the M4 commit() crash-recovery residual the v1.49.952 write-ahead left
  open: a hard kill in the flip->rename window left a committing:true marker with
  the trunk un-advanced — a permanently wedged round. The marker is now an intent
  journal (trunkTmp + bodyHash) that recover() forward-completes idempotently.
tags: [m4, branches, crash-recovery, intent-journal, ab-harness]
---

# v1.49.960 — M4 intent-journal crash recovery for wedged commits

**Shipped:** 2026-06-03

M4's per-round commit marker becomes a replay journal, and a new `recover()` pass
forward-completes a commit that crashed mid-flight — closing the last documented
crash-recovery gap without ever reopening winner selection.

## Why this ship

M4 (Branch-Context experimentation) selects a commit winner via an atomic
per-round lock marker that is never unlinked on success (the v1.49.948 double-win
fix). v1.49.952 added a write-ahead so `gc()` can reap markers from rounds that
crashed *before* the trunk write (`committing: false`), while keeping
`committing: true` markers (the trunk may be advanced). That left one residual: a
hard kill in the sub-instruction window *between* the `committing: true` flip and
the trunk `fs.rename` leaves the marker `committing: true` with the trunk
un-advanced — a round `gc()` correctly keeps but that stays permanently wedged
(no sibling from the same generation can ever win again). This ship was
forward-candidate 3 of the operator's post-v958 "1 2 & 3" batch.

## What shipped

- **Intent journal.** The `committing: true` write-ahead in `commit.ts` now also
  records `trunkTmp` (the staged trunk-body path) and `bodyHash` (its sha256), so
  the rename is idempotently replayable.
- **`recover()`** (`src/branches/recover.ts`, new): scans the per-round markers
  and forward-completes each `committing: true` round — redo `rename(trunkTmp,
  trunkPath)` (guarded by `bodyHash` *and* a parent-generation check), or just
  reconcile the winner manifest when the trunk already holds the body. It NEVER
  unlinks or rewrites a `committing: true` marker (preserves exactly-one-winner),
  reads the winner manifest once and SKIPS an aborted winner entirely (never
  resurrects a rejected variant), and is best-effort (per-marker errors are
  recorded, never thrown).
- **Coordinator wire.** The A/B harness (the only production `commit()` caller)
  calls `recover()` best-effort before each commit round — the realistic heal
  point.

## Verification

- `npm run build` clean; 21 new/updated tests (recover unit + a coordinator wire
  test), branches (98+) + ab-harness (170+) suites green.
- Every guard mutation-proven: the bodyHash safety guard, the committing-true
  gate, the aborted-winner gate, the parent-generation stale-clobber guard, and
  the never-rollback double-win invariant (the marker stays `committing: true`
  after recovery).
- A 4-lens adversarial review (double-win safety, crash-window completeness,
  idempotency/fail-soft/wire, test-coverage/scope) returned zero blockers; its
  one MAJOR — an untested aborted-winner-resurrect path, where the redo rename
  also ran before the manifest check — was fixed in code (an early aborted gate)
  before the feat was committed.

## Engine state

- **NASA degree:** 1.178 (frozen hold; unchanged).
- **Counter-cadence:** 27 (normal forward feat — count unchanged).
- **Manifest lessons:** 151 (applies #10427 / #10437 / #10454; no new lesson).
- **cadence_advances:** none.
