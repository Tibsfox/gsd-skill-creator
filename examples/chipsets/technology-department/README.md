---
name: technology-department
type: chipset
category: chipset
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/chipsets/technology-department/README.md
description: >
  Coordinated technology department -- seven named agents, six knowledge
  skills, three teams. Covers technology literacy and innovation, distinct
  from the coding department (which is programming-specific).
superseded_by: null
---

# Technology Department

## 1. What is the Technology Department?

The Technology Department chipset is a coordinated set of reasoning agents,
domain skills, and pre-composed teams that together provide structured
technology literacy support across digital systems, design thinking, emerging
technologies, cybersecurity, human-computer interaction, and responsible
innovation. It is the 17th instantiation of the "department template pattern"
in gsd-skill-creator. Incoming requests are classified by a router agent
(Berners-Lee), dispatched to the appropriate specialist, and all work products
are persisted as Grove records linked to the college concept graph.

This department is distinct from the Coding Department: technology covers the
broad landscape of understanding, evaluating, designing, and using technology
responsibly. Coding covers the specific discipline of writing software. A
person who understands technology may never write code; a person who writes
code benefits from understanding the technology landscape their code inhabits.

## 2. Quick Start

Install the chipset into your gsd-skill-creator project:

```bash
# From the gsd-skill-creator root
cp -r examples/chipsets/technology-department .claude/chipsets/technology-department
```

The chipset is activated when any of the six skill trigger patterns match an
incoming query. Berners-Lee (the router agent) classifies the query domain and
dispatches to the appropriate specialist agent. No explicit activation command
is needed -- the skill-integration layer loads the chipset based on context.

To verify the chipset is recognized:

```bash
# Check that the YAML parses cleanly
node -e "const yaml = require('yaml'); const fs = require('fs'); \
  console.log(yaml.parse(fs.readFileSync('.claude/chipsets/technology-department/chipset.yaml', 'utf8')).name)"
# Expected output: technology-department-v1.0
```

## 3. Agent Roster

Seven agents form the department. Three run on Opus (for tasks requiring deep
reasoning), four on Sonnet (for throughput-oriented evaluation and pedagogy).

| Name        | Historical Figure          | Role                                                    | Model  | Tools                        |
|-------------|----------------------------|---------------------------------------------------------|--------|------------------------------|
| berners-lee | Tim Berners-Lee            | Department chair -- classification, routing, synthesis  | opus   | Read, Glob, Grep, Bash, Write |
| borg        | Anita Borg                 | Systems specialist -- infrastructure, architecture, networking | opus | Read, Grep, Bash             |
| gates-m     | Melinda French Gates       | Innovation & impact -- digital equity, social impact    | sonnet | Read, Bash                   |
| joy         | Bill Joy                   | Risk specialist -- emerging tech risk, failure modes    | opus   | Read, Grep, Bash             |
| hicks       | Mar Hicks                  | Social analyst -- social construction, labor, gender    | sonnet | Read, Bash                   |
| norman      | Don Norman                 | HCI specialist -- usability, affordances, accessibility | sonnet | Read, Write                  |
| resnick     | Mitchel Resnick            | Pedagogy specialist -- creative learning, scaffolding   | sonnet | Read, Write                  |

Berners-Lee is the CAPCOM (single point of contact for the user). All other
agents receive dispatched subtasks and return results through Berners-Lee.

### Why these figures

The agents are named for people who shaped how we think about technology, not
just how we build it:

- **Berners-Lee** invented the Web and gave it away, demonstrating that the most
  powerful technology decisions are architectural and social, not just technical.
- **Borg** built systems and communities, insisting that infrastructure must serve
  everyone -- not just the people who look like the people who built it.
- **Gates-M** directed billions toward technology for social impact, measuring
  success by whether the most marginalized populations benefit.
- **Joy** had the courage to ask "should we?" at the height of tech optimism,
  warning that self-replicating technologies require fundamentally new caution.
- **Hicks** demonstrated that technology is socially constructed, and that the
  story of "inevitable progress" conceals deliberate choices about who counts.
- **Norman** founded the discipline of human-centered design, insisting that when
  users fail, the design is wrong -- not the user.
- **Resnick** reimagined technology education as creative empowerment, giving
  millions of young people tools with low floors, high ceilings, and wide walls.

## 4. Skill Inventory

Six skills provide domain knowledge that agents draw on during execution.

| Skill                      | Domain     | Trigger Patterns                                                                | Agent Affinity            |
|----------------------------|------------|---------------------------------------------------------------------------------|---------------------------|
| digital-systems            | technology | how computers work, binary, networking, operating system, CPU, internet, protocol | berners-lee, borg        |
| design-thinking            | technology | design thinking, prototype, user needs, design brief, iterate, design process   | norman, resnick           |
| emerging-tech              | technology | artificial intelligence, quantum computing, biotechnology, IoT, blockchain, robotics | joy, gates-m           |
| cybersecurity-basics       | technology | cybersecurity, encryption, password, phishing, malware, privacy, authentication | borg, berners-lee        |
| human-computer-interaction | technology | usability, user interface, accessibility, affordance, interaction design, UX    | norman                    |
| responsible-innovation     | technology | technology ethics, digital equity, responsible, technology impact, digital divide | gates-m, hicks, joy     |

Agent affinity means the skill's content is preferentially loaded into the
listed agent's context. Multiple affinities mean the skill is relevant to
more than one specialist.

