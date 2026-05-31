---
title: "Context"
chapter: 99-context
version: v1.49.932
date: 2026-05-31
summary: "Where v1.49.932 sits in the larger arc."
tags: [context]
---

# v1.49.932 — Context

## Where this sits

- A recovery ship within the **v929-carry-forward campaign**, immediately after
  CF2a (v1.49.931). It fixes the red-CI regression v931 introduced and hardens the
  gate so the class cannot recur.
- Sequence: CF1 (v930, `.college/`→`src/` gate) → CF2a (v931, in-branch stochastic
  selector wire — shipped with a red test) → **v932 (this — fixture fix + integration
  gate step 2.8 + corrected version bump)** → CF2b / CF3 / CF4 still to come.
- Pairs with the v928 macOS-load-bearing arc: now that macOS CI is ship-blocking,
  closing the local-gate/CI coverage gap matters more — the gate should run what CI
  runs, before the tag.

## Engine state

- NASA degree 1.178 (unchanged).
- counter-cadence 20 (unchanged — recovery + gate hardening, forward work).
- manifest 150 lessons (no new lesson; #10461 + #10436 instance).
- Version manifests advance to 1.49.932 (correcting the v930/v931 no-op bump). The
  v930/v931 tags keep their stale internal version by operator decision.
- Architecture gaps unchanged: 6/7 closed-or-intentional.

## References

- The fixture fix: `tests/integration/branch-variant-stochastic-wire.integration.test.ts`.
- The gate step: `tools/pre-tag-gate.sh` step 2.8 (`npx vitest run --project integration`).
- The CI step it mirrors: `.github/workflows/ci.yml:69`.
- The root config that excludes integration from step 2: `vitest.config.ts`.
- Prior milestone: v1.49.931 (in-branch stochastic selector wire, CF2a).
