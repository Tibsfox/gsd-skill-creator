# v1.49.960 — Retrospective

## What went right

- **The smallest-correct design held.** Rather than a generic write-ahead log, the
  closure reuses the EXISTING per-round marker as the intent journal (two optional
  fields) plus one idempotent `recover()` pass. No new file format, no daemon, no
  two-phase commit.
- **Forward-complete, never roll back.** A `committing: true` marker means the
  winner is already selected; recover() only ever COMPLETES it (redo the rename),
  never unlinks or rewrites it. That is what keeps the v1.49.948 exactly-one-winner
  invariant intact — a late same-round sibling still loses the `ax` race after
  recovery.
- **Defense-in-depth on the one dangerous operation.** The redo rename is guarded
  three ways: the body must hash to the recorded `bodyHash` (no corrupt body
  reaches the trunk), the trunk must still be at the recorded parent generation
  (no stale clobber of a newer round), and an aborted winner is skipped entirely
  (no rejected variant resurrected).

## What went well in process

- **The review found a real MAJOR before the trunk could be corrupted.** The
  aborted-winner path had no killing test AND the redo rename ran before the
  manifest check — so a `committing: true` marker pointing at an aborted branch
  could have advanced the trunk with a rejected body. Fixed by reading the winner
  manifest once, up front, and skipping the whole recovery for an aborted winner
  (gating the rename, not just the manifest write).
- **Two review NITs were promoted to code, not banked.** The double-win test now
  asserts the marker is byte-stable (`committing: true`) after recovery (catches a
  future soft-rollback refactor), and the emergent cross-round stale-clobber
  unreachability became an explicit local `parentHash` guard.

## What to watch

- **Two cosmetic residuals remain, both documented and pre-existing.** (1) A crash
  after staging the trunk tmp but before the `committing: true` flip leaves a
  `committing: false` marker (gc reaps it) plus an orphan `<trunk>.tmp.<uuid>` that
  nothing auto-cleans — a bounded-per-crash disk leak. (2) The flip is a non-atomic
  overwrite, so a torn write is either skipped (truncated) or degrades into the
  orphan-tmp case (un-flushed). Neither is a wedge or data loss.
- **Heal path is the next commit round.** A wedge on a branchesDir whose experiment
  family is abandoned never heals automatically (gc is the periodic net for
  `committing: false` only). This is the safe residual; recover() is hand-runnable.
- **Proportionality.** No real crash in this window has ever been observed; the
  closure is preemptive robustness for a known-narrow window.
