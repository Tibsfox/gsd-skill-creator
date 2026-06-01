# v1.49.938 — Retrospective

## What went right

- **The recon caught a near-copy mistake before a line was written.** The obvious move was to clone `macos-flip-readiness.mjs` and swap "macos" for "cargo". A live look at the data stopped that: every `chore(release)` touches `src-tauri/Cargo.toml` + `tauri.conf.json` (the version bump) — so a naive "touched src-tauri/ → organic" predicate would mark every release green as track-record and produce a spurious READY, the exact `package.json` false-positive the macOS gate had already been burned by (#10427). Recognizing that the cargo lane de-risks a *different* failure mode (lane/environment reliability, not cross-platform behavior) reframed the whole counting model.

- **The counting model was chosen on the lane's failure mode, not on consistency.** Copying the macOS organic-churn rule would have made the cargo lane essentially un-promotable in a TS-heavy repo (no Rust-source churn → 0 organic greens → flip never fires). The decision — surfaced explicitly rather than guessed — was that for a lane that fully recompiles on every push, a docs-only green IS fresh reliability evidence, so the predicate inverts to "counts unless it modified the lane definition." The principled rule also generalizes (the introduction `ci(cargo)` commit and the future flip commit both self-exclude), and the live verdict's banked set matched the intended one exactly.

- **The adversarial verify earned its keep on the gate's own invariant.** Four lenses returned one confirmed finding: the `GREEN`/`BREAKING` Set boundaries were unpinned, so two mutations that *violate the tool's own documented defer-bias* — a tracked `timed_out`/`cancelled` falling through to transparent (advancing the flip on a flaky lane), and `neutral` counting as green — passed all 34 original tests. The reviewer verified both mutations empirically. Two boundary tests closed it, mutation-proven. A gate whose job is to replace operator vigilance must not have a hole exactly where the lane's real failure mode (a timeout) lives.

## What to watch

- **The flip is the next ship, and it is the consequential one.** This ship adds only a tool + tests + doc; it touches no `ci.yml` and changes no ship-blocking behavior. The flip (v1.49.939) deletes the cargo job's `continue-on-error: true` and inverts the STAGED assertion in `ci-matrix-parity.test.ts` — at which point a red cargo lane blocks every ship. The lane is young (4 CI runs); the flip accepts that a transient infra flake could red-block a ship, mitigated by the N-green track record the gate now enforces.

- **The two flip-readiness gates now use different counting models** (`macos-flip-readiness.mjs` = organic churn; `cargo-flip-readiness.mjs` = lane-stability). That is intentional and documented, but it is a fork to remember: a future third staged lane should pick its model from its failure mode, not default to either sibling.

- **The gate is advisory.** Exit `0`/`1`/`2` is a convenience for `&&`-chaining; nothing auto-runs it as a ship blocker. The flip stays a deliberate operator act that ALSO updates the drift-guard — the gate informs it, it does not perform it.

## Process note

Operator chose the counting model (lane-stability) and the scope ("gate first, flip if READY") up front via a decision prompt, then the build proceeded autonomously: author → 36 tests → live verdict → adversarial-verify Workflow → fold the one confirmed finding → mutation-prove → ship. The v933–v937 HARD ship discipline is reused verbatim.
