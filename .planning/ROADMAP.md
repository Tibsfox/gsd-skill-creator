# Roadmap: GSD Skill Creator

## Milestones

- 🚧 **v1.27 — GSD Foundational Knowledge Packs** - Phases 243-254 (in progress)

## Phases

- [x] **Phase 243: Pack Runtime Infrastructure** - Zod schemas, parsers, registry, loaders, dependency resolver, and barrel exports for the knowledge pack module (completed 2026-02-20)
- [x] **Phase 244: Chipset & Agent Definitions** - Chipset YAML, SKILL.md files, pipeline team, agent prefix convention, and map-reduce coordination pattern (completed 2026-02-20)
- [x] **Phase 245: Core Academic Packs Batch 1** - MATH-101 (import/adapt), SCI-101, TECH-101, ENGR-101, PHYS-101 full suites (completed 2026-02-20)
- [x] **Phase 246: Core Academic Packs Batch 2** - CHEM-101, READ-101, CRIT-101, PROB-101, COMM-101 full suites (completed 2026-02-20)
- [ ] **Phase 247: Core Academic Packs Batch 3** - HIST-101, GEO-101, MFAB-101, BUS-101, STAT-101 full suites
- [ ] **Phase 248: Applied Packs Batch 1** - CODE-101 (import/adapt), DATA-101, LANG-101, PSYCH-101, ENVR-101 full suites
- [ ] **Phase 249: Applied Packs Batch 2** - NUTR-101, ECON-101, WRIT-101, LOG-101, DIGLIT-101 full suites
- [ ] **Phase 250: Specialized Packs Batch 1** - PHILO-101, THEO-101, PE-101, NATURE-101, DOMESTIC-101 full suites
- [ ] **Phase 251: Specialized Packs Batch 2** - ART-101, MUSIC-101, TRADE-101, ASTRO-101, LEARN-101 full suites
- [ ] **Phase 252: Pack Metadata & Validation** - Cross-pack dependency graph, standards alignment, translation stubs, accessibility, content validation, master INDEX generation
- [ ] **Phase 253: GSD-OS Dashboard** - Knowledge pack browser panel, search, detail view, skill tree, activity suggestions, progress tracking
- [ ] **Phase 254: skill-creator Integration** - Observation hooks, pattern detection, activity scaffolding, approach promotion, EventEnvelope events, pathway adaptation

## Phase Details

### Phase 243: Pack Runtime Infrastructure
**Goal**: Users can programmatically load, validate, query, and navigate knowledge packs through a complete TypeScript API
**Depends on**: Nothing (first phase)
**Requirements**: RUNTIME-01, RUNTIME-02, RUNTIME-03, RUNTIME-04, RUNTIME-05, RUNTIME-06, RUNTIME-07, RUNTIME-08, RUNTIME-09, RUNTIME-10, RUNTIME-11, RUNTIME-12, RUNTIME-13, RUNTIME-14, NFR-01, NFR-02
**Success Criteria** (what must be TRUE):
  1. Importing from `src/knowledge` gives access to all pack types, registry, loaders, and resolvers
  2. A .skillmeta YAML file can be parsed and validated with clear error messages on schema violations
  3. The pack registry can register packs, look them up by ID, filter by category/tier, and search by tags
  4. Loading a pack directory reads all 5 content files (vision, modules, activities, assessment, resources) into typed objects
  5. The dependency resolver computes prerequisite chains and rejects circular dependencies with a clear error
**Plans**: 5 plans (243-01 through 243-05), 3 waves
  - Wave 1: 243-01 (Zod schemas + types)
  - Wave 2: 243-02 (parsers), 243-03 (registry + loader), 243-04 (resolvers + validators) [parallel]
  - Wave 3: 243-05 (content validator + barrel exports)

### Phase 244: Chipset & Agent Definitions
**Goal**: The GSD agent infrastructure for knowledge pack operations is fully defined and ready for pack content generation
**Depends on**: Phase 243
**Requirements**: CHIP-01, CHIP-02, CHIP-03, CHIP-04, CHIP-05, NFR-05, NFR-06
**Success Criteria** (what must be TRUE):
  1. Chipset YAML at infra/packs/knowledge/ defines KP- prefixed agents, skills, teams, and token budget within 40% ceiling
  2. SKILL.md files exist at infra/skills/ for each knowledge pack agent following established format
  3. Pipeline team YAML defines the pack content delivery and validation workflow
  4. Map-reduce coordination pattern enables parallel pack generation with merge validation
