# v1.49.894 — Verify-Axis Integration Test: `observation.retention_days`

**Released:** 2026-05-28

## Why this ship

v891 wired the substrate auto-emit for `observation.retention_days`. v884 wired the read side. Both halves had unit tests against mocks. Per #10438 unit tests against mocks prove signature; integration tests against real collaborators prove behavior. v894 closes that gap.

Per #10428 verify-axis discipline: each calibratable threshold should have an integration test verifying the substrate-to-caller wire within 10 ships of the threshold first being wired by a production caller. v891 is 3 ships back — well within budget. Shipping early lets the integration test inform later substrate auto-emits (token_budget.max_percent at v893 just shipped; its integration test will mirror v894's shape).

Third ship of the v892-v895 multi-ship session.

## What's in this ship

- **`tests/integration/observation-retention-end-to-end.integration.test.ts`** (NEW — 4 tests):
  - Substrate sweep auto-emits an event that the calibration loop reads (single-event happy path).
  - Substrate writes accumulate across multiple sweeps with mixed polarity; calibration loop sees all in order (3 sweeps, asserts polarity values `[-1, -1, 1]` and net `-1`).
  - Calibration loop returns empty when JSONL does not exist (missing-file tolerance).
  - Calibration loop tolerates malformed JSONL lines (writer contract).
- **`tools/calibratable/verify-overdue-scan.mjs`** updated:
  - `observation.retention_days` `integration_test_ship: 'v1.49.894'`.
  - Notes describe the 3-ship-after-wire integration + 2nd-instance pattern annotation.
  - Result: 6 COVERED + 1 PENDING-TEST (token_budget.max_percent @ v893, within budget).

## Pattern instance

**Second instance of "substrate→calibration end-to-end test"** (after `tests/integration/predictive-low-confidence-end-to-end.integration.test.ts` at v856). The shape:

1. `mkdtempSync` + temp file paths for substrate + auto-emit sinks.
2. Substrate-side action that triggers the fire-and-forget auto-emit.
3. `setTimeout(50ms)` wait for the fire-and-forget Promise's fs work to settle.
4. `loadObservationsForThreshold(<threshold>, <options>)` read-side call.
5. Polarity-value assertions on observations array.
6. Missing-file tolerance check.
7. Malformed-line tolerance check.

Promotes the pattern from 1-instance to 2-instance — codify-eligible in the v895 counter-cadence ship.

## What this ship is

- A verify-axis ship per #10428 meta-cadence discipline.
- Second instance of "substrate→calibration end-to-end test" pattern (after v856).
- Third ship of the v892-v895 multi-ship session.

## What this ship is not

- Not an integration test for `token_budget.max_percent` (deferred — its substrate just shipped at v893; budget extends to v903).
- Not new substrate or read-side code (this ship is pure verify-axis test).
- Not a NASA degree advance (still 1.178; 112 consecutive ships at margin record).

## Engine state

NASA degree sustains at 1.178 (UNCHANGED — **112 consecutive ships** at this degree).
Counter-cadence count UNCHANGED at 7.
Manifest entries 23 (UNCHANGED).
Lessons in manifest 92 (UNCHANGED).
KNOWN_UNWIRED Process / Egress / Loader UNCHANGED at 0 / 0 / 11.
Wired calibratable thresholds **7 of 7** (UNCHANGED from v893).
**Verify-axis coverage: 5 → 6 COVERED + 1 PENDING-TEST** (observation.retention_days flips from PENDING-TEST to COVERED).
Pre-tag-gate step count: 18 (UNCHANGED).

## Files touched

- `tests/integration/observation-retention-end-to-end.integration.test.ts` (NEW — 4 tests)
- `tools/calibratable/verify-overdue-scan.mjs` (UPDATED — integration_test_ship for observation.retention_days)
- `docs/release-notes/v1.49.894/` (NEW)
- `docs/release-notes/STORY.md` (UPDATED — chapter count + v894 entry)
- `package.json` + `package-lock.json` + `src-tauri/Cargo.toml` + `src-tauri/tauri.conf.json` (version bumps)
