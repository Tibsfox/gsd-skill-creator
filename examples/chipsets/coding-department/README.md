---
name: coding-department
type: chipset
category: chipset
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/chipsets/coding-department/README.md
description: >
  Coordinated coding department — seven named agents, six knowledge
  skills, three teams. Eighth instantiation of the department template pattern.
superseded_by: null
---

# Coding Department

## 1. What is the Coding Department?

The Coding Department chipset is a coordinated set of reasoning agents, domain
skills, and pre-composed teams that together provide structured programming
support across algorithms, software design, systems programming, debugging,
testing, and computational thinking. It is the eighth instantiation of the
"department template pattern" in gsd-skill-creator: a chipset architecture
designed to be forked and remapped to any academic or professional domain.
Incoming requests are classified by a router agent (Lovelace), dispatched to
the appropriate specialist, and all work products are persisted as Grove records
linked to the college concept graph.

## 2. Quick Start

Install the chipset into your gsd-skill-creator project:

```bash
# From the gsd-skill-creator root
cp -r examples/chipsets/coding-department .claude/chipsets/coding-department
```

The chipset is activated when any of the six skill trigger patterns match an
incoming query. Lovelace (the router agent) classifies the query domain and
dispatches to the appropriate specialist agent. No explicit activation command
is needed -- the skill-integration layer loads the chipset based on context.

To verify the chipset is recognized:

```bash
# Check that the YAML parses cleanly
node -e "const yaml = require('yaml'); const fs = require('fs'); \
  console.log(yaml.parse(fs.readFileSync('.claude/chipsets/coding-department/chipset.yaml', 'utf8')).name)"
# Expected output: coding-department-v1.0
```

## 3. Agent Roster

Seven agents form the department. Three run on Opus (for tasks requiring deep
reasoning), four on Sonnet (for throughput-oriented tasks and pedagogy).

| Name       | Historical Figure          | Role                                          | Model  | Tools                        |
|------------|----------------------------|-----------------------------------------------|--------|------------------------------|
| lovelace   | Ada Lovelace               | Department chair -- classification, routing, synthesis | opus   | Read, Glob, Grep, Bash, Write |
| turing     | Alan Turing                | Theorist -- computability, complexity, automata, correctness | opus   | Read, Grep, Bash             |
| hopper     | Grace Hopper               | Systems engineer -- languages, compilers, debugging, implementation | sonnet | Read, Bash, Write            |
| knuth      | Donald Knuth               | Algorithm analyst -- complexity, data structures, literate programming | opus   | Read, Grep, Bash             |
| dijkstra   | Edsger Dijkstra            | Design specialist -- SOLID, structured programming, code review | sonnet | Read, Grep, Bash             |
| kay        | Alan Kay                   | Architect -- OOP, message passing, component design, API design | sonnet | Read, Grep, Write            |
| papert     | Seymour Papert             | Pedagogy guide -- constructionism, explanations, exercises | sonnet | Read, Bash, Write            |

Lovelace is the CAPCOM (single point of contact for the user). All other agents
receive dispatched subtasks and return results through Lovelace.

## 4. Skill Inventory

Six skills provide domain knowledge that agents draw on during execution.

| Skill                     | Domain  | Trigger Patterns                                                           | Agent Affinity      |
|---------------------------|---------|----------------------------------------------------------------------------|---------------------|
| algorithms-data-structures | coding  | sort, search, Big-O, complexity, data structure, algorithm, binary tree, hash table | knuth, turing       |
| programming-fundamentals   | coding  | variable, loop, function, recursion, type, error handling, closure, scope  | hopper, papert      |
| software-design            | coding  | design pattern, SOLID, refactor, architecture, coupling, cohesion, MVC     | dijkstra, kay       |
| debugging-testing          | coding  | debug, test, TDD, unit test, profiling, bug, breakpoint, coverage          | hopper, dijkstra    |
| systems-programming        | coding  | memory, thread, mutex, async, socket, process, compiler, cache, concurrency | hopper, turing      |
| computational-thinking     | coding  | decompose, abstraction, computational thinking, Turing machine, NP-complete | papert, lovelace    |

Agent affinity means the skill's content is preferentially loaded into the
listed agent's context. Multiple affinities mean the skill is relevant to
more than one specialist.

## 5. Team Configurations

Teams are pre-composed agent groups for common problem shapes.

| Team                   | Agents                                               | Use When                                              |
|------------------------|------------------------------------------------------|-------------------------------------------------------|
| code-review-team       | lovelace, turing, hopper, knuth, dijkstra, kay, papert | Multi-perspective code review, architecture assessment |
| architecture-team      | dijkstra, kay, knuth, papert                         | Architecture decisions, design pattern selection       |
| learning-lab-team      | papert, hopper, lovelace, kay                        | Teaching, onboarding, exercises, workshop design       |

**code-review-team** is the full department. Use it for production code reviews
where algorithm efficiency, design quality, implementation correctness, systems
concerns, and learnability all need assessment.

**architecture-team** pairs the design specialist (Dijkstra) with the architect
(Kay), the algorithm analyst (Knuth), and the pedagogy guide (Papert for
learnability assessment). Use it when the primary goal is making or evaluating
architectural decisions.

**learning-lab-team** is the pedagogy pipeline. Papert designs the learning
experience, Hopper provides working code examples, Kay contributes architectural
thinking, and Lovelace adds cross-domain connections and computational vision.

## 6. Grove Record Types

All department work products are persisted as Grove records under the
`coding-department` namespace. Five record types are defined:

