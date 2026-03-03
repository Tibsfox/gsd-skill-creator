# v1.49.13 Lessons Learned — Skill Usage Telemetry & Adaptive Pipeline

## LLIS Format Entries

### LL-4913-01: Bounded Adjustment Principle Transfers
**Category:** What Worked Well
**Observation:** The +/-20% bounded adjustment cap from the Calibration Engine (v1.49.8) transferred directly to the ScoreAdjuster. The principle — no single feedback cycle should change a parameter by more than 20% — prevents runaway drift whether applied to calibration, telemetry scores, or cache tier promotion.
**Recommendation:** Treat bounded adjustment as a universal principle for any adaptive system. When designing new feedback loops, start with the 20% cap and only relax it with empirical evidence that wider bounds are safe.

### LL-4913-02: Append-Only JSONL as Standard Persistence
**Category:** What Worked Well
**Observation:** The EventStore uses the same append-only JSONL pattern as previous subsystems. This eliminates schema migration concerns, provides a complete audit trail, and enables simple retention enforcement (delete lines older than threshold). The pattern has now been proven across 3 subsystems.
**Recommendation:** Standardize append-only JSONL as the default persistence pattern for all subsystems that produce event streams. Only reach for a database when random access queries are a primary use case.

### LL-4913-03: Integration Testing Over Unit Testing for Pipelines
**Category:** What Worked Well
**Observation:** End-to-end pipeline integration tests caught stage-boundary bugs that unit tests for individual stages missed. Specifically, the event format emitted by the emission stage needed adjustment to match the detection stage's expected input — unit tests on each stage passed independently.
**Recommendation:** For multi-stage pipelines, prioritize integration tests that exercise the full pipeline path. Unit tests for individual stages are still valuable but insufficient — the most dangerous bugs live at stage boundaries.

### LL-4913-04: Pattern Threshold Sensitivity
**Category:** What Could Be Improved
**Observation:** The load-never-activate pattern initially had too sensitive a threshold, flagging skills that loaded once and were legitimately not needed (e.g., skills loaded speculatively by the session awareness system). The threshold required empirical tuning to distinguish genuine "wasted load" from "speculative load that correctly decided not to activate".
**Recommendation:** For pattern detection thresholds, start with conservative values (fewer false positives) and relax gradually. A false positive in skill health detection wastes remediation effort; a false negative simply delays detection. Err on the side of precision.

### LL-4913-05: Session Correlation Complexity
**Category:** What Could Be Improved
**Observation:** Correlating usage events across sessions required more bookkeeping than initially estimated. Session boundaries, session ID propagation, and cross-session pattern detection (e.g., session-spread) each added complexity that wasn't visible in the initial design.
**Recommendation:** When designing event systems with session correlation, budget 30-40% more implementation effort for session management than the naive estimate. Session boundaries are a significant source of edge cases.

## Recommendations Summary

| # | Recommendation | Priority |
|---|---------------|----------|
| 1 | Apply 20% bounded adjustment to all new adaptive systems | High |
| 2 | Standardize append-only JSONL for event stream persistence | High |
| 3 | Prioritize integration tests for multi-stage pipelines | High |
| 4 | Start pattern thresholds conservative, relax with evidence | Medium |
| 5 | Budget 30-40% extra for session correlation in event systems | Medium |
