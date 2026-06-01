---
title: "v1.49.942 — macOS flip-readiness Set-boundary test hardening (counter-cadence)"
version: v1.49.942
date: 2026-06-01
summary: >
  Counter-cadence test-hardening (#21). The macOS matrix-leg flip-readiness gate
  (tools/ci/macos-flip-readiness.mjs, born at counter-cadence #20 / v1.49.925)
  classifies a leg conclusion through two Sets — GREEN = {success} and
  BREAKING = {failure, timed_out, cancelled, action_required}, everything else
  transparent. The code pinned those Sets correctly, but the test suite only
  exercised success / failure / skipped, leaving the non-failure BREAKING members
  and the non-success GREEN boundary unpinned — exactly the defer-bias hole the
  v1.49.938 adversarial review found and closed in the cargo sibling gate. This
  ship mirrors that v938 fix onto the macOS gate: two boundary tests pin that
  timed_out/cancelled/action_required (organic) BREAK the streak and that neutral
  (organic) is transparent and never advances the flip. Both are mutation-proven.
  Test-only; the gate source is unchanged. Closes the v938/v939 carried-forward
  "macOS sibling set-boundary sweep" item.
tags: [test, ci, counter-cadence, flip-readiness, defer-bias, set-boundary, macos]
---

# v1.49.942 — macOS flip-readiness Set-boundary test hardening (counter-cadence)

**Shipped:** 2026-06-01

One-line: the macOS flip-readiness gate's GREEN/BREAKING Set boundaries are now pinned by mutation-proven tests, mirroring the v1.49.938 cargo-sibling hardening — so a future refactor that shrinks BREAKING or expands GREEN reds the suite instead of silently advancing the flip.

## Why this ship

`tools/ci/macos-flip-readiness.mjs` (built at counter-cadence #20, v1.49.925) decides whether the macOS matrix leg has accumulated enough consecutive organic-churn green runs to flip from staged to load-bearing. Its streak math classifies each leg conclusion through two Sets:

- `GREEN = {'success'}` — only a real green increments the streak.
- `BREAKING = {'failure', 'timed_out', 'cancelled', 'action_required'}` — the leg ran and was not green, so it resets the streak.
- Everything else (`skipped` / `neutral` / `stale` / `startup_failure` / `in_progress` / null) produced no verdict and is **transparent** (neither counts nor breaks).

That design encodes a deliberate **defer-bias**: a misclassification may only DEFER the flip, never ADVANCE it on weaker evidence. The code pinned the Sets correctly — but the *test* suite only exercised `success` (green), `failure` (break), and `skipped` (transparent). The non-failure BREAKING members (`timed_out`/`cancelled`/`action_required`) and the non-success-non-breaking GREEN boundary (`neutral`) were **unpinned**. A future edit that shrank `BREAKING` to just `['failure']`, or expanded `GREEN` to `['success','neutral']`, would pass the entire existing suite while quietly breaking the defer-bias — letting a flaky-infra timeout or a neutral run advance the flip.

This is the exact hole the v1.49.938 adversarial review found in the **cargo** sibling gate (`tools/ci/cargo-flip-readiness.mjs`) and closed there. It was named as a carried-forward item in the v938/v939 handoffs: "the same gap may exist in `macos-flip-readiness.test.mjs` — add the timed_out-breaks + neutral-transparent boundary tests there too." This counter-cadence ship is that sweep.

## What shipped

- **`tools/ci/__tests__/macos-flip-readiness.test.mjs`** — two boundary tests added to the `computeReadiness` block, mirroring the cargo sibling's v938 shape (adapted to `macosConclusion` / `churn: 'organic'`):
  - *"an organic breaking non-failure conclusion (timed_out / cancelled / action_required) ALSO breaks"* — pins the `BREAKING` Set. For each of the three conclusions, an organic run resets the streak (`broke` is set, the walk stops).
  - *"an organic non-green non-breaking conclusion (neutral) is transparent — does NOT advance"* — pins the `GREEN` Set. A `neutral` organic run neither counts toward the streak nor breaks it.

That is the entire diff: **27 insertions, test-only**. The gate source (`macos-flip-readiness.mjs`) is unchanged — the Sets were already correct; this ship makes them *guarded*.

## Verification

- The macOS flip-readiness test file passes **35/35** (was 33; +2 new) under `vitest.tools.config.mjs`.
- **Both new tests are mutation-proven against the live gate:**
  - Shrinking `BREAKING` to `new Set(['failure'])` reds *exactly* the timed_out/cancelled/action_required test (and nothing else).
  - Expanding `GREEN` to `new Set(['success','neutral'])` reds *exactly* the neutral test.
  - The gate source was restored from git after each mutation (working tree clean before commit).
- A 3-lens adversarial review (correctness / completeness / convention) plus per-finding skeptics returned **CLEAN** — 1 raw finding (that `stale`/`startup_failure`/`in_progress` transparency is not individually unit-tested), correctly dismissed as out-of-scope: the cargo sibling does not pin those either, so pinning them on macOS alone would make the two gates asymmetric, beyond this mirror's scope.
- Full pre-tag-gate: all 18 steps PASS (no integration bypass — the v1.49.940 ephemeral-port fix holds).

## Why test-only is the right scope

The macOS gate's Sets were already correct, so there is no behavior to change — only an unguarded invariant to guard. The sweep deliberately matches the cargo sibling's v938 scope (BREAKING boundary + GREEN boundary) rather than expanding it: the `stale`/`startup_failure`/`in_progress` transparency remains **comment-pinned in both gates** (`macos-flip-readiness.mjs:153-157`, `cargo-flip-readiness.mjs:143-147`), not test-pinned. Pinning those on macOS only would break the macOS↔cargo symmetry the two gates otherwise share. The two gates are now boundary-test-symmetric.

## Engine state

NASA degree **1.178** (unchanged). **Counter-cadence #21** (this ship — the 21st counter-cadence milestone; the prior, #20, was v1.49.925, which *created* the gate this ship hardens). Manifest **150** (no new lesson — this is the second observation of the "pin the advance/break Set boundaries of a defer-biased gate" pattern, cargo v938 → macOS v941; a clean promotion candidate, recorded in the lessons chapter).
