---
title: "Context"
chapter: 99-context
version: v1.49.931
date: 2026-05-31
summary: "Where v1.49.931 sits in the larger arc."
tags: [context]
---

# v1.49.931 — Context

## Where this sits

- Second ship of the **v929-carry-forward campaign** (CF2a of CF1–CF4). CF1
  (v1.49.930) closed the `.college/`→`src/` boundary; CF2a wires the dormant
  in-branch stochastic selector path into M4 exploration.
- Closes the consume-axis loop opened at v1.49.927 (the MA-3 stochastic bridge wired
  into the M5 selector). v927 added the opt-in path; v931 adds its first production
  caller (`selectBranchVariant`), with `explore()` as the in-loop consumer.
- Mirrors the concept-fallback arc (substrate v568-572 → callers v830/832 → proof
  v929): a frame-gated path whose first sound caller is the frame's own primitive.

## Engine state

- NASA degree 1.178 (unchanged).
- counter-cadence 20 (unchanged — forward consume-axis work, not a cleanup milestone).
- manifest 150 lessons (no new lesson; consume-axis instance of #10428).
- Architecture gaps unchanged: 6/7 closed-or-intentional.

## References

- The primitive: `src/branches/select-variant.ts` (`selectBranchVariant`).
- The consumer: `src/branches/explore.ts` (`ExploreOptions.variantSelection`).
- The substrate (unchanged): `src/orchestration/selector.ts` (in-branch stochastic
  path, v1.49.927) + `src/stochastic/selector-bridge.ts` (`applyStochasticBridge`).
- The proof: `tests/integration/branch-variant-stochastic-wire.integration.test.ts`.
- Prior milestone: v1.49.930 (standing `.college/`→`src/` import gate, CF1).
