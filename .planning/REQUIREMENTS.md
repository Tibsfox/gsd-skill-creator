# Requirements: GSD Skill Creator — v1.30 Vision-to-Mission Pipeline

**Defined:** 2026-02-21
**Core Value:** Skills, agents, and teams must match official Claude Code patterns — and the GSD ecosystem must provide spatial, visual, and operational tools that make complex system design tangible.

## v1 Requirements

Requirements for v1.30. Each maps to roadmap phases.

### Types & Schemas (TYPE)

- [x] **TYPE-01**: Vision document structure validated by Zod schema covering all required sections (Vision, Problem Statement, Core Concept, Architecture, Chipset, Success Criteria, Through-Line)
- [x] **TYPE-02**: Research reference structure validated by Zod schema covering source sections, safety considerations, cross-references, and bibliography
- [x] **TYPE-03**: Mission package structure validated by Zod schema covering milestone spec, component specs, wave plan, test plan, and README
- [x] **TYPE-04**: Component spec structure validated by Zod schema covering objective, context, technical spec, implementation steps, test cases, and verification gate
- [x] **TYPE-05**: Wave execution plan structure validated by Zod schema covering wave summary, tasks with dependencies, cache contracts, and risk factors
- [x] **TYPE-06**: Test plan structure validated by Zod schema covering test categories, safety-critical tests, verification matrix, and coverage check
- [x] **TYPE-07**: Chipset YAML configuration validated by Zod schema covering skills, agents, topology, and evaluation gates
- [x] **TYPE-08**: Model assignment enum (Opus/Sonnet/Haiku) with token estimation types and the 60/40 principle constraint

### Vision Document Processing (VDOC)

- [x] **VDOC-01**: Parser extracts all structured sections from a vision document markdown file into a typed object
- [x] **VDOC-02**: Validator reports missing required sections, empty sections, and sections that fail quality checks
- [x] **VDOC-03**: Quality checker verifies success criteria are testable (not vague), chipset YAML is valid, dependencies are listed, and through-line references an ecosystem principle
- [x] **VDOC-04**: Archetype classifier identifies document as Educational Pack, Infrastructure Component, Organizational System, or Creative Tool based on content analysis
- [x] **VDOC-05**: Dependency extractor parses the "Depends on" header and "Relationship to Other Vision Documents" table into a dependency list

### Research Reference Compilation (RREF)

- [x] **RREF-01**: Research compiler accepts a vision document and produces a structured research reference with per-module sections
- [x] **RREF-02**: Knowledge chunker splits research content into three tiers: summary (~2K tokens), active (~10K tokens), and reference (full) with token count estimates
- [x] **RREF-03**: Source quality checker flags entertainment media sources and requires professional/organizational sources
- [x] **RREF-04**: Safety extractor identifies and collects all safety considerations into a consolidated safety section with boundary classifications
- [x] **RREF-05**: Research necessity detector determines pipeline speed (full/skip-research/mission-only) based on domain analysis of the vision document

### Mission Package Assembly (MPKG)

- [x] **MPKG-01**: Assembler produces a complete mission package (README, milestone spec, component specs, wave plan, test plan) from vision document and optional research reference
- [x] **MPKG-02**: Milestone spec generator creates the master document with architecture overview, deliverables table, component breakdown, model rationale, and cross-component interfaces
- [x] **MPKG-03**: Component spec generator creates self-contained specs that include all necessary context copied inline (not referenced from other files)
- [x] **MPKG-04**: Self-containment validator verifies each component spec contains all shared types, interface contracts, and architectural context needed for independent execution
- [x] **MPKG-05**: README generator produces the package overview with file manifest, execution summary (task/track/wave counts, model split percentages), and usage instructions
- [x] **MPKG-06**: File count scales with complexity: 4-5 files for simple features, 6-8 for medium packs, 8-12 for complex systems

### Wave Planning (WAVE)

- [x] **WAVE-01**: Wave planner decomposes mission components into waves respecting dependency ordering (foundation → parallel → integration → polish)
- [x] **WAVE-02**: Parallel track detector identifies components with no shared mutable state and groups them into concurrent tracks within the same wave
- [x] **WAVE-03**: Wave 0 contains only shared type definitions, interface contracts, schema definitions, and configuration scaffolds
- [x] **WAVE-04**: Sequential depth minimizer pushes work to parallel tracks wherever possible, reporting wall-time savings over fully sequential execution
- [x] **WAVE-05**: Dependency graph generator produces an ASCII-art directed acyclic graph showing task dependencies and marking the critical path
- [x] **WAVE-06**: Risk factor analyzer identifies cache TTL exceedance, interface mismatch, and model capacity risks with mitigations

