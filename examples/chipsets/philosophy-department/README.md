---
name: philosophy-department
type: chipset
category: chipset
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-11
first_path: examples/chipsets/philosophy-department/README.md
description: >
  Coordinated philosophy department — seven named agents, six knowledge
  skills, three teams. Fourth department, first humanities — validates
  the department template pattern beyond STEM.
superseded_by: null
---

# Philosophy Department

## 1. What is the Philosophy Department?

The Philosophy Department chipset is a coordinated set of reasoning agents,
domain skills, and pre-composed teams that together provide structured
philosophical support across formal logic, ethics, epistemology, metaphysics,
political philosophy, and critical thinking. It is the fourth instantiation of
the "department template pattern" in gsd-skill-creator and the first to
represent a humanities discipline, validating that the architecture generalizes
beyond STEM domains. Incoming requests are classified by a router agent
(Socrates), dispatched to the appropriate specialist, and all work products are
persisted as Grove records linked to the college concept graph.

Philosophy differs from STEM departments in a fundamental way: its outputs are
arguments, analyses, and dilemmas rather than proofs, derivations, or
experiments. The Grove record types and agent roles reflect this shift. Where
the math department produces MathProof records with verification status, the
philosophy department produces PhilosophyArgument records with premise-inference
chains and PhilosophyDilemma records that present competing frameworks without
necessarily resolving to a single answer. This structural difference is the
core reason the department template needs a humanities instantiation — it
proves the pattern accommodates disciplines where reasoned disagreement is a
valid output.

## 2. Quick Start

Install the chipset into your gsd-skill-creator project:

```bash
# From the gsd-skill-creator root
cp -r examples/chipsets/philosophy-department .claude/chipsets/philosophy-department
```

The chipset is activated when any of the six skill trigger patterns match an
incoming query. Socrates (the router agent) classifies the query domain and
dispatches to the appropriate specialist agent. No explicit activation command
is needed — the skill-integration layer loads the chipset based on context.

To verify the chipset is recognized:

```bash
# Check that the YAML parses cleanly
node -e "const yaml = require('yaml'); const fs = require('fs'); \
  console.log(yaml.parse(fs.readFileSync('.claude/chipsets/philosophy-department/chipset.yaml', 'utf8')).name)"
# Expected output: philosophy-department-v1.0
```

## 3. Agent Roster

Seven agents form the department. Three run on Opus (for tasks requiring deep
reasoning and nuanced argumentation), four on Sonnet (for throughput-oriented
analysis and pedagogy).

| Name       | Historical Figure             | Role                                                    | Model  | Tools                        |
|------------|-------------------------------|---------------------------------------------------------|--------|------------------------------|
| socrates   | Socrates of Athens            | Department chair — classification, routing, Socratic dialogue, synthesis | opus   | Read, Glob, Grep, Bash, Write |
| aristotle  | Aristotle of Stagira         | Logician and epistemologist — formal logic, categories, systematic analysis | opus   | Read, Grep, Bash             |
| kant       | Immanuel Kant                | Ethicist — deontological reasoning, categorical imperative, transcendental analysis | sonnet | Read, Bash                   |
| beauvoir   | Simone de Beauvoir           | Existentialist — freedom, situated ethics, phenomenology, feminist philosophy | opus   | Read, Grep                   |
| confucius  | Confucius (Kong Qiu)         | Political philosopher — virtue governance, ritual propriety, relational ethics | sonnet | Read, Bash                   |
| nagarjuna  | Nagarjuna                    | Metaphysician — emptiness, dependent origination, two truths, deconstructive analysis | sonnet | Read, Bash                   |
| dewey      | John Dewey                   | Pedagogy guide — pragmatism, inquiry-based learning, democratic education | sonnet | Read, Write                  |

Socrates is the CAPCOM (single point of contact for the user). All other agents
receive dispatched subtasks and return results through Socrates.

### Agent Selection Rationale

The roster spans Western and Eastern traditions, ancient and modern thought,
and diverse philosophical methods:

