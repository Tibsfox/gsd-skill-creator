# v1.49.952 — Lessons

No new manifest lesson is promoted this ship (manifest stays **151**). This `fix` applies one existing lesson and records one carried-forward candidate.

## Applied (existing lessons)

- **#10427 — failure-mode contracts (load-bearing safety fails safe).** Reaping a commit-lock marker is a load-bearing safety decision: a wrong reap reopens the v1.49.948 double-win. The fix makes the reap condition SOUND rather than heuristic — it reaps only on a durable `committing: false` written by `commit()` BEFORE the trunk rename, which proves the round was never won. Every ambiguous case (committing:true, legacy marker, young, corrupt) fails toward KEEP. The mutation-proven SAFETY test pins the contract.

## Carried-forward candidate (observed, not promoted)

- **A GC-side reaper of a "transient-lock OR permanent-record" file cannot be sound without a producer-side write-ahead, because the durable success signal is recorded AFTER the side effect.** When a file is both a transient lock (released on the normal path) AND a permanent record (retained on success), and the success-producing side effect (here: the trunk rename) precedes the durable success record (here: the committed manifest), NO consumer-side heuristic — owner lifecycle state, current content hash — can reliably classify won/un-won: the owner can be mid-transition and the content can be reverted. The sound fix is a producer-side write-ahead: record commit-INTENT durably BEFORE the side effect, and have the reaper read only that flag. **One instance** (commit-lock + trunk rename). Promote if a second "permanent-record-or-orphan" reaper needs a producer write-ahead for the same structural reason (sibling of #10427 and of the v1.49.948 "permanent winner record, not a releasable mutex" decision — this ship reaps that record's orphans by adding the intent flag the original design lacked).

## Process notes

- **When two independent review rounds converge on the same structural conclusion, follow the diagnosis, not a patch.** Both the 3-lens review (gc-only) and the re-review of the content-hash variant concluded a pure gc-side reaper is structurally unsound. That convergence — not any single finding — is what justified expanding scope to a `commit()` write-ahead. Patching the symptom (add one more consumer-side check) would have produced an ever-narrower hole.

- **Surface a scope expansion into a sensitive primitive; don't make the call unilaterally.** Closing the boundary safely required touching the just-fixed v1.49.948 `commit()`. The fork (write-ahead vs defer item 2) was put to the operator rather than assumed. The write-ahead was then done ADDITIVELY — winner selection and never-unlink-on-success untouched — so the double-win fix is provably preserved.

- **Test the function you touch, not just the line you add.** `gc()` had ZERO tests; this ship added the long-missing branch-reaping coverage alongside the new reaper (#10438 instinct applied to a `fix`). A `commit.test.ts` test pins the write-ahead's observable output (`committing: true` after a successful commit).