**Plans**: 3 plans (244-01 through 244-03), 2 waves
  - Wave 1: 244-01 (Chipset YAML + agent inventory), 244-02 (SKILL.md files) [parallel]
  - Wave 2: 244-03 (Pipeline team YAML + trigger matrix) [depends on 244-01, 244-02]

### Phase 245: Core Academic Packs Batch 1
**Goal**: The first 5 core academic packs are complete with full educational content suites ready for learner consumption
**Depends on**: Phase 243, Phase 244
**Requirements**: PACK-01, PACK-02, PACK-03, PACK-04, PACK-05
**Success Criteria** (what must be TRUE):
  1. MATH-101 pack contains adapted vision doc from delivered content plus new activities JSON, assessment framework, and curated resources
  2. SCI-101, TECH-101, ENGR-101, and PHYS-101 each contain vision doc (~40 pages), modules YAML, activities JSON, assessment, resources, and updated .skillmeta
  3. All 5 packs pass the runtime content validator with zero schema errors
  4. Each pack's .skillmeta declares correct dependencies, learning outcomes, grade levels, and learning pathways
**Plans**: 5 plans (245-01 through 245-05), 1 wave
Plans:
- [x] 245-01-PLAN.md — MATH-101 import/adapt from delivery + create activities, assessment, resources
- [x] 245-02-PLAN.md — SCI-101 full suite from scratch (Science Method & Nature)
- [x] 245-03-PLAN.md — TECH-101 full suite from scratch (Technology & Tools)
- [x] 245-04-PLAN.md — ENGR-101 full suite from scratch (Engineering & Design)
- [x] 245-05-PLAN.md — PHYS-101 full suite from scratch (Physics)

### Phase 246: Core Academic Packs Batch 2
**Goal**: The next 5 core academic packs deliver complete humanities and reasoning content suites
**Depends on**: Phase 243, Phase 244
**Requirements**: PACK-06, PACK-07, PACK-08, PACK-09, PACK-10
**Success Criteria** (what must be TRUE):
  1. CHEM-101, READ-101, CRIT-101, PROB-101, and COMM-101 each contain vision doc, modules YAML, activities JSON, assessment, resources, and .skillmeta
  2. All 5 packs pass the runtime content validator with zero schema errors
  3. Cross-pack references (e.g., CRIT-101 linking to PROB-101) are valid IDs that resolve in the registry
  4. Activities span multiple learning pathways (Maker, Academic, Curiosity, Social, Parent-Guided) per pack
**Plans**: TBD

### Phase 247: Core Academic Packs Batch 3
**Goal**: The final 5 core academic packs complete the entire Core Academic tier
**Depends on**: Phase 243, Phase 244
**Requirements**: PACK-11, PACK-12, PACK-13, PACK-14, PACK-15
**Success Criteria** (what must be TRUE):
  1. HIST-101, GEO-101, MFAB-101, BUS-101, and STAT-101 each contain vision doc, modules YAML, activities JSON, assessment, resources, and .skillmeta
  2. All 5 packs pass the runtime content validator with zero schema errors
  3. All 15 Core Academic packs are registered in the pack registry and queryable by tier
  4. Grade levels span PreK through College+ appropriately per subject
**Plans**: 5 plans (247-01 through 247-05), 1 wave
Plans:
- [ ] 247-01-PLAN.md — HIST-101 full suite from scratch (History & Civilization)
- [ ] 247-02-PLAN.md — GEO-101 full suite from scratch (Geography & Space Science)
- [ ] 247-03-PLAN.md — MFAB-101 full suite from scratch (Materials & Manufacturing)
- [ ] 247-04-PLAN.md — BUS-101 full suite from scratch (Business & Law)
- [ ] 247-05-PLAN.md — STAT-101 full suite from scratch (Accounting & Statistics)

### Phase 248: Applied Packs Batch 1
**Goal**: The first 5 applied packs deliver practical skills content including the adapted CODE-101 exemplar
**Depends on**: Phase 243, Phase 244
**Requirements**: PACK-16, PACK-17, PACK-18, PACK-19, PACK-20
**Success Criteria** (what must be TRUE):
  1. CODE-101 pack contains adapted vision doc from delivered content plus new modules YAML, activities JSON, assessment, and resources
  2. DATA-101, LANG-101, PSYCH-101, and ENVR-101 each contain vision doc, modules YAML, activities JSON, assessment, resources, and .skillmeta
  3. All 5 packs pass the runtime content validator with zero schema errors
  4. Prerequisites referencing Core Academic packs resolve correctly in the dependency graph