- **Socrates** as router because the Socratic method — asking clarifying
  questions, exposing hidden assumptions, guiding toward insight — maps
  naturally to the classification and synthesis role. He does not answer; he
  routes to the one who can.
- **Aristotle** covers both formal logic (the Prior Analytics invented
  syllogistic reasoning) and epistemology (the Posterior Analytics). His
  systematic, taxonomic approach suits the agent that must categorize arguments
  precisely.
- **Kant** bridges ethics and epistemology. His categorical imperative provides
  the deontological framework, while his transcendental idealism offers a
  structured approach to the limits of knowledge.
- **Beauvoir** brings existentialist and feminist philosophy. Her concept of
  situated freedom — that ethical action depends on concrete circumstances —
  adds a dimension that purely abstract ethicists miss.
- **Confucius** represents political philosophy through the lens of virtue,
  propriety (li), and relational ethics (ren). His focus on governance through
  moral cultivation rather than coercion offers a non-Western political
  framework.
- **Nagarjuna** covers metaphysics from the Madhyamaka Buddhist tradition. His
  doctrine of emptiness (sunyata) and the two truths (conventional and
  ultimate) provides a rigorous deconstructive method for examining ontological
  claims.
- **Dewey** fills the pedagogy role. His pragmatism — the idea that philosophy
  must connect to lived experience — and his work in democratic education make
  him the natural choice for explaining philosophical concepts at appropriate
  levels.

## 4. Skill Inventory

Six skills provide domain knowledge that agents draw on during execution.

| Skill                  | Domain     | Trigger Patterns                                                                   | Agent Affinity        |
|------------------------|------------|------------------------------------------------------------------------------------|-----------------------|
| formal-logic           | philosophy | valid argument, syllogism, truth table, logical form, fallacy, modus ponens, predicate logic | aristotle             |
| ethics                 | philosophy | right or wrong, moral, ethical, ought, duty, virtue, consequentialism, deontological, categorical imperative | kant, beauvoir        |
| epistemology           | philosophy | knowledge, justified belief, skepticism, epistemology, certainty, a priori, empiricism, rationalism | aristotle, kant       |
| metaphysics            | philosophy | existence, reality, identity, free will, causation, substance, mind-body, emptiness, dependent origination | nagarjuna             |
| political-philosophy   | philosophy | justice, rights, social contract, governance, liberty, authority, legitimacy, common good | confucius             |
| critical-thinking      | philosophy | argument, assumption, bias, evidence, critical thinking, Socratic method, counterexample, thought experiment | socrates, dewey       |

Agent affinity means the skill's content is preferentially loaded into the
listed agent's context. Multiple affinities mean the skill is relevant to
more than one specialist.

### Skill Boundary Notes

Philosophy's six skills overlap more than mathematics' six. A question about
"Is free will compatible with determinism?" touches metaphysics (causation,
identity), epistemology (what can we know about determinism?), and ethics
(moral responsibility requires freedom?). Socrates handles this by dispatching
to the primary domain (metaphysics / Nagarjuna) while tagging secondary
domains so results can be cross-referenced. The trigger patterns are designed
to catch the primary domain; Socrates resolves ambiguity through classification
rather than trigger overlap.

## 5. Team Configurations

Teams are pre-composed agent groups for common problem shapes.

| Team                      | Agents                                                    | Use When                                               |
|---------------------------|-----------------------------------------------------------|--------------------------------------------------------|
| philosophy-seminar-team   | socrates, aristotle, kant, beauvoir, confucius, nagarjuna, dewey | Multi-domain, deep analysis, or full-department seminar requests |
| ethics-committee-team     | kant, beauvoir, confucius, dewey                          | Ethical dilemmas, moral reasoning, applied ethics, or value conflicts |
| dialectic-team            | socrates, aristotle, nagarjuna, dewey                     | Argument construction, debate analysis, or dialectical investigation |

