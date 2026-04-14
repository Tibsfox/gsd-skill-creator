---
name: environmental-department
type: chipset
category: chipset
status: stable
origin: tibsfox
first_seen: 2026-04-12
description: >
  Coordinated environmental department — seven named agents, six knowledge
  skills, three teams. Department-template instantiation covering ecology,
  Earth systems, human impacts, climate, sustainability, and environmental
  justice.
---

# Environmental Department

## 1. What is the Environmental Department?

The Environmental Department chipset is a coordinated set of reasoning agents,
domain skills, and pre-composed teams that together provide structured
environmental science support across ecosystems and biodiversity, Earth
systems and biogeochemistry, human impacts and pollution, climate science,
sustainability design, and environmental justice. It is an instantiation of
the "department template pattern" forked from the math-department reference:
a chipset architecture designed to be replicated and remapped for any domain
that benefits from multi-specialist coordination. Incoming requests are
classified by a router agent (Carson), dispatched to the appropriate
specialist, and all work products are persisted as Grove records linked to
the college environmental department concept graph.

## 2. Quick Start

Install the chipset into your gsd-skill-creator project:

```bash
# From the gsd-skill-creator root
cp -r examples/chipsets/environmental-department .claude/chipsets/environmental-department
```

The chipset is activated when any of the six skill trigger patterns match an
incoming query. Carson (the router agent) classifies the query domain and
dispatches to the appropriate specialist agent. No explicit activation
command is needed — the skill-integration layer loads the chipset based on
context.

To verify the chipset is recognized:

```bash
# Check that the YAML parses cleanly
node -e "const yaml = require('yaml'); const fs = require('fs'); \
  console.log(yaml.parse(fs.readFileSync('.claude/chipsets/environmental-department/chipset.yaml', 'utf8')).name)"
# Expected output: environmental-department-v1.0
```

## 3. Agent Roster

Seven agents form the department. Three run on Opus (for tasks requiring
deep reasoning and contested judgment), four on Sonnet (for throughput-
oriented analysis, reference work, systems checking, and pedagogy).

| Name     | Historical Figure   | Role                                                               | Model  | Tools                         |
|----------|---------------------|--------------------------------------------------------------------|--------|-------------------------------|
| carson   | Rachel Carson       | Department chair — classification, routing, synthesis              | opus   | Read, Glob, Grep, Bash, Write |
| leopold  | Aldo Leopold        | Ecosystems and land ethic — community ecology, biodiversity        | opus   | Read, Grep, Bash              |
| shiva    | Vandana Shiva       | Biodiversity, agroecology, and justice — agricultural systems      | opus   | Read, Grep, Bash              |
| muir     | John Muir           | Wilderness and reference state — protected areas, baselines        | sonnet | Read, Grep, Bash              |
| wangari  | Wangari Maathai     | Community restoration and organizing — grassroots implementation   | sonnet | Read, Grep, Bash              |
| commoner | Barry Commoner      | Systems and biogeochemistry — cycles, mass balance, feedbacks      | sonnet | Read, Grep, Bash              |
| orr      | David W. Orr        | Pedagogy and ecological literacy — explanations, lessons, pathways | sonnet | Read, Write                   |

Carson is the CAPCOM (single point of contact for the user). All other
agents receive dispatched subtasks and return results through Carson.

## 4. Skill Inventory

Six skills provide domain knowledge that agents draw on during execution.

| Skill                    | Domain        | Trigger Patterns                                                                            | Agent Affinity      |
|--------------------------|---------------|---------------------------------------------------------------------------------------------|---------------------|
| ecosystem-dynamics       | environmental | food web, ecosystem, biodiversity, trophic, succession, keystone species, carrying capacity | leopold, muir       |
| biogeochemical-cycles    | environmental | carbon cycle, nitrogen cycle, water cycle, phosphorus, ocean acidification, eutrophication  | commoner            |
| human-impact-assessment  | environmental | pollution, impact assessment, habitat loss, invasive species, ecological footprint, EIA     | carson, commoner    |
| climate-science          | environmental | climate change, greenhouse effect, radiative forcing, climate sensitivity, IPCC             | commoner            |
| sustainability-design    | environmental | renewable, sustainable, conservation, lifecycle, permaculture, rewilding, circular economy  | shiva, wangari      |
| environmental-justice    | environmental | environmental justice, disparate impact, indigenous rights, climate justice, just transition | shiva, wangari     |

