---
title: "Context"
chapter: 99-context
version: v1.49.982
date: 2026-06-05
summary: "Where v1.49.982 sits in the larger arc."
tags: [context]
---

# v1.49.982 — Context

## Milestone metadata

- **Version:** v1.49.982
- **Type:** `feat(observation)` — outcome-driven retention substrate
- **Predecessor:** v1.49.981 (`1af869d75`, skill-mining default-on + bootstrap co-activation thresholds)
- **NASA degree:** 1.178 (unchanged)
- **Counter-cadence count:** 29 (unchanged)

## Where this sits

This is the third milestone of **Phase 5** (the strategic learning loop), after v1.49.980 (co-activation consumer wire) and v1.49.981 (skill-mining default-on). Ship 5.2 was the calibration candidate's hard pre-requisite: the bounded-learning calibration machinery has been wired, live, and tested since v884/v891, but `lastTick: null` everywhere because the only auto-emitted retention signal was degenerate. This ship makes that signal honest so a future calibration tick can be meaningful — it does not run the tick.

Remaining Phase-5 / backlog work after this: the 5.1c re-audit (needs accrued post-flip volume), a future single dry-run retention tick once the signal is verifiably bidirectional, Ship 5.3 (GAP-7 content-filter trip-vocab check), the automated config migrator, Phase 4 (Windows CI), and the amiga retire decision.

## Files changed

- `src/observation/retention-substrate.ts` — age-pressure band const/types, `deriveAgePressureKind`, `pruneWithStats`-based sweep, records `retainedCount`, neutral-on-empty.
- `src/observation/retention-manager.ts` — `PruneStats` + `pruneWithStats`; `prune()` delegates.
- `src/bounded-learning/threshold-writer.ts` — `refused` outcome + bidirectional apply-guard at the chokepoint.
- `src/bounded-learning/audit-log.ts` — `refused` as a first-class `applied` state.
- `src/cli/commands/bounded-learning.ts` — `refused` handling (exit 1, renderers, `--summary`), test-only `retentionEventsPath` injection.
- Tests: `retention-substrate.test.ts`, `session-observer.test.ts`, `threshold-writer.test.ts`, `bounded-learning.test.ts`, and the `observation-retention-end-to-end` integration test.

## Engine state at close

NASA degree **1.178** · counter-cadence **29** · manifest lessons **152** — all unchanged.
