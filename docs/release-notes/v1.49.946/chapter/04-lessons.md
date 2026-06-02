# v1.49.946 — Lessons

No new manifest lesson is promoted this ship (manifest stays **151**). This is a config-honoring consume wire that **applies** existing lessons and carries forward one observation for a future calibrate ship.

## Applied (existing lessons)

- **#10428 — meta-cadence consume axis.** v944 was the consume ship that gave the `observation.retention_days` substrate its first production caller; this ship completes the surface by honoring the second config dimension (`max_entries`) through the same wire. It is the "natural second consume ship for this surface" the v944 retrospective named.
- **#10422 / #10423 — lightest wire that flips the classification.** The prune already half-applied a count cap (the hardcoded default 100). Honoring `observation.max_entries` is a one-field extension of the proven v944 wire — no new substrate, event, or branch — rather than a parallel mechanism.
- **#10427 — failure-mode contracts.** The hook's config-load is an accessory surface: a malformed `.planning/skill-creator.json` sets BOTH `retention_days` and `max_entries` to `undefined` and falls back to the legacy prune, so a bad config never breaks session observation. The two fields are loaded together in one try/catch, so there is no partial-failure window (one set, one undefined).
- **#10409 — recon precedes code.** Reading the substrate, `RetentionManager`, and `DEFAULT_RETENTION_CONFIG` before writing surfaced that the v944 "age-only" claim was inaccurate (the substrate applied a dormant count cap of 100), which set the ship's accurate framing.
- **#10453 — order-independent multi-event assertions.** The v894 integration test for this substrate asserted `toEqual([-1, -1, 1])` on fire-and-forget auto-emits whose JSONL appends race — the exact anti-pattern #10453 names. Fixed here (count-by-polarity + net, not sequence) since it is the integration test for the substrate this ship modifies; it had flaked under the gate's I/O load.
- **#10427 — load-bearing surfaces fail loudly (gate honesty).** The vitest gate step was bypassed for this ship, but the bypass is documented loudly (README "Gate note") with the standalone-green evidence and the operator authorization, rather than silently re-running until green — a gate bypass that hides its reason is the silent-failure anti-pattern.

## Carried-forward candidate (observed, not promoted)

- **A config-honoring wire should split its calibration attribution per config dimension.** The substrate's `too_aggressive` auto-emit now reports a `droppedCount` mixing age drops and count-cap drops, both attributed to `retention_days`. This is acceptable today (count drops are rare and the conservative default fires every sweep regardless), but if `observation.max_entries` is ever promoted to a calibratable threshold, the count-drop signal must be separated from the age-drop signal so the two thresholds calibrate independently. **One instance.** A calibrate-axis refinement, not a consume concern.

## Follow-up filed (real bug, separate ship)

- **M4 branches first-commit-wins double-win under concurrency.** `src/branches/commit.ts` `commit()` selects the winner via an atomic `fs.open(lockPath, 'ax')` (correct), but the winner **unlinks the lock** while committing (line 217), reopening the selection window so a late racer still in its `'ax'` attempt creates a fresh lock and also wins. The N=5 concurrent-commit test then sees 2 winners. Pre-existing since Phase 645; passes on CI and standalone (0/20); manifests only under local high-parallelism full-suite I/O contention (which is why it surfaced during this ship's gate). The correct fix is a careful concurrency change (the winner must not release the lock while concurrent racers may still be racing, OR winner-selection must key off a permanent state, not a releasable lock) — filed as a dedicated fix ship, not folded here. This is the #10415 deferred-maintenance trigger: a flake blocking the gate, closed in its own next ship.

## Process note

- **A config-honoring wire still runs the full ship discipline.** Recon-first (#10409, which corrected the v944 record), lightest-wire (#10422), a `feat` code commit then a separate `chore(release)`, five chapters, STORY two-step, bump, full 18-step pre-tag-gate, tag, dual-push with `ls-remote` verification, RH refresh/publish, STATE with `--predecessor-counter-cadence` not asserted (v1.49.945 was NOT counter-cadence), CI verified per-job on macOS + cargo + Security-Audit for both commits.
