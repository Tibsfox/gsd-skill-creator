> Following v1.49.854 — _Verify ship: mesh-default-executor integration test against real git_, v1.49.855 is the **eighth ship of the v848-v856 nine-ship campaign**. Closes the v841 forward-flag for task-shaped ships firing false `recent_all_F` alerts: adds a `task` sub-type to `tools/release-history/classify-types.mjs` for T-prefix and S-prefix titles, threads it through KNOWN_TYPES in `quality-drift-check.mjs`, and excludes it from `authoredTypes` so the F-by-design property matches `chip`. New tests + existing tests updated.

# v1.49.855 — Quality-drift scorer refinement: `task` sub-type for T-prefix/S-prefix work

**Shipped:** 2026-05-28

Eighth ship of the nine-ship v848-v856 campaign. The v841 retrospective explicitly forward-flagged a `task` sub-type as the future-ship closure for the remaining `recent_all_F` warning that fires because recent feature-type ships in the T-prefix/S-prefix series carry minimal release notes by design (single-task closure scope, not substantive-feature scope). v855 closes that flag.

## What shipped

- **MODIFIED** `tools/release-history/classify-types.mjs`:
  - Added new `task` type (line 11) with the rationale documented in the header block.
  - Updated priority-order comment to include task between chip and feature.
  - Added `taskMarkers` regex `/^[TS]\d+(\.\d+)?\s/` — anchored to title start so degree titles mentioning S-prefix segment numbers (e.g. "Degree 171: ... S36 Return") don't false-positive (they resolve to degree earlier via priority).
  - Updated `dist` init to include `task: 0`.
  - Updated console summary line to include task count.
- **MODIFIED** `tools/release-history/quality-drift-check.mjs`:
  - Added `task` to `KNOWN_TYPES` (line 48 → 49) with rationale comment.
  - Updated authored-types F-by-design exclusion comment to include task alongside chip and degree.
- **MODIFIED** `tools/release-history/__tests__/classify-types-chip.test.mjs`:
  - Updated existing T-prefix assertion (line 77) from `toBe('feature')` to `not.toBe('chip')` (the chip-classification negative still holds; classification migrated to task).
  - Added new `describe('v1.49.855: task classification', ...)` block with 5 cases covering T-prefix Ship titles + S-prefix titles + chipMarker-beats-task priority + degree-beats-task priority + non-anchored "Post-T14" not-task.

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| `tools/release-history/__tests__/classify-types-chip.test.mjs` | +5 | New `v1.49.855: task classification` describe block |
| Direct classify() verification | 8/8 PASS | Verified via inline node script |

The test file lives outside the main vitest include glob (per the v841 codification note at line 11). Direct verification confirms 8/8 cases pass (3 task + 3 priority-beats-task + 2 non-matching).

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **73 consecutive ships at 1.178**, new widest pressure margin record by 1 over v854's 72).
Counter-cadence count UNCHANGED at 6.

Manifest entries: **23** (UNCHANGED).
Lessons in manifest (unique): **83** (UNCHANGED).
UNCODIFIED: **39 ≤ ceiling 41** (UNCHANGED).
KNOWN_UNWIRED Process: **11** (UNCHANGED).
KNOWN_UNWIRED Egress: **11** (UNCHANGED).
Operational axes: **4** (UNCHANGED).

## Forward-flag closure

The v841 retrospective explicitly named this fix:

> "Per-type baselines unblock a future `task` sub-type. If the recent_all_F warning keeps firing on T-prefix/S-prefix ships, a future ship can add `task` to classify-types.mjs with the same pattern v841 established. The chip-type infrastructure is generalizable."

v855 applies exactly that pattern: regex anchor at title start, priority below chip (so codification ships mentioning S-prefix stay chip), F-by-design exclusion alongside chip. Total wire cost: ~25 LOC source change + 5 new tests.

## Re-classification side-effect

Existing releases previously classified as `feature` may be re-classified as `task` on next `classify-types.mjs` run. Specifically:
- v1.49.797, v1.49.799, v1.49.801 (T1.1 Ship 3/5/7)
- v1.49.831 (T1.3 Option C)
- v1.49.808 (S2 Adoption Telemetry)
- Any other historic T-prefix/S-prefix releases

This shifts the per-type baseline averages on next `--update-baseline` run. The drift-check report will reflect the new type-distribution; the `recent_all_F` alert should stop firing on T/S-prefix windows.

## Surface delta

- 3 files modified
- +30 source LOC (10 LOC in classify-types regex + comments; 5 LOC in quality-drift KNOWN_TYPES + comments; updated `dist` init + summary line)
- +30 test LOC (5 new test cases in new describe block; 4 existing assertions updated from `toBe('feature')` to `not.toBe('chip')`)
- 0 new dependencies
- 0 manifest changes
