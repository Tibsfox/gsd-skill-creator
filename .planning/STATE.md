# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-19)

**Core value:** Skills, agents, and teams must match official Claude Code patterns — and the GSD ecosystem must provide spatial, visual, and operational tools that make complex system design tangible.
**Current focus:** v1.27 — GSD Foundational Knowledge Packs

## Current Position

Milestone: v1.27 — GSD Foundational Knowledge Packs
Phase: 248 of 254 (Applied Packs Batch 1)
Plan: 1 of 5 complete
Status: In progress (pack creation)
Last activity: 2026-02-20 — Completed 248-01 (CODE-101 knowledge pack)

Progress: [##############......] 65%

## Performance Metrics

| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 243 | 01 | 5min | 2 | 2 |
| 243 | 02 | 4min | 4 | 10 |
| 243 | 04 | 4min | 4 | 8 |
| 243 | 03 | 3min | 4 | 4 |
| 243 | 05 | 3min | 4 | 4 |
| 244 | 01 | 2min | 2 | 2 |
| 244 | 02 | 3min | 3 | 7 |
| 244 | 03 | 2min | 2 | 2 |
| 245 | 01 | 7min | 2 | 7 |
| 245 | 05 | 9min | 2 | 7 |
| 245 | 04 | 10min | 2 | 7 |
| 245 | 02 | 11min | 2 | 7 |
| 245 | 03 | 11min | 2 | 7 |
| 246 | 02 | 11min | 2 | 7 |
| 246 | 04 | 9min | 2 | 7 |
| 246 | 05 | 10min | 2 | 7 |
| 246 | 03 | 11min | 2 | 7 |
| 246 | 01 | 11min | 2 | 7 |
| 246 | 06 | 2min | 1 | 5 |
| 247 | 01 | 9min | 2 | 7 |
| 247 | 05 | 9min | 2 | 7 |
| 247 | 04 | 9min | 2 | 7 |
| 247 | 02 | 11min | 2 | 7 |
| 247 | 03 | 11min | 2 | 7 |
| 247 | 09 | 2min | 1 | 1 |
| 247 | 06 | 2min | 2 | 2 |
| 247 | 08 | 2min | 2 | 2 |
| 247 | 07 | 3min | 2 | 2 |
| 248 | 01 | 15min | 2 | 7 |

## Accumulated Context

### Decisions

- Used z.record(z.string(), value) pattern for Zod v4 compatibility (z.union inside z.record not supported)
- Schema-first approach: Zod schemas define shapes, types inferred via z.infer
- Discriminated union result types for all parsers (success/failure pattern)
- Heading-to-field mapping with case-insensitive matching for markdown parsers
- Kahn's algorithm (BFS) over DFS for deterministic topological sort with simpler cycle detection
- Merged dependencies + prerequisite_packs into unified deduped prerequisite set
- recommended_prior_knowledge is advisory only (non-blocking), separate from hard prerequisites
- Connection graph indexed bidirectionally (outgoing + incoming Maps) for O(1) queries
- Pack registry uses starts-with partial matching for tag search (query 'math' matches 'mathematics')
- Module loader discovers files by regex pattern matching, not hardcoded names
- Missing optional pack files produce null fields with no error (only .skillmeta required)
- Content validator uses regex pattern matching for optional file discovery (consistent with module-loader)
- Lenient markdown parsers always report valid:true; strict schema parsers can report valid:false
- Barrel exports follow established src/aminet/index.ts pattern with categorized sections
- 6 KP- agents: 1 coordinator, 3 content-generators (per tier), 2 QA (validator + reviewer)
- kp-content-authoring shared across 3 author agents; domain skills differentiate per tier
- 8.0% total token budget (20% of 40% ecosystem ceiling)
- Token budgets: 1.0% each except kp-content-authoring at 2.0% (8.0% total)
- 8 parallel instruction patterns defined in content authoring for NFR-06 token caching
- Domain skills separated by tier (core/applied/specialized) with non-overlapping file triggers
- Map-reduce topology over linear pipeline for parallel pack generation across 3 tier agents
- 4 sync points chain stages: batch-ready, generation-complete, validation-complete, review-complete
- Filesystem-based message bus with YAML format (consistent with aminet pipeline pattern)
- Per-pack retry policy (max 2) allows passing packs to proceed while failures are corrected
- 8.0% knowledge pack budget + 31.5% existing = 39.5% combined (within 40% ceiling with 0.5% headroom)
- Pack grade_levels stored as string arrays for Zod schema compatibility
- 12 activities per pack (3 per module) exceeds 8-activity minimum for better coverage
- Assessment rubric uses H2 headings: Beginning, Developing, Proficient, Advanced
- PHYS-101 uses 5 modules (not 4) to include Modern Physics & Cosmology capstone
- Phenomena-first pedagogy: experience before model before math at every level
- ENGR-101 modules YAML must be single-document (module-loader uses yaml.load not loadAll)
- Engineering activities emphasize everyday materials over specialized equipment
- SCI-101 modules YAML uses single-document format (no --- separators) for yaml.load compatibility
- 5 modules for SCI-101 including History & Nature of Science as explicit module
- TECH-101 modules YAML uses single-document format (consistent with ENGR-101 and SCI-101 pattern)
- 5 modules for TECH-101 including Technology & Society as M5
- 10 activities for TECH-101 (2 per module) matching PackActivitySchema
- 5 modules for PROB-101 including Complex & Wicked Problems as M5 capstone
- 10 activities for PROB-101 (2 per module) domain-agnostic for maximum transferability
- Assessment rubric evaluates problem-solving process, not answer correctness
- 5 modules for COMM-101: Speaking & Listening, Nonverbal, Presentation, Discussion/Debate, Cross-Context
- 10 activities for COMM-101 (2 per module) interactive and performance-based
- READ-101 as recommended prior knowledge for COMM-101; enables WRIT-101, BUS-101, LANG-101
- 5 modules for READ-101: Foundations, Vocabulary, Comprehension, Critical Reading, Reading Across Curriculum
- 10 activities for READ-101 (2 per module) spanning phonics through primary source analysis
- Reading Across the Curriculum as dedicated M5 module for discipline-specific reading strategies
- 5 modules for CRIT-101: Claims & Evidence, Arguments & Logical Reasoning, Fallacies & Biases, Applied Critical Thinking, Metacognition & Intellectual Humility
- 10 activities for CRIT-101 (2 per module) emphasizing discussion, debate, and analytical exercises
- CRIT-101 modules YAML uses single-document format (consistent with SCI-101, ENGR-101, TECH-101)
- 5 modules for CHEM-101: Matter & Properties, Atoms & Periodic Table, Bonds & Molecular Structure, Chemical Reactions & Energy, Applied Chemistry
- 10 activities for CHEM-101 (2 per module) emphasizing kitchen chemistry and household materials
- CHEM-101 lists MATH-101 and SCI-101 as recommended prior knowledge; enables ENVR-101, NUTR-101, NATURE-101
- Kitchen-chemistry-first pedagogy: tangible experience before symbols and formulas
- YAML date fields must be quoted strings in .skillmeta files to prevent js-yaml Date object coercion
- 5 modules for HIST-101: Sources & Evidence, Causation & Consequence, Continuity & Change, Perspectives & Empathy, Historical Argumentation
- 10 activities for HIST-101 (2 per module) emphasizing inquiry, evidence analysis, and perspective-taking
- READ-101 as recommended prior knowledge for HIST-101; enables PHILO-101, GEO-101
- 5 modules for STAT-101: Accounting Principles, Financial Statements, Probability, Statistical Analysis, Personal Finance
- 10 activities for STAT-101 (2 per module) progressing from concrete (coin flips, classroom stores) to analytical
- MATH-101 as recommended prior knowledge for STAT-101; enables DATA-101, ECON-101
- Dual-strand assessment for STAT-101: accounting/financial reasoning and statistical/probabilistic thinking
- 5 modules for BUS-101: Economic Organization, Business Structures, Finance, Contracts/Legal, Ethics/Governance
- 10 activities for BUS-101 (2 per module) scaling from trading games to mock trials and stakeholder maps
- MATH-101 and COMM-101 as recommended prior knowledge for BUS-101; enables ECON-101
- Integrated business and law curriculum rather than separate tracks
- Assessment evaluates reasoning and judgment, not business terminology memorization
- 5 modules for GEO-101: Earth Systems, Human Geography, Maps/GIS, Astronomy, Climate/Weather
- 10 activities for GEO-101 (2 per module) mixing outdoor observation, physical models, and spatial analysis
- Spatial thinking as primary pedagogy for GEO-101 over place-name memorization
- Astronomy integrated as GEO-101 Module 4 for cosmic context rather than separate pack
- SCI-101 and MATH-101 as recommended prior knowledge for GEO-101; enables ENVR-101, ASTRO-101, NATURE-101
- 5 modules for MFAB-101: Properties & Testing, Materials Families, Fabrication, DFM, Sustainability
- 10 activities for MFAB-101 (2 per module) emphasizing hands-on testing with everyday materials
- Sustainability as core module (M5) in MFAB-101, not optional -- lifecycle thinking woven throughout
- SCI-101 and ENGR-101 as recommended prior knowledge for MFAB-101; enables TRADE-101
- [Phase 247]: Quoted all grade_levels values (not just numeric) for consistency with GEO-101 exemplar
- [Phase 248-01]: CODE-101 uses 5 modules (M1-M5) to include "Computing & Society" as capstone covering ethics, AI, security, and digital citizenship
- [Phase 248-01]: CODE-101 classification: applied_practical (skill-focused, not core_academic)
- [Phase 248-01]: 16 activities (vs 10-12 minimum) for richer coverage; mixed pedagogies (unplugged, visual, text-based, discussion)

### Key Context

- 30 milestones shipped (v1.0-v1.26 + v1.8.1 patch), 242 phases, 679 plans, ~302k LOC
- 10,032 tests passing, TypeScript clean
- Delivery package at /tmp/v128-extract/gsd-foundational-knowledge-packs/ contains complete architecture
- 3 complete exemplary packs: MATH-101 (full), CODE-101 (full, Phase 248-01), design patterns established
- 32 remaining stub packs with README + .skillmeta
- Pack structure: vision.md, modules.yaml, activities.json, assessment.md, resources.md, .skillmeta
- 3 tiers: Core Academic (15), Applied & Practical (10), Specialized & Deepening (10)
- Phases 245-251 (7 pack content phases) are parallelizable after 243+244 complete
- Phase 252 (metadata/validation) gates on all pack content being done
- Phases 253-254 (dashboard, skill-creator) gate on runtime + metadata

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-02-20
Stopped at: Completed 247-08-PLAN.md (BUS-101 gap closure)
Resume file: None

## Next Up

Phase 247 gap closure plans in progress. Continue with remaining gap closure plan (07) or advance to Phase 248.
