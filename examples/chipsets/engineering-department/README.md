---
name: engineering-department
type: chipset
category: chipset
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/chipsets/engineering-department/README.md
description: >
  Coordinated engineering department -- seven named agents, six knowledge
  skills, three teams. Ninth instantiation of the department template pattern.
superseded_by: null
---

# Engineering Department

## 1. What is the Engineering Department?

The Engineering Department chipset is a coordinated set of reasoning agents,
domain skills, and pre-composed teams that together provide structured
engineering support across the design process, structural analysis, systems
engineering, prototyping and fabrication, engineering ethics, and technical
communication. It is the ninth instantiation of the "department template
pattern" in gsd-skill-creator. Incoming requests are classified by a router
agent (Brunel), dispatched to the appropriate specialist, and all work
products are persisted as Grove records linked to the college concept graph.

## 2. Quick Start

Install the chipset into your gsd-skill-creator project:

```bash
# From the gsd-skill-creator root
cp -r examples/chipsets/engineering-department .claude/chipsets/engineering-department
```

The chipset is activated when any of the six skill trigger patterns match an
incoming query. Brunel (the router agent) classifies the query domain and
dispatches to the appropriate specialist agent. No explicit activation command
is needed -- the skill-integration layer loads the chipset based on context.

To verify the chipset is recognized:

```bash
# Check that the YAML parses cleanly
node -e "const yaml = require('yaml'); const fs = require('fs'); \
  console.log(yaml.parse(fs.readFileSync('.claude/chipsets/engineering-department/chipset.yaml', 'utf8')).name)"
# Expected output: engineering-department-v1.0
```

## 3. Agent Roster

Seven agents form the department. Three run on Opus (for tasks requiring deep
reasoning and cross-domain synthesis), four on Sonnet (for throughput-oriented
computation and structured analysis).

| Name       | Historical Figure          | Role                                          | Model  | Tools                        |
|------------|----------------------------|-----------------------------------------------|--------|------------------------------|
| brunel     | Isambard Kingdom Brunel    | Department chair -- classification, routing, synthesis, design review | opus   | Read, Glob, Grep, Bash, Write |
| tesla      | Nikola Tesla               | Electrical/systems -- circuits, power, control, EMC, integration | opus   | Read, Grep, Bash             |
| roebling   | Emily Warren Roebling      | Structural/civil -- statics, stress analysis, design, failure analysis | sonnet | Read, Bash                   |
| johnson-k  | Katherine Johnson          | Aerospace/computational -- orbital mechanics, trajectory, SE, verification | opus   | Read, Grep, Bash             |
| watt       | James Watt                 | Mechanical/thermal -- thermodynamics, heat transfer, mechanisms, fluids | sonnet | Read, Bash                   |
| lovelace-e | Engineering-Lovelace       | Materials/manufacturing -- material selection, fabrication, quality control | sonnet | Read, Bash                   |
| polya-e    | Engineering-Polya          | Pedagogy -- problem-solving framework, explanation, learning paths | sonnet | Read, Write                  |

Brunel is the CAPCOM (single point of contact for the user). All other agents
receive dispatched subtasks and return results through Brunel.

## 4. Skill Inventory

Six skills provide domain knowledge that agents draw on during execution.

| Skill                  | Domain      | Trigger Patterns                                               | Agent Affinity         |
|------------------------|-------------|----------------------------------------------------------------|------------------------|
| design-process         | engineering | design process, design cycle, requirements, specifications, trade study, Pugh matrix | brunel                 |
| structural-analysis    | engineering | structural, stress, strain, beam, column, buckling, load, bridge, truss | roebling, watt         |
| systems-engineering    | engineering | systems engineering, V-model, verification, validation, requirements traceability | johnson-k, brunel      |
| prototyping-fabrication| engineering | prototype, 3D print, CNC, fabrication, CAD, manufacture, workshop | lovelace-e, watt       |
| engineering-ethics     | engineering | engineering ethics, safety, code of ethics, Challenger, Columbia, whistleblowing | brunel, roebling       |
| technical-communication| engineering | technical writing, engineering report, specifications, engineering drawing | polya-e, johnson-k     |

Agent affinity means the skill's content is preferentially loaded into the
listed agent's context. Multiple affinities mean the skill is relevant to
more than one specialist.

## 5. Team Configurations

Teams are pre-composed agent groups for common problem shapes.

| Team                      | Agents                                              | Use When                                        |
|---------------------------|-----------------------------------------------------|-------------------------------------------------|
| engineering-review-team   | brunel, tesla, roebling, johnson-k, watt, lovelace-e, polya-e | Multi-domain, safety-critical, or full design review |
| design-sprint-team        | brunel, tesla, roebling, polya-e                    | Early-stage concept development and trade studies |
| systems-team              | johnson-k, tesla, watt, polya-e                     | Systems engineering, integration, and V&V        |

**engineering-review-team** is the full department. Use it for problems that
span multiple engineering disciplines, require safety analysis, or need
comprehensive design review (SRR, PDR, CDR).

**design-sprint-team** runs a condensed design cycle from problem definition
through concept selection, optimized for speed and breadth of concept
generation rather than deep analysis.

