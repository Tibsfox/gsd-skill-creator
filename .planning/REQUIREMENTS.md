# Requirements: GSD Skill Creator

**Defined:** 2026-02-19
**Core Value:** Skills, agents, and teams must match official Claude Code patterns — and the GSD ecosystem must provide spatial, visual, and operational tools that make complex system design tangible.

## v1 Requirements

Requirements for v1.27 — GSD Foundational Knowledge Packs. Each maps to roadmap phases.

### Pack Runtime Infrastructure

- [x] **RUNTIME-01**: Zod schemas for KnowledgePack, PackModule, PackActivity, Assessment, LearningOutcome, GradeLevel, LearningPathway, and PackDependency types
- [x] **RUNTIME-02**: .skillmeta YAML parser with Zod validation producing typed KnowledgePack records
- [x] **RUNTIME-03**: Pack registry supporting register, lookup by ID, list all, list by category, list by tier, and search by tags
- [x] **RUNTIME-04**: Module loader reading vision.md, modules.yaml, activities.json, assessment.md, and resources.md from pack directories
- [x] **RUNTIME-05**: Pack dependency resolver computing prerequisite chains via topological sort with cycle detection
- [x] **RUNTIME-06**: Prerequisite validator checking if learner meets entry requirements for a given pack or module
- [x] **RUNTIME-07**: Grade-level router suggesting appropriate entry point based on learner level and prior knowledge
- [x] **RUNTIME-08**: Cross-pack connection mapper building relationship graph from enables/related_packs metadata
- [x] **RUNTIME-09**: Vision document parser extracting structured sections (core concepts, modules, assessment, parent guidance) from markdown
- [x] **RUNTIME-10**: Activity loader parsing activities JSON into typed ActivityDefinition records with validation
- [x] **RUNTIME-11**: Assessment framework loader parsing assessment markdown into rubric structures per level
- [x] **RUNTIME-12**: Resource catalog loader parsing resources markdown into categorized, grade-level-aware link collections
- [x] **RUNTIME-13**: Pack content validator ensuring all required files exist and pass schema validation for a given pack
- [x] **RUNTIME-14**: Barrel exports for complete knowledge pack public API (src/knowledge/index.ts)

### Core Academic Foundation Packs

- [ ] **PACK-01**: MATH-101 (Mathematics) — import and adapt delivered vision doc, modules YAML; create activities JSON, assessment, resources
- [ ] **PACK-02**: SCI-101 (Science Method & Nature) — full suite: vision doc (~40 pages), modules YAML, activities JSON, assessment, resources, .skillmeta
- [ ] **PACK-03**: TECH-101 (Technology & Tools) — full suite: vision doc, modules YAML, activities JSON, assessment, resources, .skillmeta
- [ ] **PACK-04**: ENGR-101 (Engineering & Design) — full suite: vision doc, modules YAML, activities JSON, assessment, resources, .skillmeta
- [ ] **PACK-05**: PHYS-101 (Physics) — full suite: vision doc, modules YAML, activities JSON, assessment, resources, .skillmeta
- [ ] **PACK-06**: CHEM-101 (Chemistry) — full suite: vision doc, modules YAML, activities JSON, assessment, resources, .skillmeta
- [ ] **PACK-07**: READ-101 (Reading & Literacy) — full suite: vision doc, modules YAML, activities JSON, assessment, resources, .skillmeta
- [ ] **PACK-08**: CRIT-101 (Critical Thinking) — full suite: vision doc, modules YAML, activities JSON, assessment, resources, .skillmeta
- [ ] **PACK-09**: PROB-101 (Problem Solving) — full suite: vision doc, modules YAML, activities JSON, assessment, resources, .skillmeta
- [ ] **PACK-10**: COMM-101 (Communication & Speech) — full suite: vision doc, modules YAML, activities JSON, assessment, resources, .skillmeta
- [ ] **PACK-11**: HIST-101 (History & Civilization) — full suite: vision doc, modules YAML, activities JSON, assessment, resources, .skillmeta
- [ ] **PACK-12**: GEO-101 (Geography & Space Science) — full suite: vision doc, modules YAML, activities JSON, assessment, resources, .skillmeta
- [ ] **PACK-13**: MFAB-101 (Materials & Manufacturing) — full suite: vision doc, modules YAML, activities JSON, assessment, resources, .skillmeta
- [ ] **PACK-14**: BUS-101 (Business & Law) — full suite: vision doc, modules YAML, activities JSON, assessment, resources, .skillmeta
- [ ] **PACK-15**: STAT-101 (Accounting & Statistics) — full suite: vision doc, modules YAML, activities JSON, assessment, resources, .skillmeta

