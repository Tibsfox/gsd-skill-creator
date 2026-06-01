---
title: "Context"
chapter: 99-context
version: v1.49.938
date: 2026-06-01
summary: "Where v1.49.938 sits in the larger arc."
tags: [context]
---

# v1.49.938 — Context

## Where this sits

- The **first** ship after the v929 carry-forward campaign closed (at v1.49.937 / CF4d).
  A clean-slate pick from the post-campaign handoff's "optional forward candidates": the
  **cargo lane flip-to-load-bearing track** (#10463), chosen by the operator.
- This is the **gate-building** step of that track. The staged `cargo` CI lane (introduced
  v1.49.936 / CF4a) had no flip-readiness checker; the macOS lane got its
  `macos-flip-readiness.mjs` at v1.49.925 and flipped at v1.49.928. This ship gives the
  cargo lane the equivalent gate — with a counting model matched to its failure mode.
- The **load-bearing flip is the next ship** (v1.49.939): delete the cargo job's
  `continue-on-error: true` and invert the STAGED assertion in `ci-matrix-parity.test.ts`
  (the #10461 drift-guard pairing). The gate reports READY 3/3 as of this ship.

## Engine state

- NASA degree 1.178 (unchanged).
- counter-cadence 20 (unchanged — forward infra work, not a cleanup ship).
- manifest 150 lessons (no new lesson; an application of #10463 + #10428 + #10427, plus
  carried-forward candidates on failure-mode-matched counting models and on pinning the
  advance/break set boundaries of a defer-biased gate).
- Architecture gaps unchanged: 6/7 closed-or-intentional.

## References

- The gate: `tools/ci/cargo-flip-readiness.mjs` (`classifyCommit`, `detectFlipState`,
  `computeReadiness`) with `tools/ci/__tests__/cargo-flip-readiness.test.mjs` (36 tests).
- The sibling it mirrors: `tools/ci/macos-flip-readiness.mjs` (organic-churn model).
- The lane it gates: `.github/workflows/ci.yml` (`cargo` job, `continue-on-error: true`).
- The drift-guard the flip must invert: `tests/integration/ci-matrix-parity.test.ts`
  (the STAGED cargo assertion, CF4a / v1.49.936).
- The discipline: `docs/static-analysis-tool-discipline.md` (#10463 flip gate; the new
  "Sibling gate (cargo lane)" note documents the lane-stability divergence).
- Prior milestone: v1.49.937 (CF4d — algebrus.eigen complex-serialization wire fix;
  campaign-complete).
