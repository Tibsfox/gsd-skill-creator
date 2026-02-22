---
phase: 289-pipeline-orchestrator
plan: 01
subsystem: vtm
tags: [pipeline, types, speed-selector, research-necessity, vision-document]

# Dependency graph
requires:
  - phase: 279-types-schemas
    provides: VisionDocument, ResearchReference, MissionPackage, BudgetValidationResult
  - phase: 280-vision-processing
    provides: VisionDiagnostic, Archetype types
  - phase: 281-research-compilation
    provides: PipelineSpeed, KnowledgeTiers, SafetySection, SourceDiagnostic, detectResearchNecessity
  - phase: 282-mission-assembly
    provides: SelfContainmentDiagnostic
  - phase: 285-cache-optimization
    provides: CacheReport
  - phase: 284-model-assignment
    provides: BudgetValidationResult
provides:
  - PipelineConfig type with speed override and skip flags
  - PipelineStage literal union (vision | research | mission)
  - VisionStageResult, ResearchStageResult, MissionStageResult typed intermediates
  - PipelineError with stage, partial output, and recoverability
  - PipelineResult with fileManifest, executionSummary, durationMs
  - selectPipelineSpeed() pure function with override and auto-detection
  - Re-exported PipelineSpeed type
affects: [289-02-pipeline-orchestrator]

# Tech tracking
tech-stack:
  added: []
  patterns: [typed-intermediate-artifacts, stage-result-pattern, manual-override-with-auto-fallback]

key-files:
  created:
    - src/vtm/pipeline.ts
    - src/vtm/__tests__/pipeline.test.ts

key-decisions:
  - "Re-export PipelineSpeed from research-utils rather than redefining to maintain single source of truth"
  - "PipelineResult.executionSummary uses modelSplit with count+percentage per tier (matches MissionPackage shape)"
  - "PipelineError.recoverable is structural: true when vision stage completed, enabling partial-output recovery"

patterns-established:
  - "Stage result pattern: each pipeline stage produces a typed intermediate (VisionStageResult, etc.) consumed by next stage"
  - "Manual override with auto-fallback: config.speed set -> use it; unset -> delegate to detectResearchNecessity"

requirements-completed: [PIPE-01, PIPE-02, PIPE-03, PIPE-05]

# Metrics
duration: 3min
completed: 2026-02-22
---

# Phase 289 Plan 01: Pipeline Types and Speed Selector Summary

**Pipeline orchestrator type contract with 8 exported types and selectPipelineSpeed pure function wrapping detectResearchNecessity with manual override**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-22T11:20:25Z
- **Completed:** 2026-02-22T11:23:24Z
- **Tasks:** 2 (TDD RED + GREEN)
- **Files modified:** 2

## Accomplishments
- Defined all 8 pipeline types (PipelineStage, PipelineConfig, VisionStageResult, ResearchStageResult, MissionStageResult, PipelineError, PipelineResult, re-exported PipelineSpeed)
- Implemented selectPipelineSpeed as pure function: returns override when config.speed set, delegates to detectResearchNecessity otherwise
- 6 test cases covering override, auto-detection delegation, safety-domain, infrastructure archetype, error recoverability, and result structure
- Test file at 224 lines, implementation at 227 lines (exceeds 80-line minimum)

## Task Commits

Each task was committed atomically:

1. **RED: Failing tests for pipeline types and speed selector** - `deb9a0e` (test)
2. **GREEN: Implement pipeline types and speed selector** - `cf821da` (feat)

_TDD plan: RED (failing tests) -> GREEN (implementation passes)_

## Files Created/Modified
- `src/vtm/pipeline.ts` - Pipeline orchestrator types and selectPipelineSpeed function (227 lines)
- `src/vtm/__tests__/pipeline.test.ts` - TDD tests for pipeline types and speed selector (224 lines)

## Decisions Made
- Re-export PipelineSpeed from research-utils rather than redefining -- maintains single source of truth for the type
- PipelineResult.executionSummary uses modelSplit with count+percentage per tier, matching MissionPackage's executionSummary shape but with nested model split
- PipelineError.recoverable is a structural boolean: true when vision stage completed, enabling downstream consumers to use partial output

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All pipeline types defined and exported, ready for Plan 02 to implement the orchestrator function
- selectPipelineSpeed tested and working, ready for integration into pipeline execution
- Type imports from all 8 upstream modules verified clean (types.ts, vision-validator.ts, research-utils.ts, research-compiler.ts, mission-assembly.ts, cache-optimizer.ts, model-budget.ts)

## Self-Check: PASSED

- FOUND: src/vtm/pipeline.ts
- FOUND: src/vtm/__tests__/pipeline.test.ts
- FOUND: deb9a0e (RED commit)
- FOUND: cf821da (GREEN commit)

---
*Phase: 289-pipeline-orchestrator*
*Completed: 2026-02-22*
