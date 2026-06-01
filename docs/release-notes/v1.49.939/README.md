---
title: "v1.49.939 — cargo lane flipped to load-bearing (#10463 two-rung complete)"
version: v1.49.939
date: 2026-06-01
summary: >
  Executes the cargo lane's load-bearing flip. The job-level `continue-on-error: true`
  was deleted from the cargo job in ci.yml, so a cargo failure now folds into the
  run-level conclusion the pre-tag-gate ci-gate reads — a cargo failure blocks a ship
  exactly like an ubuntu test failure. Driven by the v1.49.938 cargo-flip-readiness gate
  reaching READY 3/3 (lane-stability model). Paired with the mandatory inversion of the
  STAGED assertion in ci-matrix-parity.test.ts to pin the line's ABSENCE (the #10461
  drift-guard; mutation-proven). Completes cargo's two-rung promotion (staged v936 →
  load-bearing v939) and validates gate-not-vigilance on a second CI lane after macOS.
tags: [ci, cargo, load-bearing, flip, "#10463", "#10461", drift-guard, gate-not-vigilance]
---

# v1.49.939 — cargo lane flipped to load-bearing (#10463 two-rung complete)

**Shipped:** 2026-06-01

One-line: the staged `cargo` CI lane is now ship-blocking. The job-level `continue-on-error: true` is gone, and the #10461 drift-guard was inverted to pin its absence — both in one commit, mutation-proven.

## Why this ship

The cargo lane (v1.49.936 / CF4a) was introduced STAGED — a non-blocking `continue-on-error: true` job — so it could prove itself across an N-green window before becoming ship-blocking (#10463). v1.49.938 built its readiness gate (`tools/ci/cargo-flip-readiness.mjs`), which reached **READY 3/3** under a lane-stability counting model. This ship executes the flip the gate's deterministic verdict authorized — gate-not-vigilance: the operator does not eyeball a green streak and guess, the gate decides and the flip follows.

## What shipped

- **`.github/workflows/ci.yml`** — deleted the cargo job's `continue-on-error: true` line; rewrote the job comment to record the flip. The cargo job is an independent leaf (no `needs:`), so with `continue-on-error` gone its failure now contributes to the run-level conclusion the pre-tag-gate ci-gate (step 4) reads.
- **`tests/integration/ci-matrix-parity.test.ts`** — inverted the STAGED assertion (`toMatch` → `.not.toMatch`) to pin the line's ABSENCE, and rewrote the describe block to LOAD-BEARING. This is the #10461 drift-guard pairing: a silent flip (or a silent re-stage) fails the test. **Mutation-proven:** re-adding `continue-on-error: true` reds exactly the inverted cargo assertion (the macOS assertion is unaffected).
- **`tools/ci/cargo-flip-readiness.mjs`** — updated the two docstring comments that referenced "the future flip commit" to past tense (self-referential #10427: a flip-gate tool's own docs must not describe a now-executed flip as pending). The gate's runtime guidance was already lifecycle-aware — it now reads `flipState: flipped` and prints "ALREADY load-bearing — here is how to REVERT".
- **`docs/static-analysis-tool-discipline.md`** + **`tools/render-claude-md/disciplines.json`** + **`CLAUDE.md`** — the #10463 record now documents the cargo flip as a second lane completing the staged→load-bearing arc (two-rung; lane-stability model).

## What flipping load-bearing means (and the accepted risk)

From this ship on, every ship requires the cargo lane green. The lane apt-installs webkit2gtk and runs `cargo test --no-default-features` on `src-tauri/`. Its track record at flip time: green on every CI run since introduction (6 distinct commits). The accepted risk is that a transient infra flake (apt mirror, toolchain drift) could red-block an unrelated TS ship — mitigated by the N-green track record the gate enforced before allowing the flip. This is the same trade the macOS leg took at v1.49.928.

## Verification

- `ci-matrix-parity.test.ts` 15/15 green with the flip; mutation-proven (re-stage → red).
- `cargo-flip-readiness.mjs` 36/36 green (comment-only edits); live gate now reads `flipState: flipped`, READY 3/3, REVERT guidance.
- Full pre-tag-gate: all 18 steps PASS.
- This ship's own CI is the first to run with the cargo lane LOAD-BEARING.

## Engine state

NASA degree **1.178** (unchanged). Counter-cadence **20** (unchanged — forward infra work). Manifest **150** (no new lesson — application of #10463 + #10461, with the v938 carried-forward candidates intact: failure-mode-matched counting model; pin the advance/break set boundaries of a defer-biased gate). Completes the cargo lane's **two-rung** promotion (staged v1.49.936 → load-bearing v1.49.939).
