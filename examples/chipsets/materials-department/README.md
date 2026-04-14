---
name: materials-department
type: chipset
category: chipset
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/chipsets/materials-department/README.md
description: >
  Coordinated materials department — seven named agents, six knowledge
  skills, three teams. Forked from the department template pattern
  first instantiated by math-department.
superseded_by: null
---

# Materials Department

## 1. What is the Materials Department?

The Materials Department chipset is a coordinated set of reasoning agents,
domain skills, and pre-composed teams that together provide structured
materials-engineering support across selection, ferrous and nonferrous
metallurgy, failure analysis, nanomaterials, and characterization. It is
a direct instantiation of the "department template pattern" established
by the math department: a router-topology architecture in which a single
chair agent classifies incoming queries and dispatches them to named
specialists whose work products are persisted as Grove records linked to
the college concept graph.

Where the math department's specialists are named after historical
mathematicians whose work maps to their roles (Euclid for proof, Gauss for
computation), the materials department is named after historical figures
in metallurgy and materials engineering whose work maps to the specialist
roles: Bessemer for the chair (because his process change restructured
the entire materials economy), Ashby for selection, Smalley for
nanomaterials, Cort for ferrous process history, Merica for aluminum and
age hardening, Gordon for structural failure analysis, and Cottrell for
pedagogy and dislocation-based metallurgy.

## 2. Quick Start

Install the chipset into your gsd-skill-creator project:

```bash
# From the gsd-skill-creator root
cp -r examples/chipsets/materials-department .claude/chipsets/materials-department
```

The chipset is activated when any of the six skill trigger patterns match
an incoming query. Bessemer (the router agent) classifies the query along
four dimensions — subdomain, decision type, complexity, and user level —
and dispatches to the appropriate specialist agent. No explicit activation
command is needed; the skill-integration layer loads the chipset based on
context.

To verify the chipset is recognized:

```bash
node -e "const yaml = require('yaml'); const fs = require('fs'); \
  console.log(yaml.parse(fs.readFileSync('.claude/chipsets/materials-department/chipset.yaml', 'utf8')).name)"
# Expected output: materials-department-v1.0
```

## 3. Agent Roster

Seven agents form the department. Three run on Opus (for tasks requiring
judgment under ambiguity), four on Sonnet (for framework-driven analysis
and pedagogy).

| Name      | Historical Figure  | Role                                                                             | Model  | Tools                         |
|-----------|--------------------|----------------------------------------------------------------------------------|--------|-------------------------------|
| bessemer  | Henry Bessemer     | Department chair — classification, routing, synthesis, process-material coupling | opus   | Read, Glob, Grep, Bash, Write |
| ashby     | Michael Ashby      | Selection specialist — performance indices, Ashby charts, Pareto trade-offs       | opus   | Read, Grep, Bash              |
| smalley   | Richard Smalley    | Nanomaterials specialist — fullerenes, nanotubes, graphene, 2D materials          | opus   | Read, Grep, Bash              |
| cort      | Henry Cort         | Ferrous process historian — puddling, rolling, legacy steelmaking                 | sonnet | Read, Grep                    |
| merica    | Paul Merica        | Light-metals specialist — aluminum, nickel, age hardening                         | sonnet | Read, Grep                    |
| gordon    | J. E. Gordon       | Failure analyst — fracture mechanics, fatigue, SCC, diagnosis                     | sonnet | Read, Grep, Bash              |
| cottrell  | Alan Cottrell      | Pedagogy specialist — dislocation theory, level adaptation, characterization      | sonnet | Read, Write                   |

Bessemer is the CAPCOM (single point of contact for the user). All other
agents receive dispatched subtasks and return results through Bessemer.

## 4. Skill Inventory

Six skills provide domain knowledge that agents draw on during execution.

| Skill                          | Domain    | Trigger Patterns                                                                | Agent Affinity     |
|--------------------------------|-----------|---------------------------------------------------------------------------------|--------------------|
| materials-selection            | materials | select, choose, which material, Ashby, performance index, trade-off, Pareto     | ashby, bessemer    |
| iron-and-steel-processes       | materials | steel, iron, blast furnace, Bessemer, BOF, EAF, puddling, rolling               | bessemer, cort     |
| nonferrous-alloys              | materials | aluminum, titanium, nickel superalloy, copper alloy, magnesium, age hardening   | merica, ashby      |
| structural-failure-analysis    | materials | failure, fracture, fatigue, crack, brittle, creep, stress corrosion             | gordon, cottrell   |
| nanomaterials-and-carbon       | materials | nanotube, graphene, fullerene, C60, nanomaterial, 2D material, carbon allotrope | smalley, ashby     |
| materials-characterization     | materials | characterization, microscopy, SEM, TEM, XRD, EDS, metallography, hardness       | cottrell, gordon   |

