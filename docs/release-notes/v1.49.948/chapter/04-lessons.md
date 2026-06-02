# v1.49.948 — Lessons

No new manifest lesson is promoted this ship (manifest stays **151**). This `fix` ship **applies** existing lessons and records one carried-forward candidate.

## Applied (existing lessons)

- **#10415 — deferred-maintenance escalation.** The M4 double-win was filed as an escalated follow-up that was actively forcing a `vitest` pre-tag-gate bypass across v1.49.946 and v1.49.947. The lesson's exact trigger — "an open red/bypassed gate is the alarm; close the escalated wedge within 1-2 milestones" — is satisfied: the bug is closed two milestones after it surfaced, and the gate runs un-bypassed again.
- **#10427 — failure-mode contracts (load-bearing vs accessory).** The commit lock is load-bearing correctness: a security/correctness primitive must fail LOUDLY and be hoisted out of swallow paths. The fix keeps the winner-selection `ax` open as the sole authority, releases the lock only on the explicit error path (never silently), and the trunk write was made atomic so a crash cannot leave a silently-corrupt half-written trunk. The diagnostic-only surfaces (loser reading a mid-write lock) correctly fall back to "unknown" — accessory, swallowed at the boundary.
- **#10409 — recon precedes code.** Per-file recon (commit.ts, the sole caller, gc.ts, manifest.parentHash) established that `parentHash` is the generation discriminator and that the lock's dual role was the defect, before any concurrency code was written. The careful-concurrency-change discipline (#10415's sibling) demanded it.

## Carried-forward candidate (observed, not promoted)

- **A probabilistic race usually has a deterministic sequential witness.** The double-win presented as a heisenbug (flaked only under high-parallelism contention). But the triggering mechanism — winner RELEASES a selection lock, then a later acquirer succeeds — reproduces deterministically when the two operations are ordered sequentially (commit b1 to completion, then commit b2). The regression test (`CF-M4-02b`) is therefore sequential and mutation-proven, not a flaky N-way race. **One instance.** Promote if a second probabilistic-race fix lands a deterministic sequential regression test by naming the release/acquire (or write/read) ordering that triggers it — a sibling of the audit-method conventions for deterministic test design.

## Process note

- **Mutation testing must snapshot to `/tmp`, never `git checkout` a file with uncommitted edits.** Restoring a mutation via `git checkout -- <file>` reverts to HEAD, which for an in-progress (uncommitted) fix discards the entire change. This ship hit it once and recovered by reconstructing the file from context and re-validating; the durable rule is `cp <file> /tmp/bak` before injecting a mutation and `cp /tmp/bak <file>` to restore. (The `git checkout` restore is only safe when the intended state is exactly HEAD.)
- **A careful concurrency change still runs the full ship discipline.** Recon-first, a 4-lens adversarial-review Workflow (0 blockers; every applied finding shipped with a test), two primary mutation-proofs plus an error-path proof, a `fix` code commit then a separate `chore(release)`, five chapters, STORY, bump, the full 18-step pre-tag-gate **with `vitest` un-bypassed** (the point of the ship), tag, dual-push with `ls-remote` verification, RH refresh/publish, STATE with `--predecessor v1.49.947 --predecessor-counter-cadence` (v947 WAS #24; this `fix` is NOT counter-cadence), CI verified per-job on macOS + cargo + Security-Audit.
