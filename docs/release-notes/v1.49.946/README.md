---
title: "v1.49.946 — honor observation.max_entries in the session-end prune (count-cap config wire)"
version: v1.49.946
date: 2026-06-01
summary: >
  Consume sibling of v1.49.944 that closes the deferred max_entries half of the
  session-end retention wire. v944 routed the session-end prune through the
  observation.retention_days substrate (runObservationRetentionSweep) for the AGE
  cap, but the substrate built its RetentionManager as
  `new RetentionManager({ maxAgeDays: retentionDays })`, leaving the COUNT cap at
  the hardcoded DEFAULT_RETENTION_CONFIG.maxEntries = 100 — so the session-end
  prune silently capped sessions.jsonl at 100 entries, ignoring the operator's
  observation.max_entries (schema default 1000). This ship threads
  observation.max_entries through the same path (session-end hook -> SessionObserver
  5th ctor arg -> substrate config -> RetentionManager) so the count cap honors
  config. observation.max_entries is a config knob (not a calibratable threshold),
  so no new substrate/events — just the existing one taught to pass the count cap
  through. Backward-compatible (callers threading only retention_days keep the
  default 100). Latent-bug-fix: the dormant 100-entry cap (active only above 100
  high-signal sessions) now follows the configured 1000.
tags: [feat, observation, consume, retention, max-entries, config, latent-bug-fix, lesson-10428]
---

# v1.49.946 — honor observation.max_entries in the session-end prune (count-cap config wire)

**Shipped:** 2026-06-01

One-line: the session-end prune's count cap now honors the operator's `observation.max_entries` (default 1000) instead of the hardcoded `RetentionManager` default (100), completing the config-honoring retention wire that v1.49.944 began for the age dimension.

## Why this ship

