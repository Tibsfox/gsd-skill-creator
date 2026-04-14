---
name: math-department
type: chipset
category: chipset
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-11
first_path: examples/chipsets/math-department/README.md
description: >
  Coordinated mathematics department — seven named agents, six knowledge
  skills, three teams. First instantiation of the department template pattern.
superseded_by: null
---

# Math Department

## 1. What is the Math Department?

The Math Department chipset is a coordinated set of reasoning agents, domain
skills, and pre-composed teams that together provide structured mathematics
support across proof writing, algebra, geometry, analysis, pattern recognition,
and mathematical modeling. It is the first instantiation of the "department
template pattern" in gsd-skill-creator: a chipset architecture designed to be
forked and remapped to any academic or professional domain. Incoming requests
are classified by a router agent (Hypatia), dispatched to the appropriate
specialist, and all work products are persisted as Grove records linked to the
college concept graph.

## 2. Quick Start

Install the chipset into your gsd-skill-creator project:

```bash
# From the gsd-skill-creator root
cp -r examples/chipsets/math-department .claude/chipsets/math-department
```

The chipset is activated when any of the six skill trigger patterns match an
incoming query. Hypatia (the router agent) classifies the query domain and
dispatches to the appropriate specialist agent. No explicit activation command
is needed — the skill-integration layer loads the chipset based on context.

To verify the chipset is recognized:

```bash
# Check that the YAML parses cleanly
node -e "const yaml = require('yaml'); const fs = require('fs'); \
  console.log(yaml.parse(fs.readFileSync('.claude/chipsets/math-department/chipset.yaml', 'utf8')).name)"
# Expected output: math-department-v1.0
```

## 3. Agent Roster

Seven agents form the department. Three run on Opus (for tasks requiring deep
reasoning), four on Sonnet (for throughput-oriented computation and pedagogy).

| Name       | Historical Figure          | Role                                          | Model  | Tools                        |
|------------|----------------------------|-----------------------------------------------|--------|------------------------------|
| hypatia    | Hypatia of Alexandria      | Department chair — classification, routing, synthesis | opus   | Read, Glob, Grep, Bash, Write |
| euclid     | Euclid of Alexandria       | Proof engineer — formal proofs, logical verification  | opus   | Read, Grep, Bash             |
| gauss      | Carl Friedrich Gauss       | Number theorist — arithmetic, algebra, computation    | sonnet | Read, Bash                   |
| euler      | Leonhard Euler             | Analyst — calculus, series, numerical methods          | sonnet | Read, Bash                   |
| noether    | Emmy Noether               | Algebraist — abstract structures, symmetry, invariants | opus   | Read, Grep                   |
| ramanujan  | Srinivasa Ramanujan        | Conjecture engine — pattern detection, experimental math | sonnet | Read, Bash                |
| polya      | George Polya               | Pedagogy guide — heuristics, explanation, learning paths | sonnet | Read, Write                |

Hypatia is the CAPCOM (single point of contact for the user). All other agents
receive dispatched subtasks and return results through Hypatia.

## 4. Skill Inventory

Six skills provide domain knowledge that agents draw on during execution.

| Skill                  | Domain | Trigger Patterns                                               | Agent Affinity      |
|------------------------|--------|----------------------------------------------------------------|---------------------|
| proof-techniques       | math   | prove that, proof strategy, verify this proof, induction, contradiction, contrapositive | euclid              |
| algebraic-reasoning    | math   | solve for, factor, simplify, group theory, ring, modular, polynomial | gauss, noether      |
| geometric-intuition    | math   | triangle, geometry, angle, trigonometry, coordinate, area, volume | euclid, euler       |
| numerical-analysis     | math   | compute, integrate, derivative, series, numerical, converge    | euler               |
| pattern-recognition    | math   | pattern, sequence, conjecture, OEIS, combinatorics             | ramanujan           |
| mathematical-modeling  | math   | model, formulate, real-world, optimization, regression         | euler, polya        |

