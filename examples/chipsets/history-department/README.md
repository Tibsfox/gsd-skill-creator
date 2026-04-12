---
name: history-department
type: chipset
category: chipset
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/chipsets/history-department/README.md
description: >
  Coordinated history department -- seven named agents, six knowledge
  skills, three teams. Second instantiation of the department template pattern.
superseded_by: null
---

# History Department

## 1. What is the History Department?

The History Department chipset is a coordinated set of reasoning agents, domain
skills, and pre-composed teams that together provide structured historical
analysis across source critique, causal reasoning, structural history, narrative
construction, multiperspective interpretation, and pedagogical explanation. It
is the second instantiation of the "department template pattern" in
gsd-skill-creator, forked from the math-department reference implementation and
remapped to the historical domain. Incoming requests are classified by a router
agent (Herodotus), dispatched to the appropriate specialist, and all work
products are persisted as Grove records linked to the college concept graph.

## 2. Quick Start

Install the chipset into your gsd-skill-creator project:

```bash
# From the gsd-skill-creator root
cp -r examples/chipsets/history-department .claude/chipsets/history-department
```

The chipset is activated when any of the six skill trigger patterns match an
incoming query. Herodotus (the router agent) classifies the query by period,
geography, and analytical framework, then dispatches to the appropriate
specialist agent. No explicit activation command is needed -- the
skill-integration layer loads the chipset based on context.

To verify the chipset is recognized:

```bash
# Check that the YAML parses cleanly
node -e "const yaml = require('yaml'); const fs = require('fs'); \
  console.log(yaml.parse(fs.readFileSync('.claude/chipsets/history-department/chipset.yaml', 'utf8')).name)"
# Expected output: history-department-v1.0
```

## 3. Agent Roster

Seven agents form the department. Three run on Opus (for tasks requiring deep
reasoning across long temporal arcs), four on Sonnet (for throughput-oriented
analysis and pedagogy).

| Name         | Historical Figure            | Role                                                               | Model  | Tools                        |
|--------------|------------------------------|--------------------------------------------------------------------|--------|------------------------------|
| herodotus    | Herodotus of Halicarnassus   | Department chair -- classification, routing, synthesis, historiographical framing | opus   | Read, Glob, Grep, Bash, Write |
| ibn-khaldun  | Ibn Khaldun                  | Social-economic analyst -- asabiyyah cycles, trade networks, material conditions  | opus   | Read, Grep, Bash             |
| arendt       | Hannah Arendt                | Political-modern analyst -- political theory, totalitarianism, power structures   | sonnet | Read, Grep                   |
| braudel      | Fernand Braudel              | Longue duree analyst -- multi-temporal analysis, geographic determinism           | opus   | Read, Grep, Bash             |
| tuchman      | Barbara Tuchman              | Narrative-military specialist -- narrative construction, military history          | sonnet | Read, Bash                   |
| zinn         | Howard Zinn                  | People's-social historian -- bottom-up history, labor, marginalized voices        | sonnet | Read, Grep                   |
| montessori   | Maria Montessori             | Pedagogy guide -- concept scaffolding, learning pathways, level-appropriate explanation | sonnet | Read, Write            |

Herodotus is the CAPCOM (single point of contact for the user). All other agents
receive dispatched subtasks and return results through Herodotus.

## 4. Skill Inventory

Six skills provide domain knowledge that agents draw on during execution.

| Skill                    | Domain  | Trigger Patterns                                                                       | Agent Affinity          |
|--------------------------|---------|----------------------------------------------------------------------------------------|-------------------------|
| source-analysis          | history | analyze this source, primary source, document analysis, source critique, who wrote this, reliability, provenance, bias in | herodotus, arendt       |
| causation-consequence    | history | why did, what caused, consequence of, led to, result of, because of, counterfactual, what if | ibn-khaldun, braudel    |
| continuity-change        | history | change over time, continuity, turning point, periodization, longue duree, transformation, evolution of, remained the same | braudel, ibn-khaldun    |
| historical-perspectives  | history | perspective, point of view, how did X experience, from the perspective of, marginalized, subaltern, bottom-up, people's history | zinn, arendt            |
| historiography           | history | historiography, Annales school, historical method, how have historians, interpretation of, revisionist, school of thought, methodology | herodotus, braudel      |
| oral-history             | history | oral history, oral tradition, testimony, memory, remembrance, interview, living memory, eyewitness | zinn, montessori        |

