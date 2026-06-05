---
title: "v1.49.982 — outcome-driven retention substrate"
version: v1.49.982
date: 2026-06-05
summary: >
  Ship 5.2 makes the observation-retention auto-emit signal outcome-driven
  (an age-pressure band replaces the hardcoded too_aggressive) and adds a
  chokepoint guard that refuses --apply until the signal is verifiably
  bidirectional — closing the F4 retention debt without running any tick.
tags: [phase-5, bounded-learning, observation, retention, safety]
---

# v1.49.982 — outcome-driven retention substrate

**Shipped:** 2026-06-05

The v944 retention signal stopped lying: its hardcoded `too_aggressive` is replaced by a real age-pressure outcome, and a bidirectional-signal guard now blocks any false-vindication `--apply`.

## Why this ship

The F4 retention debt (`docs/retention-substrate-outcome-driven-debt.md`) tracked a degenerate auto-emit: `retention-substrate.ts` emitted `kind = 'too_aggressive'` on every sweep, so the on-disk signal was one-directional (26/26 `too_aggressive`, 0 `too_lax`). A calibration tick on that corpus would mechanically raise `observation.retention_days` as if it were learned evidence and flip `lastTick` non-null — a "false vindication worse than null." A read-only recon confirmed the band cannot be data-grounded today (drops are 1–13 vs a 1000 cap; `retainedCount` was never recorded), so the operator chose the **age-pressure** metric and a **structural fix + runtime guard** scope: make the signal capable of being bidirectional and start the clock, rather than fake a working loop.

## What shipped

- **Outcome-driven kind.** `deriveAgePressureKind` replaces the hardcoded constant: with `R = oldestRetainedAgeDays / retention_days` and band `[0.5, 0.9]`, a young surviving corpus → `too_lax` (lower the window), a packed edge with drops → `too_aggressive` (raise), in-band/empty → no emit.
- **The missing denominator.** `RetentionManager.pruneWithStats` surfaces `retainedCount` + `oldestRetainedAgeDays`; the sweep records `retainedCount` on every event. `prune()` delegates, preserving its number-returning contract.
- **Bidirectional apply-guard (Option D).** `applyRecommendation` refuses `--apply` for `observation.retention_days` unless the on-disk signal carries BOTH polarities. Dry-run is untouched; other thresholds are untouched. `refused` is a first-class outcome (exit 1, distinct audit-log state, surfaced in `--summary`/`--quiet`/text/json).

## Verification

- `npm run build` clean; full `npx vitest run` green (35,823 tests).
- **pre-tag-gate 20/20** (no new gate step; changes fold into existing suites).
- Adversarial ship review (step P): 5 findings → 2 refuted, 2 confirmed-and-fixed (guard auditability + a non-discriminating test), 1 partial-duplicate.
- No calibration tick (dry-run or `--apply`) was run.

## Engine state

NASA degree **1.178** · counter-cadence **29** · manifest lessons **152** — all unchanged (forward Phase-5 fix; no lesson promoted). No `cadence_advances`.
