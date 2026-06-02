---
title: "Context"
chapter: 99-context
version: v1.49.946
date: 2026-06-01
summary: "Where v1.49.946 sits in the larger arc."
tags: [context, consume, retention, max-entries, config]
---

# v1.49.946 — Context

## Milestone metadata

- **Version:** v1.49.946
- **Type:** `feat` / consume (config-honoring wire; latent-bug-fix)
- **Predecessor:** v1.49.945 (serialize ANTHROPIC_API_KEY env-var Rust tests; close v939 cargo-lane flake)
- **NASA degree:** 1.178 (unchanged — degree-non-advancing maintenance)
- **Counter-cadence count:** 23 (unchanged — a config-honoring sibling, not a counter-cadence cleanup)

## Where this sits

- The direct sibling of **v1.49.944**, the consume ship that gave the `observation.retention_days` substrate its first production caller (the session-end prune). v944 honored the AGE cap; this ship honors the COUNT cap, completing the config-honoring retention wire for the `observation` block's two prune dimensions.
- It follows v1.49.945 (the cargo test-race fix). Like that ship, it is recon-corrected: ship #1 found the env race spanned two files (not the one the handoff named); this ship found the substrate applies a dormant count cap of 100 (not "age-only" as the v944 chapters claimed).

## Files changed

- `src/observation/retention-substrate.ts` — **+~14 lines.** `ObservationRetentionConfig.observation` gains optional `max_entries?`; `runObservationRetentionSweep` builds the manager with `{ maxAgeDays, maxEntries }` when threaded (else `{ maxAgeDays }` -> default 100); `RetentionSweepResult` gains `maxEntries` (effective cap via `manager.getConfig().maxEntries`).
- `src/observation/session-observer.ts` — **+~8 lines.** New optional 5th ctor arg `observationMaxEntries?`, stored and threaded into the `runObservationRetentionSweep` call's `config.observation.max_entries`.
- `src/hooks/session-end.ts` — **+~6 lines.** Loads `config.observation.max_entries` alongside `retention_days` (same best-effort try/catch; both undefined on throw) and passes it as the 5th ctor arg.
- `src/observation/retention-substrate.test.ts` — **+~40 lines.** Count-cap test (5 entries, cap 2 -> 3 pruned) + backward-compat default-100 test.
- `src/observation/session-observer.test.ts` — **+~24 lines.** Wire test (pre-seed 5 entries, 5th arg cap 2 -> exactly 2 survive).
- `tests/integration/observation-retention-end-to-end.integration.test.ts` — **~6 lines.** v894 multi-sweep assertion made order-independent per #10453 (was `toEqual([-1,-1,1])` on racing fire-and-forget emits; now count-by-polarity + net). Committed separately as `test(observation): ...`.
- `docs/release-notes/v1.49.946/` — milestone notes (README + 00/03/04/99 chapters).

No new substrate, event type, or calibration-loop change. The v891 substrate is extended (one optional config field), not replaced.

## The latent bug, precisely

- `RetentionManager.prune` (`src/observation/retention-manager.ts`) applies an age filter AND a count cap (`if (pruned.length > maxEntries) keep newest maxEntries`).
- `DEFAULT_RETENTION_CONFIG = { maxEntries: 100, maxAgeDays: 30 }` (`src/types/observation.ts`).
- The v944 substrate did `new RetentionManager({ maxAgeDays: retentionDays })` -> `maxEntries` defaulted to 100.
- The config schema default is `observation.max_entries = 1000` (`src/integration/config/schema.ts`, range 100..100000).
- Net: the session-end prune capped `sessions.jsonl` at 100 (dormant below 100 entries), not the configured 1000. Fixed here.

## Behavior change (reversible)

- **Count cap 100 -> configured `max_entries` (default 1000).** A loosening (keeps more), consistent with v944's age loosening. Override via `.planning/skill-creator.json`.

## Test posture

- `npx tsc --noEmit` clean.
- Affected scope (`src/observation`, `src/hooks`, `src/bounded-learning`, v894 integration): **451/451 pass**.
- Both new behavior tests mutation-proven (break the substrate `max_entries` threading -> both red; backward-compat default-100 test stays green); restored.
- 3-lens adversarial review (correctness / behavior-semantics / scope-failure): 17 CLEAN + 1 acceptable CONCERN.
- Full vitest suite passes standalone (35668 passed). Pre-tag-gate: 17/18 PASS; `vitest` step bypassed via `SC_PRE_TAG_GATE_BYPASS=vitest` (operator-authorized) due to a pre-existing unrelated M4 branches concurrency flake under local high-parallelism contention — see README "Gate note + follow-up". CI is the authoritative backstop.

## Engine state at close

- NASA degree 1.178 (unchanged).
- Counter-cadence count 23 (unchanged).
- Manifest: **151 lessons** (unchanged — applies #10428 consume; promotes none).
- Architecture gaps: 6/7 closed-or-intentional (unchanged).
- Dependency security: 0 high+ vulnerabilities (no dependency added).

## References

- The substrate extended: `src/observation/retention-substrate.ts` (`runObservationRetentionSweep`, v1.49.891).
- The wire path: `src/hooks/session-end.ts` -> `src/observation/session-observer.ts` (`onSessionEnd`) -> the substrate.
- The prune mechanism: `src/observation/retention-manager.ts` (`prune` applies age + count); defaults `src/types/observation.ts`.
- The config field: `src/integration/config/schema.ts` (`observation.max_entries`, default 1000).
- The predecessor consume ship: v1.49.944 (`observation.retention_days` first production caller).
- The integration test proving the substrate-to-loop wire: `tests/integration/observation-retention-end-to-end.integration.test.ts` (v1.49.894).
