---
name: geography-department
type: chipset
category: chipset
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-11
first_path: examples/chipsets/geography-department/README.md
description: >
  Coordinated geography department -- seven named agents, six knowledge
  skills, three teams. 15th department in the college structure, following
  the department template pattern.
superseded_by: null
---

# Geography Department

## 1. What is the Geography Department?

The Geography Department chipset is a coordinated set of reasoning agents, domain
skills, and pre-composed teams that together provide structured geographic support
across physical geography, human geography, cartography and GIS, environmental
geography, geopolitics, and fieldwork methods. It is the 15th department in the
college structure, following the department template pattern established by the
math department. Incoming requests are classified by a router agent (Humboldt),
dispatched to the appropriate specialist, and all work products are persisted as
Grove records linked to the college concept graph.

## 2. Quick Start

Install the chipset into your gsd-skill-creator project:

```bash
# From the gsd-skill-creator root
cp -r examples/chipsets/geography-department .claude/chipsets/geography-department
```

The chipset is activated when any of the six skill trigger patterns match an
incoming query. Humboldt (the router agent) classifies the query domain and
dispatches to the appropriate specialist agent. No explicit activation command
is needed -- the skill-integration layer loads the chipset based on context.

To verify the chipset is recognized:

```bash
# Check that the YAML parses cleanly
node -e "const yaml = require('yaml'); const fs = require('fs'); \
  console.log(yaml.parse(fs.readFileSync('.claude/chipsets/geography-department/chipset.yaml', 'utf8')).name)"
# Expected output: geography-department-v1.0
```

## 3. Agent Roster

Seven agents form the department. Three run on Opus (for tasks requiring deep
integrative or historical reasoning), four on Sonnet (for well-bounded analytical
and communication tasks).

| Name       | Historical Figure          | Role                                                    | Model  | Tools                        |
|------------|----------------------------|---------------------------------------------------------|--------|------------------------------|
| humboldt   | Alexander von Humboldt     | Department chair -- classification, routing, synthesis  | opus   | Read, Glob, Grep, Bash, Write |
| reclus     | Elisee Reclus              | Physical geographer -- Earth systems, landforms, climate | opus   | Read, Grep, Bash             |
| massey     | Doreen Massey              | Human/social geographer -- power-geometry, inequality    | sonnet | Read, Grep, Write            |
| sauer      | Carl Sauer                 | Cultural landscape -- morphology, human-environment      | opus   | Read, Grep, Bash             |
| said-g     | Edward Said                | Geopolitics -- critical geopolitics, postcolonial        | sonnet | Read, Grep, Write            |
| tobler     | Waldo Tobler               | Cartographer/GIS -- projection, spatial analysis         | sonnet | Read, Bash, Write            |
| carson     | Rachel Carson              | Pedagogy/environment -- communication, teaching          | sonnet | Read, Write                  |

Humboldt is the CAPCOM (single point of contact for the user). All other agents
receive dispatched subtasks and return results through Humboldt.

## 4. Skill Inventory

Six skills provide domain knowledge that agents draw on during execution.

| Skill                  | Domain    | Trigger Patterns                                                              | Agent Affinity       |
|------------------------|-----------|-------------------------------------------------------------------------------|----------------------|
| physical-geography     | geography | plate tectonics, landform, erosion, biome, climate zone, ocean current, glacier, volcano, earthquake | reclus, humboldt     |
| human-geography        | geography | population, migration, urbanization, cultural diffusion, economic geography, gentrification, food desert, settlement | massey, sauer        |
| cartography-gis        | geography | map projection, GIS, choropleth, remote sensing, coordinate, spatial analysis, Mercator, satellite imagery | tobler               |
| environmental-geography| geography | climate change, deforestation, conservation, biodiversity, pollution, environmental justice, sustainability, desertification | carson, reclus       |
| geopolitics            | geography | geopolitics, border, sovereignty, territorial, postcolonial, Orientalism, contested territory | said-g, massey       |
| fieldwork-methods      | geography | fieldwork, field study, sampling, transect, quadrat, GPS, field observation   | carson, humboldt, sauer, tobler |

Agent affinity means the skill's content is preferentially loaded into the
listed agent's context. Multiple affinities mean the skill is relevant to
more than one specialist.

## 5. Team Configurations

Teams are pre-composed agent groups for common problem shapes.

| Team                      | Agents                                               | Use When                                        |
|---------------------------|------------------------------------------------------|-------------------------------------------------|
| geography-analysis-team   | humboldt, reclus, massey, sauer, said-g, tobler, carson | Multi-domain, research-level, or full-analysis requests |
| fieldwork-team            | carson, humboldt, sauer, tobler                      | Field study design, sampling, observation protocol |
| mapping-team              | tobler, reclus, massey, carson                       | Map production, GIS analysis, spatial statistics  |

**geography-analysis-team** is the full department. Use it for problems that
span multiple geographic domains or require the broadest possible expertise.

**fieldwork-team** pairs the observation specialist (Carson) with the integrated
field strategist (Humboldt), the cultural landscape reader (Sauer), and the
spatial data specialist (Tobler). Use it when planning or interpreting
geographic field research.

**mapping-team** is the cartographic pipeline. Tobler leads spatial analysis
and map design, Reclus provides physical geography content, Massey provides
social data and critical perspective, and Carson ensures the output
communicates effectively to its audience.

## 6. Grove Record Types

All department work products are persisted as Grove records under the
`geography-department` namespace. Five record types are defined:

