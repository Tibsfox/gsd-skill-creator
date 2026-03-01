# Roadmap: gsd-skill-creator

## Milestones

- 🚧 **v1.49.8 Cooking With Claude** - Phases 1-10 (in progress)

## Overview

v1.49.8 Cooking With Claude implements three architectural pillars: Rosetta Core (concept translation engine across 9 language panels), College Structure (knowledge as explorable code departments), and Calibration Engine (universal Observe→Compare→Adjust→Record feedback loop). The Cooking Department proves all three pillars with 7 wings of culinary knowledge grounded in food science, thermodynamics, and technique. Execution follows 5 waves — Foundation, Core Engines, Structure and Panels, Departments and Content, Integration and Verification — with up to 3 parallel tracks per wave.

## Phases

**Phase Numbering:**
- Integer phases (1-10): v1.49.8 milestone work following wave structure
- Decimal phases: urgent insertions only (via /gsd:insert-phase)

Waves map to phases as follows: Wave 0 → Phase 1, Wave 1 → Phases 2-3, Wave 2 → Phases 4-6, Wave 3 → Phases 7-8, Wave 4 → Phases 9-10.

### 🚧 v1.49.8 Cooking With Claude (Phases 0.5, 1-10)

- [x] **Phase 0.5: Foundations Documentation** - Fix 23 broken links in docs/foundations/, fill index.md stub (docs-only, no code deps) (2026-03-01)
- [x] **Phase 1: Foundation** - Shared types, Panel Interface contract, directory scaffold (2026-03-01)
- [x] **Phase 2: Rosetta Core Engine** - Concept Registry, Panel Router, Expression Renderer (2026-03-01)
- [x] **Phase 3: Calibration Engine** - Universal feedback loop, Safety Warden framework (2026-03-01)
- [x] **Phase 4: College Structure** - Department framework, progressive disclosure, try-sessions (2026-03-01)
- [x] **Phase 5: Systems Panels and Mathematics Department** - Python/C++/Java panels and Math Department seed (2026-03-01)
- [x] **Phase 6: Heritage Panels** - Lisp, Pascal, Fortran, Perl, ALGOL, Unison panels (2026-03-01)
- [x] **Phase 7: Cooking Department** - Seven wings of culinary knowledge with calibration models (2026-03-01)
- [x] **Phase 8: Safety Warden and Cross-References** - Culinary safety boundaries and Math-Cooking bridges (2026-03-01)
- [x] **Phase 9: Integration Bridge** - Observation pipeline, token budget, chipset adapters (2026-03-01)
- [ ] **Phase 10: Test Suite and Verification** - 85%+ coverage, 14 safety-critical tests, foxfood report

## Phase Details

### Phase 0.5: Documentation Fixes
**Goal**: Fix 4 broken relative links across docs/, correct 1 wrong link target, update 1 incorrect GitHub URL, and fill the foundations/index.md stub
**Depends on**: Nothing (docs-only, runs in parallel with any code phase)
**Requirements**: DOCS-01
**Success Criteria** (what must be TRUE):
  1. docs/architecture/README.md CHANGELOG.md link resolves (create or redirect to RELEASE-HISTORY.md)
  2. docs/architecture/README.md examples/ link points to ../../examples/README.md
  3. docs/framework/getting-started.md "GSD Teams Guide" link points to GSD-TEAMS.md
  4. docs/TROUBLESHOOTING.md GitHub issues URL points to Tibsfox/gsd-skill-creator
  5. foundations/index.md contains substantive Layer 1 overview content (not a stub)
**Plans**: 1 plan (00.5-01)

