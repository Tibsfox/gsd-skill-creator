---
name: reading-department
type: chipset
category: chipset
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/chipsets/reading-department/README.md
description: >
  Coordinated reading department -- seven named agents, six knowledge
  skills, three teams. 19th department in the college structure.
superseded_by: null
---

# Reading Department

## 1. What is the Reading Department?

The Reading Department chipset is a coordinated set of reading agents, domain
skills, and pre-composed teams that together provide structured support across
phonics and decoding, vocabulary development, reading comprehension, critical
reading, literary analysis, and information literacy. It is the 19th department
in the college structure, forked from the math-department template pattern.
Incoming requests are classified by a router agent (Austen), dispatched to the
appropriate specialist, and all work products are persisted as Grove records
linked to the college concept graph.

## 2. Quick Start

Install the chipset into your gsd-skill-creator project:

```bash
# From the gsd-skill-creator root
cp -r examples/chipsets/reading-department .claude/chipsets/reading-department
```

The chipset is activated when any of the six skill trigger patterns match an
incoming query. Austen (the router agent) classifies the query domain and
dispatches to the appropriate specialist agent. No explicit activation command
is needed -- the skill-integration layer loads the chipset based on context.

To verify the chipset is recognized:

```bash
# Check that the YAML parses cleanly
node -e "const yaml = require('yaml'); const fs = require('fs'); \
  console.log(yaml.parse(fs.readFileSync('.claude/chipsets/reading-department/chipset.yaml', 'utf8')).name)"
# Expected output: reading-department-v1.0
```

## 3. Agent Roster

Seven agents form the department. Three run on Opus (for tasks requiring deep
interpretive reasoning), four on Sonnet (for well-bounded analytical and
pedagogical tasks).

| Name       | Historical Figure          | Role                                              | Model  | Tools                        |
|------------|----------------------------|----------------------------------------------------|--------|------------------------------|
| austen     | Jane Austen                | Department chair -- classification, routing, synthesis | opus   | Read, Glob, Grep, Bash, Write |
| morrison   | Toni Morrison              | Literary analyst -- narrative voice, race, representation | opus   | Read, Grep, Bash             |
| borges     | Jorge Luis Borges          | Intertextuality -- allusion, influence, metafiction    | sonnet | Read, Grep                   |
| achebe     | Chinua Achebe              | Critical reader -- postcolonial, bias, world literature | opus   | Read, Grep, Bash             |
| rosenblatt | Louise Rosenblatt          | Reader response -- transactional theory, comprehension | sonnet | Read, Write                  |
| chomsky-r  | Noam Chomsky (reading)     | Linguist -- phonology, morphology, syntax for reading  | sonnet | Read, Bash                   |
| clay       | Marie Clay                 | Pedagogy -- Running Records, assessment, scaffolding   | sonnet | Read, Write                  |

Austen is the CAPCOM (single point of contact for the user). All other agents
receive dispatched subtasks and return results through Austen.

## 4. Skill Inventory

Six skills provide domain knowledge that agents draw on during execution.

| Skill                   | Domain  | Trigger Patterns                                                          | Agent Affinity         |
|-------------------------|---------|---------------------------------------------------------------------------|------------------------|
| phonics-decoding        | reading | phonics, decode, sound out, syllable, letter sounds, spelling pattern     | chomsky-r, clay        |
| vocabulary-development  | reading | vocabulary, word meaning, context clues, prefix, suffix, root word, figurative language, idiom | chomsky-r, austen, morrison |
| reading-comprehension   | reading | comprehension, main idea, summarize, inference, text structure, understand the passage | rosenblatt, clay       |
| critical-reading        | reading | bias, argument, credibility, evaluate this source, propaganda, rhetoric   | achebe                 |
| literary-analysis       | reading | literary analysis, symbolism, theme, narrative voice, point of view, irony, allusion, metaphor | morrison, borges, austen |
| information-literacy    | reading | research, find sources, evaluate this website, citation, plagiarism, database search | achebe, rosenblatt     |

Agent affinity means the skill's content is preferentially loaded into the
listed agent's context. Multiple affinities mean the skill is relevant to
more than one specialist.

## 5. Team Configurations

Teams are pre-composed agent groups for common reading problem shapes.

| Team                    | Agents                                                   | Use When                                             |
|-------------------------|----------------------------------------------------------|------------------------------------------------------|
| reading-analysis-team   | austen, morrison, borges, achebe, rosenblatt, chomsky-r, clay | Multi-domain, advanced, or full-analysis requests    |
| literacy-team           | clay, chomsky-r, rosenblatt, austen                      | Decoding, vocabulary, fluency, or comprehension skill instruction |
| book-club-team          | morrison, borges, achebe, clay                            | Book discussions, close reading, cross-text comparison |

**reading-analysis-team** is the full department. Use it for problems that
span multiple reading domains or require the broadest possible expertise.

**literacy-team** pairs the assessment specialist (Clay) with the linguist
(Chomsky-R), the reader-response specialist (Rosenblatt), and the chair
(Austen). Use it when the primary goal is building foundational or
developmental reading skills.

