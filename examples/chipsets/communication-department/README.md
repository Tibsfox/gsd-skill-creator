---
name: communication-department
type: chipset
category: chipset
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-11
first_path: examples/chipsets/communication-department/README.md
description: >
  Coordinated communication department -- seven named agents, six knowledge
  skills, three teams. 12th department in the college structure, forked from
  the math-department template pattern.
superseded_by: null
---

# Communication Department

## 1. What is the Communication Department?

The Communication Department chipset is a coordinated set of reasoning agents, domain skills, and pre-composed teams that together provide structured communication support across public speaking, active listening, interpersonal communication, persuasion and rhetoric, conflict resolution, and media literacy. It is the 12th department in the college structure and the second humanities department (after philosophy) to instantiate the department template pattern. Incoming requests are classified by a router agent (Aristotle-C), dispatched to the appropriate specialist, and all work products are persisted as Grove records linked to the college concept graph.

## 2. Quick Start

Install the chipset into your gsd-skill-creator project:

```bash
# From the gsd-skill-creator root
cp -r examples/chipsets/communication-department .claude/chipsets/communication-department
```

The chipset is activated when any of the six skill trigger patterns match an incoming query. Aristotle-C (the router agent) classifies the query domain and dispatches to the appropriate specialist agent. No explicit activation command is needed -- the skill-integration layer loads the chipset based on context.

To verify the chipset is recognized:

```bash
# Check that the YAML parses cleanly
node -e "const yaml = require('yaml'); const fs = require('fs'); \
  console.log(yaml.parse(fs.readFileSync('.claude/chipsets/communication-department/chipset.yaml', 'utf8')).name)"
# Expected output: communication-department-v1.0
```

## 3. Agent Roster

Seven agents form the department. Three run on Opus (for tasks requiring deep rhetorical reasoning and synthesis), four on Sonnet (for systematically analytical and pedagogical tasks).

| Name           | Historical Figure           | Role                                                   | Model  | Tools                        |
|----------------|-----------------------------|---------------------------------------------------------|--------|------------------------------|
| aristotle-c    | Aristotle of Stagira        | Department chair -- classification, routing, synthesis, rhetorical analysis | opus   | Read, Glob, Grep, Bash, Write |
| douglass       | Frederick Douglass          | Public speaking specialist -- delivery, advocacy, oral persuasion | opus   | Read, Grep, Bash             |
| wollstonecraft | Mary Wollstonecraft         | Argument specialist -- persuasive writing, argument mapping, fallacy detection | sonnet | Read, Grep                   |
| king           | Martin Luther King Jr.      | Rhetoric specialist -- audience connection, rhetorical structure, leadership communication | opus   | Read, Grep, Bash             |
| tannen         | Deborah Tannen              | Interpersonal specialist -- conversational dynamics, cross-cultural communication, style analysis | sonnet | Read, Grep                   |
| mcluhan        | Marshall McLuhan            | Media specialist -- media ecology, platform analysis, medium/message relationship | sonnet | Read, Grep, Bash             |
| freire         | Paulo Freire                | Pedagogy specialist -- dialogical education, power analysis, facilitation design | sonnet | Read, Write                  |

Aristotle-C is the CAPCOM (single point of contact for the user). All other agents receive dispatched subtasks and return results through Aristotle-C.

## 4. Skill Inventory

Six skills provide domain knowledge that agents draw on during execution.

| Skill                        | Domain          | Trigger Patterns                                                                        | Agent Affinity                    |
|------------------------------|-----------------|-----------------------------------------------------------------------------------------|-----------------------------------|
| public-speaking              | communication   | speech, presentation, deliver, public speaking, stage fright, audience                  | douglass, king                    |
| active-listening             | communication   | listening, paraphrase, understand what they said, miscommunication, not hearing          | tannen, freire                    |
| interpersonal-communication  | communication   | interpersonal, relationship, feedback, conversation, self-disclosure, Johari            | tannen, wollstonecraft            |
| persuasion-rhetoric          | communication   | persuade, argument, rhetoric, ethos, pathos, logos, fallacy, convince                   | aristotle-c, wollstonecraft, king |
| conflict-resolution          | communication   | conflict, disagreement, mediation, negotiate, de-escalate, difficult conversation       | freire, tannen                    |
| media-literacy               | communication   | media, news, propaganda, misinformation, platform, algorithm, medium is the message     | mcluhan, tannen, aristotle-c      |

Agent affinity means the skill's content is preferentially loaded into the listed agent's context. Multiple affinities mean the skill is relevant to more than one specialist.

## 5. Team Configurations

Teams are pre-composed agent groups for common problem shapes.

| Team                          | Agents                                                        | Use When                                                 |
|-------------------------------|---------------------------------------------------------------|----------------------------------------------------------|
| communication-workshop-team   | aristotle-c, douglass, wollstonecraft, king, tannen, mcluhan, freire | Multi-domain, research-level, or full-analysis requests  |
| debate-team                   | douglass, wollstonecraft, king, freire                        | Debate preparation, argument construction, persuasive speech |
| media-analysis-team           | mcluhan, tannen, aristotle-c, freire                          | Platform analysis, media comparison, propaganda detection |

**communication-workshop-team** is the full department. Use it for problems that span multiple communication domains or require the broadest possible expertise.

**debate-team** pairs the delivery coach (Douglass) with the argument architect (Wollstonecraft), the audience strategist (King), and the ethical analyst (Freire). Use it when the primary goal is constructing, evaluating, or stress-testing persuasive arguments.