### Applied & Practical Packs

- [ ] **PACK-16**: CODE-101 (Computer Science & Coding) — import and adapt delivered vision doc; create modules YAML, activities JSON, assessment, resources
- [ ] **PACK-17**: DATA-101 (Data Science & Analysis) — full suite: vision doc, modules YAML, activities JSON, assessment, resources, .skillmeta
- [ ] **PACK-18**: LANG-101 (World Languages) — full suite: vision doc, modules YAML, activities JSON, assessment, resources, .skillmeta
- [ ] **PACK-19**: PSYCH-101 (Psychology & Human Development) — full suite: vision doc, modules YAML, activities JSON, assessment, resources, .skillmeta
- [ ] **PACK-20**: ENVR-101 (Environmental Science & Sustainability) — full suite: vision doc, modules YAML, activities JSON, assessment, resources, .skillmeta
- [ ] **PACK-21**: NUTR-101 (Nutrition & Health Sciences) — full suite: vision doc, modules YAML, activities JSON, assessment, resources, .skillmeta
- [ ] **PACK-22**: ECON-101 (Economics & Personal Finance) — full suite: vision doc, modules YAML, activities JSON, assessment, resources, .skillmeta
- [ ] **PACK-23**: WRIT-101 (Literature & Creative Writing) — full suite: vision doc, modules YAML, activities JSON, assessment, resources, .skillmeta
- [ ] **PACK-24**: LOG-101 (Logic & Formal Systems) — full suite: vision doc, modules YAML, activities JSON, assessment, resources, .skillmeta
- [ ] **PACK-25**: DIGLIT-101 (Digital Literacy & Information Science) — full suite: vision doc, modules YAML, activities JSON, assessment, resources, .skillmeta

### Specialized & Deepening Packs

- [ ] **PACK-26**: PHILO-101 (Philosophy) — full suite: vision doc, modules YAML, activities JSON, assessment, resources, .skillmeta
- [ ] **PACK-27**: THEO-101 (Theology & Religion Studies) — full suite: vision doc, modules YAML, activities JSON, assessment, resources, .skillmeta
- [ ] **PACK-28**: PE-101 (Physical Education & Movement) — full suite: vision doc, modules YAML, activities JSON, assessment, resources, .skillmeta
- [ ] **PACK-29**: NATURE-101 (Nature Studies & Naturalism) — full suite: vision doc, modules YAML, activities JSON, assessment, resources, .skillmeta
- [ ] **PACK-30**: DOMESTIC-101 (Home Economics & Life Skills) — full suite: vision doc, modules YAML, activities JSON, assessment, resources, .skillmeta
- [ ] **PACK-31**: ART-101 (Visual Arts) — full suite: vision doc, modules YAML, activities JSON, assessment, resources, .skillmeta
- [ ] **PACK-32**: MUSIC-101 (Music & Sound) — full suite: vision doc, modules YAML, activities JSON, assessment, resources, .skillmeta
- [ ] **PACK-33**: TRADE-101 (Trades & Applied Skills) — full suite: vision doc, modules YAML, activities JSON, assessment, resources, .skillmeta
- [ ] **PACK-34**: ASTRO-101 (Astronomy & Cosmology) — full suite: vision doc, modules YAML, activities JSON, assessment, resources, .skillmeta
- [ ] **PACK-35**: LEARN-101 (Learning to Learn) — full suite: vision doc, modules YAML, activities JSON, assessment, resources, .skillmeta

### GSD-OS Dashboard Integration

