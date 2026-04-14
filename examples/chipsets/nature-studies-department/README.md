---
name: nature-studies-department
type: chipset
category: chipset
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/chipsets/nature-studies-department/README.md
description: >
  Coordinated nature-studies department — seven named agents, six knowledge
  skills, three teams. Department template pattern instantiation for field
  naturalism, species identification, and ecological observation.
superseded_by: null
---

# Nature Studies Department

## 1. What is the Nature Studies Department?

The Nature Studies Department chipset is a coordinated set of naturalist agents,
domain skills, and pre-composed teams that together support observational natural
history across five wings: outdoor observation, plants and fungi, animals and
birds, ecology and habitats, and citizen science. It is an instantiation of the
"department template pattern" in gsd-skill-creator. Incoming queries are
classified by a router agent (Linnaeus), dispatched to the appropriate specialist,
and all work products are persisted as Grove records linked to the college
concept graph. The department supports both beginner-facing field identification
and research-grade biogeographic investigation.

Unlike laboratory disciplines, nature studies is almost entirely field-based. The
core verbs of the domain are observe, describe, identify, compare, locate, and
record. Specimens cannot always be collected, experiments cannot always be run,
and many questions are resolved by patient sustained attention rather than
intervention. The department's agents are historical figures whose primary
contributions were to the practice of field observation.

## 2. Quick Start

Install the chipset into your gsd-skill-creator project:

```bash
# From the gsd-skill-creator root
cp -r examples/chipsets/nature-studies-department .claude/chipsets/nature-studies-department
```

The chipset is activated when any of the six skill trigger patterns match an
incoming query. Linnaeus (the router agent) classifies the query by wing and
dispatches to the appropriate specialist agent. No explicit activation command
is needed — the skill-integration layer loads the chipset based on context.

To verify the chipset is recognized:

```bash
node -e "const yaml = require('yaml'); const fs = require('fs'); \
  console.log(yaml.parse(fs.readFileSync('.claude/chipsets/nature-studies-department/chipset.yaml', 'utf8')).name)"
# Expected output: nature-studies-department-v1.0
```

## 3. Agent Roster

Seven agents form the department. Three run on Opus (for judgment-heavy
observational and taxonomic work), four on Sonnet (for structured field-guide,
biogeographic, and pedagogy work).

| Name              | Historical Figure            | Role                                                       | Model  | Tools                          |
|-------------------|------------------------------|------------------------------------------------------------|--------|--------------------------------|
| linnaeus          | Carl Linnaeus                | Department chair — classification, routing, synthesis     | opus   | Read, Glob, Grep, Bash, Write  |
| goodall-nat       | Jane Goodall                 | Field ethologist — primate, mammal, longitudinal behavior | opus   | Read, Grep, Bash               |
| merian            | Maria Sibylla Merian         | Entomologist — metamorphosis, host-plant ecology, illustration | opus   | Read, Grep, Bash, Write        |
| audubon           | John James Audubon           | Ornithologist — bird identification, illustration, voice  | sonnet | Read, Bash                     |
| von-humboldt-nat  | Alexander von Humboldt       | Biogeographer — habitat, elevation, species assemblage    | sonnet | Read, Grep                     |
| peterson          | Roger Tory Peterson          | Field-guide methodologist — diagnostic features, patterns | sonnet | Read, Bash                     |
| louv              | Richard Louv                 | Pedagogy — nature-deficit, nature-based learning           | sonnet | Read, Write                    |

Linnaeus is the CAPCOM (single point of contact for the user). All other agents
receive dispatched subtasks and return results through Linnaeus.

The two agents whose base names collide with agents already present in other
departments (Jane Goodall's `goodall` in `science`, Alexander von Humboldt's
`humboldt` in `geography`) carry the `-nat` suffix so the nature-studies
department can coexist with them without conflict.

## 4. Skill Inventory

Six skills provide domain knowledge that agents draw on during execution. The
skills span all five college wings so every query has at least one relevant
skill to load.

| Skill                         | Domain         | Trigger Patterns                                                | Agent Affinity             |
|-------------------------------|----------------|-----------------------------------------------------------------|----------------------------|
| field-identification          | nature-studies | identify, what is this, field mark, key out, dichotomous key    | peterson, linnaeus         |
| taxonomic-classification      | nature-studies | scientific name, binomial, genus, species, family, taxonomy     | linnaeus                   |
| nature-journaling             | nature-studies | nature journal, field notebook, sketch, phenology, sit spot     | merian, louv               |
| bird-observation              | nature-studies | bird, birding, song, call, eBird, warbler, raptor               | audubon, peterson          |
| ecosystem-mapping             | nature-studies | ecosystem, habitat, biome, food web, succession, keystone      | von-humboldt-nat, linnaeus |
| species-interaction-tracking  | nature-studies | behavior, metamorphosis, host plant, ethology, life cycle      | goodall-nat, merian        |