| Record Type      | Produced By                    | Key Fields                                           |
|------------------|--------------------------------|------------------------------------------------------|
| CodeAnalysis     | turing, knuth, kay             | problem, complexity, proof technique, recommendation  |
| CodeSolution     | hopper                         | language, code, test cases, edge cases, complexity    |
| CodeReview       | dijkstra, hopper, kay          | findings by severity, design assessment, positives    |
| CodeExplanation  | papert                         | topic, target level, explanation, exercises, prerequisites |
| CodeSession      | lovelace                       | session ID, queries, dispatches, work product links   |

Records are content-addressed and immutable once written. CodeSession records
link all work products from a single interaction, providing an audit trail from
query to result.

## 7. College Integration

The chipset connects to the college coding department concept graph:

- **Concept graph read/write**: Agents can read existing concept definitions and
  write new ones when a topic is encountered that the graph does not yet cover.
- **Try Session generation**: When a CodeExplanation is produced, the chipset can
  automatically generate a Try Session (interactive practice) based on the
  explanation content and the learner's current position in the concept graph.
- **Learning pathway updates**: Completed exercises, explanations, and code
  reviews update the learner's progress along college-defined pathways.
- **Five wings** map to the college coding department structure:
  1. Computational Thinking
  2. Programming Fundamentals
  3. Building Projects
  4. Algorithms & Efficiency
  5. Computing & Society

Each skill and Grove record type aligns to one or more wings, so work products
are automatically filed into the correct part of the concept graph.

## 8. Customization Guide

The coding department follows the department template pattern established by
the math department. To create a department for another domain, follow these
steps:

### Step 1: Copy the chipset directory

```bash
cp -r examples/chipsets/coding-department examples/chipsets/your-department
```

### Step 2: Rename agents

Edit `chipset.yaml` and replace agent names, roles, and historical figure
references. Each domain should have agents whose historical namesakes are
recognized authorities in that field. Also rename any corresponding agent
directories if your project uses per-agent config files.

### Step 3: Replace skills with domain-appropriate content

Swap the six coding skills for domain equivalents. Each skill needs:
- A `domain` value (e.g., `physics`)
- A `description` summarizing what the skill covers
- A `triggers` list of natural language patterns that activate the skill
- An `agent_affinity` mapping to the renamed agents

### Step 4: Define new Grove record types

Replace the five `Code*` record types with domain-appropriate types. Each type
should describe the fields that agents produce.

### Step 5: Map to the target college department

Update the `college` section:
- Set `department` to the target
- Define wings that match the college department structure
- Decide whether `concept_graph.write` should be enabled

### Step 6: Update evaluation gates

Review the `evaluation.gates` section. The five default gates are generic
enough for most departments, but you may want to add domain-specific checks.

Update `benchmark.domains_covered` to list the new domain areas.

## 9. Architecture Notes

### Why router topology

The router topology places a single agent (Lovelace) as the entry point for all
queries. This provides three benefits:

1. **Classification**: Lovelace determines which domain(s) a query touches before
   dispatching, preventing wasted work by non-relevant agents.
2. **Synthesis**: For multi-domain queries, Lovelace collects results from
   multiple specialists and synthesizes a unified response.
3. **CAPCOM boundary**: The user interacts with exactly one agent. This reduces
   cognitive load and provides a consistent communication style.

### Why 3 Opus / 4 Sonnet

Model assignment follows the reasoning depth required by each role:

- **Opus agents** (lovelace, turing, knuth): These roles require the deepest
  reasoning. Routing and synthesis (Lovelace) must understand all six domains
  well enough to classify correctly. Computability and complexity (Turing) and
  algorithm analysis (Knuth) require multi-step formal reasoning where errors
  compound.
- **Sonnet agents** (hopper, dijkstra, kay, papert): These roles are
  well-scoped. Code implementation (Hopper), design principle application
  (Dijkstra), architectural assessment (Kay), and pedagogical explanation
  (Papert) benefit from fast turnaround. Sonnet's speed matters more than its
  depth ceiling for these tasks.

This 3/4 split keeps the token budget practical while preserving quality where
it matters most.

### Why this team structure

The three teams cover the three most common query shapes:

- **Full review**: needs every perspective (all 7 agents)
- **Architecture-focused**: needs the design and algorithm core (4 agents, no
  implementation or systems)
- **Learning-focused**: needs the pedagogical pipeline (4 agents, no formal
  analysis or design principles)

Teams are not exclusive. Lovelace can assemble ad-hoc groups for queries that
do not fit any pre-composed team.

### CAPCOM boundary

The CAPCOM (Capsule Communicator) pattern means only Lovelace speaks to the
user. Other agents communicate through Lovelace via internal dispatch. This is
enforced by the `is_capcom: true` flag -- only one agent in the chipset may
carry this flag.

## 10. Relationship to Other Departments

The coding department complements but does not overlap with other departments:

- **Math Department** provides pure mathematical reasoning -- proof construction,
  algebraic manipulation, geometric intuition, pattern recognition. When a
  coding query involves mathematical content (e.g., "implement the FFT"), the
  math department provides the mathematical foundation and the coding department
  provides the implementation.
- **Engineering Department** provides applied engineering practices -- CI/CD,
  infrastructure, deployment, monitoring. The coding department focuses on the
  code itself; the engineering department focuses on getting the code to
  production.

Future integration could formalize cross-department dispatch, allowing
Lovelace to route mathematical sub-questions to Hypatia (math CAPCOM) and
infrastructure sub-questions to the engineering department's router.

This separation follows the university model: the Computer Science department
teaches algorithms and programming, the Mathematics department teaches
mathematical foundations, and the Engineering department teaches how to build
and deploy systems at scale.
