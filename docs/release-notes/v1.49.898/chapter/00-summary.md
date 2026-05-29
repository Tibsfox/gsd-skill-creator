# v1.49.898 — Verify-Axis Integration Test: `token_budget.max_percent`

**Released:** 2026-05-29

## Why this ship

`token_budget.max_percent` has been the sole PENDING-TEST entry in the verify-axis overdue scan since v893. v888 wired the read side (`loadObservationsForThreshold('token_budget.max_percent', ...)`); v893 wired the substrate auto-emit (`runTokenBudgetCeilingCheck` in `src/token-budget/ceiling-substrate.ts`). Both halves had unit tests against mocks. Per #10438 unit tests against mocks prove signature; integration tests against real collaborators prove behavior. This ship closes the gap within the 10-ship verify-axis budget (#10428) — 5 ships after substrate wire vs 10-ship ceiling.

Also: third instance of "substrate→calibration end-to-end test" pattern (after v856 predictive low-confidence + v894 observation-retention) — promotion threshold for ESTABLISHED. v899 codify ship will formalize the pattern as a #10453 template.

## What's in this ship

- **`tests/integration/token-budget-max-end-to-end.integration.test.ts`** NEW — 8 integration tests proving substrate→calibration wire end-to-end:
  - Under-budget substrate check auto-emits an event the calibration loop reads as +1.
  - Ceiling-hit substrate check auto-emits an event the calibration loop reads as -1.
  - Substrate writes accumulate across multiple checks; calibration loop sees correct counts + net polarity (order-independent assertion — fire-and-forget per #10437 doesn't guarantee write order).
  - Boundary equality (usagePercent === max_percent) classifies as blocked (-1) — the strict-less-than ceiling-check contract.
  - `defaultKind` override forces a specific polarity regardless of outcome (operator-driven override path matches v891 explicit override hook).
  - Calibration loop returns empty when JSONL does not exist (missing-file tolerance).
  - Calibration loop tolerates malformed JSONL lines (writer contract per v893 best-effort silent).
  - `autoEmit: false` suppresses the event (no observation reaches the calibration loop).
- **`tools/calibratable/verify-overdue-scan.mjs`** UPDATED:
  - `token_budget.max_percent` row: `integration_test_ship: 'v1.49.898'` (was `null`).
  - Notes expanded to record 3rd-instance promotion + outcome-driven substrate distinction.

## Wire shape verified

**Substrate-write → calibration-read end-to-end.** The integration test exercises the real production code path:

1. Test constructs `{ token_budget: { max_percent: 80 } }` config and a real temp JSONL path.
2. Test calls `runTokenBudgetCeilingCheck(config, usagePercent, { eventsPath })` — the same API a production caller uses.
3. The substrate compares usagePercent against max_percent, fires off `appendTokenBudgetMaxEvent` via `.catch(()=>{})` per #10437.
4. Test waits 50ms for fs to settle (per #10454; setImmediate/process.nextTick are insufficient — wall-clock time is needed for OS-level fs).
5. Test calls `loadObservationsForThreshold('token_budget.max_percent', { tokenBudgetMaxEventsPath })` — the same API the calibration loop uses.
6. Test asserts observation count + polarity match the expected outcome-driven kind selection.

**Outcome-driven kind subtlety.** Distinct from v894 (default-fixed kind from `defaultKind` option). In v893's substrate, the kind FALLS OUT OF the inequality being checked: `usagePercent < max_percent` → `under_budget` (+1); `usagePercent >= max_percent` → `blocked` (-1). The integration test asserts both polarities from a single substrate-API surface, proving the outcome-driven kind selection threads correctly through to the calibration loop's polarity reading.

**Order-independent accumulation assertion.** The fire-and-forget Promise pattern per #10437 doesn't guarantee write order when called synchronously back-to-back. The accumulation test asserts COUNTS + NET POLARITY rather than file-write sequence. This is correct-by-design: operators reading the calibration loop care about aggregate signal, not interleaved order. The discipline note is itself a 1-instance candidate for the codify ship.

## What this ship is

- A forward-cadence verify-axis closing-move per #10428 budget discipline.
- **Third instance of substrate→calibration end-to-end test pattern — promotes to ESTABLISHED.**
- Closes the sole PENDING-TEST in the verify-overdue scan; all 7 wired thresholds now COVERED.

## What this ship is not

- Not a chokepoint chip (KNOWN_UNWIRED Loader unchanged at 9 from v897).
- Not a counter-cadence ship (engine state UNCHANGED — v899 will be the codify ship).
- Not a NASA degree advance (still 1.178; 116 consecutive ships at margin record).

## Engine state

NASA degree sustains at 1.178 (UNCHANGED — **116 consecutive ships** at this degree; pressure-margin record extended by 1).
Counter-cadence count UNCHANGED at 8.
Manifest entries 23 (UNCHANGED).
Lessons in manifest 95 (UNCHANGED — promotion deferred to v899).
KNOWN_UNWIRED Process UNCHANGED at 0.
KNOWN_UNWIRED Egress UNCHANGED at 0.
KNOWN_UNWIRED Loader UNCHANGED at 9.
**Wired calibratable thresholds: 7 of 7 (UNCHANGED); verify-axis 7 COVERED + 0 PENDING-TEST** (was 6 + 1).
Pre-tag-gate step count: 18 (UNCHANGED).

## Files touched

- `tests/integration/token-budget-max-end-to-end.integration.test.ts` (NEW — 8 tests)
- `tools/calibratable/verify-overdue-scan.mjs` (UPDATED — `token_budget.max_percent` row now records v898 as integration_test_ship)
- `docs/release-notes/v1.49.898/` (NEW)
- `docs/release-notes/STORY.md` (UPDATED — chapter count + v898 entry)
- `package.json` + `package-lock.json` + `src-tauri/Cargo.toml` + `src-tauri/tauri.conf.json` (version bumps 1.49.897 → 1.49.898)
