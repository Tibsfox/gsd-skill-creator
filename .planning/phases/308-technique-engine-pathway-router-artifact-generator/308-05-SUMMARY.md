---
phase: 308-technique-engine-pathway-router-artifact-generator
plan: "05"
subsystem: brainstorm
tags: [pathway-router, signal-matching, technique-sequencing, mid-session-adaptation, json-configs]

# Dependency graph
requires:
  - phase: 305-foundation-types-bus
    provides: Shared types (PathwayId, PathwayConfig, TechniqueId, SessionState), PathwayConfigSchema
  - phase: 308-01
    provides: TechniqueEngine with lazy factory registry and 4 individual technique factories
  - phase: 308-02
    provides: 5 collaborative technique factories (brainwriting-635, round-robin, brain-netting, rolestorming, figure-storming)
  - phase: 308-03
    provides: 4 analytical technique factories (scamper, six-thinking-hats, starbursting, five-whys)
  - phase: 308-04
    provides: 3 visual technique factories (storyboarding, affinity-mapping, lotus-blossom)
provides:
  - PathwayRouter class with recommendPathway, getPathway, getTechniqueQueue, adaptTechniqueQueue
  - IPathwayRouter interface and AdaptationSignal type
  - 5 pathway JSON configs (creative-exploration, problem-solving, product-innovation, decision-making, free-form)
  - Complete 16-technique engine registry (all techniques loadable)
affects: [308-06-integration-tests, 309-session-manager, 310-phase-controller]

# Tech tracking
tech-stack:
  added: []
  patterns: [signal-word-scoring, phrase-based-recommendation, mid-session-resequencing, json-config-with-zod-validation]

key-files:
  created:
    - src/brainstorm/pathways/router.ts
    - src/brainstorm/pathways/configs/creative-exploration.json
    - src/brainstorm/pathways/configs/problem-solving.json
    - src/brainstorm/pathways/configs/product-innovation.json
    - src/brainstorm/pathways/configs/decision-making.json
    - src/brainstorm/pathways/configs/free-form.json
  modified:
    - src/brainstorm/techniques/engine.ts

key-decisions:
  - "Signal word matching uses phrase inclusion (inputLower.includes(phrase)) not token splitting -- matches multi-word phrases like 'how might we'"
  - "Tie-breaking order: creative-exploration wins ties due to broadest applicability; free-form fallback when no signals match"
  - "creative-exploration recommended_for expanded with 'imagine', 'explore', 'possibilities', 'discover', 'create', 'new ideas', 'starting fresh'"
  - "HIGH_EFFORT_TECHNIQUES and HIGH_ENERGY_TECHNIQUES as module-level constants for adaptation signal handling"
  - "adaptTechniqueQueue works on queue copy -- never mutates input array"
  - "PathwayConfigSchema import from types.js (not schemas.js) -- schema lives in types module"

patterns-established:
  - "JSON config loading at construction with Zod parse validation and sync fs.readFileSync"
  - "Signal word index: Map<string, PathwayId[]> built from recommended_for arrays for O(1) lookup"
  - "AdaptationSignal discriminated union with 4 signal types for mid-session resequencing"
  - "ESM-compatible dirname via import.meta.url + fileURLToPath for config path resolution"

requirements-completed: [PATH-01, PATH-02, PATH-03, PATH-04]

# Metrics
duration: 4min
completed: 2026-02-22
---

# Phase 308 Plan 05: Pathway Router Summary

**PathwayRouter with signal-word recommendation across 5 JSON-config pathways, mid-session resequencing for 4 adaptation signals, and complete 16-technique engine registry**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-22T18:40:19Z
- **Completed:** 2026-02-22T18:44:36Z
- **Tasks:** 2
- **Files created:** 7
- **Files modified:** 1

## Accomplishments

- PathwayRouter with signal-word scoring that correctly routes "how might we reduce" to problem-solving and "imagine new possibilities" to creative-exploration
- 5 pathway JSON configs with complete technique sequences: creative-exploration (6 steps), problem-solving (4), product-innovation (3), decision-making (2), free-form (0 / user-directed)
- Mid-session resequencing handling 4 adaptation signals: low_energy (remove high-effort, insert high-energy), user_request (insert at front), saturation (skip technique), analytical_depth_needed (insert starbursting/five-whys)
- Engine registry updated from 4 to 16 technique registrations (all individual + collaborative + analytical + visual)

## Task Commits

Each task was committed atomically:

1. **Task 1: Pathway JSON configs and complete engine registry** - `98f19ed` (feat)
2. **Task 2: PathwayRouter with signal matching and mid-session resequencing** - `192eefa` (feat)

## Files Created/Modified

- `src/brainstorm/pathways/router.ts` - PathwayRouter class implementing IPathwayRouter with recommendPathway, getPathway, getTechniqueQueue, adaptTechniqueQueue
- `src/brainstorm/pathways/configs/creative-exploration.json` - Creative Exploration: Freewriting -> Mind Mapping -> Rapid Ideation x3 -> Affinity Mapping
- `src/brainstorm/pathways/configs/problem-solving.json` - Problem-Solving: Question Brainstorming -> Starbursting -> Five Whys -> SCAMPER
- `src/brainstorm/pathways/configs/product-innovation.json` - Product Innovation: SCAMPER -> Rolestorming -> Lotus Blossom
- `src/brainstorm/pathways/configs/decision-making.json` - Decision-Making: Six Thinking Hats -> Storyboarding
- `src/brainstorm/pathways/configs/free-form.json` - Free-Form: empty sequence (user-directed)
- `src/brainstorm/techniques/engine.ts` - Updated with all 16 technique factory registrations

## Decisions Made

- **Phrase inclusion matching**: recommendPathway uses `inputLower.includes(phrase)` to match multi-word signal phrases like "how might we" and "existing product", rather than splitting to individual tokens. This preserves phrase semantics.
- **Tie-breaking order**: Creative-exploration checked first in tie-break loop, so it wins ties. Free-form returned only when all scores are zero. This follows the spec's "broadest applicability" rationale.
- **Expanded creative-exploration signals**: Added "imagine", "explore", "possibilities", "discover", "create", "new ideas", "starting fresh" to creative-exploration's recommended_for to ensure inputs like "imagine new possibilities" match correctly.
- **Module-level technique sets**: HIGH_EFFORT_TECHNIQUES (Set) and HIGH_ENERGY_TECHNIQUES (array) defined as module constants for clean adaptation signal handling.
- **PathwayConfigSchema location**: Schema is in types.ts, not schemas.ts as plan suggested. Import corrected to `'../shared/types.js'` (Rule 3 auto-fix).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] PathwayConfigSchema import path correction**
- **Found during:** Task 2 (PathwayRouter implementation)
- **Issue:** Plan specified `import from '../shared/schemas.js'` but PathwayConfigSchema is defined in `../shared/types.ts`
- **Fix:** Changed import to `from '../shared/types.js'`
- **Files modified:** src/brainstorm/pathways/router.ts
- **Verification:** TypeScript compilation passes with no errors
- **Committed in:** 192eefa (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking import path)
**Impact on plan:** Trivial path correction. No scope creep.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- PathwayRouter ready for Facilitator agent to call recommendPathway and adaptTechniqueQueue
- All 16 techniques loadable via TechniqueEngine for any pathway sequence
- Plan 06 (integration tests) can verify end-to-end pathway-to-technique loading
- Session Manager (Phase 309) can use PathwayRouter for pathway selection at session creation

---
*Phase: 308-technique-engine-pathway-router-artifact-generator*
*Completed: 2026-02-22*
