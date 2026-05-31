---
title: "Context"
chapter: 99-context
version: v1.49.928
date: 2026-05-31
summary: "Where v1.49.928 sits in the larger arc."
tags: [context]
---

# v1.49.928 — Context

## Where this sits

- Completes the cross-platform-CI arc that ran v920 → v928: a decoupled nightly macOS
  lane (v920, #10461 parity guard), folded into the `ci.yml` matrix as a STAGED
  non-blocking leg (v923), operationalized with a deterministic readiness checker
  (v925), codified as lesson #10463 (v924), and now flipped to LOAD-BEARING (v928).
- Forward operational work between counter-cadence milestones — the macOS leg is the
  first non-ubuntu platform to gate ships, raising the cross-platform floor.

## Engine state

- NASA degree 1.178 (143 ships).
- counter-cadence 20 (unchanged — forward operational work, not a cleanup milestone).
- manifest 150 lessons (#10463 updated in place; no new lesson this ship).
- macOS matrix leg: STAGED (non-blocking) → **LOAD-BEARING** (ship-blocking).

## References

- The flip: `.github/workflows/ci.yml` (`test` job, `strategy.matrix.os`).
- The drift-guard (inverted): `tests/integration/ci-matrix-parity.test.ts`.
- The readiness checker (now lifecycle-aware): `tools/ci/macos-flip-readiness.mjs` +
  `tools/ci/__tests__/macos-flip-readiness.test.mjs`.
- The lesson: #10463 (Static-analysis tool authoring) in
  `docs/static-analysis-tool-discipline.md` + `tools/render-claude-md/disciplines.json`.
- Prior milestone: v1.49.927 (MA-3 stochastic bridge wired into the M5 selector).
