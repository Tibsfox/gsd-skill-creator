---
name: project-management-department
type: chipset
category: chipset
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-11
first_path: examples/chipsets/project-management-department/README.md
description: >
  Coordinated project management department — seven named agents, six knowledge
  skills, three teams. The meta-department that manages the process by which all
  other departments operate.
superseded_by: null
---

# Project Management Department

## 1. What is the Project Management Department?

The Project Management Department chipset is a coordinated set of process agents,
domain skills, and pre-composed teams that together provide structured project
management support across agile methods, risk management, stakeholder
communication, estimation and planning, quality assurance, and retrospective
learning. It is the fifth department in the college and the first
meta-department: rather than teaching a subject, it manages the process by which
all other departments operate. Incoming requests are classified by a router agent
(Brooks), dispatched to the appropriate specialist, and all work products are
persisted as Grove records linked to the college business department concept
graph.

This department occupies a unique position in the chipset ecosystem. Where the
math department reasons about mathematics and the physics department reasons
about physical systems, the project management department reasons about the work
itself — schedules, risks, quality gates, team dynamics, and process
improvement. GSD workflow commands map directly to PM skills, making this
department the bridge between the skill-creator infrastructure and the
disciplines it serves.

## 2. Quick Start

Install the chipset into your gsd-skill-creator project:

```bash
# From the gsd-skill-creator root
cp -r examples/chipsets/project-management-department .claude/chipsets/project-management-department
```

The chipset is activated when any of the six skill trigger patterns match an
incoming query. Brooks (the router agent) classifies the query domain and
dispatches to the appropriate specialist agent. No explicit activation command
is needed — the skill-integration layer loads the chipset based on context.

To verify the chipset is recognized:

```bash
# Check that the YAML parses cleanly
node -e "const yaml = require('yaml'); const fs = require('fs'); \
  console.log(yaml.parse(fs.readFileSync('.claude/chipsets/project-management-department/chipset.yaml', 'utf8')).name)"
# Expected output: project-management-department-v1.0
```

## 3. Agent Roster

Seven agents form the department. Three run on Opus (for tasks requiring deep
reasoning about systems, risk, and quality), four on Sonnet (for throughput-
oriented process facilitation and planning).

| Name       | Historical Figure               | Role                                                         | Model  | Tools                        |
|------------|---------------------------------|--------------------------------------------------------------|--------|------------------------------|
| brooks     | Frederick P. Brooks Jr.         | Department chair — classification, routing, synthesis         | opus   | Read, Glob, Grep, Bash, Write |
| hamilton   | Margaret Hamilton               | Systems and risk engineer — risk analysis, failure prevention | opus   | Read, Grep, Bash             |
| goldratt   | Eliyahu M. Goldratt             | Constraints analyst — bottleneck identification, throughput   | sonnet | Read, Bash                   |
| deming     | W. Edwards Deming               | Quality champion — process quality, continuous improvement    | opus   | Read, Grep, Bash             |
| lei        | Mary and Tom Poppendieck (Lean) | Agile coach — sprint facilitation, iterative delivery         | sonnet | Read, Bash                   |
| gantt      | Henry Gantt                     | Planning specialist — scheduling, estimation, critical path   | sonnet | Read, Bash, Write            |
| sinek      | Simon Sinek                     | Pedagogy and communication — stakeholder alignment, motivation| sonnet | Read, Write                  |

Brooks is the CAPCOM (single point of contact for the user). All other agents
receive dispatched subtasks and return results through Brooks.

### Why these names

Each agent is named for a figure whose work defines the skill they embody:

- **Brooks** — author of *The Mythical Man-Month*, the foundational text on
  software project management. His insight that adding people to a late project
  makes it later is the department's first principle.
- **Hamilton** — lead software engineer for NASA Apollo, pioneer of systems
  engineering and error-prevention discipline. She coined the term "software
  engineering" itself.
- **Goldratt** — creator of the Theory of Constraints and author of *The Goal*.
  Every project has a bottleneck; Goldratt finds it.
- **Deming** — father of modern quality management. His 14 Points and Plan-Do-
  Check-Act cycle underpin every quality gate in the department.
- **Lei** — represents the Lean/Agile synthesis (Poppendieck, Ohno, the Toyota
  Production System lineage). Agile is Lean applied to knowledge work.