| Record Type             | Produced By                   | Key Fields                                              |
|-------------------------|-------------------------------|---------------------------------------------------------|
| GeographicAnalysis      | reclus, massey, sauer, said-g | question, domain, method, analysis components, synthesis |
| SpatialModel            | tobler, reclus                | phenomenon, variables, relationships, spatial pattern, method notes |
| FieldReport             | sauer, carson                 | location, date, observations, feature interpretations, synthesis |
| GeographicExplanation   | carson                        | topic, level, explanation body, analogies, prerequisites, follow-ups |
| GeographySession        | humboldt                      | session ID, queries, dispatches, work product links, timestamps |

Records are content-addressed and immutable once written. GeographySession
records link all work products from a single interaction, providing an audit
trail from query to result.

## 7. College Integration

The chipset connects to the college geography department concept graph:

- **Concept graph read/write**: Agents can read existing concept definitions and
  write new ones when a topic is encountered that the graph does not yet cover.
- **Try Session generation**: When a GeographicExplanation is produced, the
  chipset can automatically generate a Try Session (interactive practice) based
  on the explanation content and the learner's current position in the concept
  graph.
- **Learning pathway updates**: Completed analyses, explanations, and field
  reports update the learner's progress along college-defined pathways.
- **Five wings** map to the college geography department structure:
  1. Earth Systems & Physical Geography
  2. Human Geography & Cultural Landscapes
  3. Maps, Spatial Analysis & GIS
  4. Astronomy & Our Place in Space
  5. Climate, Weather & Environmental Change

Each skill and Grove record type aligns to one or more wings, so work products
are automatically filed into the correct part of the concept graph.

## 8. Customization Guide

The geography department follows the department template pattern established by
the math department. To create a department for another domain, see the math
department README (Section 8) for the full 6-step fork-and-remap process.

### Geography-specific notes

- The 3 Opus / 4 Sonnet split reflects the geography department's emphasis on
  integrative reasoning (Humboldt), deep physical process understanding (Reclus),
  and historical-material analysis (Sauer). Departments with different reasoning
  profiles may want a different split.
- The `fieldwork-team` has no direct parallel in the math department. It reflects
  geography's identity as a field science. Other field-oriented departments
  (ecology, geology, anthropology) would likely want a similar team.
- The `mapping-team` is analogous to the math department's `discovery-team` --
  a focused production pipeline for a common output type (maps rather than
  conjectures).

## 9. Architecture Notes

### Why router topology

The router topology places a single agent (Humboldt) as the entry point for all
queries. This provides three benefits:

1. **Classification**: Humboldt determines which domain(s) a query touches before
   dispatching, preventing wasted work by non-relevant agents.
2. **Synthesis**: For multi-domain queries, Humboldt collects results from
   multiple specialists and synthesizes a unified response -- the Humboldtian
   integration that defines modern geography.
3. **CAPCOM boundary**: The user interacts with exactly one agent. This reduces
   cognitive load and provides a consistent communication style.

### Why 3 Opus / 4 Sonnet

Model assignment follows the reasoning depth required by each role:

- **Opus agents** (humboldt, reclus, sauer): These roles require the deepest
  reasoning. Routing and synthesis (Humboldt) must understand all six domains
  well enough to classify correctly. Physical geography (Reclus) requires
  multi-system process reasoning where errors compound. Cultural landscape
  analysis (Sauer) requires reading material evidence in historical depth.
- **Sonnet agents** (massey, said-g, tobler, carson): These roles are
  analytically well-bounded. Social-spatial analysis (Massey), geopolitical
  critique (Said-g), cartographic design (Tobler), and pedagogical
  communication (Carson) benefit from fast turnaround. Sonnet's speed matters
  more than its depth ceiling for these tasks.

### Why this team structure

The three teams cover the three most common geographic work patterns:

- **Full analysis**: needs every perspective (all 7 agents)
- **Fieldwork**: needs the observation-collection-integration pipeline (4 agents)
- **Mapping**: needs the design-content-critique-communication pipeline (4 agents)

Teams are not exclusive. Humboldt can assemble ad-hoc groups for queries that
do not fit any pre-composed team.

### CAPCOM boundary

The CAPCOM (Capsule Communicator) pattern means only Humboldt speaks to the
user. Other agents communicate through Humboldt via internal dispatch. This is
enforced by the `is_capcom: true` flag -- only one agent in the chipset may
carry this flag.

## 10. Relationship to Other Departments

The geography department shares borders with several other departments:

- **Earth Sciences / Geology**: Physical geography (Reclus) overlaps with geology
  on plate tectonics, mineralogy, and geomorphology. The geography department
  emphasizes spatial patterns and Earth system interactions; a geology department
  would emphasize rock classification, stratigraphy, and deep-time processes.
- **Political Science**: Geopolitics (Said-g) overlaps with political science on
  international relations, state theory, and governance. The geography department
  emphasizes spatial dimensions -- territory, borders, maps -- while political
  science emphasizes institutions, power, and policy.
- **Environmental Science**: Environmental geography (Carson, Reclus) overlaps
  with environmental science on climate change, conservation, and pollution. The
  geography department emphasizes spatial distribution, place-based analysis, and
  the social dimensions of environmental problems.
- **Mathematics**: Cartography and GIS (Tobler) uses mathematical concepts --
  projections are mathematical transformations, spatial statistics are statistical
  methods applied to spatial data. The math department provides the formal
  foundations; the geography department provides the spatial application.
- **Sociology / Anthropology**: Human geography (Massey, Sauer) overlaps with
  sociology on urbanization, inequality, and social structure, and with
  anthropology on cultural landscapes and fieldwork methods. The geography
  department's distinctive contribution is the spatial perspective -- not just
  *what* social patterns exist, but *where* they exist and *why there*.

This separation of concerns follows the university model: departments share
boundaries and collaborate, but each has a distinctive analytical perspective
that justifies its existence as a separate unit.