Agent affinity means the skill's content is preferentially loaded into the
listed agent's context. Multiple affinities mean the skill is relevant to
more than one specialist.

## 5. Team Configurations

Teams are pre-composed agent groups for common problem shapes.

| Team                      | Agents                                              | Use When                                        |
|---------------------------|-----------------------------------------------------|-------------------------------------------------|
| math-investigation-team   | hypatia, euclid, gauss, euler, noether, ramanujan, polya | Multi-domain, research-level, or full-analysis requests |
| proof-workshop-team       | euclid, noether, gauss, polya                       | Proof-specific requests                         |
| discovery-team            | ramanujan, euclid, gauss, polya                     | Pattern exploration and conjecture generation    |

**math-investigation-team** is the full department. Use it for problems that
span multiple mathematical domains or require the broadest possible expertise.

**proof-workshop-team** pairs the proof engineer (Euclid) with the algebraist
(Noether), the computational specialist (Gauss), and the pedagogy guide (Polya).
Use it when the primary goal is constructing, verifying, or explaining a proof.

**discovery-team** is the conjecture pipeline. Ramanujan identifies patterns,
Gauss computes supporting evidence, Euclid attempts formalization, and Polya
documents findings at the appropriate level.

## 6. Grove Record Types

All department work products are persisted as Grove records under the
`math-department` namespace. Five record types are defined:

| Record Type      | Produced By                    | Key Fields                                           |
|------------------|--------------------------------|------------------------------------------------------|
| MathProof        | euclid, noether                | theorem statement, proof steps, technique used, verification status |
| MathConjecture   | ramanujan, gauss               | claim, evidence, confidence score, counterexample attempts |
| MathDerivation   | euler, gauss                   | input expression, step-by-step work, result, precision |
| MathExplanation  | polya                          | topic, target level, explanation body, prerequisites  |
| MathSession      | hypatia                        | session ID, queries, dispatches, work product links, timestamps |

Records are content-addressed and immutable once written. MathSession records
link all work products from a single interaction, providing an audit trail from
query to result.

## 7. College Integration

The chipset connects to the college math department concept graph:

- **Concept graph read/write**: Agents can read existing concept definitions and
  write new ones when a topic is encountered that the graph does not yet cover.
- **Try Session generation**: When a MathExplanation is produced, the chipset can
  automatically generate a Try Session (interactive practice) based on the
  explanation content and the learner's current position in the concept graph.
- **Learning pathway updates**: Completed proofs, derivations, and explanations
  update the learner's progress along college-defined pathways.
- **Five wings** map to the college math department structure:
  1. Number & Operations
  2. Patterns & Algebraic Thinking
  3. Geometry & Spatial Thinking
  4. Data & Probability
  5. Statistics & Inference

Each skill and Grove record type aligns to one or more wings, so work products
are automatically filed into the correct part of the concept graph.

## 8. Customization Guide

The math department is the reference implementation of the department template
pattern. To create a department for another domain, follow these steps:

### Step 1: Copy the chipset directory

```bash
cp -r examples/chipsets/math-department examples/chipsets/physics-department
```

### Step 2: Rename agents

Edit `chipset.yaml` and replace agent names, roles, and historical figure
references. For a physics department you might use: newton (router/chair),
faraday (electromagnetism), maxwell (fields), curie (nuclear/radiation),
feynman (quantum), boltzmann (thermodynamics), hawking (cosmology). Also
rename any corresponding agent directories if your project uses per-agent
config files.

### Step 3: Replace skills with domain-appropriate content

Swap the six math skills for physics equivalents. Each skill needs:
- A `domain` value (e.g., `physics`)
- A `description` summarizing what the skill covers
- A `triggers` list of natural language patterns that activate the skill
- An `agent_affinity` mapping to the renamed agents

### Step 4: Define new Grove record types

