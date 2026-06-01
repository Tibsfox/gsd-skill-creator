---
title: "Context"
chapter: 99-context
version: v1.49.933
date: 2026-05-31
summary: "Where v1.49.933 sits in the larger arc."
tags: [context]
---

# v1.49.933 — Context

## Where this sits

- The fourth shipped item of the **v929 carry-forward campaign** (CF2b), after
  CF1 (v930, `.college/`→`src/` gate), CF2a (v931, in-branch stochastic selector
  wire), and the v932 recovery.
- CF2b was scoped as a verify-axis task on the MA-3 stochastic bridge. The audit
  closed that scope (the three named preconditions are verified safe; no guards
  needed) and surfaced an adjacent M5 scorer bug, which this ship fixes.
- Remaining campaign work: CF3 ×3 (integration-test proofs of the dormant
  `temperature` / `langevin` / `eligibility` substrates), CF4a (staged cargo CI
  lane), CF4b (coprocessor skill-consumer example), CF4c (algebrus.eigen
  intentional-CPU-only verdict, folded into CF4b's docs).

## Engine state

- NASA degree 1.178 (unchanged).
- counter-cadence 20 (unchanged — a forward bug fix).
- manifest 150 lessons (no new lesson; a #10438 verify-axis instance; the
  "completeness-critic catches what dimension-lenses clear" observation is carried
  forward as a candidate).
- Architecture gaps unchanged: 6/7 closed-or-intentional.

## References

- The fix: `src/memory/scorer.ts` (`importanceScore` — NaN gamma → 0).
- The injection vector: `src/orchestration/selector.ts` (`gamma: cand.importance ?? 0`)
  ← public `BranchVariant.importance` / `Candidate.importance`.
- The unit test: `src/memory/__tests__/m2-scorer.test.ts`.
- The end-to-end regression: `tests/integration/branch-variant-stochastic-wire.integration.test.ts`.
- The verified contract doc note: `src/stochastic/selector-bridge.ts`.
- Prior milestone: v1.49.932 (recover v931 red CI).
