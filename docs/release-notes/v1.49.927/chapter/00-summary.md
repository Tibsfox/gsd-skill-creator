---
title: "Summary"
chapter: 00-summary
version: v1.49.927
date: 2026-05-31
summary: "What shipped in v1.49.927 and why."
tags: [summary]
---

# v1.49.927 — Summary

## What shipped

This release wires the dormant MA-3/MD-2 stochastic selector-bridge into the M5
`ActivationSelector`, giving `applyStochasticBridge` its first production caller.

Three parts:

1. **The wire** (`src/orchestration/selector.ts`): `select()` consults
   `applyStochasticBridge` over the full ranked set before the topK slice, gated
   by an opt-in `stochastic.enabled` flag + a per-call `inBranchContext`. Default
   off → byte-identical (the bridge is not called at all when disabled).
2. **New opt-in surface**: `SelectorOptions.stochastic` ({ enabled, baseTemperature })
   and `SelectContext` extended with inBranchContext / tractabilityClass / rng;
   `SelectContext` exported from the orchestration barrel.
3. **14 wire tests** exercising the selector→bridge path (not the bridge in
   isolation).

## Numbers

- 14 new tests; 247 tests pass across orchestration/stochastic/continuation; tsc clean.
- 3-lens adversarial review clean (0 blockers, 0 warns).
- counter-cadence unchanged at 20 (forward consume work); manifest stays 150.

## Next

Follow-on: an in-loop production caller that actually passes
`stochastic.enabled` + a branch context + a seeded rng (deferred — this ship
establishes the capability, default-off). Candidate siblings: wiring the College
concept-fallback into live dispatch; opening WriterContext (4th chokepoint).
