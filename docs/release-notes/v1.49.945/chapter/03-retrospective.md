# v1.49.945 — Retrospective

## What went right

- **The accepted-risk had an alarm, and the alarm was honored on the next ship.** When the cargo lane went load-bearing at v1.49.939, the risk was named explicitly ("MONITOR next ships for flake; revert documented"). It materialized at v1.49.944. Rather than re-running CI and moving on — the interim remedy, which works but accretes workaround-debt per #10415 — the wedge was closed at the very next milestone. The deferred-maintenance discipline says an open red in a load-bearing lane is closed within 1-2 milestones; this hit the lower bound.

- **Recon found the race was broader than the handoff scoped it.** The v1.49.944 handoff named only `keystore_tests.rs`. A whole-tree grep (`ANTHROPIC_API_KEY`, `set_var`/`remove_var`, `KeyStore::load`, `load_credentials_from_keystore`, `store_key(`) found a second racer file, `client_tests.rs`, with two more env-mutating tests. Had the fix trusted the handoff's scope and put a per-file guard in `keystore_tests.rs`, the cross-file race (`no_key_found` vs the client tests) would have survived and the lane would still flake — just more rarely, which is worse (harder to attribute). The shared-guard-in-the-common-parent shape was chosen precisely because the racers span two sibling modules.

- **The fix was proven load-bearing, not assumed.** A concurrency fix has no natural "mutation test," so the counterfactual was run directly: `git stash` the fix to restore the racy HEAD code, stress at 32 threads x 60 runs, observe **3/60** failures with the exact production signature (`no_key_found` panicking at `keystore_tests.rs:22`), restore the fix, stress again, observe **0/30**. The race is real and the lock closes it — both halves demonstrated rather than reasoned.

- **The lightest correct mechanism was chosen.** `serial_test` is the idiomatic crate, but it would compile on every cargo-lane run for a five-test serialization need. A zero-dependency `static Mutex<()>` (const since rustc 1.63, well under the 1.95 toolchain) does the same job with no supply-chain or compile-time surface, fitting the project's dependency-minimalism discipline.

- **A first-pass error was caught before it became committed state.** Running `cargo test` locally regenerated `src-tauri/Cargo.lock`'s stale `gsd-os` self-version (1.49.917 -> 1.49.944). That lockfile line has drifted since v1.49.918 because `bump-version.mjs` does not bump `Cargo.lock`, and the drift is harmless (cargo auto-syncs it per run and never fails on it). It was reverted to keep the commit scoped to the test-race fix rather than opportunistically folding in an unrelated lockfile change.

## What went well in process

- **The adversarial review's one job here was completeness, and it did it.** Of the fix's properties, correctness was self-evident and empirically proven; the residual risk was a *missed* env-touching surface (a blind spot recon can't fully self-check). The review's scope-completeness lens independently re-derived the five-racer set from scratch and confirmed no other `ANTHROPIC_API_KEY` mutator exists outside `api/tests/` — turning "I think I found them all" into an independently-verified claim.

## What to watch

- **Other process-global state in the Rust test suite.** This race was env-var-specific, but the same hazard exists for any process-global mutated by parallel tests (current working directory, global singletons, shared temp paths without unique names). `GSD_REPO_ROOT` is set/removed by `intelligence/atlas*.rs` tests; those currently appear self-contained, but they are the next candidates if a similar flake surfaces. The general guard pattern (shared lock in the common parent module) is reusable.

- **The flake's interim remedy is still documented for emergencies.** If a future cargo red appears, confirm it is the (now-fixed) test race vs a real compile/apt failure via `gh run view --job <cargo-job> --log-failed`, then `gh run rerun <run-id> --failed`. With this fix in place, a cargo red should now indicate a *real* problem rather than the env race.