Replace the five `MathX` record types with domain-appropriate types. A physics
department might use: PhysicsDerivation, PhysicsExperiment, PhysicsExplanation,
PhysicsSimulation, PhysicsSession. Each type should describe the fields that
agents produce.

### Step 5: Map to the target college department

Update the `college` section:
- Set `department` to the target (e.g., `physics`)
- Define wings that match the college department structure
- Decide whether `concept_graph.write` should be enabled (some departments
  may want read-only access to avoid unreviewed graph mutations)

### Step 6: Update evaluation gates

Review the `evaluation.gates` section. The five default gates are generic
enough for most departments, but you may want to add domain-specific checks
(e.g., "all simulation record types must declare a precision field").

Update `benchmark.domains_covered` to list the new domain areas.

## 9. Architecture Notes

### Why router topology

The router topology places a single agent (Hypatia) as the entry point for all
queries. This provides three benefits:

1. **Classification**: Hypatia determines which domain(s) a query touches before
   dispatching, preventing wasted work by non-relevant agents.
2. **Synthesis**: For multi-domain queries, Hypatia collects results from
   multiple specialists and synthesizes a unified response.
3. **CAPCOM boundary**: The user interacts with exactly one agent. This reduces
   cognitive load and provides a consistent communication style.

Alternative topologies (mesh, pipeline, broadcast) are possible but the router
pattern best fits the department metaphor: students talk to the department
office, which routes them to the right professor.

### Why 3 Opus / 4 Sonnet

Model assignment follows the reasoning depth required by each role:

- **Opus agents** (hypatia, euclid, noether): These roles require the deepest
  reasoning. Routing and synthesis (Hypatia) must understand all six domains
  well enough to classify correctly. Proof construction (Euclid) and abstract
  algebra (Noether) require multi-step logical chains where errors compound.
- **Sonnet agents** (gauss, euler, ramanujan, polya): These roles are
  throughput-oriented. Number computation, calculus, pattern scanning, and
  pedagogical explanation benefit from fast turnaround. Sonnet's speed matters
  more than its depth ceiling for these tasks.

This 3/4 split keeps the token budget practical while preserving quality where
it matters most.

### Why this team structure

The three teams cover the three most common query shapes:

- **Full investigation**: needs every perspective (all 7 agents)
- **Proof-focused**: needs the logical core (4 agents, no pattern/analysis)
- **Discovery**: needs the creative-computational pipeline (4 agents, no
  abstract algebra or full analysis)

Teams are not exclusive. Hypatia can assemble ad-hoc groups for queries that
do not fit any pre-composed team.

### CAPCOM boundary

The CAPCOM (Capsule Communicator) pattern means only Hypatia speaks to the
user. Other agents communicate through Hypatia via internal dispatch. This is
enforced by the `is_capcom: true` flag — only one agent in the chipset may
carry this flag.

## 10. Relationship to Math Co-Processor

The math department and the math co-processor (`examples/chipsets/math-coprocessor/`)
are complementary, not competing:

- **Math Department** provides reasoning agents — proof construction, algebraic
  insight, pedagogical explanation, conjecture generation. These are cognitive
  tasks that require language model capabilities.
- **Math Co-Processor** provides GPU-accelerated computation — matrix operations
  (Algebrus), FFT (Fourier), vector calculus (Vectora), statistics (Statos),
  symbolic evaluation (Symbex). These are numerical tasks that benefit from
  hardware acceleration.

The department reasons about math. The co-processor computes math. In practice,
a department agent like Euler might formulate an integral and then dispatch the
numerical evaluation to the co-processor's Vectora chip, or Gauss might set up
a matrix equation and hand the GEMM operation to Algebrus.

Future integration could formalize this by adding a `coprocessor_dispatch` field
to the department chipset, allowing agents to declare which co-processor chips
they may call. The co-processor's CUDA stream isolation and VRAM budget
management would remain independent — the department never manages GPU resources
directly.

This separation of concerns follows the same pattern as a university department
versus its computing cluster: professors decide what to compute, the cluster
decides how to compute it.
