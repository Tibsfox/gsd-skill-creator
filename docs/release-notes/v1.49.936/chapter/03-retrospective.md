# v1.49.936 — Retrospective

## What went right

- **The staged pattern transferred cleanly to a second lane.** The macOS leg established the staged-CI-lane-promotion shape (v920 -> v923 -> v928, #10463): introduce non-blocking, prove across an N-green window, then flip. CF4a reused it for a wholly different lane (Rust/cargo vs OS-matrix) with no friction — the `continue-on-error` + drift-guard pairing is now a reusable recipe, not a one-off.

- **The drift-guard's anchored regexes survived their own comments.** The first draft asserted `/needs:/` and `/continue-on-error:\s*true/` — which matched the explanatory comment text, not the YAML keys. That made the STAGED guard vacuous: deleting the real key while leaving the comment would have kept it green, defeating the future flip. Anchoring to `\n<indent>key:` fixed it, and a mutation (delete the key, keep the comment) proved the guard now reds correctly.

- **The adversarial verify reproduced fresh-CI conditions instead of trusting the warm local run.** A skeptic lens did `cargo clean -p gsd-os` + removed `desktop/dist`, then re-ran headless — 848/0/1, confirming the lane will be green on a cold GH runner with no display, and experimentally disproving a hypothesized `generate_context!()`-on-missing-frontendDist blocker. That is the difference between "passes on my machine" and "will pass in CI."

## What to watch

- **The lane is non-blocking ON PURPOSE.** A red cargo run will show a red X per push but will NOT block a ship (the ci-gate reads the run-level conclusion, which an independent continue-on-error job does not move). That is the staged contract. Watch the first few CI runs to confirm the lane is actually green (the local 848/0/1 is strong evidence, but the GH runner is the real test).

- **Flip-to-load-bearing is a later ship.** After an N-green window, deleting `continue-on-error: true` makes a cargo failure ship-blocking. That deliberate act MUST invert the STAGED drift-guard assertion (a silent flip fails the test). A `cargo-flip-readiness.mjs` (mirroring `tools/ci/macos-flip-readiness.mjs`) would operationalize the gate, as v925 did for macOS.

- **No cargo caching yet.** A cold dependency compile (~600 crates incl. tauri/wry) runs every push; well within the 60-min timeout but not fast. Adding `Swatinem/rust-cache` is a low-risk refinement for the flip phase.

## Process note

Local cargo 1.95.0 + the system webkit libs (already installed here) made the local proof possible; CI installs the webkit deps via the apt prelude. The campaign now has one remaining item — CF4d, the deferred eigen wire-serialization fix discovered at v935.
