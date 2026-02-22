# Roadmap: GSD Skill Creator

## Milestones

- ✅ **v1.0-v1.11** — Foundation through Chipset Architecture (Phases 1-87)
- ✅ **v1.12** — GSD Planning Docs Dashboard (Phases 88-93, shipped 2026-02-09)
- ✅ **v1.12.1** — Live Metrics Dashboard (Phases 94-100, shipped 2026-02-10)
- ✅ **v1.13** — Session Lifecycle & Workflow Coprocessor (Phases 101-114, shipped 2026-02-11)
- ✅ **v1.14** — Promotion Pipeline (Phases 115-122, shipped 2026-02-13)
- ✅ **v1.15** — Live Dashboard Terminal (Phases 123-127, shipped 2026-02-13)
- ✅ **v1.16** — Dashboard Console & Milestone Ingestion (Phases 128-133, shipped 2026-02-13)
- ✅ **v1.17** — Staging Layer (Phases 134-141, shipped 2026-02-13)
- ✅ **v1.18** — Information Design System (Phases 142-148, shipped 2026-02-14)
- ✅ **v1.19** — Budget Display Overhaul (Phases 149-151, shipped 2026-02-14)
- ✅ **v1.20** — Dashboard Assembly (Phases 152-157, shipped 2026-02-14)
- ✅ **v1.21** — GSD-OS Desktop Foundation (Phases 158-168, shipped 2026-02-14)
- ✅ **v1.22** — Minecraft Knowledge World (Phases 169-198, shipped 2026-02-19)
- ✅ **v1.23** — Project AMIGA (Phases 199-222, shipped 2026-02-19)
- ✅ **v1.24** — GSD Conformance Audit & Hardening (Phases 223-230, shipped 2026-02-19)
- ✅ **v1.25** — Ecosystem Integration (Phases 231-235, shipped 2026-02-19)
- ✅ **v1.26** — Aminet Archive Extension Pack (Phases 236-242, shipped 2026-02-19)
- ✅ **v1.27** — Foundational Knowledge Packs (Phases 243-254, shipped 2026-02-20)
- ✅ **v1.28** — GSD Den Operations (Phases 255-261, shipped 2026-02-21)
- ✅ **v1.29** — Electronics Educational Pack (Phases 262-278, shipped 2026-02-21)
- [ ] **v1.30** — Vision-to-Mission Pipeline (Phases 279-289, in progress)

## Phases

<details>
<summary>v1.29 Electronics Educational Pack (Phases 262-278) — SHIPPED 2026-02-21</summary>

- [x] Phase 262: Pack Scaffold (2/2 plans) — completed 2026-02-21
- [x] Phase 263: MNA Circuit Simulator Core (3/3 plans) — completed 2026-02-21
- [x] Phase 264: Instruments and Reference Tests (3/3 plans) — completed 2026-02-21
- [x] Phase 265: Digital Logic Simulator (3/3 plans) — completed 2026-02-21
- [x] Phase 266: Safety Warden (2/2 plans) — completed 2026-02-21
- [x] Phase 267: Learn Mode System (2/2 plans) — completed 2026-02-21
- [x] Phase 268: Tier 1 Foundations Modules 1-3 (3/3 plans) — completed 2026-02-21
- [x] Phase 269: Tier 2 Modules 4-5 (3/3 plans) — completed 2026-02-21
- [x] Phase 270: Tier 2 Modules 6-7 (3/3 plans) — completed 2026-02-21
- [x] Phase 271: Tier 3 Module 7A (1/1 plans) — completed 2026-02-21
- [x] Phase 272: Tier 3 Module 8 (1/1 plans) — completed 2026-02-21
- [x] Phase 273: Tier 3 Modules 9-10 (3/3 plans) — completed 2026-02-21
- [x] Phase 274: Tier 4 Modules 11-12 (3/3 plans) — completed 2026-02-21
- [x] Phase 275: Tier 4 Module 13 PLC (2/2 plans) — completed 2026-02-21
- [x] Phase 276: Tier 4 Module 14 Off-Grid Power (2/2 plans) — completed 2026-02-21
- [x] Phase 277: Tier 4 Module 15 PCB Design (2/2 plans) — completed 2026-02-21
- [x] Phase 278: Integration Testing (1/1 plans) — completed 2026-02-21

</details>

### v1.30 — Vision-to-Mission Pipeline (Phases 279-289)

**Milestone Goal:** Implement the vision-to-mission transformation pipeline as TypeScript modules — turning the prompt-based Claude Code skill into a proper code implementation with Zod-validated types, document parsers, wave planner, model assignment engine, cache optimizer, test plan generator, template system, and end-to-end pipeline orchestrator.

