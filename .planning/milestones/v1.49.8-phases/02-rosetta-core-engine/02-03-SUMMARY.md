---
phase: 02-rosetta-core-engine
plan: 03
subsystem: core-engine
tags: [typescript, expression-renderer, progressive-disclosure, token-budget, calibration]

requires:
  - phase: 01-foundation
    provides: "PanelInterface abstract class, RosettaConcept, PanelExpression, CalibrationProfile types"
provides:
  - "ExpressionRenderer class with render() and renderCalibrated() methods"
  - "RenderedExpression interface with content, panelId, pedagogicalNotes, crossReferences, tokenCost"
  - "RenderDepth type ('summary' | 'active' | 'deep')"
affects: [02-04-engine, phase-4-college-structure, phase-9-integration]

tech-stack:
  added: []
  patterns: [3-tier-progressive-disclosure, token-cost-estimation, calibration-depth-derivation]

key-files:
  created:
    - ".college/rosetta-core/expression-renderer.ts"
    - ".college/rosetta-core/expression-renderer.test.ts"
  modified: []

key-decisions:
  - "Renderer is stateless -- receives panel instance as parameter, not from registry"
  - "Token estimation uses Math.ceil(content.length / 4) approximation"
  - "Calibration depth derivation: high confidence + negative complexity -> summary, positive -> deep, otherwise -> active"
  - "Truncation marker length accounted for in character budget to prevent off-by-one"

patterns-established:
  - "3-tier progressive disclosure: summary <=200 tokens, active <=1000 tokens, deep unlimited"
  - "Token cost tracking on every RenderedExpression output"
  - "Natural language fallback when panel or expression is unavailable"

requirements-completed: [CORE-03]

duration: 3min
completed: 2026-03-01
---

# Plan 02-03: Expression Renderer Summary

**ExpressionRenderer with 3-tier progressive disclosure (summary/active/deep), token cost tracking, calibration-adjusted depth, and natural-language fallback**

## Performance

- **Duration:** 3 min
- **Completed:** 2026-03-01
- **Tasks:** 2 (implementation + tests)
- **Files modified:** 2

## Accomplishments
- Three-depth rendering system enforcing progressive disclosure token limits
- Token cost estimation on every rendered expression
- Calibration-adjusted rendering derives depth from user's calibration profile
- Natural-language fallback when no panel expression exists
- 26 tests covering all depth tiers, calibration, fallback, and cross-references

## Task Commits

1. **Task 1: Implement ExpressionRenderer class** - `ad85f6b6` (feat)
2. **Task 2: Test ExpressionRenderer depth levels and calibration** - `ad85f6b6` (test, same commit)

## Files Created/Modified
- `.college/rosetta-core/expression-renderer.ts` - ExpressionRenderer class, RenderedExpression interface, RenderDepth type
- `.college/rosetta-core/expression-renderer.test.ts` - 26 tests across 7 describe blocks with MockPanel and fixture helpers

## Decisions Made
- Renderer receives panel as parameter (not from registry) to maintain statelessness
- Summary depth does NOT call panel.formatExpression -- builds from concept name/description only
- Active depth includes first 2 examples; deep includes all

## Deviations from Plan

### Auto-fixed Issues

**1. Active tier truncation off-by-one**
- **Found during:** Task 2 (token cost verification tests)
- **Issue:** Truncation marker "\n... [truncated at active tier]" not fully accounted for in character budget, causing 1001 tokens
- **Fix:** Computed marker length dynamically and subtracted from truncation point
- **Files modified:** .college/rosetta-core/expression-renderer.ts
- **Verification:** tokenCost <= 1000 verified in test
- **Committed in:** ad85f6b6

---

**Total deviations:** 1 auto-fixed (1 correctness fix)
**Impact on plan:** Fix was necessary for token budget compliance. No scope creep.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- ExpressionRenderer ready for Engine integration in Plan 02-04
- All exports (ExpressionRenderer, RenderedExpression, RenderDepth) available for downstream consumers

---
*Phase: 02-rosetta-core-engine*
*Completed: 2026-03-01*
