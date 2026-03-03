# v1.49.13 — Skill Usage Telemetry & Adaptive Pipeline

**Shipped:** 2026-03-03
**Phases:** 4 (40-43) | **Plans:** 10
**Tests:** 102 new telemetry tests

## Summary

Adds a telemetry and adaptive feedback pipeline to the skill system. Skills now emit usage events (load, activate, deactivate, error) that are persisted to a JSONL EventStore with session tracking. A pattern detector identifies 7 skill health patterns, feeding into bounded score adjustment and cache tier promotion. Integrated into the existing `sc:digest` command as a new Usage Pattern Analysis step.

## Key Features

### Phase 40: Event Emission (EMIT-01 through EMIT-07)
- UsageEvent types with lifecycle tracking (load, activate, deactivate, error)
- JSONL EventStore with append-only persistence
- Session-aware event correlation
- Automatic event emission integrated into skill lifecycle

### Phase 41: Pattern Detection (PTRN-01 through PTRN-07)
- UsagePatternDetector identifying 7 skill health patterns:
  - **load-never-activate**: Skill loads but never activates (wasted tokens)
  - **correction-magnet**: Skill triggers frequent user corrections
  - **single-session-spike**: Usage concentrated in one session
  - **co-activation cluster**: Skills that always activate together
  - **score-drift**: Gradual score change without clear cause
  - **seasonal**: Usage tied to project phases or time patterns
  - **session-spread**: Usage distributed evenly across sessions

### Phase 42: Adaptive Feedback (ADAPT-01 through ADAPT-05)
- ScoreAdjuster with bounded +/-20% multipliers per adjustment cycle
- CachePromoter for automated cache tier promotion based on usage patterns
- AdaptiveSuggestions formatting for human-readable recommendations

### Phase 43: Integration (INTG-01 through INTG-04)
- `sc:digest` integration with Usage Pattern Analysis (Step 4.5)
- 90-day retention enforcement with automatic event pruning
- End-to-end pipeline integration tests
- TelemetryStage wired into the adaptive pipeline

## Design Decisions

- **Append-only JSONL**: Same persistence pattern as other subsystems — simple, auditable, no schema migrations
- **Bounded adjustments**: +/-20% cap prevents runaway score inflation/deflation from a single pattern
- **7 patterns chosen empirically**: Each pattern maps to a concrete remediation action (demote, merge, split, investigate)
- **90-day retention**: Balances storage with sufficient history for seasonal pattern detection
