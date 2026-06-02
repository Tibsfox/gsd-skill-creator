---
title: "Context"
chapter: 99-context
version: v1.49.944
date: 2026-06-01
summary: "Where v1.49.944 sits in the larger arc."
tags: [context, counter-cadence, consume]
---

# v1.49.944 — Context

## Milestone metadata

- **Version:** v1.49.944
- **Type:** Counter-cadence (consume axis)
- **Predecessor:** v1.49.943 (defer-biased-gate Set-boundary lesson #10464 + named-transparency pins, counter-cadence #22, codify)
- **NASA degree:** 1.178 (unchanged — degree-non-advancing maintenance)
- **Counter-cadence count:** 23 (prior #22 = v1.49.943)

## Where this sits

- A **counter-cadence consume ship** scoped from the v1.49.943 meta-cadence overdue-check. The four-axis sweep found no axis literally overdue (codify just drained at v943; verify fully covered; calibrate's `>=20 obs AND >=10 ships` conjunct unmet; consume's `wired:false` registry hits were defensive catch-alls for non-existent threshold classes). But the source revealed one genuine gap: the `observation.retention_days` substrate had zero production callers.
- It closes the #10428 consume gap and the #10439 substrate auto-recorder half for `observation.retention_days`: the calibration loop now receives traffic-attributed observations for the first time.
- It follows the consume/verify campaign of the v929-v937 carry-forward arc (which closed CF1-CF4d) and the codify ships v943/v942 — alternating the operational axes per the meta-cadence discipline.

## Files changed

- `src/observation/session-observer.ts` — **+~20 lines.** New optional 4th constructor arg `observationRetentionDays?`; `onSessionEnd` routes the `sessions.jsonl` prune through `runObservationRetentionSweep(...)` when set (prune + fire-and-forget auto-emit), else the legacy `RetentionManager.prune()`.
- `src/hooks/session-end.ts` — **+~16 lines.** Best-effort `readIntegrationConfig()` to extract `observation.retention_days` (default 90; swallow-on-throw -> legacy prune); threaded to `new SessionObserver(undefined, undefined, undefined, retentionDays)`.
- `src/observation/session-observer.test.ts` — **+~84 lines.** New `describe('observation.retention_days substrate wire (consume)')` with positive (event emitted, kind `too_aggressive`, `retentionDays 90`) + negative (no threading -> no event) tests; positive mutation-proven.
- `docs/release-notes/v1.49.944/` — milestone notes (README + 00/03/04/99 chapters).

The v891 substrate `src/observation/retention-substrate.ts` is **unchanged** — this ship consumes it, it does not modify it.

## Behavior changes (reversible)

- **Retention 30 -> 90 days.** The session-end prune now honors `observation.retention_days` (default 90) instead of the legacy hardcoded `maxAgeDays=30` it had been silently ignoring (a latent-bug-fix). Override via `.planning/skill-creator.json`.
- **No `maxEntries=100` count cap at this path.** The substrate is age-only; `sessions.jsonl` is bounded by age x filtered inflow. `observation.max_entries` (1000) wiring deferred to a future consume ship.

## Test posture

- `npx tsc --noEmit` clean.
- Affected scope (`src/observation`, `src/hooks`, `src/bounded-learning`, the v894 integration test): **520/520 pass**.
- The two new tests pass; the positive is mutation-proven (forcing the legacy branch reds it with "expected 0 to be >= 1"; restored).
- 3-lens adversarial review: correctness CLEAN, 0 confirmed bugs; behavior changes documented; the fire-and-forget-in-short-lived-hook concern independently disproven.
- Full pre-tag-gate: 18/18 PASS.

## Engine state at close

- NASA degree 1.178 (unchanged).
- Counter-cadence count 23.
- Manifest: **151 lessons** (unchanged — a consume ship applies lessons, it promotes none).
- Architecture gaps: 6/7 closed-or-intentional (unchanged).

## References

- The substrate consumed: `src/observation/retention-substrate.ts` (`runObservationRetentionSweep`, v1.49.891).
- The wire: `src/hooks/session-end.ts` (config load) + `src/observation/session-observer.ts` (`onSessionEnd` prune routing).
- The events sink + reader: `src/bounded-learning/observation-retention-events.ts`.
- The calibration read side: `src/bounded-learning/observation-sources.ts` (`loadObservationsForThreshold('observation.retention_days', ...)`), wired v1.49.884.
- The integration test that already proves the substrate-to-loop wire: `tests/integration/observation-retention-end-to-end.integration.test.ts` (v1.49.894).
- The meta-cadence discipline: `docs/meta-cadence-discipline.md` (#10428 consume axis, #10439 duality).
- Counter-cadence predecessor: v1.49.943 (#22).
