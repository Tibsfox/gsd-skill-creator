---
title: "v1.49.927 — Wire the MA-3 Stochastic Bridge into the M5 Selector"
version: v1.49.927
date: 2026-05-31
summary: >
  ActivationSelector.select() now consults the dormant MA-3/MD-2 stochastic
  selector-bridge (opt-in, default off and byte-identical). This gives
  applyStochasticBridge its first production caller after sitting unwired since
  ~v500 — a consume-axis closure.
tags: [orchestration, stochastic, MA-3, MD-2, consume-axis, selector]
---

# v1.49.927 — Wire the MA-3 Stochastic Bridge into the M5 Selector

**Shipped:** 2026-05-31

One-line: M5's `ActivationSelector.select()` gains an opt-in call into
`applyStochasticBridge`, so the long-built MA-3/MD-2 stochastic selection layer
finally has a production consumer — with the default path byte-identical to the
deterministic ranking.

## What shipped

- **The wire** (`src/orchestration/selector.ts`): when the selector is built
  with `stochastic.enabled` AND the per-call `context.inBranchContext` is true,
  the activated set is re-ordered via `applyStochasticBridge` — a
  temperature-weighted softmax sample is promoted to position 0 over the **full
  ranked set, before the topK slice** (so the single-selection topK=1 path
  actually explores). Default off → byte-identical to the deterministic ranking
  (SC-MA3-01); the bridge is never even called when disabled.
- **New opt-in surface**: `SelectorOptions.stochastic?: { enabled?, baseTemperature? }`
  (defaults enabled=false, baseTemperature=1.0), and the `SelectContext`
  interface gains `inBranchContext?` / `tractabilityClass?` / `rng?` alongside the
  existing `aceSignal?`. `SelectContext` is now re-exported from the orchestration
  barrel.
- **14 wire tests** (`selector-stochastic-wire.test.ts`) covering the flag-off /
  not-in-branch / T=0 no-op paths, seeded reproducibility, permutation +
  position-0-only promotion, the topK=1 single-selection path, payload
  preservation, coin-flip tractability, and default-temperature honouring.
- **First production caller** for `applyStochasticBridge` (dormant, 0 callers
  since ~v500). The selector is reached in production via
  `src/application/skill-applicator.ts` `applyViaSelector()`.

## Why

The MA-3 (softmax/ε-greedy stochastic selection) + MD-2 bridge had been fully
built and unit-tested but had **zero production callers** — a consume-axis gap.
This ship connects it to its designed integration target, the M5 selector,
behind a default-off opt-in. No behaviour changes for any existing caller.

## Verification

- 14 new tests; `tsc --noEmit` clean; 247 tests pass across the
  orchestration / stochastic / continuation suites (including the
  flag-off-byte-identical invariant suite) — zero regressions.
- 3-lens adversarial review (correctness+contract / build+integration /
  test-quality): **clean, no blockers, no warnings**; the test suite kills the
  bridge-deletion mutation.

## Links

- Summary: [00-summary](chapter/00-summary.md)
- Retrospective: [03-retrospective](chapter/03-retrospective.md)
- Lessons: [04-lessons](chapter/04-lessons.md)
- Context: [99-context](chapter/99-context.md)

[release-notes index](../INDEX.md)
