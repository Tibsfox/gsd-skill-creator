---
phase: 04-college-structure
plan: 01
subsystem: college
tags: [progressive-disclosure, token-counter, filesystem-discovery, college-loader]

requires:
  - phase: 02-rosetta-core
    provides: "RosettaConcept, DepartmentWing, TokenBudgetConfig types"
provides:
  - "CollegeLoader with three-tier progressive disclosure (summary/active/deep)"
  - "DepartmentSummary, WingContent, DeepReference, ExplorationResult, CrossReferenceResult, LearningPath types"
  - "Token counting utility (countTokens, truncateToTokenBudget)"
  - "Filesystem-based department auto-discovery"
affects: [04-02, 04-03, 04-04, 05-math-content]

tech-stack:
  added: []
  patterns: [progressive-disclosure-tiers, filesystem-auto-discovery, token-budget-enforcement]

key-files:
  created:
    - .college/college/types.ts
    - .college/college/token-counter.ts
    - .college/college/token-counter.test.ts
    - .college/college/college-loader.ts
    - .college/college/college-loader.test.ts
  modified: []

key-decisions:
  - "DEPARTMENT.md parser extracts wings from markdown list with dash-separated descriptions"
  - "Concept files parsed via regex extraction of id/name/domain/description from TypeScript exports"
  - "Token budget enforcement truncates summary description when total exceeds 3K limit"

patterns-established:
  - "Three-tier progressive disclosure: summary (<3K) -> active (<12K) -> deep (on request)"
  - "Department auto-discovery: scan basePath for directories containing DEPARTMENT.md"
  - "CollegeLoader takes basePath parameter for testability -- tests use temp directories"

requirements-completed: [COLL-01, COLL-02, COLL-05]

duration: 3min
completed: 2026-03-01
---

# Phase 4 Plan 01: CollegeLoader + Types + Token Counter Summary

**CollegeLoader with three-tier progressive disclosure (summary/active/deep), 6 College types, and filesystem-based department auto-discovery**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-01T19:02:18Z
- **Completed:** 2026-03-01T19:05:30Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- 6 College-specific types defining the full progressive disclosure API surface
- Token counter using 4 chars/token heuristic consistent with ExpressionRenderer
- CollegeLoader with loadSummary (<3K), loadWing (<12K), loadDeep (on request)
- Filesystem-based department auto-discovery proving COLL-05 extensibility
- 14 TDD tests all passing (5 token counter + 9 CollegeLoader)

## Task Commits

Each task was committed atomically:

1. **Task 1: College types and token counter with TDD** - `4b5ab35a` (feat)
2. **Task 2: CollegeLoader with progressive disclosure TDD** - `ecf5266f` (feat)

_TDD flow: RED (tests fail) -> GREEN (implementation passes)_

## Files Created/Modified
- `.college/college/types.ts` - 6 College-specific types for progressive disclosure and exploration
- `.college/college/token-counter.ts` - Token counting utility with truncation support
- `.college/college/token-counter.test.ts` - 5 tests for token counting
- `.college/college/college-loader.ts` - CollegeLoader with three-tier loading and auto-discovery
- `.college/college/college-loader.test.ts` - 9 tests for CollegeLoader progressive disclosure

## Decisions Made
- DEPARTMENT.md parser extracts wings from markdown list with dash-separated descriptions
- Concept files parsed via regex extraction from TypeScript exports (not eval/import)
- Token budget enforcement truncates summary description when total exceeds 3K limit
- CollegeLoader constructor takes basePath for test isolation with temp directories

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- CollegeLoader ready for DepartmentExplorer (04-02) and TrySessionRunner (04-03)
- Types ready for all downstream College consumers
- getDepartmentContent() and getDepartmentPath() helper methods added for explorer/runner use

---
*Phase: 04-college-structure*
*Completed: 2026-03-01*
