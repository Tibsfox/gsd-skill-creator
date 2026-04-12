---
name: art-department
type: chipset
category: chipset
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-11
first_path: examples/chipsets/art-department/README.md
description: >
  Coordinated art department -- seven named agents, six knowledge
  skills, three teams. 14th instantiation of the department template pattern.
superseded_by: null
---

# Art Department

## 1. What is the Art Department?

The Art Department chipset is a coordinated set of specialist agents, domain
skills, and pre-composed teams that together provide structured visual arts
support across observational drawing, color theory, sculpture, digital art, art
history, and creative process. It is the 14th instantiation of the "department
template pattern" in gsd-skill-creator, forked from the math-department reference
implementation and remapped to visual arts education. Incoming requests are
classified by a router agent (Leonardo), dispatched to the appropriate
specialist, and all work products are persisted as Grove records linked to the
college art department concept graph.

## 2. Quick Start

Install the chipset into your gsd-skill-creator project:

```bash
# From the gsd-skill-creator root
cp -r examples/chipsets/art-department .claude/chipsets/art-department
```

The chipset is activated when any of the six skill trigger patterns match an
incoming query. Leonardo (the router agent) classifies the query domain and
dispatches to the appropriate specialist agent. No explicit activation command
is needed -- the skill-integration layer loads the chipset based on context.

To verify the chipset is recognized:

```bash
# Check that the YAML parses cleanly
node -e "const yaml = require('yaml'); const fs = require('fs'); \
  console.log(yaml.parse(fs.readFileSync('.claude/chipsets/art-department/chipset.yaml', 'utf8')).name)"
# Expected output: art-department-v1.0
```

## 3. Agent Roster

Seven agents form the department. Three run on Opus (for tasks requiring deep
interpretive reasoning), four on Sonnet (for throughput-oriented analysis and
pedagogy).

| Name       | Historical Figure          | Role                                           | Model  | Tools                        |
|------------|----------------------------|-------------------------------------------------|--------|------------------------------|
| leonardo   | Leonardo da Vinci          | Department chair -- classification, routing, synthesis | opus   | Read, Glob, Grep, Bash, Write |
| kahlo      | Frida Kahlo                | Expression specialist -- identity, symbolism, cultural context | opus   | Read, Grep, Bash             |
| okeefe     | Georgia O'Keeffe           | Observation specialist -- sustained looking, abstraction from nature | opus   | Read, Grep, Write            |
| hokusai    | Katsushika Hokusai         | Composition specialist -- spatial organization, design, printmaking | sonnet | Read, Bash                   |
| ai-weiwei  | Ai Weiwei                  | Contemporary specialist -- conceptual art, installation, social practice | sonnet | Read, Bash                |
| albers     | Josef Albers               | Color specialist -- color relationships, design, systematic investigation | sonnet | Read, Bash                |
| lowenfeld  | Viktor Lowenfeld           | Pedagogy guide -- developmental stages, critique, learning paths | sonnet | Read, Write                |

Leonardo is the CAPCOM (single point of contact for the user). All other agents
receive dispatched subtasks and return results through Leonardo.

## 4. Skill Inventory

Six skills provide domain knowledge that agents draw on during execution.

| Skill                  | Domain | Trigger Patterns                                               | Agent Affinity      |
|------------------------|--------|----------------------------------------------------------------|---------------------|
| drawing-observation    | art    | draw, sketch, contour, gesture drawing, proportion, observation, negative space | okeefe, lowenfeld   |
| color-theory           | art    | color, palette, hue, warm cool, saturation, complementary, value | albers, okeefe      |
| sculpture-3d           | art    | sculpture, clay, carve, cast, 3D, installation, assemblage     | leonardo, ai-weiwei |
| digital-art            | art    | digital, Photoshop, Procreate, vector, 3D modeling, pixel art, generative, shader | hokusai, albers |
| art-history-movements  | art    | art history, movement, Renaissance, Impressionism, Expressionism, contemporary art, influenced by, art period | kahlo, ai-weiwei |
| creative-process       | art    | creative process, critique, portfolio, artist statement, sketchbook, brainstorm, studio practice | lowenfeld, kahlo |