- **Gantt** — inventor of the Gantt chart, still the most widely used project
  visualization tool after more than a century.
- **Sinek** — author of *Start with Why*, whose work on leadership communication
  and purpose-driven teams maps directly to stakeholder alignment.

## 4. Skill Inventory

Six skills provide domain knowledge that agents draw on during execution.

| Skill                     | Domain              | Trigger Patterns                                                              | Agent Affinity    |
|---------------------------|---------------------|-------------------------------------------------------------------------------|-------------------|
| agile-methods             | project-management  | sprint, standup, backlog, user story, kanban, agile, scrum, velocity          | lei               |
| risk-management           | project-management  | risk, mitigation, contingency, risk register, failure mode, impact analysis, threat | hamilton      |
| stakeholder-communication | project-management  | stakeholder, status report, communication plan, escalation, RACI, steering committee, sponsor | sinek, brooks |
| estimation-planning       | project-management  | estimate, schedule, work breakdown, WBS, critical path, Gantt chart, milestone, deadline, planning poker | gantt |
| quality-assurance         | project-management  | quality, acceptance criteria, definition of done, test plan, inspection, audit, defect, six sigma | deming |
| retrospective-learning    | project-management  | retrospective, post-mortem, lessons learned, root cause, 5 whys, kaizen, improvement, what went well | deming, lei |

Agent affinity means the skill's content is preferentially loaded into the
listed agent's context. Multiple affinities mean the skill is relevant to
more than one specialist.

## 5. Team Configurations

Teams are pre-composed agent groups for common project management situations.

| Team                    | Agents                                                | Use When                                              |
|-------------------------|-------------------------------------------------------|-------------------------------------------------------|
| project-assessment-team | brooks, hamilton, goldratt, deming, lei, gantt, sinek | Comprehensive project assessment, audit, or health check |
| sprint-team             | lei, gantt, deming, goldratt                          | Sprint planning, execution tracking, or delivery optimization |
| program-review-team     | brooks, hamilton, deming, sinek                       | Milestone review, program-level reporting, or executive briefings |

**project-assessment-team** is the full department. Use it for problems that
require every perspective — health checks, audits, project kickoffs, and
cross-cutting assessments where risk, quality, schedule, and communication all
matter simultaneously.

**sprint-team** is the delivery core. Lei facilitates the sprint process, Gantt
manages the schedule, Deming enforces quality gates, and Goldratt identifies
bottlenecks that threaten throughput. Use it when the primary goal is getting
work done within a time box.

**program-review-team** is the strategic review configuration. Brooks synthesizes
the overall picture, Hamilton assesses systemic risks, Deming evaluates quality
trends, and Sinek frames the narrative for stakeholders. Use it for milestone
reviews, steering committee briefings, and executive reporting.

## 6. Grove Record Types

All department work products are persisted as Grove records under the
`project-management-department` namespace. Five record types are defined:

| Record Type            | Produced By           | Key Fields                                                    |
|------------------------|-----------------------|---------------------------------------------------------------|
| ProjectPlan            | gantt, lei            | scope statement, WBS, schedule, resource assignments, dependencies |
| ProjectRisk            | hamilton, goldratt    | risk description, probability, impact, mitigation strategy, owner, status |
| ProjectStatus          | brooks, sinek         | progress metrics, blockers, next actions, health indicators   |
| ProjectRetrospective   | deming, lei           | observations, action items, improvement commitments, metrics delta |
| ProjectSession         | brooks                | session ID, queries, dispatches, work product links, timestamps |

Records are content-addressed and immutable once written. ProjectSession records
link all work products from a single interaction, providing an audit trail from
query to decision.

## 7. College Integration

The chipset connects to the college business department concept graph, with
cross-references to the problem-solving and critical-thinking departments:

- **Concept graph read/write**: Agents can read existing concept definitions and
  write new ones when a topic is encountered that the graph does not yet cover.
- **Try Session generation**: When a ProjectPlan or ProjectRetrospective is
  produced, the chipset can automatically generate a Try Session (interactive
  practice) based on the content and the learner's current position in the
  concept graph.
- **Learning pathway updates**: Completed plans, risk assessments, and
  retrospectives update the learner's progress along college-defined pathways.
