---
name: logic-department
type: chipset
category: chipset
status: stable
origin: tibsfox
first_seen: 2026-04-12
first_path: examples/chipsets/logic-department/README.md
description: >
  Coordinated logic department -- seven named agents, six knowledge
  skills, three teams. 25th department in the college structure.
superseded_by: null
---

# Logic Department

## 1. What is the Logic Department?

The Logic Department chipset is a coordinated set of reasoning agents,
domain skills, and pre-composed teams that together provide structured
logic support across propositional, predicate, modal, informal-fallacy,
proof-theoretic, and argumentation domains. It is the 25th department
built on the gsd-skill-creator department template pattern. Incoming
requests are classified by a router agent (Frege), dispatched to the
appropriate specialist, and all work products are persisted as Grove
records linked to the college concept graph.

The department takes a classical-first view of logic: the core is
first-order logic and its extensions, augmented by informal-argument
analysis and a strong pedagogical track. The specialist roster is drawn
from the founders of modern logic -- Frege, Boole, Russell, Godel, Tarski,
Quine, Langer -- so recommendations are grounded in the discipline's own
canonical texts rather than in folk theory.

## 2. Quick Start

Install the chipset into your gsd-skill-creator project:

```bash
# From the gsd-skill-creator root
cp -r examples/chipsets/logic-department .claude/chipsets/logic-department
```

The chipset activates when any of the six skill trigger patterns match an
incoming query. Frege (the router agent) classifies the query domain and
dispatches to the appropriate specialist agent. No explicit activation
command is needed -- the skill-integration layer loads the chipset based
on context.

To verify the chipset is recognized:

```bash
node -e "const yaml = require('yaml'); const fs = require('fs'); \
  console.log(yaml.parse(fs.readFileSync('.claude/chipsets/logic-department/chipset.yaml', 'utf8')).name)"
# Expected output: logic-department-v1.0
```

## 3. Agent Roster

Seven agents form the department. Three run on Opus (for tasks requiring
deep reasoning and judgment), four on Sonnet (for well-defined specialist
and pedagogical work).

| Name    | Historical Figure                  | Role                                                           | Model  | Tools                         |
|---------|------------------------------------|----------------------------------------------------------------|--------|-------------------------------|
| frege   | Gottlob Frege (1848-1925)          | Department chair -- classification, routing, synthesis         | opus   | Read, Glob, Grep, Bash, Write |
| boole   | George Boole (1815-1864)           | Propositional -- algebraic and truth-functional analysis       | opus   | Read, Grep, Bash              |
| russell | Bertrand Russell (1872-1970)       | Informal -- translation, fallacies, steel-manning              | opus   | Read, Grep, Bash              |
| godel   | Kurt Godel (1906-1978)             | Proof and metamathematics -- verification, completeness       | sonnet | Read, Grep                    |
| tarski  | Alfred Tarski (1901-1983)          | Semantics and model theory -- truth, countermodels, Kripke     | sonnet | Read, Grep                    |
| quine   | W. V. O. Quine (1908-2000)         | Skeptical -- equivocation, opacity, modal critique             | sonnet | Read, Grep                    |
| langer  | Susanne K. Langer (1895-1985)      | Pedagogy -- explanation, worked examples, study guides         | sonnet | Read, Write                   |

Frege is the CAPCOM (single point of contact for the user). All other
agents receive dispatched subtasks and return results through Frege.

## 4. Skill Inventory

Six skills provide domain knowledge that agents draw on during execution.

| Skill                     | Domain | Trigger Patterns                                                            | Agent Affinity            |
|---------------------------|--------|-----------------------------------------------------------------------------|---------------------------|
| propositional-logic       | logic  | propositional, truth table, if-then, modus ponens, conjunction, boolean     | boole, frege, russell     |
| predicate-logic           | logic  | for all, there exists, quantifier, first-order, FOL, natural deduction      | frege, tarski, godel      |
| modal-logic               | logic  | necessity, possibility, modal, Kripke, epistemic, deontic, temporal         | quine, tarski, frege      |
| informal-fallacies        | logic  | fallacy, ad hominem, straw man, red herring, false dichotomy, slippery slope | russell, quine, langer    |
| mathematical-proof-logic  | logic  | proof structure, induction, contradiction, contrapositive, verify proof     | godel, tarski, russell    |
| critical-argumentation    | logic  | evaluate argument, steel man, burden of proof, premise, conclusion          | russell, langer, quine    |

Agent affinity means the skill's content is preferentially loaded into the
listed agent's context. Multiple affinities mean the skill is relevant to
more than one specialist.

## 5. Team Configurations

Teams are pre-composed agent groups for common problem shapes.

| Team                    | Agents                                               | Use When                                                     |
|-------------------------|------------------------------------------------------|--------------------------------------------------------------|
| logic-analysis-team     | frege, boole, russell, godel, tarski, quine, langer  | Multi-domain, systemic, contested, or pedagogically serious  |
| logic-workshop-team     | frege, russell, godel, tarski, quine                 | Single-artifact evaluation (one argument, one proof)         |
| logic-practice-team     | frege, boole/russell/godel (one), langer             | Pedagogical requests (explain, practice, study guide)        |

**logic-analysis-team** is the full department. Use it for questions that
span multiple sub-domains or require the broadest possible analysis.
Typical cost: 200-380K tokens.

