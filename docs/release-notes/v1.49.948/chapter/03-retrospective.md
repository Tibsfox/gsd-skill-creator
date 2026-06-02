# v1.49.948 — Retrospective

## What went right

- **The fix has zero timing dependence — the right shape for killing a flake.** Two candidate designs solved the double-win: a transient mutex with a durable winner marker plus spin-retry, or a permanent per-round lock. The permanent-lock design was chosen precisely because a spin-retry could itself flake under pathological load — and the whole point of the ship was to eliminate a flake, not trade it for a subtler one. The winning `ax` open simultaneously selects the winner and durably records the win; one atomic op does both jobs. No backoff, no retry budget, no timing window.

- **The race became deterministically reproducible once it was understood.** The N=5 concurrent test caught the double-win only probabilistically. Reasoning about the actual mechanism (winner unlinks -> a later `ax` succeeds) revealed the bug reproduces *sequentially*: commit b1 to completion, then commit sibling b2. The old code double-wins every time in that order. `CF-M4-02b` encodes exactly that — a deterministic test for what had been a heisenbug. This is the carried-forward candidate: a probabilistic race often has a deterministic sequential witness once you name the release/acquire ordering that triggers it.

- **The fix was strictly better than the old design on two axes, not one.** Beyond the double-win, the single global lock also *spuriously blocked unrelated concurrent commits* (a commit to trunk B could be aborted because a commit to trunk A held the one global lock). Per-round keying removes that too — pinned by the "unrelated rounds do not block each other" test. The review's liveness lens confirmed this is a behavior improvement, not a regression.

- **The adversarial review found 0 blockers and its strongest finding was a non-bug.** The race lens's headline candidate — "a second winner can appear after the error-path release" — was verified as *correct* per first-commit-wins: when the first winner errors before marking its manifest, the second writer genuinely wins and only one manifest is ever `committed`. The review confirming the core invariant holds under every interleaving it could construct is the evidence that mattered.

## What went well in process

- **Recon mapped the lock's dual role before touching concurrency code (#10415 careful change).** Reading `commit.ts`, the sole production caller (`ab-harness/coordinator.ts`, one commit per experiment), `gc.ts` (skips dotfiles -> markers inert), and `manifest.parentHash` (the generation discriminator) BEFORE designing the fix is what made the per-round key obviously correct rather than a guess. The handoff explicitly warned "do not rush it into an unrelated ship."

- **Every applied review finding shipped with a test.** Atomic trunk write, 0-delta idempotency, and winner-error-path recovery each got a dedicated test; the error-path test is mutation-proven. The review's test-adequacy lens drove coverage of the exact paths a future refactor could silently regress.

## What went wrong (and the recovery)

- **A `git checkout -- commit.ts` during mutation-testing reverted all uncommitted edits.** Mid-session, restoring a mutation via `git checkout` (instead of a `/tmp` backup) blew away the entire in-progress fix because it was never committed. Caught immediately (the test file referenced now-missing exports), the full file was reconstructed via `Write` from context and re-validated end-to-end, including re-running the primary mutation proof on the reconstructed file. Lesson reinforced: during mutation testing, snapshot to `/tmp` and restore from `/tmp` — never `git checkout` a file whose intended state is uncommitted working-tree edits.

## What to watch

- **Per-round markers accumulate (one per committed generation) and `gc()` does not reap them.** Negligible in practice (tiny files, the sole caller commits rarely, gitignored runtime dir), and they double as a durable winner audit record. If a high-volume A/B workload ever lands, add age-based marker reaping to `gc()` keyed on the `acquiredAt` field (recorded for exactly that).

- **Crash recovery is manual.** A hard process kill between lock-acquire and commit-complete leaves a permanent marker that wedges that one round until removed by hand. This is strictly narrower than the pre-v948 global lock (which wedged every trunk) but is the residual liveness boundary; the `gc()` reaping above would close it.

- **Round-key correctness assumes a consistent `trunkPath` spelling across racing siblings.** `resolve()` normalizes relative-to-cwd, and the sole caller passes one consistent path, so this is not a live risk — but a future caller passing two spellings of the same file would split siblings onto different locks. Documented in the module's round-key boundary note.
