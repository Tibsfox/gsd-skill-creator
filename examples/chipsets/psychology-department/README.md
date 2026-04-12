---
name: psychology-department
type: chipset
category: psychology
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/chipsets/psychology-department/README.md
description: >
  Coordinated psychology department -- seven named agents, six knowledge
  skills, three teams. 11th department in the college structure.
superseded_by: null
---

# Psychology Department

## 1. What is the Psychology Department?

The Psychology Department chipset is a coordinated set of reasoning agents, domain
skills, and pre-composed teams that together provide structured psychology support
across cognitive processes, developmental science, social psychology, clinical
foundations, research methods, and behavioral neuroscience. It is the 11th department
in the college structure and follows the department template pattern established by
the math department. Incoming requests are classified by a router agent (James),
dispatched to the appropriate specialist, and all work products are persisted as
Grove records linked to the college concept graph.

## 2. Quick Start

Install the chipset into your gsd-skill-creator project:

```bash
# From the gsd-skill-creator root
cp -r examples/chipsets/psychology-department .claude/chipsets/psychology-department
```

The chipset is activated when any of the six skill trigger patterns match an
incoming query. James (the router agent) classifies the query domain and
dispatches to the appropriate specialist agent. No explicit activation command
is needed -- the skill-integration layer loads the chipset based on context.

To verify the chipset is recognized:

```bash
# Check that the YAML parses cleanly
node -e "const yaml = require('yaml'); const fs = require('fs'); \
  console.log(yaml.parse(fs.readFileSync('.claude/chipsets/psychology-department/chipset.yaml', 'utf8')).name)"
# Expected output: psychology-department-v1.0
```

## 3. Agent Roster

Seven agents form the department. Three run on Opus (for tasks requiring deep
reasoning), four on Sonnet (for throughput-oriented analysis and pedagogy).

| Name       | Historical Figure          | Role                                          | Model  | Tools                        |
|------------|----------------------------|-----------------------------------------------|--------|------------------------------|
| james      | William James (1842-1910)  | Department chair -- classification, routing, synthesis | opus   | Read, Glob, Grep, Bash, Write |
| piaget     | Jean Piaget (1896-1980)    | Developmental specialist -- cognitive stages, lifespan development | opus   | Read, Grep, Bash             |
| kahneman   | Daniel Kahneman (1934-2024)| Cognitive-behavioral specialist -- heuristics, biases, System 1/2, research methods | opus   | Read, Grep, Bash             |
| vygotsky   | Lev Vygotsky (1896-1934)   | Social-cultural specialist -- ZPD, scaffolding, cultural mediation | sonnet | Read, Grep                   |
| rogers     | Carl Rogers (1902-1987)    | Clinical-humanistic specialist -- person-centered therapy, UPR | sonnet | Read, Write                  |
| hooks      | bell hooks (1952-2021)     | Social justice specialist -- intersectionality, feminist psychology | sonnet | Read, Grep                   |
| skinner-p  | B.F. Skinner (1904-1990)   | Pedagogy specialist -- operant conditioning applied to learning design | sonnet | Read, Write                  |

James is the CAPCOM (single point of contact for the user). All other agents
receive dispatched subtasks and return results through James.

## 4. Skill Inventory

Six skills provide domain knowledge that agents draw on during execution.

| Skill                    | Domain     | Trigger Patterns                                                          | Agent Affinity          |
|--------------------------|------------|---------------------------------------------------------------------------|-------------------------|
| cognitive-psychology     | psychology | attention, memory, perception, decision-making, cognitive bias, heuristic, System 1/2 | kahneman, james         |
| developmental-psychology | psychology | developmental, child development, Piaget, attachment, moral development, adolescent, lifespan | piaget, vygotsky        |
| social-psychology        | psychology | conformity, obedience, attitude, group dynamics, prejudice, stereotype, social influence | hooks, vygotsky, kahneman |
| clinical-foundations     | psychology | anxiety, depression, therapy, CBT, person-centered, disorder, personality, treatment | rogers, hooks, skinner-p |
| research-methods-psych   | psychology | experiment, research design, p-value, replication, effect size, IRB, statistical | kahneman, james         |
| behavioral-neuroscience  | psychology | brain, neurotransmitter, dopamine, serotonin, cortex, amygdala, plasticity | james, kahneman         |

Agent affinity means the skill's content is preferentially loaded into the
listed agent's context. Multiple affinities mean the skill is relevant to
more than one specialist.

## 5. Team Configurations

Teams are pre-composed agent groups for common problem shapes.

| Team                      | Agents                                              | Use When                                        |
|---------------------------|-----------------------------------------------------|-------------------------------------------------|
| psychology-seminar-team   | james, piaget, vygotsky, kahneman, rogers, hooks, skinner-p | Multi-domain, graduate-level, or full-analysis requests |
| research-design-team      | kahneman, piaget, james, skinner-p                  | Study design, methodology evaluation, replication |
| case-study-team           | rogers, hooks, vygotsky, skinner-p                  | Case formulation, treatment planning, intervention design |

**psychology-seminar-team** is the full department. Use it for problems that
span multiple psychological sub-disciplines or require the broadest possible
range of perspectives.

**research-design-team** pairs the methodologist (Kahneman) with the
developmental specialist (Piaget), the pragmatic integrator (James), and the
operationalization expert (Skinner-P). Use it when the primary goal is designing,
evaluating, or replicating a research study.