Agent affinity means the skill's content is preferentially loaded into
the listed agent's context. Multiple affinities mean the skill is
relevant to more than one specialist.

## 5. Team Configurations

Teams are pre-composed agent groups for common problem shapes.

| Team                      | Agents                                                 | Use When                                                             |
|---------------------------|--------------------------------------------------------|----------------------------------------------------------------------|
| materials-analysis-team   | bessemer, ashby, smalley, cort, merica, gordon, cottrell | Multi-subdomain, research-level, or full-analysis requests           |
| materials-workshop-team   | bessemer, ashby, gordon, cottrell                      | Design review, grade decision, selection under a dominant constraint |
| materials-practice-team   | cort, merica, cottrell, bessemer                       | Ongoing characterization, qualification, specification refinement    |

**materials-analysis-team** is the full department. Use for multi-subdomain
or research-level problems.

**materials-workshop-team** pairs the chair with Ashby for selection,
Gordon for failure screening, and Cottrell for pedagogy. Use for a
focused design review.

**materials-practice-team** is the operational pipeline. Runs repeatedly
on lots and samples in an ongoing characterization or qualification
program. Bessemer joins only on escalation.

## 6. Grove Record Types

All department work products are persisted as Grove records under the
`materials-department` namespace. Five record types are defined:

| Record Type           | Produced By                        | Key Fields                                                                     |
|-----------------------|------------------------------------|--------------------------------------------------------------------------------|
| MaterialsAnalysis     | gordon, cottrell, merica           | Failure mechanism, root cause, microstructure finding, characterization result |
| MaterialsSelection    | ashby, merica                      | Function, objective, constraints, index, filter, ranked shortlist              |
| MaterialsReview       | cottrell, gordon                   | Review of a design, specification, prior selection, or characterization plan   |
| MaterialsExplanation  | cottrell, smalley, cort            | Level-appropriate teaching, concept explanations, worked examples              |
| MaterialsSession      | bessemer                           | Session log, classification metadata, work product links, timestamps           |

Records are content-addressed and immutable once written. MaterialsSession
records link all work products from a single interaction, providing an
audit trail from query to result.

## 7. College Integration

The chipset connects to the college materials department concept graph:

- **Concept graph read/write**: Agents can read existing concept
  definitions and write new ones when a topic is encountered that the
  graph does not yet cover.
- **Try Session generation**: When a MaterialsExplanation is produced,
  the chipset can automatically generate a Try Session (interactive
  practice) based on the explanation content and the learner's current
  position.
- **Learning pathway updates**: Completed analyses, selections, and
  explanations update the learner's progress along college-defined
  pathways.
- **Six wings** map to the college materials department structure:
  1. Materials Selection & Performance
  2. Ferrous Metallurgy & Process History
  3. Nonferrous Alloys & Heat Treatment
  4. Failure Analysis & Fracture Mechanics
  5. Nanomaterials & Low-Dimensional Systems
  6. Characterization & Measurement

Each skill and Grove record type aligns to one or more wings, so work
products are automatically filed into the correct part of the concept
graph.

## 8. Customization Guide

The materials department is one instantiation of the department template
pattern. To create a department for another engineering domain (ceramics,
polymers, composites, biomaterials, etc.), follow these steps:

### Step 1: Copy the chipset directory

```bash
cp -r examples/chipsets/materials-department examples/chipsets/newdomain-department
```

### Step 2: Rename agents

Edit `chipset.yaml` and replace agent names, roles, and historical figure
references. Select figures whose contributions map to the specialist
roles and whose work teaches domain history.

### Step 3: Replace skills with domain-appropriate content

Swap the six materials skills for domain equivalents. Each skill needs
a domain value, a description, a triggers list, and agent affinity
mapping.

### Step 4: Define new Grove record types

