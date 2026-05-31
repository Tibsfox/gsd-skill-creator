---
title: "Summary"
chapter: 00-summary
version: v1.49.928
date: 2026-05-31
summary: "What shipped in v1.49.928 and why."
tags: [summary]
---

# v1.49.928 — Summary

## What shipped

The third and final rung of the #10463 staged-CI-lane sequence: the `macos-latest`
matrix leg in `.github/workflows/ci.yml` is flipped from STAGED non-blocking to
**LOAD-BEARING**.

Four parts:

1. **The flip**: delete the `continue-on-error: ${{ matrix.os == 'macos-latest' }}`
   line. The macOS leg now contributes to the run-level conclusion the pre-tag-gate
   ci-gate reads, so a macOS failure blocks a ship like an ubuntu failure.
   `fail-fast: false` preserved.
2. **Drift-guard inversion** (mandatory per #10461): `ci-matrix-parity.test.ts`
   STAGED assertions (line EXISTS, count == 1) → LOAD-BEARING (line GONE, count == 0).
   A silent re-stage now fails the guard (mutation-proven).
3. **Doc honesty**: `disciplines.json` #10463 + `docs/static-analysis-tool-discipline.md`
   updated from "flip pending / NOT READY 1/3" to "executed v928 / READY 3/3".
4. **Lifecycle-aware tool**: `macos-flip-readiness.mjs` reads ci.yml and switches its
   post-flip guidance to "already flipped / how to revert" (fixes a self-referential
   #10427 the ship's own review caught).

## Numbers

- `ci-matrix-parity` 9/9 (mutation-killed); `macos-flip-readiness` 33/33 (26 + 7 new);
  tsc clean.
- 3-lens adversarial review: lenses 1-2 clean; lens 3 found 1 BLOCKER + 1 WARN on the
  tool's stale guidance → fixed in-ship.
- counter-cadence unchanged at 20 (forward operational work); manifest stays 150
  (#10463 updated in place, no new lesson).

## Next

The flip closes a long-running carry-forward. Follow-on consume-axis work: wire the
College concept-fallback into live dispatch; an in-loop production caller of the
stochastic selector path (from v927); other dormant substrates (eligibility /
langevin / temperature). Monitor the macOS leg over the next 2-3 ships for any latent
flake now that it is ship-blocking (reversion path documented in the drift-guard).