- **Cross-department references**: The project management department references
  two other college departments — problem-solving (for structured decomposition
  and root cause analysis) and critical-thinking (for decision evaluation and
  bias recognition). These are not dependencies but complementary knowledge
  that PM agents can draw on when a query crosses domain boundaries.
- **Five wings** map to the college business department structure:
  1. Planning & Estimation
  2. Risk & Quality
  3. Agile & Lean
  4. Communication & Leadership
  5. Process Improvement

Each skill and Grove record type aligns to one or more wings, so work products
are automatically filed into the correct part of the concept graph.

## 8. Customization Guide

The project management department follows the department template pattern
established by the math department. To adapt it for a different management
domain, follow these steps:

### Step 1: Copy the chipset directory

```bash
cp -r examples/chipsets/project-management-department examples/chipsets/product-management-department
```

### Step 2: Rename agents

Edit `chipset.yaml` and replace agent names, roles, and historical figure
references. For a product management department you might use: cagan (router/
chair), moore (market strategy), ries (lean startup), kano (requirements),
nielsen (usability), christensen (disruption), mccarthy (prioritization). Also
rename any corresponding agent directories if your project uses per-agent
config files.

### Step 3: Replace skills with domain-appropriate content

Swap the six PM skills for product management equivalents. Each skill needs:
- A `domain` value (e.g., `product-management`)
- A `description` summarizing what the skill covers
- A `triggers` list of natural language patterns that activate the skill
- An `agent_affinity` mapping to the renamed agents

### Step 4: Define new Grove record types

Replace the five `ProjectX` record types with domain-appropriate types. A
product management department might use: ProductVision, ProductDiscovery,
ProductRequirement, ProductLaunch, ProductSession. Each type should describe
the fields that agents produce.

### Step 5: Map to the target college department

Update the `college` section:
- Set `department` to the target (e.g., `business` or a new department)
- Define wings that match the college department structure
- Decide whether `concept_graph.write` should be enabled (some departments
  may want read-only access to avoid unreviewed graph mutations)

### Step 6: Update evaluation gates

Review the `evaluation.gates` section. The five default gates are generic
enough for most departments, but you may want to add domain-specific checks
(e.g., "all launch record types must declare a success metric field").

Update `benchmark.domains_covered` to list the new domain areas.

## 9. Architecture Notes

### Why router topology

The router topology places a single agent (Brooks) as the entry point for all
queries. This provides three benefits:

1. **Classification**: Brooks determines which domain(s) a query touches before
   dispatching, preventing wasted work by non-relevant agents.
2. **Synthesis**: For multi-domain queries, Brooks collects results from
   multiple specialists and synthesizes a unified response.
3. **CAPCOM boundary**: The user interacts with exactly one agent. This reduces
   cognitive load and provides a consistent communication style.

Brooks as router is especially appropriate because project management is
inherently about coordination. The department chair does not do all the work —
the department chair decides who does what work, collects the results, and
presents a coherent picture. This is exactly the router pattern.

### Why 3 Opus / 4 Sonnet

Model assignment follows the reasoning depth required by each role:

- **Opus agents** (brooks, hamilton, deming): These roles require the deepest
  reasoning. Routing and synthesis (Brooks) must understand all six domains
  well enough to classify correctly. Risk analysis (Hamilton) requires
  multi-factor reasoning where missed connections have real consequences.
  Quality management (Deming) requires statistical thinking and the ability
  to trace cause-effect chains through complex processes.
- **Sonnet agents** (goldratt, lei, gantt, sinek): These roles are
  throughput-oriented. Constraint identification, sprint facilitation,
  schedule construction, and stakeholder communication benefit from fast
  turnaround. Sonnet's speed matters more than its depth ceiling for these
  tasks.

This 3/4 split keeps the token budget practical while preserving quality where
it matters most.

### Why this team structure

The three teams cover the three most common project management situations:

- **Full assessment**: needs every perspective (all 7 agents) — kickoffs,
  audits, and health checks where nothing should be missed
- **Sprint delivery**: needs the operational core (4 agents) — day-to-day
  execution where speed and focus matter more than breadth
- **Program review**: needs the strategic core (4 agents) — milestone reviews
  and executive reporting where narrative and risk matter most

