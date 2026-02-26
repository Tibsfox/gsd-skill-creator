---
title: "Content Map"
layer: meta
path: "meta/content-map.md"
summary: "Complete inventory of all published tibsfox.com resources and docs/ files with layer assignments, audiences, formats, and status."
cross_references:
  - path: "index.md"
    relationship: "builds-on"
    description: "Narrative spine that this map supports"
  - path: "meta/index.md"
    relationship: "builds-on"
    description: "Part of meta-documentation"
  - path: "meta/filesystem-contracts.md"
    relationship: "parallel"
    description: "File ownership complements content inventory"
  - path: "meta/style-guide.md"
    relationship: "parallel"
    description: "Writing standards governing all listed content"
reading_levels:
  glance: "Complete inventory of all published content and docs/ files with layer assignment, audience, format, and status."
  scan:
    - "Five published resources on tibsfox.com spanning foundations through applications"
    - "43 docs/ files created in v1.34 Phase 326 as ecosystem scaffolding"
    - "46 runbooks and 8 operations manual pages from the OpenStack curriculum"
    - "Content classified by type: gateway, original, migrated, placeholder, reference"
created_by_phase: "v1.34-327"
last_verified: "2026-02-25"
---

# Content Map

This document inventories all published content on tibsfox.com and all files in the docs/
directory. It serves as the authoritative registry of what exists, where it lives, who it is
for, and what state it is in. The content map supports navigation generation, gap analysis,
and migration planning.


## Published Resources on tibsfox.com

These are the five major published resources that exist independently on tibsfox.com. The
narrative spine in [docs/index.md](../index.md) connects them into a coherent learning
journey. Each resource has (or will have) a gateway document in docs/ that provides context,
reading guidance, and cross-references.

| Resource | URL | Layer | Audience | Format | Status |
|----------|-----|-------|----------|--------|--------|
| The Space Between | /media/The_Space_Between.pdf | Foundations | Autodidacts, math learners | PDF, 923 pages | Published |
| Skills-and-Agents Report | /Skills-and-Agents/ | Principles | Developers, architects | HTML, 10 sections | Published |
| Global Power Efficiency Rankings | /Global-Power-Efficiency-Rankings.html | Applications | General public, career changers | HTML, interactive | Published |
| GSD Skill Creator Documentation | /Tibsfox/gsd-skill-creator/ | Framework | Developers, users | WordPress, 146 pages | Published, migration in progress |
| OpenStack Cloud Curriculum | /Tibsfox/gsd-skill-creator/docs/specialized-systems/openstack-cloud/ | Applications | SysAdmins, learners | WordPress, 72 pages | Published |


## docs/ Directory Inventory

The docs/ directory is the canonical source of truth for all documentation. Files fall into
five categories based on their origin and purpose.

**Gateway** documents orient readers and link to published resources or deeper content. They
do not reproduce content from external resources but provide context, reading guidance, and
cross-references.

**Original** content was written directly for docs/ and does not exist elsewhere. This
includes the narrative spine, style guide, filesystem contracts, and design principle
documents.

**Migrated** content was moved from WordPress or other sources into version-controlled
markdown. The migration preserves the original content while adapting formatting to the
style guide.

**Placeholder** files exist as scaffolding with frontmatter and a single italic line
indicating which phase will add their content. They reserve the file path and communicate
intent.

**Reference** content was produced by prior missions (notably v1.33 OpenStack) and lives
in docs/ as domain-specific documentation.


### Narrative Spine and Entry Point

| File | Type | Layer | Status | Phase |
|------|------|-------|--------|-------|
| `index.md` | Original | Meta | Complete | v1.34-327 |


### Foundations (Layer 1)

| File | Type | Layer | Status | Phase |
|------|------|-------|--------|-------|
| `foundations/index.md` | Gateway | Foundations | Placeholder | v1.34-326 |
| `foundations/mathematical-foundations.md` | Gateway | Foundations | Placeholder | v1.34-326 |
| `foundations/complex-plane.md` | Gateway | Foundations | Placeholder | v1.34-326 |
| `foundations/eight-layer-progression.md` | Gateway | Foundations | Placeholder | v1.34-326 |

Content planned for Phase 328 (Gateway Documents).


### Principles (Layer 2)

