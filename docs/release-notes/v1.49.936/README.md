---
title: "v1.49.936 — CF4a: staged non-blocking cargo CI lane"
version: v1.49.936
date: 2026-06-01
summary: >
  CF4a of the v929 carry-forward campaign — the last originally-scoped item. Adds the
  FIRST CI job that compiles the Rust/Tauri crate (src-tauri/): a separate `cargo test
  --no-default-features` lane folded into ci.yml as a STAGED non-blocking job
  (continue-on-error: true, no `needs:`), following the v1.49.923/v1.49.928 macOS
  staging pattern (#10463). Independent of the load-bearing jobs, so a red cargo lane
  cannot block a ship (the ci-gate reads the run-level conclusion). The ci-matrix-parity
  drift-guard gains six mutation-proven STAGED assertions that force a future
  flip-to-load-bearing to update the test. Lane is green locally (848 passed / 0 failed
  / 1 ignored, headless). No src/ or Cargo.toml change.
tags: [ci, cf4a, infra, cargo, rust, staged-lane, "#10463", continue-on-error]
---

# v1.49.936 — CF4a: staged non-blocking cargo CI lane

**Shipped:** 2026-06-01

One-line: a separate `cargo test --no-default-features` job is added to `ci.yml` as a STAGED non-blocking lane (the first CI job to compile the Rust/Tauri crate), with a mutation-proven drift-guard that pins its staged state — per-push Rust signal without ship-blocking power.

## Why this ship

CF4a is the last originally-scoped item of the v929 carry-forward campaign. CI today never compiles the Rust side (`src-tauri/`) — `build` runs the TS/Vite build, `test` runs vitest. CF4a closes that gap with a cargo lane, introduced STAGED (non-blocking) per the #10463 staged-CI-lane-promotion pattern the macOS leg walked (v920 decoupled -> v923 non-blocking matrix leg -> v928 load-bearing flip): buy per-push signal first, flip to load-bearing only after an N-green window.

## What shipped (no src/ or Cargo.toml change)

- **`.github/workflows/ci.yml`** — a new top-level `cargo` job: `runs-on: ubuntu-latest`, `continue-on-error: true`, `timeout-minutes: 60`, no `needs:`. Installs the Tauri Linux system deps (webkit2gtk-4.1 etc., per README.md) then runs `cargo test --no-default-features --manifest-path src-tauri/Cargo.toml`. `--no-default-features` keeps the build minimal (the GPU-only `cuda` and DB-bound `postgres` features are optional and already off).
- **`tests/integration/ci-matrix-parity.test.ts`** — a "staged non-blocking drift-guard" describe block (6 assertions): the lane exists + is non-blocking (`continue-on-error: true`) + independent (no `needs:`, and no other job `needs:` it) + scoped (`--no-default-features`) + has the webkit apt prelude. Assertions are anchored to real YAML keys so the explanatory comments cannot satisfy them.

## Why non-blocking is safe

The cargo job is an INDEPENDENT top-level job with `continue-on-error: true`. Per GitHub Actions semantics (and the empirically-established v1.49.923 fact), such a job's FAILURE does not change the workflow's run-level conclusion — UNLESS a `needs:[cargo]` downstream consumes it. The ship ci-gate (`tools/pre-tag-gate.sh` step 4) reads the RUN-LEVEL conclusion (`gh run list --json conclusion`), never job-level, so a red cargo lane cannot block a ship. The drift-guard asserts both that cargo has no `needs:` and that nothing else `needs:` cargo, keeping the lane a leaf.

## Verification

- Lane is green locally: **848 passed / 0 failed / 1 ignored**, reproduced headless from a clean `cargo clean -p gsd-os` (fresh-CI conditions: no display, no DB, dist absent) — real green signal, not red-noise.
- Drift-guard 15/15; **mutation-proven**: deleting `continue-on-error: true` reds exactly the STAGED assertion (the comment quoting it does not satisfy the anchored regex), forcing a future flip to update the test. `npm run build` exit 0.
- A 2-lens adversarial-verify Workflow returned CLEAN; three documentation/robustness NITs were folded (the `--no-default-features` rationale, an inverse-`needs` assertion, an explicit `pkg-config`).

## Engine state

NASA degree **1.178** (unchanged). Counter-cadence **20** (unchanged — forward infra work). Manifest **150** (no new lesson — a #10463 instance, the staged-promotion pattern reused for a second lane). Seventh shipped item of the v929 carry-forward campaign. Remaining: CF4d (the deferred `algebrus.eigen` complex-serialization wire fix, discovered at v935). **Flip-to-load-bearing for this cargo lane is a deliberate later ship.**