- [ ] **DASH-01**: Knowledge pack browser panel in desktop/src/knowledge/ with pack listing, category filtering, and tier grouping
- [ ] **DASH-02**: Pack search with relevance-ranked results across pack names, descriptions, and tags
- [ ] **DASH-03**: Pack detail view displaying vision summary, module list, prerequisites, and grade levels
- [ ] **DASH-04**: Skill tree visualization showing pack progression paths and prerequisite chains
- [ ] **DASH-05**: Activity chain suggestions based on learner level and current pack position
- [ ] **DASH-06**: Progress tracking display showing pack completion state per learner
- [ ] **DASH-07**: WindowType extended with "knowledge" type for pack browser panel
- [ ] **DASH-08**: Dashboard barrel updated with knowledge panel exports

### skill-creator Integration

- [ ] **SC-01**: Observation hooks for learner interactions with pack content (activity completion, assessment results, time spent)
- [ ] **SC-02**: Pattern detection points identifying successful learning approaches across packs
- [ ] **SC-03**: Activity scaffolding from skill-creator generating new activities based on observed success patterns
- [ ] **SC-04**: Successful approach promotion to skill library for reuse across learners
- [ ] **SC-05**: Pack interaction events emitted as AMIGA EventEnvelope messages for ecosystem consumption
- [ ] **SC-06**: Learning pathway adaptation based on skill-creator observation data

### Pack Metadata & Standards

- [ ] **META-01**: Cross-pack dependency graph as machine-readable YAML with Mermaid diagram output
- [ ] **META-02**: Standards alignment metadata (Common Core, NCTM, NGSS) in .skillmeta for applicable packs
- [ ] **META-03**: Translation framework stubs with language code placeholders in all 35 .skillmeta files
- [ ] **META-04**: Accessibility metadata (screen reader, large text, high contrast, keyboard navigable) in all 35 .skillmeta files
- [ ] **META-05**: Content quality validation ensuring all vision docs follow PACK-TEMPLATE.md structure
- [ ] **META-06**: Master INDEX.md and ALL-PACKS-OVERVIEW.md generated from pack metadata

### Chipset & Agent Definitions

- [x] **CHIP-01**: Chipset YAML defining knowledge pack agents, skills, teams, and token budget allocation
- [x] **CHIP-02**: SKILL.md files for each knowledge pack agent following infra/skills/ format
- [x] **CHIP-03**: Pipeline team YAML for pack content delivery and validation workflow
- [x] **CHIP-04**: Agent prefix KP- (Knowledge Pack) for knowledge domain agents following highway numbering convention
- [x] **CHIP-05**: Team coordination pattern (map-reduce) for parallel pack content generation

### Non-Functional Requirements

- [x] **NFR-01**: All 35 packs self-contained in src/knowledge/packs/ with no cross-pack file imports
- [x] **NFR-02**: Pack runtime has zero external npm dependencies (YAML parsing via existing project deps)
- [ ] **NFR-03**: All pack content CC-BY-SA-4.0 licensed with attribution in each pack directory
- [ ] **NFR-04**: Pack content validator runs as test suite with per-pack validation (35 test cases minimum)
- [x] **NFR-05**: Token budget for knowledge pack skills within 40% ecosystem ceiling
- [x] **NFR-06**: Parallel instruction patterns across packs for token caching optimization

## v2 Requirements

### Pack Expansion
- **EXP-01**: Community contribution workflow with PR templates and review process
- **EXP-02**: Pack localization/translation framework with multi-language support
- **EXP-03**: Advanced assessment analytics with learning outcome tracking over time
- **EXP-04**: Adaptive pacing engine adjusting content delivery to learner speed

