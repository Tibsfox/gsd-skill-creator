# v1.49.948 — Summary

## The ship

Close the highest-value open follow-up from the post-v1.49.944 handoff: a real, pre-existing M4 branch-commit concurrency bug (Phase 645) that flaked the `CF-M4-02` N=5 test under the pre-tag-gate's high-parallelism contention and had been forcing a `vitest` gate bypass since v1.49.946. Per **#10415** (close an escalated wedge within 1-2 milestones), it gets its own careful `fix` ship.

## The bug

`src/branches/commit.ts` selected the first-commit-wins winner with a single RELEASABLE global lock `.commit-lock` (`fs.open(path, 'ax')`). The winner did slow I/O then **unlinked the lock on success** — reopening the `ax` selection window so a lagging racer's later `ax` open could succeed and DOUBLE-WIN (overwrite the trunk, mark itself committed). The lock was both a transient global mutex AND the winner record — two incompatible jobs.

## The fix

A **permanent per-round winner lock** keyed on `sha256(resolve(trunkPath) + NUL + parentHash)`:

- All siblings in one race share the key -> exactly one `ax` open ever succeeds, and the winner **never unlinks on success** -> a lagging racer always sees EEXIST and loses. Double-win window closed with **zero timing dependence**.
- A future round (forked from the updated trunk -> different parentHash) gets a different key and still commits. Unrelated trunks get distinct keys, so spurious cross-trunk blocking is also removed.
- The winner **does** release on its ERROR path, so a failed commit does not wedge the round.

## Deterministic regression

Once stated, the bug is deterministically reproducible: commit b1, then commit sibling b2 (same parent + trunk). The old code released the lock on b1's success, so b2's `ax` open then succeeded and b2 double-won. The new `CF-M4-02b` test asserts b2 is `blocked` — sequential, no probabilistic race. Mutation-proven (restore the unlink -> b2 commits).

## Review-driven hardening (4 lenses, 0 blockers)

- Atomic trunk write (write-then-rename, like `writeManifest`) — no partial trunk on a crash mid-write.
- 0-delta idempotency test + fork.ts note (a same-parent re-commit of an unchanged trunk is idempotently blocked).
- Winner error-path recovery test (delete `skill.md` -> reject + release + sibling recovers); mutation-proven.
- Crash-recovery boundary documented (SIGKILL between acquire and complete leaves a marker `gc()` doesn't reap; manual `rm`; strictly narrower than the old global-lock wedge).

## Verification

- tsc clean; `commit.test.ts` 11/11; branches + ab-harness 235/235.
- Two mutation-proofs (success-path unlink -> double-win; drop parentHash -> over-block a future round) + the error-path recovery proof.
- **The `vitest` pre-tag-gate step runs un-bypassed again** (the race is now deterministically impossible). See README + 99-context for the exact gate verdict.

## Engine state

NASA 1.178 (unchanged), counter-cadence **24** (unchanged — a `fix`), manifest **151** (unchanged — applies #10415 / #10427; promotes no lesson).
