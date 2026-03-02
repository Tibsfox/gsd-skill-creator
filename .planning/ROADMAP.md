# Roadmap: gsd-skill-creator

## Milestones

- ✅ **v1.49.8 Cooking With Claude** — Phases 0.5, 1-10 (shipped 2026-03-01)
- ✅ **v1.49.9 Learn Kung Fu** — Phases 11-21 (shipped 2026-03-01)
- 🚧 **v1.49.10 College Expansion** — Phases 22-27 (in progress)

## Phases

<details>
<summary>✅ v1.49.8 Cooking With Claude (Phases 0.5, 1-10) — SHIPPED 2026-03-01</summary>

- [x] Phase 0.5: Foundations Documentation (1/1 plans) — completed 2026-03-01
- [x] Phase 1: Foundation (3/3 plans) — completed 2026-03-01
- [x] Phase 2: Rosetta Core Engine (4/4 plans) — completed 2026-03-01
- [x] Phase 3: Calibration Engine (4/4 plans) — completed 2026-03-01
- [x] Phase 4: College Structure (4/4 plans) — completed 2026-03-01
- [x] Phase 5: Systems Panels and Mathematics Department (5/5 plans) — completed 2026-03-01
- [x] Phase 6: Heritage Panels (6/6 plans) — completed 2026-03-01
- [x] Phase 7: Cooking Department (7/7 plans) — completed 2026-03-01
- [x] Phase 8: Safety Warden and Cross-References (3/3 plans) — completed 2026-03-01
- [x] Phase 9: Integration Bridge (4/4 plans) — completed 2026-03-01
- [x] Phase 10: Test Suite and Verification (4/4 plans) — completed 2026-03-01

Full details: `.planning/milestones/v1.49.8-ROADMAP.md`

</details>

<details>
<summary>✅ v1.49.9 Learn Kung Fu (Phases 11-21) — SHIPPED 2026-03-01</summary>

- [x] Phase 11: Department Scaffold and Cultural Framework (1/1 plans) — completed 2026-03-01
- [x] Phase 12: Breath and Meditation Modules (1/1 plans) — completed 2026-03-01
- [x] Phase 13: Yoga and Pilates Modules (1/1 plans) — completed 2026-03-01
- [x] Phase 14: Martial Arts and Tai Chi Modules (1/1 plans) — completed 2026-03-01
- [x] Phase 15: Relaxation and Philosophy Modules (1/1 plans) — completed 2026-03-01
- [x] Phase 16: Try Sessions and Browse Access (1/1 plans) — completed 2026-03-01
- [x] Phase 17: Safety Warden Extensions (1/1 plans) — completed 2026-03-01
- [x] Phase 18: Practice Builder (1/1 plans) — completed 2026-03-01
- [x] Phase 19: Practice Journal and Calibration (1/1 plans) — completed 2026-03-01
- [x] Phase 20: Integration and Cross-Module Map (1/1 plans) — completed 2026-03-01
- [x] Phase 21: Test Suite and Verification (1/1 plans) — completed 2026-03-01

Full details: `.planning/milestones/v1.49.9-ROADMAP.md`

</details>

### 🚧 v1.49.10 College Expansion (Phases 22-27)

**Milestone Goal:** Integrate all previous education packs into the .college framework as flat, independently-discoverable subjects with dynamic virtual department composition. 41 subjects total (35 foundational + 3 specialized + 3 existing).

- [x] **Phase 22: Foundational Subject Migration** — Convert all 35 foundational packs to college department format in three tier batches (completed 2026-03-02)
- [x] **Phase 23: Specialized Pack Integration** — Integrate electronics, spatial-computing, and cloud-systems with domain-specific features preserved (completed 2026-03-02)
- [x] **Phase 24: Dynamic Mapping Layer** — JSON schema, default groupings, educational tracks, user custom views, hot-reload (completed 2026-03-02)
- [x] **Phase 25: Cross-Reference Network** — Import 63 dependency-graph edges, cross-department links, DepChainValidator, XREF-01 through XREF-05 satisfied (completed 2026-03-02)
- [ ] **Phase 26: Safety Extensions** — SafetyBoundary definitions for chemistry, electronics, physical-education, nutrition
- [ ] **Phase 27: Test Suite and Verification** — Discovery, loading, cross-references, mappings, safety, performance

## Phase Details