v1.49.944 (consume #23) gave the `observation.retention_days` substrate its first production caller by routing the session-end `sessions.jsonl` prune through `runObservationRetentionSweep`. That fixed the **age** cap to honor config (30 -> 90 days). The v944 chapters described the substrate as "age-only" with "no `maxEntries` count cap at this path" and named wiring `observation.max_entries` as a separate future consume ship.

Recon for this ship found that description was inaccurate. The substrate builds its manager as `new RetentionManager({ maxAgeDays: retentionDays })` — and `RetentionManager` defaults `maxEntries` to `DEFAULT_RETENTION_CONFIG.maxEntries = 100` (`src/types/observation.ts`). `RetentionManager.prune` applies BOTH an age filter and a count cap (`if (pruned.length > maxEntries)`). So the substrate was never age-only: it applied a **count cap of 100**, just dormantly — the cap only fires once `sessions.jsonl` exceeds 100 entries, which is why it read as age-only at typical scale. The practical consequence: a heavy operator with more than 100 high-signal sessions inside the retention window has `sessions.jsonl` silently capped at 100, ignoring their configured `observation.max_entries` (default 1000).

This ship is the deferred max_entries half: thread the configured count cap through the same wire so both retention dimensions honor config.

## What shipped

- **`src/observation/retention-substrate.ts`** — `ObservationRetentionConfig.observation` gains an optional `max_entries?: number`. `runObservationRetentionSweep` now builds the manager with `{ maxAgeDays, maxEntries }` when `max_entries` is threaded, falling back to `{ maxAgeDays }` (default cap 100) when it is not — preserving prior behavior for callers that pass only `retention_days`. `RetentionSweepResult` gains a `maxEntries` field reporting the effective cap (the threaded value, or 100).
- **`src/observation/session-observer.ts`** — a new optional 5th constructor parameter `observationMaxEntries?: number`, threaded into the `runObservationRetentionSweep` call's `config.observation.max_entries`. Undefined leaves the substrate's default cap.
- **`src/hooks/session-end.ts`** — loads `observation.max_entries` alongside `observation.retention_days` from the integration config (same best-effort `readIntegrationConfig()` try/catch; a malformed config sets both to `undefined` and falls back to the legacy prune, per Lesson #10427) and passes it as the 5th constructor argument.
- **Tests** — `retention-substrate.test.ts`: a count-cap test (5 recent entries, `max_entries=2` -> 3 pruned, newest 2 kept) and a backward-compat test (no `max_entries` -> effective cap 100, nothing pruned). `session-observer.test.ts`: a wire test (pre-seed 5 recent entries, construct with the 5th arg `max_entries=2`, run a session -> exactly 2 survive). Both behavior tests are **mutation-proven** (breaking the substrate's `max_entries` threading reds both; the backward-compat default-100 test stays green).
- **`tests/integration/observation-retention-end-to-end.integration.test.ts`** (the v894 integration test for this substrate) — the multi-sweep accumulation assertion was changed from `toEqual([-1, -1, 1])` (an ordered sequence) to order-independent count-by-polarity + net assertions per Lesson **#10453**. The three per-sweep auto-emits are fire-and-forget (#10437) and race the shared JSONL, so the on-disk order is non-deterministic; the ordered assertion flaked under the gate's I/O load. This surfaced during ship #2's gate and is fixed here since it is the integration test for the substrate this ship modifies.

No new substrate, no new event type, no calibration-loop change. `observation.max_entries` is a config knob — only `observation.retention_days` is a registered calibratable threshold — so this is a config-honoring wire, not a new "first caller" consume.

## Behavior change (reversible; documented)

**Count cap 100 -> configured `max_entries` (default 1000) — latent-bug-fix.** The session-end prune now keeps up to the configured `observation.max_entries` newest `sessions.jsonl` entries instead of the hardcoded 100. This is a LOOSENING (keeps more), consistent with v944's age loosening (30 -> 90). At default config it raises the dormant cap from 100 to 1000; a `sessions.jsonl` entry is a compact session summary (a few hundred bytes), so even at the 1000 cap the file stays well under ~1 MB. Operators who prefer a tighter cap set `observation.max_entries` in `.planning/skill-creator.json` (schema range 100..100000).

## Calibration semantics (acceptable-by-design, unchanged contract)

The substrate's per-sweep auto-emit (kind `too_aggressive`) now reports a `droppedCount` that includes count-cap drops as well as age drops. Those count drops only occur above the (now higher) `max_entries` cap, which is rare, and the substrate already emits the conservative `too_aggressive` default on every sweep regardless of what was dropped — so this is within the v891 acceptable-by-design contract (the bounded-learning dead-zone + projection guards bound the drift). No emit-logic change; `max_entries` is not itself calibratable.

## Verification

- `npx tsc --noEmit` — clean.
- Affected scope (`src/observation`, `src/hooks`, `src/bounded-learning`, the v894 integration test) — **451/451 pass**.
- The two new behavior tests are **mutation-proven**: breaking the substrate's `max_entries` threading reds both ("expected 0 to be 3" at the substrate; "expected 5 to be 2" at the wire); the backward-compat default-100 test stays green; restored.
- A 3-lens adversarial review (correctness / behavior-semantics / scope-failure) ran before T14: 17 CLEAN + 1 acceptable CONCERN (config-load-failure falls back to the legacy 30-day/100-entry prune — pre-existing #10427 behavior, acknowledged in the retrospective).
- The full vitest suite passes **standalone** (35668 passed, run to completion multiple times).
- Pre-tag-gate: 17 of 18 steps PASS; the `vitest` step was bypassed for this ship via `SC_PRE_TAG_GATE_BYPASS=vitest` (see "Gate note" below). All other steps (build, depth-audit, completeness, catalog-index, drift checks, etc.) PASS.

## Gate note + follow-up (vitest bypass)

Ship #2's gate surfaced two pre-existing flakes under the gate's build->full-suite high-parallelism I/O contention (both pass standalone and on CI):

1. The v894 integration-test ordered assertion (#10453) — **fixed in this ship** (see above).
2. A **real M4 branches concurrency bug** (unrelated to this ship): `src/branches/commit.ts` `commit()` uses an atomic `fs.open(lockPath, 'ax')` for first-commit-wins, but the winner **unlinks the lock** mid-race (line 217), reopening the selection window so a late racer's `'ax'` open succeeds and **double-wins**. The N=5 concurrent-commit test (`src/branches/__tests__/commit.test.ts`) then sees 2 winners instead of 1. It is solid standalone (0/20) and passes on CI (lower contention); it manifests only under local high-parallelism full-suite load. This is a pre-existing bug (Phase 645), not a v946 regression.

Because the second flake is an unrelated M4 concurrency bug whose correct fix is a careful, separately-reviewed change, and because v946's own changes are fully verified (affected scope 451/451, full suite green standalone, review-approved), the operator authorized shipping v946 with the `vitest` gate step bypassed (CI is the authoritative backstop). **Follow-up:** the M4 branches first-commit-wins double-win is filed as a dedicated fix ship (the winner must not release the lock while concurrent racers may still be in their `'ax'` attempt).

## What this ship deliberately does NOT do

- It does **not** make `observation.max_entries` a calibratable threshold (no substrate, no event, no observation-source registration) — it is a config knob honored at the prune.
- It does **not** modify the auto-emit polarity or the calibration loop.
- It does **not** edit the v1.49.944 published chapters; the "age-only" inaccuracy is corrected here in the record rather than by rewriting history.
- It does **not** wire other `observation.*` config fields (`capture_corrections`) — out of scope.

## Engine state

NASA degree **1.178** (unchanged). **Counter-cadence #23** (unchanged — a config-honoring feat/consume sibling, not a counter-cadence cleanup). Manifest **151** (unchanged — applies #10428 consume; promotes no lesson).