### Phase 1: Foundation
**Goal**: Shared types, Panel Interface contract, and directory scaffold exist so all parallel tracks in subsequent waves can build without coordination overhead
**Depends on**: Nothing (first phase)
**Requirements**: CORE-05
**Success Criteria** (what must be TRUE):
  1. All shared types (`RosettaConcept`, `PanelExpression`, `CalibrationDelta`, `CollegeDepartment`, `SafetyBoundary`) compile with `npx tsc --noEmit` and zero errors
  2. `PanelInterface` abstract class is implementable — a mock panel implementing it compiles and passes a smoke test
  3. `.college/` directory structure exists on disk matching the filesystem contract from the milestone spec
  4. A developer can start implementing any panel or engine in Wave 1 using only the types and interface from this phase
**Plans**: 3 plans
  - [x] 01-01-PLAN.md -- Shared type definitions (RosettaConcept, PanelExpression, CalibrationDelta, CollegeDepartment, SafetyBoundary, PanelId, CalibrationModel)
  - [x] 01-02-PLAN.md -- Panel Interface contract (PanelInterface abstract class, PanelRegistry, mock panel smoke test)
  - [x] 01-03-PLAN.md -- Directory scaffold (.college/ tree, stub files, DEPARTMENT.md templates)

### Phase 2: Rosetta Core Engine
**Goal**: The translation engine exists — concepts can be stored, routed to appropriate panels, and rendered as output
**Depends on**: Phase 1
**Requirements**: CORE-01, CORE-02, CORE-03, CORE-04
**Success Criteria** (what must be TRUE):
  1. Concept Registry stores and retrieves a concept with correct panel mappings and dependency resolution
  2. Panel Router selects the correct panel given a test context vector (domain, user preference, requested format)
  3. Expression Renderer produces formatted output from a panel-specific expression
  4. Rosetta Core translates the same concept (e.g., exponential growth) across 3 different panels and each output is correct
**Plans**: 4 plans
  - [x] 02-01-PLAN.md -- Concept Registry (ConceptRegistry class, dependency resolution, Complex Plane queries)
  - [x] 02-02-PLAN.md -- Panel Router (6-step routing logic, expertise/task/Complex Plane signals)
  - [x] 02-03-PLAN.md -- Expression Renderer (3-depth rendering, token cost, calibration-adjusted output)
  - [x] 02-04-PLAN.md -- Rosetta Engine + cross-panel integration tests (CORE-04: translate() pipeline, 3-panel proof)

### Phase 3: Calibration Engine
**Goal**: The universal feedback loop is operational — observations produce calibration deltas that persist and accumulate into user profiles
**Depends on**: Phase 1
**Requirements**: CAL-01, CAL-02, CAL-03, CAL-04, CAL-05, CAL-06
**Success Criteria** (what must be TRUE):
  1. Full Observe→Compare→Adjust→Record cycle completes on mock domain data without error
  2. A domain-specific `CalibrationModel` implementation (e.g., cooking temperature) can be plugged in without modifying the engine
  3. Calibration deltas written in one session are readable in a new session (persistence survives restart)
  4. Multiple deltas from the same domain combine into a coherent user profile with accurate confidence scores
  5. No single calibration adjustment changes any parameter by more than 20%
**Plans**: 4 plans
  - [x] 03-01-PLAN.md -- CalibrationEngine (universal Observe->Compare->Adjust->Record feedback loop, bounded adjustment)
  - [x] 03-02-PLAN.md -- DeltaStore (JSON file persistence for CalibrationDelta records)
  - [x] 03-03-PLAN.md -- ProfileSynthesizer (profile synthesis, confidence scoring)
  - [x] 03-04-PLAN.md -- Pluggability proof (DomainCalibrationModel integration test, API finalization)

### Phase 4: College Structure
**Goal**: The College framework loads departments with progressive disclosure and supports cross-department navigation as explorable code
**Depends on**: Phase 2
**Requirements**: COLL-01, COLL-02, COLL-03, COLL-04, COLL-05
**Success Criteria** (what must be TRUE):
  1. College framework loads a department's summary tier in under 3K tokens, active tier under 12K, deep tier on explicit request
  2. Department/wing/concept hierarchy is navigable — a developer can explore it as source code
  3. A try-session runner starts an interactive entry point for a test department without errors
  4. Cross-reference resolver links a concept in one department to a related concept in another
  5. A new department can be added by creating files in the correct directory — no changes to College framework code required