### Phase 22: Foundational Subject Migration
**Goal**: All 35 foundational knowledge packs exist as discoverable college departments with typed concepts, try-sessions, and calibration models
**Depends on**: Phase 21 (college framework with 3 proven departments)
**Requirements**: MIGR-01, MIGR-02, MIGR-03, MIGR-04, MIGR-05, MIGR-06
**Success Criteria** (what must be TRUE):
  1. CollegeLoader discovers all 35 new departments from the filesystem without any framework code changes
  2. Every department has exactly 5 wings, each wing containing typed RosettaConcept files derived from the source pack's YAML modules
  3. Department concept IDs follow the domain-prefix convention (phys-, chem-, art-, math-, etc.) matching the existing culinary-arts and mind-body patterns
  4. Try-sessions and calibration models exist for each department, derived from the source pack's activities and assessments
  5. DEPARTMENT.md for each subject is populated from .skillmeta fields (description, domain prefix, wing structure)
**Plans**: 3 plans (batch by tier: core_academic, applied_practical, specialized)

Plans:
- [x] 22-01-PLAN.md -- Core Academic batch (15 departments: math, science, reading, communication, critical-thinking, physics, chemistry, geography, history, problem-solving, statistics, business, engineering, materials, technology)
- [x] 22-02-PLAN.md -- Applied Practical batch (10 departments: coding, data-science, digital-literacy, writing, languages, logic, economics, environmental, psychology, nutrition)
- [x] 22-03-PLAN.md -- Specialized batch + discovery smoke test (10 departments: art, philosophy, nature-studies, physical-education, home-economics, theology, astronomy, learning, music, trades)

### Phase 23: Specialized Pack Integration
**Goal**: Electronics, Minecraft Knowledge World, and OpenStack/NASA SE packs are fully integrated as college departments with their domain-specific interactive features preserved
**Depends on**: Phase 22 (foundational migration pattern established)
**Requirements**: SPEC-01, SPEC-02, SPEC-03, SPEC-04, SPEC-05
**Success Criteria** (what must be TRUE):
  1. The electronics department has 5 tier-based wings and the MNA lab simulation is accessible through department try-sessions
  2. The spatial-computing department (Minecraft) has 5 wings with build-based try-sessions that preserve the spatial curriculum's hands-on structure
  3. The cloud-systems department (OpenStack/NASA SE) has 5 wings with runbook-based try-sessions
  4. Each specialized department's unique extension (MNA simulator, spatial builds, runbooks) is exposed through a department-specific interface, not replaced by the generic college format
  5. Chipset configurations from all three specialized packs are migrated to their respective department chipset/ directories
**Plans**: 1 plan

Plans:
- [x] 23-01: Electronics, spatial-computing, and cloud-systems department integration with domain-specific extensions (completed 2026-03-02 — 87 files, 45 typed RosettaConcept files, 3 chipset configs, 21 passing tests)

### Phase 24: Dynamic Mapping Layer
**Goal**: Users can compose virtual departments from the flat 41-subject pool, create educational tracks, build custom views, and see mapping changes take effect without restart
**Depends on**: Phase 22, Phase 23 (all 38 new subjects in place; independent of XREF and SAFE)
**Requirements**: MAP-01, MAP-02, MAP-03, MAP-04, MAP-05, MAP-06
**Success Criteria** (what must be TRUE):
  1. A default.json mapping file ships with at least 6 named virtual department groupings (Sciences, Computing, Humanities, Arts, and others) that the college explorer uses for navigation
  2. Educational track definitions exist with prerequisite ordering — a user following a track sees subjects in recommended sequence
  3. A user can create a custom mapping file in .college/mappings/user/ and browse it immediately as a virtual department without restarting
  4. Editing or deleting a mapping file takes effect in the running college explorer without a restart (hot-reload)
  5. Adding a new subject directory to .college/departments/ makes it immediately discoverable — zero code changes and zero mapping updates required
**Plans**: 1 plan

Plans:
- [x] 24-01: Mapping schema, default groupings, track definitions, user/ storage, hot-reload, zero-code extensibility (completed 2026-03-02 — 10 files, 18 tests passing, MAP-01 through MAP-06 satisfied)