Agent affinity means the skill's content is preferentially loaded into the
listed agent's context. Multiple affinities mean the skill is relevant to
more than one specialist.

## 5. Team Configurations

Teams are pre-composed agent groups for common problem shapes.

| Team                  | Agents                                                      | Use When                                        |
|-----------------------|-------------------------------------------------------------|-------------------------------------------------|
| art-critique-team     | leonardo, kahlo, hokusai, okeefe, ai-weiwei, albers, lowenfeld | Multi-domain analysis, comprehensive critique, research-level questions |
| studio-team           | okeefe, hokusai, kahlo, lowenfeld                           | Guided studio projects, observational drawing, hands-on art-making |
| exhibition-team       | ai-weiwei, leonardo, albers, lowenfeld                      | Exhibition design, installation planning, curatorial statements |

**art-critique-team** is the full department. Use it for artworks or problems that
span multiple art domains or require the broadest possible critical perspective.

**studio-team** pairs the observation specialist (O'Keeffe) with the composition
guide (Hokusai), expression guide (Kahlo), and pedagogy facilitator (Lowenfeld).
Use it when the primary goal is hands-on art-making with guided instruction.

**exhibition-team** is the curatorial pipeline. Ai Weiwei frames the concept,
Leonardo coordinates artwork selection and sequencing, Albers handles visual
design, and Lowenfeld ensures the exhibition communicates to its audience.

## 6. Grove Record Types

All department work products are persisted as Grove records under the
`art-department` namespace. Five record types are defined:

| Record Type      | Produced By                    | Key Fields                                           |
|------------------|--------------------------------|------------------------------------------------------|
| ArtAnalysis      | kahlo, okeefe, albers, ai-weiwei | artwork, domain, analysis (symbolism, color, context), concept IDs |
| ArtComposition   | hokusai                        | artwork, structure, focal point, eye path, principles applied |
| ArtCritique      | kahlo, ai-weiwei, lowenfeld   | artwork, four-step protocol (describe, analyze, interpret, evaluate) |
| ArtExplanation   | lowenfeld                      | topic, target level, explanation body, analogies, prerequisites |
| ArtSession       | leonardo                       | session ID, queries, dispatches, work product links, timestamps |

Records are content-addressed and immutable once written. ArtSession records
link all work products from a single interaction, providing an audit trail from
query to result.

## 7. College Integration

The chipset connects to the college art department concept graph:

- **Concept graph read/write**: Agents can read existing concept definitions and
  write new ones when a topic is encountered that the graph does not yet cover.
- **ArtSession generation**: When an ArtExplanation is produced, the chipset can
  automatically generate an ArtSession (interactive practice exercise) based on
  the explanation content and the learner's current position in the concept graph.
- **Learning pathway updates**: Completed analyses, studio sessions, and
  explanations update the learner's progress along college-defined pathways.
- **Five wings** map to the college art department structure:
  1. Seeing & Drawing
  2. Color, Value & Composition
  3. Materials & Making
  4. Art in Context
  5. Creative Process & Portfolio

Each skill and Grove record type aligns to one or more wings, so work products
are automatically filed into the correct part of the concept graph.

## 8. Customization Guide

The art department follows the same department template pattern as the math
department (the reference implementation). To create a department for another
domain, follow the steps in the math-department README Section 8.

### Key remapping points for the art department

- **Agent names** derive from historical artists and art educators rather than
  mathematicians. Any domain with identifiable historical figures works.
- **Skills** cover the five wings of the college art department. Replace with
  the target domain's wings.
- **Grove record types** reflect art-specific outputs (analysis, composition,
  critique). Replace with domain-appropriate types.
- **Model assignment** follows interpretive depth: agents requiring deep
  reasoning about meaning, expression, and observation get Opus. Agents with
  well-bounded analytical tasks get Sonnet.

## 9. Architecture Notes

### Why these seven agents

The seven agents cover the five wings of the college art department plus two
cross-cutting concerns (expression/identity and contemporary practice):

| Wing | Primary agent(s) | Cross-cutting |
|------|-------------------|---------------|
| Seeing & Drawing | O'Keeffe | Leonardo (observation as foundation) |
| Color, Value & Composition | Albers, Hokusai | -- |
| Materials & Making | Leonardo, Hokusai | Ai Weiwei (installation) |
| Art in Context | Kahlo, Ai Weiwei | -- |
| Creative Process & Portfolio | Lowenfeld | Kahlo (artist statement, identity) |

### Why 3 Opus / 4 Sonnet

Model assignment follows the reasoning depth required by each role:

- **Opus agents** (leonardo, kahlo, okeefe): These roles require the deepest
  interpretive reasoning. Routing and synthesis (Leonardo) must understand all
  six domains well enough to classify correctly. Expression analysis (Kahlo) and
  observation-to-abstraction (O'Keeffe) require nuanced, multi-layered
  interpretation where errors in reading compound.
- **Sonnet agents** (hokusai, ai-weiwei, albers, lowenfeld): These roles have
  well-defined analytical frameworks. Compositional analysis (Hokusai), color
  theory (Albers), contemporary art concepts (Ai Weiwei), and pedagogical
  scaffolding (Lowenfeld) benefit from fast turnaround. Sonnet's speed matters
  more than its depth ceiling for these tasks.

### Why this team structure

The three teams cover the three most common art education scenarios:

- **Full critique**: needs every perspective (all 7 agents)
- **Studio practice**: needs the making-oriented core (4 agents, no exhibition/contemporary focus)
- **Exhibition**: needs the curatorial-presentation pipeline (4 agents, no studio-making focus)

Teams are not exclusive. Leonardo can assemble ad-hoc groups for queries that
do not fit any pre-composed team.

### CAPCOM boundary

The CAPCOM (Capsule Communicator) pattern means only Leonardo speaks to the
user. Other agents communicate through Leonardo via internal dispatch. This is
enforced by the `is_capcom: true` flag -- only one agent in the chipset may
carry this flag.

### Relationship to other departments

The art department intersects with several other college departments:

- **Mathematics**: Geometry, proportion, perspective (shared with Euclid/Euler).
  Leonardo bridges this -- he is both artist and geometer.
- **History**: Art-historical context overlaps with political and cultural history.
  Kahlo and Ai Weiwei bridge this connection.
- **Philosophy**: Aesthetics, the philosophy of art, and the nature of beauty.
  Not directly covered; future cross-department routing may add this.
- **Music**: Shared concepts of rhythm, harmony, composition, and creative
  process. Cross-department skills could formalize these parallels.

## 10. Historical Figures -- Quick Reference

| Agent | Figure | Dates | Key contribution | Famous for |
|-------|--------|-------|------------------|------------|
| leonardo | Leonardo da Vinci | 1452--1519 | Renaissance polymath; observation as foundation | Mona Lisa, Last Supper, Vitruvian Man, 13,000 pages of notebooks |
| kahlo | Frida Kahlo | 1907--1954 | Self-portraiture as autobiography; pain and identity as subject | 55 self-portraits, The Two Fridas, Mexican cultural symbolism |
| hokusai | Katsushika Hokusai | 1760--1849 | Compositional mastery; 30,000 works across 70 years | The Great Wave, Thirty-six Views of Mount Fuji |
| okeefe | Georgia O'Keeffe | 1887--1986 | Observation-to-abstraction; seeing the extraordinary in the ordinary | Large-scale flower paintings, New Mexico landscapes, bones and sky |
| ai-weiwei | Ai Weiwei | 1957-- | Art as activism; installation at massive scale with conceptual precision | Sunflower Seeds, Remembering, Bird's Nest stadium |
| albers | Josef Albers | 1888--1976 | Color relativity; systematic visual investigation | Interaction of Color, Homage to the Square series, Bauhaus teaching |
| lowenfeld | Viktor Lowenfeld | 1903--1960 | Developmental stages of artistic growth; art education as human development | Creative and Mental Growth, Penn State art education program |