Agent affinity means the skill's content is preferentially loaded into the
listed agent's context. Multiple affinities mean the skill is relevant to
more than one specialist.

## 5. Team Configurations

Teams are pre-composed agent groups for common problem shapes.

| Team                          | Agents                                                       | Use When                                                        |
|-------------------------------|--------------------------------------------------------------|-----------------------------------------------------------------|
| environmental-analysis-team   | carson, leopold, shiva, muir, wangari, commoner, orr         | Multi-wing, research-level, or full-analysis requests           |
| environmental-workshop-team   | leopold, muir, commoner, orr                                 | Ecosystem diagnosis, reference-state assessment, conservation   |
| environmental-practice-team   | wangari, shiva, commoner, orr                                | Restoration program design, community intervention, implementation |

**environmental-analysis-team** is the full department. Use it for problems
that span multiple environmental wings or require the broadest possible
expertise. Carson classifies the query, dispatches relevant specialists in
parallel, synthesizes their independent findings, and Orr wraps the result
at the target audience level.

**environmental-workshop-team** pairs the ecologist (Leopold) with the
reference-state specialist (Muir), the biogeochemical systems specialist
(Commoner), and the pedagogy agent (Orr). Use it when the primary goal is
diagnosing an ecosystem, comparing current state to reference conditions,
or evaluating conservation strategy.

**environmental-practice-team** is the implementation pipeline. Shiva
supplies system and agroecological context, Wangari designs the
community-scale intervention, Commoner runs systems feasibility and mass
balance checks, and Orr produces training and community materials. Use it
when the question has shifted from "what is happening" to "what should we
do and how do we do it."

## 6. Grove Record Types

All department work products are persisted as Grove records under the
`environmental-department` namespace. Five record types are defined:

| Record Type              | Produced By                          | Key Fields                                                             |
|--------------------------|--------------------------------------|------------------------------------------------------------------------|
| EnvironmentalAnalysis    | leopold, shiva, commoner             | subject, analysis type, findings, confidence, evidence                 |
| EnvironmentalAssessment  | muir, wangari                        | reference condition, current state, program design, monitoring plan    |
| EnvironmentalReview      | carson, shiva                        | subject, review type, distributional framing, ecological framing       |
| EnvironmentalExplanation | orr                                  | subject, target level, explanation body, concepts, follow-up questions |
| EnvironmentalSession     | carson                               | session ID, query, classification, agents invoked, work product links  |

Records are content-addressed and immutable once written. EnvironmentalSession
records link all work products from a single interaction, providing an audit
trail from query to result.

## 7. College Integration

The chipset connects to the college environmental department concept graph:

- **Concept graph read/write**: Agents can read existing concept definitions
  and write new ones when a topic is encountered that the graph does not yet
  cover.
- **Try Session generation**: When an EnvironmentalExplanation is produced,
  the chipset can automatically generate a Try Session based on the
  explanation content and the learner's current position in the concept graph.
- **Learning pathway updates**: Completed analyses, assessments, and
  explanations update the learner's progress along college-defined pathways.
- **Five wings** map to the college environmental department structure:
  1. Ecosystems & Biodiversity
  2. Earth Systems
  3. Human Impacts
  4. Climate Science
  5. Sustainability & Solutions

Each skill and Grove record type aligns to one or more wings, so work
products are automatically filed into the correct part of the concept graph.

## 8. Customization Guide

The environmental department is a fork of the math-department reference
implementation. To create a department for another domain, follow these
steps:

### Step 1: Copy the chipset directory

```bash
cp -r examples/chipsets/environmental-department examples/chipsets/my-department
```

### Step 2: Rename agents

Edit `chipset.yaml` and replace agent names, roles, and historical figure
references. Pick seven figures whose work covers the domain's principal
wings, and assign each a focused role.

### Step 3: Replace skills with domain-appropriate content

Swap the six environmental skills for equivalents in the new domain. Each
skill needs:
- A `domain` value (e.g., `urban-planning`, `public-health`)
- A `description` summarizing what the skill covers
- A `triggers` list of natural language patterns that activate the skill
- An `agent_affinity` mapping to the renamed agents

### Step 4: Define new Grove record types

Replace the five `EnvironmentalX` record types with domain-appropriate
types. Each type should describe the fields that agents produce.

