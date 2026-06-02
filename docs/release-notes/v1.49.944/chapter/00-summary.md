# v1.49.944 — Summary

## The ship

A counter-cadence **consume** ship (#23) that gives the `observation.retention_days` substrate its **first production caller**.

The v1.49.943 meta-cadence overdue-check found no axis literally overdue, but surfaced one genuine gap: `src/observation/retention-substrate.ts::runObservationRetentionSweep` (shipped v1.49.891) had a unit test and an integration test (v894) but **zero production callers**. So `observation-retention-events.jsonl` was never written, and the bounded-learning calibration loop had no traffic-attributed observations for the threshold. That is the #10428 consume shape and the missing third ship of the #10439 substrate auto-recorder duality.

## The wire

The session-end path is the production home — the observation lifecycle's endpoint, already pruning `sessions.jsonl`, run on every session end via the Claude Code hook.

- **`src/hooks/session-end.ts`** — best-effort loads `observation.retention_days` from the integration config (default 90) and threads it to `SessionObserver`. Config-load is accessory (Lesson #10427): a missing config uses the default; a malformed config falls back to the legacy prune.
- **`src/observation/session-observer.ts`** — new optional 4th constructor arg `observationRetentionDays?`. When set, `onSessionEnd`'s prune routes through `runObservationRetentionSweep(...)` (prune by retention + fire-and-forget auto-emit). When unset, the legacy `RetentionManager.prune()` is preserved.
- **`src/observation/session-observer.test.ts`** — positive (threaded -> event emitted, kind `too_aggressive`, `retentionDays 90`) + negative (unthreaded -> no event). Positive is mutation-proven.

## Behavior changes (reversible)

1. **Retention 30 -> 90 days (latent-bug-fix).** The legacy prune used `RetentionManager` default `maxAgeDays=30`, ignoring the configured `retention_days=90`. The substrate honors the config. Operators set `observation.retention_days` to override.
2. **No `maxEntries=100` cap at this path.** The substrate is age-only by design; `sessions.jsonl` stays bounded by age (90 days) x filtered inflow (only high-signal sessions persist). Wiring `observation.max_entries` is a separate future consume ship.

## Calibration semantics (by-design)

The substrate emits `too_aggressive` (-1, keep-more bias) per sweep — the v891 conservative-default contract; operators flip to `too_lax` via CLI. Bounded-learning dead-zone + projection guards bound the drift.

## Verification

- tsc clean; affected scope 520/520; both new tests pass; positive mutation-proven.
- 3-lens adversarial review: correctness CLEAN, 0 bugs. The fire-and-forget-emit-in-a-short-lived-hook concern was independently disproven (pending fs handle keeps the process alive).
- Full pre-tag-gate 18/18 PASS.

## Engine state

NASA 1.178 (unchanged), counter-cadence **#23** (prior #22 = v1.49.943), manifest **151** (unchanged — a consume ship promotes no lesson; it applies #10428 + #10439).
