---
title: "v1.49.948 — fix M4 branches first-commit-wins double-win (permanent per-round commit lock)"
version: v1.49.948
date: 2026-06-02
summary: >
  Close the pre-existing M4 branch-commit concurrency bug that had been forcing a
  vitest pre-tag-gate bypass since v1.49.946. src/branches/commit.ts selected the
  first-commit-wins winner with a single RELEASABLE global lock (.commit-lock): the
  winner unlinked it after its slow trunk write, reopening the atomic 'ax' selection
  window so a lagging racer could acquire the lock and DOUBLE-WIN. The fix replaces it
  with a PERMANENT per-round winner lock keyed on sha256(resolve(trunkPath) + NUL +
  parentHash): all sibling branches in one race share the key, a future round (forked
  from the updated trunk -> different parentHash) does not, and the winner never
  unlinks on success -> a lagging racer always sees EEXIST and loses. The double-win
  window is closed with ZERO timing dependence (no spin/backoff). The bug became
  deterministically reproducible once stated, so the regression test is sequential,
  not a probabilistic race. The vitest pre-tag-gate step runs un-bypassed again.
tags: [fix, branches, m4, concurrency, lesson-10415]
---

# v1.49.948 — fix M4 branches first-commit-wins double-win (permanent per-round commit lock)

**Shipped:** 2026-06-02

One-line: the M4 commit double-win — a winner that released the selection lock mid-race, letting a lagging racer become a second winner — is closed by making the lock a permanent per-round winner record instead of a releasable global mutex; the fix has zero timing dependence and un-bypasses the vitest pre-tag-gate step.

## Why this ship

The post-v1.49.944 handoff named this as the highest-value open follow-up: a **real, pre-existing production bug** (Phase 645) in `src/branches/commit.ts`. It flaked the `CF-M4-02` N=5 concurrent test only under the pre-tag-gate's local high-parallelism build->full-suite I/O contention, so the `vitest` gate step was operator-authorized-bypassed for v1.49.946 and v1.49.947. Per **#10415** (close an escalated wedge within 1-2 milestones; an open red/bypassed gate is the alarm), it gets its own careful ship now.

## The bug

`commit()` selects the first-commit-wins winner by atomically creating a single global lock file `.planning/branches/.commit-lock` via `fs.open(path, 'ax')` (O_CREAT | O_EXCL — exactly one racer creates it). The winner then did slow I/O (read branch body, mkdir, write trunk, write manifest) and **unlinked the lock on success**. That unlink reopens the `ax` selection window: a lagging racer whose `fs.open('ax')` had not yet run now finds the file gone, its open succeeds, and it becomes a **second winner** — it overwrites the trunk and marks its own manifest `committed`. The N=5 test caught this only probabilistically, when a racer's open happened to fall after the winner's unlink.

The lock was doing two incompatible jobs: a *transient global mutex* (released so future rounds and unrelated trunks can commit) AND the *winner record* (which must persist for the whole race).

## The fix

Split those jobs by making the lock a **permanent per-round winner record**:

- Lock path = `join(branchesDir, COMMIT_LOCK_PREFIX + commitRoundKey(trunkPath, parentHash))`, where `commitRoundKey = sha256(resolve(trunkPath) + NUL_byte + parentHash)`.
- All sibling branches racing to commit the same trunk from the same parent generation share the key -> exactly one `ax` open ever succeeds, and the winner **never unlinks on success** -> a lagging racer always observes EEXIST and loses. The double-win window is gone, with **zero timing dependence** (no spin or backoff).
- A future round forks from the now-updated trunk -> different `parentHash` -> different key -> can still commit ("future rounds proceed" preserved). Two unrelated trunks/parents also get distinct keys, so the fix additionally removes the old design's *spurious cross-trunk blocking* (the single global lock could abort an unrelated concurrent commit).
- The winner **does** release the lock on its ERROR path, so a commit that fails after acquiring the lock does not wedge the round.

`COMMIT_LOCK_FILENAME` ('.commit-lock') is retained as a stable export. `gc()` already skips dotfiles, so per-round markers are inert to GC.

## Review-driven hardening (4-lens adversarial review: 0 blockers/majors)

The review confirmed the core fix has no double-win interleaving (the "second winner after an error-path release" it surfaced is *correct* per first-commit-wins: only one manifest is ever `committed`). Four minor findings were applied:

- **Atomic trunk write** — the trunk is now written write-then-rename (matching `writeManifest`), so a process crash mid-write cannot leave a partially-written trunk.
- **0-delta idempotency test + a fork.ts note** — a degenerate 0-delta commit leaves the trunk unchanged, so a same-parent re-commit collides on roundKey and is idempotently blocked (documented, now pinned by a test).
- **Winner error-path recovery test** — deleting a winner's `skill.md` makes its commit reject, release the lock, and a sibling then recovers; mutation-proven.
- **Crash-recovery boundary documented** — a SIGKILL'd process between lock-acquire and commit-complete leaves a permanent marker `gc()` does not reap; recovery is a manual `rm`. This is strictly narrower than the pre-v948 global lock, whose orphan wedged every trunk. Age-based marker reaping in `gc()` is noted as a future option.

## Verification

- `npx tsc --noEmit` clean.
- `src/branches/__tests__/commit.test.ts` 11/11 (5 original kept + 6 new/rewritten); branches + ab-harness scope **235/235**.
- **Two mutation-proofs:** (1) restoring the success-path unlink makes the sequential `CF-M4-02b` test double-win (`committed` instead of `blocked`); (2) dropping `parentHash` from the round key blocks a legitimate future round. The error-path recovery test is also mutation-proven (removing the error-path unlink wedges the round).
- The sole production caller (`src/ab-harness/coordinator.ts`, one commit per A/B experiment) is unaffected.
- **Pre-tag-gate: the `vitest` step is no longer bypassed** — the full suite passes under the gate's high-parallelism contention now that the race is deterministically impossible. (See chapters for the exact gate verdict.)

## Engine state

NASA degree **1.178** (unchanged — degree-non-advancing). **Counter-cadence #24** (unchanged — this is a `fix`, like v945/v946 were a fix and a feat that did not increment the count). Manifest **151** (unchanged — applies #10415 / #10427; the deterministic-race-reproduction technique is recorded as a carried-forward candidate, not promoted on one instance).