### Step 5: Map to the target college department

Update the `college` section:
- Set `department` to the target
- Define wings that match the college department structure
- Decide whether `concept_graph.write` should be enabled (some departments
  may want read-only access to avoid unreviewed graph mutations)

### Step 6: Update evaluation gates

Review the `evaluation.gates` section. The five default gates are generic
enough for most departments, but you may want to add domain-specific checks.
Update `benchmark.domains_covered` to list the new domain areas.

## 9. Architecture Notes

### Why router topology

The router topology places a single agent (Carson) as the entry point for
all queries. This provides three benefits:

1. **Classification**: Carson determines which wings a query touches before
   dispatching, preventing wasted work by non-relevant agents. Environmental
   queries often straddle wings (a watershed nitrate problem is
   biogeochemistry *and* agriculture *and* justice simultaneously), so
   careful classification is the difference between useful and scattered
   responses.
2. **Synthesis**: For multi-wing queries, Carson collects independent
   findings from multiple specialists and synthesizes a unified response
   that credits each voice and preserves productive disagreement.
3. **CAPCOM boundary**: The user interacts with exactly one agent. This
   reduces cognitive load and provides a consistent communication style.

Alternative topologies (mesh, pipeline, broadcast) are possible, but the
router pattern best fits the department metaphor: a community member talks
to the department office, which routes them to the right specialist.

### Why 3 Opus / 4 Sonnet

Model assignment follows the reasoning depth required by each role:

- **Opus agents** (carson, leopold, shiva): These roles require the deepest
  reasoning. Routing and synthesis (Carson) must understand all six wings
  well enough to classify correctly and reconcile contested findings.
  Community ecology and land-ethic framing (Leopold) and
  biodiversity/agroecology with explicit distributional analysis (Shiva)
  involve contested science and value-laden judgment where errors compound.
- **Sonnet agents** (muir, wangari, commoner, orr): These roles are
  throughput-oriented. Reference-state characterization, community
  implementation design, biogeochemical mass balance, and pedagogical
  explanation are structured tasks that benefit from fast turnaround.
  Sonnet's speed matters more than its depth ceiling here.

This 3/4 split keeps the token budget practical while preserving quality
where it matters most — and matches the math-department split exactly,
making the two departments cost-comparable.

### Why this team structure

The three teams cover the three most common query shapes for environmental
work:

- **Full investigation**: needs every perspective (all 7 agents). Research
  questions, policy reviews, multi-wing synthesis.
- **Workshop**: needs the ecosystem core (4 agents — lead ecologist,
  reference specialist, systems cross-check, pedagogy). Diagnosis and
  reference comparison with a teaching-ready output.
- **Practice**: needs the implementation pipeline (4 agents — agroecology
  context, community design, systems feasibility, training materials).
  Turns established science into community-ready action.

Teams are not exclusive. Carson can assemble ad-hoc groups for queries
that do not fit any pre-composed team.

### CAPCOM boundary

The CAPCOM (Capsule Communicator) pattern means only Carson speaks to the
user. Other agents communicate through Carson via internal dispatch. This
is enforced by the `is_capcom: true` flag — only one agent in the chipset
may carry this flag, and a pre-deploy gate verifies that the router agent
is that agent.

## 10. Relationship to Other Departments

The environmental department is designed to interoperate with other
department chipsets:

- **Math Department**: Environmental work often requires quantitative
  support — biogeochemical mass balance, population dynamics, climate
  sensitivity calculations. Commoner's systems work and Leopold's community
  ecology can dispatch numerical sub-problems to the math department's
  Euler (analysis) or Gauss (computation) agents.
- **Statistics Department**: Environmental data analysis — trend detection,
  spatial autocorrelation, hypothesis testing on monitoring data — can be
  routed to the statistics department when a specialist run is appropriate.
- **Math Co-Processor**: Large-scale numerical tasks (matrix operations on
  ecosystem networks, FFT on time-series climate data) can be handed to
  the math co-processor's GPU-accelerated chips.

These cross-department dispatches are not formalized yet in the chipset
YAML; they currently happen by Carson recognizing that a query has left
environmental territory and routing appropriately. A future revision may
add an explicit `federates_with` field.

The separation of concerns follows the university model: a professor in
environmental science decides what to investigate, calls on colleagues in
other departments when specialist expertise is needed, and remains
responsible for synthesizing the answer for their student.
