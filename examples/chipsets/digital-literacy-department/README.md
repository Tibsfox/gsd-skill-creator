---
name: digital-literacy-department
type: chipset
category: chipset
status: stable
origin: tibsfox
first_seen: 2026-04-12
first_path: examples/chipsets/digital-literacy-department/README.md
description: >
  Coordinated digital literacy department -- seven named agents, six
  knowledge skills, three teams. 24th department in the college structure.
superseded_by: null
---

# Digital Literacy Department

## 1. What is the Digital Literacy Department?

The Digital Literacy Department chipset is a coordinated set of reasoning
agents, domain skills, and pre-composed teams that together provide
structured digital-literacy support across information evaluation, digital
citizenship, computational literacy, data privacy, media creation, and
algorithmic awareness. It is the 24th department built on the gsd-skill-creator
department template pattern. Incoming requests are classified by a router
agent (Rheingold), dispatched to the appropriate specialist, and all work
products are persisted as Grove records linked to the college concept graph.

The department takes a positive, practical view of digital literacy:
learners develop skill by doing things, not by receiving warnings. The
specialist roster is drawn from the empirical research community -- boyd,
Palfrey, Noble, Jenkins, Ito, Kafai -- so recommendations are grounded in
evidence rather than folk theory.

## 2. Quick Start

Install the chipset into your gsd-skill-creator project:

```bash
# From the gsd-skill-creator root
cp -r examples/chipsets/digital-literacy-department .claude/chipsets/digital-literacy-department
```

The chipset activates when any of the six skill trigger patterns match an
incoming query. Rheingold (the router agent) classifies the query domain and
dispatches to the appropriate specialist agent. No explicit activation
command is needed -- the skill-integration layer loads the chipset based on
context.

To verify the chipset is recognized:

```bash
node -e "const yaml = require('yaml'); const fs = require('fs'); \
  console.log(yaml.parse(fs.readFileSync('.claude/chipsets/digital-literacy-department/chipset.yaml', 'utf8')).name)"
# Expected output: digital-literacy-department-v1.0
```

## 3. Agent Roster

Seven agents form the department. Three run on Opus (for tasks requiring
deep reasoning and judgment), four on Sonnet (for well-defined specialist
and pedagogical work).

| Name      | Historical Figure                 | Role                                                           | Model  | Tools                         |
|-----------|-----------------------------------|----------------------------------------------------------------|--------|-------------------------------|
| rheingold | Howard Rheingold                  | Department chair -- classification, routing, synthesis         | opus   | Read, Glob, Grep, Bash, Write |
| boyd      | danah boyd                        | Social context -- networked publics, youth practice            | opus   | Read, Grep, Bash              |
| palfrey   | John Palfrey                      | Institutional -- law, policy, source credibility               | opus   | Read, Grep, Bash              |
| noble     | Safiya Umoja Noble                | Algorithmic bias -- power asymmetry, documented cases          | sonnet | Read, Grep                    |
| jenkins   | Henry Jenkins                     | Participatory culture -- remix, fandom, collective intelligence| sonnet | Read, Grep                    |
| ito       | Mizuko Ito                        | Connected learning -- HOMAGO, interest-driven practice         | sonnet | Read, Grep                    |
| kafai     | Yasmin Kafai                      | Pedagogy -- constructionist learning design                    | sonnet | Read, Write                   |

Rheingold is the CAPCOM (single point of contact for the user). All other
agents receive dispatched subtasks and return results through Rheingold.

## 4. Skill Inventory

Six skills provide domain knowledge that agents draw on during execution.

| Skill                  | Domain           | Trigger Patterns                                                                     | Agent Affinity    |
|------------------------|------------------|-------------------------------------------------------------------------------------|-------------------|
| information-evaluation | digital-literacy | is this true, credible, fact check, SIFT, lateral reading, reverse image, misinformation | palfrey, rheingold |
| digital-citizenship    | digital-literacy | digital footprint, online etiquette, cyberbullying, attribution, creative commons    | boyd, jenkins, rheingold |
| computational-literacy | digital-literacy | how does the internet work, CPU, RAM, DNS, binary, network                           | ito, rheingold    |
| data-privacy           | digital-literacy | password, MFA, privacy settings, tracking, GDPR, breach                              | palfrey, boyd     |
| media-creation         | digital-literacy | create media, podcast, accessibility, alt text, remix, fair use                      | jenkins, kafai    |
| algorithmic-awareness  | digital-literacy | algorithm, recommendation, filter bubble, algorithmic bias, AI hallucination         | noble, palfrey    |

Agent affinity means the skill's content is preferentially loaded into the
listed agent's context. Multiple affinities mean the skill is relevant to
more than one specialist.

## 5. Team Configurations

Teams are pre-composed agent groups for common problem shapes.

| Team                              | Agents                                                       | Use When                                                     |
|-----------------------------------|--------------------------------------------------------------|--------------------------------------------------------------|
| digital-literacy-analysis-team    | rheingold, boyd, palfrey, noble, jenkins, ito, kafai        | Multi-domain, systemic, or educator-level requests           |
| digital-literacy-workshop-team    | rheingold, palfrey, noble, boyd, kafai                       | Single-artifact evaluation requests                          |
| digital-literacy-practice-team    | rheingold, ito, jenkins, kafai                               | Practice plan and fluency development requests               |

**digital-literacy-analysis-team** is the full department. Use it for
questions that span multiple sub-domains or require the broadest possible
analysis. Typical cost: 180-350K tokens.

