# v1.49.856 — Verify ship: substrate-auto-emit → calibration-loop end-to-end

**Released:** 2026-05-28

## Why this ship

**Ninth and final ship of the operator-directed v848-v856 nine-ship campaign.** Second verify-overdue ship under #10438. The v846 ship wired the substrate auto-emit half of the v803 manual+auto duality pattern (`copper/activation.ts` + `orchestration/selector.ts` both call `appendPredictiveLowConfidenceEvent` on low-confidence predictions). v837 wired the read side (`loadObservationsForThreshold` reads from the same JSONL). Both halves had unit tests against mocks; v856 proves the end-to-end wire works against real JSONL I/O.

## The test

```ts
describe('verify v846 substrate-auto-emit → calibration-loop read wire end-to-end (v1.49.856)', () => {
  beforeEach: create temp dir + JSONL path
  afterEach: rmSync temp dir

  it('substrate writes flow through to calibration loop reads (single event)', ...);
  it('substrate writes accumulate; calibration loop sees ordered observations', ...);
  it('calibration loop returns empty when JSONL does not exist (missing-file tolerance)', ...);
  it('calibration loop tolerates malformed JSONL lines (writer contract)', ...);
});
```

4 test cases. ~132 LOC. Exercises the real `appendPredictiveLowConfidenceEvent` → `loadObservationsForThreshold` path against real JSONL temp files.

## "Potential blocker" turned out tractable

The v847 handoff flagged this ship as "POTENTIAL BLOCKER — handoff flagged this may need exploratory scoping. Likely needs synthetic event stream or real production traffic." The actual scope was simpler: both the writer and the reader accept path-override options for testability, so a temp-dir JSONL file is sufficient to exercise the end-to-end wire. No synthetic event stream needed; no production traffic dependency.

## Surface delta

- 1 NEW test file (`tests/integration/predictive-low-confidence-end-to-end.integration.test.ts`)
- 0 source changes
- 0 manifest changes
- 0 new dependencies

## Engine state at campaign close

NASA degree at **1.178** (UNCHANGED — **74 consecutive ships at 1.178**, new widest pressure margin record by 1 over v855's 73).
Counter-cadence count UNCHANGED at 6.
Operational axes UNCHANGED at 4 (but verify axis applied 2× this campaign: v854 mesh + v856 predict).

**Campaign closed.** 9 ships, ~6 hours wall-clock, zero regressions, full operator-directed scope delivered.