Agent affinity means the skill's content is preferentially loaded into the
listed agent's context. Multiple affinities mean the skill is relevant to
more than one specialist.

## 5. Team Configurations

Teams are pre-composed agent groups for common problem shapes.

| Team                    | Agents                                                      | Use When                                               |
|-------------------------|-------------------------------------------------------------|--------------------------------------------------------|
| history-seminar-team    | herodotus, ibn-khaldun, arendt, braudel, tuchman, zinn, montessori | Multi-period, multi-perspective, research-level, or full-analysis requests |
| source-workshop-team    | herodotus, arendt, zinn, montessori                         | Primary source analysis, document critique, evidence evaluation |
| narrative-team          | tuchman, braudel, ibn-khaldun, montessori                   | Narrative history writing, longue duree analysis, campaign narratives |

**history-seminar-team** is the full department. Use it for problems that
span multiple periods, geographies, or analytical frameworks and require the
broadest possible expertise. Analogous to `math-investigation-team`.

**source-workshop-team** pairs the department chair (Herodotus) with the
political reader (Arendt), the silence analyst (Zinn), and the pedagogy guide
(Montessori). Use it when the primary goal is analyzing, evaluating, or
teaching primary source critique. Analogous to `proof-workshop-team`.

**narrative-team** is the storytelling pipeline. Tuchman designs the narrative
architecture, Braudel and Ibn-Khaldun provide the structural substrate,
and Montessori ensures the narrative teaches. Analogous to `discovery-team`.

## 6. Grove Record Types

All department work products are persisted as Grove records under the
`history-department` namespace. Five record types are defined:

| Record Type           | Produced By                    | Key Fields                                                         |
|-----------------------|--------------------------------|--------------------------------------------------------------------|
| HistoricalAnalysis    | ibn-khaldun, braudel, arendt, zinn | period, geography, analytical framework, evidence, thesis, sources |
| HistoricalNarrative   | tuchman                        | story arc, temporal layers, scenes, source citations, structural analyses |
| SourceCritique        | herodotus, arendt, zinn        | source type, provenance, reliability, bias, political reading, silence reading |
| HistoricalExplanation | montessori                     | target level, key concepts, explanation body, method instruction, practice suggestions |
| HistorySession        | herodotus                      | session ID, queries, dispatches, work product links, timestamps    |

Records are content-addressed and immutable once written. HistorySession records
link all work products from a single interaction, providing an audit trail from
query to result.

## 7. College Integration

The chipset connects to the college history department concept graph:

- **Concept graph read/write**: Agents can read existing concept definitions and
  write new ones when a topic is encountered that the graph does not yet cover.
- **Try Session generation**: When a HistoricalExplanation is produced, the chipset
  can automatically generate a Try Session (interactive practice) based on the
  explanation content and the learner's current position in the concept graph.
- **Learning pathway updates**: Completed analyses, narratives, and source critiques
  update the learner's progress along college-defined pathways.
- **Five wings** map to the college history department structure:
  1. Ancient & Classical Worlds
  2. Medieval & Early Modern
  3. Revolution & Nation-Building
  4. Empire, Colonialism & Resistance
  5. Modern & Contemporary

