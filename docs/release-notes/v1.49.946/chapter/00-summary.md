# v1.49.946 — Summary

## The ship

A consume sibling of v1.49.944 that closes the deferred `observation.max_entries` half of the session-end retention wire.

v944 routed the session-end `sessions.jsonl` prune through the `observation.retention_days` substrate (`runObservationRetentionSweep`) for the AGE cap. Recon for this ship found the substrate was NOT age-only as v944 claimed: it builds `new RetentionManager({ maxAgeDays: retentionDays })`, leaving the COUNT cap at the hardcoded `DEFAULT_RETENTION_CONFIG.maxEntries = 100`. So the session-end prune silently capped `sessions.jsonl` at 100 entries (dormant until >100 entries), ignoring the operator's `observation.max_entries` (default 1000).

## The wire

Thread `observation.max_entries` through the same path that v944 used for `retention_days`:

- **`src/observation/retention-substrate.ts`** — `ObservationRetentionConfig.observation` gains optional `max_entries?`; the manager is built with `{ maxAgeDays, maxEntries }` when threaded, else `{ maxAgeDays }` (default 100). `RetentionSweepResult` gains `maxEntries` (the effective cap).
- **`src/observation/session-observer.ts`** — new optional 5th ctor arg `observationMaxEntries?`, threaded into the substrate call.
- **`src/hooks/session-end.ts`** — loads `observation.max_entries` alongside `retention_days` (same best-effort try/catch per #10427) and passes it as the 5th arg.

`observation.max_entries` is a config knob (not a calibratable threshold — only `retention_days` is registered), so no new substrate/events.

## Behavior change (reversible)

**Count cap 100 -> configured `max_entries` (default 1000), a latent-bug-fix.** A LOOSENING (keeps more), consistent with v944's age loosening (30 -> 90). At the 1000 cap, `sessions.jsonl` stays well under ~1 MB (entries are compact summaries). Override via `.planning/skill-creator.json` (range 100..100000).

## Calibration semantics (by-design, unchanged)

The per-sweep auto-emit's `droppedCount` now includes count-cap drops, attributed to `retention_days` calibration. Rare (only above the cap) and within the v891 conservative-default contract; no emit-logic change.

## Verification

- tsc clean; affected scope 451/451; both new behavior tests mutation-proven; backward-compat default-100 test green; full vitest suite green standalone.
- 3-lens adversarial review (correctness / behavior-semantics / scope-failure): 17 CLEAN + 1 acceptable CONCERN.
- Also fixed: the v894 retention integration assertion made order-independent per #10453 (was flaking on racing fire-and-forget emits).
- Pre-tag-gate 17/18 PASS; `vitest` step bypassed (operator-authorized) for a pre-existing unrelated M4 branches concurrency flake under local high-parallelism — filed as a follow-up; CI is the backstop. See README "Gate note".

## Engine state

NASA 1.178 (unchanged), counter-cadence **#23** (unchanged), manifest **151** (unchanged — applies #10428 consume, promotes no lesson).