| File | Type | Layer | Status | Phase |
|------|------|-------|--------|-------|
| `principles/index.md` | Gateway | Principles | Placeholder | v1.34-326 |
| `principles/agentic-programming.md` | Gateway | Principles | Placeholder | v1.34-326 |
| `principles/amiga-principle.md` | Original | Principles | Placeholder | v1.34-326 |
| `principles/progressive-disclosure.md` | Original | Principles | Placeholder | v1.34-326 |
| `principles/humane-flow.md` | Original | Principles | Placeholder | v1.34-326 |

Content planned for Phase 328 (Gateway Documents).


### Framework (Layer 3)

| File | Type | Layer | Status | Phase |
|------|------|-------|--------|-------|
| `framework/index.md` | Gateway | Framework | Placeholder | v1.34-326 |
| `framework/getting-started.md` | Migrated | Framework | Placeholder | v1.34-326 |
| `framework/core-concepts.md` | Migrated | Framework | Placeholder | v1.34-326 |
| `framework/features.md` | Migrated | Framework | Placeholder | v1.34-326 |
| `framework/architecture/index.md` | Gateway | Framework | Placeholder | v1.34-326 |
| `framework/architecture/core-learning.md` | Migrated | Framework | Placeholder | v1.34-326 |
| `framework/developer-guide/index.md` | Gateway | Framework | Placeholder | v1.34-326 |
| `framework/reference/index.md` | Gateway | Framework | Placeholder | v1.34-326 |
| `framework/tutorials/index.md` | Gateway | Framework | Placeholder | v1.34-326 |
| `framework/user-guides/index.md` | Gateway | Framework | Placeholder | v1.34-326 |

Content planned for Phase 329 (WordPress Migration).

**Pre-existing framework docs** (not yet integrated into the new directory structure):

| File | Type | Layer | Status | Notes |
|------|------|-------|--------|-------|
| `GETTING-STARTED.md` | Migrated | Framework | Pre-existing | Original WordPress export |
| `FEATURES.md` | Migrated | Framework | Pre-existing | Original WordPress export |
| `CORE-CONCEPTS.md` | Migrated | Framework | Pre-existing | Original WordPress export |
| `HOW-IT-WORKS.md` | Migrated | Framework | Pre-existing | Original WordPress export |
| `CONFIGURATION.md` | Migrated | Framework | Pre-existing | Original WordPress export |
| `WORKFLOWS.md` | Migrated | Framework | Pre-existing | Original WordPress export |
| `CLI.md` | Reference | Framework | Pre-existing | CLI reference |
| `API.md` | Reference | Framework | Pre-existing | API reference |
| `EXTENSIONS.md` | Reference | Framework | Pre-existing | Extensions reference |
| `TOKEN-BUDGET.md` | Migrated | Framework | Pre-existing | Token budget documentation |
| `BOUNDED-LEARNING.md` | Migrated | Framework | Pre-existing | Bounded learning system |
| `SKILL-FORMAT.md` | Reference | Framework | Pre-existing | Skill format specification |
| `OFFICIAL-FORMAT.md` | Reference | Framework | Pre-existing | Official format specification |
| `PATTERN-DISCOVERY.md` | Migrated | Framework | Pre-existing | Pattern discovery system |
| `AGENT-GENERATION.md` | Migrated | Framework | Pre-existing | Agent generation system |
| `AGENT-TEAMS.md` | Migrated | Framework | Pre-existing | Agent team composition |
| `GSD-TEAMS.md` | Reference | Framework | Pre-existing | GSD team topology |
| `GSD_Orchestrator_Guide.md` | Reference | Framework | Pre-existing | Orchestrator guide |
| `GSD_and_Skill-Creator_Overview.md` | Migrated | Framework | Pre-existing | System overview |
| `COMPARISON.md` | Migrated | Framework | Pre-existing | Comparison with alternatives |
| `TROUBLESHOOTING.md` | Reference | Framework | Pre-existing | Troubleshooting guide |
| `DEVELOPMENT.md` | Migrated | Framework | Pre-existing | Development setup |
| `FILE-STRUCTURE.md` | Reference | Framework | Pre-existing | Project file structure |
| `REQUIREMENTS.md` | Reference | Framework | Pre-existing | System requirements |
| `RELEASE-HISTORY.md` | Reference | Framework | Pre-existing | Complete release history |
| `RELEASE-NOTES-v1.8.1.md` | Reference | Framework | Pre-existing | v1.8.1 patch notes |
| `about.md` | Migrated | Framework | Placeholder | v1.34-326 |

