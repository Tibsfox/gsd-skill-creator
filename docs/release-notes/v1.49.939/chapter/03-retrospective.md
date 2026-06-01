# v1.49.939 — Retrospective

## What went right

- **The gate drove the flip — exactly the gate-not-vigilance promise.** This ship did not eyeball a green streak and judge "feels ready." The v1.49.938 gate computed READY 3/3 deterministically, and the flip followed mechanically. That is the whole point of #10428/#10463: replace the operator's fallible "is the track record good enough?" with a checkable verdict. Second lane to validate it (after macOS v1.49.928).

- **The drift-guard pairing did its job, and was mutation-proven.** Deleting `continue-on-error` without touching the test would have failed the old STAGED assertion (which asserted the line PRESENT) — forcing the conversation, which is the #10461 design. After inverting to `.not.toMatch`, re-adding the line reds exactly the inverted cargo assertion (the macOS one stays green, confirming independence). The flip and its guard moved in one commit; neither can drift silently from the other.

- **The self-referential staleness was caught and closed.** The macOS v1.49.928 flip taught that a flip-gate tool which keeps saying "Safe to flip: delete continue-on-error" after the line is gone is itself the stale-guidance failure #10427 warns against. The cargo gate was built lifecycle-aware from the start (it reads ci.yml via `detectFlipState`), so its runtime output switched to the REVERT path automatically — only two prose docstring comments ("the future flip commit") needed the past-tense update.

## What to watch

- **A flaky cargo lane now blocks ships.** This is the deliberate cost of load-bearing. The lane apt-installs webkit2gtk and compiles the Rust crate on a fresh runner every push — a transient apt/toolchain hiccup will now red a ship. The next few ships are the soak period; if the cargo lane flakes on something unrelated to the ship's change, that is the signal to consider hardening the lane (pinned toolchain, apt retry) rather than reverting the flip. Revert is available and documented (re-add `continue-on-error: true` + re-invert the guard) but should be a last resort.

- **Two flip-readiness gates now diverge by counting model.** `macos-flip-readiness.mjs` (organic-churn) and `cargo-flip-readiness.mjs` (lane-stability) intentionally count differently because the legs de-risk different failure modes. A future third staged lane must choose its model from its own failure mode — the carried-forward candidate from v1.49.938. Do not assume either sibling's predicate transfers.

- **The local integration-gate flake is unrelated but adjacent.** The `--project integration` pre-tag-gate step flakes on a fixed-port (`EADDRINUSE 14100+`) race in the gateway tests under parallelism; it passes deterministically single-threaded. That is a pre-existing test-infra issue, not the cargo lane, and a reasonable future cleanup (ephemeral ports).

## Process note

The cargo-flip track ran as the operator chose at session start ("gate first, flip if READY"): Ship 1 (v1.49.938) built and shipped the gate (READY 3/3, green CI), then this ship executed the flip. Both reused the v933–v937 HARD ship discipline verbatim. The flip ship is small and surgical — two functional edits (ci.yml line deletion + test inversion) plus doc/lifecycle hygiene — exactly the shape a load-bearing CI change should be.