Replace the five `MaterialsX` record types with domain-appropriate types.
The minimum is a diagnostic type, a selection/construct type, a review
type, an explanation type, and a session type.

### Step 5: Map to the target college department

Update the `college` section — set department, wings, and read/write
permissions.

### Step 6: Update evaluation gates

Review the `evaluation.gates` section. Update `benchmark.domains_covered`
for the new subdomain areas.

## 9. Architecture Notes

### Why router topology

The router topology places a single agent (Bessemer) as the entry point
for all queries. Three benefits:

1. **Classification**: Bessemer determines which subdomain(s) a query
   touches before dispatching, preventing wasted work by non-relevant
   agents.
2. **Process-material framing**: Bessemer is specifically chosen as the
   chair because his distinctive insight — that materials availability
   is the shadow of process availability — is the framing that most
   materials questions need before any analysis.
3. **CAPCOM boundary**: The user interacts with exactly one agent,
   reducing cognitive load and providing a consistent communication
   style.

### Why 3 Opus / 4 Sonnet

Model assignment follows the reasoning depth required by each role:

- **Opus agents** (bessemer, ashby, smalley): These roles require
  judgment under ambiguity. Classification and synthesis (Bessemer),
  multi-objective selection (Ashby), and nanomaterials feasibility
  (Smalley) all involve multi-step reasoning where errors compound.
- **Sonnet agents** (cort, merica, gordon, cottrell): These roles are
  more framework-driven. Process history, grade-level recommendations,
  failure-mode identification, and pedagogy all benefit from fast
  turnaround over deep reasoning.

This 3/4 split keeps the token budget practical while preserving quality
where it matters most. It matches the math department's ratio, which is
the reference point.

### Why this team structure

The three teams cover the three most common materials query shapes:

- **Full analysis**: needs every lens (up to 7 agents, parallel) for
  multi-subdomain problems.
- **Design-review workshop**: needs the chair plus selection, failure,
  and pedagogy (4 agents, sequential) for a focused selection.
- **Ongoing practice**: needs the process, grade, and characterization
  specialists (3-4 agents, pipeline) for recurring work.

Teams are not exclusive. Bessemer can assemble ad-hoc groups for queries
that do not fit any pre-composed team.

### CAPCOM boundary

The CAPCOM (Capsule Communicator) pattern means only Bessemer speaks to
the user. Other agents communicate through Bessemer via internal
dispatch. This is enforced by the `is_capcom: true` flag on Bessemer in
`chipset.yaml` — only one agent in the chipset may carry this flag.

## 10. Historical Transparency

The materials department uses historical names for mnemonic and
educational value. The seven chosen figures are historically well-regarded
within materials engineering and do not require the kind of careful
contextualization that attends (for example) Henry Ford in the business
department. A few notes nonetheless:

- **Henry Bessemer** was an inventor-entrepreneur rather than a
  university metallurgist. His process initially had limits (the
  phosphorus problem, solved later by Thomas and Gilchrist) and his
  patent-licensing style was aggressive. The Bessemer agent represents
  the process-change insight, not the business practice.
- **Richard Smalley's** advocacy for nanomaterials was sometimes more
  optimistic than the engineering record has borne out. The Smalley
  agent inherits his technical depth but applies honest feasibility
  checks to applications, as the skill content makes explicit.
- **Henry Cort's** business career ended in financial ruin after a
  partner's misconduct, and his historical reputation was obscured for
  decades. The Cort agent represents the processes he invented rather
  than the business history.

## 11. Relationship to Other Departments

The materials department complements several other departments:

- **Mathematics department** handles the underlying analysis (calculus
  for fracture mechanics, linear algebra for Ashby-chart geometry,
  statistics for characterization data). Materials borrows from it for
  computational backing.
- **Physics department** handles the atomic-scale and solid-state
  foundations (crystallography, band theory, thermodynamics of phase
  diagrams). Materials assumes those foundations and builds on them.
- **Business department** handles cost, supply chain, and strategic
  make-vs-buy decisions on materials procurement. Materials selection
  problems with heavy cost weighting may escalate there.
- **Spatial-computing and electronics departments** share
  characterization techniques and overlap on semiconductor materials.

Future integration could formalize cross-department referrals via a
dispatch protocol so that, for example, a materials-analysis-team could
call out to a physics specialist for a band-structure sub-question
without leaving the materials department's session context.