- [x] **Phase 279: Types & Schemas** - Foundation Zod schemas for all VTM document structures (completed 2026-02-21)
- [x] **Phase 280: Vision Document Processing** - Parser, validator, quality checker, archetype classifier (completed 2026-02-21)
- [x] **Phase 281: Research Reference Compilation** - Research compiler, knowledge chunker, safety extractor (completed 2026-02-21)
- [x] **Phase 282: Mission Package Assembly** - Assembler, spec generators, self-containment validator (completed 2026-02-21)
- [x] **Phase 283: Wave Planning** - Wave planner, parallel track detection, dependency graph (completed 2026-02-21)
- [x] **Phase 284: Model Assignment** - Model assignment engine with Opus/Sonnet/Haiku classification (completed 2026-02-22)
- [x] **Phase 285: Cache Optimization** - Cache optimizer, TTL validator, token savings estimator (2 plans) (completed 2026-02-22)
- [ ] **Phase 286: Test Plan Generation** - Test plan generator, verification matrix, safety classification
- [ ] **Phase 287: Template System** - Template loader, renderer, validator, registry
- [ ] **Phase 288: Pipeline Orchestrator** - End-to-end three-stage pipeline management
- [ ] **Phase 289: Integration & Testing** - Barrel exports, chipset, eval harness, integration tests

## Phase Details

### Phase 279: Types & Schemas
**Goal**: All VTM data structures are defined as Zod schemas with TypeScript types inferred, giving every downstream module a validated foundation to build on
**Depends on**: Nothing (first phase)
**Requirements**: TYPE-01, TYPE-02, TYPE-03, TYPE-04, TYPE-05, TYPE-06, TYPE-07, TYPE-08
**Success Criteria** (what must be TRUE):
  1. Importing from src/vtm/types.ts provides typed interfaces for vision documents, research references, mission packages, component specs, wave plans, test plans, and chipset configs
  2. Parsing a valid vision document JSON through the Zod schema succeeds and returns a fully typed object; parsing invalid input returns structured validation errors
  3. Model assignment enum constrains values to exactly Opus, Sonnet, and Haiku with associated token estimation types
  4. The 60/40 principle constraint is encoded in the type system such that budget validators can enforce the ~55-65% Sonnet / ~25-35% Opus / ~5-15% Haiku split
**Plans:** 2/2 plans complete
Plans:
- [ ] 279-01-PLAN.md — Foundation schemas: ModelAssignment, VisionDocument, ResearchReference, ChipsetConfig (TDD)
- [ ] 279-02-PLAN.md — Composite schemas: ComponentSpec, WaveExecutionPlan, TestPlan, MissionPackage + barrel export (TDD)

### Phase 280: Vision Document Processing
**Goal**: Users can feed a vision document markdown file into the processor and get back a validated, classified, typed representation with quality feedback and extracted dependencies
**Depends on**: Phase 279
**Requirements**: VDOC-01, VDOC-02, VDOC-03, VDOC-04, VDOC-05
**Success Criteria** (what must be TRUE):
  1. Parser accepts a vision document markdown string and returns a typed object with all structured sections (Vision, Problem Statement, Core Concept, Architecture, Chipset, Success Criteria, Through-Line) extracted
  2. Validator reports missing required sections, empty sections, and quality check failures as a structured diagnostics list
  3. Quality checker rejects vague success criteria, invalid chipset YAML, missing dependencies, and through-lines that do not reference an ecosystem principle
  4. Archetype classifier categorizes any vision document as Educational Pack, Infrastructure Component, Organizational System, or Creative Tool
  5. Dependency extractor produces a dependency list from the "Depends on" header and relationship table
**Plans:** 2/2 plans complete
Plans:
- [ ] 280-01-PLAN.md — Vision document parser and dependency extractor (TDD)
- [ ] 280-02-PLAN.md — Validator, quality checker, and archetype classifier (TDD)

### Phase 281: Research Reference Compilation
**Goal**: Users can generate structured, tiered research references from a vision document, with quality-checked sources and consolidated safety considerations
**Depends on**: Phase 280
**Requirements**: RREF-01, RREF-02, RREF-03, RREF-04, RREF-05
**Success Criteria** (what must be TRUE):
  1. Research compiler accepts a parsed vision document and produces a structured research reference with per-module sections
  2. Knowledge chunker splits research into summary (~2K tokens), active (~10K tokens), and reference (full) tiers with token count estimates for each
  3. Safety extractor collects all safety considerations into a consolidated section with boundary classifications
  4. Research necessity detector determines pipeline speed (full/skip-research/mission-only) from domain analysis and returns a typed recommendation
**Plans:** 2/2 plans complete
Plans:
- [ ] 281-01-PLAN.md — Research compiler and source quality checker (TDD)
- [ ] 281-02-PLAN.md — Knowledge chunker, safety extractor, and research necessity detector (TDD)

