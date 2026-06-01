# v1.49.936 — Summary

## The ship

CF4a of the v929 carry-forward campaign (the last originally-scoped item): a `cargo test --no-default-features` job is folded into `ci.yml` as a STAGED non-blocking lane — the **first CI job that compiles the Rust/Tauri crate**. It follows the #10463 staged-CI-lane-promotion pattern (the macOS three-rung sequence). Zero `src/` or `Cargo.toml` change.

## The lane

- A separate top-level `cargo` job: `continue-on-error: true`, no `needs:`, ubuntu-latest, 60-min timeout. Installs the Tauri webkit2gtk Linux deps (per README.md), then `cargo test --no-default-features --manifest-path src-tauri/Cargo.toml`.
- INDEPENDENT + non-blocking: a cargo failure does not move the run-level conclusion the ship ci-gate reads (`pre-tag-gate.sh` step 4), so it cannot block a ship.

## The drift-guard

`tests/integration/ci-matrix-parity.test.ts` gains a six-assertion "staged non-blocking drift-guard": the lane exists + is `continue-on-error: true` + has no `needs:` + is not consumed by any other job's `needs:` + runs `--no-default-features` + installs `libwebkit2gtk-4.1-dev`. All anchored to real YAML keys (the explanatory comments cannot satisfy them). This is the inverse of the macOS LOAD-BEARING pins — a future flip-to-load-bearing (deleting `continue-on-error`) MUST update this test (#10463 pairing).

## The teeth

- The lane is green locally: **848 passed / 0 failed / 1 ignored**, reproduced headless from a clean `cargo clean` — real signal, not red-noise.
- The drift-guard is **mutation-proven**: deleting the real `continue-on-error: true` key reds exactly the STAGED assertion; the comment quoting it does not falsely satisfy the anchored regex.

## Scope discipline

Two files changed (`ci.yml` +34, the drift-guard +64); zero `src/`/`Cargo.toml` change — the lane consumes the crate as-is. The eigen wire fix (CF4d) remains deferred. Counter-cadence unchanged at 20; NASA 1.178; manifest 150. Flip-to-load-bearing is a deliberate later ship.
