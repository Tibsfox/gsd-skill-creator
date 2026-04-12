---
name: science-department
type: chipset
category: chipset
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/chipsets/science-department/README.md
description: >
  Coordinated science department — seven named agents, six knowledge
  skills, three teams. Scientific inquiry as a meta-discipline: how
  to DO science, not any specific science.
superseded_by: null
---

# Science Department

## 1. What is the Science Department?

The Science Department chipset is a coordinated set of reasoning agents, domain skills, and pre-composed teams that together provide structured support for scientific inquiry as a meta-discipline. It covers the scientific method, experimental design, data analysis, science communication, field observation, and the history and philosophy of science. The department teaches how to DO science -- how to ask questions, design tests, interpret evidence, communicate findings, and understand the nature of scientific knowledge -- rather than teaching any specific science (biology, chemistry, physics). Incoming requests are classified by a router agent (Darwin), dispatched to the appropriate specialist, and all work products are persisted as Grove records linked to the college concept graph.

## 2. Quick Start

Install the chipset into your gsd-skill-creator project:

```bash
# From the gsd-skill-creator root
cp -r examples/chipsets/science-department .claude/chipsets/science-department
```

The chipset is activated when any of the six skill trigger patterns match an incoming query. Darwin (the router agent) classifies the query domain and dispatches to the appropriate specialist agent. No explicit activation command is needed -- the skill-integration layer loads the chipset based on context.

To verify the chipset is recognized:

```bash
# Check that the YAML parses cleanly
node -e "const yaml = require('yaml'); const fs = require('fs'); \
  console.log(yaml.parse(fs.readFileSync('.claude/chipsets/science-department/chipset.yaml', 'utf8')).name)"
# Expected output: science-department-v1.0
```

## 3. Agent Roster

Seven agents form the department. Three run on Opus (for tasks requiring deep reasoning), four on Sonnet (for throughput-oriented tasks).

| Name | Historical Figure | Role | Model | Tools |
|------|-------------------|------|-------|-------|
| darwin | Charles Darwin (1809--1882) | Department chair -- classification, routing, synthesis | opus | Read, Glob, Grep, Bash, Write |
| mcclintock | Barbara McClintock (1902--1992) | Experimental design -- controlled experiments, close observation | opus | Read, Grep, Bash |
| sagan | Carl Sagan (1934--1996) | Communication -- science popularization, narrative, public understanding | sonnet | Read, Write |
| goodall | Jane Goodall (1934--) | Field research -- observation protocols, longitudinal studies, ecological systems | opus | Read, Grep, Bash |
| feynman-s | Richard Feynman (1918--1988) | Methodology -- epistemology, methodological evaluation, demarcation | sonnet | Read, Bash |
| wu | Chien-Shiung Wu (1912--1997) | Precision and rigor -- measurement protocols, error analysis | sonnet | Read, Bash |
| pestalozzi | Johann Heinrich Pestalozzi (1746--1827) | Pedagogy -- hands-on activities, head-heart-hand framework | sonnet | Read, Write |

Darwin is the CAPCOM (single point of contact for the user). All other agents receive dispatched subtasks and return results through Darwin.

**Note on Feynman-S:** The `-s` suffix distinguishes this agent (science methodologist) from a potential physics department Feynman focused on theoretical physics content. This instance is concerned with how science works, not with physics.

## 4. Skill Inventory

Six skills provide domain knowledge that agents draw on during execution.

| Skill | Domain | Trigger Patterns | Agent Affinity |
|-------|--------|-----------------|----------------|
| scientific-method | science | scientific method, how do scientists, hypothesis, falsifiable, controlled experiment, evidence-based | feynman-s |
| experimental-design-sci | science | design an experiment, independent variable, control group, sample size, randomize, confounding variable | mcclintock, wu |
| data-analysis-sci | science | analyze data, standard deviation, significant figures, error analysis, p-value, graph this data | wu, mcclintock |
| earth-life-systems | science | ecosystem, biodiversity, climate, geological, field study, ecology | goodall, mcclintock |
| science-communication | science | explain to, science communication, lab report, peer review, claims evidence reasoning, baloney detection | sagan, pestalozzi |
| history-philosophy-science | science | paradigm shift, nature of science, who discovered, history of science, theory versus law, pseudoscience | feynman-s, sagan |

Agent affinity means the skill's content is preferentially loaded into the listed agent's context. Multiple affinities mean the skill is relevant to more than one specialist.

## 5. Team Configurations

Teams are pre-composed agent groups for common problem shapes.

| Team | Agents | Use When |
|------|--------|----------|
| science-investigation-team | darwin, mcclintock, sagan, goodall, feynman-s, wu, pestalozzi | Multi-domain, research-level, or full-analysis requests |
| lab-design-team | mcclintock, wu, darwin, pestalozzi | Experimental design, protocol review, measurement planning |
| communication-team | sagan, goodall, feynman-s, pestalozzi | Public communication, educational narrative, misinformation defense |

**science-investigation-team** is the full department. Use it for problems that span multiple domains of scientific inquiry or require the broadest possible expertise.