### Model Assignment (MODL)

- [x] **MODL-01**: Model assigner classifies tasks as Opus (judgment/creativity), Sonnet (structural implementation), or Haiku (scaffold/boilerplate) based on content analysis
- [x] **MODL-02**: Opus signal detector matches keywords: personality, persona, character, safety warden, architectural decision, factory, meta, calibration, cultural sensitivity
- [x] **MODL-03**: Sonnet signal detector matches keywords: schema, type system, interface, pipeline, registry, test suite, API surface, documentation, content generation
- [x] **MODL-04**: Haiku signal detector matches keywords: directory structure, configuration file, type stub, file template, simple transformation
- [x] **MODL-05**: Budget validator enforces the 60/40 principle: ~55-65% Sonnet, ~25-35% Opus, ~5-15% Haiku by token volume, flagging violations

### Cache Optimization (CACH)

- [x] **CACH-01**: Cache optimizer identifies shared skill loads that can be cached across agents within a wave
- [x] **CACH-02**: Schema reuse analyzer documents producer→consumer timing for types/interfaces defined in Wave 0 and consumed in Wave 1+
- [x] **CACH-03**: Knowledge tier calculator computes token sizes for summary/active/reference tiers and identifies which agents load which tier
- [x] **CACH-04**: TTL validator ensures Wave 0 estimated completion time is under 5 minutes to stay within cache TTL for Wave 1 consumers
- [x] **CACH-05**: Token savings estimator calculates total tokens saved from skill load caching, schema reuse, and knowledge pre-chunking

### Test Plan Generation (TPLN)

- [x] **TPLN-01**: Test plan generator creates categorized test specifications (safety-critical, core functionality, integration, edge cases) from vision success criteria
- [x] **TPLN-02**: Verification matrix builder maps every vision document success criterion to at least one test ID, flagging unmapped criteria
- [x] **TPLN-03**: Safety-critical classifier identifies tests that must block deployment and marks them mandatory-pass
- [x] **TPLN-04**: Test density checker enforces 2-4 tests per success criterion benchmark, with safety domains having at least 15% safety-critical tests
- [x] **TPLN-05**: Test ID generator produces unique, categorized IDs: S-NNN (safety), C-NNN (core), I-NNN (integration), E-NNN (edge case)

### Template System (TMPL)

- [x] **TMPL-01**: Template loader reads and parses all 7 vision-to-mission templates (vision, milestone-spec, component-spec, wave-plan, test-plan, readme, research-reference)
- [x] **TMPL-02**: Template renderer substitutes placeholder tokens in templates with provided values, preserving markdown structure
- [x] **TMPL-03**: Template validator checks rendered output against corresponding Zod schema to ensure all required sections are present
- [x] **TMPL-04**: Template registry provides lookup by template name with metadata (purpose, required variables, output format)

### Pipeline Orchestrator (PIPE)

- [x] **PIPE-01**: Pipeline orchestrator manages the three-stage flow: vision → research → mission with configurable stage skipping
- [x] **PIPE-02**: Speed selector automatically determines pipeline speed (full/skip-research/mission-only) based on input assessment, with override capability
- [x] **PIPE-03**: Stage transition produces typed intermediate artifacts that downstream stages consume
- [x] **PIPE-04**: Pipeline result includes complete file manifest, execution summary, model assignment split, and estimated execution metrics
- [x] **PIPE-05**: Error handling reports which stage failed, what was produced before failure, and whether partial output is usable

### Integration (INTG)

- [x] **INTG-01**: Barrel exports expose complete public API from src/vtm/index.ts
- [x] **INTG-02**: Chipset YAML for the vtm module defines skills, agents (pipeline topology), and evaluation gates
- [x] **INTG-03**: All functions follow functional API primary + class wrapper pattern consistent with existing modules (MNA, logic sim, etc.)
- [ ] **INTG-04**: Eval harness validates the 5 evaluation scenarios from evals.json (vision-from-idea, mission-from-vision, research-compilation, full-pipeline, infrastructure-vision)
- [ ] **INTG-05**: Integration test suite validates cross-component flows: vision→research→mission, vision→mission (skip research), mission-only from existing vision

## Future Requirements