### Content Deepening
- **DEEP-01**: Video/multimedia content integration with captions
- **DEEP-02**: Interactive code execution environments for CODE-101 activities
- **DEEP-03**: Collaborative learning features (peer teaching, group activities)
- **DEEP-04**: Print/PDF export for offline lesson guides

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time multiplayer learning | Requires server infrastructure beyond local-first design |
| LMS (Learning Management System) integration | External API complexity, defer to ecosystem spec |
| Automated grading/scoring | Requires ML pipeline not yet in ecosystem |
| Mobile app for pack consumption | GSD-OS is desktop-first via Tauri |
| Paid content or premium packs | All content CC-BY-SA-4.0, no paywalls |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| RUNTIME-01 | Phase 243 | Complete |
| RUNTIME-02 | Phase 243 | Complete |
| RUNTIME-03 | Phase 243 | Complete |
| RUNTIME-04 | Phase 243 | Complete |
| RUNTIME-05 | Phase 243 | Complete |
| RUNTIME-06 | Phase 243 | Complete |
| RUNTIME-07 | Phase 243 | Complete |
| RUNTIME-08 | Phase 243 | Complete |
| RUNTIME-09 | Phase 243 | Complete |
| RUNTIME-10 | Phase 243 | Complete |
| RUNTIME-11 | Phase 243 | Complete |
| RUNTIME-12 | Phase 243 | Complete |
| RUNTIME-13 | Phase 243 | Complete |
| RUNTIME-14 | Phase 243 | Complete |
| PACK-01 | Phase 245 | Pending |
| PACK-02 | Phase 245 | Pending |
| PACK-03 | Phase 245 | Pending |
| PACK-04 | Phase 245 | Pending |
| PACK-05 | Phase 245 | Pending |
| PACK-06 | Phase 246 | Pending |
| PACK-07 | Phase 246 | Pending |
| PACK-08 | Phase 246 | Pending |
| PACK-09 | Phase 246 | Pending |
| PACK-10 | Phase 246 | Pending |
| PACK-11 | Phase 247 | Pending |
| PACK-12 | Phase 247 | Pending |
| PACK-13 | Phase 247 | Pending |
| PACK-14 | Phase 247 | Pending |
| PACK-15 | Phase 247 | Pending |
| PACK-16 | Phase 248 | Pending |
| PACK-17 | Phase 248 | Pending |
| PACK-18 | Phase 248 | Pending |
| PACK-19 | Phase 248 | Pending |
| PACK-20 | Phase 248 | Pending |
| PACK-21 | Phase 249 | Pending |
| PACK-22 | Phase 249 | Pending |
| PACK-23 | Phase 249 | Pending |
| PACK-24 | Phase 249 | Pending |
| PACK-25 | Phase 249 | Pending |
| PACK-26 | Phase 250 | Pending |
| PACK-27 | Phase 250 | Pending |
| PACK-28 | Phase 250 | Pending |
| PACK-29 | Phase 250 | Pending |
| PACK-30 | Phase 250 | Pending |
| PACK-31 | Phase 251 | Pending |
| PACK-32 | Phase 251 | Pending |
| PACK-33 | Phase 251 | Pending |
| PACK-34 | Phase 251 | Pending |
| PACK-35 | Phase 251 | Pending |
| DASH-01 | Phase 253 | Pending |
| DASH-02 | Phase 253 | Pending |
| DASH-03 | Phase 253 | Pending |
| DASH-04 | Phase 253 | Pending |
| DASH-05 | Phase 253 | Pending |
| DASH-06 | Phase 253 | Pending |
| DASH-07 | Phase 253 | Pending |
| DASH-08 | Phase 253 | Pending |
| SC-01 | Phase 254 | Pending |
| SC-02 | Phase 254 | Pending |
| SC-03 | Phase 254 | Pending |
| SC-04 | Phase 254 | Pending |
| SC-05 | Phase 254 | Pending |
| SC-06 | Phase 254 | Pending |
| META-01 | Phase 252 | Pending |
| META-02 | Phase 252 | Pending |
| META-03 | Phase 252 | Pending |
| META-04 | Phase 252 | Pending |
| META-05 | Phase 252 | Pending |
| META-06 | Phase 252 | Pending |
| CHIP-01 | Phase 244 | Complete |
| CHIP-02 | Phase 244 | Complete |
| CHIP-03 | Phase 244 | Complete |
| CHIP-04 | Phase 244 | Complete |
| CHIP-05 | Phase 244 | Complete |
| NFR-01 | Phase 243 | Complete |
| NFR-02 | Phase 243 | Complete |
| NFR-03 | Phase 252 | Pending |
| NFR-04 | Phase 252 | Pending |
| NFR-05 | Phase 244 | Complete |
| NFR-06 | Phase 244 | Complete |

**Coverage:**
- v1 requirements: 80 total
- Mapped to phases: 80
- Unmapped: 0

---
*Requirements defined: 2026-02-19*
*Last updated: 2026-02-19 after roadmap creation*
