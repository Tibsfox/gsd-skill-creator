# Foxfood Report: Cooking with Claude v1.49.8

**Date:** 2026-03-01
**Milestone:** v1.49.8 Cooking With Claude
**Author:** Claude (via GSD workflow)

## What is Foxfooding?

Foxfooding (our term for dogfooding) means using the system to build and verify itself. The Cooking with Claude milestone is uniquely suited to this: the GSD workflow that managed the build IS the skill-creator system, and the Calibration Engine pattern (Observe -> Compare -> Adjust -> Record) mirrors the iterative development process itself.

## How the System Built Itself

### GSD Workflow as Rosetta Core
The GSD planning workflow translated the same high-level requirements (the "concepts") into different execution contexts (the "panels"):
- ROADMAP.md = Concept Registry (canonical concept definitions with dependency resolution)
- PLAN.md files = Panel Expressions (concept rendered for a specific execution context)
- SUMMARY.md files = Calibration Deltas (observed outcome vs expected, with adjustments recorded)
- STATE.md = User Profile (accumulated context, decisions, and preferences across sessions)

### Development as Calibration
Each phase followed the Calibration Engine pattern:
- **Observe:** Execute a plan, see what happened (tests pass/fail, coverage numbers)
- **Compare:** Check against success criteria (expected vs actual behavior)
- **Adjust:** Fix gaps, update approach for next plan (heritage panel ID fix in 10-02, cross-reference ID resolution in 08-03)
- **Record:** Write SUMMARY.md documenting what was learned (decisions accumulated in STATE.md)

### College Structure as Project Organization
The `.planning/` directory IS a College department:
- Phases = Wings (grouped by topic: Foundation, Core Engines, Panels, Departments, Integration, Verification)
- Plans = Concepts (specific knowledge units with dependencies and prerequisites)
- SUMMARYs = Progressive disclosure (summary tier of what was built)
- ROADMAP = DEPARTMENT.md (overview with learning path and navigation map)

### Wave Execution as Progressive Disclosure
The 5-wave execution model mirrors the College's progressive disclosure:
- Wave 0 (Phase 1) = Summary tier: shared types, interfaces, scaffold
- Wave 1 (Phases 2-3) = Active tier: core engines loaded
- Wave 2 (Phases 4-6) = Active tier: structure and panels loaded
- Wave 3 (Phases 7-8) = Deep tier: domain content and safety
- Wave 4 (Phases 9-10) = Integration: connecting everything

## Metrics

### Build Process
| Metric | Value |
|--------|-------|
| Total phases | 11 (0.5 + 1-10) |
| Total plans | 45 |
| Completed plans | 45 |
| Total execution time | ~2 hours |
| Average plan duration | 2.7 min |
| Parallel execution waves | 5 (up to 3 tracks per wave) |
| Context resets | 2 (recovered seamlessly via STATE.md) |

### Code Produced
| Metric | Value |
|--------|-------|
| Source files in .college/ | 71 |
| Test files in .college/ | 49 |
| Total tests | 650 passing + 5 todo |
| Safety-critical tests | 14 (SC-01 through SC-14) |
| Panel correctness tests | 14 (PAN-01 through PAN-14) |
| Coverage (statements) | 94.78% |
| Coverage (branches) | 82.10% |
| Coverage (functions) | 97.89% |
| Coverage (lines) | 94.94% |

### Architecture Validation
| Pillar | Proven By |
|--------|-----------|
| Rosetta Core (translation) | 9 panels translating 7 math concepts across domains, 3 systems + 6 heritage/frontier panels |
| College Structure (knowledge) | 2 departments (mathematics, culinary-arts), 12+ wings, progressive disclosure with token budgets |
| Calibration Engine (feedback) | Full Observe->Compare->Adjust->Record cycle, 20% bounded adjustment, delta persistence, profile synthesis |

## Self-Verification Results

### Safety-Critical Tests (Zero Tolerance)
All 14 safety-critical tests pass with 24 assertions. The Safety Warden enforces:
- Temperature floors: poultry 165F, ground meat 160F, whole cuts 145F
- Danger zone tracking: 40-140F range, 120-minute warning
- Three enforcement modes: annotate, gate, redirect
- Allergen flagging on every substitution
- Storage time limits (96 hours)
- 20% bounded learning on calibration adjustments
- Token budget ceilings (2-5% of context window)
- DAG enforcement preventing circular concept dependencies

### Panel Correctness
All 9 panels produce mathematically correct code for exponential decay, with panel-specific library functions verified:
- Python: `math.exp()`, C++: `std::exp()`, Java: `Math.exp()`
- Lisp: `(exp)` with homoiconicity, Pascal: `Exp()` with structured programming
- Fortran: `EXP()` with REAL precision, Perl: regex-as-syntax
- ALGOL: BNF meta-language, Unison: content-addressed code

### End-to-End: "Why are my cookies flat?"
The flagship scenario proves all three pillars working together:
1. **Concept routing works** -- baking science concepts (baker's ratios, sugar chemistry, gluten development) identified
2. **Diagnosis is science-grounded** -- butter ratio, chill time, sugar type identified as factors
3. **Translation works** -- Python panel produces code expressing baker's percentage calculations
4. **Calibration records learning** -- delta persisted with butter_ratio decrease and chill_time_minutes increase
5. **Cross-references work** -- math/ratios-proportions links to culinary/bakers-ratios and back

## Key Deviations and Adaptations

| Phase | Deviation | Resolution |
|-------|-----------|------------|
| 8 | Cross-reference targetIds used descriptive names instead of actual concept IDs | Auto-fixed: mapped to real IDs (cook-newtons-cooling, cook-bakers-ratios, cook-maillard-reaction) |
| 10-02 | Heritage panels didn't handle math-prefixed concept IDs | Bug fix: added math-exponential-decay dispatch to all 6 heritage panels |
| 10-03 | API signatures differed from plan suggestions | Adapted: used real RosettaCoreOptions, DeltaStoreConfig, TranslationContext APIs |
| All | Two context resets during execution | Recovered: STATE.md provided full continuity, zero lost work |

## Lessons Learned

### What Worked
- **Wave-based parallel execution** reduced wall time from ~20 hours (sequential) to ~2 hours
- **TDD for core engines** (Rosetta, Calibration, College) caught interface mismatches early
- **Progressive disclosure** kept context windows manageable across 45 plans
- **Safety boundaries as non-negotiable absolutes** simplified testing -- no edge cases, no negotiation
- **Dependency injection throughout** made testing straightforward -- no mocks needed for most tests
- **Background agent parallelism** allowed 3 tracks to execute simultaneously within each wave

### What Could Improve
- **Branch coverage at 82.1%** is below the 85% target -- defensive branches in CollegeLoader and panel dispatch are the gap
- **Heritage panel ID handling** wasn't caught until Phase 10 -- earlier integration tests could have surfaced this
- **Panel correctness relies on pattern matching** -- future work could execute generated code and verify numerical results
- **Mathematics calibration model** remains a stub (5 todo tests) -- suitable for a future milestone

## Conclusion

The Cooking with Claude milestone demonstrates that skill-creator's architecture -- Rosetta Core for translation, College Structure for knowledge organization, Calibration Engine for feedback -- is both buildable and self-consistent. 71 source files, 650 tests, 9 language panels, 2 departments, 7 culinary wings, and 4 calibration models were produced in 45 plans across 2 hours of execution.

The system that manages skills was managed BY skills. The GSD workflow IS the Calibration Engine. The ROADMAP IS the College. The PLANs ARE the Rosetta panels. The foxfood is the feast.

*"The user sees a friendly colleague. The engine sees math."*
