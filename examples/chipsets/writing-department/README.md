---
name: writing-department
type: chipset
category: chipset
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-11
first_path: examples/chipsets/writing-department/README.md
description: >
  Coordinated writing department — seven named agents, six knowledge
  skills, three teams. 18th instantiation of the department template pattern.
superseded_by: null
---

# Writing Department

## 1. What is the Writing Department?

The Writing Department chipset is a coordinated set of writing agents, domain
skills, and pre-composed teams that together provide structured writing support
across fiction, poetry, essay, research writing, revision, and voice/style
development. It is the 18th instantiation of the "department template pattern"
in gsd-skill-creator: a chipset architecture designed to be forked and remapped
to any academic or professional domain. Incoming requests are classified by a
router agent (Woolf), dispatched to the appropriate specialist, and all work
products are persisted as Grove records linked to the college concept graph.

## 2. Quick Start

Install the chipset into your gsd-skill-creator project:

```bash
# From the gsd-skill-creator root
cp -r examples/chipsets/writing-department .claude/chipsets/writing-department
```

The chipset is activated when any of the six skill trigger patterns match an
incoming query. Woolf (the router agent) classifies the query domain and
dispatches to the appropriate specialist agent. No explicit activation command
is needed -- the skill-integration layer loads the chipset based on context.

To verify the chipset is recognized:

```bash
# Check that the YAML parses cleanly
node -e "const yaml = require('yaml'); const fs = require('fs'); \
  console.log(yaml.parse(fs.readFileSync('.claude/chipsets/writing-department/chipset.yaml', 'utf8')).name)"
# Expected output: writing-department-v1.0
```

## 3. Agent Roster

Seven agents form the department. Three run on Opus (for tasks requiring deep
reasoning), four on Sonnet (for throughput-oriented composition and pedagogy).

| Name      | Historical Figure          | Role                                                    | Model  | Tools                        |
|-----------|----------------------------|---------------------------------------------------------|--------|------------------------------|
| woolf     | Virginia Woolf             | Department chair — classification, routing, synthesis   | opus   | Read, Glob, Grep, Bash, Write |
| baldwin   | James Baldwin              | Essay and voice — nonfiction craft, moral clarity       | opus   | Read, Grep, Bash             |
| angelou   | Maya Angelou               | Poetry and memoir — form, sound, rhythm, embodied voice | sonnet | Read, Bash                   |
| orwell    | George Orwell              | Clarity and argument — structure, jargon elimination    | opus   | Read, Grep, Bash             |
| le-guin   | Ursula K. Le Guin          | Fiction and worldbuilding — speculative construction    | sonnet | Read, Bash                   |
| strunk    | William Strunk Jr.         | Mechanics and style — sentence economy, grammar         | sonnet | Read, Bash                   |
| calkins   | Lucy Calkins               | Pedagogy — workshop structure, conferencing, assessment | sonnet | Read, Write                  |

Woolf is the CAPCOM (single point of contact for the user). All other agents
receive dispatched subtasks and return results through Woolf.

## 4. Skill Inventory

Six skills provide domain knowledge that agents draw on during execution.

| Skill               | Domain  | Trigger Patterns                                                            | Agent Affinity              |
|---------------------|---------|-----------------------------------------------------------------------------|-----------------------------|
| narrative-craft     | writing | write a story, character development, point of view, plot structure, worldbuilding, fiction, narrative | woolf, le-guin, angelou     |
| expository-writing  | writing | essay, thesis, argument, persuade, expository, op-ed, nonfiction           | orwell, baldwin, calkins    |
| poetry-form         | writing | poem, poetry, sonnet, haiku, meter, stanza, verse, rhyme                   | angelou, woolf              |
| revision-editing    | writing | revise, edit, tighten, workshop, feedback, draft, rewrite                  | strunk, orwell, calkins, baldwin |
| research-writing    | writing | research paper, cite, sources, bibliography, literature review, MLA, APA, academic | orwell, strunk, calkins     |
| voice-style         | writing | voice, style, tone, register, diction, find my voice, writing style        | woolf, baldwin, angelou, strunk, orwell |

Agent affinity means the skill's content is preferentially loaded into the
listed agent's context. Multiple affinities mean the skill is relevant to
more than one specialist.

## 5. Team Configurations

Teams are pre-composed agent groups for common problem shapes.

| Team                      | Agents                                               | Use When                                              |
|---------------------------|------------------------------------------------------|-------------------------------------------------------|
| writers-workshop-team     | woolf, baldwin, angelou, orwell, le-guin, strunk, calkins | Multi-form, advanced, or full-workshop requests       |
| editing-team              | orwell, strunk, baldwin, calkins                     | Revision, argument strengthening, style audit         |
| genre-team                | le-guin, angelou, woolf, calkins                     | Creative writing, form exploration, genre analysis    |

**writers-workshop-team** is the full department. Use it for problems that
span multiple writing forms or require the broadest possible expertise.

**editing-team** pairs the clarity specialist (Orwell) with the sentence
engineer (Strunk), the voice guardian (Baldwin), and the pedagogy guide
(Calkins). Use it when the primary goal is revising, tightening, or
strengthening existing prose.

**genre-team** is the creative composition pipeline. Le Guin handles fiction
and worldbuilding, Angelou handles poetry and memoir, Woolf synthesizes
across genres, and Calkins supports the creative process at the writer's level.

## 6. Grove Record Types

All department work products are persisted as Grove records under the
`writing-department` namespace. Five record types are defined:

