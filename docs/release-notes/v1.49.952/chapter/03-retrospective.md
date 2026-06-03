# v1.49.952 — Retrospective

## What went right

- **Adversarial review caught a self-inflicted re-creation of the bug being cleaned up.** The first implementation was the obvious one — reap orphan markers by age, guarded by the winner branch being `open`. A 3-lens review proved that guard insufficient: `commit()` advances the trunk BEFORE flipping the manifest to `committed`, so a crash in that window is `open` with the trunk already applied. A second design (also check the trunk hashes to `parentHash`) survived one round but the re-review found it monotonicity-blind (a later round restoring the parent body) and cwd-fragile (unresolved `trunkPath`). Each version reaped a WON round's marker — the exact v1.49.948 double-win, relocated to crash recovery. Without the review, a plausible-but-unsound fix would have shipped into the most safety-critical M4 path.

- **The reviews converged on a structural truth, not a patch.** Two independent review rounds both concluded the same thing: a pure gc-side reaper CANNOT be sound, because the only durable success signal (the committed manifest) is written AFTER the trunk is applied. That converged conclusion — not any single finding — is what justified expanding scope from "gc reaping" to a `commit()` write-ahead. The fix follows the diagnosis.

- **The scope expansion was surfaced, not assumed.** Closing the boundary safely required modifying the just-fixed v1.49.948 `commit()` primitive — a sensitive change. Rather than make that call unilaterally, the finding (and the fork: do the write-ahead vs defer item 2) was put to the operator. The operator chose the write-ahead.

- **The write-ahead is sound by construction, and additive.** `committing` is written `false` at acquire and `true` immediately before the rename, never back to `false`. So `committing === false` is a PROOF the rename was never reached — independent of mutable trunk content, the winner's lifecycle state, and any later round. The reaper reads one immutable-once-`true` flag. And it changed nothing in the v948 hot path: the atomic `ax` winner selection and the never-unlink-on-success retention are untouched, so the double-win fix is fully preserved (the CF-M4-02 concurrent-commit tests pass unchanged).

- **One sound signal replaced two unsound proofs.** The discarded design needed a winner-state read AND a trunk-content hash, and still had holes. The write-ahead needs neither — the reaper reads only the marker. Less code, no filesystem reads beyond the marker, and provably correct. The right place to record "was this won" is at the moment of winning, not reconstructed afterward from side effects.

## What went well in process

- **Each guard is its own mutation target.** The `committing: true` SAFETY test fails the instant the `committing !== false` guard is mutated away. Snapshotting `gc.ts`/`commit.ts` to `/tmp` (never `git checkout` an uncommitted file) kept the mutation cycle clean on the sensitive primitive.

## What to watch

- **The 1-hour default trades a hair of liveness for in-flight safety.** A crashed round stays wedged up to 1 hour before `gc()` reaps it; `commitLockMaxAgeMs: 0` reaps immediately (still sound — the `committing: false` proof does not depend on age for correctness, only the in-flight-protection margin does).

- **The one remaining residual is a sub-instruction window.** A crash between the `committing: true` write and the `fs.rename` leaves `committing: true` with the trunk un-advanced — kept, so that one round wedges (removable by hand). Closing it would require making the two operations atomic (e.g. an intent journal with restart-time replay), which is disproportionate to a window two adjacent statements wide. Safety was chosen over closing it.

- **The non-atomic `committing: true` overwrite is cosmetic-only under a torn read.** A concurrent loser or the reaper reading the marker mid-overwrite gets a corrupt parse -> the loser's diagnostic says "unknown", the reaper conservatively skips (keeps). Neither is a safety issue; both self-heal on the next operation.
