# v1.49.938 — Summary

## The ship

A deterministic readiness gate for the staged `cargo` CI lane: `tools/ci/cargo-flip-readiness.mjs`, the sibling of `macos-flip-readiness.mjs`. It answers — without operator judgment — whether the cargo lane has earned its flip from STAGED non-blocking to LOAD-BEARING (#10463, gate-not-vigilance #10428). Verdict at ship time: **READY 3/3**.

## The design decision

The cargo gate deliberately uses a **different counting model** than the macOS gate, because the two legs de-risk different failure modes:

- **macOS** risk = cross-platform behavioral divergence on *new code* → only test-surface (organic) churn counts; a docs/release commit re-running the identical TS surface is **inert**.
- **cargo** risk = lane/environment reliability. It does a full fresh apt + `cargo` recompile + test on *every* push, so a transient infra flake is the danger when it becomes ship-blocking. A docs-only commit's green **DOES** count here (a fresh recompile = real evidence) — the **opposite** of the macOS rule.

So a commit's green is excluded (`untracked`) only when it **modified the cargo lane definition** (touched `.github/workflows/ci.yml`) — a self-test, not track record. That excludes the v936 introduction `ci(cargo)` commit and the future flip commit, and is immune to the `chore(release)` version-bump trap (every release touches `src-tauri/Cargo.toml`, but the cargo predicate keys on ci.yml, not src-tauri/).

## The teeth

- 36 headless tests (pure functions + CLI via `--runs-file`); `tools-config-coverage` guard green so CI runs them.
- **Mutation-proven defer-bias:** an adversarial-verify Workflow showed two mutations that would let a flaky/non-green run *advance* the flip (shrink `BREAKING` to `['failure']`; add `neutral` to `GREEN`) survived the original suite. Two boundary tests were added; under the combined mutation exactly those two red, all others stay green.
- Live verdict against real `gh`+git: READY 3/3 (`{aadee1e2f, 2b1813ec2, db30cfd78}`), `staged` flipState.

## Scope discipline

Four files; a tool + tests + config registration + a discipline-doc note. **No `ci.yml` change** — the gate is built and reports READY; the load-bearing flip (delete the cargo job's `continue-on-error: true` + invert the STAGED assertion in `ci-matrix-parity.test.ts`) is the next ship. Counter-cadence unchanged at 20; NASA 1.178; manifest 150.