**Plans**: 4 plans
  - [x] 04-01-PLAN.md -- College types, token counter, CollegeLoader with progressive disclosure (COLL-01, COLL-02, COLL-05)
  - [x] 04-02-PLAN.md -- DepartmentExplorer and CrossReferenceResolver (COLL-02, COLL-04)
  - [x] 04-03-PLAN.md -- TrySessionRunner with step navigation and concept tracking (COLL-03)
  - [x] 04-04-PLAN.md -- Integration tests, test department extensibility proof, barrel export (all COLL requirements)

### Phase 5: Systems Panels and Mathematics Department
**Goal**: Python, C++, and Java panels implement the Panel Interface with correct math bindings, and the Mathematics Department is seeded with concepts from "The Space Between" that render correctly across all panels
**Depends on**: Phases 2, 4
**Requirements**: PANEL-01, PANEL-02, PANEL-03, MATH-01, MATH-02, MATH-03
**Success Criteria** (what must be TRUE):
  1. Python, C++, and Java panels each implement `PanelInterface` and compile without errors
  2. Mathematics Department contains concepts for exponential growth/decay, trig functions, complex numbers, and fractal geometry
  3. Any Mathematics Department concept renders correctly in all three systems panels (correct code, correct library bindings)
  4. Math concepts are positioned on the Complex Plane of Experience with valid `complexPlanePosition` values
**Plans**: 5 plans
  - [x] 05-01-PLAN.md -- Python panel (math.exp/numpy bindings, readability as mathematical notation, PAN-01/PAN-07/SC-12)
  - [x] 05-02-PLAN.md -- C++ panel (cmath/std::exp bindings, performance and precision, PAN-02/PAN-08/SC-13)
  - [x] 05-03-PLAN.md -- Java panel (Math.exp bindings, type safety and platform independence, PAN-03)
  - [x] 05-04-PLAN.md -- Mathematics Department concepts (7 concepts with complexPlanePosition, cross-references, MATH-01/MATH-03)
  - [x] 05-05-PLAN.md -- Integration tests (3 systems panels + 7 math concepts cross-rendering, 9-panel coexistence, MATH-02)

### Phase 6: Heritage Panels
**Goal**: All six heritage and frontier panels (Lisp, Pascal, Fortran, Perl, ALGOL, Unison) implement the Panel Interface with their distinctive pedagogical characteristics
**Depends on**: Phase 2
**Requirements**: PANEL-04, PANEL-05, PANEL-06, PANEL-07, PANEL-08, PANEL-09
**Success Criteria** (what must be TRUE):
  1. Lisp panel produces a concept definition that IS a manipulable data structure — demonstrating homoiconicity, not just describing it
  2. Pascal panel annotations encode Wirth's principles — a reader learns structured programming by exploring the code
  3. Fortran panel expresses array operations and numerical methods using authentic scientific computing idioms
  4. Perl panel demonstrates regex-as-syntax, closure factories, and POD-as-curriculum in a single concept example
  5. ALGOL panel shows BNF notation as meta-language and three-syntax architecture; Unison panel demonstrates content-addressed code with hash-based identity