- **Twenty concepts** span the five wings (4 per wing):

  | Wing                              | Concepts                                                                      |
  |-----------------------------------|-------------------------------------------------------------------------------|
  | Ancient & Classical Worlds        | River Valley Civilizations, Classical Empires & Governance, Trade Routes & Cultural Exchange, Religion & Philosophical Traditions |
  | Medieval & Early Modern           | Feudalism & Manorialism, Crusades Contact & Conflict, Renaissance & Reformation, Exploration & Early Globalization |
  | Revolution & Nation-Building      | Enlightenment & Political Revolution, Industrial Revolution & Urbanization, Nationalism & State Formation, Abolition & Emancipation Movements |
  | Empire, Colonialism & Resistance  | Imperialism & Colonial Systems, Anti-Colonial Movements & Decolonization, Slavery Forced Labor & Resistance, Indigenous Histories & Survivance |
  | Modern & Contemporary             | World Wars & Totalitarianism, Cold War & Decolonization, Civil Rights & Social Movements, Globalization & the Digital Age |

Each skill and Grove record type aligns to one or more wings, so work products
are automatically filed into the correct part of the concept graph.

## 8. Customization Guide

The history department demonstrates the department template pattern applied to
a humanities domain. To create a department for another humanities or social
science discipline, follow these steps:

### Step 1: Copy the chipset directory

```bash
cp -r examples/chipsets/history-department examples/chipsets/political-science-department
```

### Step 2: Rename agents

Edit `chipset.yaml` and replace agent names, roles, and historical figure
references. For a political science department you might use: aristotle
(router/chair), machiavelli (realpolitik/statecraft), locke (liberalism/rights),
marx (political economy/class), beauvoir (feminist theory/gender), fanon
(postcolonial/liberation), dewey (civic education/pedagogy). Also rename any
corresponding agent directories if your project uses per-agent config files.

### Step 3: Replace skills with domain-appropriate content

Swap the six history skills for political science equivalents. Each skill needs:
- A `domain` value (e.g., `political-science`)
- A `description` summarizing what the skill covers
- A `triggers` list of natural language patterns that activate the skill
- An `agent_affinity` mapping to the renamed agents

### Step 4: Define new Grove record types

Replace the five `HistoricalX` / `HistoryX` record types with domain-appropriate
types. A political science department might use: PolicyAnalysis, ComparativeStudy,
TheoreticalFramework, PoliticalExplanation, PolSciSession. Each type should
describe the fields that agents produce.

### Step 5: Map to the target college department

Update the `college` section:
- Set `department` to the target (e.g., `political-science`)
- Define wings that match the college department structure
- Define 20 concepts spanning the wings
- Decide whether `concept_graph.write` should be enabled (some departments
  may want read-only access to avoid unreviewed graph mutations)

### Step 6: Update evaluation gates

Review the `evaluation.gates` section. The five default gates are generic
enough for most departments, but you may want to add domain-specific checks
(e.g., "all policy analyses must declare a jurisdiction field").

Update `benchmark.domains_covered` to list the new domain areas.

## 9. Architecture Notes

### Why router topology

The router topology places a single agent (Herodotus) as the entry point for all
queries. This provides three benefits:

1. **Classification**: Herodotus determines which period(s), geography, and
   analytical framework a query touches before dispatching, preventing wasted
   work by non-relevant agents.
2. **Synthesis**: For multi-perspective queries, Herodotus collects results from
   multiple specialists and synthesizes a unified multiperspective response.
3. **CAPCOM boundary**: The user interacts with exactly one agent. This reduces
   cognitive load and provides a consistent communication style.

Alternative topologies (mesh, pipeline, broadcast) are possible but the router
pattern best fits the department metaphor: students talk to the department
office, which routes them to the right professor.

### Why 3 Opus / 4 Sonnet

Model assignment follows the reasoning depth required by each role:

- **Opus agents** (herodotus, ibn-khaldun, braudel): These roles require the
  deepest reasoning. Routing and synthesis (Herodotus) must understand all six
  skill domains well enough to classify correctly. Social-economic cyclical
  analysis (Ibn-Khaldun) and longue duree structural analysis (Braudel) require
  holding multiple centuries of causal context simultaneously where errors in
  periodization or structural attribution compound.