**digital-literacy-workshop-team** is a focused evaluation team for a
specific artifact (source, claim, search result, AI output). Faster and
cheaper than the analysis team. Typical cost: 125-150K tokens.

**digital-literacy-practice-team** is a sequential pipeline that turns
concepts into repeatable practice routines. The cheapest team. Typical
cost: 75-100K tokens.

## 6. Grove Record Types

All department work products are persisted as Grove records under the
`digital-literacy-department` namespace. Five record types are defined:

| Record Type               | Produced By                  | Key Fields                                                              |
|---------------------------|------------------------------|------------------------------------------------------------------------|
| DigitalLiteracyAnalysis   | boyd, palfrey, noble, jenkins, ito | Subject, framework, findings, evidence, synthesis                      |
| DigitalLiteracyReview     | workshop team                | Subject, multi-framework verdicts, synthesis, teaching takeaway        |
| DigitalLiteracyExplanation| kafai, rheingold             | Topic, target level, explanation body, prerequisites, activity options |
| DigitalLiteracyArtifact   | learner (via kafai)          | Artifact type, description, constructionist context, feedback received |
| DigitalLiteracySession    | rheingold                    | Session ID, queries, dispatches, work product links, timestamps        |

Records are content-addressed and immutable once written.
DigitalLiteracySession records link all work products from a single
interaction, providing an audit trail from query to result.

## 7. College Integration

The chipset connects to the college digital-literacy department concept graph:

- **Concept graph read/write**: Agents read existing concept definitions and
  can add new ones when a topic is encountered that the graph does not yet
  cover.
- **Try Session generation**: When a DigitalLiteracyExplanation is produced,
  the chipset can generate a Try Session (interactive practice) based on the
  explanation content and the learner's current position in the graph.
- **Learning pathway updates**: Completed analyses, reviews, and activities
  update the learner's progress along college-defined pathways.
- **Five wings** map to the college digital-literacy department structure:
  1. Digital Foundations
  2. Information Literacy
  3. Digital Communication
  4. Online Safety
  5. Algorithmic Awareness

Each skill and Grove record type aligns to one or more wings, so work
products are automatically filed into the correct part of the concept graph.

## 8. Customization Guide

The digital-literacy department is a fork of the math-department template
pattern adapted to a very different domain. To create your own department,
follow the same steps:

### Step 1: Copy the chipset directory

```bash
cp -r examples/chipsets/digital-literacy-department examples/chipsets/your-department
```

### Step 2: Rename agents

Edit `chipset.yaml` and replace agent names, roles, and historical figures.
Choose figures whose actual work maps to the agent's role. The
digital-literacy department spans ethnography (boyd, Ito), institutional
analysis (Palfrey), structural analysis (Noble), participatory culture
(Jenkins), constructionist pedagogy (Kafai), and practical fluency
(Rheingold). Historical diversity is intentional -- the roster spans
tradition, generation, and methodological approach.

### Step 3: Replace skills

Swap the six skills for domain-appropriate content. Each skill needs a
domain, description, triggers, and agent_affinity mapping.

### Step 4: Define new Grove record types

Replace the five digital-literacy types with domain-appropriate ones.

### Step 5: Map to the target college department

Update the `college` section and wing list.

### Step 6: Update evaluation gates

Review and adjust as needed.

## 9. Architecture Notes

### Why router topology

The router topology places Rheingold as the entry point for all queries.
This provides three benefits:

1. **Classification**: Rheingold determines which sub-domains a query
   touches before dispatching, preventing wasted work by non-relevant agents.
2. **Synthesis**: For multi-domain queries, Rheingold collects results and
   synthesizes a unified response.
3. **CAPCOM boundary**: The user interacts with exactly one agent. This
   reduces cognitive load and provides a consistent voice.

### Why 3 Opus / 4 Sonnet

Model assignment follows the judgment depth required by each role:

- **Opus agents** (rheingold, boyd, palfrey): These roles require deep
  judgment. Routing and synthesis (Rheingold) must understand all six
  sub-domains. Social-context analysis (boyd) and institutional analysis
  (Palfrey) require nuanced evidence-weighing where errors compound.
- **Sonnet agents** (noble, jenkins, ito, kafai): These roles are
  framework-application and structural work. Noble applies a case library,
  Jenkins applies participatory-culture theory, Ito applies HOMAGO, Kafai
  applies constructionist design. All benefit from Sonnet speed.

This 3/4 split keeps the token budget practical while preserving quality
where it matters most.

### Why three teams

The three teams cover the three most common query shapes:

- **Full analysis**: needs every perspective (all 7 agents)
- **Focused workshop**: single artifact, deep evaluation (5 agents)
- **Practice pipeline**: turning concept into habit (4 agents, sequential)

Teams are not exclusive. Rheingold can assemble ad-hoc groups for queries
that do not fit any pre-composed team.

## 10. Relationship to Other Departments

The digital-literacy department pairs naturally with:

- **Psychology Department** for questions about cognitive load, attention,
  and emotional regulation online
- **Logic Department** (25th, parallel build) for the argument-analysis
  side of misinformation
- **Writing Department** for media-creation questions where the medium is
  primarily written
- **Math Department** for the quantitative side of algorithmic-literacy
  questions (probability, statistics, bias measurement)

Cross-department queries can use the relevant department's router agent as
a starting point, with Rheingold as a fallback when the question is
specifically about how digital literacy intersects another domain.