**Plans**: 6 plans
  - [x] 06-01-PLAN.md -- Lisp panel (homoiconicity: concept definition IS data structure, S-expression representation, macro composition)
  - [x] 06-02-PLAN.md -- Pascal + Fortran panels (Wirth's principles in Pascal; scientific computing heritage in Fortran)
  - [x] 06-03-PLAN.md -- Perl panel (regex-as-syntax, closure factories, POD-as-curriculum, CPAN ecosystem)
  - [x] 06-04-PLAN.md -- ALGOL panel (BNF notation, block structure, three-syntax architecture, descendant tree)
  - [x] 06-05-PLAN.md -- Unison panel (content-addressed code, hash-based identity, abilities, codebase-as-database)
  - [x] 06-06-PLAN.md -- Integration tests (all 6 panels registered, cross-panel rendering, pedagogical verification)

### Phase 7: Cooking Department
**Goal**: All seven wings of the Cooking Department exist as navigable, calibration-aware knowledge organized as explorable College code
**Depends on**: Phases 3, 4
**Requirements**: COOK-01, COOK-02, COOK-03, COOK-04, COOK-05, COOK-06, COOK-07, COOK-08
**Success Criteria** (what must be TRUE):
  1. All seven wings (food science, thermodynamics, nutrition, technique, baking science, food safety, home economics) load and display at least three concepts each
  2. Cooking calibration models for temperature, timing, seasoning, and texture each produce a correct adjustment for a test input
  3. Given the scenario "user's cookies came out flat," the baking science wing provides a concept-grounded diagnosis (butter ratio, chill time)
  4. A novice user can complete a try-session for "first meal" from start to finish
  5. Each wing has at least one calibration rule that prevents adjustment below a safety boundary
**Plans**: 7 plans
  - [x] 07-01-PLAN.md -- Food Science wing (6 concepts: Maillard, emulsification, protein denaturation, starch gelatinization, caramelization, fermentation)
  - [x] 07-02-PLAN.md -- Thermodynamics wing (4 concepts: heat transfer, specific heat, altitude adjustments, Newton's cooling)
  - [x] 07-03-PLAN.md -- Nutrition + Technique wings (3+3 concepts: macronutrients, bioavailability, prep-nutrition; dry/wet/combination heat)
  - [x] 07-04-PLAN.md -- Baking Science wing (4 concepts: baker's ratios, gluten development, yeast biology, sugar chemistry)
  - [x] 07-05-PLAN.md -- Food Safety + Home Economics wings (4+4 concepts: danger zone, contamination, storage, allergens; meal planning, budget, pantry, preservation)
  - [x] 07-06-PLAN.md -- Cooking calibration models (4 DomainCalibrationModels: temperature, timing, seasoning, texture)
  - [x] 07-07-PLAN.md -- Integration tests + first-meal try-session (all 5 success criteria verification)

### Phase 8: Safety Warden and Cross-References
**Goal**: Absolute food safety boundaries are enforced across all three modes, and Math-Cooking concept bridges navigate correctly in both directions
**Depends on**: Phases 5, 7
**Requirements**: SAFE-01, SAFE-02, SAFE-03, SAFE-04, INTG-04
**Success Criteria** (what must be TRUE):
  1. Safety Warden blocks any recommendation for poultry below 165F, ground meat below 160F, whole cuts below 145F — no override possible
  2. Allergen flagging fires on every ingredient substitution regardless of user history or calibration state
  3. Safety Warden operates correctly in all three modes: annotate (flags concern in output), gate (requires explicit acknowledgment before proceeding), redirect (substitutes a safe alternative)
  4. Temperature danger zone tracker warns at 2+ hours in the 40-140F range
  5. A Math concept (e.g., exponential decay) navigates to its Cooking cross-reference (cooling curves) and back without errors
**Plans**: 3 plans
  - [x] 08-01-PLAN.md -- SafetyWarden class with three modes (annotate/gate/redirect), temperature floor enforcement, danger zone tracker (SAFE-01, SAFE-03, SAFE-04)
  - [x] 08-02-PLAN.md -- AllergenManager with Big 9 allergen database and substitution flagging, safety module barrel export (SAFE-02)
  - [x] 08-03-PLAN.md -- Integration tests: Math<->Cooking cross-reference bridges + safety-critical SC-01 through SC-08, INT-04, INT-07, INT-12 through INT-14 (INTG-04, all SAFE)

### Phase 9: Integration Bridge
**Goal**: Rosetta Core connects to the existing skill-creator observation pipeline, token budget enforcement works across all loading tiers, and chipset adapters route panels to specialist agents
**Depends on**: Phases 2, 3, 4, 6, 7, 8
**Requirements**: INTG-01, INTG-02, INTG-03
**Success Criteria** (what must be TRUE):
  1. Exploring a cooking concept in the College triggers pattern detection in the existing skill-creator observation pipeline
  2. Panel loading at every tier (summary, active, deep) stays within the 2-5% token budget ceiling
  3. Chipset adapter configuration loads without errors and routes panel requests to the correct specialist agents
**Plans**: 4 plans
  - [x] 09-01-PLAN.md -- Observation pipeline adapter (ObservationBridge emitting exploration/translation events compatible with SessionObserver)
  - [x] 09-02-PLAN.md -- Token budget enforcement adapter (TokenBudgetAdapter wrapping CollegeLoader with 2-5% ceiling)
  - [x] 09-03-PLAN.md -- Chipset adapter (ChipsetAdapter mapping panels to specialist engine domains)
  - [x] 09-04-PLAN.md -- Integration tests and barrel export (end-to-end verification of all three adapters)

### Phase 10: Test Suite and Verification
**Goal**: 85%+ test coverage across all new code, all 14 safety-critical tests pass with zero tolerance, and the foxfood report documents using the system to verify itself
**Depends on**: Phases 1-9 (all)
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04, TEST-05
**Success Criteria** (what must be TRUE):
  1. Test coverage report shows 85%+ across all `.college/` source files
  2. All 14 safety-critical tests (SC-01 through SC-14) pass — any failure in this group is a hard block on shipping
  3. Panel correctness tests verify mathematical accuracy: each panel produces numerically correct results for at least three mathematical concepts
  4. Integration tests verify cross-component interfaces: Rosetta Core → College → Calibration Engine round-trip completes without errors
  5. End-to-end scenario "user asks why are my cookies flat" produces a correct baking science diagnosis with a calibration delta recorded
**Plans**: 4 plans
  - [ ] 10-01-PLAN.md -- Coverage tooling and gap fill (vitest coverage config, calibration model tests, integration stub tests)
  - [ ] 10-02-PLAN.md -- Safety-critical (SC-01 through SC-14) and panel correctness (PAN-01 through PAN-14) canonical test suites
  - [ ] 10-03-PLAN.md -- Integration round-trip tests (Rosetta Core → College → Calibration Engine) and flat cookies e2e scenario
  - [ ] 10-04-PLAN.md -- Final coverage report, full test suite verification, foxfood report

## Progress

**Milestone:** v1.49.8 Cooking With Claude
**Wave structure:** Wave 0 (Phase 1) → Wave 1 (Phases 2-3 parallel) → Wave 2 (Phases 4-6 parallel) → Wave 3 (Phases 7-8 parallel) → Wave 4 (Phases 9-10 sequential)

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 0.5 Foundations Docs | v1.49.8 | 1/1 | Complete | 2026-03-01 |
| 1. Foundation | v1.49.8 | 3/3 | Complete | 2026-03-01 |
| 2. Rosetta Core Engine | v1.49.8 | 4/4 | Complete | 2026-03-01 |
| 3. Calibration Engine | v1.49.8 | 4/4 | Complete | 2026-03-01 |
| 4. College Structure | v1.49.8 | 4/4 | Complete | 2026-03-01 |
| 5. Systems Panels and Mathematics Dept | v1.49.8 | 5/5 | Complete | 2026-03-01 |
| 6. Heritage Panels | v1.49.8 | 6/6 | Complete | 2026-03-01 |
| 7. Cooking Department | v1.49.8 | 7/7 | Complete | 2026-03-01 |
| 8. Safety Warden and Cross-References | v1.49.8 | 3/3 | Complete | 2026-03-01 |
| 9. Integration Bridge | v1.49.8 | 4/4 | Complete | 2026-03-01 |
| 10. Test Suite and Verification | 2/4 | In Progress|  | - |
