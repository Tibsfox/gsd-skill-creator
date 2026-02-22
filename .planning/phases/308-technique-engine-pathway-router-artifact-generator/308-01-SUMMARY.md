---
phase: 308-technique-engine-pathway-router-artifact-generator
plan: "01"
subsystem: brainstorm
tags: [technique-engine, freewriting, mind-mapping, rapid-ideation, question-brainstorming, registry-pattern]

# Dependency graph
requires:
  - phase: 305-foundation-types-bus
    provides: Shared types (TechniqueId, TechniqueConfig, Idea, Question, SessionState) and constants (TECHNIQUE_DEFAULTS)
provides:
  - TechniqueEngine class with loadTechnique, getConfig, listByCategory, listBySituation
  - ITechniqueEngine and TechniqueInstance interfaces for all technique implementations
  - TechniqueOutput and VisualizationData types for round output
  - 4 individual techniques (freewriting, mind-mapping, rapid-ideation, question-brainstorming)
  - Factory registration pattern for pluggable technique loading
affects: [308-02-collaborative-techniques, 308-03-analytical-techniques, 308-04-visual-techniques, 308-05-pathway-router, 309-session-manager]

# Tech tracking
tech-stack:
  added: []
  patterns: [lazy-factory-registry, technique-instance-lifecycle, generation-context-encoding]

key-files:
  created:
    - src/brainstorm/techniques/engine.ts
    - src/brainstorm/techniques/individual/freewriting.ts
    - src/brainstorm/techniques/individual/mind-mapping.ts
    - src/brainstorm/techniques/individual/rapid-ideation.ts
    - src/brainstorm/techniques/individual/question-brainstorming.ts
  modified: []

key-decisions:
  - "Lazy factory registry pattern: Map<TechniqueId, () => TechniqueInstance> avoids eager instantiation"
  - "Each loadTechnique() call creates a fresh instance (not cached) for independent state"
  - "listBySituation uses simple keyword matching against name+description (lightweight, not NLP)"
  - "generation_context encoded in config.parameters per Pitfall 5 to prevent fidelity erosion"

patterns-established:
  - "Technique factory pattern: each module exports createXxxTechnique() function registered with the engine"
  - "TechniqueInstance lifecycle: initialize() -> generateRound() -> getState()/isComplete()"
  - "Content placeholder pattern: deterministic content based on problem+context for configuration signals"
  - "Parent_id chains: freewriting uses linear chain, mind-mapping uses tree structure"

requirements-completed: [TECH-01, TECH-02]

# Metrics
duration: 6min
completed: 2026-02-22
---

# Phase 308 Plan 01: Technique Engine & Individual Techniques Summary

**Pluggable TechniqueEngine with lazy factory registry and 4 individual techniques, each with technique-specific generation_context preventing fidelity erosion**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-22T18:29:50Z
- **Completed:** 2026-02-22T18:35:46Z
- **Tasks:** 2
- **Files created:** 5

## Accomplishments

- TechniqueEngine class with ITechniqueEngine interface providing loadTechnique, getConfig, listByCategory, listBySituation
- Lazy factory registry (Map<TechniqueId, () => TechniqueInstance>) -- each loadTechnique() creates fresh, independent instance
- 4 individual techniques implemented with technique-specific completion criteria and generation_context
- listByCategory('individual') returns exactly 4 TechniqueConfig objects sorted alphabetically
- All 5 files compile with zero type errors; runtime verification confirms correct instantiation

## Task Commits

Each task was committed atomically:

1. **Task 1: Technique Engine core interface and registry** - `12abff7` (feat)
2. **Task 2: Individual technique implementations (4 techniques)** - `e8461a8` (feat)

## Files Created

- `src/brainstorm/techniques/engine.ts` - TechniqueEngine class, ITechniqueEngine/TechniqueInstance interfaces, TechniqueOutput/VisualizationData types, lazy factory registry with keyword-based situation search
- `src/brainstorm/techniques/individual/freewriting.ts` - Stream-of-consciousness technique with parent_id associative chains, min_ideas_per_minute completion
- `src/brainstorm/techniques/individual/mind-mapping.ts` - Tree-structured radial expansion with root node, configurable branch depth, VisualizationData output
- `src/brainstorm/techniques/individual/rapid-ideation.ts` - Time-pressure bursts (5-10 ideas/round), 10-word max enforced via truncateToWords(), target_count completion
- `src/brainstorm/techniques/individual/question-brainstorming.ts` - Question-only output (no ideas), W-category cycling (who/what/where/when/why/how), min_questions completion

## Decisions Made

- **Lazy factory registry** -- Map<TechniqueId, () => TechniqueInstance> with fresh instance per loadTechnique() call. Avoids shared state between concurrent technique usages.
- **generation_context as config parameter** -- Each technique stores its unique mechanic description in config.parameters.generation_context to guide LLM/agent behavior and prevent fidelity erosion (per Pitfall 5 from PITFALLS.md).
- **listBySituation as keyword matching** -- Simple split-and-search against name+description, scored by match count. Deliberately lightweight -- the Pathway Router handles sophisticated signal analysis.
- **Deterministic placeholder content** -- generateRound() produces template content based on problem statement, not random text. Content fields are configuration signals for the implementing LLM/agent.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Engine core ready for collaborative techniques (plan 02), analytical techniques (plan 03), and visual techniques (plan 04) to register additional factories
- TechniqueInstance interface established as the template pattern for all subsequent technique implementations
- Pathway Router (plan 05) can call listByCategory and listBySituation for technique selection

## Self-Check: PASSED

- All 5 created files verified on disk
- Both task commits (12abff7, e8461a8) verified in git history
- TypeScript compilation: zero errors in brainstorm/techniques tree
- Runtime verification: listByCategory('individual') returns 4 techniques correctly

---
*Phase: 308-technique-engine-pathway-router-artifact-generator*
*Completed: 2026-02-22*