| Record Type        | Produced By                  | Key Fields                                                     |
|--------------------|------------------------------|----------------------------------------------------------------|
| WritingAnalysis    | woolf, baldwin, angelou      | subject, voice analysis, argument structure, craft moves       |
| WritingDraft       | baldwin, angelou, le-guin    | form, draft text, craft notes, structure map, voice register   |
| WritingCritique    | orwell, strunk, baldwin      | assessment, revision directives, edits, metrics                |
| WritingExplanation | calkins, all agents          | topic, explanation, exercises, workshop plans, conference moves |
| WritingSession     | woolf                        | session ID, queries, dispatches, work product links, timestamps |

Records are content-addressed and immutable once written. WritingSession records
link all work products from a single interaction, providing an audit trail from
query to result.

## 7. College Integration

The chipset connects to the college writing department concept graph:

- **Concept graph read/write**: Agents can read existing concept definitions and
  write new ones when a technique or form is encountered that the graph does not
  yet cover.
- **Try Session generation**: When a WritingExplanation is produced, the chipset
  can automatically generate a Try Session (interactive practice) based on the
  explanation content and the learner's current position in the concept graph.
- **Learning pathway updates**: Completed drafts, critiques, and explanations
  update the learner's progress along college-defined pathways.
- **Five wings** map to the college writing department structure:
  1. Reading as Discovery
  2. Story & Narrative
  3. Poetry & Language
  4. The Writing Process
  5. Literary Analysis

Each skill and Grove record type aligns to one or more wings, so work products
are automatically filed into the correct part of the concept graph.

## 8. Customization Guide

The writing department follows the same template pattern as the math department.
To create a department for another domain, follow these steps:

### Step 1: Copy the chipset directory

```bash
cp -r examples/chipsets/writing-department examples/chipsets/journalism-department
```

### Step 2: Rename agents

Edit `chipset.yaml` and replace agent names, roles, and historical figure
references. For a journalism department you might use: murrow (router/chair),
woodward (investigation), didion (feature/essay), tarbell (data/records),
cronkite (broadcast), strunk (editing, reusable), amanpour (international).
Also rename any corresponding agent directories.

### Step 3: Replace skills with domain-appropriate content

Swap the six writing skills for journalism equivalents. Each skill needs:
- A `domain` value (e.g., `journalism`)
- A `description` summarizing what the skill covers
- A `triggers` list of natural language patterns that activate the skill
- An `agent_affinity` mapping to the renamed agents

### Step 4: Define new Grove record types

Replace the five `WritingX` record types with domain-appropriate types. A
journalism department might use: JournalismStory, JournalismInvestigation,
JournalismAnalysis, JournalismExplanation, JournalismSession.

### Step 5: Map to the target college department

Update the `college` section:
- Set `department` to the target
- Define wings that match the college department structure
- Decide whether `concept_graph.write` should be enabled

### Step 6: Update evaluation gates

Review the `evaluation.gates` section. Update `benchmark.domains_covered`
to list the new domain areas.

## 9. Architecture Notes

### Why router topology

The router topology places a single agent (Woolf) as the entry point for all
queries. This provides three benefits:

1. **Classification**: Woolf determines which form(s) a query touches before
   dispatching, preventing wasted work by non-relevant agents.
2. **Synthesis**: For multi-form queries, Woolf collects results from multiple
   specialists and synthesizes a unified response.
3. **CAPCOM boundary**: The user interacts with exactly one agent. This reduces
   cognitive load and provides a consistent communication style.

### Why 3 Opus / 4 Sonnet

Model assignment follows the reasoning depth required by each role:

- **Opus agents** (woolf, baldwin, orwell): These roles require the deepest
  reasoning. Routing and synthesis (Woolf) must understand all six domains
  well enough to classify correctly. Essay voice (Baldwin) and argument
  analysis (Orwell) require nuanced judgment where errors compound.
- **Sonnet agents** (angelou, le-guin, strunk, calkins): These roles are
  well-bounded. Poetry composition, fiction craft, sentence editing, and
  pedagogical scaffolding benefit from fast turnaround. Sonnet's speed
  matters more than its depth ceiling for these tasks.

### Why this team structure

The three teams cover the three most common query shapes:

- **Full workshop**: needs every perspective (all 7 agents)
- **Editing-focused**: needs the analytical-editorial core (4 agents, no fiction/poetry composition)
- **Genre-focused**: needs the creative pipeline (4 agents, no argument analysis or mechanics)

Teams are not exclusive. Woolf can assemble ad-hoc groups for queries that
do not fit any pre-composed team.

### CAPCOM boundary

The CAPCOM (Capsule Communicator) pattern means only Woolf speaks to the
user. Other agents communicate through Woolf via internal dispatch. This is
enforced by the `is_capcom: true` flag -- only one agent in the chipset may
carry this flag.

## 10. Relationship to Other Departments

The writing department connects to several other departments in the college:

- **Reading Department**: Close reading skills feed into literary analysis.
  Writing department agents reference reading concepts when analyzing texts.
- **Communication Department**: Public speaking, rhetoric, and argument overlap
  with expository writing and voice development. The writing department handles
  written expression; communication handles oral and multimodal expression.
- **History Department**: Historical context is essential to literary analysis.
  When a writing agent needs historical framing, it references history
  department concepts.
- **Philosophy Department**: Argumentation theory (Toulmin model, logical
  fallacies) overlaps with expository writing. The writing department handles
  the craft of argument; philosophy handles the logic.

These connections are implemented through cross-department concept references
in the college graph, not through direct agent communication. Each department
maintains its own CAPCOM boundary.