These files will be integrated into the `framework/` subdirectory structure during Phase 329
(WordPress Migration). The uppercase-named files are WordPress exports that predate the v1.34
docs/ reorganization.


### Applications (Layer 4)

| File | Type | Layer | Status | Phase |
|------|------|-------|--------|-------|
| `applications/index.md` | Gateway | Applications | Placeholder | v1.34-326 |
| `applications/power-efficiency.md` | Gateway | Applications | Placeholder | v1.34-326 |
| `applications/educational-packs.md` | Gateway | Applications | Placeholder | v1.34-326 |
| `applications/case-studies/index.md` | Gateway | Applications | Placeholder | v1.34-326 |
| `applications/case-studies/openstack-cloud.md` | Gateway | Applications | Placeholder | v1.34-326 |
| `applications/openstack-cloud/index.md` | Gateway | Applications | Placeholder | v1.34-326 |

**OpenStack Cloud curriculum** (produced by v1.33 mission):

| File | Type | Layer | Status | Notes |
|------|------|-------|--------|-------|
| `sysadmin-guide/00-overview.md` | Reference | Applications | Complete | NASA SE overview |
| `sysadmin-guide/01-pre-phase-a-concept.md` | Reference | Applications | Complete | Pre-Phase A |
| `sysadmin-guide/02-phase-a-development.md` | Reference | Applications | Complete | Phase A |
| `sysadmin-guide/03-phase-b-design.md` | Reference | Applications | Complete | Phase B |
| `sysadmin-guide/04-phase-c-build.md` | Reference | Applications | Complete | Phase C |
| `sysadmin-guide/05-phase-d-test.md` | Reference | Applications | Complete | Phase D |
| `sysadmin-guide/06-phase-e-operations.md` | Reference | Applications | Complete | Phase E |
| `sysadmin-guide/07-phase-f-closeout.md` | Reference | Applications | Complete | Phase F |
| `operations-manual/cinder-procedures.md` | Reference | Applications | Complete | Block storage |
| `operations-manual/glance-procedures.md` | Reference | Applications | Complete | Image service |
| `operations-manual/heat-procedures.md` | Reference | Applications | Complete | Orchestration |
| `operations-manual/horizon-procedures.md` | Reference | Applications | Complete | Dashboard |
| `operations-manual/keystone-procedures.md` | Reference | Applications | Complete | Identity |
| `operations-manual/neutron-procedures.md` | Reference | Applications | Complete | Networking |
| `operations-manual/nova-procedures.md` | Reference | Applications | Complete | Compute |
| `operations-manual/swift-procedures.md` | Reference | Applications | Complete | Object storage |
| `runbooks/` (46 files) | Reference | Applications | Complete | Operational runbooks |
| `reference/nasa-se-mapping.md` | Reference | Applications | Complete | NASA SE mapping |
| `reference/openstack-cross-cloud.md` | Reference | Applications | Complete | Cross-cloud reference |
| `reference/quick-reference-card.md` | Reference | Applications | Complete | Quick reference |
| `vv/` (7 files) | Reference | Applications | Complete | V&V procedures |

**Minecraft educational content** (produced by v1.22 mission):

| File | Type | Layer | Status | Notes |
|------|------|-------|--------|-------|
| `minecraft-performance-tuning.md` | Reference | Applications | Complete | Performance guide |
| `minecraft/client-setup-guide.md` | Reference | Applications | Complete | Client setup |
| `minecraft/troubleshooting.md` | Reference | Applications | Complete | Troubleshooting |

**Other reference documents:**

| File | Type | Layer | Status | Notes |
|------|------|-------|--------|-------|
| `lessons-learned.md` | Reference | Applications | Complete | v1.33 mission retrospective |
| `architecture/README.md` | Reference | Framework | Pre-existing | Architecture overview |
| `architecture/data-flows.md` | Reference | Framework | Pre-existing | Data flow diagrams |
| `architecture/extending.md` | Reference | Framework | Pre-existing | Extension guide |
| `architecture/layers.md` | Reference | Framework | Pre-existing | System layers |
| `architecture/storage.md` | Reference | Framework | Pre-existing | Storage architecture |
| `tutorials/calibration.md` | Reference | Framework | Pre-existing | Calibration tutorial |
| `tutorials/ci-integration.md` | Reference | Framework | Pre-existing | CI integration |
| `tutorials/conflict-detection.md` | Reference | Framework | Pre-existing | Conflict detection |
| `tutorials/skill-creation.md` | Reference | Framework | Pre-existing | Skill creation |
| `tutorials/team-creation.md` | Reference | Framework | Pre-existing | Team creation |
| `filesystem-contracts.md` | Reference | Meta | Pre-existing | Superseded by meta/filesystem-contracts.md |


