# Virtual Black Rock City — Mission Staging

**Status:** STAGED (read, reviewed, awaiting execution)
**Date staged:** 2026-03-09
**Mission pack:** `mission-pack/vbrc_mission.pdf` (24 pages, 179KB)
**Companion files:** `mission-pack/vbrc_index.html` (styled web view), `mission-pack/vbrc_mission.tex` (LaTeX source)

---

## Adaptation Context

**This mission references the real Burning Man festival.** The language, structure, and organizational patterns from Black Rock City are being **adapted as metaphor** for how our Center Camp forest structure works — a place where people can go out into the forest landscape and make art, camps, and other installations for others to explore.

The mapping is:
- **The Playa** → The Dolt commons / Black Sand Flat (the open space between skill clusters)
- **Theme Camps** → Skill clusters in Cedar Grove, Raven's Roost, etc. (groups of related skills people build)
- **Art Installations** → Emergent skills / Nurse Logs (things that arise from multi-camp composition — discovered, not planned)
- **Mutant Vehicles** → Mobile chipsets / Orca Sled, Raven Crawler (skills that move between camps)
- **Volunteer Departments** → Agent teams / Watershed Watch, Osprey Landing (roles people can try)
- **The Man** → Apex skill / Tahoma's Eye (the central structure)
- **The Temple** → Synthesis engine / Old Growth (reflection, letting go)
- **Burn Night** → Skill promotion / Cedar Falls (when work becomes complete)
- **Leave No Trace** → LNT cleanup / Restoration Pass (clean departure)
- **Rigs** → Participant agent identities (your presence in the city)
- **Stamps** → Mycorrhizal marks (recognition of contribution)

This is NOT a simulation of the festival. It is an invitation to inhabit the same **topology** — the space between the skills, the esplanade between the code, the burn between the version and the void — and name it in the language of the Pacific Northwest bioregion.

---

## Mission Summary

**Milestone:** v1.44 — Virtual Black Rock City
**Branch:** wasteland/skill-creator-integration
**Activation Profile:** Fleet (18 roles, 3 parallel tracks)
**Estimated:** 3 sessions, 8-12 context windows, ~236k tokens

### 6 Modules

| # | Module | What It Produces |
|---|--------|------------------|
| 1 | 10 Principles as GSD Guidelines | 10 architectural guideline specs with testable behavior |
| 2 | Playa Roles Catalog | 30 BRC departments → 30 PNW-named skill specifications |
| 3 | Theme Camps and Art Installations | 8 camp clusters + 12 emergent art installation archetypes |
| 4 | Mutant Vehicles and Mobile Chipsets | 4 mobile chipset definitions (Orca Sled, Raven Crawler, Osprey Dive, Chinook Rider) |
| 5 | City Infrastructure and Civic Layer | 6 civic agent roles (Gate, DPW, Rangers, Medical, Docs, LNT) |
| 6 | Wasteland MVR Integration | Rig schema, wanted board seeding, stamp taxonomy, trust ladder |

### Wave Architecture

| Wave | Name | Mode | Duration | Key Outputs |
|------|------|------|----------|-------------|
| 0 | Foundation | Sequential | 30 min | Schemas, naming glossary, source index |
| 1A | Principles + Roles | Parallel | 90 min | 10 principle specs, 30 role specs, CEDAR chipset |
| 1B | Camps + Vehicles | Parallel | 90 min | 8 camps, 4 vehicles, 6 civic agents |
| 2 | Synthesis | Sequential | 60 min | Wasteland integration, art patterns, safety gates |
| 3 | Publication | Sequential | 45 min | Catalog, test suite, index page |

### 12 Deliverables

1. `skills/virtual-brc/` — 10 SKILL.md files (one per Principle)
2. `skills/virtual-brc/` — 30 SKILL.md files (PNW-named roles)
3. `config/cedar-chipset` — 8 chips, 4 activation profiles
4. `data/camps/` — 8 camp cluster JSON files
5. `data/vehicles/` — 4 mobile chipset specs
6. `skills/virtual-brc/` — 6 civic agent SKILL.md files
7. `data/wasteland/rig` — Rig identity + trust ladder
8. `data/wasteland/esp` — Seeded wanted board (30 items)
9. `data/stamps/mycorr` — 5 stamp types defined
10. `docs/art-installations` — 12 composition patterns documented
11. `virtual-brc/index.html` — Browsable role-chooser catalog
12. `tests/virtual-brc/` — Test suite; all safety-critical pass

### Safety-Critical Tests (6, all BLOCK-on-fail)

| ID | Gate | Rule |
|----|------|------|
| SC-01 | Tide Pool Medical | Emergency Services cannot be bypassed |
| SC-02 | Columbia Gate | No rig enters wanted board without identity validation |
| SC-03 | Cascade Brigade | No theme camp active without DPW sign-off |
| SC-04 | Restoration Pass | LNT runs before any skill deprecation |
| SC-05 | Yearbook Rule | Rig cannot stamp its own completion |
| SC-06 | Anti-commodification | No leaderboards, vanity metrics, or paid acceleration |