**Plans**: 5 plans (248-01 through 248-05), 1 wave
Plans:
- [ ] 248-01-PLAN.md — CODE-101 import/adapt vision from delivery + create modules, activities, assessment, resources
- [ ] 248-02-PLAN.md — DATA-101 full suite from scratch (Data Science & Analysis)
- [ ] 248-03-PLAN.md — LANG-101 full suite from scratch (World Languages)
- [ ] 248-04-PLAN.md — PSYCH-101 full suite from scratch (Psychology & Human Development)
- [ ] 248-05-PLAN.md — ENVR-101 full suite from scratch (Environmental Science & Sustainability)

### Phase 249: Applied Packs Batch 2
**Goal**: The remaining 5 applied packs complete the entire Applied & Practical tier
**Depends on**: Phase 243, Phase 244
**Requirements**: PACK-21, PACK-22, PACK-23, PACK-24, PACK-25
**Success Criteria** (what must be TRUE):
  1. NUTR-101, ECON-101, WRIT-101, LOG-101, and DIGLIT-101 each contain vision doc, modules YAML, activities JSON, assessment, resources, and .skillmeta
  2. All 5 packs pass the runtime content validator with zero schema errors
  3. All 10 Applied & Practical packs are registered in the pack registry and queryable by tier
  4. Learning pathway diversity covers all 5 pathways across the batch
**Plans**: 5 plans (249-01 through 249-05), 1 wave
Plans:
- [ ] 249-01-PLAN.md — NUTR-101 full suite from scratch (Nutrition & Health Sciences)
- [ ] 249-02-PLAN.md — ECON-101 full suite from scratch (Economics & Personal Finance)
- [ ] 249-03-PLAN.md — WRIT-101 full suite from scratch (Literature & Creative Writing)
- [ ] 249-04-PLAN.md — LOG-101 full suite from scratch (Logic & Formal Systems)
- [ ] 249-05-PLAN.md — DIGLIT-101 full suite from scratch (Digital Literacy & Information Science)

### Phase 250: Specialized Packs Batch 1
**Goal**: The first 5 specialized packs deliver deepening content for philosophy, theology, physical education, nature, and domestic skills
**Depends on**: Phase 243, Phase 244
**Requirements**: PACK-26, PACK-27, PACK-28, PACK-29, PACK-30
**Success Criteria** (what must be TRUE):
  1. PHILO-101, THEO-101, PE-101, NATURE-101, and DOMESTIC-101 each contain vision doc, modules YAML, activities JSON, assessment, resources, and .skillmeta
  2. All 5 packs pass the runtime content validator with zero schema errors
  3. Specialized packs correctly reference their prerequisite Core and Applied packs
  4. Assessment frameworks use age-independent, level-aware rubrics appropriate to each domain
**Plans**: 5 plans (250-01 through 250-05), 1 wave
Plans:
- [ ] 250-01-PLAN.md — PHILO-101 full suite from scratch (Philosophy)
- [ ] 250-02-PLAN.md — THEO-101 full suite from scratch (Theology & Religion Studies)
- [ ] 250-03-PLAN.md — PE-101 full suite from scratch (Physical Education & Movement)
- [ ] 250-04-PLAN.md — NATURE-101 full suite from scratch (Nature Studies & Naturalism)
- [ ] 250-05-PLAN.md — DOMESTIC-101 full suite from scratch (Home Economics & Life Skills)

### Phase 251: Specialized Packs Batch 2
**Goal**: The final 5 specialized packs complete all 35 packs in the knowledge system
**Depends on**: Phase 243, Phase 244
**Requirements**: PACK-31, PACK-32, PACK-33, PACK-34, PACK-35
**Success Criteria** (what must be TRUE):
  1. ART-101, MUSIC-101, TRADE-101, ASTRO-101, and LEARN-101 each contain vision doc, modules YAML, activities JSON, assessment, resources, and .skillmeta
  2. All 5 packs pass the runtime content validator with zero schema errors
  3. All 35 packs across all 3 tiers are registered, loaded, and queryable in the pack registry
  4. LEARN-101 (Learning to Learn) serves as the meta-pack with cross-references to study strategies applicable to all other packs
