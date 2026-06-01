---
title: "Context"
chapter: 99-context
version: v1.49.939
date: 2026-06-01
summary: "Where v1.49.939 sits in the larger arc."
tags: [context]
---

# v1.49.939 — Context

## Where this sits

- The **second and final rung** of the cargo lane flip-to-load-bearing track that the
  operator chose from the post-v929-campaign handoff. Rung 1 (v1.49.938) built the
  readiness gate; this ship (rung 2) executes the flip the gate authorized.
- The cargo lane was introduced STAGED at v1.49.936 (CF4a). Its promotion is a **two-rung**
  sequence (staged v936 → load-bearing v939) — there was no decoupled-nightly first rung,
  unlike the macOS lane's three-rung arc (v920 decoupled → v923 staged matrix leg → v928
  load-bearing flip).
- This is the **second** CI lane to become load-bearing via the #10463 gate, after the
  macOS matrix leg (v1.49.928). Both flips were driven by a deterministic readiness-gate
  verdict (gate-not-vigilance).

## Engine state

- NASA degree 1.178 (unchanged).
- counter-cadence 20 (unchanged — forward infra work).
- manifest 150 lessons (no new lesson; application of #10463 + #10461 + #10427, with the
  v938 carried-forward candidates intact).
- Architecture gaps unchanged: 6/7 closed-or-intentional.

## References

- The flip: `.github/workflows/ci.yml` (`cargo` job — `continue-on-error: true` deleted).
- The drift-guard pairing: `tests/integration/ci-matrix-parity.test.ts` (STAGED assertion
  inverted to pin the line's absence; mutation-proven).
- The gate that authorized it: `tools/ci/cargo-flip-readiness.mjs` (lane-stability model;
  built v1.49.938) with `tools/ci/__tests__/cargo-flip-readiness.test.mjs`.
- The macOS precedent: `tools/ci/macos-flip-readiness.mjs` (organic-churn model);
  the macOS flip executed at v1.49.928.
- The discipline: `docs/static-analysis-tool-discipline.md` (#10463; the sibling-gate note
  now records the cargo flip EXECUTED).
- Prior milestone: v1.49.938 (cargo lane flip-readiness gate — rung 1 of this track).