### Phase 282: Mission Package Assembly
**Goal**: Users can produce a complete, self-contained mission package (README, milestone spec, component specs, wave plan, test plan) from a vision document and optional research reference
**Depends on**: Phase 281
**Requirements**: MPKG-01, MPKG-02, MPKG-03, MPKG-04, MPKG-05, MPKG-06
**Success Criteria** (what must be TRUE):
  1. Assembler produces a complete mission package directory structure from vision document and optional research input
  2. Each component spec is self-contained: all shared types, interface contracts, and architectural context are copied inline rather than cross-referenced
  3. Self-containment validator rejects component specs that reference external files without inlining the content
  4. README includes file manifest, execution summary (task/track/wave counts, model split percentages), and usage instructions
  5. File count scales with complexity: 4-5 files for simple features, 6-8 for medium packs, 8-12 for complex systems
**Plans:** 2/2 plans complete
Plans:
- [ ] 282-01-PLAN.md — Mission assembly generators, self-containment validator, and file count estimator (TDD)
- [ ] 282-02-PLAN.md — Mission package assembler orchestrator and barrel export (TDD)

### Phase 283: Wave Planning
**Goal**: Users can decompose a mission into dependency-ordered waves with parallel tracks, a critical-path dependency graph, and risk analysis
**Depends on**: Phase 282
**Requirements**: WAVE-01, WAVE-02, WAVE-03, WAVE-04, WAVE-05, WAVE-06
**Success Criteria** (what must be TRUE):
  1. Wave planner decomposes mission components into ordered waves (foundation, parallel, integration, polish) respecting dependencies
  2. Parallel track detector groups components with no shared mutable state into concurrent tracks within the same wave, and Wave 0 contains only shared types/interfaces/schemas/config
  3. Dependency graph generator produces an ASCII DAG showing task dependencies with the critical path marked
  4. Sequential depth minimizer reports wall-time savings of parallel execution over fully sequential execution
  5. Risk factor analyzer identifies cache TTL exceedance, interface mismatch, and model capacity risks with mitigations
**Plans:** 2/2 plans complete
Plans:
- [ ] 283-01-PLAN.md — Wave planner core with parallel track detection and Wave 0 enforcement (TDD)
- [ ] 283-02-PLAN.md — Dependency graph generator, sequential savings calculator, risk analyzer, and barrel export (TDD)

### Phase 284: Model Assignment
**Goal**: Users receive automatic Opus/Sonnet/Haiku model assignments for every task based on cognitive complexity, with budget validation enforcing the 60/40 principle
**Depends on**: Phase 279
**Requirements**: MODL-01, MODL-02, MODL-03, MODL-04, MODL-05
**Success Criteria** (what must be TRUE):
  1. Model assigner classifies tasks into Opus (judgment/creativity), Sonnet (structural implementation), or Haiku (scaffold/boilerplate) categories based on content analysis
  2. Signal detectors match domain-specific keywords for each model tier (Opus: personality, safety warden, architectural; Sonnet: schema, pipeline, registry; Haiku: directory structure, config, stub)
  3. Budget validator flags assignments that violate the 60/40 principle (outside ~55-65% Sonnet, ~25-35% Opus, ~5-15% Haiku by token volume)
**Plans:** 2/2 plans complete
Plans:
- [ ] 284-01-PLAN.md — Model assignment classifier with weighted signal registry and confidence scoring (TDD)
- [ ] 284-02-PLAN.md — Budget validator with auto-rebalance and barrel export (TDD)

### Phase 285: Cache Optimization
**Goal**: Users get a cache optimization report identifying shared skill loads, schema reuse timing, knowledge tier sizing, TTL compliance, and total token savings
**Depends on**: Phase 283
**Requirements**: CACH-01, CACH-02, CACH-03, CACH-04, CACH-05
**Success Criteria** (what must be TRUE):
  1. Cache optimizer identifies shared skill loads that can be cached across agents within a wave
  2. Schema reuse analyzer documents producer-to-consumer timing for Wave 0 types consumed in Wave 1+
  3. TTL validator flags when Wave 0 estimated completion exceeds 5 minutes (cache TTL for Wave 1 consumers)
  4. Token savings estimator calculates and reports total tokens saved from skill load caching, schema reuse, and knowledge pre-chunking
**Plans:** 2/2 plans complete
Plans:
- [ ] 285-01-PLAN.md — Shared load detector, schema reuse analyzer, knowledge tier calculator (TDD)
- [ ] 285-02-PLAN.md — TTL validator, token savings estimator, CacheReport aggregate, and barrel export (TDD)

