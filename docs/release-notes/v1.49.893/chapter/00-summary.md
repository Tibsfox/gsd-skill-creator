# v1.49.893 — Substrate Auto-Emit: `token_budget.max_percent`

**Released:** 2026-05-28

## Why this ship

v888 wired the READ side (calibration loop can load `TokenBudgetMaxEvent`s) and shipped the CLI manual recorder. The substrate WRITE side has been deferred since then — no production code path read `token_budget.max_percent` AND acted on it AND emitted observability events. v893 closes that half. Mirrors v837 → v846 (predictive low-confidence wire → substrate auto-emit) and pairs symmetrically with v884 → v891 (observation-retention staging).

Second ship of the v892-v895 multi-ship session. v892 was the LoaderContext chip (option 2); v893 is the substrate auto-emit (option 3).

## What's in this ship

- **`src/token-budget/ceiling-substrate.ts`** (NEW — 113 LOC). `runTokenBudgetCeilingCheck(config, usagePercent, options)` function:
  - Reads `token_budget.max_percent` from a minimal `TokenBudgetMaxConfig` shape.
  - Compares `usagePercent` against `max_percent`.
  - Returns a `CeilingCheckResult` with `underBudget` + `usagePercent` + `maxPercent` + `emittedKind`.
  - Auto-emits a `TokenBudgetMaxEvent` with outcome-driven kind: `under_budget` (+1) when below ceiling, `blocked` (-1) when at or above.
  - Auto-emit is fire-and-forget per #10437.
- **Outcome-driven kind selection.** Differs from v891's default-fixed pattern: v891 always emits `too_aggressive` regardless of pruned count; v893 derives the kind from the (usagePercent, max_percent) comparison. Caller can override via `defaultKind` option. Documented why: the v893 substrate IS a pure threshold comparison, so polarity falls out naturally; v891's substrate is async retention work whose outcome doesn't determine polarity.
- **`src/token-budget/ceiling-substrate.test.ts`** (NEW — 9 tests):
  - Reads max_percent from config and returns underBudget true/false.
  - Auto-emits under_budget when below ceiling.
  - Auto-emits blocked when at/above ceiling.
  - Outcome-driven kind reaches both polarities.
  - `autoEmit: false` suppresses the emit.
  - `defaultKind` override forces a polarity.
  - Optional `reason` field recorded.
  - Fire-and-forget failures don't propagate.
- **`tools/calibratable/verify-overdue-scan.mjs`** updated:
  - `token_budget.max_percent` `wired_first_caller_ship: 'v1.49.893'`.
  - Notes describe the wire chain: v888 (read) → v893 (substrate auto-emit) + outcome-driven kind discipline.
  - **ZERO UNWIRED thresholds** for the first time since the registry was extended.

## What this ship is

- A forward-cadence substrate-write-side ship per #10439 CLI-manual + substrate-auto-emit duality.
- Second instance of the substrate-wrapper pattern (after v846 predictive + v891 retention). v891's pattern was 1-instance candidate; this ship promotes it to 2-instance ESTABLISHED.
- Closes the v888 deferred half + completes the `token_budget.max_percent` calibrate-axis loop.
- Brings zero-UNWIRED milestone: every registry threshold has at least one production caller.

## What this ship is not

- Not an integration test for the calibration loop end-to-end (deferred to v894 within budget).
- Not wired into a real hot-path token-budget enforcement layer (the substrate is the check; production callers wire it where they measure usagePercent).
- Not a NASA degree advance (still 1.178; 111 consecutive ships at margin record).

## Engine state

NASA degree sustains at 1.178 (UNCHANGED — **111 consecutive ships** at this degree; pressure-margin record extended by 1).
Counter-cadence count UNCHANGED at 7.
Manifest entries 23 (UNCHANGED).
Lessons in manifest 92 (UNCHANGED — applies established patterns; #10439 staging closes for token_budget.max_percent).
KNOWN_UNWIRED Process UNCHANGED at 0.
KNOWN_UNWIRED Egress UNCHANGED at 0.
KNOWN_UNWIRED Loader 11 (UNCHANGED).
**Wired calibratable thresholds: 6 of 7 → 7 of 7** (token_budget.max_percent flips from UNWIRED to PENDING-TEST; zero UNWIRED for the first time since registry extension).
Pre-tag-gate step count: 18 (UNCHANGED).

## Files touched

- `src/token-budget/ceiling-substrate.ts` (NEW — 113 LOC)
- `src/token-budget/ceiling-substrate.test.ts` (NEW — 9 tests)
- `tools/calibratable/verify-overdue-scan.mjs` (UPDATED — wired_first_caller_ship + notes for token_budget.max_percent)
- `docs/release-notes/v1.49.893/` (NEW)
- `docs/release-notes/STORY.md` (UPDATED — chapter count + v893 entry)
- `package.json` + `package-lock.json` + `src-tauri/Cargo.toml` + `src-tauri/tauri.conf.json` (version bumps 1.49.892 → 1.49.893)
