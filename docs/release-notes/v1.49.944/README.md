---
title: "v1.49.944 — wire the session-end prune through the observation.retention_days substrate (counter-cadence consume)"
version: v1.49.944
date: 2026-06-01
summary: >
  Counter-cadence consume ship (#23) that closes the genuine consume gap the
  v1.49.943 meta-cadence overdue-check surfaced: the observation.retention_days
  calibratable-threshold substrate (runObservationRetentionSweep, shipped v891)
  had a unit test and an integration test but ZERO production callers, so the
  calibration loop never received any traffic-attributed observations. This ship
  wires it: the session-end hook loads observation.retention_days from the
  integration config (default 90) and threads it to SessionObserver, whose
  onSessionEnd prune now routes through the substrate — pruning sessions.jsonl by
  the configured retention AND fire-and-forget auto-emitting one
  ObservationRetentionEvent per sweep. This is the first production caller of
  runObservationRetentionSweep, closing the #10428 consume gap and the #10439
  substrate auto-recorder half. Side-effect (latent-bug-fix): the session-end
  prune now honors the configured retention (default 90 days) instead of the
  hardcoded legacy default (30) it had been silently ignoring.
tags: [feat, observation, counter-cadence, consume, bounded-learning, calibration, retention, lesson-10428, lesson-10439]
---

# v1.49.944 — wire the session-end prune through the observation.retention_days substrate (counter-cadence consume)

**Shipped:** 2026-06-01

One-line: the `observation.retention_days` substrate (`runObservationRetentionSweep`, v891) gains its **first production caller** — the session-end prune now routes through it, so each sweep is governed by the operator's configured retention and emits a traffic-attributed observation for the bounded-learning calibration loop.

## Why this ship

v1.49.943 was a codify ship; after it, the four-axis meta-cadence overdue-check was run to scope the next counter-cadence. The literal triggers found **no axis overdue** (codify just drained; verify fully covered; calibrate's `>=20 observations AND >=10 ships` conjunct unmet — the most-populated threshold had only 12 committed observations; consume's `wired:false` registry entries were defensive catch-alls for non-existent future threshold classes, a false positive).

But the sweep surfaced one **genuine** gap. The `observation.retention_days` calibratable threshold had:

- a **read side** wired at v1.49.884 (the calibration loop can load observation-retention events),
- a **substrate** `src/observation/retention-substrate.ts::runObservationRetentionSweep` shipped at v1.49.891 (prunes a JSONL by `retention_days` AND auto-emits an `ObservationRetentionEvent`),
- a **unit test** plus an **integration test** (v1.49.894),
- and **zero production callers**.

The substrate existed and was proven, but nothing in production invoked it — so `observation-retention-events.jsonl` was never written and the calibration loop had nothing to calibrate on. That is the #10428 consume shape (a substrate with no non-test caller, here ~53 ships past the <=6-ship target) and the missing third ship of the #10439 substrate auto-recorder duality. The operator named the **consume axis** for counter-cadence #23 and chose this wire.

## What shipped

The session-end path is the natural production home: it is the observation lifecycle's endpoint, it already pruned `sessions.jsonl`, and it runs on every real session end via the Claude Code session-end hook.

- **`src/hooks/session-end.ts`** — best-effort loads the integration config (`readIntegrationConfig()`; default path `.planning/skill-creator.json`) and extracts `observation.retention_days`, threading it to the observer. A missing config yields the schema default (90); a malformed config falls back to `undefined` (legacy prune). Config-load is an accessory surface per Lesson #10427 — it MUST NOT break session observation, so the read is wrapped in a swallow-on-throw try/catch.
- **`src/observation/session-observer.ts`** — a new optional 4th constructor parameter `observationRetentionDays?: number`. When set, `onSessionEnd`'s prune of `sessions.jsonl` routes through `runObservationRetentionSweep({ observation: { retention_days } }, sessionsFile, { eventsPath })` (prune + auto-emit) instead of the bare `RetentionManager.prune()`. When unset, the legacy prune is preserved (backward-compatible — `session-start.ts` and existing callers/tests are unaffected; session-start never prunes, so it needs no threading).
- **`src/observation/session-observer.test.ts`** — two tests: the positive (a threaded `retention_days=90` emits an `ObservationRetentionEvent` of kind `too_aggressive` with `retentionDays: 90`) and the negative (no threading -> no event, legacy prune). The positive assertion is **mutation-proven**: forcing the legacy branch yields "expected 0 to be >= 1".

No change to the v891 substrate, the calibration loop, or any other `src/` surface. This is a wire, not a substrate ship.

## Behavior changes (reversible; documented)

Routing the session-end prune through the substrate adopts the substrate's age-governed semantics. Two consequences, both surfaced by the pre-ship adversarial review:

1. **Retention 30 -> 90 days (latent-bug-fix).** The legacy prune used the `RetentionManager` default `maxAgeDays=30`, which **ignored** the configured `observation.retention_days=90`. The substrate honors the config. So the session-end prune now keeps `sessions.jsonl` entries for the configured 90 days rather than silently capping at 30. Operators who prefer tighter retention set `observation.retention_days` in `.planning/skill-creator.json`.
2. **The legacy `maxEntries=100` count cap is not applied at this path.** The substrate is age-only by design (it is the `observation.retention_days` substrate). `sessions.jsonl` stays bounded by age (90 days) times filtered inflow — only HIGH-SIGNAL sessions persist; most go ephemeral/squashed. (Note the legacy 100 cap was itself wrong: the config's `observation.max_entries` is 1000.) Wiring `observation.max_entries` is a **separate future consume ship**, not folded here, to keep the scope to one threshold.

## Calibration semantics (acceptable-by-design)

The substrate auto-emits `too_aggressive` (-1, "keep more" — favors RAISING `retention_days`) on every sweep, even when nothing was pruned. This is the v891 substrate's documented conservative-bias contract: absence of explicit operator feedback defaults to "keep more"; operators who want tighter retention emit `too_lax` via `bounded-learning --record-event --threshold observation.retention_days --kind too_lax`. The bounded-learning loop's dead-zone (MB-5) and projection (MB-2) guards bound the drift; it will not run away to the 365-day schema maximum from traffic alone. This ship makes that designed signal start flowing for the first time.

## Verification

- `npx tsc --noEmit` — clean.
- Affected scope (`src/observation`, `src/hooks`, `src/bounded-learning`, the v894 integration test) — **520/520 pass**.
- The two new tests run by name and pass; the positive is **mutation-proven** (disabling the wire reds it with "expected 0 to be >= 1"; restored).
- A 3-lens adversarial review (correctness / behavior-change / failure-semantics) ran before T14: **correctness CLEAN, 0 confirmed bugs**. The CONCERNS were the two documented behavior changes and the acceptable-by-design calibration bias. The one purpose-critical concern (could the fire-and-forget emit be lost in the short-lived hook process?) was independently disproven: the pending `appendFile` is an active libuv handle that keeps the process alive until the write completes, and the success path never calls `process.exit()`.
- Full pre-tag-gate: all 18 steps PASS.

## What this ship deliberately does NOT do

- It does **not** modify the v891 substrate (`runObservationRetentionSweep`) or widen its age-only signature.
- It does **not** wire `observation.max_entries` (a distinct threshold — separate future consume ship).
- It does **not** thread retention into `session-start.ts` (which only caches, never prunes).
- It does **not** add a new calibratable threshold, so it opens no new verify-axis window — the v894 integration test already covers the substrate-to-loop wire.

## Engine state

NASA degree **1.178** (unchanged — degree-non-advancing maintenance). **Counter-cadence #23** (prior #22 = v1.49.943). Manifest **151** (unchanged — a consume ship promotes no lesson; it applies #10428 + #10439).