### Phase 286: Test Plan Generation
**Goal**: Users get a categorized test plan with verification matrix mapping every success criterion to test IDs, safety-critical classification, and density benchmarks
**Depends on**: Phase 279
**Requirements**: TPLN-01, TPLN-02, TPLN-03, TPLN-04, TPLN-05
**Success Criteria** (what must be TRUE):
  1. Test plan generator creates categorized test specs (safety-critical, core, integration, edge cases) from vision success criteria
  2. Verification matrix maps every vision success criterion to at least one test ID and flags unmapped criteria
  3. Safety-critical classifier marks tests that must block deployment as mandatory-pass
  4. Test density checker enforces 2-4 tests per criterion, with safety domains requiring at least 15% safety-critical tests
  5. Test IDs follow the categorized pattern: S-NNN (safety), C-NNN (core), I-NNN (integration), E-NNN (edge case)
**Plans:** 2 plans
Plans:
- [ ] 286-01-PLAN.md — Test plan generator, safety classifier, and categorized test ID generation (TDD)
- [ ] 286-02-PLAN.md — Verification matrix builder, test density checker (TDD)

### Phase 287: Template System
**Goal**: Users can load, render, and validate all 7 VTM templates with placeholder substitution, schema validation of output, and registry-based lookup
**Depends on**: Phase 279
**Requirements**: TMPL-01, TMPL-02, TMPL-03, TMPL-04
**Success Criteria** (what must be TRUE):
  1. Template loader reads and parses all 7 VTM templates (vision, milestone-spec, component-spec, wave-plan, test-plan, readme, research-reference)
  2. Template renderer substitutes placeholder tokens with provided values while preserving markdown structure
  3. Template validator checks rendered output against corresponding Zod schema and reports missing required sections
  4. Template registry provides lookup by name with metadata (purpose, required variables, output format)
**Plans**: TBD

### Phase 288: Pipeline Orchestrator
**Goal**: Users can run the complete vision-to-mission transformation as a single pipeline call with configurable stage skipping, typed intermediate artifacts, and structured error reporting
**Depends on**: Phase 280, Phase 281, Phase 282, Phase 283, Phase 284, Phase 285, Phase 286, Phase 287
**Requirements**: PIPE-01, PIPE-02, PIPE-03, PIPE-04, PIPE-05
**Success Criteria** (what must be TRUE):
  1. Pipeline orchestrator manages the three-stage flow (vision, research, mission) with configurable stage skipping
  2. Speed selector automatically determines pipeline speed from input assessment, with manual override capability
  3. Pipeline result includes complete file manifest, execution summary, model assignment split, and estimated execution metrics
  4. When a stage fails, error report identifies which stage failed, what was produced before failure, and whether partial output is usable
**Plans**: TBD

### Phase 289: Integration & Testing
**Goal**: The VTM module is fully integrated into the skill-creator ecosystem with barrel exports, chipset YAML, functional API pattern, eval harness, and cross-component integration tests
**Depends on**: Phase 288
**Requirements**: INTG-01, INTG-02, INTG-03, INTG-04, INTG-05
**Success Criteria** (what must be TRUE):
  1. Barrel exports from src/vtm/index.ts expose the complete public API for all VTM components
  2. Chipset YAML defines skills, agents (pipeline topology), and evaluation gates for the vtm module
  3. All functions follow the functional API primary + class wrapper pattern consistent with existing modules (MNA, logic sim, etc.)
  4. Eval harness validates the 5 evaluation scenarios (vision-from-idea, mission-from-vision, research-compilation, full-pipeline, infrastructure-vision)
  5. Integration tests validate cross-component flows: vision-to-research-to-mission, vision-to-mission (skip research), and mission-only from existing vision
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 279 -> 280 -> 281 -> 282 -> 283 -> 284 -> 285 -> 286 -> 287 -> 288 -> 289

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 279. Types & Schemas | 2/2 | Complete    | 2026-02-21 |
| 280. Vision Document Processing | 2/2 | Complete    | 2026-02-21 |
| 281. Research Reference Compilation | 2/2 | Complete    | 2026-02-21 |
| 282. Mission Package Assembly | 2/2 | Complete    | 2026-02-21 |
| 283. Wave Planning | 2/2 | Complete    | 2026-02-21 |
| 284. Model Assignment | 2/2 | Complete    | 2026-02-22 |
| 285. Cache Optimization | 2/2 | Complete    | 2026-02-22 |
| 286. Test Plan Generation | 0/2 | Planned | - |
| 287. Template System | 0/TBD | Not started | - |
| 288. Pipeline Orchestrator | 0/TBD | Not started | - |
| 289. Integration & Testing | 0/TBD | Not started | - |

---
*32 milestones shipped. 278 phases, 740 plans. Full archive: `.planning/milestones/`*
*v1.30 roadmap created: 2026-02-21*
