# v1.49.884 — Bounded-Learning Verify-Axis Chip: observation.retention_days Read-Side Wire

**Released:** 2026-05-28

## Why this ship

First of the v884-v886 "alternatives" sub-campaign — operator selected `Bounded → LoaderCtx → Counter` order at session start. Per the v883 handoff's option 4: the verify-overdue scanner flagged 2 UNWIRED thresholds (`token_budget.max_percent`, `observation.retention_days`). v884 wires the read side for `observation.retention_days` plus CLI manual recorder; substrate auto-emit deferred to a future ship per the #10439 staging convention (mirrors v837 → v845/v846 for predictive).

Tight scope per the meta-cadence calibrate-axis pattern: observation source registration + CLI manual recorder + tests, no substrate auto-emit yet (the consume-axis half is deferred until a retention-sweep substrate consumer exists).

## What's in this ship

- **New module** `src/bounded-learning/observation-retention-events.ts` — mirror of v837's `predictive-low-confidence-events.ts`. Event kinds `too_aggressive` (favor raise, value -1) and `too_lax` (favor lower, value +1). Same polarity shape as token-budget; distinct from predictive's inverted shape. Append/read JSONL I/O at `.planning/patterns/observation-retention-events.jsonl`. Failure contract per #10427 (best-effort silent at the call-site boundary).
- **observation-sources.ts dispatch** — `observation.retention_days` now classified as WIRED (`wired: true`) with sourceId `observation-retention-events`. `loadObservationsForThreshold` dispatches to the new module's read path. New `observationRetentionEventsPath` option on `ObservationLoaderOptions`.
- **bounded-learning index.ts exports** — adds new module's surface to the public API (aliased to avoid `eventKindToValue` collision with token-budget exports).
- **bounded-learning CLI** — adds `observation.retention_days` to `SUPPORTED_THRESHOLDS`. New `runRecordObservationRetentionEvent` branch in `--record-event` dispatch handling `--kind too_aggressive|too_lax` + optional `--dropped-count`, `--retained-count`, `--retention-days`, `--reason`, `--observation-retention-events <path>` flags. Best-effort silent write per #10427.
- **Tests:** new `observation-retention-events.test.ts` (13 tests covering polarity map, observation lifter, JSONL I/O round-trip, malformed-line tolerance, unknown-kind/missing-field skipping). `observation-sources.test.ts` updated for the wired-status flip (was `wired: false`, now `wired: true`) and a new read-path round-trip test. `bounded-learning.test.ts` --summary mode test updated (was 5 thresholds, now 6).
- **Manifest update:** `tools/calibratable/verify-overdue-scan.mjs` notes field updated for `observation.retention_days` — explicit READ-SIDE WIRED v884 marker; `wired_first_caller_ship` left null pending substrate auto-emit ship.

## What this ship is

- A calibrate-axis verify chip per #10428 / #10438 / #10439.
- Read-side wire only (mirrors v837 staging — operator-attributed CLI input flows now; traffic-attributed substrate auto-emit deferred).
- One threshold of two UNWIRED (`token_budget.max_percent` still pending a future ship).
- Within the codify cadence — no new disciplines codified; existing patterns (#10427, #10439) applied.

## What this ship is not

- Not a substrate-consumer build (no observation-sweep CLI / no retention enforcement). The threshold remains a config value that is now CALIBRATABLE in principle but not yet ACTED ON.
- Not an integration test ship — verify-overdue scanner will continue to show UNWIRED until the substrate auto-emit + integration test both ship.
- Not a NASA degree advance (still 1.178; pressure-margin record extends to 102 consecutive ships).
- Not a chokepoint ship (Process + Egress KNOWN_UNWIRED both UNCHANGED at 0).
- Not a counter-cadence ship (counter-cadence count UNCHANGED at 6).

## Engine state

NASA degree sustains at 1.178 (UNCHANGED — **102 consecutive ships** at this degree; pressure-margin record extended by 1).
Counter-cadence count UNCHANGED at 6.
Manifest entries 23 (UNCHANGED).
Lessons in manifest 90 (UNCHANGED).
KNOWN_UNWIRED Process UNCHANGED at 0.
KNOWN_UNWIRED Egress UNCHANGED at 0.
Wired calibratable thresholds: 5 of 7 → still 5 (the read-side wire alone doesn't tick this; the scanner counts production callers, not CLI recorders). The `observation.retention_days` UNWIRED status will tick to WIRED once substrate auto-emit + integration test ship.
UNCODIFIED count: UNCHANGED (no new candidates codified this ship).
Pre-tag-gate step count: 18 (UNCHANGED — v869 cross-audit gate remains last step).

## Files touched

- `src/bounded-learning/observation-retention-events.ts` (NEW, +175 lines)
- `src/bounded-learning/observation-sources.ts` (UPDATED — dispatch + wired-flag flip + new option)
- `src/bounded-learning/index.ts` (UPDATED — added new exports with alias)
- `src/bounded-learning/__tests__/observation-retention-events.test.ts` (NEW, +159 lines)
- `src/bounded-learning/__tests__/observation-sources.test.ts` (UPDATED — wired-flag test flipped, new read-path test added)
- `src/cli/commands/bounded-learning.ts` (UPDATED — supported-thresholds list + dispatch branch + recorder function)
- `src/cli/commands/bounded-learning.test.ts` (UPDATED — --summary assertion bumped 5 → 6)
- `tools/calibratable/verify-overdue-scan.mjs` (UPDATED — notes field for retention threshold)
- `docs/release-notes/v1.49.884/` (NEW chapter dir)
- `docs/release-notes/STORY.md` (UPDATED — chapter count + v884 entry)
- `package.json` + `package-lock.json` + `src-tauri/Cargo.toml` + `src-tauri/tauri.conf.json` (version bumps 1.49.883 → 1.49.884)