**lab-design-team** pairs the experimental designer (McClintock) with the measurement specialist (Wu), the synthesizer (Darwin), and the pedagogy guide (Pestalozzi). Use it when the primary goal is designing, reviewing, or teaching controlled experiments.

**communication-team** combines the communicator (Sagan), the field narrator (Goodall), the accuracy auditor (Feynman-S), and the pedagogy designer (Pestalozzi). Use it for translating scientific knowledge to non-specialist audiences or defending against misinformation.

## 6. Grove Record Types

All department work products are persisted as Grove records under the `science-department` namespace. Five record types are defined:

| Record Type | Produced By | Key Fields |
|-------------|-------------|------------|
| ScientificInvestigation | mcclintock, goodall, feynman-s | research question, methodology, findings, limitations, concept IDs |
| ExperimentalDesign | mcclintock, wu | hypothesis, variables, controls, measurement protocol, confound analysis |
| ScienceReport | feynman-s, wu, sagan | evaluation criteria, findings, strengths, weaknesses, recommendations |
| ScienceExplanation | sagan, pestalozzi | topic, target audience/level, explanation body, activities, accuracy notes |
| ScienceSession | darwin | session ID, queries, dispatches, work product links, timestamps |

Records are content-addressed and immutable once written. ScienceSession records link all work products from a single interaction, providing an audit trail from query to result.

## 7. College Integration

The chipset connects to the college science department concept graph:

- **Concept graph read/write**: Agents can read existing concept definitions and write new ones when a topic is encountered that the graph does not yet cover.
- **Try Session generation**: When a ScienceExplanation is produced, the chipset can automatically generate a Try Session (interactive practice) based on the explanation content and the learner's current position in the concept graph.
- **Learning pathway updates**: Completed investigations, experimental designs, and explanations update the learner's progress along college-defined pathways.
- **Five wings** map to the college science department structure:
  1. Observation & Inquiry
  2. Hypothesis & Experimental Design
  3. Data Collection & Analysis
  4. Scientific Communication & Argumentation
  5. History & Nature of Science

Each skill and Grove record type aligns to one or more wings, so work products are automatically filed into the correct part of the concept graph.

## 8. Architecture Notes

### Why router topology

The router topology places a single agent (Darwin) as the entry point for all queries. This provides three benefits:

1. **Classification**: Darwin determines which domain(s) a query touches before dispatching, preventing wasted work by non-relevant agents.
2. **Synthesis**: For multi-domain queries, Darwin collects results from multiple specialists and synthesizes a unified response.
3. **CAPCOM boundary**: The user interacts with exactly one agent. This reduces cognitive load and provides a consistent communication style.

### Why 3 Opus / 4 Sonnet

Model assignment follows the reasoning depth required by each role:

- **Opus agents** (darwin, mcclintock, goodall): These roles require the deepest reasoning. Routing and synthesis (Darwin) must understand all six domains well enough to classify correctly. Experimental design (McClintock) requires multi-step reasoning about confounds and controls where errors compound. Field study design (Goodall) requires sustained reasoning about complex ecological systems.
- **Sonnet agents** (sagan, feynman-s, wu, pestalozzi): These roles are throughput-oriented. Science communication, methodological evaluation, measurement specification, and pedagogical design benefit from fast turnaround. Sonnet's speed matters more than its depth ceiling for these bounded tasks.

### Why this team structure

The three teams cover the three most common query shapes:

- **Full investigation**: needs every perspective (all 7 agents)
- **Lab-focused**: needs the experimental core (4 agents, no communication or field observation)
- **Communication**: needs the public-facing pipeline (4 agents, no experimental design or measurement)

Teams are not exclusive. Darwin can assemble ad-hoc groups for queries that do not fit any pre-composed team.

### CAPCOM boundary

The CAPCOM (Capsule Communicator) pattern means only Darwin speaks to the user. Other agents communicate through Darwin via internal dispatch. This is enforced by the `is_capcom: true` flag -- only one agent in the chipset may carry this flag.

### Distinction from content departments

The Science Department teaches how to do science. It does not teach the content of any specific science. A question about "how do I design an experiment to test whether temperature affects enzyme activity?" belongs here. A question about "how do enzymes work?" belongs in a biology/chemistry department. The boundary is method vs. content.

When a query crosses this boundary, Darwin acknowledges the methodological component (which this department handles) and flags the content component (which the appropriate content department would handle).

## 9. Relationship to Other Departments

The science department is complementary to content-specific departments:

- **Physics, Chemistry, Biology departments** provide domain content knowledge. The science department provides the inquiry methodology those departments use.
- **Mathematics department** provides formal reasoning and quantitative tools. The science department applies those tools to empirical investigation.
- **Philosophy department** provides broader epistemological context. The science department narrows that context to the specific epistemology of empirical science (Feynman-S covers the intersection).

In practice, a complex interdisciplinary question might route through the science department for methodology and a content department for domain knowledge. The chipset architecture supports this through cross-department referral.