- **Sonnet agents** (arendt, tuchman, zinn, montessori): These roles are
  throughput-oriented. Political reading, narrative construction, people's
  history, and pedagogical explanation benefit from fast turnaround. Sonnet's
  speed matters more than its depth ceiling for these tasks, which operate
  within well-defined analytical frameworks.

This 3/4 split keeps the token budget practical while preserving quality where
it matters most.

### Why this team structure

The three teams cover the three most common query shapes:

- **Full seminar**: needs every perspective (all 7 agents)
- **Source-focused**: needs the analytical core for document critique (4 agents,
  no narrative/structural)
- **Narrative**: needs the storytelling-structural pipeline (4 agents, no
  political theory / people's history as primary mode)

Teams are not exclusive. Herodotus can assemble ad-hoc groups for queries that
do not fit any pre-composed team.

### CAPCOM boundary

The CAPCOM (Capsule Communicator) pattern means only Herodotus speaks to the
user. Other agents communicate through Herodotus via internal dispatch. This is
enforced by the `is_capcom: true` flag -- only one agent in the chipset may
carry this flag.

### Why Herodotus as chair

Herodotus of Halicarnassus is called the "father of history" by Cicero. His
method -- traveling widely, collecting accounts from multiple sources, comparing
narratives, and presenting competing versions with critical commentary -- maps
directly onto the router/classifier/synthesizer role. He did not impose a single
analytical framework; he collected and juxtaposed them. This is exactly what the
department chair must do.

### Agent intellectual lineages

Each agent is named for a historian whose method defines the agent's analytical
approach:

- **Herodotus** (c. 484-425 BCE): Inquiry-based, comparative, source-collecting.
  The first historian to treat history as an investigation rather than a chronicle.
- **Ibn Khaldun** (1332-1406): Founder of social science. The Muqaddimah
  introduced cyclical theory of civilizational rise and fall driven by asabiyyah
  (social cohesion) and material conditions.
- **Hannah Arendt** (1906-1975): Political theorist. The Human Condition, The
  Origins of Totalitarianism, Eichmann in Jerusalem. Analysis of power, authority,
  violence, and the political dimension of human action.
- **Fernand Braudel** (1902-1985): Annales School. The Mediterranean and the
  Mediterranean World. Three temporal scales: event, conjuncture, longue duree.
  Geographic and economic structures as the deep grammar of history.
- **Barbara Tuchman** (1912-1989): Narrative historian. The Guns of August,
  A Distant Mirror. Rigorous research presented as compelling narrative with
  attention to contingency and human folly.
- **Howard Zinn** (1922-2010): A People's History of the United States.
  History from the perspective of the marginalized: workers, enslaved people,
  women, indigenous peoples. Challenges elite narratives.
- **Maria Montessori** (1870-1952): Educational theorist. The Montessori Method.
  Learner-centered pedagogy, scaffolded discovery, concrete-to-abstract
  progression.

## 10. Relationship to Other Departments

The history department and other college departments are complementary:

- **History + Political Science**: History provides the evidentiary base and
  narrative context that political science theorizes. Arendt bridges both
  domains -- her political reading of sources is historical method applied
  through a political-theoretical lens.
- **History + Mathematics**: Quantitative history (cliometrics, demographic
  modeling) can dispatch computational tasks to the math department's agents.
  Braudel's structural analysis sometimes benefits from statistical support.
- **History + Philosophy**: Historiographical method is a branch of epistemology.
  The philosophy department's agents can provide formal analysis of historical
  reasoning patterns when the history department encounters methodological
  questions.

Future integration could formalize cross-department dispatch by adding a
`department_dispatch` field to the chipset, allowing agents to request expertise
from other departments without the user needing to switch chipsets manually.

This separation of concerns follows the same pattern as a university's
interdepartmental structure: each department has its own faculty and methods,
but they collaborate through seminars, joint appointments, and
interdisciplinary programs.