Teams are not exclusive. Brooks can assemble ad-hoc groups for queries that
do not fit any pre-composed team.

### CAPCOM boundary

The CAPCOM (Capsule Communicator) pattern means only Brooks speaks to the
user. Other agents communicate through Brooks via internal dispatch. This is
enforced by the `is_capcom: true` flag — only one agent in the chipset may
carry this flag.

## 10. Relationship to Other Departments and GSD

The Project Management Department is the meta-department. Where other
departments teach and reason about subjects, this department manages the
process by which all departments — and all projects — operate. It has a
unique relationship to every other department and to the GSD workflow itself.

### Relationship to the Math Department

The math department (`examples/chipsets/math-department/`) produces proofs,
derivations, conjectures, and explanations. The project management department
manages the process around that production — scheduling a proof workshop,
tracking which conjectures remain open, running retrospectives on what the
discovery team learned. When Hypatia dispatches a multi-domain investigation,
Brooks can assess the schedule risk. When Ramanujan generates 50 conjectures,
Gantt can prioritize them into a work breakdown structure.

### Relationship to the Physics Department

The physics department (`examples/chipsets/physics-department/`) runs
experiments, simulations, and derivations. The project management department
manages the experimental pipeline — risk assessment for resource-intensive
simulations, quality gates for experimental validation, sprint planning for
iterative model refinement. Hamilton's systems engineering background makes
her particularly suited to assessing failure modes in physics simulations.

### Relationship to the Philosophy Department

The philosophy department (`examples/chipsets/philosophy-department/`) engages
in argumentation, ethical analysis, and conceptual clarification. The project
management department borrows from philosophy when reasoning about decision
frameworks, stakeholder ethics, and the epistemology of estimation (how do we
know what we think we know about project duration?). Deming's quality
philosophy draws heavily on epistemological foundations.

### Relationship to the Music Department

The music department (`examples/chipsets/music-department/`) creates
compositions, arrangements, and analyses. The project management department
manages production timelines, studio session scheduling, and quality
review cycles for musical output. Lei's agile coaching adapts naturally to
creative iteration cycles where work is never truly "done" — only released.

### Relationship to GSD Workflow Commands

This is the defining relationship. GSD commands are project management
primitives, and every GSD command maps to a PM skill:

| GSD Command            | PM Skill                 | Agent         | What Happens                                    |
|------------------------|--------------------------|---------------|-------------------------------------------------|
| `/gsd-plan-phase`      | estimation-planning      | gantt         | Work breakdown, effort estimation, scheduling   |
| `/gsd-execute-phase`   | agile-methods            | lei           | Sprint execution, iterative delivery, standup   |
| `/gsd-verify-work`     | quality-assurance        | deming        | Acceptance testing, quality gates, definition of done |
| `/gsd-audit-milestone` | retrospective-learning   | deming, lei   | Lessons learned, process improvement, metrics   |
| `/gsd-discuss-phase`   | stakeholder-communication| sinek, brooks | Context gathering, stakeholder alignment        |
| `/gsd-debug`           | risk-management          | hamilton      | Failure analysis, root cause, mitigation        |

This mapping is not metaphorical. When a user runs `/gsd-plan-phase`, they are
performing estimation-planning. When they run `/gsd-verify-work`, they are
performing quality-assurance. The PM department makes these implicit
relationships explicit, providing the theoretical foundation and best practices
that GSD commands operationalize.

In practice, this means the PM department can:

1. **Coach GSD usage**: When a user struggles with planning, Gantt can teach
   estimation techniques. When verification keeps failing, Deming can teach
   quality gate design.
2. **Audit GSD process**: The program-review-team can assess whether the GSD
   workflow is being used effectively — are retrospectives being skipped? Are
   risks being identified too late? Is the backlog growing faster than delivery?
3. **Bridge to theory**: Every GSD command has a body of literature behind it.
   The PM department connects practice to theory, so users understand not just
   what to do but why it works.

This is what makes the PM department the meta-department. It does not compete
with GSD — it is the academic foundation that GSD operationalizes into
commands. The department teaches project management; GSD does project
management. Together they form a complete loop: theory informs practice,
practice generates retrospectives, retrospectives refine theory.