Agent affinity means the skill's content is preferentially loaded into the
listed agent's context. Multiple affinities mean the skill is relevant to
more than one specialist.

## 5. Team Configurations

Teams are pre-composed agent groups for common problem shapes.

| Team                              | Agents                                                                  | Use When                                                     |
|-----------------------------------|-------------------------------------------------------------------------|--------------------------------------------------------------|
| nature-studies-analysis-team      | linnaeus, goodall-nat, merian, audubon, von-humboldt-nat, peterson, louv | Multi-wing, research-level, or full-analysis requests        |
| nature-studies-workshop-team      | linnaeus, peterson, audubon, louv                                       | Identification-heavy, field-guide-style workshops            |
| nature-studies-practice-team      | merian, goodall-nat, von-humboldt-nat, louv                             | Ongoing field practice, phenology, and behavior tracking     |

**nature-studies-analysis-team** is the full department. Use it for questions
that span multiple wings, require biogeographic context alongside identification,
or ask for research-level investigation (for example, "explain why cedar
waxwings have shifted their wintering range over the last two decades").

**nature-studies-workshop-team** pairs the chair (Linnaeus) with the two most
identification-forward specialists (Peterson and Audubon) and the pedagogy
agent (Louv). Use it when the goal is to teach identification, build a field
guide, or walk a beginner through a single observation with full explanation.

**nature-studies-practice-team** is the pipeline for sustained field practice.
Merian models the nature-journal loop, Goodall models longitudinal ethology,
von Humboldt supplies habitat context, and Louv scaffolds the session as a
learning experience rather than a one-shot answer.

## 6. Grove Record Types

All department work products are persisted as Grove records under the
`nature-studies-department` namespace. Five record types are defined:

| Record Type                | Produced By                         | Key Fields                                                        |
|----------------------------|-------------------------------------|-------------------------------------------------------------------|
| NatureStudiesAnalysis      | linnaeus, peterson, goodall-nat     | subject, identification evidence, confidence, interaction notes   |
| NatureStudiesFieldRecord   | merian, audubon, goodall-nat        | species, location, datetime, weather, behavior, media hashes      |
| NatureStudiesReview        | linnaeus, peterson                  | reviewed record, verdict, corrections, revised confidence          |
| NatureStudiesExplanation   | louv                                | topic, target level, explanation body, prerequisites, next steps   |
| NatureStudiesSession       | linnaeus                            | session ID, queries, dispatches, work product links, timestamps    |

Records are content-addressed and immutable once written. A NatureStudiesSession
record links every work product from a single interaction, providing an audit
trail from the user's first question to the final identification or report.

The `NatureStudiesFieldRecord` type is the workhorse. Every observation, whether
produced during a teaching session or an independent field outing, becomes one
of these records. Over time, the accumulation of field records builds a personal
phenology and distribution dataset for the user — the same structural purpose
that a paper field notebook serves for a traditional naturalist, but
content-addressed, queryable, and shareable.

## 7. College Integration

The chipset connects to the college nature-studies department concept graph:

- **Concept graph read/write**: Agents can read existing concept definitions and
  write new ones when a topic is encountered that the graph does not yet cover.
- **Try Session generation**: When a NatureStudiesExplanation is produced, the
  chipset can automatically generate a Try Session (field exercise) based on the
  explanation content and the learner's current position in the concept graph.
- **Learning pathway updates**: Completed field records, identifications, and
  explanations update the learner's progress along college-defined pathways.
- **Five wings** map to the college nature-studies department structure:
  1. Outdoor Observation
  2. Plants & Fungi
  3. Animals & Birds
  4. Ecology & Habitats
  5. Citizen Science

Each skill and Grove record type aligns to one or more wings, so work products
are automatically filed into the correct part of the concept graph.

## 8. Customization Guide

The nature-studies department follows the department template pattern. To
adapt it for another observational discipline (marine studies, astronomy,
geology fieldwork), follow these steps:

### Step 1: Copy the chipset directory

```bash
cp -r examples/chipsets/nature-studies-department examples/chipsets/YOUR_DOMAIN-department
```

### Step 2: Rename agents

Edit `chipset.yaml` and replace agent names, roles, and historical figure
references. For a marine studies department you might use: carson (router),
cousteau (underwater), earle (ecology), prince (behavior), ballard (deep
cartography), castro (cetacean acoustics), bernal-diaz (pedagogy).

### Step 3: Replace skills with domain-appropriate content

Swap the six nature-studies skills for domain equivalents. Each skill needs a
`domain`, a `description`, a `triggers` list, and an `agent_affinity` mapping.

### Step 4: Define new Grove record types

Replace the five `NatureStudiesX` record types with domain-appropriate types.
Keep the same shape: one analysis type, one observation/record type, one
review type, one explanation type, one session type.

### Step 5: Map to the target college department

Update the `college` section: set `department`, define wings, and decide
whether `concept_graph.write` should be enabled.

### Step 6: Update evaluation gates

Review `evaluation.gates`. The five default gates are generic enough for most
departments. Update `benchmark.domains_covered` to list the new domain areas.

## 9. Architecture Notes

### Why router topology

The router topology places a single agent (Linnaeus) as the entry point for all
queries. This provides three benefits:

1. **Classification**: Linnaeus determines which wing a query touches before
   dispatching, preventing wasted work by non-relevant specialists.
2. **Synthesis**: For multi-wing queries, Linnaeus collects results from multiple
   specialists and synthesizes a unified response.
3. **CAPCOM boundary**: The user interacts with exactly one agent, keeping the
   communication style consistent even when several specialists contributed.

Linnaeus is the right historical figure for the chair role because his lifetime
contribution was not primarily a single discovery but a classification system
that let everyone else's work be filed and retrieved. The routing agent's job is
structurally the same: receive, classify, file, retrieve.

### Why 3 Opus / 4 Sonnet

Model assignment follows reasoning depth:

- **Opus agents** (linnaeus, goodall-nat, merian): routing and taxonomic
  synthesis (Linnaeus), longitudinal behavioral inference (Goodall), and
  metamorphosis / host-plant ecology (Merian) all benefit from deep multi-step
  reasoning. Ethology in particular is judgment-heavy: the meaning of a
  behavioral act depends on context that must be held in working memory.
- **Sonnet agents** (audubon, von-humboldt-nat, peterson, louv): bird ID by
  sight and sound (Audubon), habitat and biogeography lookup (von Humboldt),
  field-guide diagnostic work (Peterson), and level-adapted explanation (Louv)
  are throughput-oriented. Sonnet's speed matters more than its depth ceiling
  for these tasks.

This 3/4 split keeps the token budget practical while preserving quality where
it matters most. It mirrors the math-department split without pretending that
nature studies needs the same reasoning depth at every role.

### Why these three team shapes

The three teams cover the three most common nature-studies query shapes:

- **Full investigation**: needs every perspective (all 7 agents) — multi-wing
  questions where taxonomy, behavior, biogeography, and teaching all contribute
  to a single answer.
- **Identification workshop**: needs the ID specialists (Peterson, Audubon) plus
  the chair and the pedagogy agent. Focused for the most common user request,
  "what is this?"
- **Field practice**: needs the observation specialists (Merian, Goodall) plus
  biogeographic context (von Humboldt) and pedagogy (Louv). This team models
  what sustained field practice looks like, not what a one-shot answer looks
  like.

Teams are not exclusive. Linnaeus can assemble ad-hoc groups for queries that
do not fit any pre-composed team.

### CAPCOM boundary

The CAPCOM (Capsule Communicator) pattern means only Linnaeus speaks to the
user. Other agents communicate through Linnaeus via internal dispatch. This is
enforced by the `is_capcom: true` flag — only one agent in the chipset may
carry this flag. The boundary exists because naturalist answers are frequently
tentative ("probable immature Cooper's hawk based on eye color and tail band")
and the user needs a single voice to hold confidence, caveat, and next-step
recommendation together in one response rather than three competing expert
dispatches.

## 10. Relationship to Other Departments

Nature Studies overlaps with several other departments in the college:

- **Science Department** (`science`) — The scientific method, experimental
  design, and hypothesis testing live in `science`. When a naturalist observation
  escalates to a testable hypothesis, Linnaeus may recommend escalation to the
  science chair. The `science/goodall` agent covers Jane Goodall's scientific
  methodology side; `nature-studies/goodall-nat` covers her field ethology side.
- **Geography Department** (`geography`) — Biogeography and habitat mapping use
  skills from `geography` when the question is primarily spatial. The
  `geography/humboldt` agent covers Humboldt's geographical synthesis;
  `nature-studies/von-humboldt-nat` covers his naturalist and species-assemblage
  contributions.
- **Environmental Department** (`environmental`) — Conservation, climate, and
  policy questions escalate to `environmental`. Nature studies supplies the
  observational evidence; environmental supplies the stewardship framing.
- **Art Department** (`art`) — Natural history illustration is a shared
  tradition. Merian and Audubon sit at the boundary; their nature-studies role
  is observation, their art-department analogues would focus on technique.

These relationships are intentional and non-exclusive. The department template
pattern allows multiple departments to cover overlapping ground from different
angles without stepping on each other, which is how a real university structures
interdisciplinary knowledge.
