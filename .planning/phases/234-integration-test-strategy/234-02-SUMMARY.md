---
phase: 234-integration-test-strategy
plan: 02
subsystem: testing
tags: [zod, semantic-testing, contract-freshness, vitest, integration-testing]

# Dependency graph
requires:
  - phase: 234-integration-test-strategy
    plan: 01
    provides: "6 priority flows, 8 boundary schemas, Zod + Vitest approach"
  - phase: 232-shared-eventdispatcher-specification
    provides: "6 subscriber profiles for ownership assignment"
  - phase: 233-dependency-philosophy
    provides: "4-tier layer model for owner classification"
provides:
  - "8 semantic test cases with full JSON inputs per boundary"
  - "Freshness table with owner, threshold, and re-verification triggers for all 11 boundaries"
  - "4 re-verification trigger categories documented"
  - "3-tier staleness thresholds (60-day critical, 90-day standard, aspirational)"
  - "Staleness detection pseudocode for CI integration"
affects: [234-03, 235-known-issues-triage]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Semantic test: structurally valid JSON with semantically invalid values for .safeParse() rejection"
    - "Cross-field semantic validation: urgent-without-ack, inbox-with-checked_at"
    - "Producer-side ownership with consumer-adapter exception for dual-export boundaries"
    - "3-tier staleness: 60-day critical, 90-day standard, aspirational milestone-only"

key-files:
  created:
    - ".planning/specs/integration-test-strategy/semantic-tests-and-freshness.md"
  modified: []

key-decisions:
  - "Producer-side schema ownership with consumer-adapter exception for dual-export boundaries"
  - "60-day staleness for critical-path boundaries (Console, Staging, AMIGA, Orchestrator)"
  - "90-day staleness for standard boundaries (Copper, SessionEventBridge, Collectors, Skill)"
  - "4 re-verification triggers: schema change, Zod major bump, milestone completion, new subscriber"

patterns-established:
  - "Semantic test case format: boundary, valid structure JSON, semantic violation, expected behavior, rationale"
  - "Freshness table format: boundary, owner, schema files, last verified, threshold, triggers"
  - "Staleness detection pseudocode for CI integration"

requirements-completed: [INTTEST-04, INTTEST-05]

# Metrics
duration: 5min
completed: 2026-02-19
---

# Phase 234 Plan 02: Semantic Tests and Freshness Policy Summary

**8 semantic test cases with full JSON per boundary, freshness table with producer-side ownership, and staleness detection algorithm for CI**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-19T18:41:38Z
- **Completed:** 2026-02-19T18:46:29Z
- **Tasks:** 1
- **Files created:** 1

## Accomplishments

- Documented 8 semantic test cases (one per implemented boundary) with full JSON input showing structurally-valid-but-semantically-invalid scenarios, plus 6 additional semantic test cases for secondary violations
- Created freshness table covering all 11 boundaries (8 implemented + 3 aspirational) with owner module, schema files, last verified date, staleness threshold, and re-verification triggers
- Defined 4 re-verification trigger categories with specific detection mechanisms (schema file change, Zod major bump, milestone completion, new subscriber registration)
- Specified 3-tier staleness thresholds: 60-day for critical-path boundaries, 90-day for standard, aspirational reviewed at milestone planning only
- Wrote staleness detection algorithm pseudocode for CI pipeline integration with ERROR/WARN severity levels
- Documented 5 semantic testing anti-patterns (obviously invalid data, internal logic testing, mocking schemas, happy-path only, ignoring cross-field constraints)

## Task Commits

Each task was committed atomically:

1. **Task 1: Semantic test cases per boundary and freshness policy** - `c07cd60` (docs)

## Files Created/Modified

- `.planning/specs/integration-test-strategy/semantic-tests-and-freshness.md` - 873-line document covering semantic test cases for 8 boundaries and contract freshness policy with staleness detection

## Decisions Made

- **Producer-side ownership:** The module that exports the schema owns the contract, with an exception for dual-export boundaries where the consumer-side adapter owns (because mismatch surfaces at the adapter)
- **Critical-path staleness at 60 days:** Console, Staging, AMIGA bus, and Orchestrator boundaries are on the GSD critical path and need tighter freshness requirements
- **Standard staleness at 90 days:** Copper, SessionEventBridge, Collectors, and Skill validation boundaries are important but recoverable on failure
- **Four re-verification triggers:** Schema file modification, Zod major version bump, milestone completion, new subscriber registration -- each with specific detection mechanisms

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Semantic test cases and freshness policy complete; Plan 03 can define fixture directory structure and EventDispatcher compliance audit on this foundation
- All 8 boundaries have documented semantic violations that test implementers can use directly
- Freshness table provides the contract ownership model for the audit mechanism in Plan 03

## Self-Check: PASSED

- FOUND: `.planning/specs/integration-test-strategy/semantic-tests-and-freshness.md`
- FOUND: `.planning/phases/234-integration-test-strategy/234-02-SUMMARY.md`
- FOUND: commit `c07cd60`

---
*Phase: 234-integration-test-strategy*
*Completed: 2026-02-19*
