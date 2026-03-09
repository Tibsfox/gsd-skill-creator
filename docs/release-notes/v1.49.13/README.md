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

## Retrospective

### What Worked
- **7 empirically-chosen patterns map to concrete remediation actions.** Each pattern (load-never-activate, correction-magnet, single-session-spike, co-activation cluster, score-drift, seasonal, session-spread) has a specific remediation (demote, merge, split, investigate). Patterns without actionable remediations were excluded.
- **Bounded +/-20% score adjustment prevents runaway feedback.** The cap means no single pattern detection can dramatically shift a skill's score -- convergence requires consistent signals across multiple cycles. This is the calibration engine's bounded-adjustment philosophy applied to skill health.
- **Integration into existing `sc:digest` as Step 4.5.** Rather than creating a new command, the telemetry pipeline augments the existing digest workflow. This means usage pattern analysis is surfaced during the natural workflow, not as a separate monitoring task.

### What Could Be Better
- **102 new tests for a pipeline that has no production data yet.** The telemetry system is well-tested against synthetic events, but the 7 patterns were chosen based on anticipated behavior, not observed production signals. Real usage may reveal patterns not in the initial set.
- **90-day retention is a guess.** Seasonal pattern detection needs at least one full season (~90 days), but whether that's the right window depends on actual project cadence, which varies.

## Lessons Learned

1. **Append-only JSONL is the right persistence pattern for event streams.** Same pattern as will be used in v1.49.14's health log -- simple, auditable, no schema migrations, crash-safe with `fs.appendFile`.
2. **Telemetry patterns should map 1:1 to remediation actions.** A detected pattern without a concrete "what to do about it" is noise, not signal. The 7-pattern set is valuable because each one triggers a specific response.
3. **Bounded feedback loops are essential for self-improving systems.** The +/-20% cap per cycle prevents oscillation and ensures convergence requires sustained evidence, not a single outlier event.
