# v1.49.13 Retrospective — Skill Usage Telemetry & Adaptive Pipeline

**Shipped:** 2026-03-03
**Phases:** 4 (40-43) | **Plans:** 10 | **Tests:** 102 new

## What Was Built
- UsageEvent types with lifecycle tracking and JSONL EventStore with session correlation
- UsagePatternDetector identifying 7 skill health patterns
- ScoreAdjuster with bounded +/-20% multipliers and CachePromoter for tier promotion
- sc:digest integration (Step 4.5) with 90-day retention enforcement
- End-to-end pipeline integration tests

## What Worked
- **Append-only JSONL pattern**: Reusing the persistence pattern from previous subsystems meant zero design overhead for the EventStore
- **Bounded adjustments**: The +/-20% cap from Calibration Engine (v1.49.8) transferred directly to score adjustment — proven pattern
- **4-phase pipeline**: Clean separation of concerns — emission, detection, adjustment, integration — made each phase independently testable
- **sc:digest integration**: Adding telemetry as Step 4.5 in the existing digest flow was natural and required minimal changes to the existing pipeline

## What Was Inefficient
- **Pattern threshold tuning**: The 7 patterns each needed empirical threshold tuning — load-never-activate detection threshold was initially too sensitive (flagging skills that loaded once and were legitimately not needed)
- **Session correlation complexity**: Correlating events across sessions required more bookkeeping than initially estimated

## Patterns Established
- **7 canonical skill health patterns**: load-never-activate, correction-magnet, single-session-spike, co-activation cluster, score-drift, seasonal, session-spread
- **Pattern-to-remediation mapping**: Each pattern maps to a concrete action (demote, merge, split, investigate)
- **90-day retention window**: Standard retention period for telemetry data balancing storage with seasonal detection

## Key Lessons
- Telemetry pipelines benefit from the same bounded-adjustment principle as calibration — uncapped feedback loops are dangerous
- 7 patterns cover the practical space well; additional patterns would have diminishing returns
- Integration testing for pipelines is more valuable than unit testing individual stages — the stage boundaries are where bugs hide
- 90 days is the minimum viable window for detecting seasonal patterns in skill usage
