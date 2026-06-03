# v1.49.964 — Lessons

No new manifest lesson is promoted. This ship applies existing lessons; the
manifest stays at 151.

## Applied (existing lessons)

- **#10427 (failure-mode contracts: silent-vs-loud).** The orphan-tmp unlink is
  an ACCESSORY surface, not a load-bearing decision: the round is correctly
  un-wedged by the marker reap regardless of whether the stray tmp is cleaned.
  So the unlink is best-effort and swallows its error (`.catch(() => {})`) — a
  missing tmp (crash before staging, or already consumed by the rename) is a
  no-op. No `GcReport` field was added; the observable signal stays `reapedLocks`
  (the marker reap), and the tmp cleanup rides it silently per the contract.
- **Two-layer crash-recovery soundness (v952 write-ahead + v960 intent journal).**
  This closes the third documented residual in that arc by extending the SAME
  durable signal (`committing: false`) the reaper already trusts — the unlink is
  sound for exactly the reason the reap is, so it needs no new proof obligation.

## Process notes

- **Pin the safety direction, not just the happy path.** The high-risk failure
  here is over-cleaning (unlinking a won or in-flight round's tmp), so the
  load-bearing tests are the keep-the-tmp cases for `committing: true` and young
  markers — the reap-and-unlink case alone would not catch a regression that
  moved the unlink before the `committing !== false` gate.
- **Hoist a value to where it must be recorded, don't recompute it.** The fix
  was enabled by generating `trunkTmp` once before the lock race and reusing the
  exact value in the winner path, rather than recording a second, different UUID
  — keeping the acquisition marker, the staged file, the flip, and the rename
  all referring to one path.