**systems-team** handles the V-model lifecycle: requirements decomposition,
integration planning, verification and validation, interface control, and
technical performance tracking. Led by Johnson-K rather than Brunel because
systems engineering is Johnson-K's primary domain.

## 6. Grove Record Types

All department work products are persisted as Grove records under the
`engineering-department` namespace. Five record types are defined:

| Record Type            | Produced By                    | Key Fields                                           |
|------------------------|--------------------------------|------------------------------------------------------|
| EngineeringDesign      | brunel, design-sprint-team     | problem statement, concepts, evaluation matrix, recommendation |
| EngineeringAnalysis    | roebling, tesla, watt, johnson-k, lovelace-e | domain, method, assumptions, solution, result, verification |
| EngineeringReview      | brunel, johnson-k              | review type, items reviewed, findings, action items   |
| EngineeringExplanation | polya-e                        | topic, target level, Polya phase, explanation, prerequisites |
| EngineeringSession     | brunel                         | session ID, queries, dispatches, work product links, timestamps |

Records are content-addressed and immutable once written. EngineeringSession
records link all work products from a single interaction, providing an audit
trail from query to result.

## 7. College Integration

The chipset connects to the college engineering department concept graph:

- **Concept graph read/write**: Agents can read existing concept definitions
  and write new ones when a topic is encountered that the graph does not yet
  cover.
- **Try Session generation**: When an EngineeringExplanation is produced, the
  chipset can automatically generate a Try Session (interactive practice)
  based on the explanation content.
- **Learning pathway updates**: Completed analyses, designs, and explanations
  update the learner's progress along college-defined pathways.
- **Five wings** map to the college engineering department structure:
  1. The Engineering Design Process
  2. Materials & Structures
  3. Mechanisms & Systems
  4. Prototyping & Testing
  5. Engineering Ethics & Impact

Each skill and Grove record type aligns to one or more wings, so work products
are automatically filed into the correct part of the concept graph.

## 8. Customization Guide

The engineering department follows the department template pattern established
by the math department. To create a department for another domain, follow the
same steps documented in the math-department README (copy, rename agents,
replace skills, define Grove types, map to college department, update
evaluation gates).

## 9. Architecture Notes

### Why router topology

The router topology places a single agent (Brunel) as the entry point for all
queries. This provides:

1. **Classification**: Brunel determines which domain(s) a query touches before
   dispatching, preventing wasted work by non-relevant agents.
2. **Synthesis**: For multi-domain queries, Brunel collects results from
   multiple specialists and synthesizes a unified response.
3. **CAPCOM boundary**: The user interacts with exactly one agent.

### Why 3 Opus / 4 Sonnet

Model assignment follows the reasoning depth required by each role:

- **Opus agents** (brunel, tesla, johnson-k): These roles require cross-domain
  reasoning. Routing and synthesis (Brunel) must understand all engineering
  domains. Systems-level thinking (Tesla) requires maintaining multiple domain
  models simultaneously. Aerospace calculations and verification (Johnson-K)
  involve multi-step mathematical reasoning where errors compound.
- **Sonnet agents** (roebling, watt, lovelace-e, polya-e): These roles follow
  established procedures. Structural analysis has clear algorithms. Thermal
  calculations follow known correlations. Material selection uses systematic
  screening. Pedagogical adaptation follows the Polya framework. Sonnet's
  speed matters more than depth for these tasks.

### Why this team structure

The three teams cover the three most common engineering query shapes:

- **Full review**: needs every perspective (all 7 agents)
- **Design sprint**: needs rapid concept generation (4 agents, speed over depth)
- **Systems**: needs V-model lifecycle management (4 agents, integration focus)

Teams are not exclusive. Brunel can assemble ad-hoc groups for queries that
do not fit any pre-composed team.

### CAPCOM boundary

The CAPCOM (Capsule Communicator) pattern means only Brunel speaks to the
user. Other agents communicate through Brunel via internal dispatch. This is
enforced by the `is_capcom: true` flag -- only one agent in the chipset may
carry this flag.

### Safety disclaimer

For professional-level queries involving real-world safety-critical design,
Brunel includes a note that AI-generated engineering analysis does not replace
review by a licensed professional engineer. This disclaimer is part of the
department's commitment to engineering ethics (Canon 1: hold paramount the
safety, health, and welfare of the public).

## 10. Historical Figures

The engineering department agents are named for engineers and scientists who
shaped the built world:

- **Brunel (1806--1859):** Greatest engineer of the Industrial Revolution.
  Bridges, tunnels, ships, railways. Integrated vision across disciplines.
- **Tesla (1856--1943):** AC power, induction motor, radio. Visionary systems
  thinker who designed power systems, not just components.
- **Roebling (1843--1903):** Emily Warren Roebling completed the Brooklyn
  Bridge after her husband fell ill. First female field engineer.
- **Johnson (1918--2020):** Katherine Johnson, NASA trajectory calculations.
  Hidden Figures. Presidential Medal of Freedom. Verification ethic.
- **Watt (1736--1819):** Improved the steam engine with the separate condenser.
  The unit of power is named after him.
- **Lovelace-E:** Engineering materials and fabrication specialist. The "-e"
  suffix distinguishes from Lovelace agents in other departments.
- **Polya-E:** Problem-solving methodology applied to engineering. The "-e"
  suffix distinguishes from Polya agents in other departments.
