---
title: "v1.49.938 — cargo lane flip-readiness gate (lane-stability model)"
version: v1.49.938
date: 2026-06-01
summary: >
  Operationalizes the #10463 flip gate for the STAGED non-blocking `cargo` CI lane
  (introduced v1.49.936 / CF4a), mirroring the proven `macos-flip-readiness.mjs` but
  with an INVERTED counting model. The macOS gate counts organic test-surface churn
  because its risk is cross-platform behavioral divergence on new code; the cargo lane
  does a full fresh apt + recompile + test on EVERY push, so its risk is lane/
  environment reliability — and a docs-only commit's green DOES count as track record
  (the opposite of the macOS inert rule). A commit is excluded only when it modified the
  cargo lane definition (touched ci.yml). The gate reports READY — streak 3/3, so the
  load-bearing flip is now a deterministic next step rather than an operator judgment
  call. Gate-not-vigilance (#10428). No ci.yml change this ship — the flip is the next.
tags: [ci, cargo, flip-readiness, "#10463", "#10428", gate-not-vigilance, tooling, infra]
---

# v1.49.938 — cargo lane flip-readiness gate (lane-stability model)

**Shipped:** 2026-06-01

One-line: a deterministic readiness checker (`tools/ci/cargo-flip-readiness.mjs`) that says whether the staged `cargo` CI lane has earned its flip to load-bearing — built as the sibling of `macos-flip-readiness.mjs` but with a counting model matched to the cargo lane's actual failure mode. Verdict at ship time: **READY 3/3**.

## Why this ship

The cargo lane (v1.49.936 / CF4a) is the first CI job that compiles the Rust/Tauri crate. It shipped STAGED — a separate `continue-on-error: true` job — exactly so it could prove itself across an N-green window before becoming ship-blocking. Per #10463, that "earned its flip" judgment must be a deterministic gate, not operator vigilance (the macOS lane's flip was nearly misjudged at v1.49.924, when 9 green runs were all release/docs ships re-running an unchanged surface). The macOS lane got its gate (`macos-flip-readiness.mjs`); the cargo lane had none. This ship builds it — and the build forced a real design decision about what "a green that proves the lane" means for cargo.

## The design decision: a different counting model, on purpose

The macOS gate counts **organic churn** (test-surface changes) because the macOS leg's pre-flip risk is *cross-platform behavioral divergence on new code*: a docs/release commit that re-runs the identical TS test surface is **inert** — no new evidence.

The cargo lane de-risks a **different** failure mode. It is a single ubuntu job that does a full fresh `apt-get install` + `cargo` recompile + test on **every** push, regardless of what the commit changed. The danger of flipping it load-bearing is a transient infra flake (apt mirror down, toolchain drift, a webkit2gtk packaging change) red-blocking an **unrelated** TS ship. That risk is exercised on every full recompile — so a docs-only commit's green cargo run **IS** fresh lane-reliability evidence here, the **opposite** of the macOS inert rule.

So the cargo gate's predicate is inverted: a commit's green counts as track record (`tracked`) unless that commit **modified the cargo lane definition** (touched `.github/workflows/ci.yml`) — a lane-modifying commit's green is a self-test of the change, not independent evidence. That cleanly excludes the v936 introduction `ci(cargo)` commit and the future flip commit, while counting every push that ran the *fixed* lane green. Confirmed against a real trap: every `chore(release)` touches `src-tauri/Cargo.toml` + `tauri.conf.json` (the version bump) — the exact analog of the `package.json` false-positive that produced a spurious READY 3/3 in the macOS gate — and the cargo predicate (keyed on ci.yml, not on src-tauri/) is immune to it.

## What shipped (4 files)

- **`tools/ci/cargo-flip-readiness.mjs`** (new) — the gate. Pure `classifyCommit` (`tracked`/`untracked`), `detectFlipState` (cargo-job-isolated `staged`/`flipped`/`unknown`), `computeReadiness` (streak walk with defer-bias), plus a live `gh`+git shell mirroring `macos-flip-readiness.mjs` (job-conclusion read, dedup, short-circuit, realpath CLI guard, exit `0`/`1`/`2`).
- **`tools/ci/__tests__/cargo-flip-readiness.test.mjs`** (new) — 36 tests (pure functions + CLI via `--runs-file`, headless). Includes a test pinning the **key divergence** (docs-only = tracked) and one mirroring the real v936→v937 ground-truth shape.
- **`vitest.tools.config.mjs`** — registers the new test (the `tools-config-coverage` guard enforces this, so CI runs it).
- **`docs/static-analysis-tool-discipline.md`** — documents the cargo sibling gate + the lane-stability divergence under the #10463 flip-gate section.

## Verification

- 36/36 cargo-gate tests green; `tools-config-coverage` guard green (registration accepted).
- **Live verdict against the real `gh` + git:** READY — streak 3/3 (`{aadee1e2f, 2b1813ec2, db30cfd78}`), flipState `staged`, "Safe to flip" guidance.
- **Mutation-proven (the gate's own defer-bias):** an adversarial-verify Workflow (4 lenses) confirmed that shrinking the `BREAKING` set to `['failure']` or adding `neutral` to `GREEN` — two mutations that would let a flaky/non-green run *advance* the flip — survived the original 34 tests. Two boundary-pinning tests were added; under the combined mutation exactly those two red, all 34 others stay green. Restored and re-verified READY 3/3.

## Engine state

NASA degree **1.178** (unchanged). Counter-cadence **20** (unchanged — forward infra work). Manifest **150** (no new lesson — an application of #10463 + #10428 gate-not-vigilance, with a carried-forward candidate: *a staged-lane flip-readiness gate's counting model must match the lane's failure mode, not be copied from a sibling gate*). **No `ci.yml` change** — this ship builds the gate; the load-bearing flip is the next ship (v1.49.939: delete the cargo job's `continue-on-error: true` + invert the STAGED assertion in `ci-matrix-parity.test.ts`).
