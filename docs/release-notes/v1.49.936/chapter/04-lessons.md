# v1.49.936 — Lessons

No new manifest lesson. This ship is an instance of an already-codified discipline plus a robustness reminder.

- **#10463 (staged CI-lane promotion + drift-guard pairing)** — a second instance. The cargo lane is introduced as a non-blocking `continue-on-error` job paired with a drift-guard that pins the staged property, so the future flip-to-load-bearing must update the test. The macOS three-rung sequence (v920 -> v923 -> v928) is the template; CF4a is rung 2 (non-blocking) for the cargo lane.

## Reinforced (carried-forward, not yet promoted)

- **A structural drift-guard must anchor to the artifact's real syntax, not prose that quotes it.** The first cargo assertions matched the explanatory comment (which quotes `continue-on-error: true` and `needs:`), making them vacuous against a real key deletion. Anchor to `\n<indent>key:` (or assert the full command string), and mutation-prove that deleting the real key reds the assertion while the comment alone does not. A drift-guard that passes on its own documentation is worse than no guard.

- **Reproduce fresh-runner conditions before claiming a CI lane is green.** A warm local pass can hide a cold-build or headless failure. `cargo clean` + remove generated dirs + run without a display, and confirm the count matches, before trusting that the lane will be green in CI.

## Carried-forward observation candidate

- **The staged-promotion recipe is lane-agnostic.** The macOS leg and the cargo lane are different in kind (OS matrix vs Rust toolchain), yet the same shape — `continue-on-error` + an inverse drift-guard + a deterministic flip-readiness checker — fit both. A third staged lane would promote this from "pattern reused twice" to a named, generalized recipe (the `continue-on-error` + drift-guard + flip-readiness triad).