**logic-workshop-team** is a focused evaluation team for a specific
artifact (an argument, a proof, a claim). Faster and cheaper than the
analysis team, with most of its critical bite. Typical cost: 120-170K
tokens.

**logic-practice-team** is a sequential pipeline that turns concepts into
repeatable practice routines. Exactly one domain specialist plus langer,
with frege supervising. The cheapest team. Typical cost: 65-110K tokens.

## 6. Grove Record Types

All department work products are persisted as Grove records under the
`logic-department` namespace. Five record types are defined:

| Record Type       | Produced By                | Key Fields                                                          |
|-------------------|----------------------------|---------------------------------------------------------------------|
| LogicAnalysis     | boole, tarski, russell     | Subject, mode, method, verdict, trace, named rule                   |
| LogicConstruct    | godel                      | Target theorem, system, proof or derivation, verdict, repair        |
| LogicReview       | russell, quine, frege      | Subject, standard form, steel-manned version, fallacies, verdict    |
| LogicExplanation  | langer                     | Topic, target level, explanation, worked example, practice, pitfalls|
| LogicSession      | frege                      | Session ID, query, classification, dispatches, work product links   |

Records are content-addressed and immutable once written.
LogicSession records link all work products from a single interaction,
providing an audit trail from query to result.

## 7. College Integration

The chipset connects to the college logic department concept graph:

- **Concept graph read/write**: Agents read existing concept definitions
  and can add new ones when a topic is encountered that the graph does
  not yet cover.
- **Try Session generation**: When a LogicExplanation is produced, the
  chipset can generate a Try Session (interactive practice) based on the
  explanation content and the learner's current position in the graph.
- **Learning pathway updates**: Completed analyses, reviews, and
  activities update the learner's progress along college-defined pathways.
- **Five wings** map to the college logic department structure:
  1. Classical Logic
  2. Formal Systems
  3. Proof and Semantics
  4. Argument Evaluation
  5. Applied Reasoning

Each skill and Grove record type aligns to one or more wings, so work
products are automatically filed into the correct part of the concept
graph.

## 8. Customization Guide

The logic department is a fork of the math-department template pattern
adapted to a kindred but distinct domain. To create your own department,
follow the same steps:

### Step 1: Copy the chipset directory

```bash
cp -r examples/chipsets/logic-department examples/chipsets/your-department
```

### Step 2: Rename agents

Edit `chipset.yaml` and replace agent names, roles, and historical
figures. Choose figures whose actual work maps to the agent's role. The
logic department spans foundational (Frege, Boole), critical (Russell,
Quine), metamathematical (Godel), semantic (Tarski), and pedagogical
(Langer) work. Historical diversity is intentional -- the roster spans
Germany, Ireland, Britain, Austria, Poland, and the United States, and
covers most of the discipline's formative period.

### Step 3: Replace skills

Swap the six skills for domain-appropriate content. Each skill needs a
domain, description, triggers, and agent_affinity mapping.

### Step 4: Define new Grove record types

Replace the five logic types with domain-appropriate ones.

### Step 5: Map to the target college department

Update the `college` section and wing list.

### Step 6: Update evaluation gates

Review and adjust as needed.

## 9. Architecture Notes

### Why router topology

The router topology places Frege as the entry point for all queries.
This provides three benefits:

1. **Classification**: Frege determines which sub-domains a query touches
   before dispatching, preventing wasted work by non-relevant agents.
2. **Synthesis**: For multi-domain queries, Frege collects results and
   synthesizes a unified response.
3. **CAPCOM boundary**: The user interacts with exactly one agent. This
   reduces cognitive load and provides a consistent voice.

### Why 3 Opus / 4 Sonnet

Model assignment follows the judgment depth required by each role:

- **Opus agents** (frege, boole, russell): These roles require deep
  judgment. Routing and synthesis (Frege) must understand all six
  sub-domains. Propositional analysis (Boole) is exhaustive case work
  where subtle errors compound. Natural-language argument evaluation
  (Russell) is the hardest kind of judgment the department produces.
- **Sonnet agents** (godel, tarski, quine, langer): These roles are
  framework-application and structural work. Godel verifies proofs
  against explicit rules, Tarski evaluates semantics against explicit
  models, Quine applies a fixed skeptical framing, and Langer applies
  a fixed pedagogical template. All benefit from Sonnet speed.

This 3/4 split keeps the token budget practical while preserving quality
where it matters most.

### Why three teams

The three teams cover the three most common query shapes:

- **Full analysis**: needs every perspective (all 7 agents)
- **Focused workshop**: single artifact, deep evaluation (5 agents)
- **Practice pipeline**: turning concept into habit (4-5 agents, sequential)

Teams are not exclusive. Frege can assemble ad-hoc groups for queries
that do not fit any pre-composed team.

## 10. Relationship to Other Departments

The logic department pairs naturally with:

- **Math Department** for mathematical proof construction (logic
  verifies, math constructs)
- **Digital Literacy Department** (24th, parallel build) for information
  evaluation and algorithmic-literacy questions where the argument side
  needs formal attention
- **Psychology Department** for questions about reasoning, cognitive
  biases, and how people actually deploy (or fail to deploy) logical
  rules
- **Writing Department** for argumentation craft when the goal is
  persuasive rather than evaluative
- **Philosophy Department** (if present) for questions where the
  metaphysical and epistemic framing matters more than the formal
  structure

Cross-department queries can use the relevant department's router agent
as a starting point, with Frege as a fallback when the question is
specifically about logical structure.