## 5. Team Configurations

Teams are pre-composed agent groups for common assessment and design patterns.

| Team                  | Agents                                            | Use When                                             |
|-----------------------|---------------------------------------------------|------------------------------------------------------|
| tech-assessment-team  | berners-lee, borg, gates-m, joy, hicks, norman, resnick | Multi-domain assessment, technology policy, cross-cutting evaluation |
| design-team           | norman, berners-lee, borg, resnick                | Design review, prototype evaluation, accessibility audit |
| ethics-team           | joy, hicks, gates-m, resnick                      | Ethical evaluation, social impact, labor analysis, equity audit |

**tech-assessment-team** is the full department. Use it for questions that
span multiple technology domains or require the broadest possible expertise.

**design-team** pairs the HCI specialist (Norman) with the systems architect
(Berners-Lee), the infrastructure engineer (Borg), and the pedagogy guide
(Resnick). Use it when the primary goal is evaluating or creating technology
designs.

**ethics-team** is the social impact pipeline. Joy assesses risk, Hicks
analyzes social construction and labor, Gates-M evaluates equity, and Resnick
ensures the framing is accessible and considers creative agency.

## 6. Grove Record Types

All department work products are persisted as Grove records under the
`technology-department` namespace. Five record types are defined:

| Record Type      | Produced By              | Key Fields                                                    |
|------------------|--------------------------|---------------------------------------------------------------|
| TechAnalysis     | borg, hicks, joy         | System analyzed, components, interactions, failure modes, social context |
| TechDesign       | norman, berners-lee      | Interface evaluated, heuristic violations, affordances, recommendations |
| TechAssessment   | joy, gates-m, hicks      | Risk scores, equity dimensions, impact evidence, stakeholder analysis |
| TechExplanation  | resnick, all agents      | Concept, target level, scaffolding, hands-on activities       |
| TechSession      | berners-lee              | Session ID, queries, dispatches, work product links, timestamps |

Records are content-addressed and immutable once written. TechSession records
link all work products from a single interaction, providing an audit trail from
query to result.

## 7. College Integration

The chipset connects to the college technology department concept graph:

- **Concept graph read/write**: Agents can read existing concept definitions and
  write new ones when a topic is encountered that the graph does not yet cover.
- **Try Session generation**: When a TechExplanation is produced, the chipset can
  automatically generate a Try Session (interactive practice) based on the
  explanation content and the learner's position in the concept graph.
- **Learning pathway updates**: Completed analyses, designs, and explanations
  update the learner's progress along college-defined pathways.
- **Five wings** map to the college technology department structure:
  1. Tools & Simple Machines
  2. Systems & Processes
  3. Design & Engineering Process
  4. Digital Technology Foundations
  5. Technology & Society

Each skill and Grove record type aligns to one or more wings, so work products
are automatically filed into the correct part of the concept graph.

## 8. Customization Guide

The technology department follows the department template pattern. To fork it
for another domain:

### Step 1: Copy the chipset directory

```bash
cp -r examples/chipsets/technology-department examples/chipsets/your-department
```

### Step 2: Rename agents

Edit `chipset.yaml` and replace agent names, roles, and historical figure
references with domain-appropriate experts.

### Step 3: Replace skills with domain-appropriate content

Swap the six technology skills for your domain's equivalents. Each skill needs:
- A `domain` value
- A `description` summarizing coverage
- A `triggers` list of natural language patterns
- An `agent_affinity` mapping

### Step 4: Define new Grove record types

Replace the five `Tech*` record types with domain-appropriate types.

### Step 5: Map to the target college department

Update the `college` section with the target department and its wings.

### Step 6: Update evaluation gates

Review and adjust the `evaluation.gates` section for domain-specific checks.

## 9. Architecture Notes

### Why router topology

The router topology places a single agent (Berners-Lee) as the entry point
for all queries. Benefits:

1. **Classification**: Berners-Lee determines which domain(s) a query touches
   before dispatching.
2. **Synthesis**: For multi-domain queries, Berners-Lee collects and merges
   results from multiple specialists.
3. **CAPCOM boundary**: The user interacts with exactly one agent.

### Why 3 Opus / 4 Sonnet

- **Opus agents** (berners-lee, borg, joy): Routing and synthesis requires
  understanding all six domains. Systems analysis requires deep technical
  reasoning. Risk assessment requires multi-step consequential reasoning.
- **Sonnet agents** (gates-m, hicks, norman, resnick): Impact evaluation,
  social analysis, HCI assessment, and pedagogical framing benefit from fast
  turnaround. These tasks are well-bounded and pattern-rich.

### Why this team structure

- **Full assessment**: needs every perspective (all 7 agents)
- **Design-focused**: needs the creative-technical pipeline (4 agents)
- **Ethics-focused**: needs the social-impact pipeline (4 agents)

### Relationship to Coding Department

The Technology Department and the Coding Department are complementary:

- **Technology Department** provides literacy, evaluation, design, and ethics --
  understanding technology broadly.
- **Coding Department** provides programming skill -- creating software specifically.

A technology department agent like Norman might evaluate a user interface
designed by a coding department agent. An ethics team assessment might inform
the requirements that a coding team implements. The departments share no agents
but frequently exchange work products.

### CAPCOM boundary

The CAPCOM pattern means only Berners-Lee speaks to the user. Other agents
communicate through Berners-Lee via internal dispatch. This is enforced by the
`is_capcom: true` flag.