**book-club-team** is the interpretive discussion team. Morrison leads
literary analysis, Borges traces intertextual connections, Achebe provides
critical perspective, and Clay ensures accessibility across reader levels.

## 6. Grove Record Types

All department work products are persisted as Grove records under the
`reading-department` namespace. Five record types are defined:

| Record Type           | Produced By                      | Key Fields                                                    |
|-----------------------|----------------------------------|---------------------------------------------------------------|
| ReadingAnalysis       | achebe, clay, chomsky-r, rosenblatt | text/reader analyzed, focus, analysis, recommendations        |
| TextAnnotation        | morrison, borges, achebe, chomsky-r | passage, span-based annotations, annotation type              |
| LiteraryInterpretation| morrison, borges                 | work, author, focus, interpretation, devices, themes, connections |
| ReadingExplanation    | rosenblatt, clay                 | topic, level, explanation, prerequisites, follow-ups          |
| ReadingSession        | austen                           | session ID, queries, dispatches, work product links, timestamps |

Records are content-addressed and immutable once written. ReadingSession records
link all work products from a single interaction, providing an audit trail from
query to response.

## 7. College Integration

The chipset connects to the college reading department concept graph:

- **Concept graph read/write**: Agents can read existing concept definitions and
  write new ones when a topic is encountered that the graph does not yet cover.
- **Try Session generation**: When a ReadingExplanation is produced, the chipset
  can automatically generate a Try Session (interactive practice) based on the
  explanation content and the learner's position in the concept graph.
- **Learning pathway updates**: Completed analyses, interpretations, and
  explanations update the learner's progress along college-defined pathways.
- **Five wings** map to the college reading department structure:
  1. Foundations of Reading
  2. Vocabulary & Language
  3. Comprehension & Meaning-Making
  4. Critical Reading & Analysis
  5. Reading Across the Curriculum

Each skill and Grove record type aligns to one or more wings, so work products
are automatically filed into the correct part of the concept graph.

## 8. Customization Guide

To create a department for another domain from this template:

### Step 1: Copy the chipset directory

```bash
cp -r examples/chipsets/reading-department examples/chipsets/your-department
```

### Step 2: Rename agents

Edit `chipset.yaml` and replace agent names, roles, and historical figure
references. Choose figures who embody the key practices of your domain.

### Step 3: Replace skills with domain-appropriate content

Swap the six reading skills for your domain's equivalents. Each skill needs:
- A `domain` value
- A `description` summarizing coverage
- A `triggers` list of natural language patterns
- An `agent_affinity` mapping to the renamed agents

### Step 4: Define new Grove record types

Replace the five `ReadingX` record types with domain-appropriate types.

### Step 5: Map to the target college department

Update the `college` section:
- Set `department` to the target
- Define wings that match the college department structure

### Step 6: Update evaluation gates

Review and update `benchmark.domains_covered` to list the new domain areas.

## 9. Architecture Notes

### Why router topology

The router topology places a single agent (Austen) as the entry point for all
queries. This provides classification (determining what the user needs),
synthesis (merging specialist outputs), and CAPCOM boundary (one voice to the
user).

### Why 3 Opus / 4 Sonnet

Model assignment follows the interpretive depth required by each role:

- **Opus agents** (austen, morrison, achebe): These roles require the deepest
  reasoning. Routing and synthesis (Austen) must understand all six domains.
  Literary analysis (Morrison) requires sustained close reading of prose.
  Critical analysis (Achebe) requires holding multiple cultural frameworks
  simultaneously.
- **Sonnet agents** (borges, rosenblatt, chomsky-r, clay): These roles are
  well-bounded. Intertextual mapping (Borges) works within defined relationship
  types. Reader response (Rosenblatt) works within the transactional framework.
  Linguistic analysis (Chomsky-R) applies established parsing methods. Pedagogy
  (Clay) follows structured assessment protocols.

### Why this team structure

The three teams cover the three most common reading problem shapes:

- **Full analysis**: needs every perspective (all 7 agents)
- **Skill-focused**: needs the instructional core (4 agents, no literary/critical analysis)
- **Discussion**: needs the interpretive core (4 agents, no linguistic/foundational work)

Teams are not exclusive. Austen can assemble ad-hoc groups for queries that
do not fit any pre-composed team.

### CAPCOM boundary

The CAPCOM (Capsule Communicator) pattern means only Austen speaks to the
user. Other agents communicate through Austen via internal dispatch. This is
enforced by the `is_capcom: true` flag -- only one agent in the chipset may
carry this flag.

## 10. Relationship to Other Departments

The Reading Department connects to several other college departments:

- **Writing Department** provides the production counterpart to reading's
  comprehension. Reading and writing are reciprocal processes.
- **Languages Department** provides second-language reading support. Phonics
  and decoding operate differently across orthographies.
- **History Department** provides context for primary source reading.
  Information literacy and critical reading apply directly to historical texts.
- **Science Department** provides content for reading-across-the-curriculum.
  Technical document reading and scientific literacy are shared concerns.
- **Philosophy Department** provides logical reasoning frameworks that underpin
  argument analysis in critical reading.

These connections are conceptual, not structural. Each department operates
independently through its own chipset. Cross-department queries route through
the respective CAPCOM agents.