**Plans**: 5 plans (251-01 through 251-05), 1 wave
Plans:
- [ ] 251-01-PLAN.md — ART-101 full suite from scratch (Visual Arts)
- [ ] 251-02-PLAN.md — MUSIC-101 full suite from scratch (Music & Sound)
- [ ] 251-03-PLAN.md — TRADE-101 full suite from scratch (Trades & Applied Skills)
- [ ] 251-04-PLAN.md — ASTRO-101 full suite from scratch (Astronomy & Cosmology)
- [ ] 251-05-PLAN.md — LEARN-101 full suite from scratch (Learning to Learn -- meta-pack)

### Phase 252: Pack Metadata & Validation
**Goal**: The complete 35-pack system has cross-pack dependency graphs, standards alignment, accessibility metadata, and automated quality validation
**Depends on**: Phases 245-251 (all pack content complete)
**Requirements**: META-01, META-02, META-03, META-04, META-05, META-06, NFR-03, NFR-04
**Success Criteria** (what must be TRUE):
  1. Cross-pack dependency graph exists as machine-readable YAML and renders as a Mermaid diagram showing all 35 packs and their prerequisite relationships
  2. Standards alignment metadata (Common Core, NCTM, NGSS where applicable) is present in .skillmeta for relevant packs
  3. All 35 .skillmeta files include translation framework stubs and accessibility metadata fields
  4. Content quality validation test suite runs 35+ test cases confirming every pack follows PACK-TEMPLATE.md structure
  5. Master INDEX.md and ALL-PACKS-OVERVIEW.md are generated from live pack metadata with accurate counts and descriptions
**Plans**: TBD

### Phase 253: GSD-OS Dashboard
**Goal**: Users can browse, search, and explore knowledge packs through a visual panel in the GSD-OS desktop application
**Depends on**: Phase 243 (runtime API), Phase 252 (metadata complete)
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06, DASH-07, DASH-08
**Success Criteria** (what must be TRUE):
  1. A "knowledge" WindowType opens a pack browser panel showing all 35 packs grouped by tier with category filtering
  2. Search finds packs by name, description, and tags with relevance-ranked results
  3. Clicking a pack opens a detail view showing vision summary, module list, prerequisites, and grade levels
  4. Skill tree visualization renders pack progression paths showing prerequisite chains as a navigable graph
  5. Progress tracking display shows per-pack completion state for the current learner
**Plans**: TBD

### Phase 254: skill-creator Integration
**Goal**: The knowledge pack system feeds learner interaction data into skill-creator for pattern detection, activity generation, and pathway adaptation
**Depends on**: Phase 243 (runtime API), Phase 253 (dashboard for interaction surface)
**Requirements**: SC-01, SC-02, SC-03, SC-04, SC-05, SC-06
**Success Criteria** (what must be TRUE):
  1. Learner interactions (activity completion, assessment results, time spent) emit observation hooks consumed by skill-creator
  2. Pattern detection identifies successful learning approaches across packs and surfaces them as pending skill suggestions
  3. Activity scaffolding generates new activities from observed success patterns and inserts them into pack activity chains
  4. Pack interaction events are emitted as AMIGA EventEnvelope messages for ecosystem consumption
**Plans**: TBD

## Progress

**Execution Order:**
Phases 243-244 sequential (infrastructure first). Phases 245-251 parallelizable in batches. Phase 252 after all packs. Phases 253-254 after metadata.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 243. Pack Runtime Infrastructure | 5/5 | Complete    | 2026-02-20 |
| 244. Chipset & Agent Definitions | 3/3 | Complete    | 2026-02-20 |
| 245. Core Academic Packs Batch 1 | 5/5 | Complete   | 2026-02-20 |
| 246. Core Academic Packs Batch 2 | 5/5 | Complete   | 2026-02-20 |
| 247. Core Academic Packs Batch 3 | 0/5 | Planned | - |
| 248. Applied Packs Batch 1 | 0/5 | Planned | - |
| 249. Applied Packs Batch 2 | 0/5 | Planned | - |
| 250. Specialized Packs Batch 1 | 0/5 | Planned | - |
| 251. Specialized Packs Batch 2 | 0/5 | Planned | - |
| 252. Pack Metadata & Validation | 0/TBD | Not started | - |
| 253. GSD-OS Dashboard | 0/TBD | Not started | - |
| 254. skill-creator Integration | 0/TBD | Not started | - |
