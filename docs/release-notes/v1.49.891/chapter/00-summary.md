# v1.49.891 — Substrate Auto-Emit: `observation.retention_days`

**Released:** 2026-05-28

## Why this ship

v884 wired the READ side (calibration loop can load events from JSONL). The substrate WRITE side has been deferred since then — no production code path reads `observation.retention_days` AND acts on it AND emits observability events. v891 closes that half. Mirrors v837 → v846 (predictive low-confidence wire → substrate auto-emit) and pairs symmetrically with v884 read-side wire.

Closing ship of the v887-v891 multi-ship session (operator-selected options 2 + 3 + 4 + 5 from the v886 handoff). v887 + v889 + v890 chipped LoaderContext; v888 wired bounded-learning read-side for token_budget.max_percent; v891 wires bounded-learning substrate auto-emit for observation.retention_days.

## What's in this ship

- **`src/observation/retention-substrate.ts`** (NEW — 110 LOC). `runObservationRetentionSweep(config, filePath, options)` function:
  - Reads `observation.retention_days` from a minimal `ObservationRetentionConfig` shape.
  - Constructs a `RetentionManager` with `maxAgeDays = retention_days`.
  - Runs `manager.prune(filePath)` to drop entries older than the threshold.
  - Auto-emits an `ObservationRetentionEvent` with default kind `'too_aggressive'` (conservative bias toward keeping more data; operators flip via CLI manual recorder).
  - Auto-emit is fire-and-forget per #10437 — failure does NOT propagate to the substrate's return value.
- **Default auto-emit kind: `too_aggressive` (-1, favor RAISING retention).** Each sweep is a substrate action operating on the threshold; the operator has not explicitly endorsed dropping entries. Conservative bias is "keep more by default."
- **Test surface: 7 tests** (`src/observation/retention-substrate.test.ts`):
  - Reads retention_days from config, applies as maxAgeDays.
  - Auto-emits one event per sweep with prunedCount + retentionDays metadata.
  - Default kind is `too_aggressive`.
  - `autoEmit: false` suppresses the emit.
  - `defaultKind: 'too_lax'` override works.
  - Fire-and-forget failures don't propagate.
  - Missing source file returns 0 prunedCount cleanly.
- **`tools/calibratable/verify-overdue-scan.mjs`** updated:
  - `observation.retention_days` `wired_first_caller_ship: 'v1.49.891'`.
  - Notes describe the wire chain: v884 (read) → v891 (substrate auto-emit).
  - Integration test deferred within 10-ship verify-axis budget.

## What this ship is

- A forward-cadence substrate-write-side ship per #10439 CLI-manual + substrate-auto-emit duality.
- Second instance of "substrate auto-emit pattern" after v846 predictive low-confidence.
- Closes the v884 deferred half + completes the `observation.retention_days` calibrate-axis loop.
- Closing ship of the v887-v891 multi-ship session.

## What this ship is not

- Not an integration test for the calibration loop end-to-end (deferred within budget).
- Not a substrate auto-emit for `token_budget.max_percent` (still pending; would need a separate substrate consumer for the hard ceiling).
- Not a NASA degree advance (still 1.178; 109 consecutive ships at margin record).

## Engine state

NASA degree sustains at 1.178 (UNCHANGED — **109 consecutive ships** at this degree; pressure-margin record extended by 1).
Counter-cadence count UNCHANGED at 7.
Manifest entries 23 (UNCHANGED).
Lessons in manifest 92 (UNCHANGED — applies established patterns).
KNOWN_UNWIRED Process UNCHANGED at 0.
KNOWN_UNWIRED Egress UNCHANGED at 0.
KNOWN_UNWIRED Loader UNCHANGED at 12 (no Loader chip this ship; v887/v889/v890 were the chips).
**Wired calibratable thresholds: 6 of 7 → 6 of 7** (observation.retention_days flips from "read-only wired" to "substrate-wired"; verify-overdue scan now reports PENDING-TEST instead of UNWIRED).
Pre-tag-gate step count: 18 (UNCHANGED).

## Files touched

- `src/observation/retention-substrate.ts` (NEW — 110 LOC)
- `src/observation/retention-substrate.test.ts` (NEW — 7 tests)
- `tools/calibratable/verify-overdue-scan.mjs` (UPDATED — wired_first_caller_ship + notes for observation.retention_days)
- `docs/release-notes/v1.49.891/` (NEW)
- `docs/release-notes/STORY.md` (UPDATED — chapter count + v891 entry)
- `package.json` + `package-lock.json` + `src-tauri/Cargo.toml` + `src-tauri/tauri.conf.json` (version bumps 1.49.890 → 1.49.891)