### Enhanced Pipeline

- **EPIP-01**: Interactive mode with AskUserQuestion integration for guided vision capture
- **EPIP-02**: Incremental refinement: modify existing mission packages without full regeneration
- **EPIP-03**: Multi-milestone planning: decompose large visions into milestone sequences

### GSD-OS Dashboard

- **DASH-01**: VTM dashboard panel showing pipeline stage progress
- **DASH-02**: Mission package browser with component spec viewer
- **DASH-03**: Wave execution visualization with dependency graph rendering

### Web Research Integration

- **WRES-01**: Automated web research for research stage using WebSearch/WebFetch
- **WRES-02**: Source credibility scoring for research reference quality

## Out of Scope

| Feature | Reason |
|---------|--------|
| Vision document authoring UI | Requires interactive UI beyond current CLI/agent scope |
| Real-time pipeline execution monitoring | Dashboard integration deferred to future milestone |
| Multi-user collaborative vision editing | Single-user CLI tool; collaboration via git |
| Natural language vision generation from voice | Requires speech-to-text integration not in current stack |
| Automated research via external APIs | Research compilation uses Claude's training knowledge; web integration deferred |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TYPE-01 | Phase 279 | Complete |
| TYPE-02 | Phase 279 | Complete |
| TYPE-03 | Phase 279 | Complete |
| TYPE-04 | Phase 279 | Complete |
| TYPE-05 | Phase 279 | Complete |
| TYPE-06 | Phase 279 | Complete |
| TYPE-07 | Phase 279 | Complete |
| TYPE-08 | Phase 279 | Complete |
| VDOC-01 | Phase 280 | Complete |
| VDOC-02 | Phase 280 | Complete |
| VDOC-03 | Phase 280 | Complete |
| VDOC-04 | Phase 280 | Complete |
| VDOC-05 | Phase 280 | Complete |
| RREF-01 | Phase 281 | Complete |
| RREF-02 | Phase 281 | Complete |
| RREF-03 | Phase 281 | Complete |
| RREF-04 | Phase 281 | Complete |
| RREF-05 | Phase 281 | Complete |
| MPKG-01 | Phase 282 | Complete |
| MPKG-02 | Phase 282 | Complete |
| MPKG-03 | Phase 282 | Complete |
| MPKG-04 | Phase 282 | Complete |
| MPKG-05 | Phase 282 | Complete |
| MPKG-06 | Phase 282 | Complete |
| WAVE-01 | Phase 283 | Complete |
| WAVE-02 | Phase 283 | Complete |
| WAVE-03 | Phase 283 | Complete |
| WAVE-04 | Phase 283 | Complete |
| WAVE-05 | Phase 283 | Complete |
| WAVE-06 | Phase 283 | Complete |
| MODL-01 | Phase 284 | Complete |
| MODL-02 | Phase 284 | Complete |
| MODL-03 | Phase 284 | Complete |
| MODL-04 | Phase 284 | Complete |
| MODL-05 | Phase 284 | Complete |
| CACH-01 | Phase 285 | Complete |
| CACH-02 | Phase 285 | Complete |
| CACH-03 | Phase 285 | Complete |
| CACH-04 | Phase 285 | Complete |
| CACH-05 | Phase 285 | Complete |
| TPLN-01 | Phase 286 | Complete |
| TPLN-02 | Phase 286 | Complete |
| TPLN-03 | Phase 286 | Complete |
| TPLN-04 | Phase 286 | Complete |
| TPLN-05 | Phase 286 | Complete |
| TMPL-01 | Phase 287 | Complete |
| TMPL-02 | Phase 287 | Complete |
| TMPL-03 | Phase 287 | Complete |
| TMPL-04 | Phase 287 | Complete |
| PIPE-01 | Phase 289 | Complete |
| PIPE-02 | Phase 289 | Complete |
| PIPE-03 | Phase 289 | Complete |
| PIPE-04 | Phase 289 | Complete |
| PIPE-05 | Phase 289 | Complete |
| INTG-01 | Phase 290 | Complete |
| INTG-02 | Phase 290 | Complete |
| INTG-03 | Phase 290 | Complete |
| INTG-04 | Phase 290 | Pending |
| INTG-05 | Phase 290 | Pending |

**Coverage:**
- v1 requirements: 58 total
- Mapped to phases: 58
- Unmapped: 0

---
*Requirements defined: 2026-02-21*
*Last updated: 2026-02-21 after roadmap creation*
