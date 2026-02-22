---
phase: 286-test-plan-generation
plan: 02
subsystem: testing
tags: [verification-matrix, density-checker, coverage-analysis, safety-density, auto-stub, vtm]

# Dependency graph
requires:
  - phase: 286-test-plan-generation
    provides: Test plan generator with GeneratorConfig, classifyCriterion, generateTestId, generateTestPlan
  - phase: 279-types-schemas
    provides: TestSpec, TestCategory, TestPlan Zod schemas and types
provides:
  - Verification matrix builder mapping criteria to test IDs with dual views and auto-stub
  - Test density checker enforcing per-criterion benchmarks with safety-aware thresholds
  - Coverage statistics with mapped/unmapped/gap tracking
  - Density diagnostics with configurable enforcement mode severity
affects: [288-pipeline-orchestrator, 286-test-plan-generation]

# Tech tracking
tech-stack:
  added: []
  patterns: [dual-view-matrix, auto-stub-generation, density-enforcement, safety-domain-threshold]

key-files:
  created: []
  modified:
    - src/vtm/test-plan-generator.ts
    - src/vtm/__tests__/test-plan-generator.test.ts

key-decisions:
  - "coveragePercent reflects only originally mapped criteria (stubs not counted as coverage)"
  - "Stub ID generation starts from max existing core ID to avoid collisions"
  - "Safety-critical determination for density uses per-test category check (any test with safety-critical triggers elevated threshold)"
  - "SAFETY_DENSITY_LOW uses plan.safetyCriticalCount / plan.totalTests for global safety percentage"

patterns-established:
  - "Dual-view matrix pattern: criterion-centric + test-centric views built from same data in one pass"
  - "Auto-stub with TODO marker pattern for unmapped criteria gap analysis"
  - "Diagnostic severity delegation based on config.enforcementMode"

requirements-completed: [TPLN-02, TPLN-04]

# Metrics
duration: 3min
completed: 2026-02-22
---

# Phase 286 Plan 02: Verification Matrix & Density Checker Summary

**Dual-view verification matrix with auto-stub gap coverage and per-criterion density enforcement with safety-aware thresholds and configurable diagnostics**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-22T05:44:49Z
- **Completed:** 2026-02-22T05:48:03Z
- **Tasks:** 2 (TDD: RED + GREEN)
- **Files modified:** 2

## Accomplishments
- buildVerificationMatrix with criterion-centric and test-centric dual views from plan's verificationMatrix entries
- Auto-stub generation for unmapped criteria using C-NNN IDs with "TODO: " prefixed expectedBehavior
- CoverageStats tracking totalCriteria, mappedCriteria, unmappedCriteria, coveragePercent, and gaps list
- checkTestDensity enforcing 2-4 for regular and 3-4 for safety-critical criteria per-criterion benchmarks
- SAFETY_DENSITY_LOW diagnostic for safety-sensitive domains with under-threshold safety test percentage
- UNDER_DENSITY/OVER_DENSITY diagnostics with severity based on enforcementMode (warning vs strict/error)
- 8 new exported types: CriterionViewEntry, TestViewEntry, CoverageStats, VerificationMatrix, CriterionDensity, DensityDiagnostic, DensityGlobalStats, DensityReport

## Task Commits

Each task was committed atomically:

1. **Task 1: RED -- Write failing tests** - `d3b490b` (test)
2. **Task 2: GREEN -- Implement verification matrix and density checker** - `d1ffcd6` (feat)

## Files Created/Modified
- `src/vtm/test-plan-generator.ts` - Added buildVerificationMatrix, checkTestDensity, and 8 type interfaces (735 lines total)
- `src/vtm/__tests__/test-plan-generator.test.ts` - Added 37 tests in 2 new describe blocks (987 lines total, 90 tests)

## Decisions Made
- coveragePercent reflects only originally mapped criteria; auto-stubs are not counted as real coverage
- Stub ID generation initializes counter from max existing core test ID to avoid ID collisions
- Safety-critical determination for density uses per-test category check rather than criterion text re-classification
- SAFETY_DENSITY_LOW uses plan-level safetyCriticalCount/totalTests ratio for global safety percentage

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Verification matrix and density checker complete the test plan generation subsystem
- Both functions compose cleanly with generateTestPlan output
- Phase 288 (pipeline orchestrator) can integrate full test plan generation pipeline
- All 549 VTM tests pass with zero regressions

## Self-Check: PASSED

All files verified present, all commit hashes found in git log.

---
*Phase: 286-test-plan-generation*
*Completed: 2026-02-22*
