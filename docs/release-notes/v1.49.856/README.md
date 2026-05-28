> Following v1.49.855 — _Quality-drift scorer refinement: `task` sub-type for T-prefix/S-prefix work_, v1.49.856 is the **ninth and final ship of the v848-v856 nine-ship campaign**. Second verify-overdue ship under #10438: proves the v846 substrate-auto-emit → calibration-loop read wire works end-to-end against a real JSONL file. The "potential blocker" flagged in the v847 handoff turned out tractable — no synthetic event stream needed; substrate-side `appendPredictiveLowConfidenceEvent` writes flow through to calibration-loop `loadObservationsForThreshold` reads cleanly. **Campaign complete: 9/9 ships.**

# v1.49.856 — Verify ship: substrate-auto-emit → calibration-loop end-to-end

**Shipped:** 2026-05-28

Ninth and final ship of the operator-directed v848-v856 nine-ship campaign; second verify-overdue ship under #10438. The v847 handoff flagged this ship as a "potential blocker — may need synthetic event stream or real production traffic." The actual scope turned out simpler: the substrate writer (`appendPredictiveLowConfidenceEvent`) and the calibration loop reader (`loadObservationsForThreshold`) both accept path overrides for testability, so a temp-dir JSONL file is sufficient to exercise the end-to-end wire against real I/O (no mocks).

## What shipped

- **NEW** `tests/integration/predictive-low-confidence-end-to-end.integration.test.ts` — 4 integration test cases against real JSONL temp files:
  1. **Substrate writes flow through to calibration loop reads (single event)** — writes 1 not_useful event → loop sees 1 observation with polarity +1.
  2. **Substrate writes accumulate; calibration loop sees ordered observations** — writes useful + not_useful + not_useful → loop sees 3 observations with polarities [-1, 1, 1]; net polarity +1.
  3. **Calibration loop returns empty when JSONL does not exist (missing-file tolerance)** — `loadObservationsForThreshold` with a nonexistent path returns empty array without throwing.
  4. **Calibration loop tolerates malformed JSONL lines (writer contract)** — pre-write a malformed line + a valid event → reader sees 1 valid event; loop sees 1 observation.

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| `tests/integration/predictive-low-confidence-end-to-end.integration.test.ts` | +4 | NEW integration test file — exercises real JSONL temp files |
| (no source changes) | 0 | v856 is a verify ship per #10438 — adds proof of the v846 wire, not new substrate |

## Engine state at campaign close

NASA degree sustains at **1.178** (UNCHANGED — **74 consecutive ships at 1.178**, new widest pressure margin record by 1 over v855's 73).
Counter-cadence count UNCHANGED at 6.

Manifest entries: **23** (UNCHANGED).
Lessons in manifest (unique): **83** (UNCHANGED).
UNCODIFIED: **39 ≤ ceiling 41** (UNCHANGED).
KNOWN_UNWIRED Process: **11** (UNCHANGED — chip-cluster delivered 5 of 16 entries at v849-v853).
KNOWN_UNWIRED Egress: **11** (UNCHANGED).
Operational axes: **4** (UNCHANGED — but verify axis applied 2× this campaign).

## Verify-ship pattern (per #10438, second instance this campaign)

```
v1.49.846 (substrate ship)  → wire + unit tests (vi.mock appendPredictiveLowConfidenceEvent) → ship
                             ↓
v1.49.847 (codify ship)     → #10438 promotes verify axis to numbered lesson
                             ↓
v1.49.856 (verify ship)     → real-JSONL integration test → proof of behavior
```

The trigger per #10438: `≥10 ships since first non-test caller landed and no integration test exists`. v846 was the substrate-auto-emit ship; v856 is exactly 10 ships past — landing EXACTLY at the canonical trigger. (Cf. v854 which was 1 ship past v853 canonical trigger for the v843 mesh family.)

## Surface delta

- 1 NEW test file (132 LOC including 35 LOC docstring)
- 0 source changes
- 0 manifest changes
- 0 new dependencies

## Campaign-close summary (v848 through v856)

**9 ships shipped, ~6 hours wall-clock total.**

| Ship | Title | Scope | LOC delta |
|---|---|---|---|
| v848 | Help text expansion (printHelp +20) | Help discoverability | +20 src, 0 test |
| v849 | ProcessContext chip: changelog-watch | Singleton wire (hoist-at-top) | +14 src, +32 test |
| v850 | ProcessContext chip: extension-detector | Singleton wire (hoist-inside-branch) | +20 src, +25 test |
| v851 | ProcessContext chip: version-backfill | Singleton wire (hoist-at-top, NEW test file) | +21 src, +56 test |
| v852 | Stale-import cleanup: scan-arxiv/bridge | Dead-code removal | -1 src, +7 audit comment |
| v853 | ProcessContext chip: git-collector | Singleton wire (async, hoist-at-top) | +14 src, +30 test |
| v854 | Verify: mesh-default-executor real-git | Integration test for v843 mesh family | +139 test (NEW file) |
| v855 | Quality-drift scorer: task sub-type | v841 forward-flag closure | +30 src, +30 test |
| v856 | Verify: predictive-low-confidence end-to-end | Integration test for v846 substrate-auto-emit | +132 test (NEW file) |

**Net campaign deliverables:**
- KNOWN_UNWIRED Process: 16 → 11 (-31%)
- Help-coverage: 62/84 → 82/84 (+24%)
- 2 verify-overdue gaps closed (#10438 first applied instances)
- 1 forward-flag closed (v841 → v855)
- 1 codification-ready observation surfaced for next codify ship (stale-entry inverse-audit, v834 + v852)
- 0 backward-compat breaks across 9 ships
- 0 test regressions across 9 ships
- 0 audit-test regressions across 9 ships
- 4 new release-notes file structures (chip-shape × 4, verify-shape × 2, scorer-refinement-shape × 1, help-discoverability-shape × 1, stale-cleanup-shape × 1)