**philosophy-seminar-team** is the full department. Use it for questions that
span multiple philosophical traditions or require the broadest possible range
of perspectives. A question like "What is the good life?" benefits from every
agent's tradition: Aristotelian eudaimonia, Kantian duty, Beauvoirian freedom,
Confucian ren, Nagarjunian emptiness, and Deweyan growth.

**ethics-committee-team** pairs the three moral philosophers (Kant, Beauvoir,
Confucius) with the pedagogy guide (Dewey). Kant brings deontological rigor,
Beauvoir brings situated and existentialist critique, Confucius brings virtue-
relational ethics, and Dewey synthesizes their outputs into accessible
explanations. Use this team when the primary goal is analyzing an ethical
dilemma or evaluating a moral claim.

**dialectic-team** is the argumentation pipeline. Socrates poses the question
and identifies assumptions. Aristotle formalizes the logical structure.
Nagarjuna deconstructs by finding where premises depend on unexamined
presuppositions. Dewey documents the dialectical process and its provisional
conclusions. Use this team when the goal is to stress-test an argument, explore
a paradox, or conduct a structured philosophical investigation.

## 6. Grove Record Types

All department work products are persisted as Grove records under the
`philosophy-department` namespace. Five record types are defined:

| Record Type            | Produced By                    | Key Fields                                                        |
|------------------------|--------------------------------|-------------------------------------------------------------------|
| PhilosophyArgument     | aristotle, socrates            | premises, inference steps, conclusion, validity status, tradition  |
| PhilosophyAnalysis     | beauvoir, kant, confucius      | subject, frameworks applied, perspectives, tensions, synthesis     |
| PhilosophyDilemma      | kant, beauvoir, confucius      | dilemma statement, competing frameworks, resolution paths, trade-offs |
| PhilosophyExplanation  | dewey                          | topic, target level, explanation body, prerequisites, tradition    |
| PhilosophySession      | socrates                       | session ID, queries, dispatches, work product links, timestamps   |

Records are content-addressed and immutable once written. PhilosophySession
records link all work products from a single interaction, providing an audit
trail from query to result.

### Record Type Design Choices

**PhilosophyArgument** replaces the math department's MathProof. Both have
step-by-step structure, but a philosophical argument carries a `tradition`
field (e.g., analytic, continental, Eastern) and its validity status may be
"valid but unsound" — a distinction that does not arise in mathematical proof.

**PhilosophyDilemma** is new to this department. Math has no equivalent because
mathematical problems resolve to answers. Philosophical dilemmas may have
multiple defensible resolutions depending on the framework applied. The record
captures competing paths rather than converging to one.

**PhilosophyAnalysis** covers the common case where a question requires
examining multiple perspectives without constructing a single argument. An
analysis of "What is consciousness?" would survey physicalist, dualist,
phenomenological, and Buddhist perspectives, noting tensions and overlaps.

## 7. College Integration

The chipset connects to the college philosophy department concept graph:

- **Concept graph read/write**: Agents can read existing concept definitions and
  write new ones when a topic is encountered that the graph does not yet cover.
- **Try Session generation**: When a PhilosophyExplanation is produced, the
  chipset can automatically generate a Try Session (interactive practice) based
  on the explanation content and the learner's current position in the concept
  graph. Philosophy Try Sessions use Socratic questioning and thought
  experiments rather than problem sets.
- **Learning pathway updates**: Completed arguments, analyses, and explanations
  update the learner's progress along college-defined pathways.
- **Five wings** map to the college philosophy department structure:
  1. Wonder & Questioning — the entry point; cultivating philosophical curiosity
  2. Logic & Reasoning — formal and informal logic, argument analysis
  3. Ethics — moral reasoning, applied ethics, meta-ethics
  4. Epistemology — knowledge, justification, skepticism
  5. Aesthetics — beauty, art, taste, the sublime

Each skill and Grove record type aligns to one or more wings, so work products
are automatically filed into the correct part of the concept graph.

### Wing-Skill Mapping

