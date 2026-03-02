---
phase: 22-foundational-subject-migration
plan: 01
subsystem: college
tags: [college, departments, rosetta-concepts, migration, academic]
dependency_graph:
  requires: []
  provides:
    - 15 core academic department directories with full concept scaffolds
    - typed RosettaConcept files for all 15 departments (310+ concept files)
    - integration tests for all 15 departments (60 tests)
    - try-sessions for all 15 departments (15 JSON files)
    - calibration stubs for 5 quantitative departments
  affects:
    - CollegeLoader auto-discovery (now discovers 39 total departments)
    - Phase 22-02 (applied practical departments build on these as dependencies)
    - Phase 22-03 (specialized departments cross-reference these concepts)
tech_stack:
  added: []
  patterns:
    - RosettaConcept pattern with complexPlanePosition (real/imaginary axes)
    - Domain-prefix convention for concept IDs (math-, sci-, phys-, etc.)
    - Calibration stub pattern with void engine parameter
    - Try-session JSON with steps containing conceptsExplored arrays
key_files:
  created:
    - .college/departments/math/math-department.ts
    - .college/departments/science/science-department.ts
    - .college/departments/reading/reading-department.ts
    - .college/departments/communication/communication-department.ts
    - .college/departments/critical-thinking/critical-thinking-department.ts
    - .college/departments/physics/physics-department.ts
    - .college/departments/chemistry/chemistry-department.ts
    - .college/departments/geography/geography-department.ts
    - .college/departments/history/history-department.ts
    - .college/departments/problem-solving/problem-solving-department.ts
    - .college/departments/statistics/statistics-department.ts
    - .college/departments/business/business-department.ts
    - .college/departments/engineering/engineering-department.ts
    - .college/departments/materials/materials-department.ts
    - .college/departments/technology/technology-department.ts
    - ".college/departments/*/DEPARTMENT.md (15 files)"
    - ".college/departments/*/concepts/*/*.ts (310+ concept files)"
    - ".college/departments/*/try-sessions/first-*.json (15 files)"
    - ".college/departments/{math,physics,chemistry,statistics,engineering}/calibration/*-calibration.ts"
    - ".college/departments/*/department.test.ts (15 test files, created in Task 1)"
  modified: []
decisions:
  - Math deviation: MATH-101 has only 4 source modules; M4 'Data, Probability & Statistics' was split into two wings ('data-probability' and 'statistics-inference') to meet the 5-wing requirement
  - Statistics department name is 'Accounting & Statistics' (reflecting STAT-101 pack content), not 'Statistics'
  - TDD RED phase for Task 2 was the pre-existing state (no concept files), so no separate RED commit was needed — verified by find command before writing
  - Calibration stubs use void engine parameter to avoid unused variable lint errors while remaining no-op
metrics:
  duration: ~3 sessions (context continuation required)
  tasks_completed: 3
  files_created: 460
  completed_date: "2026-03-01"
---

# Phase 22 Plan 01: Core Academic Department Migration Summary

15 core academic departments migrated from knowledge pack source data into typed `.college/departments/` directory structure. Each department has a DEPARTMENT.md, department definition TypeScript file with 5 wings, 20-23 typed RosettaConcept files across all wings, a try-session JSON, and (for quantitative departments) a calibration stub.

## What Was Built

**Departments created (15 total):**

| Department | Wings | Concepts | Try-Session | Calibration |
|---|---|---|---|---|
| Mathematics | 5 | 23 | first-exploration.json | math-calibration.ts |
| Science | 5 | 20 | first-experiment.json | — |
| Reading | 5 | 21 | first-read.json | — |
| Communication | 5 | 20 | first-presentation.json | — |
| Critical Thinking | 5 | 21 | first-analysis.json | — |
| Physics | 5 | 21 | first-experiment.json | physics-calibration.ts |
| Chemistry | 5 | 21 | first-reaction.json | chemistry-calibration.ts |
| Geography | 5 | 20 | first-map.json | — |
| History | 5 | 20 | first-investigation.json | — |
| Problem Solving | 5 | 20 | first-puzzle.json | — |
| Accounting & Statistics | 5 | 20 | first-dataset.json | statistics-calibration.ts |
| Business | 5 | 20 | first-venture.json | — |
| Engineering | 5 | 20 | first-design.json | engineering-calibration.ts |
| Materials & Fabrication | 5 | 20 | first-material.json | — |
| Technology | 5 | 20 | first-system.json | — |

**Total concept files:** 307 (plus index.ts barrel exports = 382 TypeScript files committed in Task 2)

**Integration tests:** 60 (15 departments × 4 tests: id, 5 wings, unique wing ids, token budget)

**All 60 tests pass. 20,796 total project tests pass.**

## Task Execution

### Task 1: Department Scaffolds

Created all 15 DEPARTMENT.md files, 15 *-department.ts files, and scaffolded 75 wing directories (5 per department). Integration tests written first (TDD RED) then implementation (TDD GREEN).

Commit `da62d76c` — TDD RED: 15 integration test files
Commit `f831968f` — TDD GREEN: 15 department scaffolds with DEPARTMENT.md + *.ts

### Task 2: Typed RosettaConcept Files

Created 307 concept files across all 15 departments. Each concept includes:
- Unique domain-prefix ID (e.g., `math-fractions-ratios`, `phys-conservation-of-energy`)
- 2-4 sentence description
- `complexPlanePosition` with real (concreteness) and imaginary (complexity) axes
- At least 1 relationship (`dependency`, `analogy`, or `cross-reference`)
- Index.ts barrel export per wing

Commit `2f19de2b` — 382 concept files (307 concepts + 75 index.ts exports)

### Task 3: Try-Sessions, Calibration Stubs, Tests Verification

Created 15 try-session JSON files and 5 calibration stubs. Integration tests verified passing.

Commit `e1b223cd` — 20 files (15 try-sessions + 5 calibration stubs)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Deviation] Math has only 4 source modules, not 5**
- **Found during:** Task 1
- **Issue:** MATH-101 has 4 modules (M1-M4) but the plan requires exactly 5 wings per department. M4 was "Data, Probability & Statistics" — an unusually broad module.
- **Fix:** Split M4 into two wings: "Data & Probability" (wing id: `data-probability`) and "Statistics & Inference" (wing id: `statistics-inference`). Documented in math-department.ts docstring.
- **Files modified:** `.college/departments/math/math-department.ts`
- **Commit:** f831968f

**2. [Rule 3 - TDD] Task 2 RED phase was pre-existing**
- **Found during:** Task 2 setup
- **Issue:** Plan marks Task 2 as `tdd="true"` requiring RED → GREEN commits. But the RED state was already the repository state (no concept files existed). No separate RED commit was needed.
- **Fix:** Verified RED state with `find` command output showing 0 concept files, then proceeded directly to GREEN implementation.
- **Commit:** N/A (pre-existing RED state)

## Self-Check: PASSED

| Check | Result |
|---|---|
| .college/departments/math/math-department.ts | FOUND |
| .college/departments/physics/physics-department.ts | FOUND |
| .college/departments/technology/technology-department.ts | FOUND |
| .college/departments/engineering/calibration/engineering-calibration.ts | FOUND |
| .college/departments/math/try-sessions/first-exploration.json | FOUND |
| commit da62d76c (TDD RED: integration tests) | FOUND |
| commit f831968f (TDD GREEN: department scaffolds) | FOUND |
| commit 2f19de2b (concept files) | FOUND |
| commit e1b223cd (try-sessions + calibration) | FOUND |
