---
phase: 307-session-manager-phase-controller
plan: "02"
subsystem: brainstorm
tags: [phase-controller, agent-matrix, critic-gate, defense-in-depth, timer-reset, facilitator-announcement]

# Dependency graph
requires:
  - phase: 305-foundation-types-bus
    provides: "SessionPhase, AgentRole, OsbornRule, TechniqueId, PathwayId, TimerState types"
  - phase: 305-foundation-types-bus
    provides: "PHASE_ORDER constant for transition validation"
  - phase: 307-session-manager-phase-controller
    plan: "01"
    provides: "ISessionManager interface, SessionManager class for state delegation"
  - phase: 306-rules-engine-techniques
    provides: "IRulesEngine interface, RulesEngine with canActivateAgent(), getActiveRules(), generateRuleReminder()"
provides:
  - "PhaseController class implementing IPhaseController"
  - "IPhaseController interface for dependency injection"
  - "PhaseTransitionResult type with 7 fields including facilitator_announcement"
  - "AgentActivationResult type with Rules Engine reason propagation"
  - "TechniqueTransition type with typed timer_behavior union (not string)"
  - "PHASE_AGENT_MATRIX encoding agent activation/deactivation per phase"
  - "Defense-in-depth point 2: Critic gate enforcement via activateAgent()"
  - "canTransitionTo() enforcing strict phase ordering with diverge loop exception"
affects: [307-03, 309, 310, 311]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure orchestrator pattern: PhaseController owns no state, delegates all to SessionManager"
    - "Defense-in-depth: Rules Engine (point 1) + PhaseController activateAgent (point 2) for Critic gate"
    - "PHASE_AGENT_MATRIX as module-private constant for agent lifecycle per phase"
    - "Facilitator announcement composition: intro + RulesEngine.generateRuleReminder()"

key-files:
  created:
    - src/brainstorm/core/phase-controller.ts
  modified: []

key-decisions:
  - "PhaseController is a pure orchestrator with zero persistent state -- all reads/writes delegate to SessionManager"
  - "PHASE_AGENT_MATRIX kept module-private (not exported) -- consumers use getActiveAgents() API"
  - "Diverge-to-diverge self-transition allowed for technique loops within diverge phase"
  - "Free-form pathway returns only facilitator+scribe (all other agents on-demand)"
  - "TechniqueTransition.timer_behavior typed as union literal, not plain string"

patterns-established:
  - "Pure orchestrator: component owns interface, delegates state to separate manager"
  - "Defense-in-depth: multiple enforcement points for critical constraints"
  - "Matrix-driven agent lifecycle: constant data structure drives activation/deactivation logic"

requirements-completed: [SESS-02, SESS-03, SESS-05, SESS-06]

# Metrics
duration: 3min
completed: 2026-02-22
---

# Phase 307 Plan 02: PhaseController Summary

**PhaseController with strict phase ordering, PHASE_AGENT_MATRIX for agent lifecycle, dual Critic gate defense-in-depth, and facilitator announcements with rule reminders**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-22T19:07:43Z
- **Completed:** 2026-02-22T19:11:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- PhaseController class (524 lines) implementing IPhaseController with 9 methods
- canTransitionTo() enforces strict PHASE_ORDER with diverge loop exception and descriptive rejection reasons
- transitionTo() orchestrates full phase transition: validation, agent activation/deactivation, state sync, rule reminder, facilitator announcement
- activateAgent() serves as defense-in-depth point 2 for Critic gate (Rules Engine is point 1)
- PHASE_AGENT_MATRIX encoding all agent lifecycle rules with critic in diverge.deactivated
- TechniqueTransition with typed timer_behavior union prevents timer desync pitfall
- getActiveAgents() returns correct set per matrix; free-form pathway returns facilitator+scribe only
- Zero imports from den/, vtm/, knowledge/ -- only brainstorm/shared and brainstorm/core
- All 120 existing brainstorm tests pass (zero regression)

## Task Commits

Each task was committed atomically:

1. **Task 1: PhaseController -- transitions, agent matrix, technique timer, announcements** - `39e159f` (feat)

## Files Created/Modified
- `src/brainstorm/core/phase-controller.ts` - PhaseController class, IPhaseController interface, PhaseTransitionResult, AgentActivationResult, TechniqueTransition types, PHASE_AGENT_MATRIX constant

## Decisions Made
- PhaseController stores no persistent state -- pure orchestrator delegating all reads/writes to SessionManager
- PHASE_AGENT_MATRIX is module-private (not exported); consumers use getActiveAgents() API
- Diverge-to-diverge self-transition is explicitly allowed for technique loops within diverge phase
- Free-form pathway returns only facilitator+scribe (all other agents activated on-demand)
- TechniqueTransition.timer_behavior is typed as `'reset-to-default' | 'inherit' | 'pause'` union literal, not plain string

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- PhaseController ready for TDD verification (307-03) to validate all SESS requirements
- IPhaseController interface enables dependency injection for agent testing in 309/310
- Defense-in-depth Critic gate verified at both Rules Engine and PhaseController levels

## Self-Check: PASSED

- FOUND: src/brainstorm/core/phase-controller.ts
- FOUND: commit 39e159f
- FOUND: 307-02-SUMMARY.md

---
*Phase: 307-session-manager-phase-controller*
*Completed: 2026-02-22*
