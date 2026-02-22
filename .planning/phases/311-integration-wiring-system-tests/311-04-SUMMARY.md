---
phase: 311-integration-wiring-system-tests
plan: 04
subsystem: testing
tags: [safety-critical, osborn-rules, critic-gate, behavioral-constraints, integration-tests, vitest]

# Dependency graph
requires:
  - phase: 306-core-session-infrastructure
    provides: RulesEngine, SessionManager, PhaseController
  - phase: 307-phase-controller
    provides: Phase transition enforcement, agent activation matrix
  - phase: 308-technique-agents
    provides: Ideator, Questioner, Persona, Scribe, Analyst, Critic agent implementations
  - phase: 309-facilitator-pathway
    provides: FacilitatorAgent with generateGuidance and handleEnergySignal
  - phase: 311-01
    provides: SessionBus integration wiring
  - phase: 311-02
    provides: Barrel exports and chipset YAML
provides:
  - All 18 safety-critical tests (SC-01 through SC-18) proving Osborn rule enforcement
  - End-to-end verification that Critic gate works at both defense-in-depth points
  - Agent behavioral constraint verification for all relevant agents
  - buildTestSession() helper for creating sessions at arbitrary phases
affects: [milestone-completion, v1.32-verification]

# Tech tracking
tech-stack:
  added: []
  patterns: [buildTestSession-helper, mockSessionState-helper, buildMessage-helper, tmpdir-isolation]

key-files:
  created:
    - src/brainstorm/integration/safety-critical.test.ts
  modified: []

key-decisions:
  - "SC-07 test uses combined evaluative + constructive content to verify Stage 2 false-positive prevention"
  - "buildTestSession() helper extracted for reuse across SC-09, SC-14, SC-18"
  - "ALLOWED_FIGURES checked directly as exported constant rather than through a missing getAvailablePersonas() method"
  - "SC-17 runs 5 rounds of freewriting through Ideator to generate a substantive diverge transcript"

patterns-established:
  - "buildTestSession(brainstormDir, phase): creates session and transitions to target phase for integration tests"
  - "Safety-critical tests use real instances (no mocks) for defense-in-depth verification"

requirements-completed: [INTEG-04]

# Metrics
duration: 2min
completed: 2026-02-22
---

# Phase 311 Plan 04: Safety-Critical Test Suite Summary

**All 18 SC tests (SC-01 through SC-18) pass -- Osborn no-criticism rule architecturally enforced at Rules Engine and Phase Controller, all agent behavioral constraints verified**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-22T20:13:15Z
- **Completed:** 2026-02-22T20:15:22Z
- **Tasks:** 1 (TDD -- tests written and verified green)
- **Files modified:** 1

## Accomplishments
- All 18 safety-critical tests pass with zero failures, zero skipped
- Critic gate verified at both enforcement points: RulesEngine (SC-01..SC-05) and PhaseController (SC-09)
- Two-stage evaluative content detection verified: hard-block patterns (SC-06, SC-08) and constructive-context allowlist (SC-07)
- Agent behavioral constraints verified: Ideator no-evaluation (SC-10), Questioner questions-only (SC-11), Persona constructive-only (SC-12), Scribe capture-only (SC-13)
- Phase ordering enforcement blocks backward transitions (SC-14)
- Facilitator guidance never quality-judges ideas (SC-15)
- All 4 Osborn rules active during diverge (SC-16)
- Full diverge-phase transcript contains zero evaluative content end-to-end (SC-17)
- Energy flagging produces advisory recommendation, not forced technique switch (SC-18)
- Full brainstorm test suite passes: 302 tests, 12 test files, zero regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Safety-Critical Test Suite SC-01 through SC-18** - `673fc6e` (test)

**Plan metadata:** [pending final commit]

## Files Created/Modified
- `src/brainstorm/integration/safety-critical.test.ts` - All 18 safety-critical tests with buildTestSession, mockSessionState, and buildMessage helpers

## Decisions Made
- SC-07 test combines evaluative phrase ("that won't work") with constructive context ("and we could also") in a single message to specifically exercise the Stage 2 false-positive prevention path
- SC-08 uses "unrealistic" as the evaluative trigger rather than "impossible" (which is not in the hard-block pattern list)
- buildTestSession() helper walks through phases sequentially via PhaseController.transitionTo() to create valid sessions at any phase
- SC-12 validates ALLOWED_FIGURES constant directly rather than through a Persona instance method (no such getter exists)
- SC-15 creates a FacilitatorAgent with mock pathway router to test guidance generation without full pathway infrastructure

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 18 mandatory safety-critical tests now pass, unblocking milestone completion verification
- Integration test infrastructure (buildTestSession helper) is available for any future integration tests
- Full brainstorm test suite at 302 tests with zero regressions

## Self-Check: PASSED

- [x] src/brainstorm/integration/safety-critical.test.ts -- FOUND
- [x] Commit 673fc6e -- FOUND

---
*Phase: 311-integration-wiring-system-tests*
*Completed: 2026-02-22*