### Community (Layer 5)

| File | Type | Layer | Status | Phase |
|------|------|-------|--------|-------|
| `community/index.md` | Gateway | Community | Placeholder | v1.34-326 |
| `community/contributing.md` | Original | Community | Placeholder | v1.34-326 |
| `community/skill-exchange.md` | Original | Community | Placeholder | v1.34-326 |
| `community/code-of-conduct.md` | Original | Community | Placeholder | v1.34-326 |

Content planned for Phase 332 (Improvement Cycle).


### Templates

| File | Type | Layer | Status | Phase |
|------|------|-------|--------|-------|
| `templates/index.md` | Gateway | Templates | Placeholder | v1.34-326 |
| `templates/educational-pack.md` | Original | Templates | Placeholder | v1.34-326 |
| `templates/career-pathway.md` | Original | Templates | Placeholder | v1.34-326 |
| `templates/ai-learning-prompt.md` | Original | Templates | Placeholder | v1.34-326 |
| `templates/mission-retrospective.md` | Original | Templates | Placeholder | v1.34-326 |

Content planned for Phase 330 (Template Extraction).


### Meta-Documentation

| File | Type | Layer | Status | Phase |
|------|------|-------|--------|-------|
| `meta/index.md` | Gateway | Meta | Complete | v1.34-326 |
| `meta/style-guide.md` | Original | Meta | Complete | v1.34-326 |
| `meta/filesystem-contracts.md` | Original | Meta | Complete | v1.34-326 |
| `meta/content-map.md` | Original | Meta | Complete | v1.34-327 |
| `meta/site-architecture.md` | Original | Meta | Placeholder | v1.34-326 |
| `meta/content-pipeline.md` | Original | Meta | Placeholder | v1.34-326 |
| `meta/improvement-cycle.md` | Original | Meta | Placeholder | v1.34-326 |

Site architecture, content pipeline, and improvement cycle content planned for Phases 331-332.


## Content Summary

| Category | Files | Complete | Placeholder | Pre-existing |
|----------|-------|----------|-------------|-------------|
| Narrative spine | 1 | 1 | 0 | 0 |
| Foundations | 4 | 0 | 4 | 0 |
| Principles | 5 | 0 | 5 | 0 |
| Framework (new structure) | 10 | 0 | 10 | 0 |
| Framework (pre-existing) | 26 | 26 | 1 | 0 |
| Applications (new structure) | 6 | 0 | 6 | 0 |
| Applications (OpenStack) | 69 | 69 | 0 | 0 |
| Applications (Minecraft) | 3 | 3 | 0 | 0 |
| Applications (other) | 1 | 1 | 0 | 0 |
| Community | 4 | 0 | 4 | 0 |
| Templates | 5 | 0 | 5 | 0 |
| Meta | 7 | 4 | 3 | 0 |

**Total docs/ files:** 141

**Published external resources:** 5


## Gaps and Planned Additions

The following content is identified as needed but does not yet exist.

**Phase 328 (Gateway Documents):** Will fill 9 placeholder files in `foundations/` and
`principles/` with gateway content linking to The Space Between and the Skills-and-Agents
Report.

**Phase 329 (WordPress Migration):** Will migrate core WordPress pages into the `framework/`
subdirectory structure and fill 10 placeholder files. Will also integrate the 26 pre-existing
uppercase-named docs into the new structure.

**Phase 330 (Template Extraction):** Will fill 5 placeholder template files with patterns
extracted from the Power Efficiency Rankings and OpenStack curriculum.

**Phase 331 (Site Architecture):** Will fill `meta/site-architecture.md` and
`meta/content-pipeline.md` with the www/ structure specification and docs-to-site
transformation rules.

**Phase 332 (Improvement Cycle):** Will fill `meta/improvement-cycle.md` and 4 community
placeholder files with the iterative feedback loop specification and community contribution
pathways.