**case-study-team** is the clinical pipeline. Rogers centers the client's
experience, Hooks provides structural context, Vygotsky adds social-cultural
analysis, and Skinner-P designs behavioral interventions. Use it for case
formulation, treatment planning, and clinical case presentations.

## 6. Grove Record Types

All department work products are persisted as Grove records under the
`psychology-department` namespace. Five record types are defined:

| Record Type             | Produced By                    | Key Fields                                                    |
|-------------------------|--------------------------------|---------------------------------------------------------------|
| PsychologicalAnalysis   | kahneman, hooks                | phenomenon analyzed, framework, biases/factors identified, recommendations |
| CaseFormulation         | rogers, case-study-team        | presenting concern, person-centered formulation, structural context, behavioral analysis |
| ResearchDesign          | kahneman, research-design-team | research question, design type, methodology, power analysis, ethical considerations |
| PsychologicalExplanation| all agents                     | topic, framework, explanation body, concept IDs, level        |
| PsychologySession       | james                          | session ID, queries, dispatches, work product links, timestamps |

Records are content-addressed and immutable once written. PsychologySession records
link all work products from a single interaction, providing an audit trail from
query to result.

## 7. College Integration

The chipset connects to the college psychology department concept graph:

- **Concept graph read/write**: Agents can read existing concept definitions and
  write new ones when a topic is encountered that the graph does not yet cover.
- **Try Session generation**: When a PsychologicalExplanation is produced, the chipset
  can automatically generate a Try Session (interactive practice) based on the
  explanation content and the learner's current position in the concept graph.
- **Learning pathway updates**: Completed analyses, explanations, and case studies
  update the learner's progress along college-defined pathways.
- **Five wings** map to the college psychology department structure:
  1. Brain & Cognition
  2. Emotion & Motivation
  3. Development
  4. Social Psychology
  5. Behavior & Mental Health

Each skill and Grove record type aligns to one or more wings, so work products
are automatically filed into the correct part of the concept graph.

## 8. Customization Guide

To create a department for another domain from this template, follow the steps
in the math department README (Section 8) -- copy the directory, rename agents,
replace skills, define new Grove record types, map to the target college
department, and update evaluation gates.

## 9. Architecture Notes

### Why router topology

The router topology places a single agent (James) as the entry point for all
queries. This is especially important in psychology because:

1. **Multi-paradigm discipline**: Psychology has competing theoretical frameworks
   that can produce contradictory analyses of the same phenomenon. A single
   router ensures the user receives a coherent, integrated response rather than
   a cacophony of perspectives.
2. **Crisis handling**: Some psychology queries involve crisis content (suicidal
   ideation, self-harm). James provides appropriate resources immediately rather
   than routing to specialists.
3. **Pragmatic lens**: True to William James's philosophy, every response addresses
   practical implications -- what the science means for the person asking.

### Why 3 Opus / 4 Sonnet

Model assignment follows the reasoning depth required by each role:

- **Opus agents** (james, piaget, kahneman): Routing and synthesis (James) must
  understand all six domains well enough to classify correctly. Developmental
  analysis (Piaget) requires integrating across theories and lifespan stages.
  Cognitive-behavioral analysis and research methodology (Kahneman) require
  rigorous statistical and experimental reasoning.
- **Sonnet agents** (vygotsky, rogers, hooks, skinner-p): These roles are
  well-defined within their theoretical frameworks. Social-cultural analysis,
  person-centered formulation, structural critique, and learning design benefit
  from the frameworks' structure, making them suitable for Sonnet's throughput.

### Why this team structure

The three teams cover the three most common query shapes in psychology:

- **Full seminar**: needs every perspective (all 7 agents) -- for multi-domain
  and graduate-level problems
- **Research design**: needs methodological rigor (4 agents) -- for study design,
  evaluation, and replication
- **Case study**: needs clinical depth and contextual breadth (4 agents) -- for
  formulation, treatment planning, and intervention design

Teams are not exclusive. James can assemble ad-hoc groups for queries that
do not fit any pre-composed team.

### CAPCOM boundary

The CAPCOM (Capsule Communicator) pattern means only James speaks to the
user. Other agents communicate through James via internal dispatch. This is
enforced by the `is_capcom: true` flag -- only one agent in the chipset may
carry this flag.

### The pragmatic principle

William James evaluated ideas by their "cash value" -- their practical
consequences. This principle permeates the department: every response includes
not just the scientific answer but its practical implications. Pure theory
is always grounded in "what does this mean for you?"

## 10. Relationship to Other Departments

The psychology department connects to several other college departments:

- **Philosophy Department**: Epistemology and ethics inform psychological
  research methods and clinical ethics. William James himself was both a
  psychologist and a philosopher.
- **Economics Department**: Behavioral economics (Kahneman's Nobel-winning work)
  bridges psychology and economics. Prospect theory, nudge theory, and bounded
  rationality are shared territory.
- **Mathematics Department**: Statistical methods in psychology draw on the math
  department's statistical inference skills. Research methods (Kahneman) may
  consult mathematical reasoning for power analysis and Bayesian methods.
- **History Department**: Historical context for psychological theories and
  their social impact (e.g., the history of intelligence testing, the
  eugenics movement, deinstitutionalization).

These cross-department connections enable richer analyses when queries span
disciplinary boundaries. James (as router) can identify when a query would
benefit from cross-department consultation.