**media-analysis-team** combines the media ecologist (McLuhan), the conversational analyst (Tannen), the rhetorical analyst (Aristotle-C), and the critical analyst (Freire). Use it for understanding how media technologies and platforms shape communication.

## 6. Grove Record Types

All department work products are persisted as Grove records under the `communication-department` namespace. Five record types are defined:

| Record Type              | Produced By                          | Key Fields                                                                |
|--------------------------|--------------------------------------|---------------------------------------------------------------------------|
| CommunicationAnalysis    | aristotle-c, douglass, tannen, mcluhan, freire | subject, analysis framework, findings, techniques identified, recommendations |
| SpeechDraft              | king, douglass                       | topic, audience, rhetorical strategy, structure, key passages, delivery notes |
| ArgumentMap              | wollstonecraft                       | thesis, claims with Toulmin structure, counterarguments, rhetorical strategy |
| CommunicationExplanation | freire, tannen                       | topic, target level, explanation body, dialogue questions, prerequisites   |
| CommunicationSession     | aristotle-c                          | session ID, queries, dispatches, work product links, timestamps           |

Records are content-addressed and immutable once written. CommunicationSession records link all work products from a single interaction, providing an audit trail from query to result.

## 7. College Integration

The chipset connects to the college communication department concept graph:

- **Concept graph read/write**: Agents can read existing concept definitions and write new ones when a topic is encountered that the graph does not yet cover.
- **Try Session generation**: When a CommunicationExplanation is produced, the chipset can automatically generate a Try Session (interactive practice) based on the explanation content and the learner's current position in the concept graph.
- **Learning pathway updates**: Completed analyses, drafts, and explanations update the learner's progress along college-defined pathways.
- **Five wings** map to the college communication department structure:
  1. Foundations of Speaking & Listening
  2. Nonverbal Communication & Presence
  3. Structured Presentation
  4. Discussion, Debate & Collaboration
  5. Communication Across Contexts

Each skill and Grove record type aligns to one or more wings, so work products are automatically filed into the correct part of the concept graph.

## 8. Customization Guide

The communication department follows the same department template pattern as the math department. To create a variant for another domain, follow the customization steps in the math department README (copy, rename agents, replace skills, define Grove types, map to college department, update evaluation gates).

## 9. Architecture Notes

### Why router topology

The router topology places a single agent (Aristotle-C) as the entry point for all queries. This provides classification before dispatch, synthesis for multi-domain queries, and a consistent user-facing voice (the CAPCOM boundary).

### Why 3 Opus / 4 Sonnet

Model assignment follows the reasoning depth required by each role:

- **Opus agents** (aristotle-c, douglass, king): Routing and synthesis (Aristotle-C) requires understanding all six domains well enough to classify correctly. Public speaking coaching (Douglass) requires nuanced delivery assessment. Audience connection and rhetorical structure (King) require deep understanding of how language creates emotional and intellectual responses.
- **Sonnet agents** (wollstonecraft, tannen, mcluhan, freire): Argument mapping (Wollstonecraft), conversational analysis (Tannen), media ecology (McLuhan), and pedagogical scaffolding (Freire) are analytically systematic tasks where Sonnet's speed matters more than additional reasoning depth.

### Why this team structure

The three teams cover the three most common query shapes:

- **Full workshop**: needs every perspective (all 7 agents)
- **Debate**: needs the argumentative core (4 agents, no media or conversational style analysis)
- **Media analysis**: needs the media-focused pipeline (4 agents, no delivery coaching or argument construction)

Teams are not exclusive. Aristotle-C can assemble ad-hoc groups for queries that do not fit any pre-composed team.

### CAPCOM boundary

The CAPCOM (Capsule Communicator) pattern means only Aristotle-C speaks to the user. Other agents communicate through Aristotle-C via internal dispatch. This is enforced by the `is_capcom: true` flag -- only one agent in the chipset may carry this flag.

### Historical figure selection

The seven historical figures were chosen to represent the breadth of communication studies:

- **Aristotle** (384--322 BCE) -- founded the field of rhetoric
- **Frederick Douglass** (1818--1895) -- demonstrated the power of oratory to change society
- **Mary Wollstonecraft** (1759--1797) -- pioneered persuasive writing as social advocacy
- **Martin Luther King Jr.** (1929--1968) -- exemplified audience connection and visionary rhetoric
- **Deborah Tannen** (1945--) -- revealed how conversational style shapes interpersonal understanding
- **Marshall McLuhan** (1911--1980) -- founded media ecology and transformed how we understand technology
- **Paulo Freire** (1921--1997) -- transformed education through dialogical pedagogy

Together they span 24 centuries, three continents, and the full arc from classical rhetoric to digital media theory.

## 10. Relationship to Other Departments

The communication department complements several other departments in the college:

- **Philosophy department**: Shares analytical reasoning foundations. Aristotle appears in both (as a philosopher and as a rhetorician). Communication focuses on practical persuasion and interaction; philosophy focuses on logical analysis and epistemology.
- **Psychology department**: Communication's interpersonal and conflict resolution domains overlap with social psychology. The communication department focuses on the communicative behavior itself; psychology focuses on the cognitive and emotional mechanisms beneath it.
- **History department**: Communication analysis often requires historical context (how did radio change politics? what was the rhetorical situation of the Civil Rights movement?). The communication department provides the analytical framework; history provides the factual record.
- **English/Literature**: Persuasive writing overlaps with composition and rhetoric courses in English departments. The communication department focuses on persuasive and interpersonal communication; English focuses on literary analysis and creative writing.

Future integration could formalize cross-department dispatch, allowing Aristotle-C to request historical context from the history department or psychological framing from psychology when a communication query requires it.