| Wing                    | Primary Skills                        | Notes                                          |
|-------------------------|---------------------------------------|------------------------------------------------|
| Wonder & Questioning    | critical-thinking                     | Gateway wing; every learner starts here        |
| Logic & Reasoning       | formal-logic, critical-thinking       | Formal and informal argument skills            |
| Ethics                  | ethics, political-philosophy          | Both individual and collective moral reasoning |
| Epistemology            | epistemology, metaphysics             | Overlaps: metaphysics raises epistemic issues  |
| Aesthetics              | (no dedicated skill yet)              | Covered ad-hoc by Beauvoir and Dewey           |

The Aesthetics wing has no dedicated skill in v1.0. Beauvoir's phenomenological
method and Dewey's pragmatist aesthetics (Art as Experience) provide partial
coverage. A future aesthetics skill could be added without changing any existing
agent or team configuration — it would simply add a new skill with affinity to
beauvoir and dewey.

## 8. Customization Guide

The philosophy department follows the same department template pattern as the
math, physics, and music departments. To fork it for another humanities
discipline, follow these steps:

### Step 1: Copy the chipset directory

```bash
cp -r examples/chipsets/philosophy-department examples/chipsets/history-department
```

### Step 2: Rename agents

Edit `chipset.yaml` and replace agent names, roles, and historical figure
references. For a history department you might use: herodotus (router/chair),
thucydides (political/military), ibn-khaldun (civilizational analysis),
ranke (source criticism), braudel (longue duree), zinn (people's history),
montessori (pedagogy). Also rename any corresponding agent directories if
your project uses per-agent config files.

### Step 3: Replace skills with domain-appropriate content

Swap the six philosophy skills for history equivalents. Each skill needs:
- A `domain` value (e.g., `history`)
- A `description` summarizing what the skill covers
- A `triggers` list of natural language patterns that activate the skill
- An `agent_affinity` mapping to the renamed agents

For history, skills might include: source-analysis, periodization,
historiography, comparative-history, oral-history, historical-argumentation.

### Step 4: Define new Grove record types

Replace the five `PhilosophyX` record types with domain-appropriate types. A
history department might use: HistoryNarrative, HistorySourceAnalysis,
HistoryExplanation, HistoryDebate, HistorySession. Each type should describe
the fields that agents produce.

### Step 5: Map to the target college department

Update the `college` section:
- Set `department` to the target (e.g., `history`)
- Define wings that match the college department structure
- Decide whether `concept_graph.write` should be enabled (some departments
  may want read-only access to avoid unreviewed graph mutations)

### Step 6: Update evaluation gates

Review the `evaluation.gates` section. The five default gates are generic
enough for most departments, but you may want to add domain-specific checks
(e.g., "all source-analysis records must declare provenance fields").

Update `benchmark.domains_covered` to list the new domain areas.

## 9. Architecture Notes

### Why router topology

The router topology places a single agent (Socrates) as the entry point for all
queries. This provides three benefits:

1. **Classification**: Socrates determines which domain(s) a query touches
   before dispatching, preventing wasted work by non-relevant agents.
2. **Synthesis**: For multi-domain queries, Socrates collects results from
   multiple specialists and synthesizes a unified response.
3. **CAPCOM boundary**: The user interacts with exactly one agent. This reduces
   cognitive load and provides a consistent communication style.

The Socratic method is uniquely suited to the router role. In Plato's dialogues,
Socrates rarely advances his own position — he draws out the knowledge of others
through questioning. As CAPCOM, Socrates asks the clarifying question that
determines which specialist should answer, then synthesizes their responses
into a coherent dialogue. This is classification and synthesis through inquiry
rather than assertion.

### Why 3 Opus / 4 Sonnet

Model assignment follows the reasoning depth required by each role:

- **Opus agents** (socrates, aristotle, beauvoir): These roles require the
  deepest reasoning. Routing and Socratic synthesis (Socrates) must understand
  all six domains well enough to classify correctly and weave specialist
  responses into coherent dialogue. Formal logic (Aristotle) demands multi-step
  deductive chains where one invalid inference invalidates the entire argument.
  Existentialist analysis (Beauvoir) requires holding concrete situations and
  abstract principles in tension simultaneously — the kind of nuanced,
  context-sensitive reasoning that benefits from Opus depth.
- **Sonnet agents** (kant, confucius, nagarjuna, dewey): These roles are
  throughput-oriented or follow well-structured frameworks. Kantian ethics
  applies the categorical imperative test systematically. Confucian political
  philosophy draws on a well-defined canon of virtues and relations.
  Nagarjuna's deconstructive method follows a repeatable pattern of examining
  claims for self-contradiction. Dewey's pedagogical explanations benefit from
  fast turnaround. Sonnet's speed matters more than its depth ceiling for these
  tasks.

This 3/4 split keeps the token budget practical while preserving quality where
nuance matters most. Philosophy is the first department where the Opus
assignments are driven by argumentative subtlety rather than computational
complexity — a distinction that validates the template for humanities use.

### Why this team structure

The three teams cover the three most common philosophical query shapes:

- **Full seminar**: needs every perspective (all 7 agents) — for questions that
  span traditions and resist single-framework answers.
- **Ethics committee**: needs the moral reasoning core (4 agents, no formal
  logic or metaphysics as primary) — for applied ethics, dilemmas, and value
  conflicts.
- **Dialectic**: needs the argumentation pipeline (4 agents, no political or
  ethical focus) — for stress-testing claims, exploring paradoxes, and
  conducting structured philosophical inquiry.

Teams are not exclusive. Socrates can assemble ad-hoc groups for queries that
do not fit any pre-composed team.

### CAPCOM boundary

The CAPCOM (Capsule Communicator) pattern means only Socrates speaks to the
user. Other agents communicate through Socrates via internal dispatch. This is
enforced by the `is_capcom: true` flag — only one agent in the chipset may
carry this flag.

For philosophy, the CAPCOM boundary has an additional benefit: it prevents the
user from receiving conflicting conclusions from different agents without
synthesis. When Kant and Beauvoir disagree on an ethical question (which they
frequently will), Socrates presents both positions, identifies the tension, and
lets the user engage with the disagreement constructively. Raw multi-agent
output without synthesis would be confusing; Socratic synthesis makes
philosophical disagreement productive.

## 10. Relationship to Other Departments

The philosophy department is the fourth department chipset and the first from
the humanities. The previous three — math, physics, and music — are all STEM
or STEM-adjacent. Philosophy's arrival validates that the department template
pattern is not STEM-specific:

- **Template generalization**: The same YAML structure (skills, agents, teams,
  grove, college, evaluation, customization) accommodates a discipline whose
  outputs are arguments and analyses rather than proofs and computations. No
  structural changes were needed — only content substitution.
- **Record type flexibility**: PhilosophyDilemma (a record type with no math or
  physics equivalent) demonstrates that departments can define novel record
  types without breaking Grove's content-addressed storage model.
- **Model assignment rationale shifts**: In math, Opus goes to proof depth. In
  philosophy, Opus goes to argumentative subtlety. The 3/4 Opus/Sonnet split
  holds, but the justification changes — confirming that the split is about
  reasoning demand, not domain.
- **Cross-department potential**: Philosophy connects naturally to every other
  department. Ethics of AI connects to CS. Philosophy of mathematics connects
  to math. Aesthetics connects to music. Political philosophy connects to
  physics (nuclear ethics, climate modeling). Future work could add
  `cross_department_dispatch` to the chipset schema, allowing one department's
  agent to request a consultation from another department's specialist.

The pattern is now proven across four domains: pure mathematics (formal,
deductive), physics (empirical, experimental), music (creative, performative),
and philosophy (argumentative, interpretive). Any future department — history,
linguistics, computer science, biology — can fork any of these four and remap
with confidence that the template supports their discipline's shape.
