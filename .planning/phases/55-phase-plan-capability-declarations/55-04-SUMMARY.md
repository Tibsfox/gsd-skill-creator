---
phase: 55-phase-plan-capability-declarations
plan: 04
subsystem: capabilities
tags: [roadmap-parser, capability-extraction, barrel-exports, planner-agent]

# Dependency graph
requires:
  - phase: 55-01
    provides: CapabilityVerb, CapabilityType, CapabilityRef types and parseCapabilityDeclarations
  - phase: 55-03
    provides: CapabilityValidator class and ValidationResult/ValidationWarning types
provides:
  - capabilitiesByPhase extraction in roadmap parser
  - PhaseInfo with optional capabilities field
  - Complete barrel exports for all Phase 55 additions
  - Planner agent capability inheritance documentation
affects: [planner-agent, phase-56-skill-injection, execute-phase, roadmap-parser]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Zod passthrough cast for cross-module type compatibility"
    - "Accumulate-and-flush pattern for multi-section line parsing"

key-files:
  created: []
  modified:
    - src/orchestrator/state/types.ts
    - src/orchestrator/state/roadmap-parser.ts
    - src/orchestrator/state/roadmap-parser.test.ts
    - src/capabilities/index.ts
    - .claude/agents/gsd-planner.md

key-decisions:
  - "Cast capabilitiesByPhase as ParsedRoadmap type to bridge inline Zod passthrough and CapabilityRef types"
  - "Omit capabilitiesByPhase from result when no phases have capabilities for backward compatibility"
  - "Planner inheritance rule: missing capabilities field = inherit all from parent phase"

patterns-established:
  - "Capability inheritance: plan WITH capabilities = selective override, plan WITHOUT = inherit all from phase"
  - "extractCapabilitiesByPhase accumulates lines per phase section then calls parseCapabilityDeclarations"

# Metrics
duration: 3min
completed: 2026-02-08
---

# Phase 55 Plan 04: Roadmap-Parser Wiring Summary

**Roadmap parser extracts capabilitiesByPhase, PhaseInfo supports capabilities, barrel exports complete, planner agent documents inheritance logic**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-08T21:47:04Z
- **Completed:** 2026-02-08T21:50:59Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Roadmap parser now extracts capability declarations from phase detail sections into capabilitiesByPhase
- PhaseInfo and ParsedRoadmap types updated with optional capabilities fields
- All Phase 55 types, parsers, and validator exported from capabilities/index.ts
- Planner agent documents full capability inheritance logic with examples

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire roadmap-parser capability extraction, update types, and update barrel exports** - `ea95946` (feat)
2. **Task 2: Document capability inheritance logic in planner agent** - `13d4d91` (docs)

## Files Created/Modified
- `src/orchestrator/state/types.ts` - Added optional capabilities to PhaseInfoSchema, capabilitiesByPhase to ParsedRoadmapSchema
- `src/orchestrator/state/roadmap-parser.ts` - Added extractCapabilitiesByPhase function, wired into parseRoadmap
- `src/orchestrator/state/roadmap-parser.test.ts` - Added 3 new tests for capability extraction
- `src/capabilities/index.ts` - Added barrel exports for CapabilityVerb, CapabilityType, CapabilityRef, parseCapabilityDeclarations, parseManifest, CapabilityValidator, ValidationResult, ValidationWarning
- `.claude/agents/gsd-planner.md` - Added capabilities frontmatter field, table row, and capability_inheritance section

## Decisions Made
- Cast capabilitiesByPhase as ParsedRoadmap type to bridge Zod passthrough index signature with CapabilityRef types
- Omit capabilitiesByPhase key entirely when no phases declare capabilities (backward compatible)
- Planner inheritance rule: missing capabilities field = inherit all from parent phase

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript type mismatch on conditional spread**
- **Found during:** Task 1 (roadmap-parser return value)
- **Issue:** Conditional spread `...(Object.keys(capabilitiesByPhase).length > 0 ? { capabilitiesByPhase } : {})` produced union type incompatible with ParsedRoadmap
- **Fix:** Changed to explicit result variable assignment with type cast
- **Files modified:** src/orchestrator/state/roadmap-parser.ts
- **Verification:** `npx tsc --noEmit` passes for modified files
- **Committed in:** ea95946 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary type compatibility fix. No scope creep.

## Issues Encountered
- Pre-existing js-yaml type declaration errors in unrelated files (bundles, orchestrator work-state, roles, skill-workflows) -- not caused by this plan
- Full test suite crashes from onnxruntime embedding singleton contention (known flaky test) -- not related to this plan

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 55 fully complete: types (55-01), manifest parser (55-02), validator (55-03), wiring (55-04)
- Planner agent ready to read capabilitiesByPhase and populate plan frontmatter
- Downstream Phase 56 (skill injection) can consume capabilities from roadmap parser output

---
*Phase: 55-phase-plan-capability-declarations*
*Completed: 2026-02-08*