### 12 Success Criteria

1. All 10 Burning Man Principles have a corresponding GSD guideline with testable behavior
2. All 30 BRC volunteer departments have a named skill specification with PNW bioregion name
3. Every skill spec is self-contained and can be activated without external documentation
4. The CEDAR chipset activates cleanly across all 4 profiles (Scout through Fleet)
5. The Wasteland MVR schema accommodates all virtual BRC rig types and stamp categories
6. The role-chooser catalog allows browsing by skill category, difficulty, and camp affiliation
7. The LNT agent can deprecate skills without leaving orphaned dependencies
8. The trust ladder (Level 1-3) maps correctly to BRC volunteer experience tiers
9. At least 3 art installations can emerge from multi-camp skill composition
10. The PNW naming glossary covers 100% of new component names with source citations
11. The civic layer (Rangers, Gate, DPW, Medical) passes all safety-critical tests
12. The mission package is self-contained and can be handed to GSD orchestrator with zero additional context

### Model Assignment

| Model | % | Assigned To |
|-------|---|-------------|
| Opus | 28% | Wasteland integration, art composition patterns, safety gate definitions |
| Sonnet | 62% | All 30 role SKILL.md files, 10 Principles specs, CEDAR chipset, camp/vehicle defs, catalog, verification |
| Haiku | 10% | Shared schemas, source index, naming glossary scaffolding |

### Mission Crew (18 roles)

FLIGHT (Orchestrator), PLAN (Planner), TOPO (Topology Mgr), ARCH (Architecture), SCOUT (Research), EXEC-A (Wave 1A), EXEC-B (Wave 1B), CRAFT-BRC (BRC Specialist), CRAFT-PNW (PNW Specialist), VERIFY (Verification), INTEG (Integration), SECURE (Safety Warden), CAPCOM (HITL Interface), ANALYST (Pattern Analyst), BUDGET (Resource Mgr), RETRO (Retrospective), SURGEON (Health Monitor), LOG (Chronicle)

### Key PNW Name Mappings (sample)

| BRC Department | PNW Skill Name |
|----------------|----------------|
| Airport | Osprey Landing |
| Black Rock Rangers | Watershed Watch |
| Center Camp | Old Growth Assembly |
| DPW | Cascade Brigade |
| Emergency Services | Tide Pool Medical |
| Greeters | Raven's Welcome |
| Lamplighters | Firefly Circuit |
| Earth Guardians | Geoduck Watch |
| Gate/Perimeter | Columbia Gate |
| Cleanup/Restoration | Restoration Pass |
| Documentation Team | Raven Archive |

### CEDAR Chipset (8 chips)

- **CEDAR:** Structural stability, camp scaffolding, LNT
- **RAVEN:** Communication, observation, message routing
- **SALMON:** Navigation, upstream problem-solving, lifecycle mgmt
- **OSPREY:** Aerial observation, census, documentation
- **TAHOMA:** Summit synthesis, apex skill promotion engine
- **HEMLOCK:** Deep-time patience, dependency resolution
- **ORCA:** Mobile traversal, mutant-vehicle transport layer
- **GEODUCK:** Deep persistence, Dolt commons root system

### Art Installation Archetypes (12)

Nurse Log, Mycorrhizal Mandala, Tidal Reach, Salmon Ladder, Raven Mirror, Whitebark Sentinel, Geoduck Deep, Orca Wake, Canopy Break, Fire Succession, Mother Tree, Estuary

---

## The Through-Line

> "The Space Between is not just the title of a mathematics textbook. It is the topology of Burning Man. The playa is the space between the city and the desert. The esplanade is the space between the camps and the art. The temple is the space between what you built and what you let go of. The burn itself is the space between presence and ash."

> "GSD lives in the same topology. The skill is not the code. The skill is the pattern between the code. The chipset is not the model. The chipset is the architecture between the models. The Wasteland is not the work. The Wasteland is the economy between the work."

> "Virtual Black Rock City is an invitation to inhabit that topology deliberately. To name it in the language of the Pacific Northwest bioregion — salmon, raven, cedar, tahoma, mycorrhiza — is to insist that architecture is a place. That the spaces between are not empty. That something lives there."

---

## Dependencies

| Document | Relationship | Notes |
|----------|-------------|-------|
| skill-creator-wasteland-integration-analysis.md | Upstream | Wasteland schema reference |
| gsd-chipset-architecture-vision.md | Upstream | CEDAR inherits from this |
| gsd-silicon-layer-spec.md | Upstream | Agent activation model |
| gsd-os-desktop-vision.md | Downstream | Role-chooser UI lives here |
| gsd-foxfire-heritage-mission-package.md | Parallel | Cultural sovereignty model |
| tibsfox.com/PNW | Naming source | All bioregion names from here |

---

*Staged by Cedar. Awaiting human go/no-go.*