### Phase 25: Cross-Reference Network
**Goal**: All 48 dependency-graph edges are imported as Rosetta cross-references, new cross-department links connect existing and new subjects, and Complex Plane positioning is assigned for all new concepts
**Depends on**: Phase 22, Phase 23 (subjects must exist before cross-referencing; independent of MAP and SAFE)
**Requirements**: XREF-01, XREF-02, XREF-03, XREF-04, XREF-05
**Success Criteria** (what must be TRUE):
  1. All 48 edges from dependency-graph.yaml appear as Rosetta cross-references and are navigable from any participating concept
  2. Cross-references between new and existing departments are validated: nutrition links to culinary-arts, physical-education links to mind-body, math-related packs link to the mathematics department
  3. The cross-reference resolver handles 41-department scale without measurable performance degradation compared to the 3-department baseline
  4. Every new concept has a Complex Plane position assigned (real axis = concreteness, imaginary axis = complexity)
  5. Dependency chain validation enforces max depth 4 and reports any circular references as build-time errors
**Plans**: 1 plan

Plans:
- [x] 25-01: XRefRegistry (63 dep-graph edges), XREF-02 concept links (nutrition↔culinary-arts, pe↔mind-body, math↔mathematics), DepChainValidator (max depth 4 + cycle detection), performance test (41 depts in ~2ms), 19 tests passing (completed 2026-03-02)

### Phase 26: Safety Extensions
**Goal**: Chemistry, electronics, physical-education, and nutrition departments have SafetyBoundary definitions that integrate with the existing 3-mode Safety Warden
**Depends on**: Phase 22, Phase 23 (departments must exist before safety boundaries can be defined)
**Requirements**: SAFE-01, SAFE-02, SAFE-03, SAFE-04, SAFE-05
**Success Criteria** (what must be TRUE):
  1. The chemistry department has SafetyBoundary definitions covering lab safety procedures (hazardous materials, ventilation, PPE)
  2. The electronics department has SafetyBoundary definitions covering electrical safety (voltage limits, grounding, component handling)
  3. The physical-education department has SafetyBoundary definitions covering injury prevention (overexertion, contraindicated movements, medical conditions)
  4. The nutrition department has SafetyBoundary definitions covering allergen management (common allergens, cross-contamination, substitution guidance)
  5. All four departments' safety boundaries activate the existing Safety Warden's annotate/gate/redirect modes correctly — no new warden infrastructure required
**Plans**: 1 plan

Plans:
- [ ] 26-01: SafetyBoundary definitions for chemistry, electronics, physical-education, and nutrition with Safety Warden integration

### Phase 27: Test Suite and Verification
**Goal**: A complete test suite verifies all 41 departments are discoverable, cross-references resolve, mappings are valid, safety boundaries enforce, token budgets hold, and CollegeLoader loads 41 departments in under 100ms
**Depends on**: Phase 22, Phase 23, Phase 24, Phase 25, Phase 26 (tests verify all prior phases)
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04, TEST-05, TEST-06, TEST-07
**Success Criteria** (what must be TRUE):
  1. Integration tests confirm all 41 departments are discovered, parsed, and loaded by CollegeLoader — zero failures
  2. Cross-reference integrity tests confirm every relationship target resolves to an existing concept across all 41 departments
  3. Mapping validation tests confirm all subjects referenced in default and track mappings exist as real directories — no orphan references
  4. Safety-critical tests verify that chemistry, electronics, physical-education, and nutrition SafetyBoundary definitions trigger the correct warden mode for test inputs
  5. Token budget tests confirm every department's summary tier stays under 3K tokens and every wing's active tier stays under 12K tokens
  6. Calibration model registration tests pass for all departments that define domain-specific models
  7. CollegeLoader performance test confirms 41 departments are discovered in under 100ms on a cold filesystem scan
**Plans**: 1 plan

Plans:
- [ ] 27-01: Full test suite — discovery, cross-reference integrity, mapping validation, safety-critical, token budget, calibration registration, performance

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 0.5 Foundations Docs | v1.49.8 | 1/1 | Complete | 2026-03-01 |
| 1-10 | v1.49.8 | 45/45 | Complete | 2026-03-01 |
| 11-21 | v1.49.9 | 11/11 | Complete | 2026-03-01 |
| 22. Foundational Subject Migration | 4/4 | Complete    | 2026-03-02 | 2026-03-02 |
| 23. Specialized Pack Integration | v1.49.10 | Complete    | 2026-03-02 | - |
| 24. Dynamic Mapping Layer | v1.49.10 | Complete    | 2026-03-02 | 2026-03-02 |
| 25. Cross-Reference Network | v1.49.10 | 1/1 | Complete | 2026-03-02 |
| 26. Safety Extensions | v1.49.10 | 0/1 | Not started | - |
| 27. Test Suite and Verification | v1.49.10 | 0/1 | Not started | - |
