---
title: "v1.49.928 — Flip the macOS CI Matrix Leg to Load-Bearing (#10463 rung 3)"
version: v1.49.928
date: 2026-05-31
summary: >
  The macos-latest matrix leg in ci.yml is now load-bearing: the gated
  continue-on-error was deleted, so a macOS failure blocks a ship exactly like
  ubuntu. This completes the #10463 three-rung staged-CI-lane sequence, gated on
  the macos-flip-readiness checker reaching READY 3/3 across organic churn.
tags: [ci, macos, cross-platform, "#10463", gate-not-vigilance, drift-guard]
---

# v1.49.928 — Flip the macOS CI Matrix Leg to Load-Bearing (#10463 rung 3)

**Shipped:** 2026-05-31

One-line: delete the `macos-latest`-gated `continue-on-error` from `ci.yml` so the
macOS test leg contributes to the run-level conclusion the ship gate reads — making
it ship-blocking like the ubuntu leg — and invert the paired drift-guard. This is
the third and final rung of the #10463 staged-CI-lane sequence.

## What shipped

- **The flip** (`.github/workflows/ci.yml`): the `continue-on-error: ${{ matrix.os
  == 'macos-latest' }}` line is gone. Both matrix legs (`ubuntu-latest`,
  `macos-latest`) are now load-bearing; `fail-fast: false` is preserved so neither
  leg cancels the other. The gate condition: the `macos-flip-readiness` checker
  reached **READY — streak 3/3** across organic development churn (greens #2/#3
  banked at v926/v927), so a deterministic verdict drove the flip (gate-not-vigilance,
  #10428/#10463).
- **The paired drift-guard inversion** (`tests/integration/ci-matrix-parity.test.ts`,
  mandatory per #10461): the STAGED assertions (that `continue-on-error` EXISTS,
  count == 1) became LOAD-BEARING assertions (the gated line is GONE, count == 0).
  Mutation-proven: re-staging `continue-on-error` makes exactly two assertions fail.
- **Documentation honesty** (`tools/render-claude-md/disciplines.json` #10463 +
  `docs/static-analysis-tool-discipline.md`): "flip pending / NOT READY streak 1/3"
  → "flip EXECUTED at v1.49.928 / READY 3/3"; the guard now pins the line's absence.
- **Lifecycle-aware readiness checker** (`tools/ci/macos-flip-readiness.mjs`): the
  tool now reads `ci.yml` (`detectFlipState()`) and, once the leg is load-bearing,
  switches its READY guidance from "safe to flip: delete `continue-on-error`" to
  "already flipped (v1.49.928) — here is how to REVERT". This closed a
  self-referential #10427 surfaced by the ship's own adversarial review (a flip-gate
  tool that keeps telling you to do the already-done action is stale guidance).

## Why

The macOS lane was promoted in deliberate rungs (decoupled nightly lane v920 →
non-blocking matrix leg v923 → **load-bearing flip v928**) rather than full-promoted
straight into the ship-blocking matrix, where an unproven flaky leg could red-block a
release at T14. The flip waited for an empirical green track record across organic
churn, made deterministic by the readiness checker.

## Verification

- `ci-matrix-parity.test.ts` 9/9 (the inverted guard; mutation-killed the re-stage).
- `macos-flip-readiness.test.mjs` 33/33 (26 originals preserved + 7 new:
  `detectFlipState` pure cases + `--ci-file` staged-vs-flipped guidance + flipState
  JSON). `tsc --noEmit` clean.
- 3-lens adversarial review (CI/YAML semantics / drift-guard test quality / doc
  completeness+honesty): lenses 1-2 CLEAN; lens 3 surfaced 1 BLOCKER + 1 WARN on the
  readiness tool's stale post-flip guidance — both fixed in this ship.
- CI green on the feat commit across **both** ubuntu and macOS — the macOS leg's
  first run as a load-bearing gate.

## Links

- Summary: [00-summary](chapter/00-summary.md)
- Retrospective: [03-retrospective](chapter/03-retrospective.md)
- Lessons: [04-lessons](chapter/04-lessons.md)
- Context: [99-context](chapter/99-context.md)

[release-notes index](../INDEX.md)
